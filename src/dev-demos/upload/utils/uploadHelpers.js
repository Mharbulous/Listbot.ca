/**
 * Upload Helper Utilities
 * Shared utility functions for file upload operations
 */

import { computed } from 'vue';

/**
 * Helper function to safely handle logging errors
 * Silently catches logging errors to prevent upload interruption
 */
export const safeLog = async (logFn) => {
  try {
    await logFn();
  } catch {
    // Silently catch logging errors
  }
};

/**
 * Helper function to handle metadata operations with detailed error logging
 * Rethrows errors in development mode for debugging
 */
export const safeMetadata = async (metadataFn) => {
  try {
    await metadataFn();
  } catch (error) {
    // Rethrow in development to surface issues
    if (import.meta.env.DEV) {
      throw error;
    }
  }
};

/**
 * Helper function for creating file metadata records
 * Wrapper that formats queue file data for metadata creation
 */
export const createFileMetadataRecord = async (
  createMetadataRecord,
  getCurrentSessionId,
  queueFile,
  fileHash,
  storageCreatedTimestamp = null
) => {
  await createMetadataRecord({
    sourceFileName: queueFile.sourceName,
    lastModified: queueFile.sourceModifiedDate,
    fileHash: fileHash,
    size: queueFile.sourceSize,
    sessionId: getCurrentSessionId(),
    originalPath: queueFile.sourcePath,
    sourceFileType: queueFile.sourceFile?.type || '',
    storageCreatedTimestamp: storageCreatedTimestamp,
  });
};

/**
 * Helper function for logging upload events
 * Generates metadata hash and logs the event
 */
export const logFileEvent = async (
  logUploadEvent,
  generateMetadataHash,
  eventType,
  queueFile,
  fileHash
) => {
  const metadataHash = await generateMetadataHash(
    queueFile.sourceName,
    queueFile.sourceModifiedDate,
    fileHash
  );
  return await logUploadEvent({
    eventType,
    fileName: queueFile.sourceName,
    fileHash,
    metadataHash,
  });
};

/**
 * Creates computed prop object for folder options dialog
 */
export const createFolderOptionsProps = (folderOptionsState) => {
  return computed(() => ({
    show: folderOptionsState.showFolderOptions.value,
    subfolderCount: folderOptionsState.subfolderCount.value,
    includeSubfolders: folderOptionsState.includeSubfolders.value,
    isAnalyzing: folderOptionsState.isAnalyzing.value,
    mainFolderAnalysis: folderOptionsState.mainFolderAnalysis.value,
    allFilesAnalysis: folderOptionsState.allFilesAnalysis.value,
    mainFolderProgress: folderOptionsState.mainFolderProgress.value,
    allFilesProgress: folderOptionsState.allFilesProgress.value,
    mainFolderComplete: folderOptionsState.mainFolderComplete.value,
    allFilesComplete: folderOptionsState.allFilesComplete.value,
    isAnalyzingMainFolder: folderOptionsState.isAnalyzingMainFolder.value,
    isAnalyzingAllFiles: folderOptionsState.isAnalyzingAllFiles.value,
    analysisTimedOut: folderOptionsState.analysisTimedOut.value,
    timeoutError: folderOptionsState.timeoutError.value,
    currentProgressMessage: folderOptionsState.currentProgressMessage.value,
    totalDirectoryEntryCount: folderOptionsState.totalDirectoryEntryCount.value,
  }));
};

/**
 * Creates computed prop object for file upload queue
 */
export const createQueueProps = (queueState, timeWarning) => {
  return computed(() => ({
    files: queueState.uploadQueue.value,
    isProcessingUiUpdate: queueState.isProcessingUIUpdate.value,
    uiUpdateProgress: queueState.uiUpdateProgress.value,
    uploadStatus: queueState.uploadStatus.value,
    showTimeProgress:
      timeWarning.startTime.value !== null &&
      (queueState.uploadQueue.value.length === 0 || queueState.isProcessingUIUpdate.value),
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
    isUploading: queueState.uploadStatus.value.isUploading,
    isPaused: queueState.uploadStatus.value.isPaused,
    isStartingUpload: queueState.isStartingUpload.value,
    totalAnalyzedFiles: queueState.totalAnalyzedFiles.value,
  }));
};
