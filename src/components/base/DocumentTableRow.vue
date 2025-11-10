<template>
  <div
    class="table-mockup-row"
    :class="{
      even: virtualItem.index % 2 === 0,
      '!bg-blue-50': isDocumentSelected(row),
      'cursor-pointer hover:!bg-blue-50': !isPeekActive || isRowPeeked(row),
      'cursor-default': isPeekActive && !isRowPeeked(row)
    }"
    :style="{
      position: 'absolute',
      top: 0,
      left: 0,
      height: virtualItem.size + 'px',
      transform: `translateY(${virtualItem.start}px)`,
      backgroundColor: virtualItem.index % 2 === 0 ? '#f9fafb' : 'white',
    }"
    @dblclick="handleViewDocument(row)"
  >
    <!-- Action Buttons Cell -->
    <div class="row-cell column-selector-spacer action-buttons-cell" :style="{ width: columnSelectorWidth + 'px' }">
      <button
        class="process-ai-button"
        @click.stop="handleProcessWithAI(row)"
        title="Process with AI"
      >
        🤖
      </button>
      <button
        :ref="(el) => setPeekButtonRef(el, row.id)"
        class="view-document-button peek-button"
        @click.stop="handlePeekClick(row)"
        @dblclick.stop="handlePeekDoubleClick(row)"
        @mouseenter="handlePeekMouseEnter(row)"
        @mouseleave="handlePeekMouseLeave"
        :title="tooltipTiming.isVisible.value ? '' : 'View thumbnail'"
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
        'emoji-cell': !row[column.key],
      }"
      :style="{ width: columnWidths[column.key] + 'px' }"
      :data-column-key="column.key"
      @click="(e) => handleCellClick(e, e.currentTarget, virtualItem.index % 2 === 0 ? '#f9fafb' : 'white')"
      @mouseenter="(e) => handleCellMouseEnter(e, e.currentTarget, virtualItem.index % 2 === 0 ? '#f9fafb' : 'white')"
      @mouseleave="(e) => handleCellMouseLeave(e.currentTarget)"
    >
      <!-- Cell content via slot -->
      <slot
        :name="`cell-${column.key}`"
        :row="row"
        :column="column"
        :value="row[column.key]"
      >
        <!-- Default cell rendering -->
        <template v-if="!row[column.key]">
          <span class="tbd-text">t.b.d.</span>
        </template>
        <template v-else>
          <span>{{ row[column.key] }}</span>
        </template>
      </slot>
    </div>
  </div>
</template>

<script setup>
/**
 * DocumentTableRow - Individual row component for DocumentTable
 * Handles rendering of a single virtual row with action buttons and dynamic cells
 */

// Props
defineProps({
  // Virtual item from virtualizer
  virtualItem: {
    type: Object,
    required: true
  },
  // Row data
  row: {
    type: Object,
    required: true
  },
  // Visible columns
  visibleColumns: {
    type: Array,
    required: true
  },
  // Column widths
  columnWidths: {
    type: Object,
    required: true
  },
  // Column selector width constant
  columnSelectorWidth: {
    type: Number,
    required: true
  },
  // Action handlers
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
/* Row styles are inherited from parent DocumentTable.css */
</style>
