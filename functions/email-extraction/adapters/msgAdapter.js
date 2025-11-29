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

    // Try to get content - may be in .content or need retrieval via dataId
    let content = att.content;
    
    if (!content && att.dataId !== undefined) {
      try {
        const retrieved = reader.getAttachment(att.dataId);
        content = retrieved?.content;
      } catch (err) {
        console.warn(`[MsgAdapter] Failed to retrieve attachment ${i} by dataId in ${fileName}:`, err.message);
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

    // Build normalized attachment object
    attachments.push({
      fileName: detectedName || null,  // Let validator handle the fallback
      data: content ? Buffer.from(content) : null,
      size: content?.length || 0,
      mimeType: att.mimeType || att.contentType || null,
      // Preserve index for debugging
      _sourceIndex: i
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
