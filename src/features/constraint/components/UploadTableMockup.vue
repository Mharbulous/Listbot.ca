<template>
  <!-- Simple Scrollable Body (NO VIRTUALIZATION - Phase 1.0) -->
  <!-- Phase 1.5 will replace this with TanStack Virtual scrolling -->
  <div ref="scrollContainerRef" class="scroll-container">
    <!-- Sticky Header INSIDE scroll container - ensures perfect alignment -->
    <UploadTableHeader
      :all-selected="props.allSelected"
      :some-selected="props.someSelected"
      @select-all="handleSelectAll"
      @deselect-all="handleDeselectAll"
    />

    <div class="table-body">
      <!-- Standard rendering: Render ALL rows -->
      <UploadTableRow
        v-for="file in props.files"
        :key="file.id"
        :file="file"
        :scrollbar-width="0"
        @cancel="handleCancel"
        @undo="handleUndo"
      />
    </div>

    <!-- Sticky Footer INSIDE scroll container - ensures perfect alignment -->
    <UploadTableFooter
      :stats="props.footerStats"
      @upload="handleUpload"
      @clear-queue="handleClearQueue"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UploadTableHeader from './UploadTableHeader.vue';
import UploadTableRow from './UploadTableRow.vue';
import UploadTableFooter from './UploadTableFooter.vue';

// Component configuration
defineOptions({
  name: 'UploadTableVirtualizer',
});

// Props
const props = defineProps({
  files: {
    type: Array,
    required: true,
    default: () => [],
  },
  allSelected: {
    type: Boolean,
    default: false,
  },
  someSelected: {
    type: Boolean,
    default: false,
  },
  footerStats: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'select-all', 'deselect-all', 'upload', 'clear-queue']);

// Scroll container ref (will be used by TanStack Virtual in Phase 1.5)
const scrollContainerRef = ref(null);

// Event handlers
const handleCancel = (fileId) => {
  emit('cancel', fileId);
};

const handleUndo = (fileId) => {
  emit('undo', fileId);
};

const handleSelectAll = () => {
  emit('select-all');
};

const handleDeselectAll = () => {
  emit('deselect-all');
};

const handleUpload = () => {
  emit('upload');
};

const handleClearQueue = () => {
  emit('clear-queue');
};

// Expose scroll container ref (kept for compatibility, but no longer used for scrollbar width)
defineExpose({
  scrollContainerRef,
});


</script>

<style scoped>
.scroll-container {
  flex: 1;
  position: relative;
  overflow-y: auto;
  min-height: 0; /* Allow flex shrinking and enable scrolling */
}

.table-body {
  display: flex;
  flex-direction: column;

}
</style>
