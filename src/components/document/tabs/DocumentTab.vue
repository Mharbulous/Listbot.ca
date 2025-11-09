<template>
  <!-- Document Tab Content -->
  <div>
    <!-- Document Information Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Document Information</h3>
      <div class="metadata-notice">
        <p>Document details will appear here...</p>
      </div>
    </div>

    <!-- Document Properties Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Document Properties</h3>
      <div class="metadata-notice">
        <p>Document type, date, and other properties will be displayed here...</p>
      </div>
    </div>

    <!-- Document Categories Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Categories</h3>
      <div class="metadata-notice">
        <p>Document categories and tags will appear here...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

// Props
const props = defineProps({
  activeTab: {
    type: String,
    default: 'doc-metadata',
  },
  fileHash: {
    type: String,
    required: true,
  },
  evidence: {
    type: Object,
    default: () => ({}),
  },
  dateFormat: {
    type: String,
    required: true,
  },
});

// Track the last loaded document to avoid unnecessary reloads
const lastLoadedFileHash = ref(null);

// Placeholder function for loading document metadata
// This will be implemented when document metadata functionality is added
const loadDocumentMetadata = async () => {
  // TODO: Implement document metadata loading when functionality is added
  console.log('[DocumentTab] Loading document metadata for:', props.fileHash);

  // Track that we've loaded this document successfully
  lastLoadedFileHash.value = props.fileHash;
};

// Watch for activeTab or fileHash changes
// Only load data when:
// 1. The Document tab is currently active
// 2. AND the document has changed since last load (or never loaded)
watch(
  [() => props.activeTab, () => props.fileHash],
  async ([newTab, newFileHash]) => {
    if (newTab === 'doc-metadata' && newFileHash !== lastLoadedFileHash.value) {
      await loadDocumentMetadata();
    }
  },
  { immediate: true } // Load immediately on mount if already on doc-metadata tab
);
</script>

<!-- All styles inherited from parent DocumentMetadataPanel.vue -->
