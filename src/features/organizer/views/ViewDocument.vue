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
      <!-- File metadata box -->
      <div class="metadata-box">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">Metadata</v-card-title>
          <v-card-text>
            <!-- File Attributes Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">File Attributes</h3>
              <div class="metadata-item">
                <span class="metadata-label">Name:</span>
                <span class="metadata-value">{{ evidence.displayName }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Date Modified (Source File):</span>
                <span class="metadata-value">{{
                  formatDateTime(evidence.createdAt, dateFormat, timeFormat)
                }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Size:</span>
                <span class="metadata-value">{{ formatFileSize(evidence.fileSize) }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">MIME Type:</span>
                <span class="metadata-value">{{
                  storageMetadata?.contentType || (storageMetadata === null ? 'Unknown' : 'Loading...')
                }}</span>
              </div>
            </div>

            <!-- Storage Properties Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Storage Properties</h3>
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
          </v-card-text>
        </v-card>
      </div>

      <!-- PDF Viewer Placeholder -->
      <div class="viewer-area">
        <v-card variant="outlined" class="viewer-placeholder">
          <div class="placeholder-content">
            <v-icon size="120" color="grey-lighten-1">mdi-file-document-outline</v-icon>
            <h2 class="mt-6 text-h5 text-grey-darken-1">PDF Viewer Coming Soon</h2>
            <p class="mt-2 text-body-2 text-grey">
              This is where the document will be displayed
            </p>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, getMetadata } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { useAuthStore } from '@/core/stores/auth.js';
import { useDocumentViewStore } from '@/stores/documentView.js';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';
import { storeToRefs } from 'pinia';
import { formatDateTime } from '@/utils/dateFormatter.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const documentViewStore = useDocumentViewStore();
const preferencesStore = useUserPreferencesStore();
const { dateFormat, timeFormat } = storeToRefs(preferencesStore);

// State
const fileHash = ref(route.params.fileHash);
const evidence = ref(null);
const storageMetadata = ref(null);
const loading = ref(true);
const error = ref(null);

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

    // Fetch display metadata from originalMetadata subcollection
    // Path: /teams/{teamId}/matters/general/evidence/{fileHash}/originalMetadata/{metadataHash}
    const metadataHash = evidenceData.displayCopy;
    const metadataRef = doc(
      db,
      'teams',
      teamId,
      'matters',
      'general',
      'evidence',
      fileHash.value,
      'originalMetadata',
      metadataHash
    );
    const metadataSnap = await getDoc(metadataRef);

    let displayName = 'Unknown File';
    let createdAt = null;

    if (metadataSnap.exists()) {
      const metadataData = metadataSnap.data();
      displayName = metadataData.originalName || 'Unknown File';
      createdAt = metadataData.lastModified;
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

// Initialize on mount
onMounted(() => {
  loadEvidence();
});

// Clean up store when component unmounts
onUnmounted(() => {
  documentViewStore.clearDocumentName();
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

.metadata-box {
  width: 500px;
  flex-shrink: 0;
  overflow-y: auto;
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

@media (max-width: 1150px) {
  .view-document-content {
    flex-direction: column;
  }

  .metadata-box {
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
