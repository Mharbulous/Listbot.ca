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
    <div class="table-section">
      <!-- Upload Table with integrated empty state -->
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
    </div>


    <!-- Notification Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import QueueProgressIndicator from '../features/upload/components/QueueProgressIndicator.vue';
import UploadTable from '../features/upload/components/UploadTable.vue';
import { useUploadTable } from '../features/upload/composables/useUploadTable.js';
import { useUploadAdapter } from '../features/upload/composables/useUploadAdapter.js';
import { useNotification } from '../core/composables/useNotification.js';
import { useTentativeVerification } from '../features/upload/composables/useTentativeVerification.js';

// Component configuration
defineOptions({
  name: 'Uploadv2View',
});

// Composables
const { uploadQueue, duplicatesHidden, queueProgress, addFilesToQueue, skipFile, undoSkip, removeFromQueue, clearQueue, clearDuplicates, clearSkipped, updateFileStatus, selectAll, deselectAll, swapCopyToPrimary, toggleDuplicatesVisibility, cancelQueue, sortQueueByGroupTimestamp } =
  useUploadTable();
const { snackbar, showNotification } = useNotification();

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

// Tentative file verification (auto-starts after queue rendering is complete)
const { verificationState } = useTentativeVerification(uploadQueue, removeFromQueue, sortQueueByGroupTimestamp);

// Refs for file inputs
const fileInput = ref(null);
const folderRecursiveInput = ref(null);

// Listen for events from AppHeader
onMounted(() => {
  window.addEventListener('uploadv2-trigger-file-select', triggerFileSelect);
  window.addEventListener('uploadv2-trigger-folder-recursive-select', triggerFolderRecursiveSelect);
});

onUnmounted(() => {
  window.removeEventListener('uploadv2-trigger-file-select', triggerFileSelect);
  window.removeEventListener('uploadv2-trigger-folder-recursive-select', triggerFolderRecursiveSelect);
});

// File selection handlers
// NOTE: For file input events, T=0 is set in handleFileSelect/handleFolderRecursiveSelect
// For drag-and-drop events, T=0 is set here (since it bypasses the input handlers)
const handleFilesSelected = async (files) => {
  // Set T=0 if not already set (for drag-and-drop case)
  if (!window.queueT0) {
    window.queueT0 = performance.now();
    window.initialBatchComplete = false;
    window.queueAdditionComplete = false;
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
    window.queueAdditionComplete = false;
    console.log('📊 [QUEUE METRICS] T=0.00ms - Folder selection started (recursive):', {
      filesSelected: files.length,
    });
  }
  await addFilesToQueue(files);
};

// File management handlers
const handleCancelFile = (fileId) => {
  console.log('[UPLOADV2] Skip file:', fileId);
  skipFile(fileId);
};

const handleUndoFile = (fileId) => {
  console.log('[UPLOADV2] Undo skip file:', fileId);
  undoSkip(fileId);
};

const handleRemoveFile = (fileId) => {
  console.log('[UPLOADV2] Remove file from queue:', fileId);
  removeFromQueue(fileId);
};

const handleSwapFile = (fileId) => {
  console.log('[UPLOADV2] Swap copy to primary:', fileId);
  swapCopyToPrimary(fileId);
};

const handleClearQueue = () => {
  console.log('[UPLOADV2] Clear queue');
  clearQueue();
};

const handleClearDuplicates = () => {
  console.log('[UPLOADV2] Clear duplicates');
  clearDuplicates();
};

const handleClearSkipped = () => {
  console.log('[UPLOADV2] Clear skipped files');
  clearSkipped();
};

const handleToggleDuplicates = () => {
  console.log('[UPLOADV2] Toggle duplicates visibility');
  toggleDuplicatesVisibility();
};

const handleCancelQueue = () => {
  console.log('[UPLOADV2] Cancel queue');
  cancelQueue();
};
const handleCloseModal = () => {
  console.log('[UPLOADV2] Close modal');
  queueProgress.value.cancelled = false;
  queueProgress.value.isQueueing = false;
};

const handleUpload = async () => {
  console.log('[UPLOADV2] Upload clicked');
  try {
    const result = await uploadAdapter.uploadQueueFiles();
    console.log('[UPLOADV2] Upload result:', result);
  } catch (error) {
    console.error('[UPLOADV2] Upload error:', error);
  }
};

const handleSelectAll = () => {
  console.log('[UPLOADV2] Select all files');
  selectAll();
};

const handleDeselectAll = () => {
  console.log('[UPLOADV2] Deselect all files');
  deselectAll();
};

// Upload control handlers
const handlePause = () => {
  console.log('[UPLOADV2] Pause upload');
  uploadAdapter.pauseUpload();
};

const handleResume = async () => {
  console.log('[UPLOADV2] Resume upload');
  try {
    const result = await uploadAdapter.resumeUpload();
    console.log('[UPLOADV2] Resume result:', result);
  } catch (error) {
    console.error('[UPLOADV2] Resume error:', error);
  }
};

const handleCancelUpload = () => {
  console.log('[UPLOADV2] Cancel upload');
  uploadAdapter.cancelUpload();
};

const handleRetryFailed = async () => {
  console.log('[UPLOADV2] Retry failed uploads');
  try {
    const result = await uploadAdapter.retryFailedUploads();
    console.log('[UPLOADV2] Retry result:', result);
  } catch (error) {
    console.error('[UPLOADV2] Retry error:', error);
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
  window.queueAdditionComplete = false;

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
  window.queueAdditionComplete = false;

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
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  padding: 0; /* No padding - table fills entire viewport */
  overflow: hidden; /* Prevent page-level scrolling */
  display: flex;
  flex-direction: column;
}

.table-section {
  flex: 1; /* Take up remaining space */
  /* Removed width: 100% to allow table to size based on content, not viewport */
  display: flex;
  flex-direction: column;
  align-items: center; /* Center the upload-table-container horizontally */
  overflow-x: auto; /* Add horizontal scrollbar when table exceeds viewport width */
  min-height: 0; /* Allow flex shrinking */
}
</style>
