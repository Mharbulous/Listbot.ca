<template>
  <DemoContainer
    title="Second Upload Interface"
    subtitle="Alternative Upload Interface Design"
    description="This demonstration showcases an alternative upload interface design for testing different UX patterns and workflows. Use this demo to experiment with various upload interface components and interactions."
    icon="mdi-upload-multiple"
    :tags="['Upload', 'UI Design', 'UX Testing', 'Interface', 'Vue 3']"
    :show-performance-notes="false"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Upload Interface Card -->
      <v-card>
        <v-card-title>Upload Interface Components</v-card-title>
        <v-card-text>
          <v-alert color="info" variant="tonal" class="mb-4">
            This is a demonstration interface for testing alternative upload UI patterns.
            Components and interactions can be modified to test different approaches.
          </v-alert>

          <!-- File Selection Section -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">File Selection</v-card-title>
            <v-card-text>
              <div class="d-flex flex-column align-center justify-center pa-6 border-dashed">
                <v-icon icon="mdi-cloud-upload" size="64" color="primary" class="mb-4" />
                <p class="text-h6 mb-2">Drop files here or click to browse</p>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Supports PDF, DOC, DOCX, JPG, PNG, and more
                </p>
                <v-btn color="primary" prepend-icon="mdi-folder-open" @click="selectFiles">
                  Browse Files
                </v-btn>
              </div>

              <!-- File input (hidden) -->
              <input
                ref="fileInput"
                type="file"
                multiple
                style="display: none"
                @change="handleFileSelection"
              />
            </v-card-text>
          </v-card>

          <!-- Selected Files Display -->
          <v-card v-if="selectedFiles.length > 0" variant="outlined" class="mb-4">
            <v-card-title class="text-h6 d-flex align-center">
              Selected Files ({{ selectedFiles.length }})
              <v-spacer />
              <v-btn
                color="error"
                variant="text"
                size="small"
                prepend-icon="mdi-delete"
                @click="clearFiles"
              >
                Clear All
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-list lines="two" density="comfortable">
                <v-list-item
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  :prepend-icon="getFileIcon(file.type)"
                >
                  <v-list-item-title>{{ file.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatFileSize(file.size) }} • {{ file.type || 'Unknown type' }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn
                      icon="mdi-close"
                      size="small"
                      variant="text"
                      @click="removeFile(index)"
                    />
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Upload Options -->
          <v-card variant="outlined" class="mb-4">
            <v-card-title class="text-h6">Upload Options</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="uploadOptions.destination"
                    :items="destinationOptions"
                    label="Destination Folder"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="uploadOptions.processMode"
                    :items="processModeOptions"
                    label="Processing Mode"
                    variant="outlined"
                    density="comfortable"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12">
                  <v-checkbox
                    v-model="uploadOptions.deduplication"
                    label="Enable automatic deduplication"
                    density="comfortable"
                  />
                  <v-checkbox
                    v-model="uploadOptions.autoProcess"
                    label="Auto-process files after upload"
                    density="comfortable"
                  />
                  <v-checkbox
                    v-model="uploadOptions.notifications"
                    label="Show notifications on completion"
                    density="comfortable"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Upload Progress -->
          <v-card v-if="uploadInProgress" variant="outlined" class="mb-4">
            <v-card-title class="text-h6">Upload Progress</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="d-flex justify-space-between mb-2">
                  <span>Uploading {{ currentFileIndex + 1 }} of {{ selectedFiles.length }}</span>
                  <span>{{ uploadProgress }}%</span>
                </div>
                <v-progress-linear
                  :model-value="uploadProgress"
                  color="primary"
                  height="8"
                  rounded
                />
              </div>

              <v-list v-if="selectedFiles.length > 0" density="compact">
                <v-list-item
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  :class="{ 'text-medium-emphasis': index > currentFileIndex }"
                >
                  <template #prepend>
                    <v-icon
                      v-if="index < currentFileIndex"
                      icon="mdi-check-circle"
                      color="success"
                    />
                    <v-progress-circular
                      v-else-if="index === currentFileIndex"
                      indeterminate
                      size="20"
                      width="2"
                      color="primary"
                    />
                    <v-icon v-else icon="mdi-clock-outline" color="grey" />
                  </template>

                  <v-list-item-title>{{ file.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Action Buttons -->
          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-upload"
              :disabled="selectedFiles.length === 0 || uploadInProgress"
              @click="startUpload"
            >
              Upload {{ selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Files' }}
            </v-btn>

            <v-btn
              v-if="uploadInProgress"
              color="error"
              size="large"
              prepend-icon="mdi-stop"
              @click="cancelUpload"
            >
              Cancel Upload
            </v-btn>

            <v-btn
              color="secondary"
              size="large"
              variant="outlined"
              @click="resetDemo"
            >
              Reset Demo
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Demo Stats -->
      <v-card class="mt-4">
        <v-card-title class="text-h6">Demo Statistics</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="primary">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ selectedFiles.length }}</div>
                  <div class="text-caption">Files Selected</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="success">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ totalSize }}</div>
                  <div class="text-caption">Total Size</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="info">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ uploadedCount }}</div>
                  <div class="text-caption">Uploaded</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="6" md="3">
              <v-card variant="tonal" color="warning">
                <v-card-text class="text-center">
                  <div class="text-h4">{{ uploadProgress }}%</div>
                  <div class="text-caption">Progress</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>
  </DemoContainer>
