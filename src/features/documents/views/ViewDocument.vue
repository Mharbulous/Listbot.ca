<template>
  <div class="view-document-container">
    <!-- Initial loading state -->
    <div v-if="evidenceLoader.loading.value && !evidenceLoader.evidence.value" class="content-center">
      <v-progress-circular indeterminate size="64" color="primary" />
      <p class="mt-4 text-body-1">Loading document...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="evidenceLoader.error.value && !evidenceLoader.evidence.value" class="content-center error-state">
      <v-icon size="64" color="error">mdi-alert-circle</v-icon>
      <h2 class="mt-4 text-h6">Error Loading Document</h2>
      <p class="mt-2 text-body-2">{{ evidenceLoader.error.value }}</p>
      <v-btn class="mt-4" color="primary" @click="goBack">Back to Organizer</v-btn>
    </div>

    <!-- Main content -->
    <div
      v-else
      class="view-document-content"
      :data-thumbnails-visible="thumbnailsVisible"
      :data-metadata-visible="metadataVisible"
    >
      <!-- Left: Thumbnail panel -->
      <PdfThumbnailPanel
        :is-pdf-file="isPdfFile"
        :pdf-document="pdfViewer.pdfDocument.value"
        :total-pages="pdfViewer.totalPages.value"
        :current-visible-page="currentVisiblePage"
        :visible="thumbnailsVisible"
        @toggle-visibility="toggleThumbnailsVisibility"
        @page-selected="scrollToPage"
      />

      <!-- Center: Navigation Bar -->
      <DocumentNavigationBar
        :current-document-index="navigation.currentDocumentIndex.value"
        :total-documents="navigation.totalDocuments.value"
        :is-pdf-file="isPdfFile"
        :current-page="currentVisiblePage"
        :total-pages="pdfViewer.totalPages.value"
        @navigate-first="navigation.goToFirstDocument"
        @navigate-previous="navigation.goToPreviousDocument"
        @navigate-next="navigation.goToNextDocument"
        @navigate-last="navigation.goToLastDocument"
        @jump-to-page="scrollToPage"
      />

      <!-- Center: PDF Viewer (spans columns based on panel visibility) -->
      <PdfViewerArea
        :is-pdf-file="isPdfFile"
        :pdf-document="pdfViewer.pdfDocument.value"
        :document-id="fileHash"
        :total-pages="pdfViewer.totalPages.value"
        :viewer-loading="evidenceLoader.viewerLoading.value"
        :loading-document="pdfViewer.loadingDocument.value"
        :pdf-load-error="pdfViewer.loadError.value"
        @page-rendered="handleFirstPageRendered"
      />

      <!-- Right: Metadata panel -->
      <DocumentMetadataPanel
        v-if="evidenceLoader.evidence.value"
        :evidence="evidenceLoader.evidence.value"
        :storage-metadata="evidenceLoader.storageMetadata.value"
        :source-metadata-variants="evidenceLoader.sourceMetadataVariants.value"
        :selected-metadata-hash="evidenceLoader.selectedMetadataHash.value"
        :dropdown-open="dropdownOpen"
        :visible="metadataVisible"
        :pdf-metadata="pdfMetadata"
        :metadata-loading="metadataLoading"
        :metadata-error="metadataError"
        :has-metadata="hasMetadata"
        :updating-metadata="evidenceLoader.updatingMetadata.value"
        :is-pdf-file="isPdfFile"
        :date-format="dateFormat"
        :time-format="timeFormat"
        :file-hash="fileHash"
        @toggle-visibility="toggleMetadataVisibility"
        @variant-selected="handleMetadataSelection"
        @dropdown-toggled="dropdownOpen = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/core/auth/stores/index.js';
import { useDocumentViewStore } from '@/features/documents/stores/documentView.js';
import { useMatterViewStore } from '@/features/matters/stores/matterView.js';
import { useUserPreferencesStore } from '@/features/profile/stores/userPreferences.js';
import { useOrganizerStore } from '@/features/documents/stores/organizer.js';
import { usePdfMetadata } from '@/features/documents/composables/usePdfMetadata.js';
import { usePdfViewer } from '@/features/documents/composables/usePdfViewer.js';
import { usePdfCache } from '@/features/documents/composables/usePdfCache.js';
import { useCanvasPreloader } from '@/features/documents/composables/useCanvasPreloader.js';
import { usePageVisibility } from '@/features/documents/composables/usePageVisibility.js';
import { useDocumentNavigation } from '@/features/documents/composables/useDocumentNavigation.js';
import { useEvidenceLoader } from '@/features/documents/composables/useEvidenceLoader.js';
import { useDocumentPreloader } from '@/features/documents/composables/useDocumentPreloader.js';
import { useRenderTracking } from '@/features/documents/composables/useRenderTracking.js';
import DocumentNavigationBar from '@/features/documents/components/viewer/DocumentNavigationBar.vue';
import PdfThumbnailPanel from '@/features/documents/components/viewer/PdfThumbnailPanel.vue';
import PdfViewerArea from '@/features/documents/components/viewer/PdfViewerArea.vue';
import DocumentMetadataPanel from '@/features/documents/components/viewer/DocumentMetadataPanel.vue';

