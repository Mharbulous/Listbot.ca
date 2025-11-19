<template>
  <div
    class="status-cell"
    :title="tooltipText"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <span class="status-dot" :class="`status-${status}`"></span>
    <span class="status-text">{{ displayStatusText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useLazyHashTooltip } from '../composables/useLazyHashTooltip.js';

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
        'copied', // Copy file with metadata copied (not uploaded to Storage)
        'skipped',
        'skip',
        'error',
        'network_error',
        'copy',
        'duplicate',
        'read error',
        'uploaded',
        'failed',
        'redundant', // Legacy - deprecated in favor of 'duplicate'
        'uploadMetadataOnly', // Legacy - deprecated in favor of 'copy'
        'unknown',
        'n/a',
      ].includes(value),
  },
  hash: {
    type: String,
    default: null,
  },
  file: {
    type: Object,
    default: null,
  },
});

// Lazy hash tooltip composable
const { onTooltipHover, onTooltipLeave, getHashDisplay, hasHash } = useLazyHashTooltip();

// Status text mapping
const statusTextMap = {
  ready: 'Ready',
  hashing: 'Hashing...',
  checking: 'Checking...',
  uploading: 'Uploading...',
  creating_metadata: 'Saving...',
  completed: 'Uploaded',
  uploaded: 'Uploaded',
  copied: 'Copied',
  skipped: 'Duplicate',
  skip: 'Skip',
  error: 'Failed',
  failed: 'Failed',
  network_error: 'Network Error',
  copy: 'Copy',
  duplicate: 'Duplicate',
  'read error': 'Read Error',
  redundant: 'Duplicate', // Legacy - maps to 'Duplicate' for backward compatibility
  uploadMetadataOnly: 'Copy', // Legacy - maps to 'Copy' for backward compatibility
  unknown: 'Unknown',
  'n/a': 'N/A',
};

// Base status text
const baseStatusText = computed(() => statusTextMap[props.status] || 'Unknown');

// Display status text with tentative indicator and upload progress
// Phase 3a: Add "?" for tentative duplicate/copy status (no hash yet)
// Phase 3b: Add "X%" for uploading primary files
const displayStatusText = computed(() => {
  // Phase 3b: Show upload progress for uploading files
  if (props.status === 'uploading') {
    // Primary file - show progress if available
    if (props.file?.uploadProgress !== undefined && props.file.uploadProgress > 0) {
      return `Uploading ${props.file.uploadProgress}%`;
    }
    // Copy file or no progress yet - just show "Uploading..."
    return 'Uploading...';
  }

  // Phase 3a: Tentative status indicator
  if ((props.status === 'duplicate' || props.status === 'copy') && !props.hash) {
    return baseStatusText.value + '?';
  }

  return baseStatusText.value;
});

// Tooltip text - enhanced with lazy hash calculation
const tooltipText = computed(() => {
  // If hash is already available, show it
  if (props.hash) {
    return props.hash;
  }

  // If file is provided and hash has been calculated via hover, show it
  if (props.file && hasHash(props.file.id)) {
    return getHashDisplay(props.file.id);
  }

  // Phase 3a: Show helpful tooltip for tentative statuses
  if ((props.status === 'duplicate' || props.status === 'copy') && !props.hash) {
    return 'Tentative status - will be verified before upload';
  }

  return '';
});

// Handle mouse enter - trigger hash calculation if needed
const handleMouseEnter = () => {
  // Only calculate hash if:
  // 1. File object is provided
  // 2. Hash is not already available on the file
  // 3. File has a sourceFile (the browser File object needed for hashing)
  if (props.file && !props.hash && props.file.sourceFile && props.file.id) {
    onTooltipHover(props.file.id, props.file.sourceFile, props.file);
  }
};

// Handle mouse leave
const handleMouseLeave = () => {
  onTooltipLeave();
};
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

.status-copied {
  background-color: #4caf50; /* Green - copy file with metadata copied */
}

.status-skipped {
  background-color: #ff9800; /* Orange */
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

.status-duplicate {
  background-color: #ffffff; /* White - indicates duplicate file (same hash, same metadata) */
  border: 1px solid #000000; /* Black border for visibility */
}

.status-redundant {
  /* Legacy status - maps to duplicate styling */
  background-color: #ffffff; /* White */
  border: 1px solid #000000; /* Black border */
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
