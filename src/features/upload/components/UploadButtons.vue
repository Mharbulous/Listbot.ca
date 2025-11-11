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
          {{ isDragOver ? 'Drop files here!' : 'Drag and drop files or folders here, or use the button below' }}
        </p>
      </div>
    </div>

    <!-- Add to Queue Button with Dropdown -->
    <div class="button-group">
      <v-menu location="bottom">
        <template v-slot:activator="{ props: menuProps }">
          <v-btn
            color="primary"
            size="large"
            variant="elevated"
            prepend-icon="mdi-plus"
            append-icon="mdi-chevron-down"
            class="add-queue-btn"
            aria-label="Add files to upload queue"
            v-bind="menuProps"
          >
            Add to Queue
          </v-btn>
        </template>

        <v-list density="compact">
          <v-list-item
            prepend-icon="mdi-file-multiple"
            title="Queue Files"
            @click="triggerFileSelect"
          />
          <v-list-item
            prepend-icon="mdi-folder-open"
            title="Queue Folder"
            @click="triggerFolderSelect"
          />
          <v-list-item
            prepend-icon="mdi-folder-multiple"
            title="Queue Folder with Subfolders"
            @click="triggerFolderRecursiveSelect"
          />
        </v-list>
      </v-menu>
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

const handleDrop = async (event) => {
  isDragOver.value = false;

  // Get all dropped items
  const items = Array.from(event.dataTransfer.items);
  const allFiles = [];

  // Process each dropped item
  for (const item of items) {
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        await traverseFileTree(entry, allFiles);
      }
    }
  }

  if (allFiles.length > 0) {
    console.log(`[DROP] Collected ${allFiles.length} files`);
    emit('folder-recursive-selected', allFiles);
  }
};

// Recursive function to traverse folder tree
const traverseFileTree = async (entry, filesList) => {
  if (entry.isFile) {
    // It's a file - get the File object
    return new Promise((resolve) => {
      entry.file((file) => {
        filesList.push(file);
        resolve();
      });
    });
  } else if (entry.isDirectory) {
    // It's a directory - read its contents
    const dirReader = entry.createReader();
    return new Promise((resolve) => {
      dirReader.readEntries(async (entries) => {
        for (const childEntry of entries) {
          await traverseFileTree(childEntry, filesList);
        }
        resolve();
      });
    });
  }
};

// Trigger file/folder selection using modern File System Access API when available
const triggerFileSelect = async () => {
  // Check if File System Access API is available
  if ('showOpenFilePicker' in window) {
    try {
      const fileHandles = await window.showOpenFilePicker({
        multiple: true,
      });
      const files = await Promise.all(fileHandles.map((handle) => handle.getFile()));
      if (files.length > 0) {
        emit('files-selected', files);
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Error picking files:', err);
      }
    }
  } else {
    // Fallback to traditional file input
    fileInput.value?.click();
  }
};

const triggerFolderSelect = async () => {
  // Check if File System Access API is available
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const files = [];
      // Get only root-level files (non-recursive)
      for await (const entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          // Add webkitRelativePath for compatibility
          Object.defineProperty(file, 'webkitRelativePath', {
            value: `${dirHandle.name}/${file.name}`,
            writable: false,
          });
          files.push(file);
        }
      }
      if (files.length > 0) {
        console.log(`[FOLDER] Root only: ${files.length} files from ${dirHandle.name}`);
        emit('folder-selected', files);
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Error picking folder:', err);
      }
    }
  } else {
    // Fallback to traditional file input
    folderInput.value?.click();
  }
};

const triggerFolderRecursiveSelect = async () => {
  // Check if File System Access API is available
  if ('showDirectoryPicker' in window) {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const files = [];
      await readDirectoryRecursive(dirHandle, files, dirHandle.name);
      if (files.length > 0) {
        console.log(`[FOLDER+] Recursive: ${files.length} files from ${dirHandle.name}`);
        emit('folder-recursive-selected', files);
      }
    } catch (err) {
      // User cancelled or error occurred
      if (err.name !== 'AbortError') {
        console.error('Error picking folder:', err);
      }
    }
  } else {
    // Fallback to traditional file input
    folderRecursiveInput.value?.click();
  }
};

// Helper function to recursively read directory using File System Access API
const readDirectoryRecursive = async (dirHandle, filesList, basePath = '') => {
  for await (const entry of dirHandle.values()) {
    const path = basePath ? `${basePath}/${entry.name}` : entry.name;
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      // Add webkitRelativePath for compatibility with existing code
      Object.defineProperty(file, 'webkitRelativePath', {
        value: path,
        writable: false,
      });
      filesList.push(file);
    } else if (entry.kind === 'directory') {
      await readDirectoryRecursive(entry, filesList, path);
    }
  }
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
  justify-content: center;
  flex-wrap: wrap;
}

.split-button {
  display: inline-flex;
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.split-button-main {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
  border-right: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 180px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
}

.split-button-dropdown {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  min-width: 48px !important;
  padding: 0 8px !important;
}

/* Responsive Design */
@media (max-width: 768px) {
  .upload-buttons-container {
    padding: 1rem;
  }

  .dropzone {
    padding: 2rem 1.5rem;
  }

  .split-button {
    width: 100%;
  }

  .split-button-main {
    flex: 1;
  }
}
</style>
