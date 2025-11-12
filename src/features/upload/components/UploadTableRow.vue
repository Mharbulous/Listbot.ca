<template>
  <div class="upload-table-row" @dblclick="handleRowDoubleClick">
    <!-- Select Column (60px) - FIRST COLUMN -->
    <div class="row-cell select-cell" style="width: 60px; flex-shrink: 0; justify-content: center">
      <!-- Show ⛔ emoji for unsupported files (n/a status) -->
      <span v-if="file.status === 'n/a'" class="not-uploadable-icon" title="File type not supported">⛔</span>
      <!-- Show checkbox for all other files -->
      <input
        v-else
        type="checkbox"
        class="file-checkbox"
        :checked="isSelected"
        :disabled="file.status === 'completed'"
        @change="handleCheckboxToggle"
        :title="checkboxTitle"
        :aria-label="checkboxTitle"
      />
    </div>

    <!-- File Type Icon Column (40px) - SECOND COLUMN -->
    <div class="row-cell file-type-cell" style="width: 40px; flex-shrink: 0; justify-content: center; padding: 9px 8px">
      <FileTypeIcon :file-name="file.name" />
    </div>

    <!-- File Name Column (flexible - expands to fill remaining space, max 500px) -->
    <div
      class="row-cell filename-cell"
      style="flex: 1; min-width: 150px; max-width: 500px"
      :title="file.name"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <span class="filename-text">{{ file.name }}</span>
      <span v-if="isHovering" class="eyeball-icon" @click="openFile" title="Preview file">👁️</span>
    </div>

    <!-- Size Column (100px fixed) -->
    <div class="row-cell size-cell" style="width: 100px; flex-shrink: 0">
      {{ formatFileSize(file.size) }}
    </div>

    <!-- Folder Path Column (flexible - expands based on content, max 500px) -->
    <div class="row-cell path-cell" style="flex: 1; min-width: 130px; max-width: 500px" :title="file.folderPath">
      {{ file.folderPath || '/' }}
    </div>

    <!-- Modified Column (140px fixed) -->
    <div
      class="row-cell modified-cell"
      style="width: 140px; flex-shrink: 0"
      :title="modifiedDateTooltip"
    >
      {{ formatModifiedDate(file.sourceLastModified) }}
    </div>

    <!-- Status Column (100px fixed) -->
    <div class="row-cell status-cell-wrapper" style="width: 100px; flex-shrink: 0">
      <StatusCell :status="file.status" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import StatusCell from './StatusCell.vue';
import FileTypeIcon from './FileTypeIcon.vue';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';
import { formatDate, formatTime } from '@/utils/dateFormatter.js';

// Component configuration
defineOptions({
  name: 'UploadTableRow',
});

// User preferences for date/time formatting
const preferencesStore = useUserPreferencesStore();
const { dateFormat, timeFormat } = storeToRefs(preferencesStore);

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

// Hover state tracking
const isHovering = ref(false);

// Formatted modified date tooltip using user preferences
const modifiedDateTooltip = computed(() => {
  if (!props.file.sourceLastModified) return 'Unknown';
  const date = formatDate(props.file.sourceLastModified, dateFormat.value);
  const time = formatTime(props.file.sourceLastModified, timeFormat.value);
  return `${date} at ${time}`;
});

// Compute checkbox checked state - checked means file will be uploaded (NOT skipped)
const isSelected = computed(() => {
  return props.file.status !== 'skip';
});

// Compute checkbox title for accessibility
const checkboxTitle = computed(() => {
  if (props.file.status === 'completed') {
    return 'Already uploaded';
  } else if (props.file.status === 'skip') {
    return 'File skipped - check to include in upload';
  } else {
    return 'Include file in upload';
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

// Format modified date using user preferences
const formatModifiedDate = (timestamp) => {
  if (!timestamp) return '—';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // If modified today, show time only using user's time format preference
  if (diffDays === 0) {
    return formatTime(timestamp, timeFormat.value);
  }

  // If modified within last 7 days, show "X days ago" (format-independent)
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  // Otherwise show date using user's date format preference
  return formatDate(timestamp, dateFormat.value);
};

// Handle checkbox toggle
const handleCheckboxToggle = (event) => {
  const isChecked = event.target.checked;

  if (isChecked) {
    // Checkbox was just checked - file should be included (undo skip if it was skipped)
    if (props.file.status === 'skip') {
      emit('undo', props.file.id);
    }
  } else {
    // Checkbox was just unchecked - file should be skipped
    emit('cancel', props.file.id);
  }
};

// Open file locally on user's computer
const openFile = (event) => {
  event.stopPropagation(); // Prevent triggering row double-click

  if (props.file.sourceFile) {
    // Create a URL for the file object
    const fileUrl = URL.createObjectURL(props.file.sourceFile);

    // Open in new tab/window (browser will handle based on file type)
    const newWindow = window.open(fileUrl, '_blank');

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
  openFile({ stopPropagation: () => {} }); // Create mock event object
};

// Handle mouse enter/leave for hover state
const handleMouseEnter = () => {
  isHovering.value = true;
};

const handleMouseLeave = () => {
  isHovering.value = false;
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

/* Select Cell */
.select-cell {
  justify-content: center;
  padding: 9px 8px;
}

/* Not uploadable icon (⛔ emoji for unsupported files) */
.not-uploadable-icon {
  font-size: 20px;
  user-select: none;
  cursor: not-allowed;
}

/* Checkbox Styling with Dark Green Checkmark in White Box with Black Border */
.file-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  border: 1px solid #000000;
  border-radius: 3px;
  transition: all 0.25s ease;
  position: relative;
  flex-shrink: 0;
}

.file-checkbox:checked {
  background-color: white;
  border-color: #000000;
}

.file-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #2196f3; /* Blue checkmark to match ready status */
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

/* Modern hover effect: subtle glow and border color change */
@media (hover: hover) {
  .file-checkbox:hover:not(:disabled) {
    border-color: #2196f3;
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1), 0 0 8px rgba(33, 150, 243, 0.15);
  }
}

/* Focus state for keyboard navigation */
.file-checkbox:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.file-checkbox:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

/* File Name Cell */
.filename-cell {
  font-weight: 500;
  color: #1f2937;
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: default;
}

.filename-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.eyeball-icon {
  flex-shrink: 0;
  cursor: pointer;
  font-size: 1rem;
  user-select: none;
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

/* Modified Cell */
.modified-cell {
  color: #6b7280;
  font-size: 0.875rem;
}
</style>
