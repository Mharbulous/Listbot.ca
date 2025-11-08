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
      <!-- Sticky Table Header -->
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
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="12" viewBox="0 0 36 12">
              <!-- Top row - 6 dots -->
              <circle cx="3" cy="4" r="1" />
              <circle cx="9" cy="4" r="1" />
              <circle cx="15" cy="4" r="1" />
              <circle cx="21" cy="4" r="1" />
              <circle cx="27" cy="4" r="1" />
              <circle cx="33" cy="4" r="1" />

              <!-- Bottom row - 6 dots -->
              <circle cx="3" cy="8" r="1" />
              <circle cx="9" cy="8" r="1" />
              <circle cx="15" cy="8" r="1" />
              <circle cx="21" cy="8" r="1" />
              <circle cx="27" cy="8" r="1" />
              <circle cx="33" cy="8" r="1" />
            </svg>
          </div>

          <!-- Sort Indicator - positioned relative to header cell for proper centering -->
          <span class="sort-indicator" v-if="isSorted(column.key)">
            {{ sortDirection === 'asc' ? '↑' : '↓' }}
          </span>

          <!-- Sortable Column Label (Clickable Button) -->
          <button
            class="header-label-button"
            @click="toggleSort(column.key)"
            :title="`Click to sort by ${column.label}`"
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
            :class="{
              even: virtualItem.index % 2 === 0,
              '!bg-blue-50': isDocumentSelected(sortedData[virtualItem.index]),
              'cursor-pointer hover:!bg-blue-50': !isPeekActive || isRowPeeked(sortedData[virtualItem.index]),
              'cursor-default': isPeekActive && !isRowPeeked(sortedData[virtualItem.index])
            }"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              height: virtualItem.size + 'px',
              transform: `translateY(${virtualItem.start}px)`,
              backgroundColor: virtualItem.index % 2 === 0 ? '#f9fafb' : 'white',
            }"
            @dblclick="handleViewDocument(sortedData[virtualItem.index])"
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
                :ref="(el) => setPeekButtonRef(el, sortedData[virtualItem.index].id)"
                class="view-document-button peek-button"
                :class="{ 'peek-active': isRowPeeked(sortedData[virtualItem.index]) }"
                @click.stop="handlePeekClick(sortedData[virtualItem.index])"
                @dblclick.stop="handlePeekDoubleClick(sortedData[virtualItem.index])"
                @mouseenter="handlePeekMouseEnter(sortedData[virtualItem.index])"
                @mouseleave="handlePeekMouseLeave"
                :title="tooltipTiming.isVisible.value ? '' : 'View document'"
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
      :isVisible="tooltipTiming.isVisible.value"
      :opacity="tooltipTiming.opacity.value"
      :currentPeekDocument="documentPeek.currentPeekDocument.value"
      :currentPeekPage="documentPeek.currentPeekPage.value"
      :isLoading="documentPeek.isLoading.value"
      :error="documentPeek.error.value"
      :currentDocumentMetadata="documentPeek.currentDocumentMetadata.value"
      :isCurrentDocumentPdf="documentPeek.isCurrentDocumentPdf.value"
      :thumbnailUrl="documentPeek.currentThumbnailUrl.value"
      :position="tooltipPosition"
      :getFileIcon="documentPeek.getFileIcon"
      @mouseenter="handleTooltipMouseEnter"
      @mouseleave="handleTooltipMouseLeave"
      @thumbnail-needed="handleThumbnailNeeded"
      @previous-page="handlePreviousPage"
      @next-page="handleNextPage"
      @view-document="handleViewDocumentFromPeek"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/core/stores/auth';
import { useColumnResize } from '@/composables/useColumnResize';
import { useColumnDragDrop } from '@/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useVirtualTable } from '@/composables/useVirtualTable';
import { useColumnSort } from '@/composables/useColumnSort';
import { useDocumentPeek } from '@/composables/useDocumentPeek';
import { useTooltipTiming } from '@/composables/useTooltipTiming';
import DocumentPeekTooltip from '@/components/base/DocumentPeekTooltip.vue';

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

// Router and route for navigation
const route = useRoute();
const router = useRouter();

// Auth store for firm ID
const authStore = useAuthStore();

// Document peek functionality
const documentPeek = useDocumentPeek();
const tooltipTiming = useTooltipTiming();

// Refs for peek button positioning
const peekButtonRefs = ref(new Map());
const tooltipPosition = ref({ top: '0px', left: '0px' });

// Handle view document double-click
const handleViewDocument = (row) => {
  if (!row || !row.id) return;

  // If peek is active and this is NOT the peeked row, do nothing
  if (isPeekActive.value && !isRowPeeked(row)) {
    return;
  }

  // Navigate to document view (works for both peeked row and non-peek scenarios)
  router.push({
    name: 'view-document',
    params: {
      matterId: route.params.matterId,
      fileHash: row.id
    }
  });
};

