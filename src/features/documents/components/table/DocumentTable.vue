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
      <!-- Extended Gradient Background (sits behind all content) -->
      <div class="gradient-background"></div>

      <!-- Title Drawer (scrollable - slides up behind sticky header) -->
      <div
        v-if="pageTitle"
        class="title-drawer"
        :style="{
          background: 'transparent',
          color: '#455A64',
        }"
      >
        <h1 class="title-drawer-text">{{ pageTitle }}</h1>
        <!-- Slot for controls (e.g., buttons, filters) -->
        <div v-if="$slots.controls" class="title-drawer-controls">
          <slot name="controls"></slot>
        </div>
      </div>

      <!-- Sticky Table Header (drawer front panel - stays fixed) -->
      <div class="table-mockup-header" :style="{ minWidth: totalFooterWidth + 'px' }">
        <!-- Column Selector Button (always at far left) -->
        <div class="header-cell column-selector-cell">
          <button ref="columnSelectorBtn" class="column-selector-btn" @click="showColumnSelector = !showColumnSelector">
            <span>{{ columnSelectorLabel }}</span>
            <span class="dropdown-icon">▼</span>
          </button>
        </div>

        <!-- Dynamic Column Headers with Drag-and-Drop -->
        <div
          v-for="(column, index) in visibleColumns"
          :key="column.key"
          class="header-cell"
          :class="{
            dragging: isColumnDragging(column.key),
            'drag-gap': isDragGap(column.key),
            'sorted-asc': isSorted(column.key) && sortDirection === 'asc',
            'sorted-desc': isSorted(column.key) && sortDirection === 'desc',
          }"
          :style="{ width: columnWidths[column.key] + 'px' }"
          :data-column-key="column.key"
        >
          <!-- Drag Handle Icon (shown on hover) -->
          <div
            class="drag-handle"
            title="Drag to reorder"
            draggable="true"
            @dragstart="onDragStart(column.key, $event)"
            @dragend="onDragEnd"
          >
            <DragHandle />
          </div>

          <!-- Sort Indicator with priority - positioned relative to header cell for proper centering -->
          <span class="sort-indicator" v-if="isSorted(column.key)">
            <span class="sort-arrow">{{ getSortInfo(column.key)?.direction === 'asc' ? '↑' : '↓' }}</span>
            <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo(column.key)?.priority }}</span>
          </span>

          <!-- Sortable Column Label (Clickable Button) -->
          <button
            class="header-label-button"
            @click="toggleSort(column.key)"
            :title="`Click to sort by ${column.label}${isSorted(column.key) ? ' (sorted)' : ''}`"
          >
            {{ column.label }}
          </button>

          <!-- Resize Handle -->
          <div class="resize-handle" @mousedown="startResize(column.key, $event)"></div>
        </div>

        <!-- Column Selector Popover -->
        <div
          v-if="showColumnSelector"
          ref="columnSelectorPopover"
          class="column-selector-popover"
          tabindex="0"
          @focusout="handleFocusOut"
        >
          <div class="popover-header">Show/Hide Columns</div>
          <label v-for="column in orderedColumns" :key="column.key" class="column-option">
            <input
              type="checkbox"
              :checked="isColumnVisible(column.key)"
              @change="toggleColumnVisibility(column.key)"
            />
            {{ column.label }}
          </label>
          <div class="popover-footer">
            <button class="reset-btn" @click="resetToDefaults">Reset to Defaults</button>
          </div>
        </div>
      </div>

      <!-- Scrollable Table Body with Virtual Scrolling -->
      <div class="table-mockup-body" :style="{ minWidth: totalFooterWidth + 'px' }">
        <!-- Virtual container with dynamic height -->
        <div
          class="virtual-container"
          :style="{
            height: virtualTotalSize + 'px',
            position: 'relative',
          }"
        >
          <!-- Virtual rows (only visible + overscan rendered) -->
          <div
            v-for="virtualItem in virtualItems"
            :key="virtualItem.key"
            class="table-mockup-row"
            :class="getRowClasses(virtualItem.index, sortedData[virtualItem.index])"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              height: virtualItem.size + 'px',
              transform: `translateY(${virtualItem.start}px)`,
              backgroundColor: getRowBackgroundColor(virtualItem.index),
            }"
            @dblclick="peek.handleViewDocument(sortedData[virtualItem.index])"
          >
            <!-- Action Buttons Cell -->
            <div class="row-cell column-selector-spacer action-buttons-cell" :style="{ width: COLUMN_SELECTOR_WIDTH + 'px' }">
              <button
                class="process-ai-button"
                @click.stop="handleProcessWithAI(sortedData[virtualItem.index])"
                title="Process with AI"
              >
                🤖
              </button>
              <button
                :ref="(el) => peek.setPeekButtonRef(el, sortedData[virtualItem.index].id)"
                class="view-document-button peek-button"
                @click.stop="peek.handlePeekClick(sortedData[virtualItem.index])"
                @dblclick.stop="peek.handlePeekDoubleClick(sortedData[virtualItem.index])"
                @mouseenter="peek.handlePeekMouseEnter(sortedData[virtualItem.index])"
                @mouseleave="peek.handlePeekMouseLeave"
                :title="peek.tooltipTiming.isVisible.value ? '' : 'View thumbnail'"
              >
                📄
              </button>
            </div>

            <!-- Dynamic cells matching column order -->
            <div
              v-for="column in visibleColumns"
              :key="column.key"
              class="row-cell"
              :class="{
                'drag-gap': isDragGap(column.key),
                'emoji-cell': !sortedData[virtualItem.index][column.key],
              }"
              :style="{ width: columnWidths[column.key] + 'px' }"
              :data-column-key="column.key"
              @click="(e) => cellTooltip.handleCellClick(e, e.currentTarget, getRowBackgroundColor(virtualItem.index))"
              @dblclick="(e) => cellTooltip.handleCellDoubleClick(e, e.currentTarget)"
              @mouseenter="(e) => cellTooltip.handleCellMouseEnter(e, e.currentTarget, getRowBackgroundColor(virtualItem.index))"
              @mouseleave="(e) => cellTooltip.handleCellMouseLeave(e.currentTarget)"
            >
              <!-- Cell content via slot -->
              <slot
                :name="`cell-${column.key}`"
                :row="sortedData[virtualItem.index]"
                :column="column"
                :value="sortedData[virtualItem.index][column.key]"
              >
                <!-- Default cell rendering -->
                <template v-if="!sortedData[virtualItem.index][column.key]">
                  <span class="tbd-text">t.b.d.</span>
                </template>
                <template v-else>
                  <span>{{ sortedData[virtualItem.index][column.key] }}</span>
                </template>
              </slot>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalFooterWidth + 'px' }">
        <slot name="footer" :rowCount="sortedData.length">
          <span>Total Documents: {{ sortedData.length }}</span>
        </slot>
      </div>
    </div>

    <!-- Document Peek Tooltip -->
    <DocumentPeekTooltip
      :isVisible="peek.tooltipTiming.isVisible.value"
      :opacity="peek.tooltipTiming.opacity.value"
      :currentPeekDocument="peek.documentPeek.currentPeekDocument.value"
      :currentPeekPage="peek.documentPeek.currentPeekPage.value"
      :isLoading="peek.documentPeek.isLoading.value"
      :error="peek.documentPeek.error.value"
      :currentDocumentMetadata="peek.documentPeek.currentDocumentMetadata.value"
      :isCurrentDocumentPdf="peek.documentPeek.isCurrentDocumentPdf.value"
      :thumbnailUrl="peek.documentPeek.currentThumbnailUrl.value"
      :position="peek.tooltipPosition"
      :getFileIcon="peek.documentPeek.getFileIcon"
      @mouseenter="peek.tooltipTiming.cancelHideTimer"
      @mouseleave="peek.tooltipTiming.startHideTimer"
      @thumbnail-needed="peek.handleThumbnailNeeded"
      @previous-page="peek.handlePreviousPage"
      @next-page="peek.handleNextPage"
      @view-document="peek.handleViewDocumentFromPeek"
    />

    <!-- Cell Content Tooltip -->
    <CellContentTooltip
      :isVisible="cellTooltip.isVisible.value"
      :content="cellTooltip.content.value"
      :position="cellTooltip.position.value"
      :opacity="cellTooltip.opacity.value"
      :backgroundColor="cellTooltip.backgroundColor.value"
      @mouseenter="cellTooltip.handleTooltipMouseEnter"
      @mouseleave="cellTooltip.handleTooltipMouseLeave"
      @click="cellTooltip.handleTooltipClick"
      @dblclick="cellTooltip.handleTooltipDoubleClick"
      @mounted="cellTooltip.setTooltipElement"
    />

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="5000"
      location="bottom"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/stores';
