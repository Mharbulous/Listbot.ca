<template>
  <div class="main-viewport">
    <!-- Queue Progress Indicator (shown during large batch processing) -->
    <QueueProgressIndicator
      v-if="queueProgress.isQueueing"
      :processed="queueProgress.processed"
      :total="queueProgress.total"
    />

    <!-- Upload Table (ALWAYS SHOWN - contains integrated empty state) -->
    <div class="table-section">
      <!-- Upload Table with integrated empty state -->
      <UploadTable
        :files="uploadQueue"
        :is-empty="uploadQueue.length === 0"
        @cancel="handleCancelFile"
        @undo="handleUndoFile"
        @upload="handleUpload"
        @clear-queue="handleClearQueue"
        @files-dropped="handleFolderRecursiveSelected"
        @select-all="handleSelectAll"
        @deselect-all="handleDeselectAll"
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
        ref="folderInput"
        type="file"
        webkitdirectory
        multiple
        style="display: none"
        @change="handleFolderSelect"
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import QueueProgressIndicator from '../features/upload/components/QueueProgressIndicator.vue';
import UploadTable from '../features/upload/components/UploadTable.vue';
import { useUploadTable } from '../features/upload/composables/useUploadTable.js';

// Component configuration
defineOptions({
  name: 'TestingView',
});

// Composables
const { uploadQueue, queueProgress, addFilesToQueue, skipFile, undoSkip, clearQueue, selectAll, deselectAll } =
  useUploadTable();

// Refs for file inputs
const fileInput = ref(null);
const folderInput = ref(null);
const folderRecursiveInput = ref(null);

// Listen for events from AppHeader
onMounted(() => {
  window.addEventListener('testing-trigger-file-select', triggerFileSelect);
  window.addEventListener('testing-trigger-folder-select', triggerFolderSelect);
  window.addEventListener('testing-trigger-folder-recursive-select', triggerFolderRecursiveSelect);
});

onUnmounted(() => {
  window.removeEventListener('testing-trigger-file-select', triggerFileSelect);
  window.removeEventListener('testing-trigger-folder-select', triggerFolderSelect);
  window.removeEventListener('testing-trigger-folder-recursive-select', triggerFolderRecursiveSelect);
});

// File selection handlers
const handleFilesSelected = async (files) => {
  console.log('[TESTING] Files selected:', files.length);
  await addFilesToQueue(files);
};

const handleFolderSelected = async (files) => {
  console.log('[TESTING] Folder selected (root only):', files.length);
  await addFilesToQueue(files);
};

const handleFolderRecursiveSelected = async (files) => {
  console.log('[TESTING] Folder + subfolders selected:', files.length);
  await addFilesToQueue(files);
};

// File management handlers
const handleCancelFile = (fileId) => {
  console.log('[TESTING] Skip file:', fileId);
  skipFile(fileId);
};

const handleUndoFile = (fileId) => {
  console.log('[TESTING] Undo skip file:', fileId);
  undoSkip(fileId);
};

const handleClearQueue = () => {
  console.log('[TESTING] Clear queue');
  clearQueue();
};

const handleUpload = () => {
  console.log('[TESTING] Upload clicked');
  // TODO: Implement upload logic
};

const handleSelectAll = () => {
  console.log('[TESTING] Select all files');
  selectAll();
};

const handleDeselectAll = () => {
  console.log('[TESTING] Deselect all files');
  deselectAll();
};

// Trigger file/folder selection for buttons in table header
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const triggerFolderSelect = () => {
  folderInput.value?.click();
};

const triggerFolderRecursiveSelect = () => {
  folderRecursiveInput.value?.click();
};

// File input change handlers for table header buttons
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    handleFilesSelected(files);
  }
  // Reset input
  event.target.value = '';
};

const handleFolderSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  if (allFiles.length === 0) return;

  // Filter for root-only files
  const rootPath = allFiles[0].webkitRelativePath.split('/')[0];
  const rootFiles = allFiles.filter((file) => {
    const parts = file.webkitRelativePath.split('/');
    return parts.length === 2 && parts[0] === rootPath;
  });

  console.log(`[FOLDER] Root only: ${rootFiles.length} files from ${rootPath}`);
  handleFolderSelected(rootFiles);

  // Reset input
  event.target.value = '';
};

const handleFolderRecursiveSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  if (allFiles.length === 0) return;

  const folderName = allFiles[0].webkitRelativePath.split('/')[0];
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
  min-height: 0; /* Allow flex shrinking */
}
</style>
