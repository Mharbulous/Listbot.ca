import { logProcessingTime } from '../../upload/utils/processingTimer.js';
import {
  createApplicationError,
  getRetryDelay,
  isRecoverableError,
} from '../../../utils/errorMessages';

export function useQueueProgress() {
  // Main thread processing with progress tracking for source files
  const processFilesMainThread = async (
    files,
    updateUploadQueue,
    processMainThreadDeduplication,
    processDuplicateGroups,
    onProgress = null,
    skippedFolders = []
  ) => {
    logProcessingTime('DEDUPLICATION_START');

    // Process core deduplication logic with skipped folder filtering
    const { uniqueFiles, hashGroups, skippedFiles, shortcutFiles } =
      await processMainThreadDeduplication(files, onProgress, skippedFolders);

    if (skippedFiles && skippedFiles.length > 0) {
      console.log(`Skipped ${skippedFiles.length} files from cloud folders during deduplication`);
    }

    if (shortcutFiles && shortcutFiles.length > 0) {
      console.log(
        `Skipped ${shortcutFiles.length} Windows shortcut files (.lnk) during deduplication`
      );
    }

    // Process duplicate groups to get final results
    const { finalFiles, duplicateFiles } = processDuplicateGroups(hashGroups);

    // Step 6: Combine unique and non-duplicate files
    const allFinalFiles = [...uniqueFiles, ...finalFiles];

    // Prepare for queue
    const readyFiles = allFinalFiles.map((fileRef) => ({
      ...fileRef,
      status: 'ready',
    }));

    const duplicatesForQueue = duplicateFiles.map((fileRef) => ({
      ...fileRef,
      status: 'uploadMetadataOnly',
    }));

    // Prepare shortcut files for queue (already have correct status from processMainThreadDeduplication)
    const shortcutsForQueue = (shortcutFiles || []).map((fileRef) => ({
      ...fileRef,
      status: 'skipped',
      skipReason: 'shortcut',
    }));

    // Update UI using existing API
    logProcessingTime('UI_UPDATE_START');
    await updateUploadQueue(readyFiles, duplicatesForQueue, shortcutsForQueue);

    // Fallback processing complete - UI update timing will be handled by useFileQueue

    // Return in exact same format as current API, plus skipped file counts
    return {
      readyFiles,
      duplicatesForQueue,
      shortcutFiles: shortcutsForQueue,
      skippedFileCount: skippedFiles?.length || 0,
      shortcutFileCount: shortcutFiles?.length || 0,
    };
  };

  // Main processing controller that handles worker vs main thread for source file deduplication
  const processFiles = async (
    files,
    updateUploadQueue,
    processFilesWithWorker,
    processFilesMainThread,
    onProgress = null
  ) => {
    // Check if files array is valid
    if (!files || !Array.isArray(files) || files.length === 0) {
      const error = createApplicationError('Invalid files array provided', {
        validation: true,
        fileCount: files ? files.length : 0,
      });
      throw error;
    }

    logProcessingTime('DEDUPLICATION_START');

    // Try worker processing first
    const workerResult = await processFilesWithWorker(files, onProgress);

    if (workerResult.success) {
      // Update UI using existing API
      logProcessingTime('UI_UPDATE_START');
      await updateUploadQueue(
        workerResult.result.readyFiles,
        workerResult.result.duplicateFiles,
        workerResult.result.shortcutFiles || []
      );

      // Return in exact same format as current API
      return workerResult.result;
    }

    if (workerResult.fallback) {
      // Fall back to main thread processing
      console.info('Falling back to main thread processing...');
      return await processFilesMainThread(files, updateUploadQueue, onProgress);
    }

    // If we get here, something went wrong
    throw workerResult.error || new Error('Unknown processing error');
  };

  // Force main thread processing (for testing or troubleshooting)
  const forceMainThreadProcessing = async (
    files,
    updateUploadQueue,
    processFilesMainThread,
    onProgress = null
  ) => {
    console.info('Force fallback: Processing files on main thread');
    return processFilesMainThread(files, updateUploadQueue, onProgress);
  };

  // Enhanced error handler for UI consumption
  const handleProcessingError = (error, context = {}) => {
    const appError = createApplicationError(error, context);

    // Add retry recommendations
    appError.canRetry = isRecoverableError(appError.type, context);
    appError.retryDelay = getRetryDelay(appError.type, context.retryAttempt || 1);
    appError.canUseFallback = context.processingMode !== 'fallback';

    return appError;
  };

  return {
    // Progress and processing methods
    processFiles,
    processFilesMainThread,
    forceMainThreadProcessing,
    handleProcessingError,
  };
}
