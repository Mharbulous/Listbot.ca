<template>
  <div class="analyze-mockup-page" style="min-width: 0">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading files from Firestore...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ error }}</p>
      <button @click="window.location.reload()" class="retry-button">Retry</button>
    </div>

    <!-- Scrollable container fills viewport -->
    <div
      v-else
      ref="scrollContainer"
      class="scroll-container"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <!-- Sticky Table Header -->
      <div class="table-mockup-header">
        <!-- Column Selector Button (always at far left) -->
        <div class="header-cell column-selector-cell">
          <button class="column-selector-btn" @click="showColumnSelector = !showColumnSelector">
            <span>Cols</span>
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
      <div class="table-mockup-body">
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
            :class="{ even: virtualItem.index % 2 === 0 }"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              height: virtualItem.size + 'px',
              transform: `translateY(${virtualItem.start}px)`,
              backgroundColor: virtualItem.index % 2 === 0 ? '#f9fafb' : 'white',
            }"
          >
            <!-- Spacer cell to align with Cols button header -->
            <div class="row-cell column-selector-spacer" style="width: 100px"></div>

            <!-- Dynamic cells matching column order -->
            <div
              v-for="column in visibleColumns"
              :key="column.key"
              class="row-cell"
              :class="{
                'drag-gap': isDragGap(column.key),
                'emoji-cell': sortedData[virtualItem.index][column.key] === '🤖',
              }"
              :style="{ width: columnWidths[column.key] + 'px' }"
              :data-column-key="column.key"
            >
              <!-- File Type -->
              <span
                v-if="column.key === 'fileType'"
                :class="
                  sortedData[virtualItem.index].fileType.startsWith('ERROR:')
                    ? 'error-text'
                    : [
                        'badge',
                        getBadgeClass(formatMimeType(sortedData[virtualItem.index].fileType)),
                      ]
                "
              >
                {{ formatMimeType(sortedData[virtualItem.index].fileType) }}
              </span>

              <!-- File Name -->
              <span
                v-else-if="column.key === 'fileName'"
                :class="{
                  'error-text': sortedData[virtualItem.index].fileName.startsWith('ERROR:'),
                }"
              >
                {{ sortedData[virtualItem.index].fileName }}
              </span>

              <!-- Size -->
              <span
                v-else-if="column.key === 'size'"
                :class="{ 'error-text': sortedData[virtualItem.index].size.startsWith('ERROR:') }"
              >
                {{ sortedData[virtualItem.index].size }}
              </span>

              <!-- Privilege -->
              <span
                v-else-if="column.key === 'privilege'"
                :class="
                  sortedData[virtualItem.index].privilege.startsWith('ERROR:')
                    ? 'error-text'
                    : 'badge badge-privilege'
                "
              >
                {{ sortedData[virtualItem.index].privilege }}
              </span>

              <!-- Description -->
              <span
                v-else-if="column.key === 'description'"
                :class="{
                  'error-text': sortedData[virtualItem.index].description.startsWith('ERROR:'),
                }"
              >
                {{ sortedData[virtualItem.index].description }}
              </span>

              <!-- Author -->
              <span
                v-else-if="column.key === 'author'"
                :class="{ 'error-text': sortedData[virtualItem.index].author.startsWith('ERROR:') }"
              >
                {{ sortedData[virtualItem.index].author }}
              </span>

              <!-- Custodian -->
              <span
                v-else-if="column.key === 'custodian'"
                :class="{
                  'error-text': sortedData[virtualItem.index].custodian.startsWith('ERROR:'),
                }"
              >
                {{ sortedData[virtualItem.index].custodian }}
              </span>

              <!-- Source Folder Path -->
              <span
                v-else-if="column.key === 'sourceFolderPath'"
                :class="{
                  'error-text': sortedData[virtualItem.index].sourceFolderPath.startsWith('ERROR:'),
                }"
              >
                {{ sortedData[virtualItem.index].sourceFolderPath }}
              </span>

              <!-- Timestamp columns (Upload Date, Source Modified Date, etc.) -->
              <span
                v-else-if="isTimestampColumn(column.key)"
                :class="{
                  'error-text': getCellValue(sortedData[virtualItem.index], column.key).startsWith(
                    'ERROR:'
                  ),
                }"
              >
                {{ getCellValue(sortedData[virtualItem.index], column.key) }}
              </span>

              <!-- Multiple Source Files -->
              <span
                v-else-if="column.key === 'alternateSources'"
                :class="
                  sortedData[virtualItem.index].alternateSources === 'No source information'
                    ? 'error-text'
                    : 'badge badge-status'
                "
              >
                {{ sortedData[virtualItem.index].alternateSources }}
              </span>

              <!-- Generic fallback for category columns (system, firm, matter) -->
              <span v-else>
                {{ sortedData[virtualItem.index][column.key] || '🤖' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalFooterWidth + 'px' }">
        <span>Total Documents: {{ sortedData.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useColumnResize } from '@/composables/useColumnResize';
import { useColumnDragDrop } from '@/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useVirtualTable } from '@/composables/useVirtualTable';
import { useColumnSort } from '@/composables/useColumnSort';
import { fetchFiles } from '@/services/uploadService';
import { useAuthStore } from '@/core/stores/auth';
import { useMatterViewStore } from '@/stores/matterView';
import { useUserPreferencesStore } from '@/core/stores/userPreferences';
import { formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter';
import { formatMimeType } from '@/utils/mimeTypeFormatter';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor('Cloud Table');

// Auth and Matter stores
const authStore = useAuthStore();
const matterViewStore = useMatterViewStore();

// User preferences store for date and time formatting
const preferencesStore = useUserPreferencesStore();
const { dateFormat, timeFormat } = storeToRefs(preferencesStore);

// Column selector and refs
const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);

// Data state
const mockData = ref([]);
const isLoading = ref(true);
const error = ref(null);
const systemCategories = ref([]);
const firmCategories = ref([]);
const matterCategories = ref([]);

// Non-system column definitions (fixed columns that don't come from systemcategories collection)
const NON_SYSTEM_COLUMNS = [
  { key: 'fileName', label: 'Source File Name', defaultWidth: 300 },
  { key: 'size', label: 'File Size', defaultWidth: 100 },
  { key: 'date', label: 'Upload Date', defaultWidth: 200 },
  { key: 'fileType', label: 'File Format', defaultWidth: 200 },
  { key: 'modifiedDate', label: 'Source Modified Date', defaultWidth: 150 },
  { key: 'sourceFolderPath', label: 'Source Folder', defaultWidth: 300 },
  { key: 'alternateSources', label: 'Multiple Source Files', defaultWidth: 180 },
];

// Columns that contain Firestore timestamps and should be formatted with date+time
const TIMESTAMP_COLUMNS = ['date', 'modifiedDate'];

/**
 * Calculate the width needed for column header text
 * Uses canvas measureText API for accurate measurement
 * @param {string} text - The column header text
 * @param {string} font - Font specification (default: '14px Roboto')
 * @returns {number} Width in pixels needed for the text plus padding/icons
 */
const calculateColumnWidth = (text, font = '14px Roboto, sans-serif') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = metrics.width;

  // Add padding for: left/right padding (32px) + sort icon (24px) + resize handle (20px) + buffer (4px) = 80px
  const totalWidth = Math.ceil(textWidth + 80);

  // Ensure minimum width of 180px (same as built-in columns)
  return Math.max(180, totalWidth);
};

// Dynamic column configuration combining all four column types
const allColumns = computed(() => {
  // Start with non-system (built-in) columns
  const columns = [...NON_SYSTEM_COLUMNS];

  // System category columns (with actual tag data)
  const systemCategoryColumns = systemCategories.value.map((category) => ({
    key: category.id,
    label: category.name,
    defaultWidth: calculateColumnWidth(category.name),
  }));

  // Firm category columns (placeholder data)
  const firmCategoryColumns = firmCategories.value.map((category) => ({
    key: category.id,
    label: category.name,
    defaultWidth: calculateColumnWidth(category.name),
  }));

  // Matter category columns (placeholder data)
  const matterCategoryColumns = matterCategories.value.map((category) => ({
    key: category.id,
    label: category.name,
    defaultWidth: calculateColumnWidth(category.name),
  }));

  // Combine: built-in, then system, then firm, then matter
  return [...columns, ...systemCategoryColumns, ...firmCategoryColumns, ...matterCategoryColumns];
});

// Build default column widths object from allColumns
const defaultColumnWidths = computed(() => {
  return allColumns.value.reduce((acc, col) => {
    acc[col.key] = col.defaultWidth;
    return acc;
  }, {});
});

// Note: Composables are initialized with current columns
// When systemCategories loads, allColumns will update reactively
// Use column resize composable (pass dynamic default widths)
const { columnWidths, totalTableWidth, startResize } = useColumnResize(defaultColumnWidths.value);

// Watch defaultColumnWidths and sync to columnWidths when categories load
// This ensures new category columns get their default widths immediately
watch(defaultColumnWidths, (newWidths) => {
  Object.keys(newWidths).forEach(key => {
    if (columnWidths.value[key] === undefined) {
      columnWidths.value[key] = newWidths[key];
    }
  });
}, { immediate: false });

// Use column drag-drop composable (pass dynamic columns)
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
} = useColumnDragDrop(allColumns.value);

