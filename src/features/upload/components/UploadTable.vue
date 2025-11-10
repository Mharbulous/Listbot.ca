<template>
  <div class="upload-table-container">
    <!-- Sticky Header -->
    <UploadTableHeader @clear-queue="handleClearQueue" />

    <!-- Simple Scrollable Body (NO VIRTUALIZATION - FOR TESTING) -->
    <div ref="scrollContainerRef" class="scroll-container">
      <div class="table-body">
        <UploadTableRow
          v-for="file in props.files"
          :key="file.id"
          :file="file"
          :scrollbar-width="scrollbarWidth"
          @cancel="handleCancel"
          @undo="handleUndo"
        />
      </div>
    </div>

    <!-- Footer -->
    <UploadTableFooter :stats="footerStats" @upload="handleUpload" />
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
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'clear-queue', 'upload']);

// Scrollbar width detection
const scrollContainerRef = ref(null);
const scrollbarWidth = ref(0);

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

  return {
    total,
    totalSize: formatBytes(totalSize),
    ready,
    removed,
    duplicates,
    failed,
    uploaded,
    uploadable,
  };
});

// Format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Handle cancel
const handleCancel = (fileId) => {
  emit('cancel', fileId);
};

// Handle undo
const handleUndo = (fileId) => {
  emit('undo', fileId);
};

// Handle clear queue
const handleClearQueue = () => {
  emit('clear-queue');
};

// Handle upload
const handleUpload = () => {
  emit('upload');
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
</style>
