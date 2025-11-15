/**
 * Upload Orchestration Composable
 * Manages upload state, control flow, and coordination between components
 */

import { ref } from 'vue';

/**
 * Upload Orchestration Composable
 * Provides centralized control for upload workflow state management
 */
export const useUploadOrchestration = () => {
  // Upload state tracking
  const isStartingUpload = ref(false);
  const isPaused = ref(false);
  const pauseRequested = ref(false);
  const currentUploadIndex = ref(0);
  let uploadAbortController = null;

  // Session ID management
  const currentSessionId = ref(null);

  /**
   * Get or create current session ID
   * Session ID is used to track files uploaded in the same batch
   */
  const getCurrentSessionId = () => {
    if (!currentSessionId.value) {
      currentSessionId.value = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return currentSessionId.value;
  };

  /**
   * Reset session ID (called when starting a new upload)
   */
  const resetSessionId = () => {
    currentSessionId.value = null;
  };

  /**
   * Get current upload abort controller
   */
  const getUploadAbortController = () => uploadAbortController;

  /**
   * Set upload abort controller
   */
  const setUploadAbortController = (controller) => {
    uploadAbortController = controller;
  };

  /**
   * Handle pause upload request
   */
  const handlePauseUpload = (updateUploadStatus) => {
    pauseRequested.value = true;
    updateUploadStatus('requestPause');
  };

  /**
   * Handle resume upload request
   */
  const handleResumeUpload = (updateUploadStatus, continueUpload) => {
    isPaused.value = false;
    updateUploadStatus('resume');
    continueUpload();
  };

  /**
   * Simple upload control handler
   * Orchestrates the start of the upload process
   */
  const handleStartUpload = async (
    setPhaseComplete,
    resetUploadStatus,
    updateUploadStatus,
    continueUpload,
    showNotification
  ) => {
    try {
      isStartingUpload.value = true;
      setPhaseComplete();

      if (!isPaused.value) {
        resetUploadStatus();
        currentUploadIndex.value = 0;
        resetSessionId();
        getCurrentSessionId();
      }

      updateUploadStatus('start');
      const result = await continueUpload();

      // Reset state after completion
      if (result && result.completed) {
        currentUploadIndex.value = 0;
        isStartingUpload.value = false;
      }
    } catch (error) {
      showNotification('Upload failed: ' + (error.message || 'Unknown error'), 'error');
      updateUploadStatus('complete');
      isPaused.value = false;
      currentUploadIndex.value = 0;
      isStartingUpload.value = false;
    }
  };

  return {
    // State
    isStartingUpload,
    isPaused,
    pauseRequested,
    currentUploadIndex,

    // Session management
    getCurrentSessionId,
    resetSessionId,

    // Abort controller management
    getUploadAbortController,
    setUploadAbortController,

    // Control handlers
    handlePauseUpload,
    handleResumeUpload,
    handleStartUpload,
  };
};
