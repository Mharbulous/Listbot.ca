<template>
  <div class="analyze-mockup-page" style="min-width: 0">
    <!-- Scrollable container fills viewport -->
    <div ref="scrollContainer" class="scroll-container">
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
            'dragging': isColumnDragging(column.key),
            'drag-gap': isDragGap(column.key)
          }"
          :style="{ width: columnWidths[column.key] + 'px' }"
          :data-column-key="column.key"
          @dragover="onDragOver"
          @drop="onDrop"
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

          <!-- Column Label -->
          <span class="header-label">{{ column.label }}</span>

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
          <label
            v-for="column in orderedColumns"
            :key="column.key"
            class="column-option"
          >
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
            position: 'relative'
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
              width: '100%',
              height: virtualItem.size + 'px',
              transform: `translateY(${virtualItem.start}px)`
            }"
          >
            <!-- Spacer cell to align with Cols button header -->
            <div class="row-cell column-selector-spacer" style="width: 100px"></div>

            <!-- Dynamic cells matching column order -->
            <div
              v-for="column in visibleColumns"
              :key="column.key"
              class="row-cell"
              :class="{ 'drag-gap': isDragGap(column.key) }"
              :style="{ width: columnWidths[column.key] + 'px' }"
              :data-column-key="column.key"
            >
              <!-- File Type -->
              <span v-if="column.key === 'fileType'" class="badge" :class="getBadgeClass(mockData[virtualItem.index].fileType)">
                {{ mockData[virtualItem.index].fileType }}
              </span>

              <!-- File Name -->
              <template v-else-if="column.key === 'fileName'">{{ mockData[virtualItem.index].fileName }}</template>

              <!-- Size -->
              <template v-else-if="column.key === 'size'">{{ mockData[virtualItem.index].size }}</template>

              <!-- Date -->
              <template v-else-if="column.key === 'date'">{{ mockData[virtualItem.index].date }}</template>

              <!-- Privilege -->
              <span v-else-if="column.key === 'privilege'" class="badge badge-privilege">
                {{ mockData[virtualItem.index].privilege }}
              </span>

              <!-- Description -->
              <template v-else-if="column.key === 'description'">{{ mockData[virtualItem.index].description }}</template>

              <!-- Document Type -->
              <span v-else-if="column.key === 'documentType'" class="badge badge-doctype">
                {{ mockData[virtualItem.index].documentType }}
              </span>

              <!-- Author -->
              <template v-else-if="column.key === 'author'">{{ mockData[virtualItem.index].author }}</template>

              <!-- Custodian -->
              <template v-else-if="column.key === 'custodian'">{{ mockData[virtualItem.index].custodian }}</template>

              <!-- Created Date -->
              <template v-else-if="column.key === 'createdDate'">{{ mockData[virtualItem.index].createdDate }}</template>

              <!-- Modified Date -->
              <template v-else-if="column.key === 'modifiedDate'">{{ mockData[virtualItem.index].modifiedDate }}</template>

              <!-- Status -->
              <span v-else-if="column.key === 'status'" class="badge badge-status">
                {{ mockData[virtualItem.index].status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalFooterWidth + 'px' }">
        <span>Total Documents: {{ mockData.length }}</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed, onMounted, onUnmounted } from 'vue';
import { useColumnResize } from '@/composables/useColumnResize';
import { useColumnDragDrop } from '@/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
import { useVirtualTable } from '@/composables/useVirtualTable';
import { generateCloudMockData } from '@/utils/cloudMockData';
import { PerformanceMonitor } from '@/utils/performanceMonitor';

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor('Cloud Table');

// Column selector and refs
const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);

// Mock data
const mockData = ref([]);

// Use column resize composable
const { columnWidths, totalTableWidth, startResize } = useColumnResize();

// Use column drag-drop composable
const {
  orderedColumns,
  dragState,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isColumnDragging,
  isDragGap
} = useColumnDragDrop();

// Use column visibility composable
const {
  isColumnVisible,
  toggleColumnVisibility,
  resetToDefaults
} = useColumnVisibility();

// Initialize virtual table (MUST be called during setup, not in onMounted)
// scrollContainer.value is null initially - that's OK, virtualizer handles it
const {
  rowVirtualizer,
  virtualItems,
  virtualTotalSize,
  scrollOffset,
  virtualRange,
  scrollMetrics
} = useVirtualTable({
  data: mockData,
  scrollContainer,
  estimateSize: 48,
  overscan: 5,
  enableSmoothScroll: true
});