import { useColumnResize } from '@/features/documents/composables/useColumnResize';
import { useColumnDragDrop } from '@/features/documents/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/features/documents/composables/useColumnVisibility';
import { useVirtualTable } from '@/features/documents/composables/useVirtualTable';
import { useColumnSort } from '@/features/documents/composables/useColumnSort';
import { useDocumentTablePeek, getRowBackgroundColor } from '@/features/documents/composables/useDocumentTablePeek';
import { useCellTooltip } from '@/features/documents/composables/useCellTooltip';
import DocumentPeekTooltip from '@/features/documents/components/table/DocumentPeekTooltip.vue';
import CellContentTooltip from '@/features/documents/components/table/CellContentTooltip.vue';
import DragHandle from '@/features/documents/components/table/DragHandle.vue';

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
  },
  // Optional page title to display above the table
  pageTitle: {
    type: String,
    default: null
  }
});

// Emits
const emit = defineEmits(['sort-change', 'column-reorder', 'retry']);

// Constants
const COLUMN_SELECTOR_WIDTH = 100; // Action buttons column (AI + peek)

// Router and route for navigation
const route = useRoute();
const router = useRouter();

// Auth store for firm ID
const authStore = useAuthStore();

// Cell content tooltip functionality
const cellTooltip = useCellTooltip();

