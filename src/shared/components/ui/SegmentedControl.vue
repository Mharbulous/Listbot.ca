<template>
  <div class="segmented-control-container" ref="containerRef">
    <!-- Sliding thumb background -->
    <div
      class="segmented-control-thumb"
      :style="thumbStyle"
    />

    <button
      v-for="(option, index) in options"
      :key="option.value"
      ref="optionRefs"
      :class="['segmented-control-option', { active: modelValue === option.value }]"
      @click="$emit('update:modelValue', option.value)"
      type="button"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';

const props = defineProps({
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

const containerRef = ref(null);
const optionRefs = ref([]);
const thumbStyle = ref({
  transform: 'translateX(0px)',
  width: '0px',
});

// Calculate thumb position and width based on active option
const updateThumbPosition = () => {
  if (!containerRef.value || !optionRefs.value.length) return;

  const activeIndex = props.options.findIndex(opt => opt.value === props.modelValue);
  if (activeIndex === -1) return;

  const activeButton = optionRefs.value[activeIndex];
  if (!activeButton) return;

  const container = containerRef.value;
  const containerRect = container.getBoundingClientRect();
  const buttonRect = activeButton.getBoundingClientRect();

  // Calculate position relative to container
  const left = buttonRect.left - containerRect.left;
  const width = buttonRect.width;

  thumbStyle.value = {
    transform: `translateX(${left}px)`,
    width: `${width}px`,
  };
};

// Watch for modelValue changes and update thumb position
watch(() => props.modelValue, () => {
  nextTick(() => {
    updateThumbPosition();
  });
});

// Initialize thumb position on mount
onMounted(() => {
  nextTick(() => {
    updateThumbPosition();
  });
});
</script>

<style scoped>
.segmented-control-container {
  position: relative;
  display: inline-flex;
  background-color: rgb(243 244 246); /* bg-gray-100 */
  border-radius: 0.5rem; /* rounded-lg */
  padding: 0.25rem;
  gap: 0.25rem;
}

/* Sliding thumb element */
.segmented-control-thumb {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  height: calc(100% - 0.5rem);
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  z-index: 1;
}

.segmented-control-option {
  position: relative;
  z-index: 2;
  flex: 1;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgb(107 114 128); /* text-muted-text / text-gray-500 */
  background-color: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: color 0.2s ease, font-weight 0.2s ease;
  white-space: nowrap;
  min-width: 80px;
  text-align: center;
}

.segmented-control-option:hover:not(.active) {
  color: rgb(75 85 99); /* Slightly darker gray on hover */
}

.segmented-control-option.active {
  color: rgb(31 41 55); /* Dark text - text-gray-800 */
  font-weight: 600;
}
</style>
