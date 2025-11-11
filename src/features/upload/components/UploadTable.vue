<template>
  <div class="upload-table-container">
    <!-- VIRTUALIZED CONTENT (handles both empty and populated states) -->
    <UploadTableVirtualizer
      ref="virtualizerRef"
      :files="props.files"
      :all-selected="allFilesSelected"
      :some-selected="someFilesSelected"
      :footer-stats="footerStats"
      @cancel="handleCancel"
      @undo="handleUndo"
      @select-all="handleSelectAll"
      @deselect-all="handleDeselectAll"
      @upload="handleUpload"
      @clear-queue="handleClearQueue"
      @files-dropped="handleFilesDropped"
    />

    <!-- Accessibility: Live region for state changes -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ props.isEmpty ? 'Upload queue is empty. Drag and drop files or use the + Add to Queue button in the top left of the header to add files.' : `${props.files.length} files in upload queue` }}
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import UploadTableVirtualizer from './UploadTableVirtualizer.vue';

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
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'upload', 'clear-queue', 'files-dropped', 'select-all', 'deselect-all']);

// Refs
const virtualizerRef = ref(null); // For virtualized content

// Selection state for Select All checkbox
const allFilesSelected = computed(() => {
  if (props.files.length === 0) return false;
  // Filter out completed and n/a files (can't be toggled)
  const selectableFiles = props.files.filter((f) => f.status !== 'completed' && f.status !== 'n/a');
  if (selectableFiles.length === 0) return false;
  // All selectable files must NOT be skipped
  return selectableFiles.every((f) => f.status !== 'skip');
});

const someFilesSelected = computed(() => {
  if (props.files.length === 0) return false;
  const selectableFiles = props.files.filter((f) => f.status !== 'completed' && f.status !== 'n/a');
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

// Debug: Watch files prop
watch(
  () => props.files,
  (newFiles) => {
    console.log('[UploadTable] Files updated:', newFiles.length, 'files');
    if (newFiles.length > 0 && newFiles.length <= 3) {
      console.log('[UploadTable] First file:', newFiles[0]);
    }
  },
  { immediate: true }
);

// Footer stats
const footerStats = computed(() => {
  const total = props.files.length;
  const totalSize = props.files.reduce((sum, f) => sum + (f.size || 0), 0);
  const ready = props.files.filter((f) => f.status === 'ready').length;
  const removed = props.files.filter((f) => f.status === 'skip').length;
  const duplicates = props.files.filter((f) => f.status === 'skipped').length;
  const failed = props.files.filter((f) => f.status === 'error').length;
  const uploaded = props.files.filter((f) => f.status === 'completed').length;
  const naFiles = props.files.filter((f) => f.status === 'n/a').length;
  // Uploadable = total - duplicates - removed - n/a files
  const uploadable = total - duplicates - removed - naFiles;

  // Checked files = files that will be uploaded (not skipped, not completed, not duplicates, not n/a)
  const checkedFiles = props.files.filter(
    (f) => f.status !== 'skip' && f.status !== 'completed' && f.status !== 'skipped' && f.status !== 'n/a'
  );
  const checkedCount = checkedFiles.length;
  const checkedSize = checkedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  // Unchecked files = files that have been skipped OR marked as n/a
  const uncheckedCount = removed + naFiles;

  return {
    total,
    totalSize: formatBytes(totalSize),
    ready,
    removed: removed + naFiles, // Include n/a files in "Skipped" counter
    duplicates,
    failed,
    uploaded,
    uploadable,
    checkedCount,
    checkedSize: formatBytes(checkedSize),
    uncheckedCount,
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

// Handle upload
const handleUpload = () => {
  emit('upload');
};

// Handle clear queue
const handleClearQueue = () => {
  emit('clear-queue');
};

// Handle files dropped (from dropzone in virtualizer)
const handleFilesDropped = (files) => {
  emit('files-dropped', files);
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