// Event Handlers
const handleProcessWithAI = (row) => {
  // TODO: Implement AI processing logic
  console.log('Process with AI:', row);
};

const handleOutsideClick = (event) => {
  // Delegate to the cellTooltip's handleOutsideClick for proper tooltip closing logic
  cellTooltip.handleOutsideClick(event);
};

const handleScrollContainer = () => {
  peek.handleScroll();
  if (cellTooltip.isVisible.value) cellTooltip.cleanup();
};

// Compute row classes based on state (selection, peek, hover)
const getRowClasses = (index, row) => ({
  even: index % 2 === 0,
  '!bg-blue-50': peek.isDocumentSelected(row),
  'cursor-pointer hover:!bg-blue-50': !peek.isPeekActive || peek.isRowPeeked(row),
  'cursor-default': peek.isPeekActive && !peek.isRowPeeked(row)
});

// Column Management
// Column selector and refs
const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);
const columnSelectorBtn = ref(null);

// Search functionality
const searchQuery = ref('');

const defaultColumnWidths = computed(() => {
  return props.columns.reduce((acc, col) => {
    acc[col.key] = col.defaultWidth;
    return acc;
  }, {});
});

// Use column drag-drop composable
const {
  columnOrder,
  orderedColumns: composableOrderedColumns,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isColumnDragging,
  isDragGap,
} = useColumnDragDrop(props.columns);

// Sync orderedColumns with props.columns (required for dynamic column loading)
// Uses Map for O(n) lookup instead of O(n²) find operation
const orderedColumns = computed(() => {
  // Create O(n) lookup map once per computation
  const columnMap = new Map(props.columns.map(col => [col.key, col]));

  // Then O(1) lookup for each key = O(n) total
  return columnOrder.value
    .map(key => columnMap.get(key))
    .filter(Boolean);
});

// Watch for new columns and add to order
watch(() => props.columns, (newColumns, oldColumns) => {
  if (newColumns.length > oldColumns.length) {
    const currentOrderKeys = new Set(columnOrder.value);
    const newColumnKeys = newColumns.map(col => col.key).filter(key => !currentOrderKeys.has(key));
    if (newColumnKeys.length > 0) columnOrder.value = [...columnOrder.value, ...newColumnKeys];
  }
}, { immediate: false });

// Snackbar state for max columns notification
const snackbar = ref({
  show: false,
  message: '',
  color: 'warning'
});

// Handler for when max sort columns is exceeded
const handleMaxColumnsExceeded = () => {
  snackbar.value = {
    show: true,
    message: `Sorting is limited to a maximum of 5 columns at a time. Disable sorting for one of the existing columns before selecting this column for sorting.`,
    color: 'warning'
  };
};

// Use column sort composable with multi-column support
const {
  sortColumn,
  sortDirection,
  sortColumns,
  orderedSortColumns,
  sortedData,
  toggleSort,
  getSortClass,
  isSorted,
  getSortInfo,
  removeColumnFromSort,
  MAX_SORT_COLUMNS
} = useColumnSort(
  computed(() => props.data),
  columnOrder,
  handleMaxColumnsExceeded
);

// Handler for when a column is hidden - removes it from sort
const handleColumnHidden = (columnKey) => {
  removeColumnFromSort(columnKey);
};

// Use column visibility composable with callback for hidden columns
const { isColumnVisible, toggleColumnVisibility, resetToDefaults } = useColumnVisibility(handleColumnHidden);

// Watch sort changes and emit event
watch([sortColumn, sortDirection], ([column, direction]) => {
  emit('sort-change', { column, direction });
});

// Initialize document peek functionality
const peek = useDocumentTablePeek(route, router, authStore, sortedData);

// Initialize virtual table
const {
  rowVirtualizer,
  virtualItems,
  virtualTotalSize,
  scrollOffset,
  virtualRange,
  scrollMetrics,
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

// Compute total footer width (includes column selector width)
const totalFooterWidth = computed(() => {
  return totalTableWidth.value + COLUMN_SELECTOR_WIDTH;
});

// Auto-focus popover when it opens
watch(showColumnSelector, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    columnSelectorPopover.value?.focus();
  }
});

const handleFocusOut = (event) => {
  const clickedButton = event.relatedTarget === columnSelectorBtn.value;
  if (!clickedButton && (!event.relatedTarget || !columnSelectorPopover.value?.contains(event.relatedTarget))) {
    showColumnSelector.value = false;
  }
};

// Lifecycle Hooks
onMounted(() => {
  peek.mount();
  document.addEventListener('click', handleOutsideClick);
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScrollContainer);
  }
});

onUnmounted(() => {
  peek.unmount();
  document.removeEventListener('click', handleOutsideClick);
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScrollContainer);
  }
  cellTooltip.cleanup();
});

// Component is ready - no logging needed here as Documents.vue tracks the overall mount time
</script>
<style scoped src="./DocumentTable.css"></style>
<style scoped>
/* Cursor behavior for slot content - using :deep() to penetrate scoped CSS boundary */
.row-cell :deep(span:not(.tbd-text)) {
  cursor: help !important;
}

.row-cell :deep(.badge) {
  cursor: help !important;
}
</style>