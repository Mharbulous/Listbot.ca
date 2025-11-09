<template>
  <v-container fluid class="main-viewport">
    <!-- Main Upload Area -->
    <UploadDropzone
      v-if="uploadQueue.length === 0"
      ref="dropzoneRef"
      :is-drag-over="isDragOver"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
      @trigger-file-select="triggerFileSelectWrapper"
      @trigger-folder-select="triggerFolderSelectWrapper"
      @file-select="handleFileSelect"
      @folder-select="handleFolderSelect"
    />

    <!-- Folder Options Dialog -->
    <FolderOptionsDialog
      v-bind="folderOptionsProps"
      @update:show="showFolderOptions = $event"
      @update:include-subfolders="includeSubfolders = $event"
      @confirm="confirmFolderOptions"
      @cancel="cancelFolderUpload"
    />

    <!-- Upload Queue/Preview -->
    <FileUploadQueue
      v-if="uploadQueue.length > 0 || isProcessingUIUpdate"
      v-bind="queueProps"
      class="flex-grow-1"
      @remove-file="removeFromQueue"
      @start-upload="onStartUpload"
      @pause-upload="onPauseUpload"
      @resume-upload="onResumeUpload"
      @clear-queue="clearQueue"
    />

    <!-- Single File Upload Notification -->
    <v-snackbar
      v-model="showSingleFileNotification"
      :timeout="3000"
      :color="singleFileNotification.color"
      location="top"
    >
      {{ singleFileNotification.message }}
      <template #actions>
        <v-btn color="white" variant="text" @click="showSingleFileNotification = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Processing Progress Modal -->
    <ProcessingProgressModal
      v-model="processingProgress.isProcessing"
      :progress="processingProgress"
      :can-cancel="true"
      @cancel="handleCancelProcessing"
    />

    <!-- Cloud File Warning Modal -->
    <CloudFileWarningModal
      :is-visible="timeWarning.showCloudFileWarning.value"
      :formatted-elapsed-time="timeWarning.formattedElapsedTime.value"
      :estimated-duration="timeWarning.estimatedDuration.value"
      :overdue-seconds="timeWarning.overdueSeconds.value"
      @clear-all="handleClearAll"
      @continue-waiting="handleContinueWaiting"
      @close="handleCloseWarning"
    />
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import FileUploadQueue from './components/FileUploadQueue.vue';
import UploadDropzone from './components/UploadDropzone.vue';
import FolderOptionsDialog from './components/FolderOptionsDialog.vue';
import ProcessingProgressModal from './components/ProcessingProgressModal.vue';
import CloudFileWarningModal from './components/CloudFileWarningModal.vue';
import { useFileQueue } from './composables/useFileQueue.js';
import { useFileDragDrop } from './composables/useFileDragDrop.js';
import { useQueueDeduplication } from './composables/useQueueDeduplication.js';
import { useFolderOptions } from './composables/useFolderOptions.js';
import { useTimeBasedWarning } from './composables/useTimeBasedWarning.js';
import { useAuthStore } from '../../core/stores/auth.js';
import { useMatterViewStore } from '../../stores/matterView.js';
import { useLazyHashTooltip } from './composables/useLazyHashTooltip.js';
import { useUploadLogger } from './composables/useUploadLogger.js';
import { useFileMetadata } from './composables/useFileMetadata.js';
import { useFileProcessor } from './composables/useFileProcessor.js';
import { useFileUploadHandlers } from './composables/useFileUploadHandlers.js';
import { useUploadOrchestration } from './composables/useUploadOrchestration.js';
import { createFolderOptionsProps, createQueueProps } from './utils/uploadHelpers.js';

// Component configuration
defineOptions({
  name: 'FileUploadView',
});

// Template refs
const dropzoneRef = ref(null);

// Stores
const authStore = useAuthStore();
const matterStore = useMatterViewStore();

// External systems
const { populateExistingHash } = useLazyHashTooltip();
const { logUploadEvent, updateUploadEvent } = useUploadLogger();
const { createMetadataRecord, generateMetadataHash } = useFileMetadata();

// Core composables
const {
  uploadQueue,
  showSingleFileNotification,
  singleFileNotification,
  fileInput,
  folderInput,
  processingProgress,
  isProcessingUIUpdate,
  uiUpdateProgress,
  uploadStatus,
  triggerFileSelect,
  triggerFolderSelect,
  processSingleFile,
  addFilesToQueue,
  initializeQueueInstantly,
  updateUploadQueue,
  removeFromQueue,
  showNotification,
  setPhaseComplete,
  resetUploadStatus,
  updateUploadStatus,
  updateFileStatus,
  updateAllFilesToReady,
} = useFileQueue();

const { isDragOver, handleDragOver, handleDragLeave, handleDrop: baseHandleDrop } = useFileDragDrop();

const queueDeduplication = useQueueDeduplication();

const {
  showFolderOptions,
  includeSubfolders,
  subfolderCount,
  isAnalyzing,
  mainFolderAnalysis,
  allFilesAnalysis,
  totalDirectoryEntryCount,
  analysisTimedOut,
  timeoutError,
  currentProgressMessage,
  skippedFolders,
  mainFolderProgress,
  allFilesProgress,
  mainFolderComplete,
  allFilesComplete,
  isAnalyzingMainFolder,
  isAnalyzingAllFiles,
  processFolderEntry,
  processFolderFiles,
  confirmFolderOptions: baseConfirmFolderOptions,
  cancelFolderUpload,
} = useFolderOptions();

const timeWarning = useTimeBasedWarning();

