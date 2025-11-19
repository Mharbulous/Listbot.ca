<template>
  <div class="thumbnail-list-container">
    <!-- Loading state -->
    <div v-if="isRendering && thumbnails.size === 0" class="thumbnail-loading">
      <v-progress-circular indeterminate size="32" color="primary" />
      <p class="mt-2 text-caption">Generating thumbnails...</p>
    </div>

    <!-- Thumbnail grid -->
    <div v-else class="thumbnail-grid" ref="thumbnailGridRef">
      <div
        v-for="pageNum in totalPages"
        :key="`thumb-${pageNum}`"
        class="thumbnail-item"
        :class="{
          'thumbnail-item--current': pageNum === currentPage,
          'thumbnail-item--loading': !thumbnails.has(`${pageNum}-${maxThumbnailWidth}`),
        }"
        :ref="(el) => setThumbnailRef(pageNum, el)"
        @click="selectPage(pageNum)"
      >
        <!-- Page number badge -->
        <div class="thumbnail-page-number">{{ pageNum }}</div>

        <!-- Thumbnail image -->
        <img
          v-if="thumbnails.has(`${pageNum}-${maxThumbnailWidth}`)"
          :src="thumbnails.get(`${pageNum}-${maxThumbnailWidth}`)"
          :alt="`Page ${pageNum}`"
          class="thumbnail-image"
        />

        <!-- Loading placeholder -->
        <div v-else class="thumbnail-placeholder">
          <v-progress-circular indeterminate size="24" color="primary" />
        </div>
      </div>
    </div>

    <!-- Rendering progress indicator -->
    <div v-if="isRendering && thumbnails.size > 0" class="thumbnail-progress">
      <v-progress-linear :model-value="renderProgress" color="primary" height="2" />
      <p class="text-caption mt-1">{{ thumbnails.size }} / {{ totalPages }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick, inject } from 'vue';
import { useThumbnailRenderer } from '../composables/useThumbnailRenderer';

const props = defineProps({
  pdfDocument: Object,
  totalPages: Number,
  currentPage: Number,
  maxThumbnailWidth: {
    type: Number,
    default: 150,
  },
});

const emit = defineEmits(['page-selected']);

// Get performance tracker from parent (if provided)
const performanceTracker = inject('performanceTracker', null);

// Thumbnail rendering composable
const { thumbnailCache: thumbnails, isRendering, renderAllThumbnails, cancelAllRendering, clearCache } =
  useThumbnailRenderer(performanceTracker);

// Refs for thumbnail elements (for auto-scroll)
const thumbnailGridRef = ref(null);
const thumbnailRefs = ref(new Map());

const setThumbnailRef = (pageNum, el) => {
  if (el) {
    thumbnailRefs.value.set(pageNum, el);
  }
};

// Calculate rendering progress
const renderProgress = computed(() => {
  if (props.totalPages === 0) return 0;
  return (thumbnails.value.size / props.totalPages) * 100;
});

// Handle page selection
const selectPage = (pageNum) => {
  emit('page-selected', pageNum);
};

// Auto-scroll to current page thumbnail
const scrollToCurrentPage = async () => {
  await nextTick();

  const currentThumbnail = thumbnailRefs.value.get(props.currentPage);
  if (currentThumbnail && thumbnailGridRef.value) {
    currentThumbnail.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  }
};

// Watch current page and auto-scroll
watch(
  () => props.currentPage,
  () => {
    scrollToCurrentPage();
  }
);

// Watch PDF document changes
watch(
  () => [props.pdfDocument, props.totalPages],
  (newValues, oldValues) => {
    // Handle initial mount (oldValues may be undefined)
    if (!newValues || newValues.length === 0) {
      return;
    }

    const [newDoc, newTotal] = newValues;
    const [oldDoc] = oldValues || [null, null];

    // Skip if no document or zero pages
    if (!newDoc || newTotal === 0) {
      return;
    }

    // Only render if document changed or this is the initial mount
    if (!oldDoc || newDoc !== oldDoc) {
      // Clear old thumbnails
      clearCache();

      // PERFORMANCE: Defer thumbnail rendering to allow first page to render immediately
      // This prevents thumbnails from blocking the critical first page render
      // 50ms delay ensures browser has time to render the main page first
      setTimeout(() => {
        if (newTotal > 0) {
          renderAllThumbnails(newDoc, newTotal).catch(err => {
            // Ignore cancelled renders - this is expected when navigating away
            if (err.name === 'RenderingCancelledException') {
              console.debug('Thumbnail rendering cancelled');
              return;
            }
            // Log real errors
            console.warn('Thumbnail rendering failed:', err);
          });
        }
      }, 50);
    }
  },
  { immediate: true }
);

// Cleanup
onBeforeUnmount(() => {
  // Cancel any in-progress rendering first to stop unnecessary work
  cancelAllRendering();
  // Then clean up cached thumbnails
  clearCache();
});
</script>

<style scoped>
.thumbnail-list-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.thumbnail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  text-align: center;
}

.thumbnail-grid {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.thumbnail-item {
  position: relative;
  width: 100%;
  background-color: white;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  overflow: hidden;

  /* CSS-based virtualization - browser automatically skips rendering off-screen thumbnails */
  content-visibility: auto;
  /* Intrinsic size will be determined by the actual thumbnail image dimensions */
  contain-intrinsic-size: 150px auto;
}

.thumbnail-item:hover {
  background-color: #f5f5f5;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.thumbnail-item--current {
  border-color: #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

.thumbnail-item--loading {
  opacity: 0.6;
}

.thumbnail-page-number {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 3px;
  z-index: 10;
}

.thumbnail-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 150px;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
}

.thumbnail-progress {
  padding: 8px 12px;
  background-color: #fafafa;
  border-top: 1px solid #e0e0e0;
  text-align: center;
}
</style>

