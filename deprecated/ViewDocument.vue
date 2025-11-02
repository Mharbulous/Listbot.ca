<template>
  <div class="view-document-container">
    <!-- Initial loading state (first visit only) -->
    <div v-if="loading && !evidence" class="content-center">
      <v-progress-circular indeterminate size="64" color="primary" />
      <p class="mt-4 text-body-1">Loading document...</p>
    </div>

    <!-- Error state (only show if no evidence loaded yet) -->
    <div v-else-if="error && !evidence" class="content-center error-state">
      <v-icon size="64" color="error">mdi-alert-circle</v-icon>
      <h2 class="mt-4 text-h6">Error Loading Document</h2>
      <p class="mt-2 text-body-2">{{ error }}</p>
      <v-btn class="mt-4" color="primary" @click="goBack"> Back to Organizer </v-btn>
    </div>

    <!-- Main content (visible once evidence is loaded, persists during navigation) -->
    <div v-else class="view-document-content">
      <!-- Left: Thumbnail panel (collapsible) -->
      <PdfThumbnailPanel
        :is-pdf-file="isPdfFile"
        :pdf-document="pdfDocument"
        :total-pages="totalPages"
        :current-visible-page="currentVisiblePage"
        :visible="thumbnailsVisible"
        @toggle-visibility="toggleThumbnailsVisibility"
        @page-selected="handlePageSelected"
      />

      <!-- Center: Document controls + PDF Viewer -->
      <div class="center-panel">
        <!-- Document navigation control panel -->
        <DocumentNavigationBar
          :current-document-index="currentDocumentIndex"
          :total-documents="totalDocuments"
          :is-pdf-file="isPdfFile"
          :current-page="currentVisiblePage"
          :total-pages="totalPages"
          @navigate-first="goToFirstDocument"
          @navigate-previous="goToPreviousDocument"
          @navigate-next="goToNextDocument"
          @navigate-last="goToLastDocument"
          @jump-to-page="handlePageJump"
        />

        <!-- PDF Viewer Area -->
        <PdfViewerArea
          :is-pdf-file="isPdfFile"
          :pdf-document="pdfDocument"
          :total-pages="totalPages"
          :viewer-loading="viewerLoading"
          :loading-document="loadingDocument"
          :pdf-load-error="pdfLoadError"
          @page-rendered="handleFirstPageRendered"
        />
      </div>

      <!-- Right: File metadata panel -->
      <DocumentMetadataPanel
        v-if="evidence"
        :evidence="evidence"
        :storage-metadata="storageMetadata"
        :source-metadata-variants="sourceMetadataVariants"
        :selected-metadata-hash="selectedMetadataHash"
        :dropdown-open="dropdownOpen"
        :visible="metadataVisible"
        :pdf-metadata="pdfMetadata"
        :metadata-loading="metadataLoading"
        :metadata-error="metadataError"
        :has-metadata="hasMetadata"
        :updating-metadata="updatingMetadata"
        :is-pdf-file="isPdfFile"
        :date-format="dateFormat"
        :time-format="timeFormat"
        :file-hash="fileHash"
        @toggle-visibility="toggleMetadataVisibility"
        @variant-selected="handleMetadataSelection"
        @dropdown-toggled="handleDropdownToggle"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onBeforeUnmount, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, getMetadata, getDownloadURL, getStorage } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { useAuthStore } from '@/core/stores/auth.js';
import { useDocumentViewStore } from '@/stores/documentView.js';
import { useMatterViewStore } from '@/stores/matterView.js';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';
import { useOrganizerStore } from '@/features/organizer/stores/organizer.js';
import { storeToRefs } from 'pinia';
import { EvidenceService } from '@/features/organizer/services/evidenceService.js';
import { usePdfMetadata } from '@/features/organizer/composables/usePdfMetadata.js';
import { usePdfViewer } from '@/features/organizer/composables/usePdfViewer.js';
import { usePdfCache } from '@/features/organizer/composables/usePdfCache.js';
import { usePageVisibility } from '@/features/organizer/composables/usePageVisibility.js';
import DocumentNavigationBar from '@/components/document/DocumentNavigationBar.vue';
import PdfThumbnailPanel from '@/components/document/PdfThumbnailPanel.vue';
import PdfViewerArea from '@/components/document/PdfViewerArea.vue';
import DocumentMetadataPanel from '@/components/document/DocumentMetadataPanel.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const documentViewStore = useDocumentViewStore();
const matterStore = useMatterViewStore();
const preferencesStore = useUserPreferencesStore();
const organizerStore = useOrganizerStore();
const { dateFormat, timeFormat, metadataBoxVisible } = storeToRefs(preferencesStore);