// File processor
const fileProcessor = useFileProcessor({
  authStore,
  matterStore,
  queueDeduplication,
  timeWarning,
  updateUploadQueue,
  updateAllFilesToReady,
  analysisTimedOut,
  skippedFolders,
  allFilesAnalysis,
  mainFolderAnalysis,
});

// Upload orchestration
const uploadOrchestration = useUploadOrchestration();

// File upload handlers
const fileUploadHandlers = useFileUploadHandlers({
  uploadQueue,
  uploadStatus,
  pauseRequested: uploadOrchestration.pauseRequested,
  isPaused: uploadOrchestration.isPaused,
  updateUploadStatus,
  updateFileStatus,
  showNotification,
  calculateFileHash: fileProcessor.calculateFileHash,
  checkFileExists: fileProcessor.checkFileExists,
  uploadSingleFile: fileProcessor.uploadSingleFile,
  populateExistingHash,
  logUploadEvent,
  updateUploadEvent,
  createMetadata: createMetadataRecord,
  generateMetadataHash,
  getCurrentSessionId: uploadOrchestration.getCurrentSessionId,
  getUploadAbortController: uploadOrchestration.getUploadAbortController,
  setUploadAbortController: uploadOrchestration.setUploadAbortController,
});

// Connect time monitoring to deduplication processing
queueDeduplication.setTimeMonitoringCallback({
  onProcessingStart: () => {},
  onProcessingComplete: () => {
    timeWarning.resetMonitoring();
    queueDeduplication.terminateWorker();
  },
  onProcessingError: () => {
    timeWarning.resetMonitoring();
    queueDeduplication.terminateWorker();
  },
  onProcessingAborted: () => {
    queueDeduplication.terminateWorker();
  },
});

// Computed props for template bindings
const folderOptionsProps = createFolderOptionsProps({
  showFolderOptions,
  subfolderCount,
  includeSubfolders,
  isAnalyzing,
  mainFolderAnalysis,
  allFilesAnalysis,
  mainFolderProgress,
  allFilesProgress,
  mainFolderComplete,
  allFilesComplete,
  isAnalyzingMainFolder,
  isAnalyzingAllFiles,
  analysisTimedOut,
  timeoutError,
  currentProgressMessage,
  totalDirectoryEntryCount,
});

const totalAnalyzedFiles = computed(() => {
  return totalDirectoryEntryCount.value > 0 ? totalDirectoryEntryCount.value : null;
});

const queueProps = createQueueProps(
  {
    uploadQueue,
    isProcessingUIUpdate,
    uiUpdateProgress,
    uploadStatus,
    isStartingUpload: uploadOrchestration.isStartingUpload,
    totalAnalyzedFiles,
  },
  timeWarning
);

// Enhanced clearQueue that uses page refresh for simplicity
const clearQueue = () => {
  window.location.reload();
};

// Event handlers
const updateRefs = () => {
  if (dropzoneRef.value) {
    fileInput.value = dropzoneRef.value.fileInput;
    folderInput.value = dropzoneRef.value.folderInput;
  }
};

const triggerFileSelectWrapper = () => {
  updateRefs();
  triggerFileSelect();
};

const triggerFolderSelectWrapper = () => {
  updateRefs();
  triggerFolderSelect();
};

const handleFileSelect = async (event) => {
  updateRefs();
  const files = Array.from(event.target.files);
  if (files.length === 1) {
    await processSingleFile(files[0], fileProcessor.processFilesWithQueue);
    showNotification('File ready for upload', 'success');
  } else {
    await addFilesToQueue(files, fileProcessor.processFilesWithQueue);
  }
  event.target.value = '';
};

const handleFolderSelect = (event) => {
  updateRefs();
  const files = Array.from(event.target.files);
  processFolderFiles(files, async (files) => {
    await initializeQueueInstantly(files);
    addFilesToQueue(files, fileProcessor.processFilesWithQueue);
  });
  event.target.value = '';
};

const handleDrop = async (event) => {
  await baseHandleDrop(event, {
    processSingleFile: async (file) => {
      await processSingleFile(file, fileProcessor.processFilesWithQueue);
      showNotification('File ready for upload', 'success');
    },
    addFilesToQueue: (files) => addFilesToQueue(files, fileProcessor.processFilesWithQueue),
    processFolderEntry: (folder) =>
      processFolderEntry(folder, async (files) => {
        if (fileProcessor.isAborted()) {
          return;
        }
        await initializeQueueInstantly(files);
        if (fileProcessor.isAborted()) {
          return;
        }
        addFilesToQueue(files, fileProcessor.processFilesWithQueue);
      }),
  });
};

const confirmFolderOptions = () => {
  baseConfirmFolderOptions(async (files) => {
    await initializeQueueInstantly(files);
    addFilesToQueue(files, fileProcessor.processFilesWithQueue);
  });
};

const handleCancelProcessing = () => clearQueue();
const handleClearAll = () => clearQueue();
const handleContinueWaiting = () => timeWarning.snoozeWarning();
const handleCloseWarning = () => timeWarning.dismissWarning();

const onPauseUpload = () => uploadOrchestration.handlePauseUpload(updateUploadStatus);
const onResumeUpload = () =>
  uploadOrchestration.handleResumeUpload(updateUploadStatus, fileUploadHandlers.continueUpload);
const onStartUpload = async () =>
  await uploadOrchestration.handleStartUpload(
    setPhaseComplete,
    resetUploadStatus,
    updateUploadStatus,
    fileUploadHandlers.continueUpload,
    showNotification
  );
</script>

<style scoped>
.main-viewport {
  background-color: #f8fafc;
  padding: 50px !important;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

:global(body) {
  overflow: hidden;
}
</style>
