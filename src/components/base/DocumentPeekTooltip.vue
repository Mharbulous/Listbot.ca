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

    <!-- End of Document State -->
    <div v-else-if="showEndOfDocument" class="peek-end">
      <div class="end-icon">📄</div>
      <p class="end-text">End of Document</p>
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
      >
        <img
          :src="thumbnailUrl"
          alt="Document preview"
          class="thumbnail-image"
          :class="cursorClass"
        />
        <div class="page-counter">
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
  showEndOfDocument: {
    type: Boolean,
    default: false,
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

// Computed: Cursor class based on which side user is hovering
const cursorClass = computed(() => {
  return cursorSide.value === 'left' ? 'cursor-prev' : 'cursor-next';
});

// Handle thumbnail hover to detect left/right side
const handleThumbnailHover = (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;

  // Determine which half of the thumbnail the cursor is over
  cursorSide.value = x < width / 2 ? 'left' : 'right';
};

// Handle thumbnail click to navigate pages
const handleThumbnailClick = (event) => {
  event.stopPropagation(); // Prevent tooltip from closing

  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const width = rect.width;

  // Determine which side was clicked
  if (x < width / 2) {
    // Left side - go to previous page
    emit('previous-page');
  } else {
    // Right side - go to next page
    emit('next-page');
  }
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

/* End of Document State */
.peek-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  min-height: 150px;
}

.end-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.end-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
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

.page-counter {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.75);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}
</style>
