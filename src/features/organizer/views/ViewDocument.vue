<template>
  <div class="view-document-container">
    <!-- Header -->
    <div class="view-document-header">
      <v-btn icon variant="text" @click="goBack">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <div class="header-content">
        <h1 v-if="!loading && evidence" class="text-h5">{{ evidence.displayName }}</h1>
        <h1 v-else class="text-h5">Loading...</h1>
      </div>
    </div>

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

      <!-- File metadata sidebar -->
      <div class="metadata-sidebar">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">File Information</v-card-title>
          <v-card-text>
            <div class="metadata-item">
              <span class="metadata-label">Name:</span>
              <span class="metadata-value">{{ evidence.displayName }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Size:</span>
              <span class="metadata-value">{{ formatFileSize(evidence.fileSize) }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Date:</span>
              <span class="metadata-value">{{ formatDate(evidence.createdAt) }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">File Hash:</span>
              <span class="metadata-value text-caption">{{ fileHash }}</span>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase.js';
import { useAuthStore } from '@/core/stores/auth.js';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// State
const fileHash = ref(route.params.fileHash);
const evidence = ref(null);
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
</script>

<style scoped>
.view-document-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
}

.view-document-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-content {
  flex: 1;
}

.view-document-content {
  display: flex;
  flex: 1;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
}

.metadata-sidebar {
  width: 300px;
  flex-shrink: 0;
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
  display: flex;
  flex-direction: column;
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

@media (max-width: 768px) {
  .view-document-content {
    flex-direction: column;
    overflow-y: auto;
  }

  .metadata-sidebar {
    width: 100%;
  }

  .viewer-area {
    min-height: 400px;
  }
}
</style>
