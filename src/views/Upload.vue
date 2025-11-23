<template>
  <div class="main-viewport">
    <!-- Queue Progress Indicator (shown during large batch processing) -->
    <QueueProgressIndicator
      v-if="queueProgress.isQueueing || queueProgress.cancelled"
      :processed="queueProgress.processed"
      :total="queueProgress.total"
      :cancelled="queueProgress.cancelled"
      :files-ready="queueProgress.filesReady"
      :files-copies="queueProgress.filesCopies"
      :files-duplicates="queueProgress.filesDuplicates"
      :files-unsupported="queueProgress.filesUnsupported"
      :files-read-error="queueProgress.filesReadError"
      @cancel="handleCancelQueue"
      @close="handleCloseModal"
    />

    <!-- Upload Table (ALWAYS SHOWN - contains integrated empty state) -->
    <UploadTable
        :files="filteredUploadQueue"
        :all-files="uploadQueue"
        :is-empty="uploadQueue.length === 0"
        :is-uploading="uploadAdapter.isUploading.value"
        :is-paused="uploadAdapter.isPaused.value"
        :duplicates-hidden="duplicatesHidden"
        :verification-state="verificationState"
        @cancel="handleCancelFile"
        @undo="handleUndoFile"
        @remove="handleRemoveFile"
        @swap="handleSwapFile"
        @upload="handleUpload"
        @clear-queue="handleClearQueue"
        @clear-duplicates="handleClearDuplicates"
        @clear-skipped="handleClearSkipped"
        @toggle-duplicates="handleToggleDuplicates"
        @files-dropped="handleFolderRecursiveSelected"
        @select-all="handleSelectAll"
        @deselect-all="handleDeselectAll"
        @pause="handlePause"
        @resume="handleResume"
        @cancel-upload="handleCancelUpload"
        @retry-failed="handleRetryFailed"
    />

    <!-- Hidden file inputs -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="*/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <input
      ref="folderRecursiveInput"
      type="file"
      webkitdirectory
      multiple
      style="display: none"
      @change="handleFolderRecursiveSelect"
    />


    <!-- Notification Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> Close </v-btn>
      </template>
    </v-snackbar>

    <!-- Upload Preview Modal (persistent during upload) -->
    <UploadPreviewModal
      :show="showPreviewModal"
      :summary="previewSummary"
      :persistent="uploadAdapter.isUploading.value"
      @confirm="handlePreviewConfirm"
      @cancel="handlePreviewCancel"
    />

    <!-- Upload Completion Modal -->
    <UploadCompletionModal
      :show="showCompletionModal"
      :metrics="completionMetrics"
      @close="handleCompletionClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import QueueProgressIndicator from '../features/upload/components/QueueProgressIndicator.vue';
import UploadTable from '../features/upload/components/UploadTable.vue';
import UploadPreviewModal from '../features/upload/components/UploadPreviewModal.vue';
import UploadCompletionModal from '../features/upload/components/UploadCompletionModal.vue';
import { useUploadTable } from '../features/upload/composables/useUploadTable.js';
import { useUploadAdapter } from '../features/upload/composables/useUploadAdapter.js';
import { useNotification } from '../core/composables/useNotification.js';
import { useSequentialVerification } from '../features/upload/composables/useSequentialVerification.js';
import { useQueueState } from '../features/upload/composables/useQueueState.js';

// Component configuration
defineOptions({
  name: 'UploadView',
});

// Composables
// Enable sequential deduplication for testing
const { uploadQueue, duplicatesHidden, queueProgress, addFilesToQueue, skipFile, undoSkip, removeFromQueue, clearQueue, clearDuplicates, clearSkipped, updateFileStatus, selectAll, deselectAll, swapCopyToPrimary, toggleDuplicatesVisibility, cancelQueue, sortQueueByGroupTimestamp, verifyHashesForCopiesAndDuplicates } =
  useUploadTable({ useSequentialDedup: true });
const { snackbar, showNotification } = useNotification();
const { queueAdditionComplete } = useQueueState();

// Enhanced upload queue with computed displayed status
// Copy files should show 'skip' status when their primary is skipped
// IMPORTANT: Must return original objects (not copies) to maintain reactivity
// for lazy hash verification updates
const enhancedUploadQueue = computed(() => {
  return uploadQueue.value.map(file => {
    // If this is a copy file, check if its primary is skipped
    if (file.status === 'copy' && file.hash) {
      // Find the primary file (same hash, status = 'ready' or 'skip')
      const primaryFile = uploadQueue.value.find(f =>
        f.hash === file.hash && (f.status === 'ready' || f.status === 'skip')
      );

      // If primary is skipped, display this copy as skipped too
      if (primaryFile && primaryFile.status === 'skip') {
        file.displayedStatus = 'skip';
        return file; // Return original object to maintain reactivity
      }
    }

    // Otherwise, display the actual status
    file.displayedStatus = file.status;
    return file; // Return original object to maintain reactivity
  });
});

