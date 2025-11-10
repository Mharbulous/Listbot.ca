<template>
  <div class="upload-table-container">
    <!-- Scrollable container -->
    <div ref="scrollContainer" class="scroll-container">
      <!-- Sticky Header -->
      <UploadTableHeader />

      <!-- Virtual Scrolling Body -->
      <div class="table-body">
        <!-- Virtual container with dynamic height -->
        <div
          class="virtual-container"
          :style="{
            height: totalSize + 'px',
            position: 'relative',
          }"
        >
          <!-- Virtual rows (only visible + overscan rendered) -->
          <div
            v-for="virtualItem in virtualItems"
            :key="virtualItem.key"
            class="virtual-row"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualItem.size + 'px',
              transform: `translateY(${virtualItem.start}px)`,
            }"
          >
            <UploadTableRow :file="files[virtualItem.index]" @cancel="handleCancel" />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <UploadTableFooter :stats="footerStats" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
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
const emit = defineEmits(['cancel']);

// Refs
const scrollContainer = ref(null);

// Virtual scrolling configuration
const ROW_HEIGHT = 48;

const rowVirtualizer = useVirtualizer({
  count: computed(() => props.files.length),
  getScrollElement: () => scrollContainer.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5,
});

const virtualItems = computed(() => {
  if (!rowVirtualizer || !rowVirtualizer.getVirtualItems) return [];
  return rowVirtualizer.getVirtualItems();
});

const totalSize = computed(() => {
  if (!rowVirtualizer || !rowVirtualizer.getTotalSize) return 0;
  return rowVirtualizer.getTotalSize();
});

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
</script>

<style scoped>
.upload-table-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 400px); /* Adjust based on layout */
  min-height: 400px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 auto;
  max-width: 1200px;
}

.scroll-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.table-body {
  position: relative;
}

.virtual-container {
  width: 100%;
}

.virtual-row {
  will-change: transform;
}
</style>
