import { ref, nextTick } from 'vue';
import { isUnsupportedFileType } from '../utils/fileTypeChecker.js';

/**
 * Composable for managing upload table state
 * Handles queue management, file processing, and status updates
 */
export function useUploadTable() {
  // Upload queue
  const uploadQueue = ref([]);

  // Queue progress (for large batches >500 files)
  const queueProgress = ref({
    isQueueing: false,
    processed: 0,
    total: 0,
  });

  /**
   * Add files to queue with batch processing
   * @param {File[]} files - Array of File objects to add
   */
  const addFilesToQueue = async (files) => {
    const BATCH_SIZE = 100;
    const totalFiles = files.length;

    // Show progress indicator for large batches
    if (totalFiles > 500) {
      queueProgress.value = {
        isQueueing: true,
        processed: 0,
        total: totalFiles,
      };
    }

    // Process files in batches
    for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const processedBatch = batch.map((file, index) => {
        // Check if file is unsupported (e.g., .lnk, .tmp)
        const isUnsupported = isUnsupportedFileType(file.name);

        return {
          id: `${Date.now()}-${i + index}`,
          name: file.name,
          size: file.size,
          status: isUnsupported ? 'n/a' : 'ready',
          folderPath: extractFolderPath(file),
          sourceFile: file,
          sourceLastModified: file.lastModified,
        };
      });

      uploadQueue.value.push(...processedBatch);

      // Update progress
      if (queueProgress.value.isQueueing) {
        queueProgress.value.processed = Math.min(i + BATCH_SIZE, totalFiles);
        await nextTick();
      }
    }

    // Hide progress indicator
    queueProgress.value.isQueueing = false;

    console.log(`[QUEUE] Added ${totalFiles} files to queue`);

    // Log queue metrics if T=0 was set
    if (window.queueT0) {
      const elapsed = performance.now() - window.queueT0;
      console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - Files finished adding to queue`, {
        totalFiles,
        averageTimePerFile: `${(elapsed / totalFiles).toFixed(2)}ms`,
      });

      // Signal that queue addition is complete (for virtualizer to detect)
      window.queueAdditionComplete = true;
    }
  };

  /**
   * Extract folder path from file
   * @param {File} file - File object
   * @returns {string} - Folder path
   */
  const extractFolderPath = (file) => {
    if (file.webkitRelativePath) {
      const parts = file.webkitRelativePath.split('/');
      parts.pop(); // Remove filename
      return '/' + parts.join('/');
    }
    return '/';
  };

  /**
   * Remove file from queue
   * @param {string} fileId - File ID to remove
   */
  const removeFromQueue = (fileId) => {
    const index = uploadQueue.value.findIndex((f) => f.id === fileId);
    if (index !== -1) {
      uploadQueue.value.splice(index, 1);
      console.log(`[QUEUE] Removed file: ${fileId}`);
    }
  };

  /**
   * Clear skipped files from queue (files with status 'skip' or 'n/a')
   */
  const clearQueue = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) => file.status !== 'skip' && file.status !== 'n/a');
    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} skipped files`);
  };

  /**
   * Update file status
   * @param {string} fileId - File ID
   * @param {string} status - New status
   */
  const updateFileStatus = (fileId, status) => {
    const file = uploadQueue.value.find((f) => f.id === fileId);
    if (file) {
      file.status = status;
    }
  };

  /**
   * Skip file (mark as 'skip' instead of removing)
   * @param {string} fileId - File ID to skip
   */
  const skipFile = (fileId) => {
    const file = uploadQueue.value.find((f) => f.id === fileId);
    if (file) {
      file.status = 'skip';
      console.log(`[QUEUE] Skipped file: ${fileId}`);
    }
  };

  /**
   * Undo skip (restore to 'ready' status)
   * @param {string} fileId - File ID to restore
   */
  const undoSkip = (fileId) => {
    const file = uploadQueue.value.find((f) => f.id === fileId);
    if (file && file.status === 'skip') {
      file.status = 'ready';
      console.log(`[QUEUE] Restored file: ${fileId}`);
    }
  };

  /**
   * Select all files (restore all skipped files to 'ready' status)
   * NOTE: Does NOT affect 'n/a' files (unsupported file types)
   */
  const selectAll = () => {
    let restoredCount = 0;
    uploadQueue.value.forEach((file) => {
      // Only restore skipped files, don't change completed or n/a files
      if (file.status === 'skip') {
        file.status = 'ready';
        restoredCount++;
      }
    });
    console.log(`[QUEUE] Selected all files (restored ${restoredCount} skipped files)`);
  };

  /**
   * Deselect all files (mark all files as 'skip', except completed and n/a files)
   * NOTE: Does NOT affect 'n/a' files (unsupported file types)
   */
  const deselectAll = () => {
    let skippedCount = 0;
    uploadQueue.value.forEach((file) => {
      // Skip all files except completed and n/a ones
      if (file.status !== 'completed' && file.status !== 'skip' && file.status !== 'n/a') {
        file.status = 'skip';
        skippedCount++;
      }
    });
    console.log(`[QUEUE] Deselected all files (skipped ${skippedCount} files)`);
  };

  return {
    uploadQueue,
    queueProgress,
    addFilesToQueue,
    removeFromQueue,
    clearQueue,
    updateFileStatus,
    skipFile,
    undoSkip,
    selectAll,
    deselectAll,
  };
}
