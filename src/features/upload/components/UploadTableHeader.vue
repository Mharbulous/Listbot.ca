<template>
  <div class="upload-table-header">
    <!-- Select Column (60px) - FIRST COLUMN with Select All checkbox -->
    <div class="header-cell select-header-cell" style="width: 60px; flex-shrink: 0; justify-content: center">
      <input
        type="checkbox"
        class="select-all-checkbox"
        :checked="allSelected"
        :indeterminate="someSelected"
        @change="handleSelectAllToggle"
        title="Select all files / Deselect all files"
        aria-label="Select all files"
      />
    </div>

    <!-- File Name Column (flexible - expands to fill remaining space, max 500px) -->
    <div class="header-cell" style="flex: 1; min-width: 150px; max-width: 500px">File Name</div>

    <!-- Size Column (100px fixed) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Size</div>

    <!-- Folder Path Column (flexible - expands based on content, max 500px) -->
    <div class="header-cell" style="flex: 1; min-width: 130px; max-width: 500px">Folder Path</div>

    <!-- Modified Column (140px fixed) -->
    <div class="header-cell" style="width: 140px; flex-shrink: 0">Modified</div>

    <!-- Status Column (100px fixed) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Status</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Component configuration
defineOptions({
  name: 'UploadTableHeader',
});

// Props
const props = defineProps({
  allSelected: {
    type: Boolean,
    default: false,
  },
  someSelected: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['select-all', 'deselect-all']);

// Handle Select All checkbox toggle
const handleSelectAllToggle = (event) => {
  const isChecked = event.target.checked;

  if (isChecked) {
    emit('select-all');
  } else {
    emit('deselect-all');
  }
};

// Set indeterminate state on the checkbox element
const selectAllCheckbox = ref(null);

watch(
  () => props.someSelected,
  (someSelected) => {
    const checkbox = document.querySelector('.select-all-checkbox');
    if (checkbox) {
      checkbox.indeterminate = someSelected;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.upload-table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-cell {
  padding: 12px 16px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-cell:last-child {
  border-right: none;
}

/* Select Header Cell */
.select-header-cell {
  justify-content: center;
  padding: 12px 8px;
}

/* Select All Checkbox Styling with Dark Green Checkmark in White Box with Black Border */
.select-all-checkbox {
  width: 20px;
  height: 20px;
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-color: white;
  border: 2px solid #000000;
  border-radius: 3px;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.select-all-checkbox:checked {
  background-color: white;
  border-color: #000000;
}

.select-all-checkbox:checked::after {
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

.select-all-checkbox:indeterminate {
  background-color: white;
  border-color: #000000;
}

.select-all-checkbox:indeterminate::after {
  content: '−';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #2196f3; /* Blue dash for indeterminate to match ready status */
  font-size: 18px;
  font-weight: 900;
  line-height: 1;
}

.select-all-checkbox:hover {
  transform: scale(1.1);
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
}

/* Screen reader only class for accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
