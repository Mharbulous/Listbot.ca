<template>
  <div class="upload-table-container">
    <!-- Wrapper for drag-and-drop handling (positioned relative for absolute overlay) -->
    <div
      class="table-positioning-wrapper"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent.stop="handleDrop"
    >
      <!-- Drag overlay - positioned absolutely over entire table -->
      <div v-if="isDragOver" class="drag-overlay">
        <div class="drag-overlay-content">
          <v-icon icon="mdi-cloud-upload-outline" size="64" color="primary" class="drag-overlay-icon" />
          <p class="drag-overlay-text-primary">Drop files or folders to add to queue</p>
          <p class="drag-overlay-text-secondary">Release to add files to the upload queue</p>
        </div>
      </div>

      <!-- VIRTUALIZED CONTENT (handles both empty and populated states) -->
      <UploadTableVirtualizer
        ref="virtualizerRef"
        :files="props.files"
        :all-selected="allFilesSelected"
        :some-selected="someFilesSelected"
        :footer-stats="footerStats"
        :is-uploading="props.isUploading"
        :is-paused="props.isPaused"
        :duplicates-hidden="props.duplicatesHidden"
        :get-group-background="getGroupBackgroundColor"
        :is-first-in-group="isFirstInGroup"
        :is-last-in-group="isLastInGroup"
        @cancel="handleCancel"
        @undo="handleUndo"
        @remove="handleRemove"
        @swap="handleSwap"
        @select-all="handleSelectAll"
        @deselect-all="handleDeselectAll"
        @upload="handleUpload"
        @clear-queue="handleClearQueue"
        @clear-duplicates="handleClearDuplicates"
        @clear-skipped="handleClearSkipped"
        @toggle-duplicates="handleToggleDuplicates"
        @pause="handlePause"
        @resume="handleResume"
        @cancel-upload="handleCancelUpload"
        @retry-failed="handleRetryFailed"
      />
    </div>

    <!-- Accessibility: Live region for state changes -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ props.isEmpty ? 'Upload queue is empty. Drag and drop files or use the + Add to Queue button in the top left of the header to add files.' : `${props.files.length} files in upload queue` }}
    </div>

    <!-- Error Dialog for Multiple Items -->
    <v-dialog v-model="showMultiDropError" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Multiple Folders Not Supported</v-card-title>
        <v-card-text class="text-body-1">
          Dragging and dropping multiple folders is not permitted. Please drag and drop one folder at a time. You can drag and drop multiple files at once.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="showMultiDropError = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import UploadTableVirtualizer from './UploadTableVirtualizer.vue';
import { useFileDropHandler } from '../composables/useFileDropHandler';
import { getGroupBackgroundColor, isFirstInGroup, isLastInGroup } from '../composables/useGroupStyling';

// Component configuration
defineOptions({
  name: 'UploadTable',
});