// Stores & Route
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const documentViewStore = useDocumentViewStore();
const matterStore = useMatterViewStore();
const preferencesStore = useUserPreferencesStore();
const organizerStore = useOrganizerStore();
const { dateFormat, timeFormat, metadataBoxVisible } = storeToRefs(preferencesStore);
const fileHash = ref(route.params.fileHash);

// Composables
const pdfMetadataComposable = usePdfMetadata();
const pdfCache = usePdfCache();
const pdfViewer = usePdfViewer();
const pageVisibility = usePageVisibility();
const renderTracking = useRenderTracking();
const navigation = useDocumentNavigation(fileHash, route.params.matterId, router, organizerStore, pdfViewer, documentViewStore);
const canvasPreloader = useCanvasPreloader(navigation.performanceTracker);
const evidenceLoader = useEvidenceLoader(authStore, matterStore, documentViewStore, pdfViewer, pdfMetadataComposable, navigation.performanceTracker);
const preloader = useDocumentPreloader(
  authStore,
  matterStore,
  pdfViewer,
  pdfCache,
  canvasPreloader,
  computed(() => organizerStore.sortedEvidenceList || []),
  navigation.performanceTracker
);

// Destructure for template use
const { metadataLoading, metadataError, pdfMetadata, hasMetadata } = pdfMetadataComposable;

provide('pageVisibility', pageVisibility);
provide('canvasPreloader', canvasPreloader);
provide('performanceTracker', navigation.performanceTracker);

// UI State
const thumbnailsVisible = ref(true);
const metadataVisible = metadataBoxVisible;
const dropdownOpen = ref(false);

// Computed
const isPdfFile = computed(() => {
  return evidenceLoader.evidence.value?.displayName?.toLowerCase().endsWith('.pdf') || false;
});
const currentVisiblePage = computed(() => pageVisibility.mostVisiblePage.value || 1);

// Event Handlers
const goBack = () => router.push({ name: 'documents', params: { matterId: route.params.matterId } });
const toggleMetadataVisibility = async () => {
  await preferencesStore.updateMetadataBoxVisible(!metadataVisible.value);
};
const toggleThumbnailsVisibility = () => {
  thumbnailsVisible.value = !thumbnailsVisible.value;
};

