<template>
  <div class="pdf-page-container" :data-page-number="pageNumber">
    <canvas ref="canvasRef" class="pdf-page-canvas" :class="{ rendering: isRendering }" />

    <!-- Loading indicator -->
    <div v-if="isRendering" class="page-loading-overlay">
      <v-progress-circular indeterminate size="32" color="primary" />
    </div>

    <!-- Error state -->
    <div v-if="renderError" class="page-error">
      <v-icon color="error">mdi-alert-circle</v-icon>
      <p>Failed to render page {{ pageNumber }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted, watch, onBeforeUnmount, inject } from 'vue';

const props = defineProps({
  pageNumber: {
    type: Number,
    required: true,
  },
  pdfDocument: {
    type: Object,
    required: true,
  },
  documentId: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    default: 883.2, // 9.2in at 96 DPI
  },
  height: {
    type: Number,
    default: 1056, // 11in at 96 DPI
  },
});

const emit = defineEmits(['page-rendered']);

const canvasRef = ref(null);
const isRendering = ref(false);
const renderError = ref(null);
const renderTask = shallowRef(null);
const isMounted = ref(false); // Track component lifecycle to prevent race conditions

// Get shared observer from parent (if provided)
const pageVisibility = inject('pageVisibility', null);

// Get canvas preloader from parent (if provided)
const canvasPreloader = inject('canvasPreloader', null);

// Get performance tracker from parent (if provided)
const performanceTracker = inject('performanceTracker', null);

/**
 * Display a pre-rendered canvas by drawing the cached ImageBitmap
 * This is much faster than rendering from scratch (0.7-1.2ms vs 650-750ms)
 *
 * @param {ImageBitmap} bitmap - The pre-rendered ImageBitmap
 * @returns {boolean} True if successfully displayed, false otherwise
 */
const displayPreRenderedCanvas = (bitmap) => {
  if (!isMounted.value || !canvasRef.value || !bitmap) {
    return false;
  }

  const startTime = performance.now();

  try {
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions to match bitmap
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;

    // Draw the pre-rendered bitmap to canvas (very fast!)
    ctx.drawImage(bitmap, 0, 0);

    const displayTime = performance.now() - startTime;

    // Track canvas swap for page 1 during navigation
    if (props.pageNumber === 1 && performanceTracker && performanceTracker.isNavigationActive()) {
      performanceTracker.recordEvent('canvas_swap', {
        duration: displayTime,
      });
    }

    return true;
  } catch (err) {
    console.warn('Failed to display pre-rendered canvas, falling back to normal render', {
      documentId: props.documentId.substring(0, 8),
      pageNumber: props.pageNumber,
      error: err.message,
    });
    return false;
  }
};

/**
 * Render the PDF page to the canvas
 */
const renderPageToCanvas = async () => {
  if (!isMounted.value || !canvasRef.value || !props.pdfDocument) {
    return;
  }

  // Cancel any in-progress render before starting a new one
  // This prevents PDF.js "Cannot use the same canvas during multiple render() operations" error
  if (renderTask.value) {
    try {
      renderTask.value.cancel();
    } catch (err) {
      console.debug('Cancelled previous render task:', err);
    }
    renderTask.value = null;
  }

  try {
    isRendering.value = true;
    renderError.value = null;

    // Get page from document
    const page = await props.pdfDocument.getPage(props.pageNumber);

    // Calculate scale to fit width
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = props.width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Set canvas dimensions (synchronous DOM update)
    const canvas = canvasRef.value;

    // Check if still mounted before DOM operations
    if (!isMounted.value || !canvas) {
      return;
    }

    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render to canvas
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: scaledViewport,
    };

    renderTask.value = page.render(renderContext);
    await renderTask.value.promise;

    // Emit event to notify parent that this page has finished rendering
    emit('page-rendered', props.pageNumber);
  } catch (err) {
    // Ignore cancelled renders
    if (err.name === 'RenderingCancelledException') {
      console.debug('Page render cancelled', { pageNumber: props.pageNumber });
      return;
    }

    console.error(`Failed to render page ${props.pageNumber}`, err);
    renderError.value = err.message || 'Failed to render page';
  } finally {
    isRendering.value = false;
    renderTask.value = null;
  }
};

// Render on mount
onMounted(() => {
  // Mark component as mounted to enable rendering
  isMounted.value = true;

  // Register with shared observer if available
  if (pageVisibility && pageVisibility.observePage) {
    pageVisibility.observePage(canvasRef.value);
  }

  // Check for pre-rendered canvas first
  if (canvasPreloader && canvasPreloader.hasPreRenderedCanvas(props.documentId, props.pageNumber)) {
    const bitmap = canvasPreloader.getPreRenderedCanvas(props.documentId, props.pageNumber);
    if (bitmap && displayPreRenderedCanvas(bitmap)) {
      // Successfully displayed pre-rendered canvas, emit event immediately
      emit('page-rendered', props.pageNumber);
      return;
    }
  }

  // Fallback: Render page normally if no pre-rendered canvas available
  renderPageToCanvas();
});

// Re-render if page number changes
watch(
  () => props.pageNumber,
  () => {
    renderPageToCanvas();
  }
);

// Re-render if document reference changes
watch(
  () => props.pdfDocument,
  () => {
    renderPageToCanvas();
  }
);

// Cancel any in-progress rendering on unmount
onBeforeUnmount(() => {
  // Mark as unmounted FIRST to prevent any async operations from continuing
  isMounted.value = false;

  // Cancel render task with error handling
  if (renderTask.value) {
    try {
      renderTask.value.cancel();
    } catch (err) {
      // Ignore cancellation errors - this is expected during cleanup
      console.debug('Error cancelling render task:', err);
    }
    renderTask.value = null;
  }
});
</script>

<style scoped>
/* PDF Page Container */
.pdf-page-container {
  position: relative;
  width: 100%;
  background-color: white;
}

.pdf-page-canvas {
  display: block;
  width: 100%;
  height: auto;
  transition: opacity 0.2s ease-in-out;
}

.pdf-page-canvas.rendering {
  opacity: 0.7;
}

/* Page Loading Overlay */
.page-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

/* Page Error State */
.page-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background-color: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 4px;
  text-align: center;
}

.page-error p {
  margin-top: 8px;
  color: #c62828;
  font-size: 0.875rem;
}
</style>