// PDF Metadata composable
const { metadataLoading, metadataError, pdfMetadata, hasMetadata, extractMetadata } =
  usePdfMetadata();

// PDF Cache composable (for direct cache access during pre-load)
const pdfCache = usePdfCache();

// PDF Viewer composable
const {
  pdfDocument,
  totalPages,
  loadingDocument,
  loadError: pdfLoadError,
  isDocumentCached,
  getCachedMetadata,
  cacheMetadata,
  loadPdf,
  preloadAdjacentDocuments,
  cleanup: cleanupPdf,
  getCacheStats,
} = usePdfViewer();

// Page Visibility composable (for tracking visible pages)
const pageVisibility = usePageVisibility();

// Provide page visibility to child components
provide('pageVisibility', pageVisibility);

// State
const fileHash = ref(route.params.fileHash);
const evidence = ref(null);
const storageMetadata = ref(null);
const loading = ref(true); // Initial page load
const viewerLoading = ref(false); // Viewer area loading during navigation
const error = ref(null);
const sourceMetadataVariants = ref([]);
const selectedMetadataHash = ref(null);
const updatingMetadata = ref(false);
const dropdownOpen = ref(false);

// Metadata visibility state (bound to user preferences)
const metadataVisible = metadataBoxVisible;

// Thumbnail panel visibility state
const thumbnailsVisible = ref(true);

// Performance timing for navigation
const navigationStartTime = ref(null);

// Document navigation state
// Get sorted evidence list for consistent ordering
const sortedEvidence = computed(() => organizerStore.sortedEvidenceList || []);
const totalDocuments = computed(() => organizerStore.evidenceCount || 1);

// Calculate current document index based on current route's fileHash
const currentDocumentIndex = computed(() => {
  if (!fileHash.value || sortedEvidence.value.length === 0) {
    return 1;
  }

  const index = sortedEvidence.value.findIndex((ev) => ev.id === fileHash.value);
  return index >= 0 ? index + 1 : 1; // Convert 0-based to 1-based index
});

// Get adjacent document IDs for caching
const previousDocumentId = computed(() => {
  if (sortedEvidence.value.length === 0) return null;

  const currentIndex = currentDocumentIndex.value - 1; // Convert to 0-based
  if (currentIndex > 0) {
    return sortedEvidence.value[currentIndex - 1]?.id || null;
  }
  return null;
});

const nextDocumentId = computed(() => {
  if (sortedEvidence.value.length === 0) return null;

  const currentIndex = currentDocumentIndex.value - 1; // Convert to 0-based
  if (currentIndex < sortedEvidence.value.length - 1) {
    return sortedEvidence.value[currentIndex + 1]?.id || null;
  }
  return null;
});

// Check if current file is a PDF
const isPdfFile = computed(() => {
  return evidence.value?.displayName?.toLowerCase().endsWith('.pdf') || false;
});

// Current visible page for thumbnail highlighting (always a number)
const currentVisiblePage = computed(() => {
  return pageVisibility.mostVisiblePage.value || 1;
});


// Navigate back to documents view
const goBack = () => {
  router.push('/documents');
};

// Toggle metadata visibility
const toggleMetadataVisibility = async () => {
  await preferencesStore.updateMetadataBoxVisible(!metadataVisible.value);
};

// Toggle thumbnail panel visibility
const toggleThumbnailsVisibility = () => {
  thumbnailsVisible.value = !thumbnailsVisible.value;
};

