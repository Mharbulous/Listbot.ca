/**
 * File Upload Handlers Composable
 * Handles individual file upload workflows and the main upload loop
 */

import { safeLog, safeMetadata, createFileMetadataRecord, logFileEvent } from '../utils/uploadHelpers.js';

/**
 * File Upload Handlers Composable
 * @param {Object} params - Configuration parameters
 * @returns {Object} Upload handler functions
 */
export const useFileUploadHandlers = ({
  uploadQueue,
  uploadStatus,
  pauseRequested,
  isPaused,
  updateUploadStatus,
  updateFileStatus,
  showNotification,
  calculateFileHash,
  checkFileExists,
  uploadSingleFile,
  populateExistingHash,
  logUploadEvent,
  updateUploadEvent,
  createMetadata,
  generateMetadataHash,
  getCurrentSessionId,
  getUploadAbortController,
  setUploadAbortController,
}) => {
  /**
   * Process duplicate file (consolidated logic)
   * Skips upload and records metadata for files that are duplicates within the queue
   */
  const processDuplicateFile = async (queueFile) => {
    updateUploadStatus('currentFile', queueFile.sourceName, 'processing_duplicate');
    updateFileStatus(queueFile, 'skipped');

    await safeLog(
      async () =>
        await logFileEvent(
          logUploadEvent,
          generateMetadataHash,
          'upload_skipped_metadata_recorded',
          queueFile,
          queueFile.hash
        ),
      `duplicate file ${queueFile.sourceName}`
    );

    await safeMetadata(
      async () =>
        await createFileMetadataRecord(
          createMetadata,
          getCurrentSessionId,
          queueFile,
          queueFile.hash
        ),
      `for duplicate ${queueFile.sourceName}`
    );

    updateUploadStatus('skipped');
  };

  /**
   * Process existing file (consolidated logic)
   * Skips upload and records metadata for files that already exist in Firestore
   */
  const processExistingFile = async (queueFile, fileHash) => {
    updateUploadStatus('skipped');
    updateFileStatus(queueFile, 'skipped');

    await safeLog(
      async () =>
        await logFileEvent(
          logUploadEvent,
          generateMetadataHash,
          'upload_skipped_metadata_recorded',
          queueFile,
          fileHash
        ),
      `existing file ${queueFile.sourceName}`
    );

    await safeMetadata(
      async () =>
        await createFileMetadataRecord(createMetadata, getCurrentSessionId, queueFile, fileHash),
      `for existing file ${queueFile.sourceName}`
    );
  };

  /**
   * Process new file upload (consolidated logic)
   * Uploads file to storage and records metadata
   */
  const processNewFileUpload = async (queueFile, fileHash) => {
    updateUploadStatus('currentFile', queueFile.sourceName, 'uploading');

    // Log upload_interrupted preemptively and capture event ID
    let uploadEventId = null;
    try {
      uploadEventId = await logFileEvent(
        logUploadEvent,
        generateMetadataHash,
        'upload_interrupted',
        queueFile,
        fileHash
      );
    } catch {
      // Silently catch logging errors
    }

    const uploadAbortController = getUploadAbortController();
    const uploadResult = await uploadSingleFile(
      queueFile.sourceFile,
      fileHash,
      queueFile.sourceName,
      uploadAbortController.signal
    );

    updateUploadStatus('successful');
    updateFileStatus(queueFile, 'completed');

    // Update the preemptive log to upload_success
    if (uploadEventId) {
      try {
        await updateUploadEvent(uploadEventId, { eventType: 'upload_success' });
      } catch {
        // Silently catch update errors
      }
    }

    await safeMetadata(
      async () =>
        await createFileMetadataRecord(
          createMetadata,
          getCurrentSessionId,
          queueFile,
          fileHash,
          uploadResult.storageCreatedTimestamp
        ),
      `for uploaded file ${queueFile.sourceName}`
    );
  };

  /**
   * Resumable upload loop function
   * Main iteration logic for processing the upload queue
   */
  const continueUpload = async () => {
    try {
      const filesToProcess = uploadQueue.value;
      if (filesToProcess.length === 0) {
        showNotification('No files to process', 'info');
        updateUploadStatus('complete');
        return;
      }

      const startIndex = uploadStatus.value.currentUploadIndex || 0;

      for (let i = startIndex; i < filesToProcess.length; i++) {
        // Check for pause request
        if (pauseRequested.value) {
          updateUploadStatus('setUploadIndex', i);
          updateUploadStatus('pause');
          isPaused.value = true;
          pauseRequested.value = false;
          return;
        }

        const queueFile = filesToProcess[i];
        updateUploadStatus('setUploadIndex', i);

        // Handle duplicate files
        if (queueFile.isDuplicate) {
          try {
            await processDuplicateFile(queueFile);
          } catch {
            updateFileStatus(queueFile, 'failed');
            updateUploadStatus('failed');
          }
          continue;
        }

        try {
          const uploadAbortController = new AbortController();
          setUploadAbortController(uploadAbortController);

          // Calculate or reuse hash
          updateUploadStatus('currentFile', queueFile.sourceName, 'calculating_hash');
          updateFileStatus(queueFile, 'uploading');

          let fileHash;
          if (queueFile.hash) {
            fileHash = queueFile.hash;
          } else {
            fileHash = await calculateFileHash(queueFile.sourceFile);
            queueFile.hash = fileHash;
            populateExistingHash(queueFile.id || queueFile.sourceName, fileHash);
          }

          if (uploadAbortController.signal.aborted) {
            break;
          }

          // Check if file exists
          updateUploadStatus('currentFile', queueFile.sourceName, 'checking_existing');
          const fileExists = await checkFileExists(fileHash);

          if (fileExists) {
            await processExistingFile(queueFile, fileHash);
          } else {
            if (uploadAbortController.signal.aborted) {
              break;
            }
            await processNewFileUpload(queueFile, fileHash);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            break;
          }
          updateUploadStatus('failed');
          updateFileStatus(queueFile, 'error');

          // Log failure
          await safeLog(async () => {
            let currentFileHash = queueFile.hash || 'unknown_hash';
            if (currentFileHash === 'unknown_hash') {
              try {
                currentFileHash = await calculateFileHash(queueFile.sourceFile);
              } catch {
                // Silently catch hash calculation errors
              }
            }
            await logFileEvent(
              logUploadEvent,
              generateMetadataHash,
              'upload_failed',
              queueFile,
              currentFileHash
            );
          });
        } finally {
          setUploadAbortController(null);
        }
      }

      // Handle completion or pause
      if (!isPaused.value) {
        updateUploadStatus('complete');

        const totalProcessed = uploadStatus.value.successful + uploadStatus.value.skipped;
        if (uploadStatus.value.failed === 0) {
          showNotification(`All ${totalProcessed} files processed successfully!`, 'success');
        } else {
          showNotification(
            `${totalProcessed} files processed, ${uploadStatus.value.failed} failed`,
            'warning'
          );
        }

        return { completed: true };
      }

      return { completed: false };
    } catch (error) {
      showNotification('Upload failed: ' + (error.message || 'Unknown error'), 'error');
      updateUploadStatus('complete');
      isPaused.value = false;
      throw error;
    }
  };

  return {
    processDuplicateFile,
    processExistingFile,
    processNewFileUpload,
    continueUpload,
  };
};
