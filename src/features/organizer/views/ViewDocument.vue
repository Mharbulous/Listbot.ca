<template>
  <div class="view-document-container">
    <!-- Loading state -->
    <div v-if="loading" class="content-center">
      <v-progress-circular indeterminate size="64" color="primary" />
      <p class="mt-4 text-body-1">Loading document...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="content-center error-state">
      <v-icon size="64" color="error">mdi-alert-circle</v-icon>
      <h2 class="mt-4 text-h6">Error Loading Document</h2>
      <p class="mt-2 text-body-2">{{ error }}</p>
      <v-btn class="mt-4" color="primary" @click="goBack"> Back to Organizer </v-btn>
    </div>

    <!-- Main content -->
    <div v-else-if="evidence" class="view-document-content">
      <!-- Sidebar containing pagination and metadata panels -->
      <div class="sidebar-container">
        <!-- Pagination control panel -->
        <div class="pagination-panel">
          <v-card class="pagination-card">
            <!-- Left controls -->
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentPage === 1"
              title="First page"
              @click="goToFirstPage"
            >
              <v-icon>mdi-page-first</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentPage === 1"
              title="Previous page"
              @click="goToPreviousPage"
            >
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>

            <!-- Center page indicator -->
            <span class="page-indicator">{{ currentPage }} of {{ totalPages }}</span>

            <!-- Right controls -->
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentPage === totalPages"
              title="Next page"
              @click="goToNextPage"
            >
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              :disabled="currentPage === totalPages"
              title="Last page"
              @click="goToLastPage"
            >
              <v-icon>mdi-page-last</v-icon>
            </v-btn>
          </v-card>
        </div>

        <!-- File metadata box -->
        <div class="metadata-box" :class="{ 'metadata-box--collapsed': !metadataVisible }">
        <v-card variant="outlined" class="metadata-card">
          <!-- Card header with toggle button -->
          <div class="metadata-card-header">
            <h3 class="metadata-card-title">Document Information</h3>
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
              <h3 class="metadata-section-title">Source File</h3>

              <!-- File name dropdown for selecting metadata variants -->
              <div class="metadata-item-simple dropdown-container" @click="toggleDropdown">
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

              <!-- Date modified display -->
              <div class="metadata-item-simple date-with-notification">
                <span class="metadata-value">{{
                  formatDateTime(evidence.createdAt, dateFormat, timeFormat)
                }}</span>
                <span v-if="earlierCopyMessage" class="earlier-copy-message">{{
                  earlierCopyMessage
                }}</span>
              </div>

              <!-- File size -->
              <div class="metadata-item-simple">
                <span class="metadata-value">{{ formatFileSize(evidence.fileSize) }}</span>
              </div>

              <!-- MIME type -->
              <div class="metadata-item-simple">
                <span class="metadata-value">{{ mimeType }}</span>
              </div>
            </div>

            <!-- Cloud Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Cloud</h3>
              <div class="metadata-item">
                <span class="metadata-label">Date Uploaded:</span>
                <span class="metadata-value">{{
                  storageMetadata?.timeCreated
                    ? formatDateTime(new Date(storageMetadata.timeCreated), dateFormat, timeFormat)
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
                      {{ pdfMetadata.info.creationDate.formatted || pdfMetadata.info.creationDate }}
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
                    <span class="metadata-value text-caption">{{ pdfMetadata.xmp.documentId }}</span>
                  </div>

                  <div v-if="pdfMetadata.xmp.instanceId" class="metadata-item">
                    <span class="metadata-label">Instance ID:</span>
                    <span class="metadata-value text-caption">{{ pdfMetadata.xmp.instanceId }}</span>
                  </div>

                  <!-- Revision History - Complete Audit Trail -->
                  <div v-if="pdfMetadata.xmp.history" class="metadata-item revision-history">
                    <span class="metadata-label">Revision History:</span>
                    <div class="revision-history-content">
                      <pre class="revision-history-data">{{ JSON.stringify(pdfMetadata.xmp.history, null, 2) }}</pre>
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

      <!-- PDF Viewer Placeholder -->
      <div class="viewer-area">
        <v-card variant="outlined" class="viewer-placeholder">
          <div class="placeholder-content">
            <v-icon size="120" color="grey-lighten-1">mdi-file-document-outline</v-icon>
            <h2 class="mt-6 text-h5 text-grey-darken-1">PDF Viewer Coming Soon</h2>
            <p class="mt-2 text-body-2 text-grey">This is where the document will be displayed</p>
            <p class="mt-1 text-caption text-grey">
              File: <strong>{{ evidence.displayName }}</strong>
            </p>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, getMetadata } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { useAuthStore } from '@/core/stores/auth.js';
import { useDocumentViewStore } from '@/stores/documentView.js';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';
import { storeToRefs } from 'pinia';
import { formatDateTime } from '@/utils/dateFormatter.js';
import { EvidenceService } from '@/features/organizer/services/evidenceService.js';
import { usePdfMetadata } from '@/features/organizer/composables/usePdfMetadata.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const documentViewStore = useDocumentViewStore();
const preferencesStore = useUserPreferencesStore();
const { dateFormat, timeFormat, metadataBoxVisible } = storeToRefs(preferencesStore);

// PDF Metadata composable
const { metadataLoading, metadataError, pdfMetadata, hasMetadata, extractMetadata } = usePdfMetadata();

// State
const fileHash = ref(route.params.fileHash);
const evidence = ref(null);
const storageMetadata = ref(null);
const loading = ref(true);
const error = ref(null);
const sourceMetadataVariants = ref([]);
const selectedMetadataHash = ref(null);
const updatingMetadata = ref(false);
const dropdownOpen = ref(false);

// Metadata visibility state (bound to user preferences)
const metadataVisible = metadataBoxVisible;

// Pagination state
const currentPage = ref(1);
const totalPages = ref(1);

// Format file size helper
const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Format date helper
const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  try {
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return 'Unknown';
  }
};

