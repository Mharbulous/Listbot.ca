<template>
  <div>
    <!-- Header Cell: Column Selector Button -->
    <div v-if="variant === 'header'" class="header-cell column-selector-cell">
      <button
        ref="columnSelectorBtn"
        class="column-selector-btn"
        @click="$emit('column-selector-click')"
      >
        <span>{{ columnSelectorLabel }}</span>
        <span class="dropdown-icon">▼</span>
      </button>
    </div>

    <!-- Row Cell: Action Buttons -->
    <div
      v-else-if="variant === 'row'"
      class="row-cell column-selector-spacer action-buttons-cell"
      :style="{ width: width + 'px' }"
    >
      <button
        class="process-ai-button"
        @click.stop="$emit('process-ai', row)"
        title="Process with AI"
      >
        🤖
      </button>
      <button
        ref="peekButton"
        class="view-document-button peek-button"
        @click.stop="$emit('peek-click', row)"
        @dblclick.stop="$emit('peek-dblclick', row)"
        @mouseenter="$emit('peek-mouseenter', row)"
        @mouseleave="$emit('peek-mouseleave')"
        :title="isPeekTooltipVisible ? '' : 'View thumbnail'"
      >
        📄
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Props
const props = defineProps({
  // 'header' or 'row' - determines which template to render
  variant: {
    type: String,
    required: true,
    validator: (value) => ['header', 'row'].includes(value)
  },
  // Column selector button label (header variant only)
  columnSelectorLabel: {
    type: String,
    default: 'Cols'
  },
  // Column width in pixels (row variant only)
  width: {
    type: Number,
    default: 100
  },
  // Row data for action buttons (row variant only)
  row: {
    type: Object,
    default: null
  },
  // Whether peek tooltip is currently visible (row variant only)
  isPeekTooltipVisible: {
    type: Boolean,
    default: false
  }
});

// Emits
defineEmits([
  'column-selector-click',
  'process-ai',
  'peek-click',
  'peek-dblclick',
  'peek-mouseenter',
  'peek-mouseleave'
]);

// Template refs
const columnSelectorBtn = ref(null);
const peekButton = ref(null);

// Expose refs so parent can access them
defineExpose({
  columnSelectorBtn,
  peekButton
});
</script>

<style scoped>
/* Styles are imported from DocumentTable.css in the parent component */
/* This component relies on parent styles for visual consistency */
</style>
