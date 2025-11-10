<template>
  <div class="metadata-item">
    <span
      class="metadata-label"
      :class="{ 'align-right': fieldPreference !== 'get' }"
    >
      {{ label }}
    </span>

    <div class="field-controls">
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
import SegmentedControl from '@/components/ui/SegmentedControl.vue';

defineProps({
  label: {
    type: String,
    required: true,
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
</script>

<style scoped>
.metadata-item {
  margin-bottom: 16px;
}

/* Metadata Label Alignment Animation */
.metadata-label {
  position: relative;
  display: inline-block;
  left: 0;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 500;
  color: #333;
}

.metadata-label.align-right {
  /* Move to right side of container, then adjust back by label width */
  left: 100%;
  transform: translateX(-100%);
}

/* Field Controls Layout */
.field-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
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
