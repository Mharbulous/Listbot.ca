<template>
  <div class="upload-table-container">
    <!-- Sticky Header -->
    <UploadTableHeader
      :all-selected="allFilesSelected"
      :some-selected="someFilesSelected"
      @select-all="handleSelectAll"
      @deselect-all="handleDeselectAll"
    />

    <!-- Simple Scrollable Body (NO VIRTUALIZATION - FOR TESTING) -->
    <div ref="scrollContainerRef" class="scroll-container">
      <div class="table-body">
        <!-- EMPTY STATE (shown when isEmpty === true) -->
        <div v-if="props.isEmpty" class="empty-state-container">
          <div
            class="dropzone-empty"
            :class="{ 'dropzone-active': isDragOver }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @click="handleDropzoneClick"
            tabindex="0"
            role="button"
            :aria-label="
              isDragOver
                ? 'Drop files here to add them to the upload queue'
                : 'Drag and drop files or folders here, or click to select files'
            "
            @keydown.enter.prevent="handleDropzoneClick"
            @keydown.space.prevent="handleDropzoneClick"
          >
            <v-icon
              :icon="isDragOver ? 'mdi-download' : 'mdi-cloud-upload-outline'"
              size="64"
              :color="isDragOver ? 'primary' : 'grey-lighten-1'"
              class="dropzone-icon"
            />
            <p class="dropzone-text-primary">
              {{ isDragOver ? 'Drop files here!' : 'Drag and drop files or folders here' }}
            </p>
            <p class="dropzone-text-secondary">or use the buttons above</p>
          </div>
        </div>

        <!-- FILE ROWS (shown when isEmpty === false) -->
        <UploadTableRow
          v-for="file in props.files"
          v-show="!props.isEmpty"
          :key="file.id"
          :file="file"
          :scrollbar-width="scrollbarWidth"
          @cancel="handleCancel"
          @undo="handleUndo"
        />
      </div>
    </div>

    <!-- Footer -->
    <UploadTableFooter :stats="footerStats" @upload="handleUpload" @clear-queue="handleClearQueue" />

    <!-- Accessibility: Live region for state changes -->
    <div aria-live="polite" aria-atomic="true" class="sr-only">
      {{ props.isEmpty ? 'Upload queue is empty. Drag and drop files or use the buttons above to add files.' : `${props.files.length} files in upload queue` }}
    </div>
  </div>
</template>

<script setup>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue';
import UploadTableHeader from './UploadTableHeader.vue';
import UploadTableRow from './UploadTableRow.vue';
import UploadTableFooter from './UploadTableFooter.vue';

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

// Scrollbar width detection
const scrollContainerRef = ref(null);
const scrollbarWidth = ref(0);

// Drag-drop state for empty state
const isDragOver = ref(false);

// Selection state for Select All checkbox
const allFilesSelected = computed(() => {
  if (props.files.length === 0) return false;
  // Filter out completed files (can't be toggled)
  const selectableFiles = props.files.filter((f) => f.status !== 'completed');
  if (selectableFiles.length === 0) return false;
  // All selectable files must NOT be skipped
  return selectableFiles.every((f) => f.status !== 'skip');
});