/**
 * Handle thumbnail page selection
 * Scrolls the main viewer to the selected page
 */
const handlePageSelected = (pageNumber) => {
  // Find the canvas for the selected page
  const pageElement = document.querySelector(`.pdf-page-container[data-page-number="${pageNumber}"]`);

  if (pageElement) {
    pageElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

// Document navigation methods
const goToFirstDocument = () => {
  if (sortedEvidence.value.length === 0) return;
  const firstDoc = sortedEvidence.value[0];
  router.push(`/documents/view/${firstDoc.id}`);
};

const goToPreviousDocument = () => {
  if (sortedEvidence.value.length === 0) return;

  const currentIndex = currentDocumentIndex.value - 1; // Convert to 0-based
  if (currentIndex > 0) {
    const prevDoc = sortedEvidence.value[currentIndex - 1];
    navigationStartTime.value = performance.now();
    console.info('⬅️ Navigation to previous document started', {
      fromDoc: fileHash.value,
      toDoc: prevDoc.id,
    });
    router.push(`/documents/view/${prevDoc.id}`);
  }
};

const goToNextDocument = () => {
  if (sortedEvidence.value.length === 0) return;

  const currentIndex = currentDocumentIndex.value - 1; // Convert to 0-based
  if (currentIndex < sortedEvidence.value.length - 1) {
    const nextDoc = sortedEvidence.value[currentIndex + 1];
    navigationStartTime.value = performance.now();
    console.info('➡️ Navigation to next document started', {
      fromDoc: fileHash.value,
      toDoc: nextDoc.id,
    });
    router.push(`/documents/view/${nextDoc.id}`);
  }
};

const goToLastDocument = () => {
  if (sortedEvidence.value.length === 0) return;
  const lastDoc = sortedEvidence.value[sortedEvidence.value.length - 1];
  router.push(`/documents/view/${lastDoc.id}`);
};

/**
 * Handle first page render completion
 * Tracks total time from navigation start to first page visible on screen
 */
const handleFirstPageRendered = (pageNumber) => {
  // Only track timing for page 1 and only if we have a navigation start time
  if (pageNumber !== 1 || navigationStartTime.value === null) {
    return;
  }

  const elapsedMs = performance.now() - navigationStartTime.value;
  console.log(`⚡ 🎨 First page rendered on screen: ${elapsedMs}ms`, {
    documentId: fileHash.value,
    milliseconds: elapsedMs.toFixed(1),
    seconds: (elapsedMs / 1000).toFixed(3),
  });

  // Reset navigation timer
  navigationStartTime.value = null;

  // Start background pre-loading AFTER first page renders
  // This eliminates race conditions and ensures PDFs are cached before metadata extraction
  startBackgroundPreload().catch(err => {
    // Errors already logged in startBackgroundPreload
    console.debug('Background pre-load promise rejected', { error: err.message });
  });
};

/**
 * Get download URL for a document by its ID
 * Used for pre-loading adjacent documents
 *
 * @param {string} documentId - Document ID (file hash)
 * @returns {Promise<string>} Firebase Storage download URL
 */
const getDocumentDownloadUrl = async (documentId) => {
  const firmId = authStore.currentFirm;
  const matterId = matterStore.currentMatterId;

  if (!firmId || !matterId || !documentId) {
    throw new Error('Missing firm ID, matter ID, or document ID');
  }

  // Find the document in sortedEvidence to get its display name
  const doc = sortedEvidence.value.find((ev) => ev.id === documentId);
  if (!doc) {
    throw new Error(`Document ${documentId} not found in evidence list`);
  }

  // Get file extension from displayName
  const extension = doc.displayName.split('.').pop() || 'pdf';

  // Construct storage path using file hash (documentId) and extension
  const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${documentId}.${extension.toLowerCase()}`;
  const storage = getStorage();
  const fileRef = storageRef(storage, storagePath);

  // Get download URL
  return await getDownloadURL(fileRef);
};

/**
 * Fetch and cache metadata for a document (for pre-loading)
 * Used during background pre-loading of adjacent documents
 *
 * @param {string} documentId - Document ID (file hash)
 */
const fetchAndCacheMetadata = async (documentId) => {
  try {
    const firmId = authStore.currentFirm;
    const matterId = matterStore.currentMatterId;

    if (!firmId || !matterId || !documentId) {
      console.warn('Cannot pre-load metadata: missing firm/matters/document ID', { documentId });
      return;
    }

    // Skip if metadata is already cached
    const cached = getCachedMetadata(documentId);
    if (cached) {
      console.debug('Metadata already cached, skipping pre-load', { documentId });
      return;
    }

    console.debug('Pre-loading metadata for document', { documentId });

    // Fetch evidence document from Firestore
    const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', documentId);
    const evidenceSnap = await getDoc(evidenceRef);

    if (!evidenceSnap.exists()) {
      console.warn('Evidence document not found during pre-load', { documentId });
      return;
    }

    const evidenceData = evidenceSnap.data();

    // Fetch sourceMetadata variants
    const evidenceService = new EvidenceService(firmId, matterId);
    const variants = await evidenceService.getAllSourceMetadata(documentId);

    // Compute displayName and selectedMetadataHash
    const currentMetadataHash = evidenceData.sourceID;
    const currentVariant = variants.find((v) => v.metadataHash === currentMetadataHash);

    let displayName = 'Unknown File';
    let selectedMetadataHash_local = currentMetadataHash;

    if (currentVariant) {
      displayName = currentVariant.sourceFileName || 'Unknown File';
    } else if (variants.length > 0) {
      displayName = variants[0].sourceFileName || 'Unknown File';
      selectedMetadataHash_local = variants[0].metadataHash;
    }

    // Fetch storage metadata
    const extension = displayName.split('.').pop() || 'pdf';
    const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${documentId}.${extension.toLowerCase()}`;
    const fileRef = storageRef(storage, storagePath);
    const storageMetadata_fetched = await getMetadata(fileRef);

    // Cache metadata (PDF will be cached separately by preloadAdjacentDocuments)
    cacheMetadata(documentId, {
      evidenceData,
      sourceVariants: variants,
      storageMetadata: storageMetadata_fetched,
      displayName,
      selectedMetadataHash: selectedMetadataHash_local,
      pdfMetadata: null, // Will be populated when PDF metadata is extracted
    });

    console.info('📋 Pre-loaded and cached metadata', { documentId });
  } catch (err) {
    // Non-blocking - pre-load failures should not affect current navigation
    console.warn('Failed to pre-load metadata (non-blocking)', {
      documentId,
      error: err.message,
    });
  }
};

/**
 * Extract and cache PDF metadata for a pre-loaded document
 * Used during background pre-loading to complete the caching pipeline
 *
 * @param {string} documentId - Document ID (file hash)
 */
const extractAndCachePdfMetadata = async (documentId) => {
  try {
    const firmId = authStore.currentFirm;
    const matterId = matterStore.currentMatterId;

    if (!firmId || !matterId || !documentId) {
      console.warn('Cannot extract PDF metadata: missing firm/matters/document ID', { documentId });
      return;
    }

    // Check if PDF is cached (pre-loaded)
    if (!isDocumentCached(documentId)) {
      console.debug('PDF not cached yet, skipping metadata extraction', { documentId });
      return;
    }

    // Get existing cached metadata
    const cachedMetadata = getCachedMetadata(documentId);

    // Skip if PDF metadata is already cached
    if (cachedMetadata?.pdfMetadata) {
      console.debug('PDF metadata already cached, skipping extraction', { documentId });
      return;
    }

    // Skip if we don't have the basic metadata yet (need displayName)
    if (!cachedMetadata?.displayName) {
      console.debug('Basic metadata not cached yet, skipping PDF metadata extraction', { documentId });
      return;
    }

    console.debug('Pre-loading PDF metadata for document', { documentId });

    // Retrieve the pre-loaded PDF from cache
    const pdfDoc = await pdfCache.getDocument(documentId, null);

    // Extract metadata from the pre-loaded PDF
    // Note: extractMetadata() updates the shared pdfMetadata reactive ref
    await extractMetadata(documentId, cachedMetadata.displayName, pdfDoc);

    // Immediately clone and cache the extracted metadata
    // This updates the existing cache entry with the PDF metadata field
    cacheMetadata(documentId, {
      ...cachedMetadata,
      pdfMetadata: { ...pdfMetadata }, // Clone to avoid reactivity issues
    });

    console.info('📄 Pre-loaded and cached PDF metadata', { documentId });
  } catch (err) {
    // Non-blocking - pre-load failures should not affect current navigation
    console.warn('Failed to pre-load PDF metadata (non-blocking)', {
      documentId,
      error: err.message,
    });
  }
};

/**
 * Start background pre-loading of adjacent documents
 * Called AFTER first page render to avoid race conditions
 *
 * Sequential flow:
 * 1. Pre-load PDFs (wait for completion)
 * 2. Pre-load metadata (wait for completion)
 * 3. Extract PDF metadata (PDFs guaranteed to be cached)
 */
const startBackgroundPreload = async () => {
  try {
    const prevId = previousDocumentId.value;
    const nextId = nextDocumentId.value;

    console.info('🚀 Starting background pre-load after first page render', {
      currentDocId: fileHash.value,
      previousDocId: prevId,
      nextDocId: nextId,
    });

    // Step 1: Pre-load PDFs and wait for completion
    // This ensures PDFs are cached before we try to extract their metadata
    await preloadAdjacentDocuments(prevId, nextId, getDocumentDownloadUrl);

    // Step 2: Pre-load metadata for adjacent documents (parallel)
    const metadataPromises = [];
    if (prevId) {
      metadataPromises.push(
        fetchAndCacheMetadata(prevId).catch(err => {
          console.warn('Failed to pre-load metadata for previous doc', { prevId, error: err.message });
        })
      );
    }
    if (nextId) {
      metadataPromises.push(
        fetchAndCacheMetadata(nextId).catch(err => {
          console.warn('Failed to pre-load metadata for next doc', { nextId, error: err.message });
        })
      );
    }
    await Promise.allSettled(metadataPromises);

    // Step 3: Extract PDF metadata (PDFs are guaranteed cached now)
    // No setTimeout needed - PDFs are already loaded!
    if (prevId) {
      await extractAndCachePdfMetadata(prevId).catch(err => {
        console.warn('Failed to extract PDF metadata for previous doc', { prevId, error: err.message });
      });
    }
    if (nextId) {
      await extractAndCachePdfMetadata(nextId).catch(err => {
        console.warn('Failed to extract PDF metadata for next doc', { nextId, error: err.message });
      });
    }

    console.info('✅ Background pre-load completed', {
      currentDocId: fileHash.value,
      previousDocId: prevId,
      nextDocId: nextId,
    });
  } catch (err) {
    // Non-blocking - pre-load failures should not affect UX
    console.warn('Background pre-load failed (non-blocking)', {
      error: err.message,
    });
  }
};

// Handle dropdown toggle from DocumentMetadataPanel
const handleDropdownToggle = (open) => {
  dropdownOpen.value = open;
};

// Handle metadata variant selection from dropdown
const handleMetadataSelection = async (newMetadataHash) => {
  if (!newMetadataHash || updatingMetadata.value) return;

  try {
    updatingMetadata.value = true;

    const firmId = authStore.currentFirm;
    const matterId = matterStore.currentMatterId;
    if (!firmId || !fileHash.value || !matterId) {
      throw new Error('Missing firm ID, matter ID, or file hash');
    }

    // Find the selected variant
    const selectedVariant = sourceMetadataVariants.value.find(
      (v) => v.metadataHash === newMetadataHash
    );

    if (!selectedVariant) {
      throw new Error('Selected metadata variant not found');
    }

    // Update Firestore evidence document with new sourceID
    const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash.value);
    await updateDoc(evidenceRef, {
      sourceID: newMetadataHash,
    });

    // Update local state with new display information
    evidence.value = {
      ...evidence.value,
      sourceID: newMetadataHash,
      displayName: selectedVariant.sourceFileName || 'Unknown File',
      createdAt: selectedVariant.sourceLastModified,
    };

    // Update selected hash
    selectedMetadataHash.value = newMetadataHash;

    // Update document view store for breadcrumb
    documentViewStore.setDocumentName(selectedVariant.sourceFileName || 'Unknown File');

    console.log(
      `[ViewDocument] Updated sourceID to: ${selectedVariant.sourceFileName} (${newMetadataHash.substring(0, 8)}...)`
    );
  } catch (err) {
    console.error('[ViewDocument] Failed to update metadata selection:', err);
    // Revert selection on error
    selectedMetadataHash.value = evidence.value.sourceID;
  } finally {
    updatingMetadata.value = false;
  }
};

