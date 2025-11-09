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
import { watch } from 'vue';

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

// Placeholder function for loading review data
// This will be implemented when review functionality is added
const loadReviewData = async () => {
  // TODO: Implement review data loading when functionality is added
  console.log('[ReviewTab] Loading review data for document:', props.fileHash);
};

// Watch for activeTab changes to load review data when tab opens
watch(() => props.activeTab, async (newTab) => {
  if (newTab === 'review') {
    await loadReviewData();
  }
}, { immediate: true });

// Watch for fileHash changes to reload review data when navigating between documents
// Only reload if the Review tab is currently active
watch(() => props.fileHash, async (newHash, oldHash) => {
  if (newHash !== oldHash && props.activeTab === 'review') {
    await loadReviewData();
  }
});
</script>

<!-- All styles inherited from parent DocumentMetadataPanel.vue -->
