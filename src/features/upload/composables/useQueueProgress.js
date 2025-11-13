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
    const { uniqueFiles, hashGroups, skippedFiles } = await processMainThreadDeduplication(
      files,
      onProgress,
      skippedFolders
    );

    if (skippedFiles && skippedFiles.length > 0) {
      console.log(`Skipped ${skippedFiles.length} files from cloud folders during deduplication`);
    }

    // Process duplicate groups to get final results (Phase 3 terminology: copies, not duplicates)
    const { finalFiles, duplicateFiles: copyFiles } = processDuplicateGroups(hashGroups);

    // Step 6: Combine unique and non-duplicate files
    const allFinalFiles = [...uniqueFiles, ...finalFiles];

    console.log('[PROGRESS] All final files before queue preparation:', {
      count: allFinalFiles.length,
      files: allFinalFiles.map((f) => ({
        name: f.file.name,
        status: f.status,
        canUpload: f.canUpload,
      })),
    });

    // Prepare for queue - preserve special statuses (duplicate, read error), default to ready
    const readyFiles = allFinalFiles.map((fileRef) => {
      const originalStatus = fileRef.status;
      const originalCanUpload = fileRef.canUpload;

      const result = {
        ...fileRef,
        // Preserve 'same' and 'read error' statuses, otherwise set to 'ready'
        status: fileRef.status === 'same' || fileRef.status === 'read error' ? fileRef.status : 'ready',
        // Preserve canUpload flag if it was set (e.g., false for same/duplicate files)
        canUpload: fileRef.canUpload !== undefined ? fileRef.canUpload : true,
      };

      console.log('[PROGRESS-MAP] Processing file for queue:', {
        fileName: fileRef.file.name,
        originalStatus,
        originalCanUpload,
        resultStatus: result.status,
        resultCanUpload: result.canUpload,
      });

      // Mark shortcut files so they can be skipped during upload
      if (fileRef.file && fileRef.file.name && fileRef.file.name.toLowerCase().endsWith('.lnk')) {
        result.skipReason = 'shortcut';
      }
      return result;
    });

    console.log('[PROGRESS] Ready files after queue preparation:', {
      count: readyFiles.length,
      files: readyFiles.map((f) => ({
        name: f.file.name,
        status: f.status,
        canUpload: f.canUpload,
      })),
    });

    const copiesForQueue = copyFiles.map((fileRef) => {
      const result = {
        ...fileRef,
        isCopy: true, // Phase 3 terminology
        status: 'copy', // Use 'copy' status instead of 'uploadMetadataOnly'
      };
      // Mark shortcut files so they can be skipped during upload
      if (fileRef.file && fileRef.file.name && fileRef.file.name.toLowerCase().endsWith('.lnk')) {
        result.skipReason = 'shortcut';
      }
      return result;
    });

    // Update UI using existing API
    // Note: shortcut files are included in readyFiles/copiesForQueue with skipReason='shortcut'
    logProcessingTime('UI_UPDATE_START');
    await updateUploadQueue(readyFiles, copiesForQueue, []);

    // Fallback processing complete - UI update timing will be handled by useFileQueue

    // Return in Phase 3 format (readyFiles, copyFiles, readErrorFiles)
    return {
      readyFiles,
      copyFiles: copiesForQueue,
      readErrorFiles: [],
      skippedFileCount: skippedFiles?.length || 0,
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
      // Note: shortcut files are included in readyFiles/copyFiles with skipReason='shortcut'
      logProcessingTime('UI_UPDATE_START');
      await updateUploadQueue(
        workerResult.result.readyFiles,
        workerResult.result.copyFiles || [],
        workerResult.result.readErrorFiles || []
      );

      // Return in Phase 3 format
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
