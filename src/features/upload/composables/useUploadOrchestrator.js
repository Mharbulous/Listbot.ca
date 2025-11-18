/**
 * Upload Orchestrator Composable
 * Manages batch upload orchestration, progress tracking, and upload lifecycle
 */

import { useMatterViewStore } from '../../../stores/matterView.js';
import { useUploadOrchestration } from './useUploadOrchestration.js';

/**
 * Upload Orchestrator Composable
 * @param {Object} params - Configuration parameters
 * @param {Function} params.notify - Notification function
 * @param {Function} params.getUploadableFiles - Function to get uploadable files
 * @param {Function} params.processSingleFile - Function to process single file
 * @param {Function} params.startUpload - Function to start upload tracking
 * @param {Function} params.completeUpload - Function to complete upload tracking
 * @param {Object} params.uploadStartTime - Ref to upload start time
 * @param {Object} params.uploadEndTime - Ref to upload end time
 * @returns {Object} Orchestrator functions
 */
export function useUploadOrchestrator({
  notify,
  getUploadableFiles,
  processSingleFile,
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

      // Upload files sequentially (parallel upload could be added in Phase 6)
      let uploadedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const queueFile = filesToUpload[i];

        // Check for pause request
        if (orchestration.pauseRequested.value) {
          orchestration.currentUploadIndex.value = i;
          orchestration.isPaused.value = true;
          orchestration.pauseRequested.value = false;
          console.log(`[UPLOAD] Upload paused at file ${i + 1}/${filesToUpload.length}`);
          notify('Upload paused', 'info');
          return {
            completed: false,
            paused: true,
            currentIndex: i,
            totalFiles: filesToUpload.length,
            uploaded: uploadedCount,
            skipped: skippedCount,
            failed: failedCount,
          };
        }

        // Check for abort request
        if (abortController.signal.aborted) {
          console.log(`[UPLOAD] Upload cancelled at file ${i + 1}/${filesToUpload.length}`);
          notify('Upload cancelled', 'warning');
          return {
            completed: false,
            cancelled: true,
            currentIndex: i,
            totalFiles: filesToUpload.length,
            uploaded: uploadedCount,
            skipped: skippedCount,
            failed: failedCount,
          };
        }

        // Process file
        const result = await processSingleFile(queueFile, abortController.signal);

        if (result.success) {
          if (result.skipped) {
            skippedCount++;
          } else {
            uploadedCount++;
          }
        } else {
          failedCount++;
        }

        // Log progress every 10 files
        if ((i + 1) % 10 === 0 || i + 1 === filesToUpload.length) {
          console.log(
            `[UPLOAD] Progress: ${i + 1}/${filesToUpload.length} (${uploadedCount} uploaded, ${skippedCount} skipped, ${failedCount} failed)`
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
      console.log(`[UPLOAD] Successfully uploaded: ${uploadedCount}`);
      console.log(`[UPLOAD] Duplicates skipped: ${skippedCount}`);
      console.log(`[UPLOAD] Failed: ${failedCount}`);
      console.log(`[UPLOAD] Duration: ${durationSeconds}s`);
      console.log('[UPLOAD] ========================================');

      // Show completion notification
      if (failedCount === 0) {
        notify(
          `Upload complete: ${uploadedCount} uploaded, ${skippedCount} skipped (${durationSeconds}s)`,
          'success'
        );
      } else {
        notify(
          `Upload complete with errors: ${uploadedCount} uploaded, ${skippedCount} skipped, ${failedCount} failed`,
          'warning'
        );
      }

      orchestration.currentUploadIndex.value = 0;

      return {
        completed: true,
        totalFiles: filesToUpload.length,
        uploaded: uploadedCount,
        skipped: skippedCount,
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