// Create reactive orderedColumns that syncs with allColumns (unlike composable's version which uses stale snapshot)
const orderedColumns = computed(() => {
  // Map columnOrder keys to actual column objects from allColumns (reactive)
  return columnOrder.value
    .map(key => allColumns.value.find(col => col.key === key))
    .filter(Boolean); // Filter out undefined (in case columnOrder has stale keys)
});

// Use column visibility composable
const { isColumnVisible, toggleColumnVisibility, resetToDefaults } = useColumnVisibility();

// Use column sort composable
const { sortColumn, sortDirection, sortedData, toggleSort, getSortClass, isSorted } =
  useColumnSort(mockData);

// Initialize virtual table (MUST be called during setup, not in onMounted)
// scrollContainer.value is null initially - that's OK, virtualizer handles it
// Use sortedData instead of mockData to show sorted results
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
  estimateSize: 48,
  overscan: 5,
  enableSmoothScroll: true,
});

// Watch for allColumns changes and add new columns to columnOrder when categories load
watch(allColumns, (newColumns, oldColumns) => {
  // Detect if columns were added (categories loaded)
  if (newColumns.length > oldColumns.length) {
    const currentOrderKeys = new Set(columnOrder.value);
    const newColumnKeys = newColumns
      .map(col => col.key)
      .filter(key => !currentOrderKeys.has(key));

    if (newColumnKeys.length > 0) {
      console.log(`[Cloud Table] Adding ${newColumnKeys.length} new columns to order`);
      // Append new column keys to the end of the current order
      columnOrder.value = [...columnOrder.value, ...newColumnKeys];
    }
  }
}, { immediate: false });

