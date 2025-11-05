<template>
  <div
    v-if="isVisible"
    class="document-peek-tooltip"
    :style="{
      opacity: opacity,
      top: position.top,
      left: position.left,
    }"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="peek-loading">
      <div class="spinner"></div>
      <p class="loading-text">Loading preview...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="peek-error">
      <div class="error-icon">⚠️</div>
      <p class="error-text">{{ error }}</p>
    </div>

    <!-- Non-PDF File State -->
    <div v-else-if="!isCurrentDocumentPdf && currentDocumentMetadata" class="peek-file-icon">
      <div class="file-icon">{{ fileIcon }}</div>
      <p class="file-name">{{ currentDocumentMetadata.displayName }}</p>
      <p class="file-type">{{ formatFileType(currentDocumentMetadata.fileType) }}</p>
    </div>

    <!-- PDF Thumbnail State -->
    <div v-else-if="thumbnailUrl" class="peek-thumbnail">
      <div
        class="thumbnail-container"
        @click="handleThumbnailClick"
        @mousemove="handleThumbnailHover"
        @mouseenter="handleThumbnailMouseEnter"
        @mouseleave="handleThumbnailMouseLeave"
      >
        <img
          :src="thumbnailUrl"
          alt="Document preview"
          class="thumbnail-image"
          :class="cursorClass"
        />
        <div
          v-if="isHoveringThumbnail"
          class="page-counter"
          :class="pageCounterPositionClass"
        >
          Page {{ currentPeekPage }}{{ pageCountText }}
        </div>
      </div>
    </div>

    <!-- Fallback: Generating thumbnail -->
    <div v-else class="peek-loading">
      <div class="spinner"></div>
      <p class="loading-text">Generating preview...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  // Visibility and opacity controlled by parent
  isVisible: {
    type: Boolean,
    required: true,
  },
  opacity: {
    type: Number,
    required: true,
  },

  // Document peek state
  currentPeekDocument: {
    type: String, // fileHash
    default: null,
  },
  currentPeekPage: {
    type: Number,
    default: 1,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },

  // Document metadata
  currentDocumentMetadata: {
    type: Object,
    default: null,
  },
  isCurrentDocumentPdf: {
    type: Boolean,
    default: false,
  },
  thumbnailUrl: {
    type: String,
    default: null,
  },

  // Position
  position: {
    type: Object,
    default: () => ({ top: '0px', left: '0px' }),
  },

  // File icon helper
  getFileIcon: {
    type: Function,
    required: true,
  },
});

const emit = defineEmits(['mouseenter', 'mouseleave', 'thumbnail-needed', 'previous-page', 'next-page']);

// Cursor side tracking for left/right hover detection
const cursorSide = ref('right'); // 'left' or 'right'

// Page counter display tracking
const isHoveringThumbnail = ref(false);
const pageCounterPosition = ref('bottom-right'); // 'top-left', 'top-right', 'bottom-left', 'bottom-right'

// Computed: Check if at first page
const isAtFirstPage = computed(() => {
  return props.currentPeekPage === 1;
});

// Computed: Check if at last page
const isAtLastPage = computed(() => {
  if (!props.currentDocumentMetadata?.pageCount) {
    return false;
  }
  return props.currentPeekPage >= props.currentDocumentMetadata.pageCount;
});

// Computed: Check if navigation is disabled on left side
const isLeftDisabled = computed(() => {
  return isAtFirstPage.value;
});

// Computed: Check if navigation is disabled on right side
const isRightDisabled = computed(() => {
  return isAtLastPage.value;
});

// Computed: Cursor class based on which side user is hovering and boundary state
const cursorClass = computed(() => {
  if (cursorSide.value === 'left') {
    return isLeftDisabled.value ? 'cursor-disabled' : 'cursor-prev';
  } else {
    return isRightDisabled.value ? 'cursor-disabled' : 'cursor-next';
  }
});

// Computed: Page counter position class
const pageCounterPositionClass = computed(() => {
  return `page-counter-${pageCounterPosition.value}`;
});

// Handle thumbnail hover to detect left/right side and page counter position
const handleThumbnailHover = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const width = rect.width;
  const height = rect.height;

  // Determine which half of the thumbnail for navigation cursor
  cursorSide.value = x < width / 2 ? 'left' : 'right';

  // Determine page counter position based on 3x3 grid corners
  // Only check the 4 corner sections (outer third in both dimensions)
  const leftThird = width / 3;
  const rightThird = width * 2 / 3;
  const topThird = height / 3;
  const bottomThird = height * 2 / 3;

  // Check if mouse is in one of the 4 corner rectangles
  if (x < leftThird && y < topThird) {
    // Top-left corner
    pageCounterPosition.value = 'top-left';
  } else if (x > rightThird && y < topThird) {
    // Top-right corner
    pageCounterPosition.value = 'top-right';
  } else if (x < leftThird && y > bottomThird) {
    // Bottom-left corner
    pageCounterPosition.value = 'bottom-left';
  } else if (x > rightThird && y > bottomThird) {
    // Bottom-right corner
    pageCounterPosition.value = 'bottom-right';
  }
  // If mouse is in center 5 rectangles, don't change position (prevents flickering)
};

