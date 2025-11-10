<template>
  <div class="upload-table-row">
    <!-- Actions Column (100px) -->
    <div class="row-cell actions-cell" style="width: 100px">
      <button class="action-btn" title="Preview file" disabled>👁️</button>
      <button class="action-btn" title="Upload now" disabled>⬆️</button>
    </div>

    <!-- File Name Column (300px) -->
    <div class="row-cell filename-cell" style="width: 300px" :title="file.name">
      {{ file.name }}
    </div>

    <!-- Size Column (100px) -->
    <div class="row-cell size-cell" style="width: 100px">
      {{ formatFileSize(file.size) }}
    </div>

    <!-- Status Column (180px) -->
    <div class="row-cell status-cell-wrapper" style="width: 180px">
      <StatusCell :status="file.status" />
    </div>

    <!-- Folder Path Column (300px) -->
    <div class="row-cell path-cell" style="width: 300px" :title="file.folderPath">
      {{ file.folderPath || '/' }}
    </div>

    <!-- Cancel Column (80px) -->
    <div class="row-cell cancel-cell" style="width: 80px">
      <button
        class="cancel-btn"
        :disabled="file.status === 'completed'"
        @click="handleCancel"
        :title="file.status === 'completed' ? 'Already uploaded' : 'Cancel upload'"
      >
        {{ file.status === 'completed' ? '🗑️' : '❌' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import StatusCell from './StatusCell.vue';

// Component configuration
defineOptions({
  name: 'UploadTableRow',
});

// Props
const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
});

// Emits
const emit = defineEmits(['cancel']);

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Handle cancel
const handleCancel = () => {
  emit('cancel', props.file.id);
};
</script>

<style scoped>
.upload-table-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s ease;
}

.upload-table-row:hover {
  background-color: #f9fafb;
}

.row-cell {
  padding: 12px 16px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Actions Cell */
.actions-cell {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: transform 0.2s ease;
}

.action-btn:not(:disabled):hover {
  transform: scale(1.2);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* File Name Cell */
.filename-cell {
  font-weight: 500;
  color: #1f2937;
}

/* Size Cell */
.size-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Status Cell Wrapper */
.status-cell-wrapper {
  justify-content: flex-start;
}

/* Path Cell */
.path-cell {
  color: #6b7280;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

/* Cancel Cell */
.cancel-cell {
  justify-content: center;
}

.cancel-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: transform 0.2s ease;
}

.cancel-btn:not(:disabled):hover {
  transform: scale(1.2);
}

.cancel-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