</template>

<script setup>
import { ref, computed } from 'vue';
import DemoContainer from '../components/DemoContainer.vue';

// File input reference
const fileInput = ref(null);

// Selected files
const selectedFiles = ref([]);

// Upload options
const uploadOptions = ref({
  destination: 'root',
  processMode: 'standard',
  deduplication: true,
  autoProcess: true,
  notifications: true,
});

const destinationOptions = [
  { title: 'Root Folder', value: 'root' },
  { title: 'Documents', value: 'documents' },
  { title: 'Images', value: 'images' },
  { title: 'Archives', value: 'archives' },
];

const processModeOptions = [
  { title: 'Standard Processing', value: 'standard' },
  { title: 'Fast Upload (No Processing)', value: 'fast' },
  { title: 'Deep Analysis', value: 'deep' },
];

// Upload state
const uploadInProgress = ref(false);
const uploadProgress = ref(0);
const currentFileIndex = ref(0);
const uploadedCount = ref(0);

// Computed properties
const totalSize = computed(() => {
  if (selectedFiles.value.length === 0) return '0 B';
  const bytes = selectedFiles.value.reduce((sum, file) => sum + file.size, 0);
  return formatFileSize(bytes);
});

// Methods
const selectFiles = () => {
  fileInput.value?.click();
};

const handleFileSelection = (event) => {
  const files = Array.from(event.target.files || []);
  selectedFiles.value.push(...files);
  console.log(`Selected ${files.length} file(s):`, files);
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const clearFiles = () => {
  selectedFiles.value = [];
  uploadedCount.value = 0;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const getFileIcon = (type) => {
  if (!type) return 'mdi-file';
  if (type.startsWith('image/')) return 'mdi-file-image';
  if (type.startsWith('video/')) return 'mdi-file-video';
  if (type.startsWith('audio/')) return 'mdi-file-music';
  if (type === 'application/pdf') return 'mdi-file-pdf-box';
  if (type.includes('word')) return 'mdi-file-word';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'mdi-file-excel';
  if (type.includes('presentation') || type.includes('powerpoint')) return 'mdi-file-powerpoint';
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'mdi-folder-zip';
  return 'mdi-file-document';
};

const startUpload = () => {
  if (selectedFiles.value.length === 0) return;

  console.log('Starting upload with options:', uploadOptions.value);
  uploadInProgress.value = true;
  uploadProgress.value = 0;
  currentFileIndex.value = 0;
  uploadedCount.value = 0;

  // Simulate upload progress
  simulateUpload();
};

const simulateUpload = () => {
  const interval = setInterval(() => {
    uploadProgress.value += 5;

    // Update current file index based on progress
    const filesPercentage = 100 / selectedFiles.value.length;
    currentFileIndex.value = Math.floor(uploadProgress.value / filesPercentage);

    if (uploadProgress.value >= 100) {
      clearInterval(interval);
      uploadInProgress.value = false;
      uploadProgress.value = 100;
      currentFileIndex.value = selectedFiles.value.length - 1;
      uploadedCount.value = selectedFiles.value.length;
      console.log('Upload completed successfully!');

      if (uploadOptions.value.notifications) {
        console.log('📢 Notification: Upload completed successfully!');
      }
    }
  }, 200);
};

const cancelUpload = () => {
  uploadInProgress.value = false;
  uploadProgress.value = 0;
  currentFileIndex.value = 0;
  console.log('Upload cancelled by user');
};

const resetDemo = () => {
  clearFiles();
  uploadInProgress.value = false;
  uploadProgress.value = 0;
  currentFileIndex.value = 0;
  uploadedCount.value = 0;
  uploadOptions.value = {
    destination: 'root',
    processMode: 'standard',
    deduplication: true,
    autoProcess: true,
    notifications: true,
  };
  console.log('Demo reset');
};
</script>

<style scoped>
.border-dashed {
  border: 2px dashed rgb(var(--v-theme-primary));
  border-radius: 8px;
  background-color: rgb(var(--v-theme-surface-variant));
  transition: all 0.3s ease;
}

.border-dashed:hover {
  background-color: rgb(var(--v-theme-surface-bright));
  cursor: pointer;
}
</style>
