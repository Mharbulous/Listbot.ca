<template>
  <div
    class="text-cell"
    :class="{ 'text-cell--muted': muted, 'text-cell--bold': fontWeight === '500' }"
  >
    <span v-if="showTooltip" class="text-cell-content" :title="displayValue">
      {{ displayValue }}
    </span>
    <span v-else class="text-cell-content">
      {{ displayValue }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: [String, Number],
    default: '',
  },
  column: {
    type: Object,
    required: true,
  },
  file: {
    type: Object,
    required: true,
  },
});

const muted = computed(() => props.column.rendererProps?.muted || false);
const fontWeight = computed(() => props.column.rendererProps?.fontWeight || 'normal');
const showTooltip = computed(() => props.column.rendererProps?.showTooltip || false);

const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return '—';
  }
  return String(props.value);
});
</script>

<style scoped>
.text-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #374151;
}

.text-cell--muted {
  color: #6b7280;
  font-size: 13px;
}

.text-cell--bold {
  font-weight: 500;
  color: #111827;
}

.text-cell-content {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
