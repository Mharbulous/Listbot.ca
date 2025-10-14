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
      @start-upload="handleStartUpload"
      @pause-upload="handlePauseUpload"
      @resume-upload="handleResumeUpload"
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
import {
  calculateCalibratedProcessingTime,
  getStoredHardwarePerformanceFactor,
} from './utils/hardwareCalibration.js';
import { storage, db } from '../../services/firebase.js';
import {
  ref as storageRef,
  getDownloadURL,
  getMetadata,
  uploadBytesResumable,
} from 'firebase/storage';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useAuthStore } from '../../core/stores/auth.js';
import { useLazyHashTooltip } from './composables/useLazyHashTooltip.js';
import { useUploadLogger } from './composables/useUploadLogger.js';
import { useFileMetadata } from './composables/useFileMetadata.js';

// Component configuration
defineOptions({
  name: 'FileUploadView',
});

// Template refs
const dropzoneRef = ref(null);

// Auth store
const authStore = useAuthStore();

// Hash tooltip system for cache management
const { populateExistingHash } = useLazyHashTooltip();

// Upload logging system
const { logUploadEvent } = useUploadLogger();

// File metadata system
const { createMetadataRecord, generateMetadataHash } = useFileMetadata();

// Composables
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

const {
  isDragOver,
  handleDragOver,
  handleDragLeave,
  handleDrop: baseHandleDrop,
} = useFileDragDrop();

const queueDeduplication = useQueueDeduplication();
const { processFiles } = queueDeduplication;

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

// Upload state tracking
const isStartingUpload = ref(false);
const isPaused = ref(false);
const pauseRequested = ref(false);
const currentUploadIndex = ref(0);
let uploadAbortController = null;

// Session ID management
const currentSessionId = ref(null);
const getCurrentSessionId = () => {
  if (!currentSessionId.value) {
    currentSessionId.value = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return currentSessionId.value;
};

// Computed props for cleaner template bindings
const folderOptionsProps = computed(() => ({
  show: showFolderOptions.value,
  subfolderCount: subfolderCount.value,
  includeSubfolders: includeSubfolders.value,
  isAnalyzing: isAnalyzing.value,
  mainFolderAnalysis: mainFolderAnalysis.value,
  allFilesAnalysis: allFilesAnalysis.value,
  mainFolderProgress: mainFolderProgress.value,
  allFilesProgress: allFilesProgress.value,
  mainFolderComplete: mainFolderComplete.value,
  allFilesComplete: allFilesComplete.value,
  isAnalyzingMainFolder: isAnalyzingMainFolder.value,
  isAnalyzingAllFiles: isAnalyzingAllFiles.value,
  analysisTimedOut: analysisTimedOut.value,
  timeoutError: timeoutError.value,
  currentProgressMessage: currentProgressMessage.value,
  totalDirectoryEntryCount: totalDirectoryEntryCount.value,
}));

const queueProps = computed(() => ({
  files: uploadQueue.value,
  isProcessingUiUpdate: isProcessingUIUpdate.value,
  uiUpdateProgress: uiUpdateProgress.value,
  uploadStatus: uploadStatus.value,
  showTimeProgress:
    timeWarning.startTime.value !== null &&
    (uploadQueue.value.length === 0 || isProcessingUIUpdate.value),
  timeProgress: {
    elapsedTime: timeWarning.elapsedTime.value,
    progressPercentage: timeWarning.progressPercentage.value,
    isOverdue: timeWarning.isOverdue.value,
    overdueSeconds: timeWarning.overdueSeconds.value,
    timeRemaining: timeWarning.timeRemaining.value,
    formattedElapsedTime: timeWarning.formattedElapsedTime.value,
    formattedTimeRemaining: timeWarning.formattedTimeRemaining.value,
    estimatedDuration: timeWarning.estimatedDuration.value,
  },
  isUploading: uploadStatus.value.isUploading,
  isPaused: uploadStatus.value.isPaused,
  isStartingUpload: isStartingUpload.value,
  totalAnalyzedFiles: totalAnalyzedFiles.value,
}));

// Simple hash calculation function (same as worker)
const calculateFileHash = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    throw new Error(`Failed to generate hash for file ${file.name}: ${error.message}`);
  }
};

// Simple upload helper functions
const generateStoragePath = (fileHash, originalFileName) => {
  const extension = originalFileName.split('.').pop().toLowerCase();
  return `teams/${authStore.currentTeam}/matters/general/uploads/${fileHash}.${extension}`;
};

