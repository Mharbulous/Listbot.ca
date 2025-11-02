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
import { LogService } from '@/services/logService.js';

const props = defineProps({
  pageNumber: {
    type: Number,
    required: true,
  },
  pdfDocument: {
    type: Object,
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

// Get shared observer from parent (if provided)
const pageVisibility = inject('pageVisibility', null);

/**
 * Render the PDF page to the canvas
 */
const renderPageToCanvas = async () => {
  if (!canvasRef.value || !props.pdfDocument) {
    return;
  }

  try {
    isRendering.value = true;
    renderError.value = null;

    LogService.debug('Rendering page to canvas', { pageNumber: props.pageNumber });

    // Get page from document
    const page = await props.pdfDocument.getPage(props.pageNumber);

    // Calculate scale to fit width
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = props.width / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Set canvas dimensions
    const canvas = canvasRef.value;
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;

    // Render to canvas
    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: scaledViewport,
    };

    renderTask.value = page.render(renderContext);
    await renderTask.value.promise;

    LogService.debug('Page rendered to canvas successfully', { pageNumber: props.pageNumber });

    // Emit event to notify parent that this page has finished rendering
    emit('page-rendered', props.pageNumber);
  } catch (err) {
    // Ignore cancelled renders
    if (err.name === 'RenderingCancelledException') {
      LogService.debug('Page render cancelled', { pageNumber: props.pageNumber });
      return;
    }

    LogService.error(`Failed to render page ${props.pageNumber}`, err);
    renderError.value = err.message || 'Failed to render page';
  } finally {
    isRendering.value = false;
    renderTask.value = null;
  }
};

// Render on mount
onMounted(() => {
  // Register with shared observer if available
  if (pageVisibility && pageVisibility.observePage) {
    pageVisibility.observePage(canvasRef.value);
  }

  // Render page
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
  if (renderTask.value) {
    renderTask.value.cancel();
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
