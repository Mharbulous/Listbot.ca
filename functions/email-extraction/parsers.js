const MsgReader = require('@kenjiuno/msgreader').default;
const { simpleParser } = require('mailparser');

async function parseMsgFile(buffer) {
  const reader = new MsgReader(buffer);
  const data = reader.getFileData();

  const recipients = data.recipients || [];

  // Filter out any undefined/null attachments and process safely
  const rawAttachments = data.attachments || [];
  const processedAttachments = [];

  for (let index = 0; index < rawAttachments.length; index++) {
    const att = rawAttachments[index];
    
    // Skip if attachment entry is null/undefined
    if (!att || typeof att !== 'object') {
      console.warn(`[PARSER-DEBUG] Attachment ${index} is null/undefined or not an object, skipping`);
      continue;
    }

    let content = att.content;
    if (!content && att.dataId !== undefined) {
      try {
        const attachmentData = reader.getAttachment(att.dataId);
        content = attachmentData?.content;
      } catch (err) {
        console.warn(`[PARSER-DEBUG] Failed to get attachment ${index} by dataId:`, err.message);
      }
    }

    // Safely detect fileName with multiple fallbacks
    const detectedFileName = att.fileName || att.name || att.displayName || att.longFilename || null;
    
    if (!detectedFileName) {
      console.warn(`[PARSER-DEBUG] Attachment ${index} has no fileName:`, {
        hasFileName: 'fileName' in att,
        fileNameValue: att.fileName,
        hasName: 'name' in att,
        nameValue: att.name,
        hasDisplayName: 'displayName' in att,
        displayNameValue: att.displayName,
        keys: Object.keys(att)
      });
    }

    // Only add attachments that have actual content
    // Skip empty/placeholder attachments (common in voicemail .msg files)
    if (content && content.length > 0) {
      processedAttachments.push({
        fileName: detectedFileName || `attachment_${index}`,
        data: Buffer.from(content),
        size: content.length,
        mimeType: att.mimeType || 'application/octet-stream'
      });
    } else if (detectedFileName) {
      // Has a filename but no content - still include it but with empty buffer
      console.warn(`[PARSER-DEBUG] Attachment ${index} "${detectedFileName}" has no content`);
      processedAttachments.push({
        fileName: detectedFileName,
        data: Buffer.alloc(0),
        size: 0,
        mimeType: att.mimeType || 'application/octet-stream'
      });
    }
    // If no filename AND no content, skip entirely (likely a malformed entry)
  }

  return {
    subject: data.subject || '(No Subject)',
    from: {
      name: data.senderName || null,
      email: data.senderEmail || data.senderSmtpAddress || ''
    },
    to: recipients.filter(r => r.recipType === 1).map(r => ({
      name: r.name || null,
      email: r.email || r.smtpAddress || ''
    })),
    cc: recipients.filter(r => r.recipType === 2).map(r => ({
      name: r.name || null,
      email: r.email || r.smtpAddress || ''
    })),
    date: data.creationTime ? new Date(data.creationTime)
        : data.messageDeliveryTime ? new Date(data.messageDeliveryTime)
        : new Date(),
    bodyHtml: data.bodyHTML || null,
    bodyText: data.body || '',
    attachments: processedAttachments
  };
}

async function parseEmlFile(buffer) {
  const parsed = await simpleParser(buffer);

  // Filter and safely process attachments
  const rawAttachments = parsed.attachments || [];
  const processedAttachments = [];

  for (let index = 0; index < rawAttachments.length; index++) {
    const att = rawAttachments[index];
    
    if (!att || typeof att !== 'object') {
      console.warn(`[PARSER-DEBUG] EML Attachment ${index} is null/undefined, skipping`);
      continue;
    }

    processedAttachments.push({
      fileName: att.filename || `attachment_${index}`,
      data: att.content || Buffer.alloc(0),
      size: att.size || att.content?.length || 0,
      mimeType: att.contentType || 'application/octet-stream'
    });
  }

  return {
    subject: parsed.subject || '(No Subject)',
    from: {
      name: parsed.from?.value?.[0]?.name || null,
      email: parsed.from?.value?.[0]?.address || ''
    },
    to: (parsed.to?.value || []).map(a => ({ name: a.name || null, email: a.address || '' })),
    cc: (parsed.cc?.value || []).map(a => ({ name: a.name || null, email: a.address || '' })),
    date: parsed.date || new Date(),
    bodyHtml: parsed.html || null,
    bodyText: parsed.text || '',
    attachments: processedAttachments
  };
}

function parseEmail(buffer, fileName) {
  // Defensive check with clear error message
  if (!fileName || typeof fileName !== 'string') {
    console.error('[PARSER-DEBUG] parseEmail called with invalid fileName:', {
      fileName,
      type: typeof fileName
    });
    throw new Error(`Invalid fileName provided to parseEmail: received ${typeof fileName}`);
  }
  
  const ext = fileName.toLowerCase().split('.').pop();
  
  if (ext === 'msg') return parseMsgFile(buffer);
  if (ext === 'eml') return parseEmlFile(buffer);
  
  throw new Error(`Unsupported email format: ${ext} (file: ${fileName})`);
}

function isEmailFile(fileName) {
  // Defensive check - return false for invalid input instead of crashing
  if (!fileName || typeof fileName !== 'string') {
    return false;
  }
  
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'msg' || ext === 'eml';
}

module.exports = { parseEmail, isEmailFile };
