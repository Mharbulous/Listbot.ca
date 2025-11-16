import { nextTick } from 'vue';
import { isUnsupportedFileType } from '../utils/fileTypeChecker.js';
import { extractFolderPath } from '../utils/filePathExtractor.js';

/**
 * Composable for managing file addition to upload queue
 * Handles two-phase batch processing with deduplication
 */
export function useUploadTableAddition(
  uploadQueue,
  queueProgress,
  deduplicateAgainstExisting,
  sortQueueByGroupTimestamp
) {
  // Batch order counter (increments each time addFilesToQueue is called)
  // Used for sorting: files are sorted by batch order, then by folder path
  let batchOrderCounter = 0;

  // Cancellation flag for queueing process
  let cancelQueueingFlag = false;

  /**
   * Add files to queue with TWO-PHASE batch processing + DEDUPLICATION
   * Phase 1: Process first 200 files quickly → render table immediately
   * Phase 1.5: Run deduplication check
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
        canUpload: !isUnsupported,
        isDuplicate: false,
        groupTimestamp: Date.now(), // Initial group timestamp (will be updated after deduplication)
      };
    });

    // Capture snapshot of queue BEFORE running deduplication
    const existingQueueSnapshot = [...uploadQueue.value];

    // ========================================================================
    // PHASE 1.5: Deduplication Check (BEFORE adding to queue)
    // Check Phase 1 files for duplicates (against existing queue + themselves)
    // This ensures files have correct statuses when first rendered
    // ========================================================================
    console.log(`[QUEUE] Running deduplication: ${phase1Batch.length} new files vs ${existingQueueSnapshot.length} existing`);
    await deduplicateAgainstExisting(phase1Batch, existingQueueSnapshot);

    if (window.queueT0) {
      const elapsed = performance.now() - window.queueT0;
      console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - Deduplication complete for Phase 1`);
    }

    // ========================================================================
    // PHASE 1.6: Update group timestamps
    // For each unique hash in the new batch, update groupTimestamp for ALL
    // files with that hash (both new and existing) to move the group to the top
    // Also handle tentative duplicates (no hash yet) via referenceFileId
    // ========================================================================
    const currentTimestamp = Date.now();
    const newHashes = new Set(phase1Batch.filter((f) => f.hash).map((f) => f.hash));
    const newReferenceIds = new Set(phase1Batch.filter((f) => f.referenceFileId && !f.hash).map((f) => f.referenceFileId));

    if (newHashes.size > 0 || newReferenceIds.size > 0) {
      // Update groupTimestamp for all files in the queue that match any of the new hashes or referenceFileIds
      uploadQueue.value.forEach((file) => {
        const matchesHash = file.hash && newHashes.has(file.hash);
        const matchesReferenceId = file.id && newReferenceIds.has(file.id); // This file is referenced by a tentative duplicate
        const isTentativeInGroup = file.referenceFileId && newReferenceIds.has(file.referenceFileId); // Tentative duplicate in same group

        if (matchesHash || matchesReferenceId || isTentativeInGroup) {
          file.groupTimestamp = currentTimestamp;
        }
      });

      // Update groupTimestamp for all files in the new batch (hashed or tentative)
      phase1Batch.forEach((file) => {
        file.groupTimestamp = currentTimestamp;
      });
    }

    // Now add files to queue with correct statuses and groupTimestamps already set
    uploadQueue.value.push(...phase1Batch);

    // ========================================================================
    // PHASE 1.7: Sort entire queue by group timestamp
    // Groups with most recently added files appear first
    // Within each group: ready → copy → duplicate
    // ========================================================================
    sortQueueByGroupTimestamp();

    // Initialize queueProgress stats from Phase 1 files
    const phase1Stats = uploadQueue.value.reduce((acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1;
      return acc;
    }, {});

    queueProgress.value.filesReady = phase1Stats['ready'] || 0;
    queueProgress.value.filesCopies = phase1Stats['copy'] || 0;
    queueProgress.value.filesDuplicates = phase1Stats['duplicate'] || 0;
    queueProgress.value.filesUnsupported = phase1Stats['n/a'] || 0;
    queueProgress.value.filesReadError = phase1Stats['read error'] || 0;

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

      // Show progress indicator for remaining files (preserve existing stats)
      queueProgress.value.isQueueing = true;
      queueProgress.value.processed = phase1Count;
      queueProgress.value.total = totalFiles;

      // Process remaining files in larger batches
      for (let i = 0; i < remainingCount; i += PHASE2_BATCH_SIZE) {
        // Check for cancellation
        if (cancelQueueingFlag) {
          console.log('[QUEUE] Queueing cancelled by user');
          // Stats are already tracked incrementally - just set cancelled flag
          queueProgress.value.cancelled = true;
          queueProgress.value.isQueueing = false;
          cancelQueueingFlag = false; // Reset flag
          return;
        }

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
            canUpload: !isUnsupported,
            isDuplicate: false,
            groupTimestamp: Date.now(), // Initial group timestamp (will be updated after deduplication)
          };
        });

        // Capture snapshot of queue BEFORE deduplicating this batch
        const phase2Snapshot = [...uploadQueue.value];

        // Deduplicate this batch against existing queue BEFORE adding to queue
        await deduplicateAgainstExisting(processedBatch, phase2Snapshot);

        // Update group timestamps for files with matching hashes or referenceFileIds
        const currentTimestamp = Date.now();
        const newHashes = new Set(processedBatch.filter((f) => f.hash).map((f) => f.hash));
        const newReferenceIds = new Set(processedBatch.filter((f) => f.referenceFileId && !f.hash).map((f) => f.referenceFileId));

        if (newHashes.size > 0 || newReferenceIds.size > 0) {
          // Update groupTimestamp for all files in the queue that match any of the new hashes or referenceFileIds
          uploadQueue.value.forEach((file) => {
            const matchesHash = file.hash && newHashes.has(file.hash);
            const matchesReferenceId = file.id && newReferenceIds.has(file.id); // This file is referenced by a tentative duplicate
            const isTentativeInGroup = file.referenceFileId && newReferenceIds.has(file.referenceFileId); // Tentative duplicate in same group

            if (matchesHash || matchesReferenceId || isTentativeInGroup) {
              file.groupTimestamp = currentTimestamp;
            }
          });

          // Update groupTimestamp for all files in the new batch (hashed or tentative)
          processedBatch.forEach((file) => {
            file.groupTimestamp = currentTimestamp;
          });
        }

        // Now add to queue with correct statuses and groupTimestamps already set
        uploadQueue.value.push(...processedBatch);

        // Sort entire queue by group timestamp
        sortQueueByGroupTimestamp();

        // Update stats with current batch counts
        const batchStats = processedBatch.reduce((acc, file) => {
          acc[file.status] = (acc[file.status] || 0) + 1;
          return acc;
        }, {});

        queueProgress.value.filesReady += batchStats['ready'] || 0;
        queueProgress.value.filesCopies += batchStats['copy'] || 0;
        queueProgress.value.filesDuplicates += batchStats['duplicate'] || 0;
        queueProgress.value.filesUnsupported += batchStats['n/a'] || 0;
        queueProgress.value.filesReadError += batchStats['read error'] || 0;

        // Update progress
        queueProgress.value.processed = Math.min(phase1Count + i + PHASE2_BATCH_SIZE, totalFiles);
        await nextTick();
      }

      // Hide progress indicator
      queueProgress.value.isQueueing = false;
    }

    console.log(`[QUEUE] Added ${totalFiles} files to queue (with deduplication)`);

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
   * Cancel the queueing process
   * Sets the cancellation flag to stop Phase 2 processing
   */
  const cancelQueue = () => {
    console.log('[QUEUE] Cancel requested');
    cancelQueueingFlag = true;
  };

  return {
    addFilesToQueue,
    cancelQueue,
  };
}
