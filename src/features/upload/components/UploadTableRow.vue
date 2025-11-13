<template>
  <div
    class="upload-table-row"
    :class="{
      'copy-file': file.status === 'copy',
      'has-copy-group': file.isCopy || file.status === 'copy',
    }"
    @dblclick="handleRowDoubleClick"
  >
    <!-- Select Column (60px) - FIRST COLUMN -->
    <SelectCell
      :file-status="file.status"
      :file-id="file.id"
      @toggle="handleCheckboxToggle"
      @remove="handleRemove"
      @swap="handleSwap"
    />

    <!-- File Type Icon Column (40px) - SECOND COLUMN -->
    <div
      class="row-cell file-type-cell"
      style="width: 40px; flex-shrink: 0; justify-content: center; padding: 9px 8px"
    >
      <!-- Show ⛔ emoji for same/duplicate files -->
      <span
        v-if="file.status === 'same'"
        class="not-uploadable-icon"
        title="Duplicate file - already in queue"
        >⛔</span
      >
      <!-- Show file type icon for all other files -->
      <FileTypeIcon v-else :file-name="file.name" />
    </div>

    <!-- File Name Column (flexible - expands to fill remaining space, max 500px) -->
    <FileNameCell
      :file-name="file.name"
      :file-status="file.status"
      :is-copy="file.isCopy"
      :source-file="file.sourceFile"
      @preview="openFile"
    />

    <!-- Size Column (100px fixed) -->
    <div
      class="row-cell size-cell"
      :class="{ 'faded-cell': file.status === 'same' }"
      style="width: 100px; flex-shrink: 0"
    >
      {{ formatFileSize(file.size) }}
    </div>

    <!-- Modified Column (120px fixed) -->
    <div
      class="row-cell modified-cell"
      :class="{ 'faded-cell': file.status === 'same' }"
      style="width: 120px; flex-shrink: 0"
      :title="modifiedDateTooltip"
    >
      {{ formatModifiedDate(file.sourceLastModified) }}
    </div>

    <!-- Folder Path Column (flexible - expands based on content, max 500px) -->
    <div
      class="row-cell path-cell"
      :class="{ 'faded-cell': file.status === 'same' }"
      style="flex: 1; min-width: 130px; max-width: 500px"
      :title="file.folderPath"
    >
      {{ file.folderPath || '/' }}
    </div>

    <!-- Status Column (120px fixed) -->
    <div class="row-cell status-cell-wrapper" style="width: 120px; flex-shrink: 0">
      <StatusCell :status="file.status" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SelectCell from './SelectCell.vue';
import FileNameCell from './FileNameCell.vue';
import StatusCell from './StatusCell.vue';
import FileTypeIcon from './FileTypeIcon.vue';
import { useFileFormatters } from '../composables/useFileFormatters.js';

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
const emit = defineEmits(['cancel', 'undo', 'remove', 'swap']);

// Use file formatters composable
const { formatFileSize, formatModifiedDate, getModifiedDateTooltip } = useFileFormatters();

// Formatted modified date tooltip
const modifiedDateTooltip = computed(() => {
  return getModifiedDateTooltip(props.file.sourceLastModified);
});

// Handle checkbox toggle from SelectCell
const handleCheckboxToggle = ({ fileId, isChecked }) => {
  if (isChecked) {
    // Checkbox was just checked - file should be included (undo skip if it was skipped)
    if (props.file.status === 'skip') {
      emit('undo', fileId);
    }
  } else {
    // Checkbox was just unchecked - file should be skipped
    emit('cancel', fileId);
  }
};

// Handle remove from SelectCell (for 'same' files)
const handleRemove = (fileId) => {
  emit('remove', fileId);
};

// Handle swap from SelectCell (for 'copy' files)
const handleSwap = (fileId) => {
  emit('swap', fileId);
};

// Open file locally on user's computer
const openFile = () => {
  if (props.file.sourceFile) {
    // Create a URL for the file object
    const fileUrl = URL.createObjectURL(props.file.sourceFile);

    // Open in new tab/window (browser will handle based on file type)
    window.open(fileUrl, '_blank');

    // Revoke the URL after a delay to free up memory
    setTimeout(() => {
      URL.revokeObjectURL(fileUrl);
    }, 100);

    console.log('[UploadTableRow] Opening file:', props.file.name);
  } else {
    console.warn('[UploadTableRow] No source file available for:', props.file.name);
  }
};

// Handle row double-click to open file
const handleRowDoubleClick = () => {
  openFile();
};
</script>

<style scoped>
.upload-table-row {
  display: flex;
  height: 48px; /* Must match ROW_HEIGHT in UploadTableVirtualizer.vue */
  border-bottom: 1px solid #e5e7eb;
  transition: background-color 0.15s ease;
  cursor: default;
}

/* Phase 3: Copy group visual indicator (left border) - REMOVED */
/* Purple left border removed per user request */

.upload-table-row:hover {
  background-color: #f9fafb;
}

.row-cell {
  padding: 9px 16px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* File Type Cell */
.file-type-cell {
  justify-content: center;
}

/* Not uploadable icon (⛔ emoji for duplicate files in file type column) */
.not-uploadable-icon {
  font-size: 20px;
  user-select: none;
  cursor: not-allowed;
}

/* Size Cell */
.size-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Modified Cell */
.modified-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Path Cell */
.path-cell {
  color: #6b7280;
  font-size: 0.875rem;
  font-family: 'Courier New', monospace;
}

/* Status Cell Wrapper */
.status-cell-wrapper {
  justify-content: flex-start;
}

/* Faded cell styling for 'same' status files */
.faded-cell {
  opacity: 0.4;
  color: #9ca3af;
}
</style>