// Props
const props = defineProps({
  files: {
    type: Array,
    required: true,
    default: () => [],
  },
  isEmpty: {
    type: Boolean,
    default: false,
  },
  isUploading: {
    type: Boolean,
    default: false,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  duplicatesHidden: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'remove', 'swap', 'upload', 'clear-queue', 'clear-duplicates', 'clear-skipped', 'toggle-duplicates', 'files-dropped', 'select-all', 'deselect-all', 'pause', 'resume', 'cancel-upload', 'retry-failed']);

// ============================================================================
// DRAG AND DROP HANDLING
// ============================================================================
const {
  isDragOver,
  showMultiDropError,
  handleDragOver: handleDragOverBase,
  handleDragLeave: handleDragLeaveBase,
  handleDrop: handleDropBase,
} = useFileDropHandler();

// Wrap drag handlers to emit files
const handleDragOver = () => {
  handleDragOverBase();
};

const handleDragLeave = (event) => {
  handleDragLeaveBase(event);
};

const handleDrop = (event) => {
  handleDropBase(event, (files) => {
    emit('files-dropped', files);
  });
};

// Refs
const virtualizerRef = ref(null); // For virtualized content

// Selection state for Select All checkbox
const allFilesSelected = computed(() => {
  if (props.files.length === 0) return false;
  // Filter out completed, redundant, n/a, duplicate, and read error files (can't be toggled - checkboxes disabled)
  const selectableFiles = props.files.filter(
    (f) => f.status !== 'completed' && f.status !== 'redundant' && f.status !== 'n/a' && f.status !== 'duplicate' && f.status !== 'read error'
  );
  if (selectableFiles.length === 0) return false;
  // All selectable files must NOT be skipped
  return selectableFiles.every((f) => f.status !== 'skip');
});

const someFilesSelected = computed(() => {
  if (props.files.length === 0) return false;
  const selectableFiles = props.files.filter(
    (f) => f.status !== 'completed' && f.status !== 'redundant' && f.status !== 'n/a' && f.status !== 'duplicate' && f.status !== 'read error'
  );
  if (selectableFiles.length === 0) return false;
  const selectedCount = selectableFiles.filter((f) => f.status !== 'skip').length;
  // Some (but not all) files are selected
  return selectedCount > 0 && selectedCount < selectableFiles.length;
});

// Handle Select All
const handleSelectAll = () => {
  emit('select-all');
};

// Handle Deselect All
const handleDeselectAll = () => {
  emit('deselect-all');
};

// Footer stats
const footerStats = computed(() => {
  const total = props.files.length;
  const totalSize = props.files.reduce((sum, f) => sum + (f.size || 0), 0);
  const ready = props.files.filter((f) => f.status === 'ready').length;
  const removed = props.files.filter((f) => f.status === 'skip').length;
  const duplicates = props.files.filter((f) => f.status === 'skipped' || f.status === 'duplicate').length;
  const redundantFiles = props.files.filter((f) => f.status === 'redundant').length;
  const failed = props.files.filter((f) => f.status === 'error').length;
  const uploaded = props.files.filter((f) => f.status === 'completed').length;
  const naFiles = props.files.filter((f) => f.status === 'n/a').length;
  const readErrors = props.files.filter((f) => f.status === 'read error').length;
  // Uploadable = total - duplicates - redundant files - removed - n/a files - read errors
  const uploadable = total - duplicates - redundantFiles - removed - naFiles - readErrors;

  // Checked files = files that will be uploaded (not skipped, not completed, not duplicates, not redundant, not n/a, not read errors)
  const checkedFiles = props.files.filter(
    (f) =>
      f.status !== 'skip' &&
      f.status !== 'completed' &&
      f.status !== 'skipped' &&
      f.status !== 'duplicate' &&
      f.status !== 'redundant' &&
      f.status !== 'n/a' &&
      f.status !== 'read error'
  );
  const checkedCount = checkedFiles.length;
  const checkedSize = checkedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  // Unchecked files = files that have been skipped OR marked as redundant OR n/a OR read errors
  const uncheckedCount = removed + redundantFiles + naFiles + readErrors;

  // Copy count = files with status === 'copy' (for Hide/Show Copies menu item)
  const copyCount = props.files.filter((f) => f.status === 'copy').length;

  // Skip-only count = files with status === 'skip' ONLY (for Clear Skipped Files menu item)
  const skipOnlyCount = removed; // This is the original 'removed' count (line 177) before adding redundant/n/a

  return {
    total,
    totalSize: formatBytes(totalSize),
    ready,
    removed: removed + redundantFiles + naFiles, // Include redundant files and n/a files in "Skipped" counter
    duplicates,
    failed,
    uploaded,
    uploadable,
    checkedCount,
    checkedSize: formatBytes(checkedSize),
    uncheckedCount,
    copyCount,
    skipOnlyCount,
  };
});

// Format bytes - Always show 3 significant digits
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Format to exactly 3 significant digits
  let formatted;
  if (value < 10) {
    // Show 2 decimal places (e.g., 1.23 KB, 7.72 MB)
    formatted = value.toFixed(2);
  } else if (value < 100) {
    // Show 1 decimal place (e.g., 12.3 KB, 87.1 MB)
    formatted = value.toFixed(1);
  } else {
    // Show no decimal places (e.g., 121 KB, 983 MB)
    formatted = Math.round(value).toString();
  }

  return formatted + ' ' + sizes[i];
};

