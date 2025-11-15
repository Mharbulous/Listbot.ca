<template>
  <div class="select-cell" style="width: 60px; flex-shrink: 0; justify-content: center">
    <!-- Show ⛔ emoji for unsupported files (n/a status) -->
    <span v-if="fileStatus === 'n/a'" class="not-uploadable-icon" title="File type not supported"
      >⛔</span
    >
    <!-- Show checkbox for all other files -->
    <input
      v-else
      type="checkbox"
      class="file-checkbox"
      :class="{ 'faded-checkbox': fileStatus === 'redundant', 'delete-checkbox': fileStatus === 'redundant' }"
      :checked="isChecked"
      :disabled="isDisabled"
      @change="handleToggle"
      :title="checkboxTitle"
      :aria-label="checkboxTitle"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Component configuration
defineOptions({
  name: 'SelectCell',
});

// Props
const props = defineProps({
  fileStatus: {
    type: String,
    required: true,
  },
  fileId: {
    type: [String, Number],
    required: true,
  },
});

// Emits
const emit = defineEmits(['toggle', 'remove', 'swap']);

// Compute checkbox checked state - checked means file will be uploaded (NOT skipped)
// For 'redundant' files: checkbox is checked (to show red X) but disabled (can't toggle)
// For 'copy' files: checkbox is unchecked (can be clicked to make it the primary)
// Unchecked means: skip, n/a, read error, copy
const isChecked = computed(() => {
  // 'redundant' files are checked (but disabled) to show red X
  if (props.fileStatus === 'redundant') {
    return true;
  }
  return (
    props.fileStatus !== 'skip' &&
    props.fileStatus !== 'n/a' &&
    props.fileStatus !== 'read error' &&
    props.fileStatus !== 'completed' &&
    props.fileStatus !== 'copy'
  );
});

// Compute disabled state
const isDisabled = computed(() => {
  return (
    props.fileStatus === 'completed' ||
    props.fileStatus === 'duplicate' ||
    props.fileStatus === 'read error'
  );
});

// Compute checkbox title for accessibility
const checkboxTitle = computed(() => {
  if (props.fileStatus === 'completed') {
    return 'Already uploaded';
  } else if (props.fileStatus === 'redundant') {
    return 'Click to remove redundant file from queue';
  } else if (props.fileStatus === 'copy') {
    return 'Click to make this copy the primary file for upload';
  } else if (props.fileStatus === 'duplicate') {
    return 'Duplicate file - already in queue';
  } else if (props.fileStatus === 'read error') {
    return 'Cannot read file - hash generation failed';
  } else if (props.fileStatus === 'skip') {
    return 'File skipped - check to include in upload';
  } else {
    return 'Include file in upload';
  }
});

// Handle checkbox toggle
const handleToggle = (event) => {
  const isChecked = event.target.checked;

  // Special case: 'redundant' files - clicking removes them from the queue
  // CRITICAL: Prevent default to avoid checkbox state change that could affect wrong row during array splice
  if (props.fileStatus === 'redundant') {
    event.preventDefault(); // Prevent checkbox from being unchecked
    emit('remove', props.fileId);
    return;
  }

  // Special case: 'copy' files - clicking swaps it to become the primary
  // CRITICAL: Prevent default to avoid checkbox state change that could affect wrong row during array mutation
  if (props.fileStatus === 'copy') {
    event.preventDefault(); // Prevent checkbox state change
    emit('swap', props.fileId);
    return;
  }

  // Emit toggle event with file ID and new checked state
  emit('toggle', { fileId: props.fileId, isChecked });
};
</script>

<style scoped>
.select-cell {
  padding: 9px 8px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Not uploadable icon (⛔ emoji for unsupported files) */
.not-uploadable-icon {
  font-size: 20px;
  user-select: none;
  cursor: not-allowed;
}

/* Checkbox Styling with Dark Green Checkmark in White Box with Black Border */
.file-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  border: 1px solid #000000;
  border-radius: 3px;
  transition: all 0.25s ease;
  position: relative;
  flex-shrink: 0;
}

.file-checkbox:checked {
  background-color: white;
  border-color: #000000;
}

.file-checkbox:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #2196f3; /* Blue checkmark to match ready status */
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

/* Red X for disabled checkboxes (duplicate files) */
.file-checkbox:disabled:checked::after {
  content: '✘';
  color: red;
  font-size: 16px;
}

/* Red X for delete button (redundant files - clickable) */
.file-checkbox.delete-checkbox:checked::after {
  content: '✘';
  color: red;
  font-size: 16px;
  font-weight: 900;
}

/* Modern hover effect: subtle glow and border color change */
@media (hover: hover) {
  .file-checkbox:hover:not(:disabled) {
    border-color: #2196f3;
    box-shadow:
      0 0 0 3px rgba(33, 150, 243, 0.1),
      0 0 8px rgba(33, 150, 243, 0.15);
  }
}

/* Focus state for keyboard navigation */
.file-checkbox:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

.file-checkbox:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-color: #f3f4f6;
}

/* Faded/ghostly appearance for 'redundant' files */
.file-checkbox.faded-checkbox {
  opacity: 0.4;
}

/* Delete button styling for 'redundant' files */
.file-checkbox.delete-checkbox {
  cursor: pointer;
}

/* Hover effect for delete checkbox */
@media (hover: hover) {
  .file-checkbox.delete-checkbox:hover {
    opacity: 1;
    border-color: #ef4444;
    box-shadow:
      0 0 0 3px rgba(239, 68, 68, 0.1),
      0 0 8px rgba(239, 68, 68, 0.15);
  }
}
</style>