const scrollToPage = (pageNumber) => {
  const pageElement = document.querySelector(`.pdf-page-container[data-page-number="${pageNumber}"]`);
  if (pageElement) {
    pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const handleMetadataSelection = async (newMetadataHash) => {
  await evidenceLoader.updateSelectedMetadata(fileHash.value, newMetadataHash);
};

const handleFirstPageRendered = async (pageNumber) => {
  if (pageNumber !== 1 || navigation.navigationStartTime.value === null) return;

  const elapsedMs = performance.now() - navigation.navigationStartTime.value;
  const docId = fileHash.value;

  // Check if this is first-time render or re-render
  const isFirstRender = renderTracking.isFirstRender(docId);
  const renderType = isFirstRender ? 'FIRST' : 'RE-RENDER';

  // Apply different thresholds for first-render vs re-render
  let isOptimal, isGood;
  if (isFirstRender) {
    // First-render thresholds (cold start)
    isOptimal = elapsedMs < 100;  // Optimal: <100ms
    isGood = elapsedMs < 250;     // Good: <250ms
  } else {
    // Re-render thresholds (cached content)
    isOptimal = elapsedMs < 20;   // Optimal: <20ms
    isGood = elapsedMs < 50;      // Good: <50ms
  }

  // Track first page render event
  if (navigation.performanceTracker && navigation.performanceTracker.isNavigationActive()) {
    navigation.performanceTracker.recordEvent('first_page_render', {
      duration: elapsedMs,
      renderType,
      isOptimal,
      isGood,
      fileName: evidenceLoader.evidence.value?.displayName || 'unknown.pdf',
    });

    // Mark navigation core as complete (will wait for background operations before outputting)
    navigation.performanceTracker.markNavigationCoreComplete();
  }

  // Mark as rendered for future tracking
  if (isFirstRender) {
    renderTracking.markAsRendered(docId);
  }

  navigation.navigationStartTime.value = null;

  // Start background pre-loading
  preloader
    .startBackgroundPreload(
      fileHash.value,
      navigation.previousDocumentId.value,
      navigation.nextDocumentId.value
    )
    .catch(() => {
      // Ignore pre-load errors - they are non-blocking
    });
};

// Keyboard Navigation
const handleKeydown = (event) => {
  if (!isPdfFile.value || !pdfViewer.totalPages.value ||
      event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  const page = pageVisibility.mostVisiblePage.value;
  const total = pdfViewer.totalPages.value;

  switch (event.key) {
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault();
      if (page > 1) scrollToPage(page - 1);
      break;
    case 'ArrowDown':
    case 'PageDown':
      event.preventDefault();
      if (page < total) scrollToPage(page + 1);
      break;
    case 'Home':
      event.preventDefault();
      scrollToPage(1);
      break;
    case 'End':
      event.preventDefault();
      scrollToPage(total);
      break;
  }
};

// Lifecycle
watch(
  () => route.params.fileHash,
  (newHash, oldHash) => {
    if (newHash && newHash !== oldHash) {
      fileHash.value = newHash;
      evidenceLoader.loadEvidence(newHash, navigation.navigationStartTime);
      // Save last viewed document to local storage
      localStorage.setItem('lastViewedDocument', newHash);
    }
  }
);

onMounted(async () => {
  if (!organizerStore.isInitialized) {
    try {
      await organizerStore.initialize();

      // Wait for evidenceList to be populated (max 5 seconds)
      // This ensures calculateExpectedPreRenders() has data to work with
      const maxWait = 5000;
      const startWait = performance.now();
      while (organizerStore.sortedEvidenceList.length === 0 && (performance.now() - startWait) < maxWait) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (organizerStore.sortedEvidenceList.length === 0) {
        console.warn('[ViewDocument] Evidence list still empty after waiting');
      }
    } catch (err) {
      console.error('[NewViewDocument2] Failed to initialize organizer store:', err);
    }
  }

  // Start performance tracking for initial document load
  const expectedPreRenders = navigation.calculateExpectedPreRenders(fileHash.value);
  const totalExpectedOperations = expectedPreRenders + 1; // +1 for thumbnails
  navigation.navigationStartTime.value = performance.now();
  navigation.performanceTracker.startNavigation('initial', null, fileHash.value, totalExpectedOperations);

  evidenceLoader.loadEvidence(fileHash.value, navigation.navigationStartTime);
  // Save last viewed document to local storage
  localStorage.setItem('lastViewedDocument', fileHash.value);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  documentViewStore.clearDocumentName();
  pdfViewer.cleanup();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.view-document-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px); /* Subtract AppHeader height */
  background-color: #f5f5f5;
}

.view-document-content {
  display: grid;
  grid-template-columns:
    [thumbnails-start] var(--thumbnails-width)
    [thumbnails-end center-start] 1fr
    [center-end metadata-start] var(--metadata-width)
    [metadata-end];
  grid-template-rows: auto 1fr;
  gap: 24px;
  padding: 24px;
  flex: 1;
  overflow: auto;
  align-items: start;

  /* Default column widths (panels open) */
  --thumbnails-width: 200px;
  --metadata-width: 420px;
}

/* Dynamic column widths based on panel visibility */
.view-document-content[data-thumbnails-visible="false"] {
  --thumbnails-width: auto;
}

.view-document-content[data-metadata-visible="false"] {
  --metadata-width: auto;
}

/* Grid area assignments for child components */

/* Thumbnail panel: column 1, spanning both rows */
.view-document-content > :nth-child(1) {
  grid-column: thumbnails-start / thumbnails-end;
  grid-row: 1 / 3;
}

/* Navigation bar: column 2 (center), row 1 */
.view-document-content > :nth-child(2) {
  grid-column: center-start / center-end;
  grid-row: 1;
  min-width: 500px;
}

/* PDF Viewer: dynamically spans columns based on panel visibility, row 2 */
.view-document-content > :nth-child(3) {
  grid-row: 2;
  min-width: 500px;
  transition: grid-column 0.3s ease;
}

/* Both panels open: PDF viewer stays in center column */
.view-document-content[data-thumbnails-visible="true"][data-metadata-visible="true"] > :nth-child(3) {
  grid-column: center-start / center-end;
}

/* Thumbnails closed: PDF viewer extends left */
.view-document-content[data-thumbnails-visible="false"][data-metadata-visible="true"] > :nth-child(3) {
  grid-column: thumbnails-start / center-end;
}

/* Metadata closed: PDF viewer extends right */
.view-document-content[data-thumbnails-visible="true"][data-metadata-visible="false"] > :nth-child(3) {
  grid-column: center-start / metadata-end;
}

/* Both panels closed: PDF viewer spans all columns */
.view-document-content[data-thumbnails-visible="false"][data-metadata-visible="false"] > :nth-child(3) {
  grid-column: thumbnails-start / metadata-end;
}

/* Metadata panel: column 3, spanning both rows */
.view-document-content > :nth-child(4) {
  grid-column: metadata-start / metadata-end;
  grid-row: 1 / 3;
}

.content-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px;
}

.error-state {
  text-align: center;
}

/* Responsive layout */
@media (max-width: 1150px) {
  .view-document-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto auto;
  }

  /* Stack all components vertically on mobile */
  .view-document-content > :nth-child(1),
  .view-document-content > :nth-child(2),
  .view-document-content > :nth-child(3),
  .view-document-content > :nth-child(4) {
    grid-column: 1;
    grid-row: auto;
    width: 100%;
    max-width: 100%;
    min-width: auto;
  }

  /* Reorder: Navigation (1), Viewer (2), Thumbnails (3), Metadata (4) */
  .view-document-content > :nth-child(1) { order: 3; } /* Thumbnails */
  .view-document-content > :nth-child(2) { order: 1; } /* Navigation */
  .view-document-content > :nth-child(3) { order: 2; } /* Viewer */
  .view-document-content > :nth-child(4) { order: 4; } /* Metadata */
}
</style>
