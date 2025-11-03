<template>
  <div class="pdf-page-container">
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

// Get canvas preloader from parent (if provided) - for adjacent document navigation (Strategy 3)
const canvasPreloader = inject('canvasPreloader', null);

// Get page preloader from parent (if provided) - for within-document page navigation (Strategy 8)
const pagePreloader = inject('pagePreloader', null);

/**
 * Display a pre-rendered canvas by drawing the cached ImageBitmap
 * This is much faster than rendering from scratch (5-15ms vs 650-750ms)
 *
 * @param {ImageBitmap} bitmap - The pre-rendered ImageBitmap
 * @returns {boolean} True if successfully displayed, false otherwise
 */
const displayPreRenderedCanvas = (bitmap) => {
  if (!canvasRef.value || !bitmap) {
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

    // Log success for page 1
    if (props.pageNumber === 1) {
      console.info(
        `⚡ Canvas SWAP complete (pre-rendered): ${displayTime.toFixed(1)}ms`,
        {
          documentId: props.documentId.substring(0, 8),
          pageNumber: props.pageNumber,
          dimensions: `${bitmap.width}×${bitmap.height}`,
          displayTime: displayTime.toFixed(1) + 'ms',
        }
      );
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
  if (!canvasRef.value || !props.pdfDocument) {
    return;
  }

  const startTime = performance.now();
  let parseTime, drawTime;

  try {
    isRendering.value = true;
    renderError.value = null;

    // Stage 1: Parse (get page from document)
    const parseStart = performance.now();
    const page = await props.pdfDocument.getPage(props.pageNumber);
    parseTime = performance.now() - parseStart;

    // Calculate scale to fit width
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = props.width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Set canvas dimensions (synchronous DOM update)
    const canvas = canvasRef.value;
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Stage 2: Draw (render to canvas)
    const drawStart = performance.now();
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: scaledViewport,
    };

    renderTask.value = page.render(renderContext);
    await renderTask.value.promise;
    drawTime = performance.now() - drawStart;

    const totalTime = performance.now() - startTime;

    // Log pipeline timing for page 1 only (inline in PdfPageCanvas.vue)
    if (props.pageNumber === 1) {
      console.log(
        `🔧 Pipeline timing: parse ${parseTime.toFixed(1)}ms | draw ${drawTime.toFixed(1)}ms | total ${totalTime.toFixed(1)}ms`,
        {
          pageNumber: props.pageNumber,
          parse: parseTime.toFixed(1) + 'ms',
          draw: drawTime.toFixed(1) + 'ms',
          total: totalTime.toFixed(1) + 'ms',
        }
      );
    }

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
  // Strategy 7: IntersectionObserver registration moved to PdfViewerArea.vue
  // The observer now tracks wrapper divs instead of canvas elements

  // Strategy 8: Check for pre-rendered page first (within-document navigation)
  if (pagePreloader && pagePreloader.hasPreRenderedPage(props.pageNumber)) {
    const bitmap = pagePreloader.getPreRenderedPage(props.pageNumber);
    if (bitmap && displayPreRenderedCanvas(bitmap)) {
      // Successfully displayed pre-rendered page, emit event immediately
      emit('page-rendered', props.pageNumber);
      return;
    }
  }

  // Check for pre-rendered canvas from adjacent document navigation (Strategy 3)
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

// Cancel any in-progress rendering on unmount and free canvas memory
onBeforeUnmount(() => {
  // Cancel any in-progress render task
  if (renderTask.value) {
    renderTask.value.cancel();
    renderTask.value = null;
  }

  // Strategy 7: Free canvas memory by clearing pixels and resetting dimensions
  if (canvasRef.value) {
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear all pixels from the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Reset dimensions to 0 to force memory deallocation
    // This signals to the browser that the canvas buffer can be freed
    canvas.width = 0;
    canvas.height = 0;
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
