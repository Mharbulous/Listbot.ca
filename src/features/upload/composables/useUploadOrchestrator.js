/**
 * Upload Orchestrator Composable
 * Manages batch upload orchestration, progress tracking, and upload lifecycle
 */

import { useMatterViewStore } from '../../../stores/matterView.js';
import { useUploadOrchestration } from './useUploadOrchestration.js';

/**
 * Upload Orchestrator Composable
 * @param {Object} params - Configuration parameters
 * @param {Ref<Array>} params.uploadQueue - The upload queue ref
 * @param {Function} params.notify - Notification function
 * @param {Function} params.getUploadableFiles - Function to get uploadable files
 * @param {Function} params.processSingleFile - Function to process single file
 * @param {Function} params.createCopyMetadataRecord - Function to create copy metadata
 * @param {Function} params.startUpload - Function to start upload tracking
 * @param {Function} params.completeUpload - Function to complete upload tracking
 * @param {Object} params.uploadStartTime - Ref to upload start time
 * @param {Object} params.uploadEndTime - Ref to upload end time
 * @returns {Object} Orchestrator functions
 */
export function useUploadOrchestrator({
  uploadQueue,
  notify,
  getUploadableFiles,
  processSingleFile,
  createCopyMetadataRecord,
  startUpload,
  completeUpload,
  uploadStartTime,
  uploadEndTime,
}) {
  const matterStore = useMatterViewStore();
  const orchestration = useUploadOrchestration();

  /**
   * Upload all files in queue
   * Main upload orchestration function
   */
  const uploadQueueFiles = async () => {
    try {
      // Validate matter is selected
      if (!matterStore.currentMatterId) {
        notify('No matter selected. Please select a matter before uploading.', 'error');
        return {
          completed: false,
          error: 'No matter selected',
        };
      }

      // Get uploadable files
      const filesToUpload = getUploadableFiles();

      // Count pre-detected duplicates (files that won't be uploaded)
      const duplicatesSkipped = uploadQueue.value.filter(f => f.status === 'duplicate').length;

      if (filesToUpload.length === 0) {
        notify('No files to upload', 'info');
        return {
          completed: true,
          totalFiles: 0,
          uploaded: 0,
          skipped: 0,
          failed: 0,
        };
      }

      // Initialize upload state
      startUpload();
      orchestration.resetSessionId();
      const sessionId = orchestration.getCurrentSessionId();

      // Create abort controller for cancellation
      const abortController = new AbortController();
      orchestration.setUploadAbortController(abortController);

      console.log('[UPLOAD] ========================================');
      console.log('[UPLOAD] BATCH UPLOAD STARTED');
      console.log('[UPLOAD] ========================================');
      console.log(`[UPLOAD] Session ID: ${sessionId}`);
      console.log(`[UPLOAD] Total files to upload: ${filesToUpload.length}`);
      console.log('[UPLOAD] ========================================');

      // Phase 3b: Pre-build copy group map for O(n) efficiency
      const copyGroupMap = new Map(); // key: fileHash, value: array of copy queueFiles
      for (const file of filesToUpload) {
        if (file.status === 'copy') {
          if (!copyGroupMap.has(file.hash)) {
            copyGroupMap.set(file.hash, []);
          }
          copyGroupMap.get(file.hash).push(file);
        }
      }

      // Upload files with pipelined hash/check optimization
      // While file N is uploading, we hash/check file N+1 to hide latency
      let uploadedCount = 0;
      let copyCount = 0;
      let copiesSkipped = 0;
      let failedCount = 0;

      // Get only primary files (non-copy) for processing
      const primaryFiles = filesToUpload.filter(file => file.status !== 'copy');

      for (let i = 0; i < primaryFiles.length; i++) {
        const queueFile = primaryFiles[i];

        // Check for pause request
        if (orchestration.pauseRequested.value) {
          orchestration.currentUploadIndex.value = i;
          orchestration.isPaused.value = true;
          orchestration.pauseRequested.value = false;
          console.log(`[UPLOAD] Upload paused at file ${i + 1}/${primaryFiles.length}`);
          notify('Upload paused', 'info');
          return {
            completed: false,
            paused: true,
            currentIndex: i,
            totalFiles: primaryFiles.length,
            uploaded: uploadedCount,
            copies: copyCount,
            failed: failedCount,
          };
        }

        // Check for abort request
        if (abortController.signal.aborted) {
          console.log(`[UPLOAD] Upload cancelled at file ${i + 1}/${primaryFiles.length}`);
          notify('Upload cancelled', 'warning');
          return {
            completed: false,
            cancelled: true,
            currentIndex: i,
            totalFiles: primaryFiles.length,
            uploaded: uploadedCount,
            copies: copyCount,
            failed: failedCount,
          };
        }

        // Process primary file (status='ready')
        try {
          const result = await processSingleFile(queueFile, abortController.signal);

          if (result.success) {
            if (result.skipped) {
              // File already existed - metadata only
              uploadedCount++;
            } else {
              uploadedCount++;
            }

            // IMMEDIATELY upload metadata for ALL copies in this hash group
            const copies = copyGroupMap.get(queueFile.hash) || [];
            for (const copyFile of copies) {
              try {
                copyFile.status = 'uploading';
                const copyResult = await createCopyMetadataRecord(copyFile);

                if (copyResult.success) {
                  if (copyResult.duplicate) {
                    // Copy metadata already exists from same user - duplicate
                    copyFile.status = 'skipped'; // Shows as "Duplicate" with orange dot
                    copiesSkipped++; // Track copy duplicates
                  } else {
                    // Copy metadata created successfully
                    copyFile.status = 'copied'; // Copy metadata only (not uploaded to Storage)
                    copyCount++;
                  }
                } else {
                  // Copy metadata failure is NON-BLOCKING
                  copyFile.status = 'error';
                  copyFile.error = `Copy metadata failed: ${copyResult.error?.message || 'Unknown error'}`;
                  failedCount++;
                }
              } catch (error) {
                // Copy metadata failure is NON-BLOCKING
                copyFile.status = 'error';
                copyFile.error = `Copy metadata failed: ${error.message}`;
                failedCount++;
              }
            }
          } else {
            // Primary upload failed
            failedCount++;
          }
        } catch (error) {
          // Primary upload failed - mark ALL copies as error
          queueFile.status = 'error';
          queueFile.error = error.message;
          failedCount++;

          const copies = copyGroupMap.get(queueFile.hash) || [];
          for (const copyFile of copies) {
            copyFile.status = 'error';
            copyFile.error = 'Primary file upload failed';
            failedCount++;
          }
        }

        // Log progress every 10 files
        if ((i + 1) % 10 === 0 || i + 1 === primaryFiles.length) {
          console.log(
            `[UPLOAD] Progress: ${i + 1}/${primaryFiles.length} (${uploadedCount} uploaded, ${copyCount} copies, ${copiesSkipped} copies skipped, ${failedCount} failed)`
          );
        }
      }

      // Upload complete
      completeUpload();
      const duration = uploadEndTime.value - uploadStartTime.value;
      const durationSeconds = (duration / 1000).toFixed(1);

      console.log('[UPLOAD] ========================================');
      console.log('[UPLOAD] BATCH UPLOAD COMPLETE');
      console.log('[UPLOAD] ========================================');
      console.log(`[UPLOAD] Total files: ${filesToUpload.length}`);
      console.log(`[UPLOAD] Primary files uploaded: ${uploadedCount}`);
      console.log(`[UPLOAD] Copy metadata created: ${copyCount}`);
      console.log(`[UPLOAD] Copies skipped (duplicate metadata): ${copiesSkipped}`);
      console.log(`[UPLOAD] Duplicates skipped (pre-detected): ${duplicatesSkipped}`);
      console.log(`[UPLOAD] Failed: ${failedCount}`);
      console.log(`[UPLOAD] Duration: ${durationSeconds}s`);
      console.log('[UPLOAD] ========================================');

      // Show completion notification
      if (failedCount === 0) {
        notify(
          `Upload complete: ${uploadedCount} uploaded, ${copyCount} copies (${durationSeconds}s)`,
          'success'
        );
      } else {
        notify(
          `Upload complete with errors: ${uploadedCount} uploaded, ${copyCount} copies, ${failedCount} failed`,
          'warning'
        );
      }

      orchestration.currentUploadIndex.value = 0;

      return {
        completed: true,
        metrics: {
          filesUploaded: uploadedCount,
          filesCopies: copyCount,
          copiesSkipped: copiesSkipped,
          duplicatesSkipped: duplicatesSkipped,
          totalFiles: uploadedCount + copyCount,
          failedFiles: failedCount,
        },
        totalFiles: filesToUpload.length,
        uploaded: uploadedCount,
        copies: copyCount,
        copiesSkipped: copiesSkipped,
        duplicatesSkipped: duplicatesSkipped,
        failed: failedCount,
        duration,
      };
    } catch (error) {
      console.error('[UPLOAD] Upload failed:', error);
      notify(`Upload failed: ${error.message}`, 'error');
      return {
        completed: false,
        error: error.message,
      };
    }
  };

  return {
    uploadQueueFiles,
    orchestration,
  };
}