const checkFileExists = async (fileHash) => {
  try {
    const evidenceRef = collection(db, 'teams', authStore.currentTeam, 'evidence');
    const hashQuery = query(evidenceRef, where('storageRef.fileHash', '==', fileHash), limit(1));
    const querySnapshot = await getDocs(hashQuery);
    return !querySnapshot.empty;
  } catch (error) {
    console.warn('Error checking file existence via Firestore, falling back to false:', error);
    return false;
  }
};

const uploadSingleFile = async (file, fileHash, originalFileName, abortSignal = null) => {
  const storagePath = generateStoragePath(fileHash, originalFileName);
  const storageReference = storageRef(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageReference, file, {
    customMetadata: {
      teamId: authStore.currentTeam,
      userId: authStore.user.uid,
      originalName: originalFileName,
      hash: fileHash,
    },
  });

  return new Promise((resolve, reject) => {
    // Handle abort signal
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        uploadTask.cancel();
        reject(new Error('AbortError'));
      });
    }

    uploadTask.on(
      'state_changed',
      () => {
        if (abortSignal && abortSignal.aborted) {
          uploadTask.cancel();
          reject(new Error('AbortError'));
        }
      },
      (error) => reject(error),
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ success: true, downloadURL });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

// Helper function to check if processing was aborted
const isAborted = () => analysisTimedOut.value;

// Helper function to safely handle logging errors
const safeLog = async (logFn, context) => {
  try {
    await logFn();
  } catch (error) {
    console.error(`Failed to log ${context}:`, error);
  }
};

// Helper function to safely handle metadata operations
const safeMetadata = async (metadataFn, context) => {
  try {
    await metadataFn();
  } catch (error) {
    console.error(`Failed to create metadata ${context}:`, error);
  }
};

// Helper function for creating file metadata
const createFileMetadataRecord = async (queueFile, fileHash) => {
  await createMetadataRecord({
    originalName: queueFile.name,
    lastModified: queueFile.lastModified,
    fileHash: fileHash,
    size: queueFile.size,
    sessionId: getCurrentSessionId(),
    originalPath: queueFile.path,
  });
};

// Helper function for logging upload events
const logFileEvent = async (eventType, queueFile, fileHash) => {
  const metadataHash = await generateMetadataHash(queueFile.name, queueFile.lastModified, fileHash);
  await logUploadEvent({
    eventType,
    fileName: queueFile.name,
    fileHash,
    metadataHash,
  });
};

// Connect time monitoring to deduplication processing
queueDeduplication.setTimeMonitoringCallback({
  onProcessingStart: () => {},
  onProcessingComplete: () => {
    timeWarning.resetMonitoring();
    queueDeduplication.terminateWorker();
  },
  onProcessingError: (error) => {
    timeWarning.resetMonitoring();
    queueDeduplication.terminateWorker();
    console.log('File processing error - time monitoring reset and workers terminated:', error);
  },
  onProcessingAborted: () => {
    queueDeduplication.terminateWorker();
    console.log('File processing aborted - workers terminated');
  },
});

// Enhanced clearQueue that uses page refresh for simplicity
const clearQueue = () => {
  console.log('🔄 Clear All: Refreshing page to reset all state');
  window.location.reload();
};

// Helper to generate hardware-calibrated estimate
const generateHardwareCalibratedEstimate = (files) => {
  let hardwarePerformanceFactor = getStoredHardwarePerformanceFactor();
  if (!hardwarePerformanceFactor || hardwarePerformanceFactor <= 0) {
    hardwarePerformanceFactor = 1.61; // Baseline H-factor
  }

  const sizeMap = new Map();
  files.forEach((file) => {
    const size = file.size || 0;
    sizeMap.set(size, (sizeMap.get(size) || 0) + 1);
  });
  const duplicateCandidates = files.filter((file) => sizeMap.get(file.size || 0) > 1);
  const duplicateCandidatesSizeMB =
    duplicateCandidates.reduce((sum, file) => sum + (file.size || 0), 0) / (1024 * 1024);

  const folderData = {
    totalFiles: files.length,
    duplicateCandidates: duplicateCandidates.length,
    duplicateCandidatesSizeMB: Math.round(duplicateCandidatesSizeMB * 10) / 10,
    avgDirectoryDepth: 2.5,
    totalDirectoryCount: 1,
  };

  const calibratedPrediction = calculateCalibratedProcessingTime(
    folderData,
    hardwarePerformanceFactor
  );
  return calibratedPrediction.totalTimeMs;
};

