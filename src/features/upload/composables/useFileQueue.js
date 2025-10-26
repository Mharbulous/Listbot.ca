import { ref, nextTick } from 'vue';
import { logProcessingTime } from '../../upload/utils/processingTimer.js';
import { useFileQueueCore } from './useFileQueueCore';

/**
 * File Upload Queue Management Composable
 *
 * TERMINOLOGY - Three-Tier File Lifecycle:
 * ==========================================
 * This composable manages SOURCE FILES during the upload process.
 *
 * 1. DOCUMENT - Original real-world artifact (not handled by this composable)
 *    - Physical or digital original (paper receipt, email PDF, etc.)
 *    - Has a "document date" (transaction date)
 *
 * 2. SOURCE - Digital file on user's device BEFORE upload (handled here)
 *    - Browser File object from user's file system
 *    - Has "source" properties: sourceName, sourceSize, sourceModifiedDate, sourcePath
 *    - This is what we're processing in the queue
 *
 * 3. FILE - Digital file AFTER upload to Firebase Storage (not handled here)
 *    - Stored with hash-based deduplication
 *    - Has upload metadata, storage path, etc.
 *
 * QUEUE STRUCTURE:
 * ================
 * Each queue item represents a SOURCE FILE being prepared for upload:
 * {
 *   id: string,                    // Unique queue item ID
 *   sourceFile: File,              // Browser File object (the actual source file)
 *   sourceName: string,            // Name of source file
 *   sourceSize: number,            // Size in bytes of source file
 *   sourceType: string,            // MIME type of source file
 *   sourceModifiedDate: number,    // Timestamp when source file was last modified
 *   sourcePath: string,            // Path of source file on user's filesystem
 *   status: string,                // Processing status: 'pending', 'ready', 'uploading', etc.
 *   isDuplicate: boolean,          // Whether this source file is a duplicate (by hash)
 *   metadata: object               // Additional metadata about the source file
 * }
 */
