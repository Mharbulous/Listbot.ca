<template>
  <div class="upload-table-container">
    <!-- Sticky Header -->
    <UploadTableHeader @clear-queue="handleClearQueue" />

    <!-- Simple Scrollable Body (NO VIRTUALIZATION - FOR TESTING) -->
    <div class="scroll-container">
      <div class="table-body">
        <UploadTableRow
          v-for="file in props.files"
          :key="file.id"
          :file="file"
          @cancel="handleCancel"
        />
      </div>
    </div>

    <!-- Footer -->
    <UploadTableFooter :stats="footerStats" @upload="handleUpload" />
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
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
const emit = defineEmits(['cancel', 'clear-queue', 'upload']);

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
  const duplicates = props.files.filter((f) => f.status === 'skipped').length;
  const failed = props.files.filter((f) => f.status === 'error').length;
  const uploaded = props.files.filter((f) => f.status === 'completed').length;
  const uploadable = total - duplicates;

  return {
    total,
    totalSize: formatBytes(totalSize),
    ready,
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
}

.table-body {
  display: flex;
  flex-direction: column;
}
</style>
