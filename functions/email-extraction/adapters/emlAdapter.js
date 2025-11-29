/**
 * EML File Adapter
 * 
 * Isolates the mailparser library.
 * Returns a normalized raw object for validation.
 */

const { simpleParser } = require('mailparser');
const { ParseError } = require('./errors');

/**
 * Parse a .eml file buffer into a raw email object
 * 
 * @param {Buffer} buffer - The .eml file content
 * @param {string} fileName - Original filename (for error context)
 * @returns {Object} Raw parsed data (not yet validated)
 */
async function parseEmlBuffer(buffer, fileName) {
  let parsed;

  try {
    parsed = await simpleParser(buffer);
  } catch (err) {
    throw new ParseError(`Failed to parse EML file: ${err.message}`, {
      fileName,
      format: 'eml',
      parserError: err.message
    });
  }

  if (!parsed) {
    throw new ParseError('EML parser returned empty data', {
      fileName,
      format: 'eml'
    });
  }

  // Extract sender
  const fromValue = parsed.from?.value?.[0];
  const from = {
    name: fromValue?.name || null,
    email: fromValue?.address || ''
  };

  // Extract recipients
  const toRecipients = (parsed.to?.value || []).map(addr => ({
    name: addr.name || null,
    email: addr.address || ''
  }));

  const ccRecipients = (parsed.cc?.value || []).map(addr => ({
    name: addr.name || null,
    email: addr.address || ''
  }));

  // Extract attachments
  const rawAttachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
  const attachments = rawAttachments.map((att, i) => {
    if (!att) return null;

    return {
      fileName: att.filename || null,
      data: att.content || null,
      size: att.size || att.content?.length || 0,
      mimeType: att.contentType || null,
      _sourceIndex: i
    };
  }).filter(Boolean);

  // Return raw object - validator will normalize
  return {
    subject: parsed.subject || null,
    from: from,
    to: toRecipients,
    cc: ccRecipients,
    date: parsed.date || null,
    bodyText: parsed.text || '',
    bodyHtml: parsed.html || null,
    attachments: attachments
  };
}

module.exports = { parseEmlBuffer };