// Compute visible columns by filtering ordered columns
const visibleColumns = computed(() => {
  return orderedColumns.value.filter((col) => isColumnVisible(col.key));
});

// Column selector cell width constant
const COLUMN_SELECTOR_WIDTH = 100;

// Compute total footer width (includes column selector width)
const totalFooterWidth = computed(() => {
  return totalTableWidth.value + COLUMN_SELECTOR_WIDTH;
});

/**
 * Get badge CSS class based on file type
 */
const getBadgeClass = (fileType) => {
  const type = fileType.toUpperCase();
  if (type === 'PDF') return 'badge-pdf';
  if (type === 'DOC' || type === 'DOCX') return 'badge-doctype';
  if (type === 'XLS' || type === 'XLSX') return 'badge-status';
  return 'badge-privilege';
};

/**
 * Check if a column contains timestamp data
 */
const isTimestampColumn = (columnKey) => {
  return TIMESTAMP_COLUMNS.includes(columnKey);
};

/**
 * Get cell value with appropriate formatting
 * Handles timestamps, errors, and regular values
 */
const getCellValue = (row, columnKey) => {
  const value = row[columnKey];

  // Handle timestamp columns
  if (isTimestampColumn(columnKey)) {
    // If null or missing, show error
    if (!value) {
      return 'ERROR: Date not available';
    }
    // Format with user preferences (space separator, no "at")
    return formatDateTimeUtil(value, dateFormat.value, timeFormat.value);
  }

  // For non-timestamp columns, return value as-is
  return value;
};

// Auto-focus popover when it opens
watch(showColumnSelector, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    columnSelectorPopover.value?.focus();
  }
});

// Handle focus leaving the popover
const handleFocusOut = (event) => {
  // Only close if focus is leaving the popover entirely (not moving to a child element)
  if (!event.relatedTarget || !columnSelectorPopover.value?.contains(event.relatedTarget)) {
    showColumnSelector.value = false;
  }
};

// FPS monitoring
let fpsFrameCount = 0;
let fpsLastTime = performance.now();
let fpsAnimationId = null;

const measureFPS = () => {
  fpsFrameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - fpsLastTime;

  if (elapsed >= 1000) {
    const fps = Math.round((fpsFrameCount / elapsed) * 1000);
    // FPS logging removed for production
    fpsFrameCount = 0;
    fpsLastTime = currentTime;
  }

  fpsAnimationId = requestAnimationFrame(measureFPS);
};

// Start FPS monitoring on scroll
const handleScroll = () => {
  if (!fpsAnimationId) {
    measureFPS();
  }

  // Virtual range logging removed for production
};