// Compute visible columns by filtering ordered columns
const visibleColumns = computed(() => {
  return orderedColumns.value.filter(col => isColumnVisible(col.key));
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
    console.log('[Cloud Table] Scroll FPS:', fps);
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

  // Log virtual range during scroll (throttled)
  if (virtualItems.value.length > 0) {
    console.log('[Cloud Table] Virtual range:', virtualRange.value);
    console.log('[Cloud Table] Scroll metrics:', scrollMetrics.value);
  }
};

// Component lifecycle
onMounted(async () => {
  // Log initialization messages
  console.log('[Cloud Table] Initializing virtual scrolling table...');
  console.log('[Cloud Table] Browser:', navigator.userAgent);

  // Verify TanStack Virtual is available
  try {
    await import('@tanstack/vue-virtual');
    console.log('[Cloud Table] TanStack Virtual loaded successfully');
  } catch (error) {
    console.warn('[Cloud Table] TanStack Virtual not available:', error);
  }

  // Generate mock data with performance tracking
  console.log('[Cloud Table] Generating mock data...');
  console.time('[Cloud Table] Data Generation');

  perfMonitor.start('Data Generation');
  mockData.value = generateCloudMockData(); // Now generates 1,000 rows by default
  const dataGenMetrics = perfMonitor.end('Data Generation');

  console.log(`[Cloud Table] Generated ${mockData.value.length} rows`);
  console.timeEnd('[Cloud Table] Data Generation');

  // Wait for DOM to be ready
  await nextTick();

  // Log virtualizer initialization info
  console.log('[Cloud Table] Initializing row virtualizer...');
  console.log('[Cloud Table] Total rows:', mockData.value.length);
  console.log('[Cloud Table] Estimated row height:', 48);
  console.log('[Cloud Table] Overscan:', 5);

  // Track initial render
  console.log('[Cloud Table] Rendering virtual table...');
  console.time('[Cloud Table] Initial Render');

  perfMonitor.start('Initial Render');

  // Wait for next tick to ensure DOM is updated
  await nextTick();

  const renderMetrics = perfMonitor.end('Initial Render');
  console.timeEnd('[Cloud Table] Initial Render');

  // Debug: Check scroll container dimensions and virtual range
  if (scrollContainer.value) {
    const rect = scrollContainer.value.getBoundingClientRect();
    console.log('[Cloud Table] Scroll container dimensions:', {
      width: rect.width,
      height: rect.height,
      scrollHeight: scrollContainer.value.scrollHeight
    });

    // Log virtualizer state
    console.log('[Cloud Table] Virtualizer state:', {
      virtualTotalSize: virtualTotalSize.value,
      virtualItemsCount: virtualItems.value.length,
      virtualRange: virtualRange.value,
      dataLength: mockData.value.length
    });

    // Wait for virtualizer to measure
    await nextTick();
    await nextTick(); // Extra tick to ensure virtualizer has measured

    // Log virtual range after DOM updates
    console.log('[Cloud Table] After DOM update:', {
      virtualTotalSize: virtualTotalSize.value,
      virtualItemsCount: virtualItems.value.length,
      virtualRange: virtualRange.value
    });
  }

  // Count DOM nodes AFTER measure (should be much less than total rows)
  const domNodeCount = document.querySelectorAll('.table-mockup-row').length;
  console.log('[Cloud Table] DOM nodes created after measure:', domNodeCount);
  if (domNodeCount > 0) {
    console.log('[Cloud Table] Virtual efficiency:', Math.round(mockData.value.length / domNodeCount) + 'x reduction');
  } else {
    console.warn('[Cloud Table] No DOM nodes rendered! Check virtualizer configuration.');
  }

  // Add scroll event listener for FPS monitoring
  if (scrollContainer.value) {
    let scrollTimeout;
    scrollContainer.value.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 100); // Throttle logging
    });
  }

  // Log component mount time
  const mountTime = performance.now();
  console.log('[Cloud Table] Component mounted at:', mountTime.toFixed(2) + 'ms');

  // Performance comparison
  console.group('[Cloud Table] Performance Comparison');
  console.log('Phase 1 (static 100 rows): ~20ms render, 100 DOM nodes');
  console.log('Phase 2 (virtual 1,000 rows):', renderMetrics.duration.toFixed(2) + 'ms render,', domNodeCount, 'DOM nodes');
  console.log('Improvement factor:', Math.round(mockData.value.length / domNodeCount) + 'x DOM node reduction');
  console.groupEnd();
});

// Cleanup
onUnmounted(() => {
  if (fpsAnimationId) {
    cancelAnimationFrame(fpsAnimationId);
  }
});
</script>

<style scoped src="./Cloud.css"></style>
