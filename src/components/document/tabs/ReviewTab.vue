<template>
  <!-- Review Tab Content -->
  <div>
    <!-- Review Status Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Review Status</h3>
      <div class="metadata-notice">
        <p>Review functionality coming soon...</p>
      </div>
    </div>

    <!-- Review Notes Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Review Notes</h3>
      <div class="metadata-notice">
        <p>Notes and comments will appear here...</p>
      </div>
    </div>

    <!-- Review History Section -->
    <div class="metadata-section">
      <h3 class="metadata-section-title">Review History</h3>
      <div class="metadata-notice">
        <p>Review timeline will be displayed here...</p>
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
    default: 'review',
  },
  fileHash: {
    type: String,
    required: true,
  },
});

// Track the last loaded document to avoid unnecessary reloads
const lastLoadedFileHash = ref(null);

// Placeholder function for loading review data
// This will be implemented when review functionality is added
const loadReviewData = async () => {
  // TODO: Implement review data loading when functionality is added
  console.log('[ReviewTab] Loading review data for document:', props.fileHash);

  // Track that we've loaded this document successfully
  lastLoadedFileHash.value = props.fileHash;
};

// Watch for activeTab or fileHash changes
// Only load data when:
// 1. The Review tab is currently active
// 2. AND the document has changed since last load (or never loaded)
watch(
  [() => props.activeTab, () => props.fileHash],
  async ([newTab, newFileHash]) => {
    if (newTab === 'review' && newFileHash !== lastLoadedFileHash.value) {
      await loadReviewData();
    }
  },
  { immediate: true } // Load immediately on mount if already on review tab
);
</script>

<!-- All styles inherited from parent DocumentMetadataPanel.vue -->
