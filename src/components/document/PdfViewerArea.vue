<template>
  <div class="viewer-area">
    <!-- Initial loading state -->
    <v-card
      v-if="viewerLoading || loadingDocument"
      variant="outlined"
      class="viewer-placeholder"
    >
      <div class="placeholder-content">
        <v-progress-circular indeterminate size="64" color="primary" />
        <p class="mt-4 text-body-1">
          {{ loadingDocument ? 'Loading PDF...' : 'Loading document...' }}
        </p>
      </div>
    </v-card>

    <!-- PDF Load Error -->
    <v-card v-else-if="pdfLoadError" variant="outlined" class="viewer-placeholder">
      <div class="placeholder-content">
        <v-icon size="80" color="error">mdi-alert-circle</v-icon>
        <h2 class="mt-4 text-h6 text-error">Failed to Load PDF</h2>
        <p class="mt-2 text-body-2">{{ pdfLoadError }}</p>
      </div>
    </v-card>

    <!-- PDF Viewer (all pages in continuous scroll) -->
    <div v-else-if="isPdfFile && pdfDocument" class="pdf-pages-container">
      <!-- Strategy 7: Virtualized Rendering - Only render visible pages ±1 -->
      <div
        v-for="pageNum in totalPages"
        :key="`page-wrapper-${pageNum}`"
        :ref="setWrapperRef"
        :data-page-number="pageNum"
        class="pdf-page-wrapper"
      >
        <PdfPageCanvas
          v-show="isPageInVisibleRange(pageNum)"
          :key="`page-${pageNum}`"
          :page-number="pageNum"
          :pdf-document="pdfDocument"
          :document-id="documentId"
          :width="883.2"
          :height="1056"
          class="pdf-page"
          @page-rendered="$emit('page-rendered', $event)"
        />
        <div v-show="!isPageInVisibleRange(pageNum)" class="page-placeholder">
          <span class="page-number">Page {{ pageNum }}</span>
        </div>
      </div>
    </div>

    <!-- Non-PDF file placeholder -->
    <v-card v-else variant="outlined" class="viewer-placeholder">
      <div class="placeholder-content">
        <v-icon size="120" color="grey-lighten-1">mdi-file-document-outline</v-icon>
        <h2 class="mt-6 text-h5 text-grey-darken-1">
          {{ isPdfFile ? 'PDF Viewer' : 'File Viewer Not Available' }}
        </h2>
        <p class="mt-2 text-body-2 text-grey">
          {{ isPdfFile ? 'PDF viewer ready' : 'Only PDF files can be viewed' }}
        </p>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { inject, computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import PdfPageCanvas from '@/features/organizer/components/PdfPageCanvas.vue';

// Props
const props = defineProps({
  isPdfFile: {
    type: Boolean,
    required: true,
  },
  pdfDocument: {
    type: Object,
    default: null,
  },
  documentId: {
    type: String,
    required: true,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  viewerLoading: {
    type: Boolean,
    default: false,
  },
  loadingDocument: {
    type: Boolean,
    default: false,
  },
  pdfLoadError: {
    type: [Error, String],
    default: null,
  },
});

// Events
defineEmits(['page-rendered']);

// Strategy 7: Virtualized Rendering
// Inject pageVisibility from parent (ViewDocument.vue)
const pageVisibility = inject('pageVisibility', null);

// Store refs to all wrapper elements (keyed by page number)
const wrapperRefs = ref({});

// Calculate visible page range (current page ±1 buffer)
const visiblePageRange = computed(() => {
  if (!pageVisibility || !pageVisibility.mostVisiblePage) {
    // Fallback: render first 3 pages if pageVisibility not available
    return { start: 1, end: Math.min(3, props.totalPages) };
  }

  const currentPage = pageVisibility.mostVisiblePage.value || 1;
  const buffer = 1;

  return {
    start: Math.max(1, currentPage - buffer),
    end: Math.min(props.totalPages, currentPage + buffer),
  };
});

// Check if a page should be rendered (within visible range)
const isPageInVisibleRange = (pageNum) => {
  const range = visiblePageRange.value;
  return pageNum >= range.start && pageNum <= range.end;
};

// Ref callback to capture wrapper elements
const setWrapperRef = (el) => {
  if (!el) return;
  const pageNum = parseInt(el.dataset.pageNumber);
  wrapperRefs.value[pageNum] = el;
};

// Register all wrapper divs with IntersectionObserver
const registerWrappers = async () => {
  console.log('[S7] registerWrappers called');
  console.log('Total pages:', props.totalPages);
  console.log('pdfDocument:', props.pdfDocument ? 'loaded' : 'NOT loaded');

  // Skip if PDF not loaded yet
  if (props.totalPages === 0 || !props.pdfDocument) {
    console.log('[S7] Skipping registration - PDF not loaded yet');
    return;
  }

  if (!pageVisibility || !pageVisibility.observePage) {
    console.log('[S7] pageVisibility not available');
    return;
  }

  // Wait for DOM to be fully rendered
  await nextTick();

  console.log('Number of wrapper refs collected:', Object.keys(wrapperRefs.value).length);

  // Register all wrapper divs with the observer
  // Note: Observer root is set by parent (ViewDocument.vue) to .view-document-content
  const registeredCount = Object.values(wrapperRefs.value).filter((wrapperEl) => {
    if (wrapperEl) {
      pageVisibility.observePage(wrapperEl);
      return true;
    }
    return false;
  }).length;

  console.log(`[S7] Registered ${registeredCount} page wrappers with observer`);
};

// Component mount
onMounted(async () => {
  console.log('=== PdfViewerArea MOUNTED ===');
  console.log('Total pages:', props.totalPages);
  console.log('isPdfFile:', props.isPdfFile);
  console.log('pdfDocument:', props.pdfDocument ? 'loaded' : 'NOT loaded');

  if (!pageVisibility || !pageVisibility.observePage) {
    console.log('[S7] pageVisibility not available');
    return;
  }

  console.log('[S7] pageVisibility available');

  // Wait for DOM
  await nextTick();

  // Note: Scroll listener is set up by parent (ViewDocument.vue) on .view-document-content

  // Register wrappers if PDF is already loaded
  await registerWrappers();
});

// Unregister wrapper divs from observer on unmount
onBeforeUnmount(() => {
  if (!pageVisibility || !pageVisibility.unobservePage) {
    return;
  }

  // Unregister all wrapper divs
  Object.values(wrapperRefs.value).forEach((wrapperEl) => {
    if (wrapperEl) {
      pageVisibility.unobservePage(wrapperEl);
    }
  });

  // Clear refs
  wrapperRefs.value = {};
});

// Watch for PDF loading - register wrappers when totalPages changes from 0 to positive
watch(
  () => props.totalPages,
  async (newTotal, oldTotal) => {
    console.log(`[S7] totalPages changed: ${oldTotal} → ${newTotal}`);
    if (newTotal > 0 && oldTotal === 0) {
      console.log('[S7] PDF loaded! Re-registering wrappers...');
      await registerWrappers();
    }
  }
);

// Watch for visible range changes (Strategy 7)
watch(
  visiblePageRange,
  (newRange) => {
    console.log(`[S7] Visible range: ${newRange.start}-${newRange.end}`);
  },
  { immediate: true }
);

// Watch mostVisiblePage for debugging
watch(
  () => pageVisibility?.mostVisiblePage?.value,
  (newPage, oldPage) => {
    console.log(`👁️ mostVisiblePage changed: ${oldPage} → ${newPage}`);
  }
);
</script>

<style scoped>
.viewer-area {
  flex: 1;
  min-width: 500px;

  /*
   * IMPORTANT: These dimensions are calibrated to match hardcopy office paper (US Letter)
   * - max-width: 9.2in matches the physical width of US Letter paper (8.5in) with margins
   * - min-height: 11in matches the physical height of US Letter paper
   *
   * DO NOT CHANGE these values without careful consideration, as they ensure the PDF viewport
   * displays documents at the same size as they would appear when printed on physical paper.
   * This 1:1 scale relationship is critical for document review and comparison workflows.
   */
  max-width: 9.2in;
  min-height: 11in;

  display: flex;
  flex-direction: column;
  max-height: 100%;
  overflow-y: auto;
  transition: opacity 0.2s ease-in-out;
}

.viewer-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: 2px dashed #e0e0e0;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

/* PDF Pages Container */
.pdf-pages-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 16px;
  background-color: #f5f5f5;
}

/* Strategy 7: Page wrapper maintains scroll position */
.pdf-page-wrapper {
  width: 100%;
  max-width: 9.2in;
  margin: 0 auto;
  min-height: 1056px; /* US Letter height at 96 DPI (11 inches) */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: white;
}

/* Individual PDF Page */
.pdf-page {
  width: 100%;
  height: 100%;
}

/* Placeholder for non-rendered pages */
.page-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 1056px;
  background-color: #fafafa;
  color: #9e9e9e;
}

.page-placeholder .page-number {
  font-size: 18px;
  font-weight: 500;
}

/* Responsive layout for tablets and mobile */
@media (max-width: 1150px) {
  .viewer-area {
    width: 100%;
    max-width: 100%;
    min-height: 400px;
  }
}
</style>
