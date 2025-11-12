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

  // Batch order counter (increments each time addFilesToQueue is called)
  // Used for sorting: files are sorted by batch order, then by folder path
  let batchOrderCounter = 0;

  /**
   * Add files to queue with TWO-PHASE batch processing
   * Phase 1: Process first 200 files quickly → render table immediately
   * Phase 2: Process remaining files in background
   * @param {File[]} files - Array of File objects to add
   */
  const addFilesToQueue = async (files) => {
    const PHASE1_SIZE = 200; // Number of files to process in Phase 1 (fast initial render)
    const PHASE2_BATCH_SIZE = 1000; // Batch size for Phase 2 (efficient bulk processing)
    const totalFiles = files.length;

    // Increment batch counter for this batch
    const currentBatchOrder = ++batchOrderCounter;

    // Sort files by folder path - O(n log n), negligible overhead
    // Folder path is immediately available from File objects (no I/O required)
    // Note: Batch order is the PRIMARY sort (handled by storing batchOrder with each file)
    // This sorts files WITHIN each batch by folder path
    const sortedFiles = [...files].sort((a, b) => {
      const pathA = extractFolderPath(a);
      const pathB = extractFolderPath(b);
      return pathA.localeCompare(pathB);
    });

    // ========================================================================
    // PHASE 1: Quick Feedback (<100ms target)
    // Process first 200 files in a single batch → render table immediately
    // ========================================================================
    const phase1Count = Math.min(PHASE1_SIZE, totalFiles);
    const phase1Files = sortedFiles.slice(0, phase1Count);

    // Process Phase 1 files in a single batch (no await nextTick to maximize speed)
    const phase1Batch = phase1Files.map((file, index) => {
      const isUnsupported = isUnsupportedFileType(file.name);
      return {
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        status: isUnsupported ? 'n/a' : 'ready',
        folderPath: extractFolderPath(file),
        sourceFile: file,
        sourceLastModified: file.lastModified,
        batchOrder: currentBatchOrder,
      };
    });

    uploadQueue.value.push(...phase1Batch);

    // Signal Phase 1 complete (for virtualizer to detect)
    window.initialBatchComplete = true;

    // Log Phase 1 completion metrics
    if (window.queueT0) {
      const elapsed = performance.now() - window.queueT0;
      console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - Initial batch complete (${phase1Count} files)`);
    }

    // CRITICAL: Wait for browser to PAINT the initial batch before starting Phase 2
    // This ensures the user SEES the table before we block the main thread with Phase 2
    await nextTick(); // Wait for Vue to update the DOM
    await new Promise((resolve) => requestAnimationFrame(() => {
      // Double RAF to ensure paint has completed
      requestAnimationFrame(() => {
        if (window.queueT0) {
          const elapsed = performance.now() - window.queueT0;
          console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - Initial table PAINTED (visible to user)`);
        }
        resolve();
      });
    }));

    // ========================================================================
    // PHASE 2: Bulk Processing (if more files remain)
    // Process remaining files in larger batches with progress indicator
    // ========================================================================
    if (totalFiles > phase1Count) {
      const remainingFiles = sortedFiles.slice(phase1Count);
      const remainingCount = remainingFiles.length;

      // Show progress indicator for remaining files
      queueProgress.value = {
        isQueueing: true,
        processed: phase1Count,
        total: totalFiles,
      };

      // Process remaining files in larger batches
      for (let i = 0; i < remainingCount; i += PHASE2_BATCH_SIZE) {
        const batch = remainingFiles.slice(i, i + PHASE2_BATCH_SIZE);
        const processedBatch = batch.map((file, index) => {
          const isUnsupported = isUnsupportedFileType(file.name);
          return {
            id: `${Date.now()}-${phase1Count + i + index}`,
            name: file.name,
            size: file.size,
            status: isUnsupported ? 'n/a' : 'ready',
            folderPath: extractFolderPath(file),
            sourceFile: file,
            sourceLastModified: file.lastModified,
            batchOrder: currentBatchOrder,
          };
        });

        uploadQueue.value.push(...processedBatch);

        // Update progress
        queueProgress.value.processed = Math.min(phase1Count + i + PHASE2_BATCH_SIZE, totalFiles);
        await nextTick();
      }

      // Hide progress indicator
      queueProgress.value.isQueueing = false;
    }

    console.log(`[QUEUE] Added ${totalFiles} files to queue`);

    // Log queue metrics if T=0 was set
    if (window.queueT0) {
      const elapsed = performance.now() - window.queueT0;
      console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - All files finished adding to queue (${totalFiles} files)`, {
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
