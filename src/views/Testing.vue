<template>
  <div class="upload-container">
    <div class="upload-wrapper">
      <!-- Header Section -->
      <div class="upload-header">
        <div class="header-content">
          <div class="header-icon">
            <v-icon icon="mdi-cloud-upload" size="40" color="primary" />
          </div>
          <h1 class="header-title">Upload Files</h1>
          <p class="header-subtitle">
            Securely upload your documents to the current matter
          </p>
        </div>
      </div>

      <!-- Main Dropzone -->
      <div
        class="dropzone-card"
        :class="{ 'dropzone-active': isDragOver, 'dropzone-hover': isHovered }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <!-- Animated background pattern -->
        <div class="dropzone-pattern"></div>

        <div class="dropzone-content">
          <!-- Icon with animation -->
          <div class="icon-container">
            <v-icon
              :icon="
                isDragOver
                  ? 'mdi-download'
                  : isHovered
                    ? 'mdi-cloud-upload'
                    : 'mdi-cloud-upload-outline'
              "
              size="80"
              :color="isDragOver ? 'primary' : isHovered ? 'primary' : 'grey-lighten-1'"
              class="upload-icon"
            />
            <div v-if="isDragOver" class="pulse-ring"></div>
          </div>

          <!-- Main text -->
          <h2 class="dropzone-title" :class="{ active: isDragOver }">
            {{ isDragOver ? 'Drop your files here!' : 'Drag and drop files or folders' }}
          </h2>

          <p class="dropzone-subtitle">
            {{ isDragOver ? 'Release to begin upload' : 'or use the buttons below to browse' }}
          </p>

          <!-- Divider -->
          <div class="divider-container">
            <div class="divider-line"></div>
            <span class="divider-text">OR</span>
            <div class="divider-line"></div>
          </div>

          <!-- Upload Buttons -->
          <div class="button-group">
            <v-btn
              color="primary"
              size="x-large"
              variant="elevated"
              prepend-icon="mdi-file-multiple"
              class="upload-btn"
              @click="triggerFileSelect"
              :disabled="isDragOver"
            >
              Browse Files
            </v-btn>

            <v-btn
              color="secondary"
              size="x-large"
              variant="elevated"
              prepend-icon="mdi-folder-open"
              class="upload-btn"
              @click="triggerFolderSelect"
              :disabled="isDragOver"
            >
              Browse Folder
            </v-btn>
          </div>

          <!-- Supported formats info -->
          <div class="info-section">
            <div class="info-item">
              <v-icon icon="mdi-check-circle" size="18" color="success" />
              <span>All file types supported</span>
            </div>
            <div class="info-item">
              <v-icon icon="mdi-shield-check" size="18" color="success" />
              <span>Secure encrypted upload</span>
            </div>
            <div class="info-item">
              <v-icon icon="mdi-lightning-bolt" size="18" color="success" />
              <span>Automatic duplicate detection</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Tips Section -->
      <div class="tips-section">
        <h3 class="tips-title">
          <v-icon icon="mdi-lightbulb-outline" size="20" color="amber" class="mr-2" />
          Quick Tips
        </h3>
        <div class="tips-grid">
          <div class="tip-card">
            <v-icon icon="mdi-folder-multiple" size="24" color="primary" class="tip-icon" />
            <div class="tip-content">
              <h4>Upload Folders</h4>
              <p>Drag entire folders to preserve your file structure</p>
            </div>
          </div>
          <div class="tip-card">
            <v-icon icon="mdi-file-multiple" size="24" color="primary" class="tip-icon" />
            <div class="tip-content">
              <h4>Multiple Files</h4>
              <p>Select or drag multiple files at once for batch upload</p>
            </div>
          </div>
          <div class="tip-card">
            <v-icon icon="mdi-content-duplicate" size="24" color="primary" class="tip-icon" />
            <div class="tip-content">
              <h4>Smart Deduplication</h4>
              <p>Duplicate files are automatically detected and skipped</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Hidden file inputs -->
    <input
      ref="fileInput"
      type="file"
      multiple
      @change="handleFileSelect"
      style="display: none"
    />

    <input
      ref="folderInput"
      type="file"
      webkitdirectory
      multiple
      @change="handleFolderSelect"
      style="display: none"
    />

    <!-- Dev notification -->
    <v-snackbar v-model="showNotification" :timeout="3000" color="info" location="bottom">
      {{ notificationMessage }}
      <template #actions>
        <v-btn color="white" variant="text" @click="showNotification = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Component configuration
