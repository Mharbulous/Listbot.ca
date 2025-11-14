<template>
  <div
    class="filename-cell"
    :class="{ 'faded-cell': fileStatus === 'redundant' }"
    style="flex: 1; min-width: 150px; max-width: 500px"
    :title="fileName"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <span
      class="filename-text"
      :class="{
        'filename-bold': fileStatus === 'ready' && !isCopy,
        'filename-normal': fileStatus === 'copy' || isCopy,
      }"
      >{{ fileName }}</span
    >
    <span v-if="isHovering" class="eyeball-icon" @click="handlePreview" title="Preview file"
      >👁️</span
    >
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Component configuration
defineOptions({
  name: 'FileNameCell',
});

// Props
defineProps({
  fileName: {
    type: String,
    required: true,
  },
  fileStatus: {
    type: String,
    required: true,
  },
  isCopy: {
    type: Boolean,
    default: false,
  },
  sourceFile: {
    type: File,
    default: null,
  },
});

// Emits
const emit = defineEmits(['preview']);

// Hover state tracking
const isHovering = ref(false);

// Handle preview click
const handlePreview = (event) => {
  event.stopPropagation(); // Prevent triggering row double-click
  emit('preview');
};
</script>

<style scoped>
/* File Name Cell */
.filename-cell {
  padding: 9px 16px;
  border-right: 1px solid #e5e7eb;
  font-weight: 500;
  color: #1f2937;
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: default;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filename-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Phase 3: Bold filename for best files (ready, not a copy) */
.filename-text.filename-bold {
  font-weight: 700;
}

/* Phase 3: Normal filename for copies */
.filename-text.filename-normal {
  font-weight: 400;
}

.eyeball-icon {
  flex-shrink: 0;
  cursor: pointer;
  font-size: 1rem;
  user-select: none;
}

/* Faded cell styling for 'redundant' status files */
.faded-cell {
  opacity: 0.4;
  color: #9ca3af;
}
</style>
