<template>
  <div class="document-table" style="min-width: 0">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <slot name="loading">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </slot>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <slot name="error" :error="error">
        <div class="error-icon">⚠️</div>
        <p class="error-message">{{ error }}</p>
        <button @click="$emit('retry')" class="retry-button">Retry</button>
      </slot>
    </div>

    <!-- Scrollable container fills viewport -->
    <div
      v-else
      ref="scrollContainer"
      class="scroll-container"
      v-bind="$attrs"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <!-- Header -->
      <DocumentTableHeader
        :visibleColumns="visibleColumns"
        :orderedColumns="orderedColumns"
        :columnWidths="columnWidths"
        :totalFooterWidth="totalFooterWidth"
        :columnSelectorLabel="columnSelectorLabel"
        :sortDirection="sortDirection"
        :isSorted="isSorted"
        :toggleSort="toggleSort"
        :isColumnDragging="isColumnDragging"
        :isDragGap="isDragGap"
        :onDragStart="onDragStart"
        :onDragEnd="onDragEnd"
        :startResize="startResize"
        :isColumnVisible="isColumnVisible"
        :toggleColumnVisibility="toggleColumnVisibility"
        :resetToDefaults="resetToDefaults"
      />

      <!-- Body -->
      <DocumentTableBody
        :virtualItems="virtualItems"
        :virtualTotalSize="virtualTotalSize"
        :sortedData="sortedData"
        :visibleColumns="visibleColumns"
        :columnWidths="columnWidths"
        :totalFooterWidth="totalFooterWidth"
        :columnSelectorWidth="COLUMN_SELECTOR_WIDTH"
        :isDocumentSelected="actions.isDocumentSelected"
        :isPeekActive="actions.isPeekActive.value"
        :isRowPeeked="actions.isRowPeeked"
        :handleViewDocument="actions.handleViewDocument"
        :handleProcessWithAI="actions.handleProcessWithAI"
        :handlePeekClick="actions.handlePeekClick"
        :handlePeekDoubleClick="actions.handlePeekDoubleClick"
        :handlePeekMouseEnter="actions.handlePeekMouseEnter"
        :handlePeekMouseLeave="actions.handlePeekMouseLeave"
        :setPeekButtonRef="actions.setPeekButtonRef"
        :tooltipTiming="actions.tooltipTiming"
        :handleCellClick="cellTooltip.handleCellClick"
        :handleCellMouseEnter="cellTooltip.handleCellMouseEnter"
        :handleCellMouseLeave="cellTooltip.handleCellMouseLeave"
        :isDragGap="isDragGap"
      >
        <!-- Forward all cell slots to body/row -->
        <template v-for="column in visibleColumns" v-slot:[`cell-${column.key}`]="slotProps">
          <slot :name="`cell-${column.key}`" v-bind="slotProps"></slot>
        </template>
      </DocumentTableBody>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalFooterWidth + 'px' }">
        <slot name="footer" :rowCount="sortedData.length">
          <span>Total Documents: {{ sortedData.length }}</span>
        </slot>
      </div>
    </div>

    <!-- Document Peek Tooltip -->
    <DocumentPeekTooltip
      :isVisible="actions.tooltipTiming.isVisible.value"
      :opacity="actions.tooltipTiming.opacity.value"
      :currentPeekDocument="actions.documentPeek.currentPeekDocument.value"
      :currentPeekPage="actions.documentPeek.currentPeekPage.value"
      :isLoading="actions.documentPeek.isLoading.value"
      :error="actions.documentPeek.error.value"
      :currentDocumentMetadata="actions.documentPeek.currentDocumentMetadata.value"
      :isCurrentDocumentPdf="actions.documentPeek.isCurrentDocumentPdf.value"
      :thumbnailUrl="actions.documentPeek.currentThumbnailUrl.value"
      :position="actions.tooltipPosition.value"
      :getFileIcon="actions.documentPeek.getFileIcon"
      @mouseenter="actions.handleTooltipMouseEnter"
      @mouseleave="actions.handleTooltipMouseLeave"
      @thumbnail-needed="actions.handleThumbnailNeeded"
      @previous-page="actions.handlePreviousPage"
      @next-page="actions.handleNextPage"
      @view-document="() => actions.handleViewDocumentFromPeek(sortedData)"
    />

    <!-- Cell Content Tooltip -->
    <CellContentTooltip
      :isVisible="cellTooltip.isVisible.value"
      :content="cellTooltip.content.value"
      :position="cellTooltip.position.value"
      :opacity="cellTooltip.opacity.value"
      :backgroundColor="cellTooltip.backgroundColor.value"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useColumnResize } from '@/composables/useColumnResize';
import { useColumnDragDrop } from '@/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useVirtualTable } from '@/composables/useVirtualTable';
import { useColumnSort } from '@/composables/useColumnSort';
import { useCellTooltip } from '@/composables/useCellTooltip';
import { useDocumentTableActions } from '@/composables/useDocumentTableActions';
import DocumentTableHeader from '@/components/base/DocumentTableHeader.vue';
import DocumentTableBody from '@/components/base/DocumentTableBody.vue';
import DocumentPeekTooltip from '@/components/base/DocumentPeekTooltip.vue';
import CellContentTooltip from '@/components/base/CellContentTooltip.vue';

