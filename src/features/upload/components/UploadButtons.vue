<template>
  <div class="upload-buttons-container">
    <!-- Drag and Drop Zone -->
    <div
      class="dropzone"
      :class="{ 'dropzone-active': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <div class="dropzone-content">
        <v-icon
          :icon="isDragOver ? 'mdi-download' : 'mdi-cloud-upload-outline'"
          size="64"
          :color="isDragOver ? 'primary' : 'grey-lighten-1'"
          class="dropzone-icon"
        />
        <p class="dropzone-text">
          {{ isDragOver ? 'Drop files here!' : 'Drag and drop files or folders here, or:' }}
        </p>
      </div>
    </div>

    <!-- Three Upload Buttons -->
    <div class="button-group">
      <v-btn
        color="primary"
        size="large"
        variant="elevated"
        prepend-icon="mdi-file-multiple"
        class="upload-btn"
        @click="triggerFileSelect"
      >
        Upload Files
      </v-btn>

      <v-btn
        color="secondary"
        size="large"
        variant="elevated"
        prepend-icon="mdi-folder-open"
        class="upload-btn"
        @click="triggerFolderSelect"
      >
        Upload Folder
      </v-btn>

      <v-btn
        color="info"
        size="large"
        variant="elevated"
        prepend-icon="mdi-folder-multiple"
        class="upload-btn"
        @click="triggerFolderRecursiveSelect"
      >
        Upload Folder + Subfolders
      </v-btn>
    </div>

    <!-- Hidden file inputs -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept="*/*"
      style="display: none"
      @change="handleFileSelect"
    />

    <input
      ref="folderInput"
      type="file"
      webkitdirectory
      multiple
      style="display: none"
      @change="handleFolderSelect"
    />

    <input
      ref="folderRecursiveInput"
      type="file"
      webkitdirectory
      multiple
      style="display: none"
      @change="handleFolderRecursiveSelect"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Component configuration
defineOptions({
  name: 'UploadButtons',
});

// Emits
const emit = defineEmits(['files-selected', 'folder-selected', 'folder-recursive-selected']);

// Refs
const fileInput = ref(null);
const folderInput = ref(null);
const folderRecursiveInput = ref(null);
const isDragOver = ref(false);

// Drag and drop handlers
const handleDragOver = () => {
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  // Only set to false if we're leaving the dropzone entirely
  if (event.target.classList.contains('dropzone')) {
    isDragOver.value = false;
  }
};

const handleDrop = (event) => {
  isDragOver.value = false;

  const files = Array.from(event.dataTransfer.files);
  if (files.length > 0) {
    emit('files-selected', files);
  }
};

// Trigger file/folder selection
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const triggerFolderSelect = () => {
  folderInput.value?.click();
};

const triggerFolderRecursiveSelect = () => {
  folderRecursiveInput.value?.click();
};

// File selection handlers
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length > 0) {
    emit('files-selected', files);
  }
  // Reset input
  event.target.value = '';
};

const handleFolderSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  if (allFiles.length === 0) return;

  // Filter for root-only files
  const rootPath = allFiles[0].webkitRelativePath.split('/')[0];
  const rootFiles = allFiles.filter((file) => {
    const parts = file.webkitRelativePath.split('/');
    return parts.length === 2 && parts[0] === rootPath;
  });

  console.log(`[FOLDER] Root only: ${rootFiles.length} files from ${rootPath}`);
  emit('folder-selected', rootFiles);

  // Reset input
  event.target.value = '';
};

const handleFolderRecursiveSelect = (event) => {
  const allFiles = Array.from(event.target.files);
  if (allFiles.length === 0) return;

  const folderName = allFiles[0].webkitRelativePath.split('/')[0];
  console.log(`[FOLDER+] Recursive: ${allFiles.length} files from ${folderName}`);
  emit('folder-recursive-selected', allFiles);

  // Reset input
  event.target.value = '';
};
</script>

<style scoped>
.upload-buttons-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.dropzone {
  border: 3px dashed #cbd5e1;
  border-radius: 12px;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dropzone:hover {
  border-color: #3b82f6;
  background: #f8fafc;
}

.dropzone.dropzone-active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.25);
}

.dropzone-content {
  text-align: center;
}

.dropzone-icon {
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.dropzone-active .dropzone-icon {
  transform: scale(1.1) translateY(-8px);
}

.dropzone-text {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.upload-btn {
  min-width: 220px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
}

/* Responsive Design */
@media (max-width: 768px) {
  .upload-buttons-container {
    padding: 1rem;
  }

  .dropzone {
    padding: 2rem 1.5rem;
  }

  .button-group {
    flex-direction: column;
  }

  .upload-btn {
    width: 100%;
  }
}
</style>
