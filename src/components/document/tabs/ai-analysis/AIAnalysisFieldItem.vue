<template>
  <div class="metadata-item">
    <div v-if="label" class="label-wrapper">
      <span
        ref="labelRef"
        class="metadata-label"
        :style="labelStyle"
      >
        {{ label }}
      </span>
    </div>

    <div class="field-controls" ref="controlsRef">
      <!-- Segmented Control (shown when NOT analyzing) -->
      <SegmentedControl
        v-if="!isAnalyzing"
        :model-value="fieldPreference"
        @update:model-value="$emit('update:fieldPreference', $event)"
        :options="[
          { label: 'Get', value: 'get' },
          { label: 'Skip', value: 'skip' },
          { label: 'Manual', value: 'manual' }
        ]"
      />

      <!-- Analyzing Spinner (shown when analyzing, replaces control) -->
      <div v-else class="analyzing-state">
        <v-progress-circular indeterminate size="20" color="primary" />
        <span class="analyzing-text">Analyzing...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import SegmentedControl from '@/components/ui/SegmentedControl.vue';

const props = defineProps({
  label: {
    type: String,
    default: '',
  },
  fieldPreference: {
    type: String,
    required: true,
  },
  isAnalyzing: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['update:fieldPreference']);

const labelRef = ref(null);
const controlsRef = ref(null);
const slideDistance = ref(0);

// Calculate the distance the label needs to slide
const calculateSlideDistance = () => {
  if (!labelRef.value || !controlsRef.value) return;

  const controlsWidth = controlsRef.value.offsetWidth;
  const labelWidth = labelRef.value.offsetWidth;

  // Distance to slide from left edge to right edge
  slideDistance.value = controlsWidth - labelWidth;
};

// Computed style for the label
const labelStyle = computed(() => {
  const isRightAligned = props.fieldPreference !== 'get';
  const translateX = isRightAligned ? slideDistance.value : 0;

  return {
    transform: `translateX(${translateX}px)`,
  };
});

// Watch for preference changes and recalculate if needed
watch(() => props.fieldPreference, () => {
  nextTick(() => {
    calculateSlideDistance();
  });
});

// Watch for analyzing state changes (control visibility)
watch(() => props.isAnalyzing, () => {
  nextTick(() => {
    calculateSlideDistance();
  });
});

// Initialize on mount
onMounted(() => {
  nextTick(() => {
    // Add a small delay to ensure SegmentedControl is fully rendered
    setTimeout(() => {
      calculateSlideDistance();
    }, 50);
  });
});
</script>

<style scoped>
.metadata-item {
  margin-bottom: 16px;
}

/* Label Wrapper - constrains label width to match controls */
.label-wrapper {
  width: 100%;
  margin-bottom: 8px;
  overflow: visible; /* Ensure label is visible during animation */
}

/* Metadata Label - Clean sliding animation */
.metadata-label {
  display: inline-block;
  font-weight: 500;
  color: #333;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform; /* Optimize for smooth animations */
}

/* Field Controls Layout */
.field-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Analyzing State */
.analyzing-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
  min-height: 40px; /* Match approximate height of SegmentedControl */
}

.analyzing-text {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}
</style>