// Integrate processFiles with updateUploadQueue with safety filtering
const processFilesWithQueue = async (files) => {
  const processId = Math.random().toString(36).substr(2, 9);

  if (isAborted() || !files || files.length === 0) {
    console.log('Skipping file processing - analysis was aborted or no files');
    return;
  }

  // Start time monitoring if not already started
  if (files.length > 0 && !timeWarning.startTime.value) {
    const folderAnalysis = allFilesAnalysis.value || mainFolderAnalysis.value;
    let estimatedTime = 0;

    if (folderAnalysis && folderAnalysis.timeMs && folderAnalysis.timeMs > 0) {
      estimatedTime = folderAnalysis.timeMs;
    } else {
      estimatedTime = generateHardwareCalibratedEstimate(files);
    }

    if (estimatedTime > 0) {
      timeWarning.startMonitoring(estimatedTime);
    } else {
      console.warn('Time monitoring not started: Unable to generate hardware-calibrated estimate');
    }
  }

  if (isAborted()) {
    console.log('Aborting file processing - analysis was cancelled after time monitoring setup');
    return;
  }

  // Safety filter: exclude any files from skipped folders
  let filesToProcess = files;
  if (skippedFolders.value && skippedFolders.value.length > 0) {
    const originalCount = files.length;
    filesToProcess = files.filter((file) => {
      const filePath = file.path || file.webkitRelativePath || file.name;
      const isInSkippedFolder = skippedFolders.value.some((skippedPath) => {
        const normalizedFilePath = filePath.replace(/\\/g, '/').toLowerCase();
        const normalizedSkippedPath = skippedPath.replace(/\\/g, '/').toLowerCase();
        return normalizedFilePath.startsWith(normalizedSkippedPath);
      });

      if (isInSkippedFolder) {
        console.log(`Upload safety filter: excluding ${filePath} from skipped folder`);
        return false;
      }
      return true;
    });

    if (filesToProcess.length !== originalCount) {
      console.log(
        `Upload safety filter: excluded ${originalCount - filesToProcess.length} files from ${skippedFolders.value.length} skipped folders`
      );
    }
  }

  if (isAborted()) {
    console.log(`❌ [${processId}] EXIT EARLY: aborted during file preparation`);
    return;
  }

  try {
    if (isAborted()) {
      console.log(`❌ [${processId}] EXIT EARLY: aborted right before processFiles call`);
      return;
    }

    await processFiles(filesToProcess, updateUploadQueue);

    if (isAborted()) {
      console.log(
        `❌ [${processId}] EXIT ABORT: processing aborted after completion - skipping cleanup`
      );
      return;
    }

    updateAllFilesToReady();
    timeWarning.resetMonitoring();
    queueDeduplication.clearTimeMonitoringCallback();
  } catch (error) {
    console.error('Error during file processing:', error);

    if (isAborted()) {
      console.log(`❌ [${processId}] EXIT ERROR ABORT: processing aborted during error handling`);
      return;
    }

    timeWarning.resetMonitoring();
    queueDeduplication.clearTimeMonitoringCallback();
    throw error;
  }

  // Debug: Log AsyncTracker state at successful exit
  if (window.__asyncTracker) {
    const exitStats = window.__asyncTracker.stats();
    console.log(`📊 [${processId}] AsyncTracker at EXIT:`, exitStats);
  }
};

// Event handlers with composable integration
const handleFileSelect = async (event) => {
  updateRefs();
  const files = Array.from(event.target.files);
  if (files.length === 1) {
    await processSingleFile(files[0], processFilesWithQueue);
    showNotification('File ready for upload', 'success');
  } else {
    await addFilesToQueue(files, processFilesWithQueue);
  }
  event.target.value = '';
};

const handleFolderSelect = (event) => {
  updateRefs();
  const files = Array.from(event.target.files);
  processFolderFiles(files, async (files) => {
    await initializeQueueInstantly(files);
    addFilesToQueue(files, processFilesWithQueue);
  });
  event.target.value = '';
};

const handleDrop = async (event) => {
  await baseHandleDrop(event, {
    processSingleFile: async (file) => {
      await processSingleFile(file, processFilesWithQueue);
      showNotification('File ready for upload', 'success');
    },
    addFilesToQueue: (files) => addFilesToQueue(files, processFilesWithQueue),
    processFolderEntry: (folder) =>
      processFolderEntry(folder, async (files) => {
        if (isAborted()) {
          console.log('Aborting folder processing - analysis was cancelled');
          return;
        }
        await initializeQueueInstantly(files);
        if (isAborted()) {
          console.log('Aborting file queue processing - analysis was cancelled');
          return;
        }
        addFilesToQueue(files, processFilesWithQueue);
      }),
  });
};

