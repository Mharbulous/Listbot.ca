<template>
  <div class="upload-table-footer" :style="{ paddingRight: `calc(1.5rem + ${scrollbarWidth}px)` }">
    <div class="footer-content">
      <!-- File Counts (Left) -->
      <div class="footer-left">
        <span class="footer-stat">
          <strong>Total:</strong> {{ stats.total }}
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>Skipped:</strong> {{ stats.removed }}
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>Duplicates:</strong> {{ stats.duplicates }}
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>Failed:</strong> {{ stats.failed }}
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>Uploaded:</strong> {{ stats.uploaded }}/{{ stats.uploadable }}
        </span>
      </div>

      <!-- Upload Button (Right) -->
      <div class="footer-right">
        <v-btn
          color="white"
          variant="elevated"
          size="large"
          class="clear-queue-btn text-black"
          :disabled="stats.uncheckedCount === 0"
          @click="handleClearQueue"
        >
          <v-icon start>mdi-broom</v-icon>
          Clear {{ stats.uncheckedCount }} {{ stats.uncheckedCount === 1 ? 'skipped file' : 'skipped files' }}
        </v-btn>
        <v-btn
          color="success"
          variant="elevated"
          size="large"
          class="upload-btn"
          :disabled="stats.checkedCount === 0"
          @click="handleUpload"
        >
          <v-icon start>mdi-cloud-upload-outline</v-icon>
          Upload {{ stats.checkedCount }} {{ stats.checkedCount === 1 ? 'file' : 'files' }} ({{ stats.checkedSize }})
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'UploadTableFooter',
});

// Props
defineProps({
  stats: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        typeof value.total === 'number' &&
        typeof value.totalSize === 'string' &&
        typeof value.ready === 'number' &&
        typeof value.removed === 'number' &&
        typeof value.duplicates === 'number' &&
        typeof value.failed === 'number' &&
        typeof value.uploaded === 'number' &&
        typeof value.uploadable === 'number' &&
        typeof value.checkedCount === 'number' &&
        typeof value.checkedSize === 'string' &&
        typeof value.uncheckedCount === 'number'
      );
    },
  },
  scrollbarWidth: {
    type: Number,
    default: 0,
  },
});

// Emits
const emit = defineEmits(['upload', 'clear-queue']);

// Handle upload
const handleUpload = () => {
  emit('upload');
};

// Handle clear queue
const handleClearQueue = () => {
  emit('clear-queue');
};
</script>

<style scoped>
.upload-table-footer {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
  color: #374151;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.clear-queue-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 200px !important;
}

.clear-queue-btn:disabled {
  opacity: 1 !important;
  box-shadow: none !important;
  transform: translateY(3px) !important;
  color: #d1d5db !important;
}

.clear-queue-btn:disabled :deep(.v-icon) {
  color: #d1d5db !important;
}

.upload-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 260px !important;
}

.upload-btn:disabled {
  opacity: 1 !important;
  box-shadow: none !important;
  transform: translateY(3px) !important;
  color: #d1d5db !important;
}

.upload-btn:disabled :deep(.v-icon) {
  color: #d1d5db !important;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.footer-stat strong {
  font-weight: 600;
  color: #1f2937;
}

.footer-separator {
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .upload-table-footer {
    padding: 0.5rem 1rem;
  }

  .footer-content {
    font-size: 0.75rem;
    gap: 0.5rem;
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-right {
    gap: 0.5rem;
  }

  .footer-separator {
    display: none;
  }

  .footer-stat {
    flex-basis: calc(50% - 0.25rem);
  }
}
</style>