// Component lifecycle
onMounted(async () => {
  // Timing variables for performance tracking
  let fetchDuration = 0;
  let renderDuration = 0;

  // Verify TanStack Virtual is available
  try {
    await import('@tanstack/vue-virtual');
  } catch (error) {
    console.error('[Cloud Table] TanStack Virtual not available:', error);
  }

  // Fetch real data from Firestore
  try {
    // Wait for auth to be ready
    if (!authStore.isAuthenticated) {
      error.value = 'Please log in to view files';
      isLoading.value = false;
      return;
    }

    const firmId = authStore.currentFirm;
    if (!firmId) {
      error.value = 'No firm ID available';
      isLoading.value = false;
      return;
    }

    // Check if a matter is selected
    const matterId = matterViewStore.currentMatterId;
    if (!matterId) {
      error.value = 'Please select a matter to view files';
      isLoading.value = false;
      return;
    }

    const fetchStartTime = performance.now();

    // Fetch system categories first (global, alphabetically sorted)
    perfMonitor.start('System Categories Fetch');
    try {
      const systemCategoriesRef = collection(db, 'systemcategories');
      const q = query(systemCategoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      systemCategories.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[Cloud Table] Loaded ${systemCategories.value.length} system categories`);
    } catch (categoryError) {
      console.error('[Cloud Table] Failed to load system categories:', categoryError);
      // Continue without system categories rather than failing completely
      systemCategories.value = [];
    }
    perfMonitor.end('System Categories Fetch');

    // Fetch firm categories (firm-wide, from 'general' matter)
    perfMonitor.start('Firm Categories Fetch');
    try {
      const firmCategoriesRef = collection(db, 'firms', firmId, 'matters', 'general', 'categories');
      const firmQuery = query(firmCategoriesRef, orderBy('name', 'asc'));
      const firmSnapshot = await getDocs(firmQuery);

      firmCategories.value = firmSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[Cloud Table] Loaded ${firmCategories.value.length} firm categories`);
    } catch (firmError) {
      console.error('[Cloud Table] Failed to load firm categories:', firmError);
      firmCategories.value = [];
    }
    perfMonitor.end('Firm Categories Fetch');

    // Fetch matter categories (matter-specific)
    perfMonitor.start('Matter Categories Fetch');
    try {
      const matterCategoriesRef = collection(db, 'firms', firmId, 'matters', matterId, 'categories');
      const matterQuery = query(matterCategoriesRef, orderBy('name', 'asc'));
      const matterSnapshot = await getDocs(matterQuery);

      matterCategories.value = matterSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[Cloud Table] Loaded ${matterCategories.value.length} matter categories`);
    } catch (matterError) {
      console.error('[Cloud Table] Failed to load matter categories:', matterError);
      matterCategories.value = [];
    }
    perfMonitor.end('Matter Categories Fetch');

    // Fetch files with system categories
    perfMonitor.start('Data Fetch');
    mockData.value = await fetchFiles(firmId, matterId, systemCategories.value, 10000);
    perfMonitor.end('Data Fetch');

    const fetchEndTime = performance.now();
    fetchDuration = fetchEndTime - fetchStartTime;

    isLoading.value = false;
  } catch (err) {
    console.error('[Cloud Table] Error fetching files:', err);
    error.value = `Failed to load files: ${err.message}`;
    isLoading.value = false;
    return;
  }

  // Wait for DOM to be ready
  await nextTick();

  // Track initial render
  const renderStartTime = performance.now();

  perfMonitor.start('Initial Render');

  // Wait for next tick to ensure DOM is updated
  await nextTick();

  perfMonitor.end('Initial Render');
  const renderEndTime = performance.now();
  renderDuration = renderEndTime - renderStartTime;

  // Wait for virtualizer to measure
  if (scrollContainer.value) {
    await nextTick();
    await nextTick(); // Extra tick to ensure virtualizer has measured
  }

  // Count DOM nodes AFTER measure (for performance report)
  const domNodeCount = document.querySelectorAll('.table-mockup-row').length;

  // Add scroll event listener for FPS monitoring
  if (scrollContainer.value) {
    let scrollTimeout;
    scrollContainer.value.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100); // Throttle logging
    });
  }

  // Memory usage tracking (for performance report)
  let memoryUsage = 0;
  if (performance.memory) {
    memoryUsage = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
  }

  // Calculate Time to First Render (TTFR) = fetch time + render time
  const ttfr = fetchDuration + renderDuration;
});

// Cleanup
onUnmounted(() => {
  if (fpsAnimationId) {
    cancelAnimationFrame(fpsAnimationId);
  }
});
</script>

<style scoped src="./Cloud.css"></style>
