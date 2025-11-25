<template>
  <div class="upload-table-footer">
    <div class="footer-content">
      <!-- Left: File Statistics -->
      <UploadTableFooterStats :stats="stats" />

      <!-- Right: Action Buttons -->
      <div class="footer-right">
        <!-- Clear Files Menu -->
        <ClearFilesMenu
          v-if="!isUploading && !isPaused"
          :duplicates="stats.duplicates"
          :skip-only-count="stats.skipOnlyCount"
          :copy-count="stats.copyCount"
          :duplicates-hidden="duplicatesHidden"
          @clear-duplicates="emit('clear-duplicates')"
          @clear-skipped="emit('clear-skipped')"
          @toggle-duplicates="emit('toggle-duplicates')"
        />

        <!-- Upload Control Buttons -->
        <UploadControlButtons
          :stats="stats"
          :is-uploading="isUploading"
          :is-paused="isPaused"
          :verification-state="verificationState"
          @upload="emit('upload')"
          @retry-failed="emit('retry-failed')"
          @pause="emit('pause')"
          @resume="emit('resume')"
          @cancel="emit('cancel')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import UploadTableFooterStats from './UploadTableFooterStats.vue';
import ClearFilesMenu from './ClearFilesMenu.vue';
import UploadControlButtons from './UploadControlButtons.vue';

defineOptions({
  name: 'UploadTableFooter',
});

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

const emit = defineEmits([
  'upload',
  'clear-queue',
  'pause',
  'resume',
  'cancel',
  'retry-failed',
  'clear-duplicates',
  'clear-skipped',
  'toggle-duplicates',
]);
</script>

<style scoped>
.upload-table-footer {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  z-index: 10;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* Prevent footer from shrinking */
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
  color: #374151;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

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
}
</style>
