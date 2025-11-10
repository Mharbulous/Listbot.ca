/**
 * File Upload Handlers Composable
 * Handles individual file upload workflows and the main upload loop
 */

import {
  safeLog,
  safeMetadata,
  createFileMetadataRecord,
  logFileEvent,
} from '../utils/uploadHelpers.js';
import { isNetworkError, getNetworkErrorMessage, getRetryDelay } from '../utils/networkUtils.js';

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
   * Includes network error handling and retry logic
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

    // Create retry callback to update user on retry attempts
    const retryCallback = async (attempt, delayMs) => {
      const retryNum = attempt + 1;
      const delaySec = Math.round(delayMs / 1000);
      updateUploadStatus('currentFile', queueFile.sourceName, 'retrying');
      showNotification(
        `Network error detected. Retrying upload (${retryNum}/4) in ${delaySec}s...`,
        'warning'
      );
    };

    const uploadResult = await uploadSingleFile(
      queueFile.sourceFile,
      fileHash,
      queueFile.sourceName,
      uploadAbortController.signal,
      retryCallback
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

        // Skip files with skipReason (e.g., Windows shortcut files)
        // Mark them as skipped and update UI
        if (queueFile.skipReason === 'shortcut') {
          updateFileStatus(queueFile, 'skipped');
          updateUploadStatus('skipped');
          continue;
        }

        // Skip files already marked as skipped
        if (queueFile.status === 'skipped') {
          updateUploadStatus('skipped');
          continue;
        }

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
            try {
              fileHash = await calculateFileHash(queueFile.sourceFile);
              queueFile.hash = fileHash;
              populateExistingHash(queueFile.id || queueFile.sourceName, fileHash);
            } catch (error) {
              // Handle network errors during hash calculation
              if (isNetworkError(error)) {
                throw error; // Propagate network errors to outer catch
              }
              throw error;
            }
          }

          if (uploadAbortController.signal.aborted) {
            break;
          }

          // Check if file exists with retry callback
          updateUploadStatus('currentFile', queueFile.sourceName, 'checking_existing');
          const retryCallback = async (attempt, delayMs) => {
            const retryNum = attempt + 1;
            const delaySec = Math.round(delayMs / 1000);
            showNotification(
              `Network error checking file. Retrying (${retryNum}/4) in ${delaySec}s...`,
              'warning'
            );
          };

          let fileExists;
          try {
            fileExists = await checkFileExists(fileHash, retryCallback);
          } catch (error) {
            // Handle network errors during existence check
            if (isNetworkError(error)) {
              throw error; // Propagate network errors to outer catch
            }
            // For non-network errors, assume file doesn't exist and continue
            fileExists = false;
          }

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

          // Handle network errors with specific messaging
          if (isNetworkError(error)) {
            updateFileStatus(queueFile, 'network_error');
            const errorMessage = getNetworkErrorMessage(error, 'upload');
            showNotification(`${queueFile.sourceName}: ${errorMessage}`, 'error');

            // Log network failure
            await safeLog(async () => {
              await logFileEvent(
                logUploadEvent,
                generateMetadataHash,
                'upload_failed_network',
                queueFile,
                queueFile.hash || 'unknown_hash'
              );
            });
          } else {
            // Handle non-network errors
            updateFileStatus(queueFile, 'error');
            showNotification(
              `Failed to upload ${queueFile.sourceName}: ${error.message || 'Unknown error'}`,
              'error'
            );

            // Log general failure
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
          }

          updateUploadStatus('failed');
        } finally {
          setUploadAbortController(null);
        }
      }

      // Handle completion or pause
      if (!isPaused.value) {
        updateUploadStatus('complete');

        const totalProcessed = uploadStatus.value.successful + uploadStatus.value.skipped;
        const networkErrors = uploadQueue.value.filter(
          (f) => f.status === 'network_error'
        ).length;
        const otherErrors = uploadStatus.value.failed - networkErrors;

        if (uploadStatus.value.failed === 0) {
          showNotification(`All ${totalProcessed} files processed successfully!`, 'success');
        } else {
          let message = `${totalProcessed} files processed, ${uploadStatus.value.failed} failed`;
          if (networkErrors > 0) {
            message += ` (${networkErrors} due to network issues)`;
          }
          showNotification(message, 'warning');
        }

        return { completed: true };
      }

      return { completed: false };
    } catch (error) {
      // Distinguish network errors in catch-all handler
      if (isNetworkError(error)) {
        const errorMessage = getNetworkErrorMessage(error, 'upload');
        showNotification(`Upload interrupted: ${errorMessage}`, 'error');
      } else {
        showNotification('Upload failed: ' + (error.message || 'Unknown error'), 'error');
      }
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