const someFilesSelected = computed(() => {
  if (props.files.length === 0) return false;
  const selectableFiles = props.files.filter((f) => f.status !== 'completed');
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

const calculateScrollbarWidth = () => {
  if (!scrollContainerRef.value) return;
  // Calculate scrollbar width as the difference between offsetWidth and clientWidth
  scrollbarWidth.value = scrollContainerRef.value.offsetWidth - scrollContainerRef.value.clientWidth;
  console.log('[UploadTable] Scrollbar width detected:', scrollbarWidth.value, 'px');
};

onMounted(() => {
  // Calculate scrollbar width on mount
  calculateScrollbarWidth();
  // Recalculate on window resize
  window.addEventListener('resize', calculateScrollbarWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', calculateScrollbarWidth);
});

// Debug: Watch files prop
watch(
  () => props.files,
  (newFiles) => {
    console.log('[UploadTable] Files updated:', newFiles.length, 'files');
    if (newFiles.length > 0 && newFiles.length <= 3) {
      console.log('[UploadTable] First file:', newFiles[0]);
    }
    // Recalculate scrollbar width when files change (scrollbar may appear/disappear)
    setTimeout(calculateScrollbarWidth, 0);
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
  const uploadable = total - duplicates - removed;

  // Checked files = files that will be uploaded (not skipped, not completed, not duplicates)
  const checkedFiles = props.files.filter(
    (f) => f.status !== 'skip' && f.status !== 'completed' && f.status !== 'skipped'
  );
  const checkedCount = checkedFiles.length;
  const checkedSize = checkedFiles.reduce((sum, f) => sum + (f.size || 0), 0);

  // Unchecked files = files that have been skipped
  const uncheckedCount = removed;

  return {
    total,
    totalSize: formatBytes(totalSize),
    ready,
    removed,
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

// Drag-drop handlers for empty state
const handleDragOver = () => {
  if (props.isEmpty) {
    isDragOver.value = true;
  }
};

const handleDragLeave = (event) => {
  if (props.isEmpty) {
    // Only reset if leaving the dropzone entirely, not child elements
    const dropzone = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    if (!dropzone.contains(relatedTarget)) {
      isDragOver.value = false;
    }
  }
};

const handleDrop = async (event) => {
  if (!props.isEmpty) return;

  isDragOver.value = false;

  // Get all dropped items
  const items = Array.from(event.dataTransfer.items);
  const allFiles = [];

  // Process each dropped item
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await traverseFileTree(entry, allFiles);
      }
    }
  }

  if (allFiles.length > 0) {
    console.log(`[UploadTable] Dropped ${allFiles.length} files`);
    emit('files-dropped', allFiles);
  }
};

// Recursive function to traverse folder tree
const traverseFileTree = async (entry, filesList) => {
  if (entry.isFile) {
    // It's a file - get the File object
    return new Promise((resolve) => {
      entry.file((file) => {
        filesList.push(file);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    // It's a directory - read its contents
    const dirReader = entry.createReader();
    return new Promise((resolve) => {
      dirReader.readEntries(async (entries) => {
        for (const childEntry of entries) {
          await traverseFileTree(childEntry, filesList);
        }
        resolve();
      });
    });
  }
};

// Handle dropzone click (for keyboard accessibility)
const handleDropzoneClick = () => {
  // Note: This click handler is for the dropzone itself
  // The parent component (Testing.vue) should listen to this and trigger file selection
  // For now, we just log it - the parent already has buttons for file selection
  console.log('[UploadTable] Dropzone clicked - user should use buttons above');
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
</script>

<style scoped>
.upload-table-container {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
  max-width: 1200px;
}

.scroll-container {
  flex: 1;
  position: relative;
  overflow-y: auto;
  max-height: 600px; /* Limit height to ensure scrollbar appears with many files */
}

.table-body {
  display: flex;
  flex-direction: column;
}

/* Empty State Styling */
.empty-state-container {
  padding: 2rem;
  width: 100%;
}

.dropzone-empty {
  min-height: 350px;
  border: 3px dashed #cbd5e1;
  border-radius: 12px;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
}

.dropzone-empty:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.dropzone-empty:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.dropzone-empty.dropzone-active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: scale(1.01);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
}

.dropzone-icon {
  margin-bottom: 0.5rem;
  transition: transform 0.3s ease;
}

.dropzone-active .dropzone-icon {
  transform: scale(1.15) translateY(-8px);
}

.dropzone-text-primary {
  font-size: 1.125rem;
  font-weight: 500;
  color: #334155;
  margin: 0;
  text-align: center;
}

.dropzone-text-secondary {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0.5rem 0 0 0;
  text-align: center;
}

/* Transitions */
.empty-state-container {
  transition: opacity 0.3s ease;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dropzone-empty {
    min-height: 300px;
  }

  .dropzone-text-primary {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .empty-state-container {
    padding: 1rem;
  }

  .dropzone-empty {
    min-height: 250px;
    padding: 1.5rem 1rem;
  }

  .dropzone-icon {
    font-size: 48px !important;
  }

  .dropzone-text-primary {
    font-size: 0.9375rem;
  }

  .dropzone-text-secondary {
    font-size: 0.8125rem;
  }
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
