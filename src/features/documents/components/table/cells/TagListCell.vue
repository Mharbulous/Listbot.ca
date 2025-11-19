<template>
  <div class="tag-list-cell">
    <div class="tag-list">
      <span v-for="(tag, index) in tags" :key="index" class="tag-chip">
        {{ tag }}
      </span>
      <span v-if="!tags || tags.length === 0" class="text-muted">—</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: [Array, String],
    default: () => [],
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

const tags = computed(() => {
  if (!props.value) return [];

  // Handle string value (convert to array)
  if (typeof props.value === 'string') {
    return [props.value];
  }

  // Handle array value
  if (Array.isArray(props.value)) {
    return props.value.filter((tag) => tag); // Filter out empty values
  }

  return [];
});
</script>

<style scoped>
.tag-list-cell {
  overflow: visible;
  white-space: normal;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-chip {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f3f4f6;
  border-radius: 10px;
  font-size: 11px;
  color: #374151;
  white-space: nowrap;
}

.text-muted {
  color: #9ca3af;
}
</style>