// Fetch Firebase Storage metadata
const fetchStorageMetadata = async (firmId, displayName) => {
  try {
    const matterId = matterStore.currentMatterId;
    if (!matterId) {
      throw new Error('No matter selected');
    }

    // Get file extension from displayName
    const extension = displayName.split('.').pop() || 'pdf';

    // Build storage path (same format as used in fileProcessingService)
    const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash.value}.${extension.toLowerCase()}`;
    const fileRef = storageRef(storage, storagePath);

    // Get metadata from Firebase Storage (only if not already loaded from cache)
    if (!storageMetadata.value) {
      const metadata = await getMetadata(fileRef);
      storageMetadata.value = metadata;
    }

    // Extract PDF embedded metadata if this is a PDF file
    if (displayName?.toLowerCase().endsWith('.pdf')) {
      // Check cache first to avoid unnecessary Firebase Storage API call
      if (isDocumentCached(fileHash.value)) {
        // Document is cached - no URL needed (instant load)
        await loadPdf(fileHash.value);
      } else {
        // Document not cached - fetch URL and load
        const downloadURL = await getDownloadURL(fileRef);
        await loadPdf(fileHash.value, downloadURL);
      }

      // Calculate PDF load timing if this was triggered by navigation
      // Note: This measures PDF load into memory, NOT render to screen
      // Render timing is measured separately in handleFirstPageRendered()
      if (navigationStartTime.value !== null) {
        const elapsedMs = performance.now() - navigationStartTime.value;
        console.log(`⚡ 📦 PDF document loaded into memory: ${elapsedMs}ms`, {
          documentId: fileHash.value,
          milliseconds: elapsedMs.toFixed(1),
          seconds: (elapsedMs / 1000).toFixed(3),
          note: 'First page render timing logged separately'
        });
        // Note: Do NOT reset navigationStartTime here - we need it for render timing
      }

      // Check if PDF metadata is already cached
      const cachedMetadata = getCachedMetadata(fileHash.value);
      if (cachedMetadata?.pdfMetadata) {
        // Use cached PDF metadata (skip extraction)
        console.info('📄 PDF metadata cache HIT', { documentId: fileHash.value });
        // Note: pdfMetadata reactive state is managed by usePdfMetadata composable
        // We need to populate it from cache manually
        Object.assign(pdfMetadata, cachedMetadata.pdfMetadata);
      } else {
        // PERFORMANCE: Defer metadata extraction to avoid blocking first page render
        // Metadata extraction is CPU-intensive (50-150ms) and not critical for initial display
        // Cache metadata immediately (Firestore + Storage data is already loaded)
        cacheMetadata(fileHash.value, {
          evidenceData: evidence.value,
          sourceVariants: sourceMetadataVariants.value,
          storageMetadata: storageMetadata.value,
          displayName: evidence.value.displayName,
          selectedMetadataHash: selectedMetadataHash.value,
          pdfMetadata: null, // Will be populated after extraction
        });

        // Extract PDF metadata in background (non-blocking)
        setTimeout(async () => {
          try {
            await extractMetadata(fileHash.value, displayName, pdfDocument.value);

            // Update cache with extracted PDF metadata
            cacheMetadata(fileHash.value, {
              evidenceData: evidence.value,
              sourceVariants: sourceMetadataVariants.value,
              storageMetadata: storageMetadata.value,
              displayName: evidence.value.displayName,
              selectedMetadataHash: selectedMetadataHash.value,
              pdfMetadata: { ...pdfMetadata }, // Clone to avoid reactivity issues
            });
            console.info('✅ Cached metadata + PDF + PDF metadata', { documentId: fileHash.value });
          } catch (err) {
            console.warn('Background PDF metadata extraction failed:', err);
          }
        }, 0);
      }

      // Pre-loading now happens AFTER first page renders (see handleFirstPageRendered)
      // This eliminates race conditions and ensures PDFs are cached before metadata extraction
    }
  } catch (err) {
    console.error('Failed to load storage metadata:', err);
    // Don't set error state - storage metadata is optional
    storageMetadata.value = null;
  }
};

// Load evidence document directly from Firestore (single document)
const loadEvidence = async () => {
  try {
    // Distinguish between initial load and navigation
    const isInitialLoad = !evidence.value;

    if (isInitialLoad) {
      loading.value = true;
    } else {
      viewerLoading.value = true;
    }

    error.value = null;

    const firmId = authStore.currentFirm;
    if (!firmId) {
      throw new Error('No firm ID found');
    }

    // Get the selected matter ID
    const matterId = matterStore.currentMatterId;
    if (!matterId) {
      throw new Error('No matter selected. Please select a matter to view documents.');
    }

    if (!fileHash.value) {
      throw new Error('No file hash provided');
    }

    // Check metadata cache first to avoid network calls
    const cachedMetadata = getCachedMetadata(fileHash.value);

    let evidenceData;
    let variants;
    let displayName;
    let selectedMetadataHash_local;
    let storageMetadata_cached;

    if (cachedMetadata) {
      // ✅ CACHE HIT - Use cached metadata (instant, no network calls)
      console.info('📋 Metadata cache HIT', { documentId: fileHash.value });

      evidenceData = cachedMetadata.evidenceData;
      variants = cachedMetadata.sourceVariants;
      displayName = cachedMetadata.displayName;
      selectedMetadataHash_local = cachedMetadata.selectedMetadataHash;
      storageMetadata_cached = cachedMetadata.storageMetadata;

      // Populate state from cache
      sourceMetadataVariants.value = variants;
      selectedMetadataHash.value = selectedMetadataHash_local;
      storageMetadata.value = storageMetadata_cached;
    } else {
      // ❌ CACHE MISS - Fetch from Firestore/Storage
      console.info('📋 Metadata cache MISS', { documentId: fileHash.value });

      // Fetch single evidence document from Firestore
      // Path: /firms/{firmId}/matters/{matterId}/evidence/{fileHash}
      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash.value);
      const evidenceSnap = await getDoc(evidenceRef);

      if (!evidenceSnap.exists()) {
        throw new Error('Document not found');
      }

      evidenceData = evidenceSnap.data();

      // Fetch ALL sourceMetadata variants for this file
      const evidenceService = new EvidenceService(firmId, matterId);
      variants = await evidenceService.getAllSourceMetadata(fileHash.value);
      sourceMetadataVariants.value = variants;

      // Get currently selected metadata (from sourceID field)
      const currentMetadataHash = evidenceData.sourceID;
      selectedMetadataHash.value = currentMetadataHash;
      selectedMetadataHash_local = currentMetadataHash;

      // Find the currently selected variant
      const currentVariant = variants.find((v) => v.metadataHash === currentMetadataHash);

      let createdAt = null;

      if (currentVariant) {
        displayName = currentVariant.sourceFileName || 'Unknown File';
        createdAt = currentVariant.sourceLastModified;
      } else if (variants.length > 0) {
        // Fallback to first variant if sourceID doesn't match any
        displayName = variants[0].sourceFileName || 'Unknown File';
        createdAt = variants[0].sourceLastModified;
        selectedMetadataHash.value = variants[0].metadataHash;
        selectedMetadataHash_local = variants[0].metadataHash;
      } else {
        displayName = 'Unknown File';
      }

      // Fetch Firebase Storage metadata (expensive network call)
      const extension = displayName.split('.').pop() || 'pdf';
      const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash.value}.${extension.toLowerCase()}`;
      const fileRef = storageRef(storage, storagePath);
      const metadata = await getMetadata(fileRef);
      storageMetadata.value = metadata;
      storageMetadata_cached = metadata;

      // Note: Metadata caching moved to fetchStorageMetadata() after PDF loads
      // to avoid race condition with invalid cache entries
    }

    // Find createdAt from variants (common path for both cache hit/miss)
    const currentVariant = variants.find((v) => v.metadataHash === selectedMetadataHash_local);
    const createdAt = currentVariant?.sourceLastModified ||
                     (variants.length > 0 ? variants[0].sourceLastModified : null);

    // Combine evidence and display metadata
    evidence.value = {
      id: fileHash.value,
      ...evidenceData,
      displayName,
      createdAt,
    };

    // Update document view store for breadcrumb display
    documentViewStore.setDocumentName(displayName);

    // Load PDF and extract metadata (uses PDF cache for instant load)
    await fetchStorageMetadata(firmId, displayName);
  } catch (err) {
    console.error('Failed to load evidence:', err);
    error.value = err.message || 'Failed to load document';
  } finally {
    loading.value = false;
    viewerLoading.value = false;
  }
};

