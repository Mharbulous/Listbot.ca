/**
 * Email Extraction Operations
 * 
 * Small, focused functions that each do ONE thing.
 * These are the building blocks the orchestrator uses.
 * Each function has clear inputs and outputs.
 */

const admin = require('firebase-admin');
const blake3 = require('blake3');
const { StorageError, LockError } = require('./errors');
const { PARSE_STATUS, MAX_FILE_SIZE, MAX_BODY_SIZE, MAX_BODY_PREVIEW } = require('./constants');

/**
 * Compute BLAKE3 hash of data (128-bit output to match frontend)
 * @param {Buffer} data
 * @returns {string} Hex hash (32 characters)
 */
function computeHash(data) {
  const hasher = blake3.createHash();
  hasher.update(data);
  // Use 128-bit output (16 bytes) to match frontend fileHashWorker.js
  return hasher.digest('hex', { length: 16 });
}

/**
 * Get file extension safely
 * @param {string} fileName 
 * @returns {string} Extension or 'bin' as fallback
 */
function getExtension(fileName) {
  if (typeof fileName !== 'string') return 'bin';
  const parts = fileName.split('.');
  if (parts.length < 2) return 'bin';
  return parts.pop().toLowerCase();
}

/**
 * Detect file type category from filename
 * @param {string} fileName 
 * @returns {string} Type category
 */
function detectFileType(fileName) {
  const ext = getExtension(fileName);
  
  const typeMap = {
    // Documents
    pdf: 'pdf',
    doc: 'word', docx: 'word',
    xls: 'excel', xlsx: 'excel',
    ppt: 'powerpoint', pptx: 'powerpoint',
    txt: 'text', rtf: 'text',
    
    // Images
    jpg: 'image', jpeg: 'image', png: 'image', 
    gif: 'image', bmp: 'image', webp: 'image', tiff: 'image',
    
    // Email
    msg: 'email', eml: 'email',
    
    // Media
    mp3: 'audio', wav: 'audio', m4a: 'audio', ogg: 'audio',
    mp4: 'video', mov: 'video', avi: 'video', mkv: 'video',
    
    // Archives
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive'
  };
  
  return typeMap[ext] || 'other';
}

/**
 * Download a file from Cloud Storage
 * @param {Object} bucket - Storage bucket
 * @param {string} path - File path
 * @param {string} fileHash - For error context
 * @returns {Promise<Buffer>}
 */
async function downloadFile(bucket, path, fileHash) {
  try {
    const [buffer] = await bucket.file(path).download();
    return buffer;
  } catch (err) {
    throw new StorageError(`Failed to download file: ${err.message}`, {
      operation: 'download',
      path: path,
      fileHash: fileHash
    });
  }
}

/**
 * Upload data to Cloud Storage
 * @param {Object} bucket - Storage bucket
 * @param {string} path - Destination path
 * @param {Buffer} data - Data to upload
 */
async function uploadFile(bucket, path, data) {
  try {
    await bucket.file(path).save(data);
  } catch (err) {
    throw new StorageError(`Failed to upload file: ${err.message}`, {
      operation: 'upload',
      path: path
    });
  }
}

/**
 * Acquire processing lock via Firestore transaction
 * @param {Object} db - Firestore instance
 * @param {string} firmId 
 * @param {string} matterId 
 * @param {string} fileHash 
 * @returns {Promise<{acquired: boolean, reason?: string, data?: Object}>}
 */
async function acquireLock(db, firmId, matterId, fileHash) {
  const ref = db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(fileHash);

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    
    if (!doc.exists) {
      return { acquired: false, reason: 'document_not_found' };
    }

    const data = doc.data();
    
    // Already processed
    if (data.hasEmailAttachments === false) {
      return { acquired: false, reason: 'already_processed' };
    }
    
    // Currently being processed
    if (data.parseStatus === PARSE_STATUS.PROCESSING) {
      return { acquired: false, reason: 'already_processing' };
    }

    // Acquire lock
    tx.update(ref, { parseStatus: PARSE_STATUS.PROCESSING });
    
    return { acquired: true, data: data };
  });
}

/**
 * Check if an attachment already exists in evidence collection
 * @param {Object} db - Firestore instance
 * @param {string} firmId 
 * @param {string} matterId 
 * @param {string} attachmentHash 
 * @returns {Promise<boolean>}
 */
async function attachmentExists(db, firmId, matterId, attachmentHash) {
  const doc = await db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(attachmentHash)
    .get();
    
  return doc.exists;
}

/**
 * Create evidence document for an extracted attachment
 * @param {Object} db - Firestore instance
 * @param {Object} params - All required parameters
 */
