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
      <div class="thumbnail-panel" :class="{ 'thumbnail-panel--collapsed': !thumbnailsVisible }">
        <v-card variant="outlined" class="thumbnail-card">
          <!-- Toggle button -->
          <v-btn
            icon
            variant="text"
            size="small"
            :title="thumbnailsVisible ? 'Collapse thumbnails' : 'Expand thumbnails'"
            class="thumbnail-toggle-btn"
            :class="{ 'thumbnail-toggle-btn--collapsed': !thumbnailsVisible }"
            @click="toggleThumbnailsVisibility"
          >
            <v-icon>{{ thumbnailsVisible ? 'mdi-chevron-left' : 'mdi-chevron-right' }}</v-icon>
          </v-btn>

          <!-- Expanded content -->
          <div v-if="thumbnailsVisible" class="thumbnail-content">
            <h3 class="thumbnail-title">Pages</h3>

            <!-- PDF Thumbnails -->
            <PdfThumbnailList
              v-if="isPdfFile && pdfDocument"
              :pdf-document="pdfDocument"
              :total-pages="totalPages"
              :current-page="currentVisiblePage"
              :max-thumbnail-width="150"
              @page-selected="handlePageSelected"
            />

            <!-- No PDF loaded -->
            <div v-else class="thumbnail-placeholder-content">
              <v-icon size="48" color="grey-lighten-1">mdi-image-multiple-outline</v-icon>
              <p class="mt-2 text-caption text-grey">
                {{ isPdfFile ? 'Loading thumbnails...' : 'No PDF loaded' }}
              </p>
            </div>
          </div>
        </v-card>
      </div>

      <!-- Center: Document controls + PDF Viewer -->
      <div class="center-panel">
        <!-- Document navigation control panel -->
        <div class="document-nav-panel">
          <v-card class="document-nav-card">
            <!-- Left controls -->
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentDocumentIndex === 1"
              title="First document"
              @click="goToFirstDocument"
            >
              <v-icon>mdi-page-first</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentDocumentIndex === 1"
              title="Previous document"
              @click="goToPreviousDocument"
            >
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>

            <!-- Center document indicator -->
            <span class="document-indicator"
              >Document {{ currentDocumentIndex }} of {{ totalDocuments }}</span
            >

            <!-- Page jump input (for PDFs) -->
            <div v-if="isPdfFile && totalPages > 1" class="page-jump-control">
              <input
                v-model.number="pageJumpInput"
                type="number"
                :min="1"
                :max="totalPages"
                class="page-jump-input"
                placeholder="Page"
                @keypress.enter="jumpToPage"
              />
              <span class="page-jump-label">/ {{ totalPages }}</span>
              <v-btn
                icon
                variant="text"
                size="small"
                title="Go to page"
                @click="jumpToPage"
              >
                <v-icon>mdi-arrow-right-circle</v-icon>
              </v-btn>
            </div>

            <!-- Right controls -->
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentDocumentIndex === totalDocuments"
              title="Next document"
              @click="goToNextDocument"
            >
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentDocumentIndex === totalDocuments"
              title="Last document"
              @click="goToLastDocument"
            >
              <v-icon>mdi-page-last</v-icon>
            </v-btn>
          </v-card>
        </div>

        <!-- PDF Viewer Area -->
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
            <PdfPageCanvas
              v-for="pageNum in totalPages"
              :key="`page-${pageNum}`"
              :page-number="pageNum"
              :pdf-document="pdfDocument"
              :width="883.2"
              :height="1056"
              class="pdf-page"
              @page-rendered="handleFirstPageRendered"
            />
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
              <p v-if="evidence" class="mt-1 text-caption text-grey">
                File: <strong>{{ evidence.displayName }}</strong>
              </p>
            </div>
          </v-card>
        </div>
      </div>

      <!-- Right: File metadata panel -->
      <div class="metadata-panel">
        <div class="metadata-box" :class="{ 'metadata-box--collapsed': !metadataVisible }">
          <v-card variant="outlined" class="metadata-card">
            <!-- Card header with toggle button -->
            <div class="metadata-card-header">
              <h3 class="metadata-card-title">File Metadata</h3>
              <v-btn
                icon
                variant="text"
                size="small"
                :title="metadataVisible ? 'Hide metadata' : 'Show metadata'"
                class="toggle-btn"
                @click="toggleMetadataVisibility"
              >
                <v-icon>{{ metadataVisible ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
              </v-btn>
            </div>

            <v-card-text v-if="metadataVisible">
              <!-- Source File Section -->
              <div class="metadata-section">
                <h3 class="metadata-section-title">Source File Information</h3>

                <!-- File name dropdown for selecting metadata variants -->
                <div class="metadata-item">
                  <span class="metadata-label">Source File Name:</span>
                  <div class="dropdown-container" @click="toggleDropdown">
                    <div
                      class="source-file-selector"
                      :class="{ disabled: updatingMetadata || sourceMetadataVariants.length === 0 }"
                    >
                      {{
                        sourceMetadataVariants.find((v) => v.metadataHash === selectedMetadataHash)
                          ?.sourceFileName || 'Unknown File'
                      }}
                      <span v-if="sourceMetadataVariants.length > 1" class="dropdown-arrow">▼</span>
                    </div>
                    <span v-if="updatingMetadata" class="updating-indicator">Updating...</span>

                    <!-- Custom dropdown menu -->
                    <div v-if="dropdownOpen" class="dropdown-menu" @click.stop>
                      <div
                        v-for="variant in sourceMetadataVariants"
                        :key="variant.metadataHash"
                        class="dropdown-item"
                        :class="{ selected: variant.metadataHash === selectedMetadataHash }"
                        @click="selectVariant(variant.metadataHash)"
                      >
                        {{ variant.sourceFileName }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Date modified display -->
                <div class="metadata-item">
                  <span class="metadata-label">Source Date Modified:</span>
                  <div class="date-with-notification">
                    <span class="metadata-value">{{
                      formatDateTime(evidence.createdAt, dateFormat, timeFormat)
                    }}</span>
                    <span v-if="earlierCopyMessage" class="earlier-copy-message">{{
                      earlierCopyMessage
                    }}</span>
                  </div>
                </div>

                <!-- File size -->
                <div class="metadata-item">
                  <span class="metadata-label">Size:</span>
                  <span class="metadata-value">{{ formatUploadSize(evidence.fileSize) }}</span>
                </div>

                <!-- MIME type -->
                <div class="metadata-item">
                  <span class="metadata-label">MIME Type:</span>
                  <span class="metadata-value">{{ mimeType }}</span>
                </div>
              </div>

              <!-- Cloud Section -->
              <div class="metadata-section">
                <h3 class="metadata-section-title">Cloud Storage Information</h3>
                <div class="metadata-item">
                  <span class="metadata-label">Upload Date:</span>
                  <span class="metadata-value">{{
                    storageMetadata?.timeCreated
                      ? formatDateTime(
                          new Date(storageMetadata.timeCreated),
                          dateFormat,
                          timeFormat
                        )
                      : storageMetadata === null
                        ? 'Unknown'
                        : 'Loading...'
                  }}</span>
                </div>
                <div class="metadata-item">
                  <span class="metadata-label">File Hash:</span>
                  <span class="metadata-value text-caption">{{ fileHash }}</span>
                </div>
              </div>

              <!-- Embedded Metadata Section -->
              <div class="metadata-section">
                <h3 class="metadata-section-title">Embedded Metadata</h3>

                <!-- Loading state -->
                <div v-if="isPdfFile && metadataLoading" class="metadata-notice">
                  <p>Loading PDF metadata...</p>
                </div>

                <!-- Error state -->
                <div v-else-if="isPdfFile && metadataError" class="metadata-error">
                  <p>Failed to load PDF metadata</p>
                  <p class="error-detail">{{ metadataError }}</p>
                </div>

                <!-- PDF Metadata Display -->
                <div v-else-if="isPdfFile && hasMetadata" class="pdf-metadata-container">
                  <!-- Document Information Dictionary -->
                  <div v-if="pdfMetadata.info" class="metadata-field-group">
                    <div v-if="pdfMetadata.info.title" class="metadata-item">
                      <span class="metadata-label">Title:</span>
                      <span class="metadata-value">{{ pdfMetadata.info.title }}</span>
                    </div>

                    <div v-if="pdfMetadata.info.author" class="metadata-item">
                      <span class="metadata-label">Author:</span>
                      <span class="metadata-value">{{ pdfMetadata.info.author }}</span>
                    </div>

                    <div v-if="pdfMetadata.info.subject" class="metadata-item">
                      <span class="metadata-label">Subject:</span>
                      <span class="metadata-value">{{ pdfMetadata.info.subject }}</span>
                    </div>

                    <div v-if="pdfMetadata.info.creator" class="metadata-item">
                      <span class="metadata-label">Creator:</span>
                      <span class="metadata-value">{{ pdfMetadata.info.creator }}</span>
                    </div>

                    <div v-if="pdfMetadata.info.producer" class="metadata-item">
                      <span class="metadata-label">Producer:</span>
                      <span class="metadata-value">{{ pdfMetadata.info.producer }}</span>
                    </div>

                    <div v-if="pdfMetadata.info.creationDate" class="metadata-item">
                      <span class="metadata-label">Creation Date:</span>
                      <span class="metadata-value">
                        {{
                          pdfMetadata.info.creationDate.formatted || pdfMetadata.info.creationDate
                        }}
                      </span>
                      <span v-if="pdfMetadata.info.creationDate.timezone" class="metadata-timezone">
                        ({{ pdfMetadata.info.creationDate.timezone }})
                      </span>
                    </div>

                    <div v-if="pdfMetadata.info.modDate" class="metadata-item">
                      <span class="metadata-label">Modified Date:</span>
                      <span class="metadata-value">
                        {{ pdfMetadata.info.modDate.formatted || pdfMetadata.info.modDate }}
                      </span>
                      <span v-if="pdfMetadata.info.modDate.timezone" class="metadata-timezone">
                        ({{ pdfMetadata.info.modDate.timezone }})
                      </span>
                    </div>

                    <div v-if="pdfMetadata.info.keywords" class="metadata-item">
                      <span class="metadata-label">Keywords:</span>
                      <span class="metadata-value">{{ pdfMetadata.info.keywords }}</span>
                    </div>
                  </div>

                  <!-- XMP Metadata (forensically valuable fields) -->
                  <div v-if="pdfMetadata.xmp" class="metadata-field-group xmp-metadata">
                    <h4 class="xmp-title">XMP Metadata</h4>

                    <div v-if="pdfMetadata.xmp.documentId" class="metadata-item">
                      <span class="metadata-label">Document ID:</span>
                      <span class="metadata-value text-caption">{{
                        pdfMetadata.xmp.documentId
                      }}</span>
                    </div>

                    <div v-if="pdfMetadata.xmp.instanceId" class="metadata-item">
                      <span class="metadata-label">Instance ID:</span>
                      <span class="metadata-value text-caption">{{
                        pdfMetadata.xmp.instanceId
                      }}</span>
                    </div>

                    <!-- Revision History - Complete Audit Trail -->
                    <div v-if="pdfMetadata.xmp.history" class="metadata-item revision-history">
                      <span class="metadata-label">Revision History:</span>
                      <div class="revision-history-content">
                        <pre class="revision-history-data">{{
                          JSON.stringify(pdfMetadata.xmp.history, null, 2)
                        }}</pre>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- No metadata available for PDF -->
                <div v-else-if="isPdfFile && !metadataLoading" class="metadata-notice">
                  <p>No embedded metadata found in this PDF</p>
                </div>

                <!-- Not a PDF file -->
                <div v-else class="metadata-notice">
                  <p>Metadata viewing has not been implemented for file type:</p>
                  <p>{{ mimeType }}</p>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </div>
      </div>
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
import { formatDateTime } from '@/utils/dateFormatter.js';
import { EvidenceService } from '@/features/organizer/services/evidenceService.js';
import { LogService } from '@/services/logService.js';
import { usePdfMetadata } from '@/features/organizer/composables/usePdfMetadata.js';
import { usePdfViewer } from '@/features/organizer/composables/usePdfViewer.js';
import { usePdfCache } from '@/features/organizer/composables/usePdfCache.js';
import { usePageVisibility } from '@/features/organizer/composables/usePageVisibility.js';
import PdfPageCanvas from '@/features/organizer/components/PdfPageCanvas.vue';
import PdfThumbnailList from '@/features/organizer/components/PdfThumbnailList.vue';

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

// Format file size helper
const formatUploadSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const formattedBytes = bytes.toLocaleString('en-US');
  if (bytes < 1024) return `${bytes} B (${formattedBytes} bytes)`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB (${formattedBytes} bytes)`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB (${formattedBytes} bytes)`;
};

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
    LogService.info('⬅️ Navigation to previous document started', {
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
    LogService.info('➡️ Navigation to next document started', {
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
  LogService.performance('🎨 First page rendered on screen', elapsedMs, {
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
    LogService.debug('Background pre-load promise rejected', { error: err.message });
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
      LogService.warn('Cannot pre-load metadata: missing firm/matter/document ID', { documentId });
      return;
    }

    // Skip if metadata is already cached
    const cached = getCachedMetadata(documentId);
    if (cached) {
      LogService.debug('Metadata already cached, skipping pre-load', { documentId });
      return;
    }

    LogService.debug('Pre-loading metadata for document', { documentId });

    // Fetch evidence document from Firestore
    const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', documentId);
    const evidenceSnap = await getDoc(evidenceRef);

    if (!evidenceSnap.exists()) {
      LogService.warn('Evidence document not found during pre-load', { documentId });
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

    LogService.info('📋 Pre-loaded and cached metadata', { documentId });
  } catch (err) {
    // Non-blocking - pre-load failures should not affect current navigation
    LogService.warn('Failed to pre-load metadata (non-blocking)', {
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
      LogService.warn('Cannot extract PDF metadata: missing firm/matter/document ID', { documentId });
      return;
    }

    // Check if PDF is cached (pre-loaded)
    if (!isDocumentCached(documentId)) {
      LogService.debug('PDF not cached yet, skipping metadata extraction', { documentId });
      return;
    }

    // Get existing cached metadata
    const cachedMetadata = getCachedMetadata(documentId);

    // Skip if PDF metadata is already cached
    if (cachedMetadata?.pdfMetadata) {
      LogService.debug('PDF metadata already cached, skipping extraction', { documentId });
      return;
    }

    // Skip if we don't have the basic metadata yet (need displayName)
    if (!cachedMetadata?.displayName) {
      LogService.debug('Basic metadata not cached yet, skipping PDF metadata extraction', { documentId });
      return;
    }

    LogService.debug('Pre-loading PDF metadata for document', { documentId });

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

    LogService.info('📄 Pre-loaded and cached PDF metadata', { documentId });
  } catch (err) {
    // Non-blocking - pre-load failures should not affect current navigation
    LogService.warn('Failed to pre-load PDF metadata (non-blocking)', {
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

    LogService.info('🚀 Starting background pre-load after first page render', {
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
          LogService.warn('Failed to pre-load metadata for previous doc', { prevId, error: err.message });
        })
      );
    }
    if (nextId) {
      metadataPromises.push(
        fetchAndCacheMetadata(nextId).catch(err => {
          LogService.warn('Failed to pre-load metadata for next doc', { nextId, error: err.message });
        })
      );
    }
    await Promise.allSettled(metadataPromises);

    // Step 3: Extract PDF metadata (PDFs are guaranteed cached now)
    // No setTimeout needed - PDFs are already loaded!
    if (prevId) {
      await extractAndCachePdfMetadata(prevId).catch(err => {
        LogService.warn('Failed to extract PDF metadata for previous doc', { prevId, error: err.message });
      });
    }
    if (nextId) {
      await extractAndCachePdfMetadata(nextId).catch(err => {
        LogService.warn('Failed to extract PDF metadata for next doc', { nextId, error: err.message });
      });
    }

    LogService.info('✅ Background pre-load completed', {
      currentDocId: fileHash.value,
      previousDocId: prevId,
      nextDocId: nextId,
    });
  } catch (err) {
    // Non-blocking - pre-load failures should not affect UX
    LogService.warn('Background pre-load failed (non-blocking)', {
      error: err.message,
    });
  }
};

// Compute earlier copy notification message
const earlierCopyMessage = computed(() => {
  // Only show message if there are multiple variants
  if (sourceMetadataVariants.value.length <= 1) {
    return '';
  }

  // Find the currently selected variant
  const currentVariant = sourceMetadataVariants.value.find(
    (v) => v.metadataHash === selectedMetadataHash.value
  );

  if (!currentVariant) {
    return '';
  }

  // Check if any other variant has an earlier sourceLastModified date
  const hasEarlierCopy = sourceMetadataVariants.value.some(
    (v) =>
      v.metadataHash !== selectedMetadataHash.value &&
      v.sourceLastModified < currentVariant.sourceLastModified
  );

  return hasEarlierCopy ? 'earlier copy found' : 'no earlier copies found';
});

// Compute MIME type (DRY principle - single source of truth)
const mimeType = computed(() => {
  return (
    storageMetadata.value?.contentType ||
    (storageMetadata.value === null ? 'Unknown' : 'Loading...')
  );
});

// Toggle dropdown menu
const toggleDropdown = () => {
  if (updatingMetadata.value || sourceMetadataVariants.value.length === 0) return;
  dropdownOpen.value = !dropdownOpen.value;
};

// Select a variant from dropdown
const selectVariant = (metadataHash) => {
  dropdownOpen.value = false;
  if (metadataHash !== selectedMetadataHash.value) {
    handleMetadataSelection(metadataHash);
  }
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
        LogService.performance('📦 PDF document loaded into memory', elapsedMs, {
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
        LogService.info('📄 PDF metadata cache HIT', { documentId: fileHash.value });
        // Note: pdfMetadata reactive state is managed by usePdfMetadata composable
        // We need to populate it from cache manually
        Object.assign(pdfMetadata, cachedMetadata.pdfMetadata);
      } else {
        // Extract metadata from the already-loaded PDF
        await extractMetadata(fileHash.value, displayName, pdfDocument.value);

        // Cache all metadata now that PDF is loaded and metadata extracted
        cacheMetadata(fileHash.value, {
          evidenceData: evidence.value,
          sourceVariants: sourceMetadataVariants.value,
          storageMetadata: storageMetadata.value,
          displayName: evidence.value.displayName,
          selectedMetadataHash: selectedMetadataHash.value,
          pdfMetadata: { ...pdfMetadata }, // Clone to avoid reactivity issues
        });
        LogService.info('✅ Cached metadata + PDF + PDF metadata', { documentId: fileHash.value });
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
      LogService.info('📋 Metadata cache HIT', { documentId: fileHash.value });

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
      LogService.info('📋 Metadata cache MISS', { documentId: fileHash.value });

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

// Page jump input state
const pageJumpInput = ref(null);

// Jump to specific page number
const jumpToPage = () => {
  const pageNum = parseInt(pageJumpInput.value);
  if (pageNum >= 1 && pageNum <= totalPages.value) {
    handlePageSelected(pageNum);
    pageJumpInput.value = null; // Clear input
  }
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

/* Left: Thumbnail panel */
.thumbnail-panel {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.thumbnail-panel--collapsed {
  width: 40px;
}

.thumbnail-panel--collapsed .thumbnail-card {
  overflow: visible;
  min-height: 60px; /* Ensure button has space */
}

.thumbnail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.thumbnail-toggle-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  transition: all 0.3s ease;
}

.thumbnail-toggle-btn--collapsed {
  /* Center the button in the 40px collapsed panel */
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.thumbnail-content {
  padding: 48px 0 16px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.thumbnail-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.thumbnail-placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
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

/* Right: File metadata panel */
.metadata-panel {
  width: 350px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.document-nav-panel {
  width: 100%;
  flex-shrink: 0;
}

.document-nav-card {
  background-color: #475569; /* Dark slate gray */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
  border-radius: 4px;
}

.document-nav-card .v-btn {
  color: white;
  border-radius: 6px;
}

.document-nav-card .v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.document-nav-card .v-btn:disabled {
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.document-indicator {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0 12px;
  flex-grow: 1;
  text-align: center;
  transition: opacity 0.15s ease-in-out;
}

.page-jump-control {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.page-jump-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  text-align: center;
}

.page-jump-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.15);
}

/* Remove number input spinners */
.page-jump-input::-webkit-inner-spin-button,
.page-jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump-input[type='number'] {
  -moz-appearance: textfield;
}

.page-jump-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.metadata-box {
  width: 100%;
  flex-shrink: 0;
  flex: 1;
  overflow-y: auto;
}

.metadata-box--collapsed {
  overflow-y: hidden;
}

.metadata-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.metadata-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  min-height: 56px;
}

.metadata-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.toggle-btn {
  flex-shrink: 0;
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.metadata-section {
  margin-bottom: 24px;
  transition: opacity 0.15s ease-in-out;
}

.metadata-section:last-child {
  margin-bottom: 0;
}

.metadata-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.metadata-notice {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.metadata-notice p {
  margin: 0;
  padding: 0;
}

.metadata-item-simple {
  margin-bottom: 8px;
}

.date-with-notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.earlier-copy-message {
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
  margin-left: 12px;
}

.dropdown-container {
  position: relative;
}

.source-file-selector {
  width: 100%;
  padding: 0;
  font-size: 0.875rem;
  color: #333;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.source-file-selector.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dropdown-arrow {
  font-size: 0.6rem;
  margin-left: 6px;
  color: #666;
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #333;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #475569;
  color: white;
}

.dropdown-item.selected {
  background-color: #e2e8f0;
  color: #1e293b;
  font-weight: 500;
}

.dropdown-item.selected:hover {
  background-color: #475569;
  color: white;
}

.updating-indicator {
  display: inline-block;
  margin-left: 8px;
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.metadata-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.metadata-value {
  font-size: 0.875rem;
  color: #333;
  word-break: break-all;
}

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

/* PDF Metadata Styling */
.pdf-metadata-container {
  margin-top: 8px;
}

.metadata-field-group {
  margin-bottom: 20px;
}

.metadata-field-group:last-child {
  margin-bottom: 0;
}

.metadata-error {
  font-size: 0.8rem;
  color: #dc3545;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.metadata-error .error-detail {
  font-size: 0.75rem;
  color: #888;
  margin-top: 4px;
}

.metadata-timezone {
  font-size: 0.7rem;
  color: #888;
  margin-left: 6px;
  font-style: italic;
}

.xmp-metadata {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.xmp-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* Revision History Styling */
.revision-history {
  margin-top: 16px;
}

.revision-history-content {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.revision-history-data {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.75rem;
  color: #212529;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
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

/* Individual PDF Page */
.pdf-page {
  width: 100%;
  max-width: 9.2in; /* Match viewport width */
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: white;

  /* Modern CSS lazy rendering - 40% performance boost, zero dependencies */
  content-visibility: auto;
  contain-intrinsic-size: 883.2px 1056px; /* 9.2in × 11in at 96 DPI */
}

/* Responsive layout for tablets and mobile */
@media (max-width: 1150px) {
  .view-document-content {
    flex-direction: column;
  }

  .thumbnail-panel {
    width: 100%;
    max-width: 100%;
    order: 3; /* Move to bottom on mobile */
  }

  .thumbnail-panel--collapsed {
    width: 100%;
  }

  .center-panel {
    width: 100%;
    max-width: 100%;
    min-width: auto;
    order: 1; /* Show first on mobile */
  }

  .metadata-panel {
    width: 100%;
    max-width: 100%;
    order: 2; /* Show second on mobile */
  }

  .viewer-area {
    width: 100%;
    max-width: 100%;
    min-height: 400px;
  }
}
</style>