// Filtered upload queue based on duplicatesHidden state
const filteredUploadQueue = computed(() => {
  if (!duplicatesHidden.value) {
    return enhancedUploadQueue.value;
  }
  // When duplicates are hidden, only show files that are NOT duplicates/copies
  // Show files with status: 'ready', 'skip', 'n/a', 'read error', 'error', 'completed', etc.
  // Hide files with status: 'duplicate', 'copy'
  return enhancedUploadQueue.value.filter((file) =>
    file.status !== 'duplicate' &&
    file.status !== 'copy'
  );
});

// Upload adapter
const uploadAdapter = useUploadAdapter({
  uploadQueue,
  updateFileStatus,
  showNotification,
});

// Sequential hash verification (auto-starts after queue rendering is complete)
// Calls Stage 2 hash verification to properly verify Copy/Duplicate files
const { verificationState } = useSequentialVerification(
  uploadQueue,
  removeFromQueue,
  sortQueueByGroupTimestamp,
  verifyHashesForCopiesAndDuplicates
);

// Refs for file inputs
const fileInput = ref(null);
const folderRecursiveInput = ref(null);

// Modal state
const showPreviewModal = ref(false);
const showCompletionModal = ref(false);
const previewSummary = ref({
  totalSelected: 0,
  uniqueFiles: 0,
  copies: 0,
  redundant: 0,
  readErrors: 0,
  toUpload: 0,
  metadataOnly: 0,
  storageSaved: 0,
});
const completionMetrics = ref({
  filesUploaded: 0,
  filesCopies: 0,
  copiesSkipped: 0,
  duplicatesSkipped: 0,
  totalFiles: 0,
  failedFiles: 0,
});
let uploadConfirmed = false;

// Listen for events from AppHeader
onMounted(() => {
  window.addEventListener('upload-trigger-file-select', triggerFileSelect);
  window.addEventListener('upload-trigger-folder-recursive-select', triggerFolderRecursiveSelect);
});

onUnmounted(() => {
  window.removeEventListener('upload-trigger-file-select', triggerFileSelect);
  window.removeEventListener('upload-trigger-folder-recursive-select', triggerFolderRecursiveSelect);
});

// File selection handlers
// NOTE: For file input events, T=0 is set in handleFileSelect/handleFolderRecursiveSelect
// For drag-and-drop events, T=0 is set here (since it bypasses the input handlers)
const handleFilesSelected = async (files) => {
  // Set T=0 if not already set (for drag-and-drop case)
  if (!window.queueT0) {
    window.queueT0 = performance.now();
    window.initialBatchComplete = false;
    queueAdditionComplete.value = false;
    window.queueAdditionComplete = false; // Keep for backward compatibility with metrics logging
    console.log('📊 [QUEUE METRICS] T=0.00ms - File selection started:', {
      filesSelected: files.length,
    });
  }
  await addFilesToQueue(files);
};

const handleFolderRecursiveSelected = async (files) => {
  // Set T=0 if not already set (for drag-and-drop case)
  if (!window.queueT0) {
    window.queueT0 = performance.now();
    window.initialBatchComplete = false;
    queueAdditionComplete.value = false;
    window.queueAdditionComplete = false; // Keep for backward compatibility with metrics logging
    console.log('📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive):', {
      filesSelected: files.length,
    });
  }
  await addFilesToQueue(files);
};

// File management handlers
const handleCancelFile = (fileId) => {
  console.log('[UPLOAD] Skip file:', fileId);
  skipFile(fileId);
};

const handleUndoFile = (fileId) => {
  console.log('[UPLOAD] Undo skip file:', fileId);
  undoSkip(fileId);
};

const handleRemoveFile = (fileId) => {
  console.log('[UPLOAD] Remove file from queue:', fileId);
  removeFromQueue(fileId);
};

const handleSwapFile = (fileId) => {
  console.log('[UPLOAD] Swap copy to primary:', fileId);
  swapCopyToPrimary(fileId);
};

const handleClearQueue = () => {
  console.log('[UPLOAD] Clear queue');
  clearQueue();
};

const handleClearDuplicates = () => {
  console.log('[UPLOAD] Clear duplicates');
  clearDuplicates();
};

const handleClearSkipped = () => {
  console.log('[UPLOAD] Clear skipped files');
  clearSkipped();
};

const handleToggleDuplicates = () => {
  console.log('[UPLOAD] Toggle duplicates visibility');
  toggleDuplicatesVisibility();
};

const handleCancelQueue = () => {
  console.log('[UPLOAD] Cancel queue');
  cancelQueue();
};
const handleCloseModal = () => {
  console.log('[UPLOAD] Close modal');
  queueProgress.value.cancelled = false;
  queueProgress.value.isQueueing = false;
};

