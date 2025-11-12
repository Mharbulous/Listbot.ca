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
      [
        'ready',
        'hashing',
        'checking',
        'uploading',
        'creating_metadata',
        'completed',
        'skipped',
        'skip',
        'error',
        'network_error',
        'copy',
        'read error',
        'uploaded',
        'failed',
        'uploadMetadataOnly',
        'unknown',
        'n/a',
      ].includes(value),
  },
});

// Status text mapping
const statusTextMap = {
  ready: 'Ready',
  hashing: 'Hashing...',
  checking: 'Checking...',
  uploading: 'Uploading...',
  creating_metadata: 'Saving...',
  completed: 'Uploaded',
  uploaded: 'Uploaded',
  skipped: 'Duplicate',
  skip: 'Skip',
  error: 'Failed',
  failed: 'Failed',
  network_error: 'Network Error',
  copy: 'Copy',
  'read error': 'Read Error',
  uploadMetadataOnly: 'Metadata Only', // Legacy - deprecated in favor of 'copy'
  unknown: 'Unknown',
  'n/a': 'N/A',
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
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Status System */
.status-ready {
  background-color: #2196f3; /* Blue */
}

.status-hashing {
  background-color: #00bcd4; /* Cyan */
  animation: pulse 1.5s ease-in-out infinite;
}

.status-checking {
  background-color: #03a9f4; /* Light Blue */
  animation: pulse 1.5s ease-in-out infinite;
}

.status-uploading {
  background-color: #ffc107; /* Yellow */
  animation: pulse 1.5s ease-in-out infinite;
}

.status-creating_metadata {
  background-color: #8bc34a; /* Light Green */
  animation: pulse 1.5s ease-in-out infinite;
}

.status-completed {
  background-color: #4caf50; /* Green */
}

.status-skipped {
  background-color: #9c27b0; /* Purple */
}

.status-skip {
  background-color: #ffffff; /* White */
  border: 1px solid #9e9e9e; /* Gray border */
}

.status-error {
  background-color: #f44336; /* Red */
}

.status-network_error {
  background-color: #ff5722; /* Deep Orange */
}

.status-copy {
  background-color: #9c27b0; /* Purple - indicates copy (same hash, different metadata) */
}

.status-read.error {
  background-color: #f44336; /* Red - hash/read failure */
}

.status-uploaded {
  background-color: #4caf50; /* Green - successfully uploaded */
}

.status-failed {
  background-color: #ff5722; /* Deep Orange - upload failed */
}

.status-uploadMetadataOnly {
  background-color: #ffffff; /* White - Legacy status (deprecated in favor of 'copy') */
  border: 1px solid #ccc;
}

.status-unknown {
  background-color: #9e9e9e; /* Gray */
}

.status-n\/a {
  background-color: #ff9800; /* Orange */
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
