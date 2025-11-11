<template>
  <div
    class="dropzone-spacer"
    :class="{ 'dropzone-active': isDragOver }"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="dropzone-content">
      <v-icon icon="mdi-cloud-upload-outline" size="48" color="grey-lighten-1" class="dropzone-icon" />
      <p class="dropzone-text-primary">Drag and drop files or folders here</p>
      <p class="dropzone-text-secondary">or use the + Add to Queue button in the top left of the header</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Component configuration
defineOptions({
  name: 'UploadTableDropzone',
});

// Emits
const emit = defineEmits(['files-dropped']);

// Drag-drop state
const isDragOver = ref(false);

// Drag-drop handlers
const handleDragOver = () => {
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  // Only reset if leaving the dropzone entirely, not child elements
  const dropzone = event.currentTarget;
  const relatedTarget = event.relatedTarget;
  if (!dropzone.contains(relatedTarget)) {
    isDragOver.value = false;
  }
};

const handleDrop = async (event) => {
  isDragOver.value = false;

  // Get all dropped items
  const items = Array.from(event.dataTransfer.items);
  console.log(`[UploadTableDropzone] Drop event - ${items.length} items in dataTransfer`);

  const allFiles = [];

  // Process each dropped item
  // NOTE: Some browsers/OS leave item.kind empty for items after the first one
  // So we try to get the entry regardless of the kind property
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[UploadTableDropzone] Processing item ${i + 1}/${items.length} - kind: '${item.kind}', type: '${item.type}'`);

    // Try to get entry regardless of kind (handles browsers that leave kind empty)
    const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    if (entry) {
      console.log(`[UploadTableDropzone] Got entry for item ${i + 1}: isFile=${entry.isFile}, isDirectory=${entry.isDirectory}, name=${entry.name}`);
      await traverseFileTree(entry, allFiles);
      console.log(`[UploadTableDropzone] After processing item ${i + 1}: ${allFiles.length} total files collected`);
    } else {
      // Fall back to getAsFile() for individual files when webkitGetAsEntry fails
      console.log(`[UploadTableDropzone] webkitGetAsEntry returned null for item ${i + 1}, falling back to getAsFile()`);
      const file = item.getAsFile();
      if (file) {
        console.log(`[UploadTableDropzone] Got file via getAsFile(): ${file.name}`);
        allFiles.push(file);
        console.log(`[UploadTableDropzone] After processing item ${i + 1}: ${allFiles.length} total files collected`);
      } else {
        console.warn(`[UploadTableDropzone] Both webkitGetAsEntry and getAsFile failed for item ${i + 1}`);
      }
    }
  }

  console.log(`[UploadTableDropzone] Finished processing - ${allFiles.length} files collected`);
  if (allFiles.length > 0) {
    console.log(`[UploadTableDropzone] Emitting files-dropped event with ${allFiles.length} files`);
    emit('files-dropped', allFiles);
  }
};

// Recursive function to traverse folder tree (including subfolders)
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
    // IMPORTANT: readEntries() may not return all entries in one call
    // We must call it repeatedly until it returns an empty array
    const dirReader = entry.createReader();
    const readAllEntries = async () => {
      const entries = await new Promise((resolve) => {
        dirReader.readEntries(resolve);
      });

      if (entries.length > 0) {
        // Process these entries
        for (const childEntry of entries) {
          await traverseFileTree(childEntry, filesList);
        }
        // Read more entries (recursive call until empty)
        await readAllEntries();
      }
    };

    await readAllEntries();
  }
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
