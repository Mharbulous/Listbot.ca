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
    <div v-else class="view-document-content">
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

      <!-- Center: Navigation + PDF Viewer -->
      <div class="center-panel">
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

        <PdfViewerArea
          :is-pdf-file="isPdfFile"
          :pdf-document="pdfViewer.pdfDocument.value"
          :total-pages="pdfViewer.totalPages.value"
          :viewer-loading="evidenceLoader.viewerLoading.value"
          :loading-document="pdfViewer.loadingDocument.value"
          :pdf-load-error="pdfViewer.loadError.value"
          @page-rendered="handleFirstPageRendered"
        />
      </div>

      <!-- Right: Metadata panel -->
      <DocumentMetadataPanel
        v-if="evidenceLoader.evidence.value"
        :evidence="evidenceLoader.evidence.value"
        :storage-metadata="evidenceLoader.storageMetadata.value"
        :source-metadata-variants="evidenceLoader.sourceMetadataVariants.value"
        :selected-metadata-hash="evidenceLoader.selectedMetadataHash.value"
        :dropdown-open="dropdownOpen"
        :visible="metadataVisible"
        :pdf-metadata="pdfMetadata.pdfMetadata"
        :metadata-loading="pdfMetadata.metadataLoading.value"
        :metadata-error="pdfMetadata.metadataError.value"
        :has-metadata="pdfMetadata.hasMetadata.value"
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
import { useAuthStore } from '@/core/stores/auth.js';
import { useDocumentViewStore } from '@/stores/documentView.js';
import { useMatterViewStore } from '@/stores/matterView.js';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';
import { useOrganizerStore } from '@/features/organizer/stores/organizer.js';
import { usePdfMetadata } from '@/features/organizer/composables/usePdfMetadata.js';
import { usePdfViewer } from '@/features/organizer/composables/usePdfViewer.js';
import { usePdfCache } from '@/features/organizer/composables/usePdfCache.js';
import { usePageVisibility } from '@/features/organizer/composables/usePageVisibility.js';
import { useDocumentNavigation } from '@/features/organizer/composables/useDocumentNavigation.js';
import { useEvidenceLoader } from '@/features/organizer/composables/useEvidenceLoader.js';
import { useDocumentPreloader } from '@/features/organizer/composables/useDocumentPreloader.js';
import DocumentNavigationBar from '@/components/document/DocumentNavigationBar.vue';
import PdfThumbnailPanel from '@/components/document/PdfThumbnailPanel.vue';
import PdfViewerArea from '@/components/document/PdfViewerArea.vue';
import DocumentMetadataPanel from '@/components/document/DocumentMetadataPanel.vue';

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
const pdfMetadata = usePdfMetadata();
const pdfCache = usePdfCache();
const pdfViewer = usePdfViewer();
const pageVisibility = usePageVisibility();
const navigation = useDocumentNavigation(fileHash, router, organizerStore);
const evidenceLoader = useEvidenceLoader(authStore, matterStore, documentViewStore, pdfViewer, pdfMetadata);
const preloader = useDocumentPreloader(
  authStore,
  matterStore,
  pdfViewer,
  pdfMetadata,
  pdfCache,
  computed(() => organizerStore.sortedEvidenceList || [])
);

provide('pageVisibility', pageVisibility);

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
const goBack = () => router.push('/documents');
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

const handleFirstPageRendered = (pageNumber) => {
  if (pageNumber !== 1 || navigation.navigationStartTime.value === null) return;

  const elapsedMs = performance.now() - navigation.navigationStartTime.value;

  // Performance classification for HWA testing
  const isOptimal = elapsedMs < 50;  // Target: <50ms
  const isGood = elapsedMs < 100;     // Good: <100ms
  const performanceIcon = isOptimal ? '🚀' : isGood ? '✅' : '⚠️';

  console.log(`⚡ 🎨 ${performanceIcon} First page rendered (HWA enabled): ${elapsedMs.toFixed(1)}ms`, {
    documentId: fileHash.value,
    milliseconds: elapsedMs.toFixed(1),
    seconds: (elapsedMs / 1000).toFixed(3),
    performance: isOptimal ? 'OPTIMAL (<50ms)' : isGood ? 'GOOD (<100ms)' : 'NEEDS WORK (>100ms)',
    hardwareAcceleration: 'enabled',
  });

  navigation.navigationStartTime.value = null;

  // Start background pre-loading
  preloader
    .startBackgroundPreload(
      fileHash.value,
      navigation.previousDocumentId.value,
      navigation.nextDocumentId.value
    )
    .catch((err) => console.debug('Background pre-load promise rejected', { error: err.message }));
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
    }
  }
);

onMounted(async () => {
  if (!organizerStore.isInitialized) {
    try {
      await organizerStore.initialize();
      console.log('[NewViewDocument2] Organizer store initialized, evidenceCount:', organizerStore.evidenceCount);
    } catch (err) {
      console.error('[NewViewDocument2] Failed to initialize organizer store:', err);
    }
  }
  evidenceLoader.loadEvidence(fileHash.value, navigation.navigationStartTime);
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
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex: 1;
  gap: 24px;
  padding: 24px;
  overflow: auto;
}

.center-panel {
  flex: 1;
  min-width: 500px;
  max-width: 9.2in; /* Match viewer width */
  display: flex;
  flex-direction: column;
  gap: 16px;
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
    flex-direction: column;
  }

  .center-panel {
    width: 100%;
    max-width: 100%;
    min-width: auto;
    order: 1;
  }
}
</style>
