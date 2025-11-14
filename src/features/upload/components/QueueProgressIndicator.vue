<template>
  <v-dialog
    :model-value="true"
    persistent
    no-click-animation
    max-width="500"
    scrim="rgba(0, 0, 0, 0.7)"
  >
    <v-card class="queue-progress-modal">
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
});

// Computed
const progressPercent = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.processed / props.total) * 100);
});
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
</style>
