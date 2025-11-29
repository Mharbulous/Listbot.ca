const admin = require('firebase-admin');
const blake3 = require('blake3');
const { parseEmail, isEmailFile } = require('./parsers');
const { MAX_FILE_SIZE, MAX_DEPTH, MAX_BODY_PREVIEW, MAX_BODY_SIZE, PARSE_STATUS } = require('./constants');

const db = admin.firestore();
const storage = admin.storage();

function hashBlake3(data) {
  const hasher = blake3.createHash();
  hasher.update(data);
  return hasher.digest('hex');
}

/**
 * Safely get file extension from a filename
 * Returns empty string if no valid extension found
 */
function safeGetExtension(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  const parts = fileName.split('.');
  if (parts.length < 2) {
    return '';
  }
  return parts.pop().toLowerCase();
}

/**
 * Detect file type from filename extension
 */
function detectFileType(fileName) {
  const ext = safeGetExtension(fileName);
  if (!ext) return 'other';
  
  const map = {
    pdf: 'pdf', 
    jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', bmp: 'image', webp: 'image',
    doc: 'word', docx: 'word',
    xls: 'excel', xlsx: 'excel',
    msg: 'email', eml: 'email',
    txt: 'text', rtf: 'text',
    mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio',
    mp4: 'video', mov: 'video', avi: 'video',
    zip: 'archive', rar: 'archive', '7z': 'archive'
  };
  return map[ext] || 'other';
}

// Claim processing lock via transaction
async function claimLock(fileHash, firmId, matterId) {
  const ref = db.collection('firms').doc(firmId).collection('matters').doc(matterId).collection('evidence').doc(fileHash);

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) return { success: false, reason: 'not found' };

    const data = doc.data();
    if (data.hasEmailAttachments === false) return { success: false, reason: 'already processed' };
    if (data.parseStatus === PARSE_STATUS.PROCESSING) return { success: false, reason: 'already processing' };

    tx.update(ref, { parseStatus: PARSE_STATUS.PROCESSING });
    return { success: true, data };
  });
}

