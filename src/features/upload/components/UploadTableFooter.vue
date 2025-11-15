<template>
  <div class="upload-table-footer">
    <div class="footer-content">
      <!-- File Counts (Left) -->
      <div class="footer-left">
        <span class="footer-stat">
          <strong>{{ stats.ready }}</strong> Ready
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>{{ stats.uploaded }}</strong> Uploaded
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>{{ stats.failed }}</strong> Failed
        </span>
        <span class="footer-separator">|</span>
        <span class="footer-stat">
          <strong>{{ stats.total }}</strong> Total
        </span>
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
          class="upload-btn"
          :disabled="stats.checkedCount === 0 || stats.duplicates > 0 || verificationState.isVerifying"
          @click="handleUpload"
        >
          <!-- Show broom icon when deduplicating, otherwise cloud upload icon -->
          <template v-if="verificationState.isVerifying">
            <span class="broom-icon" v-html="broomIconSvg"></span>
          </template>
          <v-icon v-else start>mdi-cloud-upload-outline</v-icon>
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

// Broom icon SVG for deduplication state
const broomIconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path fill="currentColor" fill-rule="evenodd" d="M7.543 1.209A.875.875 0 0 0 5.925.542l-2.847 6.91A3.2 3.2 0 0 0 .827 8.84c-.634.915-.85 2.104-.825 3.138c.032 1.295 1.198 2.02 2.277 2.02h6.416a.625.625 0 1 0 0-1.25q.015.001-.005-.004a1.4 1.4 0 0 1-.282-.11a2.7 2.7 0 0 1-.645-.452a2.56 2.56 0 0 1-.82-1.925c0-.918-.468-1.608-1.035-2.061a3.6 3.6 0 0 0-1.012-.563zM1.854 9.55c-.433.627-.624 1.525-.602 2.396c.01.412.4.8 1.027.8h4.303a3.8 3.8 0 0 1-.889-2.49c0-.45-.218-.807-.565-1.084a2.4 2.4 0 0 0-1.162-.487c-1.067-.114-1.708.282-2.112.865m9.436-1.07c0 .345-.28.625-.625.625H8.4a.625.625 0 1 1 0-1.25h2.264c.345 0 .625.28.625.625m.821 3.067a.625.625 0 1 0 0-1.25H9.847a.625.625 0 0 0 0 1.25zM13.375 14a.625.625 0 1 0 0-1.25h-2.264a.625.625 0 1 0 0 1.25z" clip-rule="evenodd"/></svg>';

// Get upload button text based on current state
const getUploadButtonText = () => {
  if (props.verificationState.isVerifying) {
    const remaining = props.verificationState.total - props.verificationState.processed;
    return `Deduplicating... (${remaining} remaining)`;
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

.broom-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  vertical-align: middle;
}

.broom-icon :deep(svg) {
  display: block;
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

  .footer-separator {
    display: none;
  }

  .footer-stat {
    flex-basis: calc(50% - 0.25rem);
  }
}
</style>