const confirmFolderOptions = () => {
  baseConfirmFolderOptions(async (files) => {
    await initializeQueueInstantly(files);
    addFilesToQueue(files, processFilesWithQueue);
  });
};

// Update refs to use composable integration
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

// Handle cancel processing for progress modal
const handleCancelProcessing = () => clearQueue();

// Cloud file warning modal handlers
const handleClearAll = () => clearQueue();
const handleContinueWaiting = () => timeWarning.snoozeWarning();
const handleCloseWarning = () => timeWarning.dismissWarning();

// Pause/Resume upload handlers
const handlePauseUpload = () => {
  console.log('Pause upload requested');
  pauseRequested.value = true;
  updateUploadStatus('requestPause');
};

const handleResumeUpload = () => {
  console.log('Resume upload requested');
  isPaused.value = false;
  updateUploadStatus('resume');
  continueUpload();
};

// Process duplicate file (consolidated logic)
const processDuplicateFile = async (queueFile) => {
  console.log(`Processing duplicate file: ${queueFile.name}`);
  updateUploadStatus('currentFile', queueFile.name, 'processing_duplicate');
  updateFileStatus(queueFile, 'skipped');

  await safeLog(
    async () => await logFileEvent('upload_skipped_metadata_recorded', queueFile, queueFile.hash),
    `duplicate file ${queueFile.name}`
  );

  await safeMetadata(
    async () => await createFileMetadataRecord(queueFile, queueFile.hash),
    `for duplicate ${queueFile.name}`
  );

  updateUploadStatus('skipped');
  console.log(`Duplicate file processed: ${queueFile.name}`);
};

// Process existing file (consolidated logic)
const processExistingFile = async (queueFile, fileHash) => {
  console.log(`File skipped (already exists): ${queueFile.name}`);
  updateUploadStatus('skipped');
  updateFileStatus(queueFile, 'skipped');

  await safeLog(
    async () => await logFileEvent('upload_skipped_metadata_recorded', queueFile, fileHash),
    `existing file ${queueFile.name}`
  );

  await safeMetadata(
    async () => await createFileMetadataRecord(queueFile, fileHash),
    `for existing file ${queueFile.name}`
  );
};

// Process new file upload (consolidated logic)
const processNewFileUpload = async (queueFile, fileHash) => {
  updateUploadStatus('currentFile', queueFile.name, 'uploading');
  console.log(`Uploading file: ${queueFile.name}`);

  await safeLog(
    async () => await logFileEvent('upload_interrupted', queueFile, fileHash),
    `interrupted upload for ${queueFile.name}`
  );

  const uploadStartTime = Date.now();
  await uploadSingleFile(queueFile.file, fileHash, queueFile.name, uploadAbortController.signal);
  const uploadDurationMs = Date.now() - uploadStartTime;

  console.log(`Upload duration for ${queueFile.name}: ${uploadDurationMs}ms`);
  updateUploadStatus('successful');
  updateFileStatus(queueFile, 'completed');
  console.log(`Successfully uploaded: ${queueFile.name}`);

  await safeLog(
    async () => await logFileEvent('upload_success', queueFile, fileHash),
    `upload completion for ${queueFile.name}`
  );

  await safeMetadata(
    async () => await createFileMetadataRecord(queueFile, fileHash),
    `for uploaded file ${queueFile.name}`
  );
};

