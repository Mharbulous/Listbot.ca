/**
 * Email Extraction Orchestrator
 * 
 * This is the main entry point for email extraction.
 * It coordinates all the operations but contains NO business logic itself.
 * 
 * The entire flow is visible in ~50 lines, making debugging straightforward.
 */

const admin = require('firebase-admin');
const { parseEmailFile, isEmailFile } = require('./parser');
const { ValidationError, EmailExtractionError } = require('./errors');
const { MAX_FILE_SIZE, MAX_DEPTH } = require('./constants');
const ops = require('./operations');

const db = admin.firestore();
const storage = admin.storage();

/**
 * Validate extraction inputs
 * @param {string} fileHash 
 * @param {Object} uploadData 
 * @returns {Object} Validated params
 */
function validateInputs(fileHash, uploadData) {
  if (!fileHash || typeof fileHash !== 'string') {
    throw new ValidationError('fileHash is required', {
      field: 'fileHash',
      receivedValue: fileHash
    });
  }

  if (!uploadData || typeof uploadData !== 'object') {
    throw new ValidationError('uploadData is required', {
      field: 'uploadData',
      receivedValue: typeof uploadData
    });
  }

  const { firmId, userId, matterId, storagePath, sourceFileName, nestingDepth = 0 } = uploadData;

  if (!firmId) throw new ValidationError('firmId is required', { field: 'firmId' });
  if (!userId) throw new ValidationError('userId is required', { field: 'userId' });
  if (!matterId) throw new ValidationError('matterId is required', { field: 'matterId' });
  if (!storagePath) throw new ValidationError('storagePath is required', { field: 'storagePath' });

  // Derive sourceFileName from storagePath if missing
  let fileName = sourceFileName;
  if (!fileName || typeof fileName !== 'string') {
    const pathParts = storagePath.split('/');
    fileName = pathParts[pathParts.length - 1] || 'unknown.msg';
  }

  return {
    fileHash,
    firmId,
    userId,
    matterId,
    storagePath,
    sourceFileName: fileName,
    nestingDepth
  };
}

/**
 * Process a single attachment
 * @param {Object} attachment - Validated attachment object
 * @param {Object} params - Extraction parameters
 * @param {Object} bucket - Storage bucket
 * @returns {Promise<Object>} Attachment result
 */
async function processAttachment(attachment, params, bucket) {
  const { firmId, userId, matterId, fileHash: parentHash, nestingDepth } = params;
  
  // Skip empty attachments
  if (attachment.size === 0) {
    console.log(`[Orchestrator] Skipping empty attachment: ${attachment.fileName}`);
    return null;
  }

  // Compute hash
  const attHash = ops.computeHash(attachment.data);
  
  // Check for duplicate
  const isDuplicate = await ops.attachmentExists(db, firmId, matterId, attHash);
  
  if (isDuplicate) {
    // Just add parent reference
    await ops.addParentReference(db, firmId, matterId, attHash, parentHash);
    
    return {
      fileHash: attHash,
      fileName: attachment.fileName,
      size: attachment.size,
      mimeType: attachment.mimeType,
      isDuplicate: true
    };
  }

  // Upload to storage
  const ext = ops.getExtension(attachment.fileName);
  const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${attHash}.${ext}`;
  await ops.uploadFile(bucket, storagePath, attachment.data);

  // Create evidence document
  const isNestedEmail = isEmailFile(attachment.fileName);
  
  await ops.createAttachmentEvidence(db, {
    firmId,
    userId,
    matterId,
    attachmentHash: attHash,
    fileName: attachment.fileName,
    fileSize: attachment.size,
    storagePath,
    isNestedEmail,
    parentFileHash: parentHash,
    nestingDepth: nestingDepth + 1
  });

  return {
    fileHash: attHash,
    fileName: attachment.fileName,
    size: attachment.size,
    mimeType: attachment.mimeType,
    isDuplicate: false
  };
}

/**
 * Main extraction function
 * 
 * @param {string} fileHash - BLAKE3 hash of the email file
 * @param {Object} uploadData - Upload metadata from Firestore
 * @returns {Promise<{success: boolean, messageId?: string, reason?: string}>}
 */
async function processEmailFile(fileHash, uploadData) {
  // Step 1: Validate inputs (fail fast)
  const params = validateInputs(fileHash, uploadData);
  const { firmId, userId, matterId, storagePath, sourceFileName, nestingDepth } = params;
  
  console.log(`[Orchestrator] Starting extraction: ${fileHash} (${sourceFileName})`);

  try {
    // Step 2: Check nesting depth
    if (nestingDepth >= MAX_DEPTH) {
      throw new ValidationError(`Exceeded max nesting depth of ${MAX_DEPTH}`, {
        field: 'nestingDepth',
        receivedValue: nestingDepth
      });
    }

    // Step 3: Acquire lock
    const lock = await ops.acquireLock(db, firmId, matterId, fileHash);
    if (!lock.acquired) {
      console.log(`[Orchestrator] Skipping ${fileHash}: ${lock.reason}`);
      return { success: false, reason: lock.reason };
    }

    // Step 4: Download file
    const bucket = storage.bucket();
    const buffer = await ops.downloadFile(bucket, storagePath, fileHash);
    
    if (buffer.length > MAX_FILE_SIZE) {
      throw new ValidationError('File exceeds 100MB limit', {
        field: 'fileSize',
        receivedValue: buffer.length
      });
    }

    // Step 5: Parse and validate (GUARANTEED valid output)
    const email = await parseEmailFile(buffer, sourceFileName);
    console.log(`[Orchestrator] Parsed ${fileHash}: ${email.attachments.length} attachments`);

    // Step 6: Process attachments
    const attachmentResults = [];
    const attachmentHashes = [];

    for (const attachment of email.attachments) {
      const result = await processAttachment(attachment, params, bucket);
      if (result) {
        attachmentResults.push(result);
        attachmentHashes.push(result.fileHash);
      }
    }

    // Step 7: Save email bodies
    const { textPath, htmlPath } = await ops.saveEmailBodies(
      bucket, firmId, matterId, 
      fileHash, // Use fileHash as temp ID, will be replaced
      email.bodyText, email.bodyHtml
    );

    // Step 8: Create email document
    const messageId = await ops.createEmailDocument(db, {
      firmId, userId, matterId,
      sourceFileHash: fileHash,
      email,
      attachmentResults,
      bodyTextPath: textPath,
      bodyHtmlPath: htmlPath
    });

    // Step 9: Mark success
    await ops.markSuccess(db, firmId, matterId, fileHash, messageId, attachmentHashes);
    
    console.log(`[Orchestrator] Completed ${fileHash}: ${attachmentResults.length} attachments, messageId=${messageId}`);
    return { success: true, messageId };

  } catch (error) {
    // Log with full context
    console.error(`[Orchestrator] Failed ${fileHash}:`, {
      error: error.message,
      phase: error.phase || 'unknown',
      details: error.details || {}
    });

    // Mark failure in Firestore
    await ops.markFailure(db, firmId, matterId, fileHash, error.message);
    
    throw error;
  }
}

module.exports = { processEmailFile };
