<template>
  <v-dialog :model-value="show" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5 pa-4"> Upload Preview </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-4">
        <div class="preview-stats">
          <div class="stat-row">
            <span class="stat-label">Files Selected:</span>
            <span class="stat-value">{{ summary.totalSelected }}</span>
          </div>

          <div class="stat-row">
            <span class="stat-label">Unique Files:</span>
            <span class="stat-value">{{ summary.uniqueFiles }}</span>
          </div>

          <div v-if="summary.copies > 0" class="stat-row">
            <span class="stat-label">Copies Detected:</span>
            <span class="stat-value stat-highlight">{{ summary.copies }}</span>
          </div>

          <div v-if="summary.redundant > 0" class="stat-row">
            <span class="stat-label">Redundant:</span>
            <span class="stat-value stat-muted">{{ summary.redundant }} (filtered)</span>
          </div>

          <div v-if="summary.readErrors > 0" class="stat-row">
            <span class="stat-label">Read Errors:</span>
            <span class="stat-value stat-error">{{ summary.readErrors }}</span>
          </div>
        </div>

        <v-divider class="my-4"></v-divider>

        <div class="upload-summary">
          <div class="summary-row">
            <span class="summary-label">To Upload:</span>
            <span class="summary-value">{{ summary.toUpload }} files</span>
          </div>

          <div v-if="summary.metadataOnly > 0" class="summary-row">
            <span class="summary-label">Metadata Only:</span>
            <span class="summary-value">{{ summary.metadataOnly }} files</span>
          </div>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="handleCancel"> Cancel </v-btn>
        <v-btn color="primary" variant="elevated" @click="handleConfirm"> Confirm Upload </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'UploadPreviewModal',
});

// Props
defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  summary: {
    type: Object,
    required: true,
    default: () => ({
      totalSelected: 0,
      uniqueFiles: 0,
      copies: 0,
      redundant: 0,
      readErrors: 0,
      toUpload: 0,
      metadataOnly: 0,
    }),
  },
});

// Emits
const emit = defineEmits(['confirm', 'cancel']);

// Handlers
const handleConfirm = () => {
  emit('confirm');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.preview-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  font-size: 0.95rem;
  color: #374151;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  color: #1f2937;
  font-weight: 600;
}

.stat-highlight {
  color: #9c27b0; /* Purple for copies */
}

.stat-muted {
  color: #6b7280; /* Gray for filtered */
  font-weight: 400;
}

.stat-error {
  color: #f44336; /* Red for errors */
}

.upload-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 0.95rem;
  color: #4b5563;
  font-weight: 500;
}

.summary-value {
  font-size: 1.05rem;
  color: #1f2937;
  font-weight: 700;
}
</style>
