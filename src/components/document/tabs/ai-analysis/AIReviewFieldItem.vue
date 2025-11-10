<template>
  <div class="review-field">
    <div class="field-label">{{ label }}</div>

    <!-- Editable Input Field -->
    <div class="input-wrapper">
      <!-- Date Input -->
      <v-text-field
        v-if="fieldType === 'date'"
        :model-value="reviewValue"
        type="date"
        variant="outlined"
        density="compact"
        :error-messages="reviewError"
        @update:model-value="$emit('update:reviewValue', $event)"
        @input="$emit('clearError')"
      />

      <!-- Select/Dropdown Input -->
      <v-select
        v-else-if="fieldType === 'select'"
        :model-value="reviewValue"
        :items="selectOptions"
        variant="outlined"
        density="compact"
        :error-messages="reviewError"
        @update:model-value="handleSelectUpdate"
      />

      <!-- Confidence Badge (only if AI-extracted) -->
      <v-tooltip v-if="aiResult" location="bottom">
        <template v-slot:activator="{ props: tooltipProps }">
          <v-chip
            v-bind="tooltipProps"
            :color="getConfidenceColor(aiResult.confidence)"
            size="small"
            variant="flat"
            class="confidence-badge"
          >
            {{ aiResult.confidence }}%
          </v-chip>
        </template>

        <div class="ai-tooltip-content">
          <!-- AI Reasoning -->
          <div v-if="aiResult.metadata?.aiReasoning">
            <strong>AI Reasoning:</strong>
            <p>{{ aiResult.metadata.aiReasoning }}</p>
          </div>

          <!-- Context -->
          <div v-if="aiResult.metadata?.context">
            <strong>Context:</strong>
            <p>{{ aiResult.metadata.context }}</p>
          </div>
        </div>
      </v-tooltip>
    </div>

    <!-- Accept/Reject Buttons -->
    <div class="review-actions">
      <v-btn
        color="success"
        prepend-icon="mdi-check"
        size="small"
        :disabled="!isAcceptEnabled"
        :loading="saving"
        @click="$emit('accept')"
      >
        Accept
      </v-btn>

      <v-btn
        color="error"
        prepend-icon="mdi-close"
        size="small"
        variant="outlined"
        @click="$emit('reject')"
      >
        Reject
      </v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  fieldName: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  fieldType: {
    type: String,
    required: true,
    validator: (value) => ['date', 'select', 'text'].includes(value),
  },
  selectOptions: {
    type: Array,
    default: () => [],
  },
  aiResult: {
    type: Object,
    default: null,
  },
  reviewValue: {
    type: String,
    required: true,
  },
  reviewError: {
    type: String,
    default: '',
  },
  saving: {
    type: Boolean,
    default: false,
  },
  isAcceptEnabled: {
    type: Boolean,
    required: true,
  },
  getConfidenceColor: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(['update:reviewValue', 'clearError', 'accept', 'reject']);

// Handle select update (emit both events)
const handleSelectUpdate = (value) => {
  emit('update:reviewValue', value);
  emit('clearError');
};
</script>

<style scoped>
.review-field {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #fff;
}

.field-label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #333;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.confidence-badge {
  align-self: flex-start;
}

.review-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* Tooltip Content */
.ai-tooltip-content {
  max-width: 300px;
}

.ai-tooltip-content > div {
  margin-bottom: 8px;
}

.ai-tooltip-content strong {
  display: block;
  margin-bottom: 4px;
  font-size: 0.875rem;
}

.ai-tooltip-content p {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
}
</style>