async function createAttachmentEvidence(db, params) {
  const {
    firmId, userId, matterId,
    attachmentHash, fileName, fileSize, storagePath,
    isNestedEmail, parentFileHash, nestingDepth
  } = params;

  const ref = db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(attachmentHash);

  await ref.set({
    // Identity
    firmId,
    userId,
    matterId,

    // File info
    sourceFileName: fileName,
    fileSize: fileSize,
    fileType: detectFileType(fileName),
    storagePath: storagePath,
    uploadDate: admin.firestore.FieldValue.serverTimestamp(),

    // Processing status
    isProcessed: false,
    hasAllPages: null,
    processingStage: 'uploaded',

    // Tags
    tagCount: 0,
    autoApprovedCount: 0,
    reviewRequiredCount: 0,
    tags: {},

    // Metadata
    sourceMetadata: {},
    sourceMetadataVariants: {},

    // Email extraction (for nested emails)
    hasEmailAttachments: isNestedEmail ? true : null,
    parseStatus: isNestedEmail ? PARSE_STATUS.PENDING : null,
    parseError: null,
    parsedAt: null,
    retryCount: 0,
    extractedMessageId: null,
    extractedAttachmentHashes: [],

    // Lineage
    isEmailAttachment: true,
    extractedFromEmails: [parentFileHash],
    nestingDepth: nestingDepth
  });
}

/**
 * Update existing attachment with additional parent reference
 * @param {Object} db - Firestore instance
 * @param {string} firmId 
 * @param {string} matterId 
 * @param {string} attachmentHash 
 * @param {string} parentFileHash 
 */
async function addParentReference(db, firmId, matterId, attachmentHash, parentFileHash) {
  const ref = db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(attachmentHash);

  await ref.update({
    extractedFromEmails: admin.firestore.FieldValue.arrayUnion(parentFileHash)
  });
}

/**
 * Save email body files to storage
 * @param {Object} bucket - Storage bucket
 * @param {string} firmId 
 * @param {string} matterId 
 * @param {string} messageId 
 * @param {string} bodyText 
 * @param {string|null} bodyHtml 
 * @returns {Promise<{textPath: string, htmlPath: string|null}>}
 */
async function saveEmailBodies(bucket, firmId, matterId, messageId, bodyText, bodyHtml) {
  const basePath = `firms/${firmId}/matters/${matterId}/emails/${messageId}`;
  
  // Truncate if needed
  let text = bodyText || '';
  if (text.length > MAX_BODY_SIZE) {
    text = text.substring(0, MAX_BODY_SIZE) + '\n\n[Truncated]';
  }
  
  const textPath = `${basePath}/body.txt`;
  await uploadFile(bucket, textPath, Buffer.from(text, 'utf-8'));

  let htmlPath = null;
  if (bodyHtml) {
    let html = bodyHtml;
    if (html.length > MAX_BODY_SIZE) {
      html = html.substring(0, MAX_BODY_SIZE);
    }
    htmlPath = `${basePath}/body.html`;
    await uploadFile(bucket, htmlPath, Buffer.from(html, 'utf-8'));
  }

  return { textPath, htmlPath };
}

/**
 * Create email document in Firestore
 * @param {Object} db - Firestore instance
 * @param {Object} params - All email data
 * @returns {Promise<string>} Message ID
 */
async function createEmailDocument(db, params) {
  const {
    firmId, userId, matterId, sourceFileHash,
    email, attachmentResults, bodyTextPath, bodyHtmlPath
  } = params;

  const ref = db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('emails').doc();
    
  const messageId = ref.id;

  // Create preview
  const bodyPreview = (email.bodyText || '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_BODY_PREVIEW);

  await ref.set({
    id: messageId,
    firmId,
    userId,
    matterId,
    sourceFileHash,
    extractedAt: admin.firestore.FieldValue.serverTimestamp(),

    // Email metadata
    subject: email.subject,
    from: email.from,
    to: email.to,
    cc: email.cc,
    date: admin.firestore.Timestamp.fromDate(email.date),

    // Body
    bodyTextPath,
    bodyHtmlPath,
    bodyPreview,

    // Attachments
    hasAttachments: attachmentResults.length > 0,
    attachmentCount: attachmentResults.length,
    attachments: attachmentResults,

    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return messageId;
}

/**
 * Mark evidence document as successfully processed
 * @param {Object} db - Firestore instance
 * @param {string} firmId 
 * @param {string} matterId 
 * @param {string} fileHash 
 * @param {string} messageId 
 * @param {string[]} attachmentHashes 
 */
async function markSuccess(db, firmId, matterId, fileHash, messageId, attachmentHashes) {
  const ref = db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(fileHash);

  await ref.update({
    hasEmailAttachments: false,
    parseStatus: PARSE_STATUS.COMPLETED,
    parseError: null,
    parsedAt: admin.firestore.FieldValue.serverTimestamp(),
    extractedMessageId: messageId,
    extractedAttachmentHashes: attachmentHashes
  });
}

/**
 * Mark evidence document as failed
 * @param {Object} db - Firestore instance
 * @param {string} firmId 
 * @param {string} matterId 
 * @param {string} fileHash 
 * @param {string} errorMessage 
 */
async function markFailure(db, firmId, matterId, fileHash, errorMessage) {
  const ref = db
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(fileHash);

  await ref.update({
    parseStatus: PARSE_STATUS.FAILED,
    parseError: errorMessage,
    retryCount: admin.firestore.FieldValue.increment(1)
  });
}

module.exports = {
  computeHash,
  getExtension,
  detectFileType,
  downloadFile,
  uploadFile,
  acquireLock,
  attachmentExists,
  createAttachmentEvidence,
  addParentReference,
  saveEmailBodies,
  createEmailDocument,
  markSuccess,
  markFailure
};