// Props
const props = defineProps({
  // Row data array
  data: {
    type: Array,
    required: true,
    default: () => []
  },
  // Column definitions: [{key: string, label: string, defaultWidth: number}]
  columns: {
    type: Array,
    required: true,
    default: () => []
  },
  // Loading state
  loading: {
    type: Boolean,
    default: false
  },
  // Error message
  error: {
    type: String,
    default: null
  },
  // Virtual row height in pixels
  rowHeight: {
    type: Number,
    default: 48
  },
  // Overscan rows for virtual scrolling
  overscan: {
    type: Number,
    default: 5
  },
  // Column selector button label
  columnSelectorLabel: {
    type: String,
    default: 'Cols'
  }
});

// Emits
const emit = defineEmits(['sort-change', 'column-reorder', 'retry']);

// Scroll container ref
const scrollContainer = ref(null);

// Build default column widths object from columns prop
const defaultColumnWidths = computed(() => {
  return props.columns.reduce((acc, col) => {
    acc[col.key] = col.defaultWidth;
    return acc;
  }, {});
});

// Use column drag-drop composable
const {
  columnOrder,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isColumnDragging,
  isDragGap,
} = useColumnDragDrop(props.columns);

// Create reactive orderedColumns that syncs with columns prop
const orderedColumns = computed(() => {
  return columnOrder.value
    .map(key => props.columns.find(col => col.key === key))
    .filter(Boolean);
});

// Watch for columns changes and add new columns to columnOrder
watch(() => props.columns, (newColumns, oldColumns) => {
  if (newColumns.length > oldColumns.length) {
    const currentOrderKeys = new Set(columnOrder.value);
    const newColumnKeys = newColumns
      .map(col => col.key)
      .filter(key => !currentOrderKeys.has(key));

    if (newColumnKeys.length > 0) {
      columnOrder.value = [...columnOrder.value, ...newColumnKeys];
    }
  }
}, { immediate: false });

// Use column visibility composable
const { isColumnVisible, toggleColumnVisibility, resetToDefaults } = useColumnVisibility();

// Use column sort composable
const { sortColumn, sortDirection, sortedData, toggleSort, isSorted } =
  useColumnSort(computed(() => props.data));

// Watch sort changes and emit event
watch([sortColumn, sortDirection], ([column, direction]) => {
  emit('sort-change', { column, direction });
});

// Initialize virtual table
const {
  virtualItems,
  virtualTotalSize,
} = useVirtualTable({
  data: sortedData,
  scrollContainer,
  estimateSize: props.rowHeight,
  overscan: props.overscan,
  enableSmoothScroll: true,
});

// Compute visible columns by filtering ordered columns
const visibleColumns = computed(() => {
  return orderedColumns.value.filter((col) => isColumnVisible(col.key));
});

// Use column resize composable (placed after visibleColumns to avoid reference errors)
const { columnWidths, totalTableWidth, startResize } = useColumnResize(
  defaultColumnWidths.value,
  visibleColumns
);

// Watch defaultColumnWidths and sync to columnWidths when columns change
watch(defaultColumnWidths, (newWidths) => {
  Object.keys(newWidths).forEach(key => {
    if (columnWidths.value[key] === undefined) {
      columnWidths.value[key] = newWidths[key];
    }
  });
}, { immediate: false });

// Column selector cell width constant
const COLUMN_SELECTOR_WIDTH = 100;

// Compute total footer width (includes column selector width)
const totalFooterWidth = computed(() => {
  return totalTableWidth.value + COLUMN_SELECTOR_WIDTH;
});

// Cell content tooltip functionality
const cellTooltip = useCellTooltip();

// Document table actions (peek, navigation, etc.)
const actions = useDocumentTableActions();

// Handle click outside tooltip (close immediately)
const handleOutsideClick = (event) => {
  // Handle document peek tooltip
  if (actions.tooltipTiming.isVisible.value) {
    // Check if click is on peek button or tooltip
    const tooltipEl = event.target.closest('.document-peek-tooltip');
    const peekButtonEl = event.target.closest('.peek-button');

    if (!tooltipEl && !peekButtonEl) {
      actions.tooltipTiming.closeImmediate();
      actions.documentPeek.closePeek();
    }
  }

  // Handle cell content tooltip
  if (cellTooltip.isVisible.value) {
    // Check if click is on a table cell
    const cellEl = event.target.closest('.row-cell');

    if (!cellEl) {
      // Click was outside any cell, hide the tooltip
      cellTooltip.cleanup();
    }
  }
};

// Handle scroll - update tooltip position and hide cell tooltip
const handleScroll = () => {
  // Update document peek tooltip position
  actions.handleScrollForPeek();

  // Hide cell content tooltip on scroll (cell may scroll out of view)
  if (cellTooltip.isVisible.value) {
    cellTooltip.cleanup();
  }
};

// Lifecycle: Add outside-click detection, resize, and scroll listeners on mount
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  window.addEventListener('resize', actions.handleWindowResize);

  // Add scroll listener to the scroll container
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll);
  }
});

// Lifecycle: Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  window.removeEventListener('resize', actions.handleWindowResize);

  // Remove scroll listener
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
  }

  actions.documentPeek.cleanup();
  cellTooltip.cleanup();
});

// Define slots
defineSlots();
</script>

<style scoped src="./DocumentTable.css"></style>
