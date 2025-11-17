<template>
  <div class="control-buttons">
    <!-- Retry Failed Button -->
    <v-btn
      v-if="showRetryButton"
      color="warning"
      variant="elevated"
      size="large"
      class="retry-btn"
      @click="handleRetryFailed"
    >
      <v-icon start>mdi-refresh</v-icon>
      Retry {{ stats.failed }} failed {{ stats.failed === 1 ? 'file' : 'files' }}
    </v-btn>

    <!-- Upload Button -->
    <v-btn
      v-if="showUploadButton"
      color="success"
      variant="elevated"
      size="large"
      :class="['upload-btn', { 'upload-btn-progress': verificationState.isVerifying }]"
      :style="verificationState.isVerifying ? { '--progress': `${deduplicationProgress}%` } : {}"
      :disabled="isUploadDisabled"
      @click="handleUpload"
    >
      <v-icon start>mdi-cloud-upload-outline</v-icon>
      {{ uploadButtonText }}
    </v-btn>

    <!-- Pause Button -->
    <v-btn
      v-if="showPauseButton"
      color="warning"
      variant="elevated"
      size="large"
      class="pause-btn"
      @click="handlePause"
    >
      <v-icon start>mdi-pause</v-icon>
      Pause Upload
    </v-btn>

    <!-- Resume Button -->
    <v-btn
      v-if="showResumeButton"
      color="success"
      variant="elevated"
      size="large"
      class="resume-btn"
      @click="handleResume"
    >
      <v-icon start>mdi-play</v-icon>
      Resume Upload
    </v-btn>

    <!-- Cancel Button -->
    <v-btn
      v-if="showCancelButton"
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
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'UploadControlButtons',
});

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        typeof value.failed === 'number' &&
        typeof value.checkedCount === 'number' &&
        typeof value.checkedSize === 'string' &&
        typeof value.duplicates === 'number'
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
  verificationState: {
    type: Object,
    default: () => ({
      isVerifying: false,
      processed: 0,
      total: 0,
    }),
  },
});

const emit = defineEmits(['upload', 'retry-failed', 'pause', 'resume', 'cancel']);

const showRetryButton = computed(() => {
  return !props.isUploading && !props.isPaused && props.stats.failed > 0;
});

const showUploadButton = computed(() => {
  return !props.isUploading && !props.isPaused;
});

const showPauseButton = computed(() => {
  return props.isUploading && !props.isPaused;
});

const showResumeButton = computed(() => {
  return props.isPaused;
});

const showCancelButton = computed(() => {
  return props.isUploading || props.isPaused;
});

const isUploadDisabled = computed(() => {
  return (
    props.stats.checkedCount === 0 ||
    props.stats.duplicates > 0 ||
    props.verificationState.isVerifying
  );
});

const deduplicationProgress = computed(() => {
  if (!props.verificationState.isVerifying || props.verificationState.total === 0) {
    return 0;
  }
  return Math.round((props.verificationState.processed / props.verificationState.total) * 100);
});

const uploadButtonText = computed(() => {
  if (props.verificationState.isVerifying) {
    return 'Deduplicating...';
  }
  const count = props.stats.checkedCount;
  const size = props.stats.checkedSize;
  return `Upload ${count} ${count === 1 ? 'file' : 'files'} (${size})`;
});

const handleUpload = () => {
  emit('upload');
};

const handleRetryFailed = () => {
  emit('retry-failed');
};

const handlePause = () => {
  emit('pause');
};

const handleResume = () => {
  emit('resume');
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.control-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
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
  background: #10b981;
  transition: width 0.3s ease;
  z-index: 0;
}

.upload-btn-progress :deep(.v-btn__content) {
  position: relative;
  z-index: 1;
  color: white !important;
}

.upload-btn-progress:disabled::before {
  background: #10b981;
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

@media (max-width: 768px) {
  .control-buttons {
    gap: 0.5rem;
  }
}
</style>
