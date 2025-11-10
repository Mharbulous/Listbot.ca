<template>
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
      <DocumentTableRow
        v-for="virtualItem in virtualItems"
        :key="virtualItem.key"
        :virtualItem="virtualItem"
        :row="sortedData[virtualItem.index]"
        :visibleColumns="visibleColumns"
        :columnWidths="columnWidths"
        :columnSelectorWidth="columnSelectorWidth"
        :isDocumentSelected="isDocumentSelected"
        :isPeekActive="isPeekActive"
        :isRowPeeked="isRowPeeked"
        :handleViewDocument="handleViewDocument"
        :handleProcessWithAI="handleProcessWithAI"
        :handlePeekClick="handlePeekClick"
        :handlePeekDoubleClick="handlePeekDoubleClick"
        :handlePeekMouseEnter="handlePeekMouseEnter"
        :handlePeekMouseLeave="handlePeekMouseLeave"
        :setPeekButtonRef="setPeekButtonRef"
        :tooltipTiming="tooltipTiming"
        :handleCellClick="handleCellClick"
        :handleCellMouseEnter="handleCellMouseEnter"
        :handleCellMouseLeave="handleCellMouseLeave"
        :isDragGap="isDragGap"
      >
        <!-- Forward all cell slots to DocumentTableRow -->
        <template v-for="column in visibleColumns" v-slot:[`cell-${column.key}`]="slotProps">
          <slot :name="`cell-${column.key}`" v-bind="slotProps"></slot>
        </template>
      </DocumentTableRow>
    </div>
  </div>
</template>

<script setup>
import DocumentTableRow from './DocumentTableRow.vue';

/**
 * DocumentTableBody - Virtual scrolling table body
 * Manages the virtual scrolling container and renders visible rows
 */

// Props
defineProps({
  // Virtual scrolling data
  virtualItems: {
    type: Array,
    required: true
  },
  virtualTotalSize: {
    type: Number,
    required: true
  },
  // Data
  sortedData: {
    type: Array,
    required: true
  },
  // Columns
  visibleColumns: {
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
  columnSelectorWidth: {
    type: Number,
    required: true
  },
  // Action handlers (passed to row)
  isDocumentSelected: {
    type: Function,
    required: true
  },
  isPeekActive: {
    type: Boolean,
    required: true
  },
  isRowPeeked: {
    type: Function,
    required: true
  },
  handleViewDocument: {
    type: Function,
    required: true
  },
  handleProcessWithAI: {
    type: Function,
    required: true
  },
  handlePeekClick: {
    type: Function,
    required: true
  },
  handlePeekDoubleClick: {
    type: Function,
    required: true
  },
  handlePeekMouseEnter: {
    type: Function,
    required: true
  },
  handlePeekMouseLeave: {
    type: Function,
    required: true
  },
  setPeekButtonRef: {
    type: Function,
    required: true
  },
  tooltipTiming: {
    type: Object,
    required: true
  },
  // Cell tooltip handlers
  handleCellClick: {
    type: Function,
    required: true
  },
  handleCellMouseEnter: {
    type: Function,
    required: true
  },
  handleCellMouseLeave: {
    type: Function,
    required: true
  },
  // Drag and drop state
  isDragGap: {
    type: Function,
    required: true
  }
});

// Define slots
defineSlots();
</script>

<style scoped>
/* Body styles are inherited from parent DocumentTable.css */
</style>