// Handle cancel
const handleCancel = (fileId) => {
  emit('cancel', fileId);
};

// Handle undo
const handleUndo = (fileId) => {
  emit('undo', fileId);
};

// Handle remove
const handleRemove = (fileId) => {
  emit('remove', fileId);
};

// Handle swap (for copy files)
const handleSwap = (fileId) => {
  emit('swap', fileId);
};

// Handle upload
const handleUpload = () => {
  emit('upload');
};

// Handle clear queue
const handleClearQueue = () => {
  emit('clear-queue');
};

// Handle clear duplicates
const handleClearDuplicates = () => {
  emit('clear-duplicates');
};

// Handle clear skipped
const handleClearSkipped = () => {
  emit('clear-skipped');
};

// Handle toggle duplicates
const handleToggleDuplicates = () => {
  emit('toggle-duplicates');
};

// Handle pause
const handlePause = () => {
  emit('pause');
};

// Handle resume
const handleResume = () => {
  emit('resume');
};

// Handle cancel upload
const handleCancelUpload = () => {
  emit('cancel-upload');
};

// Handle retry failed
const handleRetryFailed = () => {
  emit('retry-failed');
};
</script>

<style scoped>
.upload-table-container {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0; /* No border radius for full viewport fill */
  overflow: hidden;
  margin: 0;
  /* Size table based on column widths, not viewport */
  width: fit-content;
  height: 100%; /* Fill parent container */
  min-height: 0; /* Allow flex shrinking */
}

/* Wrapper for drag-and-drop - enables absolute positioning of overlay */
.table-positioning-wrapper {
  flex: 1;
  position: relative; /* Creates positioning context for absolute overlay */
  min-height: 0; /* Allow flex shrinking */
  display: flex;
  flex-direction: column;
}

/* Drag overlay - positioned absolutely to cover entire table (outside scroll container) */
/* NOT part of virtualized content - sits on top of everything */
/* Styled to match UploadTableDropzone for visual consistency */
/* Accounts for header (48px) + footer (68px) + 1rem padding on all sides */
.drag-overlay {
  position: absolute;
  top: calc(48px + 1rem); /* Header height + top padding */
  left: 1rem; /* Left padding */
  right: 1rem; /* Right padding */
  bottom: calc(68px + 1rem); /* Footer height + bottom padding */
  border: 3px dashed #3b82f6; /* Match dropzone active border */
  border-radius: 8px; /* Rounded corners like dropzone */
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); /* Light blue gradient */
  box-shadow: inset 0 0 24px rgba(59, 130, 246, 0.15);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* Allow drop events to pass through to wrapper */
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.drag-overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem; /* Match dropzone gap */
  padding: 1.5rem; /* Match dropzone padding */
  text-align: center;
  pointer-events: none; /* Ensure all drop events go to wrapper */
}

.drag-overlay-icon {
  margin-bottom: 0.25rem;
  animation: iconBounce 0.6s ease infinite;
}

@keyframes iconBounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.drag-overlay-text-primary {
  font-size: 1.25rem; /* Slightly larger for overlay */
  font-weight: 600;
  color: #334155; /* Match dropzone text color */
  margin: 0;
  text-align: center;
}

.drag-overlay-text-secondary {
  font-size: 1rem;
  font-weight: 400;
  color: #64748b; /* Match dropzone secondary text color */
  margin: 0;
  text-align: center;
}

/* Screen reader only class for accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