// Close dropdown when clicking outside
const closeDropdown = (event) => {
  const dropdown = event.target.closest('.dropdown-container');
  if (!dropdown) {
    dropdownOpen.value = false;
  }
};

// Handle page jump from DocumentNavigationBar
const handlePageJump = (pageNum) => {
  handlePageSelected(pageNum);
};

// Keyboard navigation
const handleKeydown = (event) => {
  // Only handle if it's a PDF file with pages and user is not typing in an input
  if (
    !isPdfFile.value ||
    !totalPages.value ||
    event.target.tagName === 'INPUT' ||
    event.target.tagName === 'TEXTAREA'
  ) {
    return;
  }

  switch (event.key) {
    case 'ArrowUp':
    case 'PageUp':
      event.preventDefault();
      if (pageVisibility.mostVisiblePage.value > 1) {
        handlePageSelected(pageVisibility.mostVisiblePage.value - 1);
      }
      break;

    case 'ArrowDown':
    case 'PageDown':
      event.preventDefault();
      if (pageVisibility.mostVisiblePage.value < totalPages.value) {
        handlePageSelected(pageVisibility.mostVisiblePage.value + 1);
      }
      break;

    case 'Home':
      event.preventDefault();
      handlePageSelected(1);
      break;

    case 'End':
      event.preventDefault();
      handlePageSelected(totalPages.value);
      break;
  }
};

