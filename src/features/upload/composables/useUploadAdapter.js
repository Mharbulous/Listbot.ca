/**
 * Upload Adapter Composable
 * Bridges the new upload queue (Phase 1.5) with existing upload infrastructure
 * Provides a clean interface for uploading files from the Testing.vue queue
 *
 * This is a thin orchestration layer that composes specialized composables:
 * - useUploadState: State management and file filtering
 * - useUploadProcessor: Single file processing pipeline
 * - useUploadOrchestrator: Batch upload orchestration
 * - useUploadControls: Upload control operations (pause/resume/cancel)
 */

import { computed } from 'vue';
import { useUploadState } from './useUploadState.js';
import { useUploadProcessor } from './useUploadProcessor.js';
import { useUploadOrchestrator } from './useUploadOrchestrator.js';
import { useUploadControls } from './useUploadControls.js';

/**
 * Upload Adapter Composable
 * @param {Object} params - Configuration parameters
 * @param {Ref<Array>} params.uploadQueue - The new upload queue ref
 * @param {Function} params.updateFileStatus - Function to update file status
 * @param {Function} params.showNotification - Function to show notifications (optional)
 * @returns {Object} Upload adapter functions
 */
export function useUploadAdapter({ uploadQueue, updateFileStatus, showNotification }) {
  // Initialize state management
  const state = useUploadState({ uploadQueue, showNotification });

  // Initialize file processor
  const processor = useUploadProcessor({ updateFileStatus });

  // Initialize orchestrator
  const orchestrator = useUploadOrchestrator({
    uploadQueue,
    notify: state.notify,
    getUploadableFiles: state.getUploadableFiles,
    processSingleFile: processor.processSingleFile,
    createCopyMetadataRecord: processor.createCopyMetadataRecord,
    startUpload: state.startUpload,
    completeUpload: state.completeUpload,
    uploadStartTime: state.uploadStartTime,
    uploadEndTime: state.uploadEndTime,
  });

  // Initialize controls
  const controls = useUploadControls({
    uploadQueue,
    updateFileStatus,
    notify: state.notify,
    uploadQueueFiles: orchestrator.uploadQueueFiles,
    orchestration: orchestrator.orchestration,
  });

  return {
    // State
    isUploading: state.isUploading,
    isPaused: computed(() => orchestrator.orchestration.isPaused.value),

    // Upload functions
    uploadQueueFiles: orchestrator.uploadQueueFiles,
    resumeUpload: controls.resumeUpload,
    pauseUpload: controls.pauseUpload,
    cancelUpload: controls.cancelUpload,
    retryFailedUploads: controls.retryFailedUploads,
    getUploadSummary: state.getUploadSummary,

    // Orchestration state (for UI)
    currentUploadIndex: computed(() => orchestrator.orchestration.currentUploadIndex.value),
  };
}
