<template>
  <div class="segmented-control-container">
    <button
      v-for="option in options"
      :key="option.value"
      :class="['segmented-control-option', { active: modelValue === option.value }]"
      @click="$emit('update:modelValue', option.value)"
      type="button"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
    // Expected format: [{ label: 'Analyze', value: 'analyze' }, ...]
  },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.segmented-control-container {
  display: inline-flex;
  background-color: rgb(243 244 246); /* bg-gray-100 */
  border-radius: 0.5rem; /* rounded-lg */
  padding: 0.25rem;
  gap: 0.25rem;
}

.segmented-control-option {
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(107 114 128); /* text-muted-text / text-gray-500 */
  background-color: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
}

.segmented-control-option:hover:not(.active) {
  color: rgb(75 85 99); /* Slightly darker gray on hover */
}

.segmented-control-option.active {
  background-color: white; /* bg-surface */
  color: rgb(31 41 55); /* Dark text - text-gray-800 */
  font-weight: 600;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); /* shadow-sm */
}
</style>
