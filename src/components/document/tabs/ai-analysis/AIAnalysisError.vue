<template>
  <v-alert
    type="error"
    variant="tonal"
    class="ai-error-alert"
    closable
    @click:close="$emit('close')"
  >
    <template v-slot:title>
      <strong>{{ error.title }}</strong>
    </template>

    <p class="ai-error-message">{{ error.message }}</p>
    <p v-if="error.details" class="ai-error-details">{{ error.details }}</p>

    <!-- Retry Button -->
    <v-btn
      v-if="!error.action"
      @click="$emit('retry')"
      color="primary"
      variant="outlined"
      size="small"
      class="ai-error-action"
      prepend-icon="mdi-refresh"
    >
      Retry
    </v-btn>

    <!-- Action Button (e.g., Firebase Console link) -->
    <v-btn
      v-if="error.action"
      :href="error.action.url"
      target="_blank"
      color="error"
      variant="outlined"
      size="small"
      class="ai-error-action"
    >
      {{ error.action.text }}
      <v-icon right>mdi-open-in-new</v-icon>
    </v-btn>
  </v-alert>
</template>

<script setup>
defineProps({
  error: {
    type: Object,
    required: true,
  },
});

defineEmits(['close', 'retry']);
</script>

<style scoped>
.ai-error-alert {
  margin-bottom: 20px;
}

.ai-error-message {
  margin: 8px 0;
  font-size: 0.9rem;
  line-height: 1.5;
}

.ai-error-details {
  margin: 8px 0 12px 0;
  font-size: 0.85rem;
  font-style: italic;
  opacity: 0.9;
}

.ai-error-action {
  margin-top: 8px;
}
</style>
