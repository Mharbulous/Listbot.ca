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

        <!-- Column Selector Popover (Mockup) -->
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
        <!-- Sample Rows (50+ to ensure vertical scrolling) -->
        <div v-for="i in 50" :key="i" class="table-mockup-row" :class="{ even: i % 2 === 0 }">
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

            <!-- Modified Date -->
            <template v-else-if="column.key === 'modifiedDate'">2024-10-{{ String(i).padStart(2, '0') }}</template>

            <!-- Status -->
            <span v-else-if="column.key === 'status'" class="badge badge-status">Active</span>
          </div>
        </div>
      </div>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalFooterWidth + 'px' }">
        <span>Total Documents: 50</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue';
import { useColumnResize } from '@/features/documents/composables/useColumnResize';
import { useColumnDragDrop } from '@/features/documents/composables/useColumnDragDrop';
import { useColumnVisibility } from '@/features/documents/composables/useColumnVisibility';
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