const handleUpload = async () => {
  console.log('[UPLOAD] Upload clicked');

  // Calculate preview summary
  const readyFiles = uploadQueue.value.filter(f => f.status === 'ready');
  const copyFiles = uploadQueue.value.filter(f => f.status === 'copy');
  const duplicateFiles = uploadQueue.value.filter(f => f.status === 'duplicate');
  const readErrorFiles = uploadQueue.value.filter(f => f.status === 'read error');

  previewSummary.value = {
    totalSelected: uploadQueue.value.length,
    uniqueFiles: readyFiles.length,
    copies: copyFiles.length,
    redundant: duplicateFiles.length,
    readErrors: readErrorFiles.length,
    toUpload: readyFiles.length,
    metadataOnly: copyFiles.length,
    storageSaved: 0, // Phase 3b: Removed per plan
  };

  // Show preview modal
  uploadConfirmed = false;
  showPreviewModal.value = true;

  // Wait for user confirmation (handled by modal emits)
};

const handlePreviewConfirm = async () => {
  showPreviewModal.value = false;
  uploadConfirmed = true;

  try {
    const result = await uploadAdapter.uploadQueueFiles();
    console.log('[UPLOAD] Upload result:', result);

    // Show completion modal
    if (result.metrics) {
      completionMetrics.value = result.metrics;
      showCompletionModal.value = true;
    }
  } catch (error) {
    console.error('[UPLOAD] Upload error:', error);
  }
};

const handlePreviewCancel = () => {
  showPreviewModal.value = false;
  uploadConfirmed = false;
};

const handleCompletionClose = () => {
  showCompletionModal.value = false;
};

const handleSelectAll = () => {
  console.log('[UPLOAD] Select all files');
  selectAll();
};

const handleDeselectAll = () => {
  console.log('[UPLOAD] Deselect all files');
  deselectAll();
};

// Upload control handlers
const handlePause = () => {
  console.log('[UPLOAD] Pause upload');
  uploadAdapter.pauseUpload();
};

const handleResume = async () => {
  console.log('[UPLOAD] Resume upload');
  try {
    const result = await uploadAdapter.resumeUpload();
    console.log('[UPLOAD] Resume result:', result);
  } catch (error) {
    console.error('[UPLOAD] Resume error:', error);
  }
};

const handleCancelUpload = () => {
  console.log('[UPLOAD] Cancel upload');
  uploadAdapter.cancelUpload();
};

const handleRetryFailed = async () => {
  console.log('[UPLOAD] Retry failed uploads');
  try {
    const result = await uploadAdapter.retryFailedUploads();
    console.log('[UPLOAD] Retry result:', result);
  } catch (error) {
    console.error('[UPLOAD] Retry error:', error);
  }
};

// Trigger file/folder selection for buttons in table header
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const triggerFolderRecursiveSelect = () => {
  folderRecursiveInput.value?.click();
};

// File input change handlers for table header buttons
const handleFileSelect = (event) => {
  // Set T=0 IMMEDIATELY when change event fires (before Array.from which can be slow)
  window.queueT0 = performance.now();
  window.initialBatchComplete = false;
  queueAdditionComplete.value = false;
  window.queueAdditionComplete = false; // Keep for backward compatibility with metrics logging

  const files = Array.from(event.target.files);
  if (files.length > 0) {
    console.log('📊 [QUEUE METRICS] T=0.00ms - File selection started:', {
      filesSelected: files.length,
    });
    handleFilesSelected(files);
  }
  // Reset input
  event.target.value = '';
};

const handleFolderRecursiveSelect = (event) => {
  // Set T=0 IMMEDIATELY when change event fires (before Array.from which can be slow)
  window.queueT0 = performance.now();
  window.initialBatchComplete = false;
  queueAdditionComplete.value = false;
  window.queueAdditionComplete = false; // Keep for backward compatibility with metrics logging

  const allFiles = Array.from(event.target.files);
  if (allFiles.length === 0) return;

  const arrayFromElapsed = performance.now() - window.queueT0;
  const folderName = allFiles[0].webkitRelativePath.split('/')[0];
  console.log('📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive):', {
    filesSelected: allFiles.length,
  });
  console.log(`📊 [QUEUE METRICS] T=${arrayFromElapsed.toFixed(2)}ms - Array.from(FileList) completed`);
  console.log(`[FOLDER+] Recursive: ${allFiles.length} files from ${folderName}`);
  handleFolderRecursiveSelected(allFiles);

  // Reset input
  event.target.value = '';
};
</script>

<style scoped>
.main-viewport {
  height: calc(100vh - 80px); /* Full viewport height minus AppHeader (pt-20 = 80px) */
  width: 100%; /* Full width of parent */
  background: #FCFCF5;
  padding: 0; /* No padding - table fills entire viewport */
  overflow: hidden; /* Prevent page-level scrolling */
  display: flex;
  flex-direction: column;
}
</style>
