/**
 * Email Extraction Cloud Functions
 * 
 * Entry points for Firebase Cloud Functions.
 * These are thin wrappers around the orchestrator.
 */

const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const { processEmailFile } = require('./orchestrator');
const { PARSE_STATUS, MAX_RETRY } = require('./constants');

/**
 * Trigger: Fires when evidence document is created
 * Checks if document needs email extraction and processes it
 */
exports.onEvidenceCreated = onDocumentCreated({
  document: 'firms/{firmId}/matters/{matterId}/evidence/{fileHash}',
  region: 'us-west1',
  memory: '2GiB',
  timeoutSeconds: 300,
  maxInstances: 10,
}, async (event) => {
  const fileHash = event.params.fileHash;
  const data = event.data.data();

  // Only process emails that need extraction
  if (data.hasEmailAttachments !== true) {
    return null;
  }

  try {
    const result = await processEmailFile(fileHash, data);
    return { success: result.success, messageId: result.messageId };
  } catch (error) {
    // Error already logged and recorded in orchestrator
    return { success: false, error: error.message };
  }
});

/**
 * Callable: Manual retry from UI
 * Allows users to retry failed extractions
 */
exports.retryEmailExtraction = onCall({
  region: 'us-west1',
  memory: '2GiB',
  timeoutSeconds: 300,
}, async (request) => {
  const { fileHash, firmId, matterId } = request.data;
  const uid = request.auth?.uid;

  // Validate authentication
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Must be logged in');
  }

  // Validate inputs
  if (!fileHash || !firmId || !matterId) {
    throw new HttpsError('invalid-argument', 'fileHash, firmId, and matterId are required');
  }

  // Get the document
  const docRef = admin.firestore()
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(fileHash);
    
  const doc = await docRef.get();
  
  if (!doc.exists) {
    throw new HttpsError('not-found', 'File not found');
  }

  const data = doc.data();

  // Validate ownership
  if (data.userId !== uid) {
    throw new HttpsError('permission-denied', 'Not your file');
  }

  // Validate state - can only retry failed extractions or emails pending extraction
  const canRetry = data.parseStatus === PARSE_STATUS.FAILED || 
                   (data.hasEmailAttachments === true && data.parseStatus !== PARSE_STATUS.PROCESSING);
  
  if (!canRetry) {
    throw new HttpsError('failed-precondition', 'Cannot retry: extraction not in retriable state');
  }

  // Check retry limit
  if (data.retryCount >= MAX_RETRY) {
    throw new HttpsError('failed-precondition', `Max retries exceeded (${MAX_RETRY})`);
  }

  // Reset status for retry
  await docRef.update({
    hasEmailAttachments: true,
    parseStatus: PARSE_STATUS.PENDING,
    parseError: null
  });

  // Process
  try {
    const result = await processEmailFile(fileHash, {
      ...data,
      // Ensure these are present
      firmId,
      matterId,
      userId: uid
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    throw new HttpsError('internal', error.message);
  }
});
