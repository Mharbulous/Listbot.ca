/**
 * MSG File Adapter
 * 
 * Isolates the @kenjiuno/msgreader library.
 * All quirks and edge cases of that library are handled HERE.
 * Returns a normalized raw object for validation.
 */

const MsgReader = require('@kenjiuno/msgreader').default;
const { ParseError } = require('./errors');

/**
 * Parse a .msg file buffer into a raw email object
 * 
 * This function handles all msgreader-specific quirks:
 * - Missing fields
 * - Alternative field names
 * - Attachment content retrieval via dataId
 * - Malformed attachment entries
 * - Embedded MSG attachments (innerMsgContent)
 * 
 * @param {Buffer} buffer - The .msg file content
 * @param {string} fileName - Original filename (for error context)
 * @returns {Object} Raw parsed data (not yet validated)
 */
function parseMsgBuffer(buffer, fileName) {
  let reader;
  let data;

  try {
    reader = new MsgReader(buffer);
    data = reader.getFileData();
  } catch (err) {
    throw new ParseError(`Failed to parse MSG file: ${err.message}`, {
      fileName,
      format: 'msg',
      parserError: err.message
    });
  }

  if (!data) {
    throw new ParseError('MSG parser returned empty data', {
      fileName,
      format: 'msg'
    });
  }

  // Extract sender - msgreader has multiple possible fields
  const senderEmail = data.senderEmail 
    || data.senderSmtpAddress 
    || data.headers?.from 
    || '';

  // Extract recipients - filter by recipType
  const recipients = Array.isArray(data.recipients) ? data.recipients : [];
  
  const toRecipients = recipients
    .filter(r => r && r.recipType === 1)
    .map(r => ({
      name: r.name || null,
      email: r.email || r.smtpAddress || ''
    }));

  const ccRecipients = recipients
    .filter(r => r && r.recipType === 2)
    .map(r => ({
      name: r.name || null,
      email: r.email || r.smtpAddress || ''
    }));

  // Extract date - multiple possible sources
  let date = null;
  if (data.creationTime) {
    date = new Date(data.creationTime);
  } else if (data.messageDeliveryTime) {
    date = new Date(data.messageDeliveryTime);
  } else if (data.clientSubmitTime) {
    date = new Date(data.clientSubmitTime);
  }

  // Extract attachments - this is where most quirks live
  const rawAttachments = Array.isArray(data.attachments) ? data.attachments : [];
  const attachments = [];

  for (let i = 0; i < rawAttachments.length; i++) {
    const att = rawAttachments[i];
    
    // Skip null/undefined entries (yes, msgreader can return these)
    if (!att) {
      console.warn(`[MsgAdapter] Attachment ${i} is null/undefined in ${fileName}`);
      continue;
    }

    // Skip non-object entries
    if (typeof att !== 'object') {
      console.warn(`[MsgAdapter] Attachment ${i} is not an object in ${fileName}:`, typeof att);
      continue;
    }

    // Debug: Log all attachment properties to understand structure
    // Create a safe version of the attachment for logging (avoiding binary data)
    const safeAttForLog = {};
    for (const key of Object.keys(att)) {
      const val = att[key];
      if (val instanceof Uint8Array || Buffer.isBuffer(val)) {
        safeAttForLog[key] = `[Binary: ${val.length} bytes]`;
      } else if (typeof val === 'object' && val !== null) {
        safeAttForLog[key] = `[Object with keys: ${Object.keys(val).join(', ')}]`;
      } else {
        safeAttForLog[key] = val;
      }
    }
    console.log(`[MsgAdapter] Attachment ${i} in ${fileName}:`, JSON.stringify(safeAttForLog));

    // Try multiple methods to get attachment content
    let content = null;

    // Method 1: Check if content is directly on the attachment object
    if (att.content) {
      content = att.content;
      console.log(`[MsgAdapter] Got content directly from attachment ${i} in ${fileName}`);
    }
    
    // Method 2: Try getAttachment with the attachment object itself
    if (!content) {
      try {
        const retrieved = reader.getAttachment(att);
        if (retrieved?.content) {
          content = retrieved.content;
          console.log(`[MsgAdapter] Got content via getAttachment(att) for ${i} in ${fileName}`);
        }
      } catch (err) {
        console.warn(`[MsgAdapter] getAttachment(att) failed for ${i} in ${fileName}:`, err.message);
      }
    }
    
    // Method 3: Try getAttachment with dataId (index-based)
    if (!content && att.dataId !== undefined) {
      try {
        const retrieved = reader.getAttachment(att.dataId);
        if (retrieved?.content) {
          content = retrieved.content;
          console.log(`[MsgAdapter] Got content via getAttachment(dataId=${att.dataId}) for ${i} in ${fileName}`);
        }
      } catch (err) {
        console.warn(`[MsgAdapter] getAttachment(dataId) failed for ${i} in ${fileName}:`, err.message);
      }
    }

    // Method 4: Try getAttachment with index
    if (!content) {
      try {
        const retrieved = reader.getAttachment(i);
        if (retrieved?.content) {
          content = retrieved.content;
          console.log(`[MsgAdapter] Got content via getAttachment(index=${i}) for ${i} in ${fileName}`);
        }
      } catch (err) {
        console.warn(`[MsgAdapter] getAttachment(index) failed for ${i} in ${fileName}:`, err.message);
      }
    }

    // Try multiple possible filename fields
    // msgreader uses different fields depending on the .msg structure
    const possibleNames = [
      att.fileName,
      att.name,
      att.displayName,
      att.longFilename,
      att.shortFilename
    ];
    
    const detectedName = possibleNames.find(n => typeof n === 'string' && n.trim());

    // Log warning if we couldn't get content
    if (!content) {
      console.warn(`[MsgAdapter] Could not extract content for attachment ${i} "${detectedName || 'unnamed'}" in ${fileName}`);
      console.warn(`[MsgAdapter] Attachment ${i} full object:`, JSON.stringify(att, (key, value) => {
        // Don't stringify large binary data
        if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
          return `[Binary data: ${value.length} bytes]`;
        }
        return value;
      }, 2));
    }

    // Build normalized attachment object
    // Include attachment even without content - let orchestrator decide what to do
    attachments.push({
      fileName: detectedName || null,  // Let validator handle the fallback
      data: content ? Buffer.from(content) : null,
      size: content?.length || att.contentLength || 0,
      mimeType: att.mimeType || att.contentType || att.attachMimeTag || null,
      // Preserve metadata for debugging
      _sourceIndex: i,
      _hadContent: !!content,
      _reportedSize: att.contentLength
    });
  }

  // Return raw object - validator will normalize everything
  return {
    subject: data.subject || null,
    from: {
      name: data.senderName || null,
      email: senderEmail
    },
    to: toRecipients,
    cc: ccRecipients,
    date: date,
    bodyText: data.body || '',
    bodyHtml: data.bodyHTML || null,
    attachments: attachments
  };
}

module.exports = { parseMsgBuffer };
