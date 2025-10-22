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

      <!-- Scrollable Table Body -->
      <div class="table-mockup-body">
        <!-- Static rows (no virtualization yet) -->
        <div
          v-for="(row, rowIndex) in mockData"
          :key="row.id"
          class="table-mockup-row"
          :class="{ even: rowIndex % 2 === 0 }"
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
            <span v-if="column.key === 'fileType'" class="badge" :class="getBadgeClass(row.fileType)">
              {{ row.fileType }}
            </span>

            <!-- File Name -->
            <template v-else-if="column.key === 'fileName'">{{ row.fileName }}</template>

            <!-- Size -->
            <template v-else-if="column.key === 'size'">{{ row.size }}</template>

            <!-- Date -->
            <template v-else-if="column.key === 'date'">{{ row.date }}</template>

            <!-- Privilege -->
            <span v-else-if="column.key === 'privilege'" class="badge badge-privilege">
              {{ row.privilege }}
            </span>

            <!-- Description -->
            <template v-else-if="column.key === 'description'">{{ row.description }}</template>

            <!-- Document Type -->
            <span v-else-if="column.key === 'documentType'" class="badge badge-doctype">
              {{ row.documentType }}
            </span>

            <!-- Author -->
            <template v-else-if="column.key === 'author'">{{ row.author }}</template>

            <!-- Custodian -->
            <template v-else-if="column.key === 'custodian'">{{ row.custodian }}</template>

            <!-- Created Date -->
            <template v-else-if="column.key === 'createdDate'">{{ row.createdDate }}</template>

            <!-- Modified Date -->
            <template v-else-if="column.key === 'modifiedDate'">{{ row.modifiedDate }}</template>

            <!-- Status -->
            <span v-else-if="column.key === 'status'" class="badge badge-status">
              {{ row.status }}
            </span>
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
import { ref, nextTick, watch, computed, onMounted } from 'vue';
import { useColumnResize } from '@/composables/useColumnResize';
import { useColumnDragDrop } from '@/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/composables/useColumnVisibility';
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
  mockData.value = generateCloudMockData(100);
  const dataGenMetrics = perfMonitor.end('Data Generation');

  console.log(`[Cloud Table] Generated ${mockData.value.length} rows`);
  console.timeEnd('[Cloud Table] Data Generation');

  // Track initial render
  console.log('[Cloud Table] Rendering static table...');
  console.time('[Cloud Table] Initial Render');

  perfMonitor.start('Initial Render');

  // Wait for next tick to ensure DOM is updated
  await nextTick();

  const renderMetrics = perfMonitor.end('Initial Render');
  console.timeEnd('[Cloud Table] Initial Render');

  // Count DOM nodes
  const domNodeCount = document.querySelectorAll('.table-mockup-row').length;
  console.log('[Cloud Table] DOM nodes created:', domNodeCount);

  // Log component mount time
  const mountTime = performance.now();
  console.log('[Cloud Table] Component mounted at:', mountTime.toFixed(2) + 'ms');
});
</script>

<style scoped src="./Cloud.css"></style>