// Check if a document row is currently selected (being viewed or peeked)
const isDocumentSelected = (row) => {
  if (!row || !row.id) return false;

  // Selected if currently viewing this document
  const isViewing = route.params.fileHash === row.id;

  // Selected if currently peeking this document and tooltip is visible
  const isPeeking = tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value === row.id;

  return isViewing || isPeeking;
};

// Check if peek is currently active
const isPeekActive = computed(() => {
  return tooltipTiming.isVisible.value;
});

// Check if a specific row is the currently peeked document
const isRowPeeked = (row) => {
  return row && row.id && documentPeek.currentPeekDocument.value === row.id;
};

// Handle process with AI button click
const handleProcessWithAI = (row) => {
  // TODO: Implement AI processing logic
  console.log('Process with AI:', row);
};

// Handle peek button click - opens preview or navigates based on current state
const handlePeekClick = async (row) => {
  if (!row || !row.id) return;

  const fileHash = row.id;
  const firmId = authStore.currentFirm;
  const matterId = route.params.matterId;

  if (!firmId || !matterId) {
    console.error('[Peek] Missing firmId or matterId');
    return;
  }

  // If tooltip is not visible, open the preview
  if (!tooltipTiming.isVisible.value) {
    // Open peek at page 1
    await documentPeek.openPeek(firmId, matterId, fileHash);

    // Show tooltip
    tooltipTiming.showTooltip();

    // Calculate position
    updateTooltipPosition(fileHash);

    // Generate thumbnail if it's a PDF
    if (documentPeek.isCurrentDocumentPdf.value) {
      await documentPeek.generateThumbnail(fileHash, 1);
    }
  }
  // If tooltip is visible and showing the same document, navigate to document view
  else if (documentPeek.currentPeekDocument.value === fileHash) {
    handleViewDocument(row);
  }
  // If tooltip is visible but showing a different document, switch to the new document
  else {
    // Switch to new document
    await documentPeek.openPeek(firmId, matterId, fileHash);

    // Keep tooltip visible
    tooltipTiming.cancelHideTimer();

    // Update position
    updateTooltipPosition(fileHash);

    // Generate thumbnail if it's a PDF
    if (documentPeek.isCurrentDocumentPdf.value) {
      await documentPeek.generateThumbnail(fileHash, 1);
    }
  }
};

// Handle peek button double-click - goes directly to document view
const handlePeekDoubleClick = (row) => {
  if (!row || !row.id) return;

  // Navigate directly to document view, bypassing preview
  handleViewDocument(row);
};

// Handle peek button mouse enter - now opens the preview on hover
const handlePeekMouseEnter = async (row) => {
  if (!row || !row.id) return;

  const fileHash = row.id;
  const firmId = authStore.currentFirm;
  const matterId = route.params.matterId;

  if (!firmId || !matterId) {
    console.error('[Peek] Missing firmId or matterId');
    return;
  }

  // If hovering over the same document that's already peeked, just show tooltip
  if (documentPeek.currentPeekDocument.value === fileHash) {
    tooltipTiming.handleMouseEnter();
  } else {
    // Different document, open peek at page 1
    await documentPeek.openPeek(firmId, matterId, fileHash);

    // Show tooltip
    tooltipTiming.showTooltip();

    // Calculate position
    updateTooltipPosition(fileHash);

    // Generate thumbnail if it's a PDF
    if (documentPeek.isCurrentDocumentPdf.value) {
      await documentPeek.generateThumbnail(fileHash, 1);
    }
  }
};

// Handle peek button mouse leave
const handlePeekMouseLeave = () => {
  tooltipTiming.handleMouseLeave();
};

// Handle tooltip mouse enter (cancel hide timer)
const handleTooltipMouseEnter = () => {
  tooltipTiming.cancelHideTimer();
};

// Handle tooltip mouse leave (start hide timer)
const handleTooltipMouseLeave = () => {
  tooltipTiming.startHideTimer();
};

// Handle thumbnail generation request
const handleThumbnailNeeded = async ({ fileHash, pageNumber }) => {
  await documentPeek.generateThumbnail(fileHash, pageNumber);
};

// Handle previous page click on thumbnail
const handlePreviousPage = async () => {
  if (!documentPeek.currentPeekDocument.value) return;

  const fileHash = documentPeek.currentPeekDocument.value;

  documentPeek.previousPage();

  // Generate thumbnail for new page
  await documentPeek.generateThumbnail(fileHash, documentPeek.currentPeekPage.value);
};

// Handle next page click on thumbnail
const handleNextPage = async () => {
  if (!documentPeek.currentPeekDocument.value) return;

  const fileHash = documentPeek.currentPeekDocument.value;

  documentPeek.nextPage();

  // Generate thumbnail for new page
  await documentPeek.generateThumbnail(fileHash, documentPeek.currentPeekPage.value);
};

