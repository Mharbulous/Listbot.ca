<template>
  <v-dialog :model-value="show" max-width="480" persistent>
    <v-card>
      <v-card-title class="text-h6 pa-4 d-flex align-center">
        <v-icon icon="mdi-check-circle" color="success" size="28" class="mr-2"></v-icon>
        Upload Complete
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-4">
        <div class="metrics-list">
          <!-- Files Uploaded -->
          <div v-if="metrics.filesUploaded > 0" class="metric-row">
            <span class="status-dot green"></span>
            <span class="metric-value">{{ metrics.filesUploaded }}</span>
            <span class="metric-label">files uploaded</span>
          </div>

          <!-- Identical Variants (Copies) -->
          <div v-if="metrics.filesCopies > 0" class="metric-row">
            <span class="status-dot green"></span>
            <span class="metric-value">{{ metrics.filesCopies }}</span>
            <span class="metric-label">identical variant files found</span>
          </div>

          <!-- Previously Uploaded Files Skipped (Duplicates) -->
          <div v-if="metrics.duplicatesSkipped > 0" class="metric-row">
            <span class="status-dot orange"></span>
            <span class="metric-value">{{ metrics.duplicatesSkipped }}</span>
            <span class="metric-label">previously uploaded files skipped</span>
          </div>

          <!-- Previously Documented Copies Skipped -->
          <div v-if="metrics.copiesSkipped > 0" class="metric-row">
            <span class="status-dot orange"></span>
            <span class="metric-value">{{ metrics.copiesSkipped }}</span>
            <span class="metric-label">previously documented variants skipped</span>
          </div>

          <!-- Failed Uploads -->
          <div v-if="metrics.failedFiles > 0" class="metric-row">
            <span class="status-dot red"></span>
            <span class="metric-value">{{ metrics.failedFiles }}</span>
            <span class="metric-label">files failed to upload</span>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="elevated" @click="handleClose">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
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
      copiesSkipped: 0,
      duplicatesSkipped: 0,
      totalFiles: 0,
      failedFiles: 0,
    }),
  },
});

// Emits
const emit = defineEmits(['close']);

// Handlers
const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.metrics-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.status-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.green {
  background-color: #4caf50;
}

.status-dot.orange {
  background-color: #ff9800;
}

.status-dot.red {
  background-color: #f44336;
}

.metric-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1f2937;
  min-width: 32px;
  text-align: right;
}

.metric-label {
  font-size: 0.9375rem;
  color: #374151;
  font-weight: 400;
}
</style>
