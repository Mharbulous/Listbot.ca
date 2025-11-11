<template>
  <div class="testing-page">
    <!-- Queue Progress Indicator (shown during large batch processing) -->
    <QueueProgressIndicator
      v-if="queueProgress.isQueueing"
      :processed="queueProgress.processed"
      :total="queueProgress.total"
    />

    <!-- Upload Table (ALWAYS SHOWN - contains integrated empty state) -->
    <div class="table-section">
      <!-- Upload Buttons (shown above table) -->
      <div class="table-header-actions">
        <v-menu location="bottom">
          <template v-slot:activator="{ props: menuProps }">
            <div class="split-button">
              <!-- Main action button -->
              <v-btn
                color="primary"
                size="large"
                variant="elevated"
                prepend-icon="mdi-plus"
                class="split-button-main"
                aria-label="Add files to upload queue"
                @click="triggerFileSelect"
              >
                Add to Queue
              </v-btn>

              <!-- Dropdown trigger -->
              <v-btn
                color="primary"
                size="large"
                variant="elevated"
                icon="mdi-menu-down"
                class="split-button-dropdown"
                aria-label="Show more upload options"
                v-bind="menuProps"
              />
            </div>
          </template>

          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-file-multiple"
              title="Queue Files"
              @click="triggerFileSelect"
            />
            <v-list-item
              prepend-icon="mdi-folder-open"
              title="Queue Folder"
              @click="triggerFolderSelect"
            />
            <v-list-item
              prepend-icon="mdi-folder-multiple"
              title="Queue Folder with Subfolders"
              @click="triggerFolderRecursiveSelect"
            />
          </v-list>
        </v-menu>
      </div>

      <!-- Upload Table with integrated empty state -->
      <UploadTable
        :files="uploadQueue"
        :is-empty="uploadQueue.length === 0"
        @cancel="handleCancelFile"
        @undo="handleUndoFile"
        @clear-queue="handleClearQueue"
        @upload="handleUpload"
        @files-dropped="handleFolderRecursiveSelected"
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
import { ref } from 'vue';
import QueueProgressIndicator from '../features/upload/components/QueueProgressIndicator.vue';
import UploadTable from '../features/upload/components/UploadTable.vue';
import { useUploadTable } from '../features/upload/composables/useUploadTable.js';

// Component configuration
defineOptions({
  name: 'TestingView',
});

// Composables
const { uploadQueue, queueProgress, addFilesToQueue, skipFile, undoSkip, clearQueue } = useUploadTable();

// Refs for file inputs
const fileInput = ref(null);
const folderInput = ref(null);
const folderRecursiveInput = ref(null);

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
.testing-page {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  padding: 2rem;
  overflow-y: auto;
}

.table-section {
  max-width: 1200px;
  margin: 0 auto;
}

.table-header-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 0 0.5rem;
}

.split-button {
  display: inline-flex;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.split-button-main {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 180px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
}

.split-button-dropdown {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  min-width: 48px !important;
  padding: 0 8px !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .testing-page {
    padding: 1rem;
  }

  .table-header-actions {
    padding: 0 1rem;
  }

  .split-button {
    width: 100%;
  }

  .split-button-main {
    flex: 1;
  }
}
</style>
