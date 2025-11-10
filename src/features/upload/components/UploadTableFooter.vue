<template>
  <div class="upload-table-footer">
    <div class="footer-content">
      <span class="footer-stat">
        <strong>Total:</strong> {{ stats.total }} files ({{ stats.totalSize }})
      </span>
      <span class="footer-separator">•</span>
      <span class="footer-stat">
        <strong>Ready:</strong> {{ stats.ready }}
      </span>
      <span class="footer-separator">•</span>
      <span class="footer-stat">
        <strong>Duplicates:</strong> {{ stats.duplicates }}
      </span>
      <span class="footer-separator">•</span>
      <span class="footer-stat">
        <strong>Failed:</strong> {{ stats.failed }}
      </span>
      <span class="footer-separator">•</span>
      <span class="footer-stat">
        <strong>Uploaded:</strong> {{ stats.uploaded }}/{{ stats.uploadable }}
      </span>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'UploadTableFooter',
});

// Props
defineProps({
  stats: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        typeof value.total === 'number' &&
        typeof value.totalSize === 'string' &&
        typeof value.ready === 'number' &&
        typeof value.duplicates === 'number' &&
        typeof value.failed === 'number' &&
        typeof value.uploaded === 'number' &&
        typeof value.uploadable === 'number'
      );
    },
  },
});
</script>

<style scoped>
.upload-table-footer {
  background: #f9fafb;
  border-top: 2px solid #e5e7eb;
  padding: 0.75rem 1.5rem;
  position: sticky;
  bottom: 0;
  z-index: 10;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.footer-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: #374151;
}

.footer-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.footer-stat strong {
  font-weight: 600;
  color: #1f2937;
}

.footer-separator {
  color: #9ca3af;
}

/* Responsive Design */
@media (max-width: 768px) {
  .upload-table-footer {
    padding: 0.5rem 1rem;
  }

  .footer-content {
    font-size: 0.75rem;
    gap: 0.5rem;
  }

  .footer-separator {
    display: none;
  }

  .footer-stat {
    flex-basis: calc(50% - 0.25rem);
  }
}
</style>
