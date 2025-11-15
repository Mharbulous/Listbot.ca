<template>
  <v-tooltip location="top" :open-delay="100">
    <template v-slot:activator="{ props: tooltipProps }">
      <div
        class="status-cell"
        v-bind="tooltipProps"
        @mouseenter="handleMouseEnter"
      >
        <span class="status-dot" :class="`status-${status}`"></span>
        <span class="status-text">{{ displayStatusText }}</span>
      </div>
    </template>
    <span>{{ tooltipText }}</span>
  </v-tooltip>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useLazyXXH3Tooltip } from '../composables/useLazyXXH3Tooltip.js';

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
  fileId: {
    type: String,
    required: true,
  },
  sourceFile: {
    type: File,
    default: null,
  },
  queueFile: {
    type: Object,
    default: null,
  },
});

// Initialize lazy XXH3 tooltip composable
const xxh3Tooltip = useLazyXXH3Tooltip();

// Pre-populate cache if xxh3Hash already exists
onMounted(() => {
  if (props.queueFile?.xxh3Hash) {
    xxh3Tooltip.populateExistingHash(props.fileId, props.queueFile.xxh3Hash);
  }
});

// Handle mouse enter to trigger lazy hash calculation
const handleMouseEnter = () => {
  if (props.sourceFile && props.queueFile) {
    xxh3Tooltip.onTooltipHover(props.fileId, props.sourceFile, props.queueFile);
  }
};

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
  duplicate: 'Duplicate',
  'read error': 'Read Error',
  redundant: 'Duplicate', // Legacy - maps to 'Duplicate' for backward compatibility
  uploadMetadataOnly: 'Copy', // Legacy - maps to 'Copy' for backward compatibility
  unknown: 'Unknown',
  'n/a': 'N/A',
};

// Base status text
const baseStatusText = computed(() => statusTextMap[props.status] || 'Unknown');

// Display status text with tentative indicator
// Phase 3a: Add "?" for tentative duplicate/copy status (no hash yet)
const displayStatusText = computed(() => {
  if ((props.status === 'duplicate' || props.status === 'copy') && !props.hash) {
    return baseStatusText.value + '?';
  }
  return baseStatusText.value;
});

// Tooltip text - displays XXH3 hash
const tooltipText = computed(() => {
  // Priority 1: Show XXH3 hash from queue file if available
  if (props.queueFile?.xxh3Hash) {
    return props.queueFile.xxh3Hash;
  }

  // Priority 2: Show XXH3 hash from cache (after lazy calculation)
  const cachedHash = xxh3Tooltip.getHashDisplay(props.fileId);
  if (cachedHash && cachedHash !== 'Hover to calculate hash') {
    return cachedHash;
  }

  // Priority 3: Show helpful tooltip for tentative statuses
  if ((props.status === 'duplicate' || props.status === 'copy') && !props.hash) {
    return 'Tentative status - will be verified before upload';
  }

  // Priority 4: Show legacy hash if available (backward compatibility)
  if (props.hash) {
    return props.hash;
  }

  // Default: Prompt user to hover
  return 'Hover to view hash';
});
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
