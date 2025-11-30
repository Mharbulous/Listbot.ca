const admin = require('firebase-admin');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

admin.initializeApp();

const { processEmailFile } = require('./email-extraction/orchestrator');
const { PARSE_STATUS, MAX_RETRY } = require('./email-extraction/constants');

// Primary trigger: fires when evidence document created
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

// Manual retry from UI
exports.retryEmailExtraction = onCall({
  region: 'us-west1',
  memory: '2GiB',
  timeoutSeconds: 300,
}, async (request) => {
  const { fileHash, firmId, matterId } = request.data;
  const uid = request.auth?.uid;

  if (!uid) throw new HttpsError('unauthenticated', 'Must be logged in');
  if (!fileHash || !firmId || !matterId) throw new HttpsError('invalid-argument', 'fileHash, firmId, and matterId required');

  const doc = await admin.firestore()
    .collection('firms').doc(firmId)
    .collection('matters').doc(matterId)
    .collection('evidence').doc(fileHash)
    .get();
  if (!doc.exists) throw new HttpsError('not-found', 'File not found');

  const data = doc.data();
  if (data.userId !== uid) throw new HttpsError('permission-denied', 'Not your file');
  if (data.hasEmailAttachments !== true && data.parseStatus !== PARSE_STATUS.FAILED) {
    throw new HttpsError('failed-precondition', 'Cannot retry');
  }
  if (data.retryCount >= MAX_RETRY) {
    throw new HttpsError('failed-precondition', 'Max retries exceeded');
  }

  // Reset status
  await doc.ref.update({
    hasEmailAttachments: true,
    parseStatus: PARSE_STATUS.PENDING,
    parseError: null
  });

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
