<template>
  <div class="testing-page">
    <!-- Upload Buttons Section (shown when queue is empty) -->
    <UploadButtons
      v-if="uploadQueue.length === 0"
      @files-selected="handleFilesSelected"
      @folder-selected="handleFolderSelected"
      @folder-recursive-selected="handleFolderRecursiveSelected"
    />

    <!-- Queue Progress Indicator (shown during large batch processing) -->
    <QueueProgressIndicator
      v-if="queueProgress.isQueueing"
      :processed="queueProgress.processed"
      :total="queueProgress.total"
    />

    <!-- Upload Table (shown when queue has files) -->
    <div v-if="uploadQueue.length > 0" class="table-section">
      <div class="table-header-actions">
        <h2 class="table-title">Upload Queue ({{ uploadQueue.length }} files)</h2>
        <v-btn color="error" variant="outlined" size="small" @click="handleClearQueue"> Clear Queue </v-btn>
      </div>

      <UploadTable :files="uploadQueue" @cancel="handleCancelFile" />
    </div>
  </div>
</template>

<script setup>
import UploadButtons from '../features/upload/components/UploadButtons.vue';
import QueueProgressIndicator from '../features/upload/components/QueueProgressIndicator.vue';
import UploadTable from '../features/upload/components/UploadTable.vue';
import { useUploadTable } from '../features/upload/composables/useUploadTable.js';

// Component configuration
defineOptions({
  name: 'TestingView',
});

// Composables
const { uploadQueue, queueProgress, addFilesToQueue, removeFromQueue, clearQueue } = useUploadTable();

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
  console.log('[TESTING] Cancel file:', fileId);
  removeFromQueue(fileId);
};

const handleClearQueue = () => {
  console.log('[TESTING] Clear queue');
  clearQueue();
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.table-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .testing-page {
    padding: 1rem;
  }

  .table-header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .table-title {
    font-size: 1.25rem;
  }
}
</style>
