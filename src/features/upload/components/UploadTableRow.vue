<template>
  <div class="upload-table-row">
    <!-- Actions Column (100px - matches Skip column) -->
    <div class="row-cell actions-cell" style="width: 100px; flex-shrink: 0">
      <button class="action-btn" title="Preview file" disabled>👁️</button>
      <button class="action-btn" title="Upload now" disabled>⬆️</button>
    </div>

    <!-- Size Column (100px) -->
    <div class="row-cell size-cell" style="width: 100px; flex-shrink: 0">
      {{ formatFileSize(file.size) }}
    </div>

    <!-- File Name Column (flexible - expands to fill remaining space) -->
    <div class="row-cell filename-cell" style="flex: 1; min-width: 150px" :title="file.name">
      {{ file.name }}
    </div>

    <!-- Folder Path Column (130px) -->
    <div class="row-cell path-cell" style="width: 130px; flex-shrink: 0" :title="file.folderPath">
      {{ file.folderPath || '/' }}
    </div>

    <!-- Status Column (100px) -->
    <div class="row-cell status-cell-wrapper" style="width: 100px; flex-shrink: 0">
      <StatusCell :status="file.status" />
    </div>

    <!-- Skip Column (adjusted for scrollbar width) -->
    <div
      class="row-cell skip-cell"
      :style="{ width: `${skipColumnWidth}px`, flexShrink: 0 }"
      <button
        class="skip-btn"
        :disabled="file.status === 'completed'"
        @click="handleCancel"
        :title="file.status === 'completed' ? 'Already uploaded' : 'Skip this file'"
      >
        ⏭️
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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
  scrollbarWidth: {
    type: Number,
    default: 0,
  },
});

// Emits
const emit = defineEmits(['cancel', 'undo']);

// Compute adjusted skip column width to account for scrollbar
const skipColumnWidth = computed(() => {
  // Base width is 100px, reduce by scrollbar width
  return Math.max(100 - props.scrollbarWidth, 30); // Minimum 30px
});

// Compute button icon based on file status
const getButtonIcon = computed(() => {
  if (props.file.status === 'completed') {
    return '🗑️';
  } else if (props.file.status === 'skip') {
    return '↩️';
  } else {
    return '❌';
  }
});

// Compute button title based on file status
const getButtonTitle = computed(() => {
  if (props.file.status === 'completed') {
    return 'Already uploaded';
  } else if (props.file.status === 'skip') {
    return 'Undo skip';
  } else {
    return 'Cancel upload';
  }
});

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Handle cancel or undo based on current status
const handleCancelOrUndo = () => {
  if (props.file.status === 'skip') {
    emit('undo', props.file.id);
  } else {
    emit('cancel', props.file.id);
  }
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

/* Skip Cell */
.skip-cell {
  justify-content: center;
}

.skip-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0.25rem;
  transition: transform 0.2s ease;
}

.skip-btn:not(:disabled):hover {
  transform: scale(1.2);
}

.skip-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
