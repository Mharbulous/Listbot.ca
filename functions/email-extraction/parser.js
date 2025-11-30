/**
 * Email Parser
 * 
 * Single entry point for parsing email files.
 * Combines parsing (via adapters) and validation (via schema) into one step.
 * 
 * After calling parseEmailFile(), you are GUARANTEED to have valid data.
 */

const { parseMsgBuffer } = require('./adapters/msgAdapter');
const { parseEmlBuffer } = require('./adapters/emlAdapter');
const { validateParsedEmail } = require('./schema');
const { ParseError, ValidationError } = require('./errors');

/**
 * Get file extension from filename
 * @param {string} fileName 
 * @returns {string|null} Lowercase extension or null
 */
function getExtension(fileName) {
  if (typeof fileName !== 'string') return null;
  
  const parts = fileName.split('.');
  if (parts.length < 2) return null;
  
  return parts.pop().toLowerCase();
}

/**
 * Check if a filename represents an email file
 * @param {string} fileName 
 * @returns {boolean}
 */
function isEmailFile(fileName) {
  const ext = getExtension(fileName);
  return ext === 'msg' || ext === 'eml';
}

/**
 * Parse an email file and return validated data
 * 
 * This is the ONLY function external code should call.
 * It handles:
 * 1. Format detection
 * 2. Parsing via appropriate adapter
 * 3. Validation and normalization
 * 
 * @param {Buffer} buffer - File content
 * @param {string} fileName - Original filename (used for format detection and error context)
 * @returns {Promise<ParsedEmail>} Validated email object
 * @throws {ValidationError} If fileName is invalid
 * @throws {ParseError} If file format is unsupported or parsing fails
 */
async function parseEmailFile(buffer, fileName) {
  // Validate inputs
  if (!Buffer.isBuffer(buffer)) {
    throw new ValidationError('Buffer is required', {
      field: 'buffer',
      receivedValue: typeof buffer,
      expectedType: 'Buffer'
    });
  }

  if (typeof fileName !== 'string' || !fileName.trim()) {
    throw new ValidationError('Valid fileName is required', {
      field: 'fileName',
      receivedValue: fileName,
      expectedType: 'non-empty string'
    });
  }

  const ext = getExtension(fileName);
  
  if (!ext) {
    throw new ParseError(`Cannot determine file format: no extension in "${fileName}"`, {
      fileName,
      format: null
    });
  }

  // Parse using appropriate adapter
  let rawParsed;
  
  if (ext === 'msg') {
    rawParsed = parseMsgBuffer(buffer, fileName);
  } else if (ext === 'eml') {
    rawParsed = await parseEmlBuffer(buffer, fileName);
  } else {
    throw new ParseError(`Unsupported email format: .${ext}`, {
      fileName,
      format: ext
    });
  }

  // Validate and normalize
  // After this, everything is guaranteed valid
  const validated = validateParsedEmail(rawParsed, fileName);
  
  return validated;
}

module.exports = {
  parseEmailFile,
  isEmailFile,
  getExtension
};