// Navigate back to organizer
const goBack = () => {
  router.push('/organizer');
};

// Toggle metadata visibility
const toggleMetadataVisibility = async () => {
  await preferencesStore.updateMetadataBoxVisible(!metadataVisible.value);
};

// Pagination navigation methods
const goToFirstPage = () => {
  currentPage.value = 1;
};

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToLastPage = () => {
  currentPage.value = totalPages.value;
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

  // Check if any other variant has an earlier lastModified date
  const hasEarlierCopy = sourceMetadataVariants.value.some(
    (v) => v.metadataHash !== selectedMetadataHash.value && v.lastModified < currentVariant.lastModified
  );

  return hasEarlierCopy ? 'earlier copy found' : 'no earlier copies found';
});

// Compute MIME type (DRY principle - single source of truth)
const mimeType = computed(() => {
  return storageMetadata.value?.contentType ||
    (storageMetadata.value === null ? 'Unknown' : 'Loading...');
});

// Check if file is PDF
const isPdfFile = computed(() => {
  return mimeType.value?.toLowerCase().includes('pdf') || evidence.value?.displayName?.toLowerCase().endsWith('.pdf');
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

    const teamId = authStore.currentTeam;
    if (!teamId || !fileHash.value) {
      throw new Error('Missing team ID or file hash');
    }

    // Find the selected variant
    const selectedVariant = sourceMetadataVariants.value.find(
      (v) => v.metadataHash === newMetadataHash
    );

    if (!selectedVariant) {
      throw new Error('Selected metadata variant not found');
    }

    // Update Firestore evidence document with new displayCopy
    const evidenceRef = doc(db, 'teams', teamId, 'matters', 'general', 'evidence', fileHash.value);
    await updateDoc(evidenceRef, {
      displayCopy: newMetadataHash,
    });

    // Update local state with new display information
    evidence.value = {
      ...evidence.value,
      displayCopy: newMetadataHash,
      displayName: selectedVariant.sourceFileName || 'Unknown File',
      createdAt: selectedVariant.lastModified,
    };

    // Update selected hash
    selectedMetadataHash.value = newMetadataHash;

    // Update document view store for breadcrumb
    documentViewStore.setDocumentName(selectedVariant.sourceFileName || 'Unknown File');

    console.log(
      `[ViewDocument] Updated displayCopy to: ${selectedVariant.sourceFileName} (${newMetadataHash.substring(0, 8)}...)`
    );
  } catch (err) {
    console.error('[ViewDocument] Failed to update metadata selection:', err);
    // Revert selection on error
    selectedMetadataHash.value = evidence.value.displayCopy;
  } finally {
    updatingMetadata.value = false;
  }
};

