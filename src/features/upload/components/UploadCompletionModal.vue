<template>
  <v-dialog :model-value="show" max-width="550" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4 d-flex align-center">
        <v-icon icon="mdi-check-circle" color="success" size="32" class="mr-2"></v-icon>
        Upload Complete!
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-4">
        <div class="completion-summary">
          <div class="summary-row primary">
            <span class="summary-label">Files Uploaded:</span>
            <span class="summary-value">{{ metrics.filesUploaded }}</span>
          </div>

          <div v-if="metrics.filesCopies > 0" class="summary-row">
            <span class="summary-label">Copies (Metadata Saved):</span>
            <span class="summary-value">{{ metrics.filesCopies }}</span>
          </div>

          <div class="summary-row total">
            <span class="summary-label">Total Files Processed:</span>
            <span class="summary-value">{{ metrics.totalFiles }}</span>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <div class="dedup-metrics">
          <div v-if="metrics.storageSaved > 0" class="metric-highlight">
            <div class="metric-icon">💾</div>
            <div class="metric-content">
              <div class="metric-label">Storage Saved</div>
              <div class="metric-value">{{ formatBytes(metrics.storageSaved) }}</div>
            </div>
          </div>

          <div
            v-if="metrics.deduplicationRate && parseFloat(metrics.deduplicationRate) > 0"
            class="metric-highlight"
          >
            <div class="metric-icon">📊</div>
            <div class="metric-content">
              <div class="metric-label">Deduplication Rate</div>
              <div class="metric-value">{{ metrics.deduplicationRate }}</div>
            </div>
          </div>
        </div>

        <div v-if="hasErrors" class="error-notice">
          <v-icon icon="mdi-alert-circle" color="error" class="mr-2"></v-icon>
          <span>{{ metrics.failedFiles || 0 }} file(s) failed to upload</span>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="handleClose"> Close </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

// Component configuration
defineOptions({
  name: 'UploadCompletionModal',
});

// Props
const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  metrics: {
    type: Object,
    required: true,
    default: () => ({
      filesUploaded: 0,
      filesCopies: 0,
      totalFiles: 0,
      storageSaved: 0,
      deduplicationRate: '0%',
      failedFiles: 0,
    }),
  },
});

// Emits
const emit = defineEmits(['close']);

// Format bytes
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  // Always show 3 significant digits
  return value.toFixed(1) + ' ' + sizes[i];
};

// Check if there are errors
const hasErrors = computed(() => {
  return props.metrics.failedFiles && props.metrics.failedFiles > 0;
});

// Handlers
const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.completion-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 6px;
  background-color: #f9fafb;
}

.summary-row.primary {
  background-color: #e3f2fd;
}

.summary-row.total {
  background-color: #f3e5f5;
  font-weight: 600;
}

.summary-label {
  font-size: 0.95rem;
  color: #374151;
  font-weight: 500;
}

.summary-value {
  font-size: 1.1rem;
  color: #1f2937;
  font-weight: 700;
}

.dedup-metrics {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.metric-highlight {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-radius: 8px;
  border: 2px solid #4caf50;
}

.metric-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.metric-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label {
  font-size: 0.85rem;
  color: #2e7d32;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 1.25rem;
  color: #1b5e20;
  font-weight: 700;
}

.error-notice {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-top: 16px;
  background-color: #ffebee;
  border-radius: 6px;
  border: 1px solid #ef5350;
  color: #c62828;
  font-weight: 500;
}
</style>