// Handle thumbnail click to navigate pages
const handleThumbnailClick = (event) => {
  event.stopPropagation(); // Prevent tooltip from closing

  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;

  // Determine which side was clicked
  if (x < width / 2) {
    // Left side - go to previous page (only if not disabled)
    if (!isLeftDisabled.value) {
      emit('previous-page');
    }
  } else {
    // Right side - go to next page (only if not disabled)
    if (!isRightDisabled.value) {
      emit('next-page');
    }
  }
};

// Handle thumbnail mouse enter
const handleThumbnailMouseEnter = () => {
  isHoveringThumbnail.value = true;
};

// Handle thumbnail mouse leave
const handleThumbnailMouseLeave = () => {
  isHoveringThumbnail.value = false;
};

// Computed: File icon for non-PDF files
const fileIcon = computed(() => {
  if (!props.currentDocumentMetadata) {
    return '📁';
  }
  return props.getFileIcon(props.currentDocumentMetadata.fileType);
});

// Computed: Page count text
const pageCountText = computed(() => {
  if (!props.currentDocumentMetadata?.pageCount) {
    return '';
  }
  return ` of ${props.currentDocumentMetadata.pageCount}`;
});

// Format file type for display
const formatFileType = (fileType) => {
  if (!fileType) return 'Unknown';

  // Extract main type (e.g., "application/pdf" -> "PDF")
  const parts = fileType.split('/');
  if (parts.length > 1) {
    const subtype = parts[1];
    // Handle common types
    if (subtype === 'pdf') return 'PDF';
    if (subtype.includes('word')) return 'Word Document';
    if (subtype.includes('excel') || subtype.includes('spreadsheet')) return 'Excel Spreadsheet';
    if (subtype.includes('powerpoint') || subtype.includes('presentation')) return 'PowerPoint Presentation';
    return subtype.toUpperCase();
  }

  return fileType;
};

// Watch for thumbnail needs
watch(
  () => [props.isVisible, props.currentPeekDocument, props.currentPeekPage, props.isCurrentDocumentPdf],
  ([visible, docHash, page, isPdf]) => {
    // Request thumbnail generation if we need one and don't have it
    if (visible && docHash && page && isPdf && !props.thumbnailUrl && !props.isLoading) {
      emit('thumbnail-needed', { fileHash: docHash, pageNumber: page });
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.document-peek-tooltip {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  pointer-events: auto;
  transition: opacity 0.1s ease-out;
  max-width: 350px;
  min-width: 250px;
}

/* Loading State */
.peek-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 150px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #666;
}

/* Error State */
.peek-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 150px;
}

.error-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.error-text {
  font-size: 14px;
  color: #d32f2f;
  text-align: center;
}

/* Non-PDF File Icon State */
.peek-file-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 150px;
}

.file-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin-bottom: 4px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-type {
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* PDF Thumbnail State */
.peek-thumbnail {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumbnail-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.thumbnail-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  user-select: none;
}

/* Custom cursor for previous page (left side) - single left arrow */
.thumbnail-image.cursor-prev {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="20,8 12,16 20,24" fill="white" stroke="black" stroke-width="1"/></svg>') 16 16, pointer;
}

/* Custom cursor for next page (right side) - single right arrow */
.thumbnail-image.cursor-next {
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><polygon points="12,8 20,16 12,24" fill="white" stroke="black" stroke-width="1"/></svg>') 16 16, pointer;
}

/* Disabled cursor when at document boundaries */
.thumbnail-image.cursor-disabled {
  cursor: default;
}

.page-counter {
  position: absolute;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.2s ease-out; /* Smooth position transition */
}

/* Position in bottom-right (default) */
.page-counter-bottom-right {
  bottom: 8px;
  right: 8px;
}

/* Position in bottom-left */
.page-counter-bottom-left {
  bottom: 8px;
  left: 8px;
}

/* Position in top-right */
.page-counter-top-right {
  top: 8px;
  right: 8px;
}

/* Position in top-left */
.page-counter-top-left {
  top: 8px;
  left: 8px;
}
</style>
