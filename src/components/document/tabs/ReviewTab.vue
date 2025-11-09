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
// No props or logic needed - just placeholder content
</script>

<style scoped>
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
</style>
