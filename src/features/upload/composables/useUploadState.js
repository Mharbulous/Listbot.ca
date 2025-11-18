/**
 * Upload State Management Composable
 * Manages upload state, timestamps, and file filtering
 */

import { ref, computed } from 'vue';

/**
 * Upload State Composable
 * @param {Object} params - Configuration parameters
 * @param {Ref<Array>} params.uploadQueue - The upload queue ref
 * @param {Function} params.showNotification - Function to show notifications (optional)
 * @returns {Object} State management functions and refs
 */
export function useUploadState({ uploadQueue, showNotification }) {
  // Upload state
  const isUploading = ref(false);
  const uploadStartTime = ref(null);
  const uploadEndTime = ref(null);

  /**
   * Notification helper with fallback
   */
  const notify = (message, type = 'info') => {
    if (showNotification) {
      showNotification(message, type);
    } else {
      console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${message}`);
    }
  };

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
      duration:
        uploadEndTime.value && uploadStartTime.value
          ? uploadEndTime.value - uploadStartTime.value
          : 0,
    };
  };

  /**
   * Reset upload state
   */
  const resetUploadState = () => {
    isUploading.value = false;
    uploadStartTime.value = null;
    uploadEndTime.value = null;
  };

  /**
   * Start upload tracking
   */
  const startUpload = () => {
    isUploading.value = true;
    uploadStartTime.value = Date.now();
    uploadEndTime.value = null;
  };

  /**
   * Complete upload tracking
   */
  const completeUpload = () => {
    uploadEndTime.value = Date.now();
    isUploading.value = false;
  };

  return {
    // State
    isUploading: computed(() => isUploading.value),
    uploadStartTime: computed(() => uploadStartTime.value),
    uploadEndTime: computed(() => uploadEndTime.value),

    // Methods
    notify,
    getUploadableFiles,
    getUploadSummary,
    resetUploadState,
    startUpload,
    completeUpload,
  };
}
