<template>
  <div
    class="dropzone-spacer"
    :class="{ 'dropzone-active': isDragOver }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent.stop="handleDrop"
  >
    <div class="dropzone-content">
      <v-icon icon="mdi-cloud-upload-outline" size="48" color="grey-lighten-1" class="dropzone-icon" />
      <p class="dropzone-text-primary">Drag and drop files or folders here</p>
      <p class="dropzone-text-secondary">or use the + Add to Queue button in the top left of the header</p>
    </div>

    <!-- Error Dialog for Multiple Items -->
    <v-dialog v-model="showMultiDropError" max-width="500">
      <v-card>
        <v-card-title class="text-h6">Multiple Folders Not Supported</v-card-title>
        <v-card-text class="text-body-1">
          Dragging and dropping multiple folders is not permitted. Please drag and drop one folder at a time. You can drag and drop multiple files at once.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="showMultiDropError = false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { useFileDropHandler } from '../composables/useFileDropHandler';

// Component configuration
defineOptions({
  name: 'UploadTableDropzone',
});

// Emits
const emit = defineEmits(['files-dropped']);

// Use the file drop handler composable
const {
  isDragOver,
  showMultiDropError,
  handleDragOver,
  handleDragLeave,
  handleDrop: handleDropBase,
} = useFileDropHandler();

// Wrap the drop handler to emit files
const handleDrop = (event) => {
  handleDropBase(event, (files) => {
    emit('files-dropped', files);
  });
};
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
