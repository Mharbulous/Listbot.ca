<template>
  <v-dialog
    :model-value="true"
    persistent
    no-click-animation
    max-width="500"
    scrim="rgba(0, 0, 0, 0.7)"
  >
    <v-card class="queue-progress-modal">
      <!-- Progress Mode -->
      <template v-if="!cancelled">
        <v-card-text class="pa-6">
          <div class="progress-content">
            <div class="progress-text">
              <span class="progress-label">Queueing files...</span>
              <span class="progress-count">({{ processed }}/{{ total }} analyzed)</span>
            </div>
            <v-progress-linear
              :model-value="progressPercent"
              color="primary"
              height="8"
              rounded
              class="mt-4"
            />
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn
            variant="text"
            color="error"
            @click="handleCancel"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </template>

      <!-- Summary Mode -->
      <template v-else>
        <v-card-text class="pa-6">
          <div class="summary-content">
            <div class="summary-title">
              <span class="summary-label">Queueing Cancelled</span>
            </div>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="stat-label">Files successfully queued:</span>
                <span class="stat-value">{{ filesReady }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">File copies detected:</span>
                <span class="stat-value">{{ filesCopies }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Duplicates filtered:</span>
                <span class="stat-value">{{ filesDuplicates }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Files not processed:</span>
                <span class="stat-value">{{ filesSkipped }}</span>
              </div>
              <div v-if="filesUnsupported > 0" class="stat-item">
                <span class="stat-label">Unsupported files:</span>
                <span class="stat-value">{{ filesUnsupported }}</span>
              </div>
              <div v-if="filesReadError > 0" class="stat-item">
                <span class="stat-label">Read errors:</span>
                <span class="stat-value">{{ filesReadError }}</span>
              </div>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn
            variant="text"
            color="primary"
            @click="handleClose"
          >
            Close
          </v-btn>
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

// Component configuration
defineOptions({
  name: 'QueueProgressIndicator',
});

// Props
const props = defineProps({
  processed: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  cancelled: {
    type: Boolean,
    default: false,
  },
  filesReady: {
    type: Number,
    default: 0,
  },
  filesCopies: {
    type: Number,
    default: 0,
  },
  filesDuplicates: {
    type: Number,
    default: 0,
  },
  filesUnsupported: {
    type: Number,
    default: 0,
  },
  filesReadError: {
    type: Number,
    default: 0,
  },
});

// Emits
const emit = defineEmits(['cancel', 'close']);

// Computed
const progressPercent = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.processed / props.total) * 100);
});

const filesSkipped = computed(() => {
  return props.total - props.processed;
});

// Methods
const handleCancel = () => {
  emit('cancel');
};

const handleClose = () => {
  emit('close');
};
</script>

<style scoped>
.queue-progress-modal {
  border-radius: 12px;
}

.progress-content {
  text-align: center;
}

.progress-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.progress-label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.progress-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-content {
  text-align: center;
}

.summary-title {
  margin-bottom: 1.5rem;
}

.summary-label {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
}

.summary-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: #f3f4f6;
  border-radius: 8px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}
</style>
