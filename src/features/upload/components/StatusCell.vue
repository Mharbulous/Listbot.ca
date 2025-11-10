<template>
  <div class="status-cell">
    <span class="status-dot" :class="`status-${status}`"></span>
    <span class="status-text">{{ statusText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Component configuration
defineOptions({
  name: 'StatusCell',
});

// Props
const props = defineProps({
  status: {
    type: String,
    required: true,
    validator: (value) =>
      ['ready', 'uploading', 'completed', 'skipped', 'skip', 'error', 'uploadMetadataOnly', 'unknown'].includes(value),
  },
});

// Status text mapping
const statusTextMap = {
  ready: 'Ready',
  uploading: 'Uploading...',
  completed: 'Uploaded',
  skipped: 'Duplicate',
  skip: 'Skip',
  error: 'Failed',
  uploadMetadataOnly: 'Metadata Only',
  unknown: 'Unknown',
};

const statusText = computed(() => statusTextMap[props.status] || 'Unknown');
</script>

<style scoped>
.status-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* 8-Color Status System */
.status-ready {
  background-color: #2196f3; /* Blue */
}

.status-uploading {
  background-color: #ffc107; /* Yellow */
  animation: pulse 1.5s ease-in-out infinite;
}

.status-completed {
  background-color: #4caf50; /* Green */
}

.status-skipped {
  background-color: #9c27b0; /* Purple */
}

.status-skip {
  background-color: #ff9800; /* Orange */
}

.status-error {
  background-color: #f44336; /* Red */
}

.status-uploadMetadataOnly {
  background-color: #ffffff; /* White */
  border: 1px solid #ccc;
}

.status-unknown {
  background-color: #9e9e9e; /* Gray */
}

.status-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

/* Pulsing animation for uploading status */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}
</style>
