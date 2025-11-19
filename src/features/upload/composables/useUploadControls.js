/**
 * Upload Controls Composable
 * Manages upload control operations: resume, pause, cancel, and retry
 */

/**
 * Upload Controls Composable
 * @param {Object} params - Configuration parameters
 * @param {Ref<Array>} params.uploadQueue - The upload queue ref
 * @param {Function} params.updateFileStatus - Function to update file status
 * @param {Function} params.notify - Notification function
 * @param {Function} params.uploadQueueFiles - Main upload function
 * @param {Object} params.orchestration - Upload orchestration instance
 * @returns {Object} Control functions
 */
export function useUploadControls({
  uploadQueue,
  updateFileStatus,
  notify,
  uploadQueueFiles,
  orchestration,
}) {
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

  return {
    resumeUpload,
    pauseUpload,
    cancelUpload,
    retryFailedUploads,
  };
}
