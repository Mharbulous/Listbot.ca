/**
 * Upload Adapter Composable
 * Bridges the new upload queue (Phase 1.5) with existing upload infrastructure
 * Provides a clean interface for uploading files from the Uploadv2.vue queue
 */

import { ref, computed } from 'vue';
import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { useFileProcessor } from './useFileProcessor.js';
import { useFileMetadata } from './useFileMetadata.js';
import { useUploadOrchestration } from '../../../dev-demos/upload/composables/useUploadOrchestration.js';
import { useWebWorker } from './useWebWorker.js';
import { isNetworkError } from '../utils/networkUtils.js';
import { safeLog, safeMetadata, createFileMetadataRecord } from '../utils/uploadHelpers.js';

/**
 * Upload Adapter Composable
 * @param {Object} params - Configuration parameters
 * @param {Ref<Array>} params.uploadQueue - The new upload queue ref
 * @param {Function} params.updateFileStatus - Function to update file status
 * @param {Function} params.showNotification - Function to show notifications (optional)
 * @returns {Object} Upload adapter functions
 */
export function useConstraintAdapter({ uploadQueue, updateFileStatus, showNotification }) {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

  // Initialize composables
  const orchestration = useUploadOrchestration();
  const { generateMetadataHash, createMetadataRecord } = useFileMetadata();

  // Upload state
  const isUploading = ref(false);
  const uploadStartTime = ref(null);
  const uploadEndTime = ref(null);

  // Notification helper with fallback
  const notify = (message, type = 'info') => {
    if (showNotification) {
      showNotification(message, type);
    } else {
      console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${message}`);
    }
  };

  // Initialize file processor (with minimal params for adapter use)
  const fileProcessor = useFileProcessor({
    authStore,
    matterStore,
    queueDeduplication: ref([]), // Not used in new queue
    timeWarning: ref(null), // Not used in new queue
    updateUploadQueue: () => {}, // Not used in new queue
    updateAllFilesToReady: () => {}, // Not used in new queue
    analysisTimedOut: ref(false), // Not used in new queue
    skippedFolders: ref([]), // Not used in new queue
    allFilesAnalysis: ref({}), // Not used in new queue
    mainFolderAnalysis: ref({}), // Not used in new queue
  });

  /**
   * Get uploadable files from queue
   * Filters out skipped, n/a, and already completed files
   */
  const getUploadableFiles = () => {
    return uploadQueue.value.filter(
      (file) =>
        file.status === 'ready' &&
        !file.skipReason // Exclude .lnk files marked by worker
    );
  };

  /**
   * Process single file upload
   * Handles: Hash → Check Exists → Upload → Create Metadata
   */
  const processSingleFile = async (queueFile, abortSignal) => {
    try {
      const sessionId = orchestration.getCurrentSessionId();

      // Step 1: Update status to hashing
      updateFileStatus(queueFile.id, 'hashing');
      console.log(`[UPLOAD] Hashing file: ${queueFile.name}`);

      // Step 2: Calculate file hash
      const fileHash = await fileProcessor.calculateFileHash(queueFile.sourceFile);
      queueFile.hash = fileHash;

      // Step 3: Check if file exists in Firestore
      updateFileStatus(queueFile.id, 'checking');
      const existsResult = await fileProcessor.checkFileExists(fileHash);

      if (existsResult.exists) {
        // File already exists - create metadata only
        console.log(`[UPLOAD] File already exists, creating metadata only: ${queueFile.name}`);
        updateFileStatus(queueFile.id, 'skipped');

        await safeMetadata(
          async () => {
            await createMetadataRecord({
              sourceFileName: queueFile.name,
              lastModified: queueFile.sourceLastModified,
              fileHash,
              size: queueFile.size,
              originalPath: queueFile.folderPath
                ? `${queueFile.folderPath}/${queueFile.name}`
                : queueFile.name,
              sourceFileType: queueFile.sourceFile.type,
            });
          },
          `for existing file ${queueFile.name}`
        );

        return { success: true, skipped: true };
      }

      // Step 4: Upload file to storage
      updateFileStatus(queueFile.id, 'uploading');
      queueFile.uploadProgress = 0;

      console.log(`[UPLOAD] Uploading file: ${queueFile.name}`);

      // Upload with progress tracking
      const uploadResult = await fileProcessor.uploadSingleFile(
        queueFile.sourceFile,
        fileHash,
        queueFile.name,
        abortSignal,
        (progress) => {
          // Update progress in queue
          queueFile.uploadProgress = progress;
        }
      );

      // Step 5: Create metadata record
      updateFileStatus(queueFile.id, 'creating_metadata');
      console.log(`[UPLOAD] Creating metadata for: ${queueFile.name}`);

      await safeMetadata(
        async () => {
          await createMetadataRecord({
            sourceFileName: queueFile.name,
            lastModified: queueFile.sourceLastModified,
            fileHash,
            size: queueFile.size,
            originalPath: queueFile.folderPath
              ? `${queueFile.folderPath}/${queueFile.name}`
              : queueFile.name,
            sourceFileType: queueFile.sourceFile.type,
            storageCreatedTimestamp: uploadResult.timeCreated,
          });
        },
        `for new file ${queueFile.name}`
      );

      // Step 6: Mark as completed
      updateFileStatus(queueFile.id, 'completed');
      console.log(`[UPLOAD] Completed: ${queueFile.name}`);

      return { success: true, skipped: false };
    } catch (error) {
      // Handle errors
      console.error(`[UPLOAD] Error uploading ${queueFile.name}:`, error);

      // Check if it's a network error
      if (isNetworkError(error)) {
        updateFileStatus(queueFile.id, 'network_error');
        queueFile.error = 'Network error - check connection';
      } else {
        updateFileStatus(queueFile.id, 'error');
        queueFile.error = error.message;
      }

      return { success: false, error };
    }
  };

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
      isUploading.value = true;
      uploadStartTime.value = Date.now();
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
          isUploading.value = false;
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
          isUploading.value = false;
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
      uploadEndTime.value = Date.now();
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

      isUploading.value = false;
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
      isUploading.value = false;
      return {
        completed: false,
        error: error.message,
      };
    }
  };

  /**
   * Resume upload from current index
   */
  const resumeUpload = async () => {
    if (!orchestration.isPaused.value) {
      console.log('[UPLOAD] Upload is not paused');
      return;
    }

    orchestration.isPaused.value = false;
    console.log('[UPLOAD] Resuming upload from index:', orchestration.currentUploadIndex.value);
    notify('Resuming upload...', 'info');

    // Resume upload
    return await uploadQueueFiles();
  };

  /**
   * Pause upload
   */
  const pauseUpload = () => {
    orchestration.pauseRequested.value = true;
    console.log('[UPLOAD] Pause requested');
  };

  /**
   * Cancel upload
   */
  const cancelUpload = () => {
    const controller = orchestration.getUploadAbortController();
    if (controller) {
      controller.abort();
      console.log('[UPLOAD] Upload cancelled');
      notify('Upload cancelled', 'warning');
    }
  };

  /**
   * Retry failed uploads
   */
  const retryFailedUploads = async () => {
    // Reset failed files back to ready status
    let resetCount = 0;
    uploadQueue.value.forEach((file) => {
      if (file.status === 'network_error' || file.status === 'error') {
        updateFileStatus(file.id, 'ready');
        file.error = null;
        resetCount++;
      }
    });

    if (resetCount === 0) {
      notify('No failed uploads to retry', 'info');
      return;
    }

    console.log(`[UPLOAD] Retrying ${resetCount} failed uploads`);
    notify(`Retrying ${resetCount} failed uploads...`, 'info');

    // Start upload
    return await uploadQueueFiles();
  };

  /**
   * Get upload summary
   */
  const getUploadSummary = () => {
    const completed = uploadQueue.value.filter((f) => f.status === 'completed').length;
    const skipped = uploadQueue.value.filter(
      (f) => f.status === 'skipped' || f.status === 'uploadMetadataOnly'
    ).length;
    const failed = uploadQueue.value.filter(
      (f) => f.status === 'error' || f.status === 'network_error'
    ).length;
    const total = uploadQueue.value.length;

    return {
      completed,
      skipped,
      failed,
      total,
      duration: uploadEndTime.value && uploadStartTime.value
        ? uploadEndTime.value - uploadStartTime.value
        : 0,
    };
  };

  return {
    // State
    isUploading: computed(() => isUploading.value),
    isPaused: computed(() => orchestration.isPaused.value),

    // Upload functions
    uploadQueueFiles,
    resumeUpload,
    pauseUpload,
    cancelUpload,
    retryFailedUploads,
    getUploadSummary,

    // Orchestration state (for UI)
    currentUploadIndex: computed(() => orchestration.currentUploadIndex.value),
  };
}
