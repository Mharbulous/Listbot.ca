const MsgReader = require('@kenjiuno/msgreader').default;
const { simpleParser } = require('mailparser');

async function parseMsgFile(buffer) {
  const reader = new MsgReader(buffer);
  const data = reader.getFileData();

  const recipients = data.recipients || [];

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
    attachments: (data.attachments || []).map(att => {
      let content = att.content;
      if (!content && att.dataId !== undefined) {
        content = reader.getAttachment(att.dataId).content;
      }
      return {
        fileName: att.fileName || att.name || 'unnamed',
        data: content ? Buffer.from(content) : Buffer.alloc(0),
        size: content?.length || 0,
        mimeType: att.mimeType || 'application/octet-stream'
      };
    })
  };
}

async function parseEmlFile(buffer) {
  const parsed = await simpleParser(buffer);

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
    attachments: (parsed.attachments || []).map(att => ({
      fileName: att.filename || 'unnamed',
      data: att.content,
      size: att.size || att.content?.length || 0,
      mimeType: att.contentType || 'application/octet-stream'
    }))
  };
}

function parseEmail(buffer, fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'msg') return parseMsgFile(buffer);
  if (ext === 'eml') return parseEmlFile(buffer);
  throw new Error(`Unsupported format: ${ext}`);
}

function isEmailFile(fileName) {
  if (!fileName || typeof fileName !== 'string') return false;
  const ext = fileName.toLowerCase().split('.').pop();
  return ext === 'msg' || ext === 'eml';
}

module.exports = { parseEmail, isEmailFile };