// Watch for route changes to reload document when navigating between documents
watch(
  () => route.params.fileHash,
  (newHash, oldHash) => {
    if (newHash && newHash !== oldHash) {
      fileHash.value = newHash;
      loadEvidence();
    }
  }
);

// Initialize on mount
onMounted(async () => {
  // Ensure organizer store is initialized (idempotent - safe to call multiple times)
  if (!organizerStore.isInitialized) {
    try {
      await organizerStore.initialize();
      console.log(
        '[ViewDocument] Organizer store initialized, evidenceCount:',
        organizerStore.evidenceCount
      );
    } catch (err) {
      console.error('[ViewDocument] Failed to initialize organizer store:', err);
      // Continue loading document even if organizer init fails
    }
  }

  loadEvidence();
  // Add click listener to close dropdown when clicking outside
  document.addEventListener('click', closeDropdown);
  // Add keyboard navigation listener
  window.addEventListener('keydown', handleKeydown);
});

// Clean up store when component unmounts
onUnmounted(() => {
  documentViewStore.clearDocumentName();
  // Clean up PDF resources
  cleanupPdf();
});

// Clean up event listeners
onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
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

/* Center: Document controls + PDF viewer */
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

/* Responsive layout for tablets and mobile */
@media (max-width: 1150px) {
  .view-document-content {
    flex-direction: column;
  }

  .center-panel {
    width: 100%;
    max-width: 100%;
    min-width: auto;
    order: 1; /* Show first on mobile */
  }
}
</style>