// Main extraction function
async function processEmailFile(fileHash, uploadData) {
  // Destructure with defensive defaults
  const { 
    firmId, 
    userId, 
    matterId, 
    sourceFileName, 
    storagePath, 
    nestingDepth = 0 
  } = uploadData || {};

  // Validate required fields
  if (!firmId || !matterId || !fileHash) {
    throw new Error(`Missing required fields: firmId=${firmId}, matterId=${matterId}, fileHash=${fileHash}`);
  }

  // Ensure sourceFileName is valid, with fallback based on storagePath or generic
  let safeSourceFileName = sourceFileName;
  if (!safeSourceFileName || typeof safeSourceFileName !== 'string') {
    // Try to extract from storagePath
    if (storagePath && typeof storagePath === 'string') {
      const pathParts = storagePath.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      // storagePath might be like "firms/x/matters/y/uploads/hash.msg"
      if (lastPart && lastPart.includes('.')) {
        safeSourceFileName = lastPart;
      }
    }
    // Final fallback
    if (!safeSourceFileName) {
      safeSourceFileName = 'unknown.msg';
    }
    console.warn(`[EXTRACT-DEBUG] sourceFileName was invalid, using fallback: "${safeSourceFileName}"`);
  }

  const ref = db.collection('firms').doc(firmId).collection('matters').doc(matterId).collection('evidence').doc(fileHash);

  try {
    if (nestingDepth >= MAX_DEPTH) {
      throw new Error(`Exceeded max nesting depth of ${MAX_DEPTH}`);
    }

    const lock = await claimLock(fileHash, firmId, matterId);
    if (!lock.success) {
      console.log(`Skipping ${fileHash}: ${lock.reason}`);
      return { success: false, reason: lock.reason };
    }

    // Download and parse
    const bucket = storage.bucket();
    
    if (!storagePath) {
      throw new Error('Missing storagePath in upload data');
    }
    
    const [buffer] = await bucket.file(storagePath).download();

    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error('File exceeds 100MB limit');
    }

    console.log(`[EXTRACT-DEBUG] Parsing email: ${safeSourceFileName} (${buffer.length} bytes)`);
    const parsed = await parseEmail(buffer, safeSourceFileName);
    console.log(`[EXTRACT-DEBUG] Parsed successfully. Found ${parsed.attachments?.length || 0} attachments`);

    // Process attachments
    const attachmentResults = [];
    const attachmentHashes = [];
    const attachments = parsed.attachments || [];

    for (let i = 0; i < attachments.length; i++) {
      const att = attachments[i];
      
      // Skip malformed attachments
      if (!att || typeof att !== 'object') {
        console.warn(`[EXTRACT-DEBUG] Skipping malformed attachment at index ${i}`);
        continue;
      }

      // Ensure fileName is valid
      const safeFileName = att.fileName || `attachment_${i}`;
      
      // Ensure data is a Buffer
      const attData = Buffer.isBuffer(att.data) ? att.data : Buffer.alloc(0);
      const attSize = attData.length;

      if (attSize > MAX_FILE_SIZE) {
        throw new Error(`Attachment "${safeFileName}" exceeds 100MB limit`);
      }

      // Skip empty attachments (no point storing them)
      if (attSize === 0) {
        console.warn(`[EXTRACT-DEBUG] Skipping empty attachment: ${safeFileName}`);
        continue;
      }

      const attHash = hashBlake3(attData);
      attachmentHashes.push(attHash);
      const isNested = isEmailFile(safeFileName);

      // Check for duplicate in evidence collection
      const evidenceRef = db.collection('firms').doc(firmId).collection('matters').doc(matterId).collection('evidence');
      const existing = await evidenceRef.doc(attHash).get();
      const isDuplicate = existing.exists;

      if (!isDuplicate) {
        // Upload to storage (with file extension to match client upload pattern)
        const attExtension = safeGetExtension(safeFileName) || 'bin';
        const attPath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}.${attExtension}`;
        await bucket.file(attPath).save(attData);

        // Create evidence document for attachment
        await evidenceRef.doc(attHash).set({
          // Identity fields
          firmId,
          userId,
          matterId,

          // Source file properties
          sourceFileName: safeFileName,
          fileSize: attSize,
          fileType: detectFileType(safeFileName),
          storagePath: attPath,
          uploadDate: admin.firestore.FieldValue.serverTimestamp(),

          // Processing status
          isProcessed: false,
          hasAllPages: null,
          processingStage: 'uploaded',

          // Tag counters
          tagCount: 0,
          autoApprovedCount: 0,
          reviewRequiredCount: 0,

          // Embedded structures
          tags: {},
          sourceMetadata: {},
          sourceMetadataVariants: {},

          // Email extraction fields
          hasEmailAttachments: isNested ? true : null,
          parseStatus: isNested ? PARSE_STATUS.PENDING : null,
          parseError: null,
          parsedAt: null,
          retryCount: 0,
          extractedMessageId: null,
          extractedAttachmentHashes: [],

          // Track lineage
          isEmailAttachment: true,
          extractedFromEmails: [fileHash],
          nestingDepth: nestingDepth + 1
        });
      } else {
        // Update existing with additional source
        await evidenceRef.doc(attHash).update({
          extractedFromEmails: admin.firestore.FieldValue.arrayUnion(fileHash)
        });
      }

      attachmentResults.push({
        fileHash: attHash,
        fileName: safeFileName,
        size: attSize,
        mimeType: att.mimeType || 'application/octet-stream',
        isDuplicate
      });
    }

    // Save email message to matter-scoped collection
    const messageRef = db.collection('firms').doc(firmId).collection('matters').doc(matterId).collection('emails').doc();
    const messageId = messageRef.id;

    // Save bodies to storage (organized by matter for better data organization)
    let bodyText = parsed.bodyText || '';
    if (bodyText.length > MAX_BODY_SIZE) {
      bodyText = bodyText.substring(0, MAX_BODY_SIZE) + '\n\n[Truncated]';
    }

    const bodyTextPath = `firms/${firmId}/matters/${matterId}/emails/${messageId}/body.txt`;
    await bucket.file(bodyTextPath).save(Buffer.from(bodyText, 'utf-8'));

    let bodyHtmlPath = null;
    if (parsed.bodyHtml) {
      let html = parsed.bodyHtml;
      if (html.length > MAX_BODY_SIZE) {
        html = html.substring(0, MAX_BODY_SIZE);
      }
      bodyHtmlPath = `firms/${firmId}/matters/${matterId}/emails/${messageId}/body.html`;
      await bucket.file(bodyHtmlPath).save(Buffer.from(html, 'utf-8'));
    }

    await messageRef.set({
      id: messageId,
      firmId,
      userId,
      matterId,
      sourceFileHash: fileHash,
      extractedAt: admin.firestore.FieldValue.serverTimestamp(),

      subject: parsed.subject || '(No Subject)',
      from: parsed.from || { name: null, email: '' },
      to: parsed.to || [],
      cc: parsed.cc || [],
      date: parsed.date ? admin.firestore.Timestamp.fromDate(parsed.date) : admin.firestore.Timestamp.now(),

      bodyTextPath,
      bodyHtmlPath,
      bodyPreview: (parsed.bodyText || '').replace(/\s+/g, ' ').trim().substring(0, MAX_BODY_PREVIEW),

      hasAttachments: attachmentResults.length > 0,
      attachmentCount: attachmentResults.length,
      attachments: attachmentResults,

      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Mark complete
    await ref.update({
      hasEmailAttachments: false,
      parseStatus: PARSE_STATUS.COMPLETED,
      parseError: null,
      parsedAt: admin.firestore.FieldValue.serverTimestamp(),
      extractedMessageId: messageId,
      extractedAttachmentHashes: attachmentHashes
    });

    console.log(`Extracted ${fileHash}: ${attachmentResults.length} attachments`);
    return { success: true, messageId };

  } catch (error) {
    console.error(`Extraction failed for ${fileHash}:`, error);

    await ref.update({
      parseStatus: PARSE_STATUS.FAILED,
      parseError: error.message,
      retryCount: admin.firestore.FieldValue.increment(1)
    });

    throw error;
  }
}

module.exports = { processEmailFile };