// Resumable upload loop function
const continueUpload = async () => {
  try {
    console.log('Continuing upload process...');

    const filesToProcess = uploadQueue.value;
    if (filesToProcess.length === 0) {
      showNotification('No files to process', 'info');
      updateUploadStatus('complete');
      return;
    }

    const startIndex = uploadStatus.value.currentUploadIndex || 0;
    console.log(`Continuing from file ${startIndex + 1} of ${filesToProcess.length}`);

    for (let i = startIndex; i < filesToProcess.length; i++) {
      // Check for pause request
      if (pauseRequested.value) {
        console.log(`Pause requested at file ${i + 1}. Pausing...`);
        updateUploadStatus('setUploadIndex', i);
        updateUploadStatus('pause');
        isPaused.value = true;
        pauseRequested.value = false;
        return;
      }

      const queueFile = filesToProcess[i];
      updateUploadStatus('setUploadIndex', i);

      // Handle duplicate files
      if (queueFile.isDuplicate) {
        try {
          await processDuplicateFile(queueFile);
        } catch (error) {
          console.error(`Failed to process duplicate file ${queueFile.name}:`, error);
          updateFileStatus(queueFile, 'failed');
          updateUploadStatus('failed');
        }
        continue;
      }

      try {
        uploadAbortController = new AbortController();

        // Calculate or reuse hash
        updateUploadStatus('currentFile', queueFile.name, 'calculating_hash');
        updateFileStatus(queueFile, 'uploading');
        console.log(`Calculating hash for: ${queueFile.name}`);

        let fileHash;
        if (queueFile.hash) {
          fileHash = queueFile.hash;
          console.log(`Using existing hash for: ${queueFile.name}`);
        } else {
          fileHash = await calculateFileHash(queueFile.file);
          queueFile.hash = fileHash;
          populateExistingHash(queueFile.id || queueFile.name, fileHash);
          console.log(`Calculated new hash for: ${queueFile.name}`);
        }

        if (uploadAbortController.signal.aborted) {
          console.log(`Upload aborted during hash calculation for: ${queueFile.name}`);
          break;
        }

        // Check if file exists
        updateUploadStatus('currentFile', queueFile.name, 'checking_existing');
        const fileExists = await checkFileExists(fileHash);

        if (fileExists) {
          await processExistingFile(queueFile, fileHash);
        } else {
          if (uploadAbortController.signal.aborted) {
            console.log(`Upload aborted before uploading: ${queueFile.name}`);
            break;
          }
          await processNewFileUpload(queueFile, fileHash);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`Upload aborted for: ${queueFile.name}`);
          break;
        }
        console.error(`Failed to upload ${queueFile.name}:`, error);
        updateUploadStatus('failed');
        updateFileStatus(queueFile, 'error');

        // Log failure
        await safeLog(async () => {
          let currentFileHash = queueFile.hash || 'unknown_hash';
          if (currentFileHash === 'unknown_hash') {
            try {
              currentFileHash = await calculateFileHash(queueFile.file);
            } catch (hashError) {
              console.warn(
                `Could not calculate hash for failed upload: ${queueFile.name}`,
                hashError
              );
            }
          }
          await logFileEvent('upload_failed', queueFile, currentFileHash);
        }, `failure for ${queueFile.name}`);
      } finally {
        uploadAbortController = null;
      }
    }

    // Handle completion or pause
    if (!isPaused.value) {
      updateUploadStatus('complete');
      console.log('Upload process completed:', {
        successful: uploadStatus.value.successful,
        failed: uploadStatus.value.failed,
        skipped: uploadStatus.value.skipped,
      });

      const totalProcessed = uploadStatus.value.successful + uploadStatus.value.skipped;
      if (uploadStatus.value.failed === 0) {
        showNotification(`All ${totalProcessed} files processed successfully!`, 'success');
      } else {
        showNotification(
          `${totalProcessed} files processed, ${uploadStatus.value.failed} failed`,
          'warning'
        );
      }

      currentUploadIndex.value = 0;
      isStartingUpload.value = false;
    }
  } catch (error) {
    console.error('Upload process failed:', error);
    showNotification('Upload failed: ' + (error.message || 'Unknown error'), 'error');
    updateUploadStatus('complete');
    isPaused.value = false;
    currentUploadIndex.value = 0;
    isStartingUpload.value = false;
  }
};

// Simple upload control handler
const handleStartUpload = async () => {
  try {
    isStartingUpload.value = true;
    setPhaseComplete();

    if (!isPaused.value) {
      resetUploadStatus();
      currentUploadIndex.value = 0;
      currentSessionId.value = null;
      getCurrentSessionId();
    }

    updateUploadStatus('start');
    console.log('Starting upload process...');
    await continueUpload();
  } catch (error) {
    console.error('Upload process failed:', error);
    showNotification('Upload failed: ' + (error.message || 'Unknown error'), 'error');
    updateUploadStatus('complete');
    isPaused.value = false;
    currentUploadIndex.value = 0;
    isStartingUpload.value = false;
  }
};

// Computed property for total analyzed files count
const totalAnalyzedFiles = computed(() => {
  return totalDirectoryEntryCount.value > 0 ? totalDirectoryEntryCount.value : null;
});
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