// Handle view document from thumbnail middle-click
const handleViewDocumentFromPeek = () => {
  if (!documentPeek.currentPeekDocument.value) return;

  const fileHash = documentPeek.currentPeekDocument.value;

  // Find the row in sortedData that matches the fileHash
  const row = sortedData.value.find((r) => r.id === fileHash);

  if (row) {
    handleViewDocument(row);
  }
};

// Update tooltip position based on peek button
const updateTooltipPosition = (fileHash) => {
  const button = peekButtonRefs.value.get(fileHash);
  if (!button) return;

  const rect = button.getBoundingClientRect();

  // Estimate tooltip dimensions (based on DocumentPeekTooltip styles)
  const TOOLTIP_WIDTH = 350;
  const TOOLTIP_HEIGHT = 380;
  const BUFFER = 10;

  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calculate available space in each direction
  const spaceAbove = rect.top;
  const spaceBelow = viewportHeight - rect.bottom;
  const spaceRight = viewportWidth - rect.right;
  const spaceLeft = rect.left;

  // Determine vertical position
  let top;
  if (spaceBelow < TOOLTIP_HEIGHT && spaceAbove > spaceBelow) {
    // Not enough space below and more space above - position above button
    top = Math.max(BUFFER, rect.top - TOOLTIP_HEIGHT - BUFFER);
  } else {
    // Default: position at button top (aligns with button)
    top = Math.max(BUFFER, Math.min(rect.top, viewportHeight - TOOLTIP_HEIGHT - BUFFER));
  }

  // Determine horizontal position
  let left;
  if (spaceRight >= TOOLTIP_WIDTH + BUFFER) {
    // Enough space on right - position to right of button (default)
    left = rect.right + BUFFER;
  } else if (spaceLeft >= TOOLTIP_WIDTH + BUFFER) {
    // Not enough space on right but enough on left - position to left of button
    left = rect.left - TOOLTIP_WIDTH - BUFFER;
  } else {
    // Constrain to viewport with buffer
    left = Math.max(BUFFER, Math.min(rect.right + BUFFER, viewportWidth - TOOLTIP_WIDTH - BUFFER));
  }

  tooltipPosition.value = {
    top: `${top}px`,
    left: `${left}px`,
  };
};

// Handle click outside tooltip (close immediately)
const handleOutsideClick = (event) => {
  if (!tooltipTiming.isVisible.value) return;

  // Check if click is on peek button or tooltip
  const tooltipEl = event.target.closest('.document-peek-tooltip');
  const peekButtonEl = event.target.closest('.peek-button');

  if (!tooltipEl && !peekButtonEl) {
    tooltipTiming.closeImmediate();
    documentPeek.closePeek();
  }
};

// Handle window resize - update tooltip position if visible
const handleWindowResize = () => {
  if (tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value) {
    updateTooltipPosition(documentPeek.currentPeekDocument.value);
  }
};

// Handle scroll - update tooltip position if visible
const handleScroll = () => {
  if (tooltipTiming.isVisible.value && documentPeek.currentPeekDocument.value) {
    updateTooltipPosition(documentPeek.currentPeekDocument.value);
  }
};

// Set ref for peek button
const setPeekButtonRef = (el, fileHash) => {
  if (el) {
    peekButtonRefs.value.set(fileHash, el);
  } else {
    peekButtonRefs.value.delete(fileHash);
  }
};

// Column selector and refs
const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);
const columnSelectorBtn = ref(null);

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
  orderedColumns: composableOrderedColumns,
  dragState,
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
const { sortColumn, sortDirection, sortedData, toggleSort, getSortClass, isSorted } =
  useColumnSort(computed(() => props.data));

// Watch sort changes and emit event
watch([sortColumn, sortDirection], ([column, direction]) => {
  emit('sort-change', { column, direction });
});

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

// Column selector cell width constant
const COLUMN_SELECTOR_WIDTH = 100;

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

// Handle focus leaving the popover
const handleFocusOut = (event) => {
  const clickedButton = event.relatedTarget === columnSelectorBtn.value;
  if (!clickedButton && (!event.relatedTarget || !columnSelectorPopover.value?.contains(event.relatedTarget))) {
    showColumnSelector.value = false;
  }
};

// Lifecycle: Add outside-click detection, resize, and scroll listeners on mount
onMounted(() => {
  document.addEventListener('click', handleOutsideClick);
  window.addEventListener('resize', handleWindowResize);

  // Add scroll listener to the scroll container
  if (scrollContainer.value) {
    scrollContainer.value.addEventListener('scroll', handleScroll);
  }
});

// Lifecycle: Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
  window.removeEventListener('resize', handleWindowResize);

  // Remove scroll listener
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener('scroll', handleScroll);
  }

  documentPeek.cleanup();
});

// Component is ready - no logging needed here as Cloud.vue tracks the overall mount time
</script>

<style scoped src="./DocumentTable.css"></style>
