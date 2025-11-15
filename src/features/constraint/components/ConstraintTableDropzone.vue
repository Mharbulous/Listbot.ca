<template>
  <!-- Visual-only dropzone indicator -->
  <!-- Drag-drop functionality is handled by parent UploadTable.vue -->
  <div class="dropzone-spacer">
    <div class="dropzone-content">
      <v-icon icon="mdi-cloud-upload-outline" size="48" color="grey-lighten-1" class="dropzone-icon" />
      <p class="dropzone-text-primary">Drag and drop files or folders here</p>
      <p class="dropzone-text-secondary">or use the + Add to Queue button in the top left of the header</p>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'UploadTableDropzone',
});

// This component is VISUAL ONLY - no drag-drop handlers
// All drag-drop functionality is handled by parent UploadTable.vue
</script>

<style scoped>
.dropzone-spacer {
  flex: 1; /* Fill remaining space */
  min-height: 100px; /* Minimum height to show dropzone */
  width: 100%; /* Ensure full width */
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 1rem; /* Horizontal spacing on left and right */
  border: 3px dashed #cbd5e1;
  border-radius: 8px; /* Rounded corners */
  background: white;
  transition: all 0.3s ease;
  position: relative;
}

.dropzone-spacer:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.dropzone-spacer.dropzone-active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  box-shadow: inset 0 0 24px rgba(59, 130, 246, 0.15);
}

.dropzone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.dropzone-icon {
  margin-bottom: 0.25rem;
  transition: transform 0.3s ease;
}

.dropzone-active .dropzone-icon {
  transform: scale(1.15) translateY(-4px);
}

.dropzone-text-primary {
  font-size: 1rem;
  font-weight: 500;
  color: #334155;
  margin: 0;
  text-align: center;
}

.dropzone-text-secondary {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .dropzone-text-primary {
    font-size: 0.9375rem;
  }

  .dropzone-text-secondary {
    font-size: 0.8125rem;
  }
}

@media (max-width: 480px) {
  .dropzone-spacer {
    min-height: 80px;
  }

  .dropzone-content {
    gap: 0.5rem;
    padding: 1rem;
  }

  .dropzone-icon {
    font-size: 36px !important;
  }

  .dropzone-text-primary {
    font-size: 0.875rem;
  }

  .dropzone-text-secondary {
    font-size: 0.75rem;
  }
}
</style>
