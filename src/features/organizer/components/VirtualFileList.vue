<template>
  <div class="virtual-file-list" :style="{ minWidth: minimumTableWidth }">
    <!-- Table Header (Sticky) -->
    <div class="file-list-header" :style="{ gridTemplateColumns: gridTemplateColumns, minWidth: minimumTableWidth }">
      <div
        v-for="column in columns"
        :key="column.key"
        class="file-list-header-cell"
        :class="`file-list-header-cell--${column.key}`"
      >
        {{ column.title }}
      </div>
    </div>

    <!-- Virtual Scrolling Container -->
    <div class="file-list-body" :style="{ minWidth: minimumTableWidth }">
      <!-- Loading State -->
      <div v-if="loading" class="file-list-loading">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading files...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!files || files.length === 0" class="file-list-empty">
        <div class="empty-icon">📁</div>
        <p class="empty-text">No files to display</p>
        <p class="empty-subtext">Upload files or adjust your filters</p>
      </div>

      <!-- Virtual Scroller -->
      <RecycleScroller
        v-else
        :items="files"
        :item-size="48"
        :buffer="200"
        key-field="id"
        class="file-scroller"
        :style="{ minWidth: minimumTableWidth }"
        v-slot="{ item, index }"
      >
        <FileListRow :file="item" :index="index" :columns="columns" :min-width="minimumTableWidth" @click="handleRowClick" />
      </RecycleScroller>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RecycleScroller } from 'vue-virtual-scroller';
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css';
import FileListRow from './FileListRow.vue';
import { generateGridTemplate, calculateMinimumTableWidth } from '@/features/organizer/config/fileListColumns';

const props = defineProps({
  files: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  columns: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['row-click']);

/**
 * Generate CSS grid template from column widths
 */
const gridTemplateColumns = computed(() => {
  return generateGridTemplate(props.columns);
});

/**
 * Calculate minimum table width to ensure horizontal scrolling
 */
const minimumTableWidth = computed(() => {
  return `${calculateMinimumTableWidth(props.columns)}px`;
});

function handleRowClick(file) {
  emit('row-click', file);
}
</script>

<style scoped>
.virtual-file-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

/* Header Styles */
.file-list-header {
  display: grid;
  gap: 8px;
  padding: 12px 16px;
  background-color: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
  font-weight: 600;
  font-size: 13px;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-list-header-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Body Container */
.file-list-body {
  flex: 1;
  position: relative;
}

/* Virtual Scroller */
.file-scroller {
  height: 100%;
  overflow-y: auto;
  overflow-x: auto;
}

/* Override vue-virtual-scroller width constraints for horizontal scrolling */
.file-scroller :deep(.vue-recycle-scroller__item-wrapper) {
  width: auto !important;
  min-width: 100%;
}

.file-scroller :deep(.vue-recycle-scroller__item-view) {
  width: auto !important;
}

/* Custom scrollbar styling */
.file-scroller::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.file-scroller::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.file-scroller::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.file-scroller::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Loading State */
.file-list-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: #6b7280;
}

/* Empty State */
.file-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #6b7280;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.empty-subtext {
  font-size: 14px;
  color: #9ca3af;
}
</style>
