<template>
  <div class="queue-progress-container">
    <div class="progress-content">
      <div class="progress-text">
        <span class="progress-label">Queueing files...</span>
        <span class="progress-count">({{ processed }}/{{ total }} analyzed)</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>
  </div>
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
.queue-progress-container {
  max-width: 1200px;
  margin: 0 auto 2rem auto;
  padding: 0 2rem;
}

.progress-content {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.progress-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.progress-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Responsive Design */
@media (max-width: 768px) {
  .queue-progress-container {
    padding: 0 1rem;
  }

  .progress-content {
    padding: 0.75rem 1rem;
  }

  .progress-text {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
