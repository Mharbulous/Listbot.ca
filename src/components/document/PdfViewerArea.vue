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
      <!-- Attempt #2: All pages rendered, preloading handles performance -->
      <div
        v-for="pageNum in totalPages"
        :key="`page-wrapper-${pageNum}`"
        :ref="setWrapperRef"
        :data-page-number="pageNum"
        class="pdf-page-wrapper"
      >
        <PdfPageCanvas
          :key="`page-${pageNum}`"
          :page-number="pageNum"
          :pdf-document="pdfDocument"
          :document-id="documentId"
          :width="883.2"
          :height="1056"
          class="pdf-page"
          @page-rendered="$emit('page-rendered', $event)"
        />
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
import { inject, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
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

// Inject pageVisibility for tracking current page (used by ViewDocument for preloading)
const pageVisibility = inject('pageVisibility', null);

// Store refs to wrapper elements for observer registration
const wrapperRefs = ref({});

// Ref callback to capture wrapper elements
const setWrapperRef = (el) => {
  if (!el) return;
  const pageNum = parseInt(el.dataset.pageNumber);
  wrapperRefs.value[pageNum] = el;
};

// Register wrapper divs with IntersectionObserver for page tracking
const registerWrappers = async () => {
  if (props.totalPages === 0 || !props.pdfDocument || !pageVisibility?.observePage) {
    return;
  }

  await nextTick();

  Object.values(wrapperRefs.value).forEach((wrapperEl) => {
    if (wrapperEl) {
      pageVisibility.observePage(wrapperEl);
    }
  });
};

onMounted(async () => {
  if (pageVisibility?.observePage) {
    await registerWrappers();
  }
});

onBeforeUnmount(() => {
  if (pageVisibility?.unobservePage) {
    Object.values(wrapperRefs.value).forEach((wrapperEl) => {
      if (wrapperEl) {
        pageVisibility.unobservePage(wrapperEl);
      }
    });
    wrapperRefs.value = {};
  }
});

// Register wrappers when PDF loads
watch(
  () => props.totalPages,
  async (newTotal, oldTotal) => {
    if (newTotal > 0 && oldTotal === 0) {
      await registerWrappers();
    }
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

/* Page wrapper - simple container without optimization tricks */
.pdf-page-wrapper {
  width: 100%;
  max-width: 9.2in;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: white;
}

/* Individual PDF Page */
.pdf-page {
  width: 100%;
  height: 100%;
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
