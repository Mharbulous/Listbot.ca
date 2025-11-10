<template>
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
      v-for="column in visibleColumns"
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
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';

/**
 * DocumentTableHeader - Table header with column management
 * Handles column selector, drag-and-drop reordering, sorting, and resizing
 */

// Props
defineProps({
  // Columns
  visibleColumns: {
    type: Array,
    required: true
  },
  orderedColumns: {
    type: Array,
    required: true
  },
  columnWidths: {
    type: Object,
    required: true
  },
  // Width calculations
  totalFooterWidth: {
    type: Number,
    required: true
  },
  // Column selector label
  columnSelectorLabel: {
    type: String,
    required: true
  },
  // Sort state
  sortDirection: {
    type: String,
    default: null
  },
  isSorted: {
    type: Function,
    required: true
  },
  toggleSort: {
    type: Function,
    required: true
  },
  // Drag-drop handlers
  isColumnDragging: {
    type: Function,
    required: true
  },
  isDragGap: {
    type: Function,
    required: true
  },
  onDragStart: {
    type: Function,
    required: true
  },
  onDragEnd: {
    type: Function,
    required: true
  },
  // Resize handler
  startResize: {
    type: Function,
    required: true
  },
  // Column visibility
  isColumnVisible: {
    type: Function,
    required: true
  },
  toggleColumnVisibility: {
    type: Function,
    required: true
  },
  resetToDefaults: {
    type: Function,
    required: true
  }
});

// Column selector state
const showColumnSelector = ref(false);
const columnSelectorPopover = ref(null);
const columnSelectorBtn = ref(null);

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
</script>

<style scoped>
/* Header styles are inherited from parent DocumentTable.css */
</style>