// Fetch Firebase Storage metadata
const fetchStorageMetadata = async (teamId, displayName) => {
  try {
    // Get file extension from displayName
    const extension = displayName.split('.').pop() || 'pdf';

    // Build storage path (same format as used in fileProcessingService)
    const storagePath = `teams/${teamId}/matters/general/uploads/${fileHash.value}.${extension.toLowerCase()}`;
    const fileRef = storageRef(storage, storagePath);

    // Get metadata from Firebase Storage
    const metadata = await getMetadata(fileRef);
    storageMetadata.value = metadata;

    // Extract PDF embedded metadata if this is a PDF file
    if (displayName?.toLowerCase().endsWith('.pdf')) {
      await extractMetadata(teamId, fileHash.value, displayName);
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
    loading.value = true;
    error.value = null;

    const teamId = authStore.currentTeam;
    if (!teamId) {
      throw new Error('No team ID found');
    }

    if (!fileHash.value) {
      throw new Error('No file hash provided');
    }

    // Fetch single evidence document from Firestore
    // Path: /teams/{teamId}/matters/general/evidence/{fileHash}
    const evidenceRef = doc(db, 'teams', teamId, 'matters', 'general', 'evidence', fileHash.value);
    const evidenceSnap = await getDoc(evidenceRef);

    if (!evidenceSnap.exists()) {
      throw new Error('Document not found');
    }

    const evidenceData = evidenceSnap.data();

    // Fetch ALL sourceMetadata variants for this file
    const evidenceService = new EvidenceService(teamId);
    const variants = await evidenceService.getAllSourceMetadata(fileHash.value);
    sourceMetadataVariants.value = variants;

    // Get currently selected metadata (from displayCopy field)
    const currentMetadataHash = evidenceData.displayCopy;
    selectedMetadataHash.value = currentMetadataHash;

    // Find the currently selected variant
    const currentVariant = variants.find((v) => v.metadataHash === currentMetadataHash);

    let displayName = 'Unknown File';
    let createdAt = null;

    if (currentVariant) {
      displayName = currentVariant.sourceFileName || 'Unknown File';
      createdAt = currentVariant.lastModified;
    } else if (variants.length > 0) {
      // Fallback to first variant if displayCopy doesn't match any
      displayName = variants[0].sourceFileName || 'Unknown File';
      createdAt = variants[0].lastModified;
      selectedMetadataHash.value = variants[0].metadataHash;
    }

    // Combine evidence and display metadata
    evidence.value = {
      id: evidenceSnap.id,
      ...evidenceData,
      displayName,
      createdAt,
    };

    // Update document view store for breadcrumb display
    documentViewStore.setDocumentName(displayName);

    // Fetch Firebase Storage metadata
    await fetchStorageMetadata(teamId, displayName);
  } catch (err) {
    console.error('Failed to load evidence:', err);
    error.value = err.message || 'Failed to load document';
  } finally {
    loading.value = false;
  }
};

// Close dropdown when clicking outside
const closeDropdown = (event) => {
  const dropdown = event.target.closest('.dropdown-container');
  if (!dropdown) {
    dropdownOpen.value = false;
  }
};

// Initialize on mount
onMounted(() => {
  loadEvidence();
  // Add click listener to close dropdown when clicking outside
  document.addEventListener('click', closeDropdown);
});

// Clean up store when component unmounts
onUnmounted(() => {
  documentViewStore.clearDocumentName();
});

// Clean up event listener
onBeforeUnmount(() => {
  document.removeEventListener('click', closeDropdown);
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
  overflow: hidden;
}

.sidebar-container {
  width: 500px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.pagination-panel {
  width: 100%;
  flex-shrink: 0;
}

.pagination-card {
  background-color: #475569; /* Dark slate gray */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
  border-radius: 4px;
}

.pagination-card .v-btn {
  color: white;
  border-radius: 6px;
}

.pagination-card .v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.pagination-card .v-btn:disabled {
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.page-indicator {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0 12px;
  flex-grow: 1;
  text-align: center;
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
  transition: background-color 0.15s ease, color 0.15s ease;
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
  max-width: 9.2in; /* Slightly larger than US Letter paper width for better visibility */
  display: flex;
  flex-direction: column;
  min-height: 11in; /* US Letter paper height */
  overflow-y: auto;
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

@media (max-width: 1150px) {
  .view-document-content {
    flex-direction: column;
  }

  .sidebar-container {
    width: 100%;
    max-width: 100%;
  }

  .viewer-area {
    width: 100%;
    max-width: 100%;
    min-height: 400px;
  }
}
</style>
