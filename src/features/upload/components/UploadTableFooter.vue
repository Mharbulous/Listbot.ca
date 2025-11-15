<template>
  <div class="upload-table-footer">
    <div class="footer-content">
      <!-- File Counts (Left) -->
      <div class="footer-left">
        <!-- Line 1: Ready + Copies = Total -->
        <div class="footer-line">
          <span class="footer-stat">
            <strong>{{ stats.ready }}</strong> Ready
          </span>
          <span v-if="stats.copyCount > 0" class="footer-stat">
            + <strong>{{ stats.copyCount }}</strong> Copies
          </span>
          <span class="footer-stat">
            = <strong>{{ stats.total }}</strong> Total
          </span>
        </div>

        <!-- Line 2: Uploaded | Failed -->
        <div class="footer-line">
          <span class="footer-stat">
            <strong>{{ stats.uploaded }}/{{ stats.ready }}</strong> Uploaded
          </span>
          <span class="footer-separator">|</span>
          <span class="footer-stat">
            <strong>{{ stats.failed }}</strong> Failed
          </span>
        </div>
      </div>

      <!-- Upload Button (Right) -->
      <div class="footer-right">
        <!-- Clear Queue Button with Drop-up Menu (shown when NOT uploading and has unchecked files) -->
        <v-menu v-if="!isUploading && !isPaused" location="top">
          <template v-slot:activator="{ props: menuProps }">
            <v-btn
              color="white"
              variant="elevated"
              size="large"
              class="clear-queue-btn text-black"
              :disabled="stats.duplicates === 0 && stats.skipOnlyCount === 0 && stats.copyCount === 0"
              v-bind="menuProps"
            >
              <v-icon start>mdi-broom</v-icon>
              Clear Files
              <v-icon end>mdi-chevron-up</v-icon>
            </v-btn>
          </template>

          <v-list density="compact">
            <v-list-item
              :disabled="stats.duplicates === 0"
              @click="handleClearDuplicates"
            >
              <template v-slot:prepend>
                <span class="status-dot-menu status-duplicate-menu"></span>
              </template>
              <v-list-item-title>
                Clear {{ stats.duplicates }} {{ stats.duplicates === 1 ? 'duplicate' : 'duplicates' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item
              :disabled="stats.skipOnlyCount === 0"
              @click="handleClearSkipped"
            >
              <template v-slot:prepend>
                <span class="status-dot-menu status-skip-menu"></span>
              </template>
              <v-list-item-title>
                Clear {{ stats.skipOnlyCount }} skipped {{ stats.skipOnlyCount === 1 ? 'file' : 'files' }}
              </v-list-item-title>
            </v-list-item>

            <v-list-item
              :disabled="stats.copyCount === 0"
              @click="handleToggleDuplicates"
            >
              <template v-slot:prepend>
                <span class="status-dot-menu status-skipped-menu"></span>
              </template>
              <v-list-item-title>
                {{ duplicatesHidden ? 'Show' : 'Hide' }} {{ stats.copyCount }} {{ stats.copyCount === 1 ? 'copy' : 'copies' }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Retry Failed Button (shown when has failed files and NOT uploading) -->
        <v-btn
          v-if="!isUploading && !isPaused && stats.failed > 0"
          color="warning"
          variant="elevated"
          size="large"
          class="retry-btn"
          @click="handleRetryFailed"
        >
          <v-icon start>mdi-refresh</v-icon>
          Retry {{ stats.failed }} failed {{ stats.failed === 1 ? 'file' : 'files' }}
        </v-btn>

        <!-- Upload Button (shown when NOT uploading) -->
        <v-btn
          v-if="!isUploading && !isPaused"
          color="success"
          variant="elevated"
          size="large"
          :class="['upload-btn', { 'upload-btn-progress': verificationState.isVerifying }]"
          :style="verificationState.isVerifying ? { '--progress': `${deduplicationProgress}%` } : {}"
          :disabled="stats.checkedCount === 0 || stats.duplicates > 0 || verificationState.isVerifying"
          @click="handleUpload"
        >
          <v-icon start>mdi-cloud-upload-outline</v-icon>
          {{ getUploadButtonText() }}
        </v-btn>

        <!-- Pause Button (shown during active upload) -->
        <v-btn
          v-if="isUploading && !isPaused"
          color="warning"
          variant="elevated"
          size="large"
          class="pause-btn"
          @click="handlePause"
        >
          <v-icon start>mdi-pause</v-icon>
          Pause Upload
        </v-btn>

        <!-- Cancel Button (shown during active upload) -->
        <v-btn
          v-if="isUploading && !isPaused"
          color="error"
          variant="elevated"
          size="large"
          class="cancel-btn"
          @click="handleCancel"
        >
          <v-icon start>mdi-close-circle</v-icon>
          Cancel
        </v-btn>

        <!-- Resume Button (shown when paused) -->
        <v-btn
          v-if="isPaused"
          color="success"
          variant="elevated"
          size="large"
          class="resume-btn"
          @click="handleResume"
        >
          <v-icon start>mdi-play</v-icon>
          Resume Upload
        </v-btn>

        <!-- Cancel Button (shown when paused) -->
        <v-btn
          v-if="isPaused"
          color="error"
          variant="elevated"
          size="large"
          class="cancel-btn"
          @click="handleCancel"
        >
          <v-icon start>mdi-close-circle</v-icon>
          Cancel
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Component configuration
defineOptions({
  name: 'UploadTableFooter',
});

// Props
const props = defineProps({
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
        typeof value.copyCount === 'number' &&
        typeof value.skipOnlyCount === 'number'
      );
    },
  },
  isUploading: {
    type: Boolean,
    default: false,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  duplicatesHidden: {
    type: Boolean,
    default: false,
  },
  verificationState: {
    type: Object,
    default: () => ({
      isVerifying: false,
      processed: 0,
      total: 0,
    }),
  },
});

// Emits
const emit = defineEmits(['upload', 'clear-queue', 'pause', 'resume', 'cancel', 'retry-failed', 'clear-duplicates', 'clear-skipped', 'toggle-duplicates']);

// Handle upload
const handleUpload = () => {
  emit('upload');
};

// Handle clear queue
const handleClearQueue = () => {
  emit('clear-queue');
};

// Handle pause
const handlePause = () => {
  emit('pause');
};

// Handle resume
const handleResume = () => {
  emit('resume');
};

// Handle cancel
const handleCancel = () => {
  emit('cancel');
};

// Handle retry failed
const handleRetryFailed = () => {
  emit('retry-failed');
};

// Handle clear duplicates
const handleClearDuplicates = () => {
  emit('clear-duplicates');
};

// Handle clear skipped
const handleClearSkipped = () => {
  emit('clear-skipped');
};

// Handle toggle duplicates visibility
const handleToggleDuplicates = () => {
  emit('toggle-duplicates');
};

// Computed property for deduplication progress percentage
const deduplicationProgress = computed(() => {
  if (!props.verificationState.isVerifying || props.verificationState.total === 0) {
    return 0;
  }
  return Math.round((props.verificationState.processed / props.verificationState.total) * 100);
});

// Get upload button text based on current state
const getUploadButtonText = () => {
  if (props.verificationState.isVerifying) {
    return 'Deduplicating...';
  }
  if (props.stats.duplicates > 0) {
    return 'Clear duplicates b4 uploading';
  }
  return `Upload ${props.stats.checkedCount} ${props.stats.checkedCount === 1 ? 'file' : 'files'} (${props.stats.checkedSize})`;
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
  flex-direction: column;
  gap: 0.5rem;
}

.footer-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

/* Progress bar styling for deduplication state */
.upload-btn-progress {
  position: relative;
  overflow: hidden;
  background-color: #1a2e1a !important;
}

.upload-btn-progress::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: var(--progress, 0);
  background: #4caf50;
  transition: width 0.3s ease;
  z-index: 0;
}

.upload-btn-progress :deep(.v-btn__content) {
  position: relative;
  z-index: 1;
  color: white !important;
}

.upload-btn-progress:disabled::before {
  background: #4caf50;
}

.retry-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 220px !important;
}

.pause-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 180px !important;
}

.resume-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 180px !important;
}

.cancel-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 140px !important;
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

/* Status dots for menu items */
.status-dot-menu {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 8px;
}

.status-duplicate-menu {
  background-color: #ffffff;
  border: 1px solid #000000;
}

.status-skip-menu {
  background-color: #ffffff;
  border: 1px solid #9e9e9e;
}

.status-skipped-menu {
  background-color: #9c27b0;
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

  .footer-line {
    gap: 0.35rem;
  }
}
</style>
