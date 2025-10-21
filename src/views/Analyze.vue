<template>
  <div class="analyze-mockup-page" style="min-width: 0">
    <!-- Scrollable container fills viewport -->
    <div ref="scrollContainer" class="scroll-container">
      <!-- Sticky Table Header -->
      <div class="table-mockup-header">
        <!-- Dynamic Column Headers with Drag-and-Drop -->
        <div
          v-for="(column, index) in orderedColumns"
          :key="column.key"
          class="header-cell"
          :class="{
            'dragging': isColumnDragging(column.key),
            'drag-over': dragState.hoverColumnKey === column.key
          }"
          :style="{ width: columnWidths[column.key] + 'px' }"
          :data-column-key="column.key"
          draggable="true"
          @dragstart="onDragStart(column.key, $event)"
          @dragover="onDragOver(column.key, $event)"
          @dragleave="onDragLeave"
          @drop="onDrop"
          @dragend="onDragEnd"
        >
          <!-- Drag Handle Icon (shown on hover) -->
          <div class="drag-handle" title="Drag to reorder">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12">
              <circle cx="3" cy="3" r="1" />
              <circle cx="6" cy="3" r="1" />
              <circle cx="9" cy="3" r="1" />
              <circle cx="3" cy="6" r="1" />
              <circle cx="6" cy="6" r="1" />
              <circle cx="9" cy="6" r="1" />
              <circle cx="3" cy="9" r="1" />
              <circle cx="6" cy="9" r="1" />
              <circle cx="9" cy="9" r="1" />
            </svg>
          </div>

          <!-- Column Label -->
          <span class="header-label">{{ column.label }}</span>

          <!-- Resize Handle -->
          <div class="resize-handle" @mousedown="startResize(column.key, $event)"></div>

          <!-- Insertion Indicator (shown to the LEFT of this column when dragging over it) -->
          <div
            v-if="showInsertionIndicator && insertionIndicatorIndex === index"
            class="insertion-indicator"
          ></div>
        </div>

        <!-- Far-Right Drop Zone (before Cols button) -->
        <div
          v-if="dragState.isDragging"
          class="drop-zone"
          :class="{ 'drop-zone-active': dragState.hoverDropZone }"
          @dragover="onDragOverDropZone"
          @dragleave="onDragLeave"
          @drop="onDrop"
        >
          <!-- Insertion Indicator at far right -->
          <div
            v-if="showInsertionIndicator && insertionIndicatorIndex === orderedColumns.length"
            class="insertion-indicator"
          ></div>
        </div>

        <!-- Column Selector Button (always at far right) -->
        <div class="header-cell column-selector-cell">
          <button class="column-selector-btn" @click="showColumnSelector = !showColumnSelector">
            <span>Cols</span>
            <span class="dropdown-icon">▼</span>
          </button>
        </div>

        <!-- Column Selector Popover (Mockup) -->
        <div
          v-if="showColumnSelector"
          ref="columnSelectorPopover"
          class="column-selector-popover"
          tabindex="0"
          @focusout="handleFocusOut"
        >
          <div class="popover-header">Show/Hide Columns</div>
          <label class="column-option">
            <input type="checkbox" checked /> File Type
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> File Name
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> File Size
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> Document Date
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> Privilege
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> Description
          </label>
          <label class="column-option">
            <input type="checkbox" /> Document Type
          </label>
          <label class="column-option">
            <input type="checkbox" /> Author
          </label>
          <label class="column-option">
            <input type="checkbox" /> Custodian
          </label>
          <div class="popover-footer">
            <button class="reset-btn">Reset to Defaults</button>
          </div>
        </div>
      </div>

      <!-- Scrollable Table Body -->
      <div class="table-mockup-body">
        <!-- Sample Rows (50+ to ensure vertical scrolling) -->
        <div v-for="i in 50" :key="i" class="table-mockup-row" :class="{ even: i % 2 === 0 }">
          <!-- Dynamic cells matching column order -->
          <div
            v-for="column in orderedColumns"
            :key="column.key"
            class="row-cell"
            :style="{ width: columnWidths[column.key] + 'px' }"
            :data-column-key="column.key"
          >
            <!-- File Type -->
            <span v-if="column.key === 'fileType'" class="badge badge-pdf">PDF</span>

            <!-- File Name -->
            <template v-else-if="column.key === 'fileName'">contract_{{ i }}_2024.pdf</template>

            <!-- Size -->
            <template v-else-if="column.key === 'size'">{{ (Math.random() * 5).toFixed(1) }}MB</template>

            <!-- Date -->
            <template v-else-if="column.key === 'date'">2024-10-{{ String(i).padStart(2, '0') }}</template>

            <!-- Privilege -->
            <span v-else-if="column.key === 'privilege'" class="badge badge-privilege">Privileged</span>

            <!-- Description -->
            <template v-else-if="column.key === 'description'">{{ getDescription(i) }}</template>

            <!-- Document Type -->
            <span v-else-if="column.key === 'documentType'" class="badge badge-doctype">Contract</span>

            <!-- Author -->
            <template v-else-if="column.key === 'author'">John Smith</template>

            <!-- Custodian -->
            <template v-else-if="column.key === 'custodian'">Legal Dept.</template>

            <!-- Created Date -->
            <template v-else-if="column.key === 'createdDate'">2024-09-{{ String(i).padStart(2, '0') }}</template>

            <!-- Modified Date -->
            <template v-else-if="column.key === 'modifiedDate'">2024-10-{{ String(i).padStart(2, '0') }}</template>

            <!-- Status -->
            <span v-else-if="column.key === 'status'" class="badge badge-status">Active</span>
          </div>
        </div>
      </div>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalTableWidth + 'px' }">
        <span>Total Documents: 50</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue';
import { useColumnResize } from '@/composables/useColumnResize';
import { useColumnDragDrop } from '@/composables/useColumnDragDrop';
import { getDescription } from '@/utils/analyzeMockData';

// Column selector and refs
const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);

// Use column resize composable
const { columnWidths, totalTableWidth, startResize } = useColumnResize();

// Use column drag-drop composable
const {
  orderedColumns,
  dragState,
  showInsertionIndicator,
  insertionIndicatorIndex,
  onDragStart,
  onDragOver,
  onDragOverDropZone,
  onDragLeave,
  onDrop,
  onDragEnd,
  isColumnDragging
} = useColumnDragDrop();

// Compute dynamic table width including ordered columns
const dynamicTableWidth = computed(() => {
  return orderedColumns.value.reduce((sum, col) => sum + (columnWidths.value[col.key] || 0), 0);
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
  // Only close if focus is leaving the popover entirely (not moving to a child element)
  if (!event.relatedTarget || !columnSelectorPopover.value?.contains(event.relatedTarget)) {
    showColumnSelector.value = false;
  }
};
</script>

<style scoped src="./Analyze.css"></style>
