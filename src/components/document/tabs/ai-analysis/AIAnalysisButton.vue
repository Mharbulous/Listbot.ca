<template>
  <div class="analyze-document-section">
    <!-- Message when no fields remain to be filled -->
    <div v-if="!hasEmptyFields" class="no-fields-message">
      There are no empty fields to be filled out.
    </div>

    <button
      @click="$emit('analyze')"
      :disabled="isAnalyzing || !hasEmptyFields"
      class="analyze-document-button"
    >
      <span>🚀Analyze Document</span>
      <v-progress-circular
        v-if="isAnalyzing"
        indeterminate
        size="20"
        width="2"
        color="white"
        class="button-loader"
      />
    </button>
  </div>
</template>

<script setup>
defineProps({
  hasEmptyFields: {
    type: Boolean,
    required: true,
  },
  isAnalyzing: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['analyze']);
</script>

<style scoped>
.analyze-document-section {
  margin-top: 24px;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.no-fields-message {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 24px;
  width: 100%;
}

.analyze-document-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  background-color: #1976d2; /* Primary blue */
  border: none;
  border-radius: 0.75rem; /* rounded-xl */
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 10px 15px -3px rgb(25 118 210 / 0.3), 0 4px 6px -4px rgb(25 118 210 / 0.3); /* shadow-lg shadow-primary/30 */
  min-width: 200px;
}

.analyze-document-button:hover:not(:disabled) {
  background-color: #1565c0; /* Darker blue on hover */
  transform: translateY(-1px);
  box-shadow: 0 20px 25px -5px rgb(25 118 210 / 0.3), 0 8px 10px -6px rgb(25 118 210 / 0.3);
}

.analyze-document-button:active:not(:disabled) {
  transform: translateY(0);
}

.analyze-document-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-loader {
  margin-left: 0.25rem;
}
</style>
