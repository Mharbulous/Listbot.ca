/**
 * Email Schema & Validation
 * 
 * This is the SINGLE SOURCE OF TRUTH for what a parsed email looks like.
 * After validation, all downstream code can trust these shapes.
 */

const { ValidationError } = require('./errors');

/**
 * Shape of a validated email address
 * @typedef {Object} EmailAddress
 * @property {string|null} name - Display name (can be null)
 * @property {string} email - Email address (guaranteed non-empty string)
 */

/**
 * Shape of a validated attachment
 * @typedef {Object} Attachment
 * @property {string} fileName - File name (guaranteed non-empty)
 * @property {Buffer} data - File content (guaranteed to be a Buffer, may be empty)
 * @property {number} size - Size in bytes (guaranteed >= 0)
 * @property {string} mimeType - MIME type (guaranteed non-empty)
 */

/**
 * Shape of a validated parsed email
 * @typedef {Object} ParsedEmail
 * @property {string} subject - Subject line (guaranteed non-empty, defaults to '(No Subject)')
 * @property {EmailAddress} from - Sender
 * @property {EmailAddress[]} to - Recipients
 * @property {EmailAddress[]} cc - CC recipients
 * @property {Date} date - Email date (guaranteed to be a valid Date)
 * @property {string} bodyText - Plain text body (guaranteed string, may be empty)
 * @property {string|null} bodyHtml - HTML body (null if not present)
 * @property {Attachment[]} attachments - Attachments (guaranteed array, may be empty)
 */

/**
 * Validates and normalizes a raw email address object
 */
function validateEmailAddress(raw, fieldName, required = false) {
  // Handle null/undefined
  if (raw == null) {
    if (required) {
      throw new ValidationError(`Missing required field: ${fieldName}`, {
        field: fieldName,
        receivedValue: raw,
        expectedType: 'EmailAddress'
      });
    }
    return { name: null, email: '' };
  }

  // Handle string input (just an email)
  if (typeof raw === 'string') {
    return { name: null, email: raw.trim() };
  }

  // Handle object input
  if (typeof raw === 'object') {
    return {
      name: typeof raw.name === 'string' ? raw.name.trim() || null : null,
      email: typeof raw.email === 'string' ? raw.email.trim() : ''
    };
  }

  // Invalid type
  throw new ValidationError(`Invalid ${fieldName}: expected object or string`, {
    field: fieldName,
    receivedValue: raw,
    expectedType: 'EmailAddress'
  });
}

/**
 * Validates and normalizes a raw email address array
 */
function validateEmailAddressArray(raw, fieldName) {
  if (!Array.isArray(raw)) {
    return [];
  }
  
  return raw
    .map((item, index) => {
      try {
        return validateEmailAddress(item, `${fieldName}[${index}]`);
      } catch (e) {
        // Skip invalid entries in arrays rather than failing entirely
        console.warn(`Skipping invalid ${fieldName}[${index}]:`, e.message);
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Validates and normalizes a raw attachment object
 */
function validateAttachment(raw, index, sourceFileName) {
  // Must be an object
  if (!raw || typeof raw !== 'object') {
    throw new ValidationError(`Attachment ${index} is not an object`, {
      field: `attachments[${index}]`,
      receivedValue: raw,
      expectedType: 'object',
      fileName: sourceFileName
    });
  }

  // fileName: must be a non-empty string
  let fileName = raw.fileName;
  if (typeof fileName !== 'string' || fileName.trim() === '') {
    fileName = `attachment_${index}`;
  } else {
    fileName = fileName.trim();
  }

  // data: must be a Buffer
  let data;
  if (Buffer.isBuffer(raw.data)) {
    data = raw.data;
  } else if (raw.data instanceof Uint8Array) {
    data = Buffer.from(raw.data);
  } else if (raw.data == null) {
    data = Buffer.alloc(0);
  } else {
    throw new ValidationError(`Attachment ${index} data is not a Buffer`, {
      field: `attachments[${index}].data`,
      receivedValue: typeof raw.data,
      expectedType: 'Buffer',
      fileName: sourceFileName
    });
  }

  // size: derive from data if not provided
  const size = typeof raw.size === 'number' ? raw.size : data.length;

  // mimeType: default to octet-stream
  const mimeType = typeof raw.mimeType === 'string' && raw.mimeType.trim() 
    ? raw.mimeType.trim() 
    : 'application/octet-stream';

  return { fileName, data, size, mimeType };
}

/**
 * Validates and normalizes a complete parsed email
 * 
 * This is the ONLY place where we handle malformed data.
 * After this function returns, everything is guaranteed valid.
 * 
 * @param {Object} raw - Raw parsed data from email library
 * @param {string} sourceFileName - Original file name (for error context)
 * @returns {ParsedEmail} - Validated and normalized email object
 */
function validateParsedEmail(raw, sourceFileName) {
  if (!raw || typeof raw !== 'object') {
    throw new ValidationError('Parsed email is not an object', {
      receivedValue: raw,
      expectedType: 'object',
      fileName: sourceFileName
    });
  }

  // Subject: default to '(No Subject)'
  const subject = typeof raw.subject === 'string' && raw.subject.trim()
    ? raw.subject.trim()
    : '(No Subject)';

  // From: required but with fallback
  const from = validateEmailAddress(raw.from, 'from');

  // To/CC: arrays with fallback to empty
  const to = validateEmailAddressArray(raw.to, 'to');
  const cc = validateEmailAddressArray(raw.cc, 'cc');

  // Date: must be valid Date, default to now
  let date;
  if (raw.date instanceof Date && !isNaN(raw.date.getTime())) {
    date = raw.date;
  } else if (typeof raw.date === 'string' || typeof raw.date === 'number') {
    const parsed = new Date(raw.date);
    date = isNaN(parsed.getTime()) ? new Date() : parsed;
  } else {
    date = new Date();
  }

  // Body text: must be string
  const bodyText = typeof raw.bodyText === 'string' ? raw.bodyText : '';

  // Body HTML: string or null
  const bodyHtml = typeof raw.bodyHtml === 'string' && raw.bodyHtml.trim()
    ? raw.bodyHtml
    : null;

  // Attachments: validate each one, skip invalid ones
  const attachments = [];
  const rawAttachments = Array.isArray(raw.attachments) ? raw.attachments : [];
  
  for (let i = 0; i < rawAttachments.length; i++) {
    try {
      const validated = validateAttachment(rawAttachments[i], i, sourceFileName);
      attachments.push(validated);
    } catch (e) {
      // Log but don't fail - skip malformed attachments
      console.warn(`[Validation] Skipping attachment ${i} in ${sourceFileName}:`, e.message);
    }
  }

  return {
    subject,
    from,
    to,
    cc,
    date,
    bodyText,
    bodyHtml,
    attachments
  };
}

module.exports = {
  validateParsedEmail,
  validateEmailAddress,
  validateAttachment
};