defineOptions({
  name: 'TestingView',
});

// Refs
const fileInput = ref(null);
const folderInput = ref(null);
const isDragOver = ref(false);
const isHovered = ref(false);
const showNotification = ref(false);
const notificationMessage = ref('');

// Drag and drop handlers
const handleDragOver = (event) => {
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  // Only set to false if we're leaving the dropzone entirely
  if (event.target.classList.contains('dropzone-card')) {
    isDragOver.value = false;
  }
};

const handleDrop = (event) => {
  isDragOver.value = false;
  isHovered.value = false;

  const items = Array.from(event.dataTransfer.items);
  const files = Array.from(event.dataTransfer.files);

  notificationMessage.value = `Received ${files.length} file(s) - Upload functionality coming soon!`;
  showNotification.value = true;

  console.log('Dropped files:', files);
  console.log('Dropped items:', items);
};

// File/folder selection handlers
const triggerFileSelect = () => {
  fileInput.value?.click();
};

const triggerFolderSelect = () => {
  folderInput.value?.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  notificationMessage.value = `Selected ${files.length} file(s) - Upload functionality coming soon!`;
  showNotification.value = true;

  console.log('Selected files:', files);
  event.target.value = '';
};

const handleFolderSelect = (event) => {
  const files = Array.from(event.target.files);
  notificationMessage.value = `Selected folder with ${files.length} file(s) - Upload functionality coming soon!`;
  showNotification.value = true;

  console.log('Selected folder files:', files);
  event.target.value = '';
};
</script>

<style scoped>
.upload-container {
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%);
  padding: 2rem;
  overflow-y: auto;
}

.upload-wrapper {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header Section */
.upload-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.header-content {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-icon {
  margin-bottom: 1rem;
}

.header-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.header-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin: 0;
}

/* Main Dropzone */
.dropzone-card {
  position: relative;
  background: white;
  border: 3px dashed #cbd5e1;
  border-radius: 20px;
  padding: 3rem 2rem;
  margin-bottom: 2rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.dropzone-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle, #f1f5f9 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.dropzone-card.dropzone-hover {
  border-color: #3b82f6;
  background: #f8fafc;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
}

.dropzone-card.dropzone-hover .dropzone-pattern {
  opacity: 1;
}

.dropzone-card.dropzone-active {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(59, 130, 246, 0.25);
}

.dropzone-card.dropzone-active .dropzone-pattern {
  opacity: 0.5;
}

.dropzone-content {
  position: relative;
  z-index: 1;
  text-align: center;
}

/* Icon Animation */
.icon-container {
  position: relative;
  display: inline-block;
  margin-bottom: 1.5rem;
}

.upload-icon {
  transition: all 0.3s ease;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
}

.dropzone-active .upload-icon {
  transform: scale(1.1) translateY(-8px);
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 120px;
  border: 3px solid #3b82f6;
  border-radius: 50%;
  animation: pulse 1.5s ease-out infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* Text Styles */
.dropzone-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
  transition: all 0.3s ease;
}

.dropzone-title.active {
  color: #3b82f6;
  transform: scale(1.05);
}

.dropzone-subtitle {
  font-size: 1.125rem;
  color: #64748b;
  margin-bottom: 2rem;
}

/* Divider */
.divider-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, #cbd5e1, transparent);
}

.divider-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 0.5rem;
}

/* Button Group */
.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.upload-btn {
  min-width: 180px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.025em;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.upload-btn:active {
  transform: translateY(0);
}

/* Info Section */
.info-section {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #475569;
}

/* Tips Section */
.tips-section {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.tips-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.tip-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

.tip-card:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.tip-icon {
  flex-shrink: 0;
}

.tip-content h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.tip-content p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

/* Responsive Design */
@media (max-width: 768px) {
  .upload-container {
    padding: 1rem;
  }

  .dropzone-card {
    padding: 2rem 1.5rem;
  }

  .button-group {
    flex-direction: column;
  }

  .upload-btn {
    width: 100%;
  }

  .info-section {
    flex-direction: column;
    gap: 1rem;
  }

  .tips-grid {
    grid-template-columns: 1fr;
  }
}
</style>