export function useFileQueue() {
  // Initialize core queue management
  const queueCore = useFileQueueCore();

  // Time monitoring for cloud file detection
  let timeWarningInstance = null;

  // UI-specific reactive data
  const showSingleFileNotification = ref(false);
  const singleFileNotification = ref({ message: '', color: 'info' });

  // Progress state tracking (processing source files before upload)
  const processingProgress = ref({
    current: 0,
    total: 0,
    percentage: 0,
    currentSourceFile: '', // Name of source file currently being processed
    isProcessing: false,
  });

  // UI update progress tracking
  const isProcessingUIUpdate = ref(false);
  const uiUpdateProgress = ref({
    current: 0,
    total: 0,
    percentage: 0,
    phase: 'loading', // 'loading', 'awaiting-upload', 'complete'
  });

  // Upload status tracking (uploading source files to Firebase Storage)
  const uploadStatus = ref({
    successful: 0,
    failed: 0,
    skipped: 0,
    isUploading: false,
    isPaused: false,
    pauseRequested: false,
    currentSourceFile: null, // Name of source file currently being uploaded
    currentAction: null, // 'calculating_hash', 'checking_existing', 'uploading'
    currentUploadIndex: 0,
  });

  // Worker progress update handler
  const updateProgress = (progressData) => {
    processingProgress.value = {
      current: progressData.current || 0,
      total: progressData.total || 0,
      percentage: progressData.percentage || 0,
      currentSourceFile: progressData.currentSourceFile || '',
      isProcessing: true,
    };
  };

  // Reset progress when processing completes
  const resetProgress = () => {
    processingProgress.value = {
      current: 0,
      total: 0,
      percentage: 0,
      currentSourceFile: '',
      isProcessing: false,
    };
  };

  // Reset UI update progress
  const resetUIProgress = () => {
    isProcessingUIUpdate.value = false;
    uiUpdateProgress.value = {
      current: 0,
      total: 0,
      percentage: 0,
      phase: 'loading',
    };
  };

  // Set phase to complete (called when upload actually starts)
  const setPhaseComplete = () => {
    uiUpdateProgress.value.phase = 'complete';
  };

  // Upload status management
  const resetUploadStatus = () => {
    uploadStatus.value = {
      successful: 0,
      failed: 0,
      skipped: 0,
      isUploading: false,
      isPaused: false,
      pauseRequested: false,
      currentSourceFile: null,
      currentAction: null,
      currentUploadIndex: 0,
    };
  };

  // Individual source file status update function (updates queue item for a source file)
  const updateFileStatus = (sourceFileReference, status) => {
    // Support both queue item object and source filename
    let queueItem;
    if (typeof sourceFileReference === 'string') {
      // Source filename-based lookup
      queueItem = queueCore.uploadQueue.value.find((item) => item.sourceName === sourceFileReference);
    } else if (sourceFileReference && typeof sourceFileReference === 'object') {
      // Direct queue item object reference (preferred approach)
      queueItem = sourceFileReference;
    }

    if (queueItem) {
      queueItem.status = status;
    }
  };

  // Update all ready source files to "ready" status after deduplication completes
  const updateAllFilesToReady = () => {
    queueCore.uploadQueue.value.forEach((queueItem) => {
      if (!queueItem.isDuplicate && (!queueItem.status || queueItem.status === 'pending')) {
        queueItem.status = 'ready';
      }
    });
  };

  const updateUploadStatus = (type, sourceFileName = null, action = null) => {
    switch (type) {
      case 'start':
        uploadStatus.value.isUploading = true;
        uploadStatus.value.isPaused = false;
        uploadStatus.value.pauseRequested = false;
        break;
      case 'complete':
        uploadStatus.value.isUploading = false;
        uploadStatus.value.isPaused = false;
        uploadStatus.value.pauseRequested = false;
        uploadStatus.value.currentSourceFile = null;
        uploadStatus.value.currentAction = null;
        uploadStatus.value.currentUploadIndex = 0;
        break;
      case 'pause':
        uploadStatus.value.isPaused = true;
        uploadStatus.value.isUploading = false;
        uploadStatus.value.pauseRequested = false;
        break;
      case 'resume':
        uploadStatus.value.isPaused = false;
        uploadStatus.value.isUploading = true;
        uploadStatus.value.pauseRequested = false;
        break;
      case 'requestPause':
        uploadStatus.value.pauseRequested = true;
        break;
      case 'successful':
        uploadStatus.value.successful++;
        break;
      case 'failed':
        uploadStatus.value.failed++;
        break;
      case 'skipped':
        uploadStatus.value.skipped++;
        break;
      case 'currentFile':
        uploadStatus.value.currentSourceFile = sourceFileName;
        uploadStatus.value.currentAction = action;
        break;
      case 'setUploadIndex':
        uploadStatus.value.currentUploadIndex = sourceFileName; // reusing sourceFileName param for index
        break;
    }
  };

  // Instant Upload Queue initialization - show immediately with first 100 source files
  const initializeQueueInstantly = async (sourceFiles) => {
    const totalFiles = sourceFiles.length;

    // Show Upload Queue immediately
    isProcessingUIUpdate.value = true;
    uiUpdateProgress.value = {
      current: 0,
      total: totalFiles,
      percentage: 0,
      phase: 'loading',
    };

    // Force Vue reactivity update
    await nextTick();

    // Process first 100 source files instantly for immediate display
    const initialQueueItems = sourceFiles.slice(0, 100).map((sourceFile) => ({
      id: crypto.randomUUID(),
      sourceFile: sourceFile, // Browser File object (source file from user's device)
      sourceName: sourceFile.name,
      sourceSize: sourceFile.size,
      sourceType: sourceFile.type,
      sourceModifiedDate: sourceFile.lastModified,
      sourcePath: sourceFile.path,
      status: 'ready',
      isDuplicate: false,
      metadata: {},
    }));

    queueCore.uploadQueue.value = initialQueueItems;

    if (totalFiles <= 100) {
      uiUpdateProgress.value = {
        current: totalFiles,
        total: totalFiles,
        percentage: 100,
        phase: 'awaiting-upload',
      };
      isProcessingUIUpdate.value = false;
    } else {
      uiUpdateProgress.value = {
        current: 100,
        total: totalFiles,
        percentage: Math.round((100 / totalFiles) * 100),
        phase: 'loading',
      };
    }
  };

  // Simple 2-chunk UI updates for optimal user feedback
  // Receives processed source file results from worker (ready and duplicate source files)
  const updateFromWorkerResults = async (readySourceFiles, duplicateSourceFiles) => {
    const allSourceFiles = [...readySourceFiles, ...duplicateSourceFiles];
    const totalFiles = allSourceFiles.length;

    // Start UI update process (if not already started by initializeQueueInstantly)
    if (!isProcessingUIUpdate.value) {
      isProcessingUIUpdate.value = true;
      uiUpdateProgress.value = {
        current: 0,
        total: totalFiles,
        percentage: 0,
        phase: 'loading',
      };
    }

    if (totalFiles <= 100) {
      // For small file sets, just load everything at once
      queueCore.uploadQueue.value = queueCore.processFileChunk(allSourceFiles);

      uiUpdateProgress.value = {
        current: totalFiles,
        total: totalFiles,
        percentage: 100,
        phase: 'awaiting-upload',
      };

      // Wait for Vue to complete DOM rendering for single chunk
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    } else {
      // For large file sets, check if queue was already initialized instantly
      if (queueCore.uploadQueue.value.length > 0) {
        // Queue was already initialized with first 100 files
        // Ensure minimum loading display time (at least 1.5 seconds for spinner visibility)
        const minLoadingTime = 1500;
        const elapsedTime = window.instantQueueStartTime
          ? Date.now() - window.instantQueueStartTime
          : 0;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        // Then replace with full processed results
        queueCore.uploadQueue.value = queueCore.processFileChunk(allSourceFiles);

        uiUpdateProgress.value = {
          current: totalFiles,
          total: totalFiles,
          percentage: 100,
          phase: 'awaiting-upload',
        };

        // Clean up timestamp
        window.instantQueueStartTime = null;
      } else {
        // Fallback to original 2-chunk strategy if queue wasn't pre-initialized
        // CHUNK 1: Initial batch (first 100 source files) - immediate user feedback
        const chunk1Size = 100;
        const chunk1SourceFiles = allSourceFiles.slice(0, chunk1Size);
        queueCore.uploadQueue.value = queueCore.processFileChunk(chunk1SourceFiles);

        uiUpdateProgress.value = {
          current: chunk1Size,
          total: totalFiles,
          percentage: Math.round((chunk1Size / totalFiles) * 100),
          phase: 'loading',
        };

        // Brief delay to let user see the initial source files and get visual feedback
        await new Promise((resolve) => setTimeout(resolve, 200));

        // CHUNK 2: Full render of ALL source files
        queueCore.uploadQueue.value = queueCore.processFileChunk(allSourceFiles);

        uiUpdateProgress.value = {
          current: totalFiles,
          total: totalFiles,
          percentage: 100,
          phase: 'awaiting-upload',
        };
      }

      // Wait for Vue to complete DOM rendering
      await nextTick();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    logProcessingTime('ALL_FILES_DISPLAYED');

    // Clean up timing variables
    if (window.endToEndStartTime) {
      window.endToEndStartTime = null;
    }
    if (window.folderProcessingStartTime) {
      window.folderProcessingStartTime = null;
    }

    // Complete the UI update process
    isProcessingUIUpdate.value = false;

    // Stop time monitoring when processing completes
    if (timeWarningInstance) {
      timeWarningInstance.stopMonitoring();
    }

    // Reset processing progress when complete
    resetProgress();
  };

  // Legacy method - maintains backward compatibility
  const updateUploadQueue = async (readySourceFiles, duplicateSourceFiles) => {
    await updateFromWorkerResults(readySourceFiles, duplicateSourceFiles);
  };

  // Time monitoring integration
  const setTimeWarningInstance = (instance) => {
    timeWarningInstance = instance;
  };

  const startTimeMonitoring = (estimatedDurationMs) => {
    if (timeWarningInstance && estimatedDurationMs > 0) {
      timeWarningInstance.startMonitoring(estimatedDurationMs);
    }
  };

  const stopTimeMonitoring = () => {
    if (timeWarningInstance) {
      timeWarningInstance.stopMonitoring();
    }
  };

  const abortProcessing = () => {
    if (timeWarningInstance) {
      timeWarningInstance.abortProcessing();
    }
    resetProgress();
    resetUIProgress();
  };

  // Utility functions
  const showNotification = (message, color = 'info') => {
    singleFileNotification.value = { message, color };
    showSingleFileNotification.value = true;
  };

  // Enhanced clearQueue with comprehensive cleanup
  const clearQueue = () => {
    try {
      console.log('Starting comprehensive cleanup...');

      // 1. Stop time monitoring and progress bar
      try {
        if (timeWarningInstance) {
          timeWarningInstance.abortProcessing();
        }
      } catch (error) {
        console.warn('Error stopping time monitoring:', error);
      }

      // 2. Reset processing states (idempotent operations)
      try {
        resetProgress();
        resetUIProgress();
        isProcessingUIUpdate.value = false;
      } catch (error) {
        console.warn('Error resetting progress states:', error);
      }

      // 3. Clear timing variables (safe operations)
      try {
        if (window.endToEndStartTime) window.endToEndStartTime = null;
        if (window.folderProcessingStartTime) window.folderProcessingStartTime = null;
        if (window.instantQueueStartTime) window.instantQueueStartTime = null;
      } catch (error) {
        console.warn('Error clearing timing variables:', error);
      }

      // 4. Clear file queue (delegate to core) - always attempt this
      try {
        queueCore.clearQueue();
      } catch (error) {
        console.error('Error clearing file queue:', error);
        // Fallback: directly clear uploadQueue if core fails
        try {
          queueCore.uploadQueue.value = [];
        } catch (fallbackError) {
          console.error('Fallback clearQueue also failed:', fallbackError);
        }
      }

      console.log('Comprehensive cleanup completed successfully');
    } catch (error) {
      console.error('Error during comprehensive clearQueue cleanup:', error);
      // Ensure basic cleanup even if advanced cleanup fails
      try {
        queueCore.clearQueue();
      } catch (fallbackError) {
        console.error('Fallback clearQueue failed:', fallbackError);
      }
    }
  };

  return {
    // Reactive data (from core + UI-specific)
    uploadQueue: queueCore.uploadQueue,
    showSingleFileNotification,
    singleFileNotification,
    fileInput: queueCore.fileInput,
    folderInput: queueCore.folderInput,
    processingProgress,
    isProcessingUIUpdate,
    uiUpdateProgress,
    uploadStatus,

    // Core methods (delegated to core)
    getFilePath: queueCore.getFilePath,
    triggerFileSelect: queueCore.triggerFileSelect,
    triggerFolderSelect: queueCore.triggerFolderSelect,
    processSingleFile: queueCore.processSingleFile,
    addFilesToQueue: queueCore.addFilesToQueue,
    processFileChunk: queueCore.processFileChunk,
    removeFromQueue: queueCore.removeFromQueue,
    clearQueue, // Use our enhanced clearQueue instead of delegating
    startUpload: queueCore.startUpload,

    // UI coordination methods
    initializeQueueInstantly, // New method for instant queue display
    updateUploadQueue, // Legacy compatibility
    updateFromWorkerResults, // New worker-optimized method
    updateProgress,
    resetProgress,
    resetUIProgress,
    showNotification,

    // Time monitoring methods
    setTimeWarningInstance,
    startTimeMonitoring,
    stopTimeMonitoring,
    abortProcessing,
    setPhaseComplete,

    // Upload status methods
    resetUploadStatus,
    updateUploadStatus,
    updateFileStatus,
    updateAllFilesToReady,
  };
}
