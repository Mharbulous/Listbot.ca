import { ref, nextTick } from 'vue';
import { isUnsupportedFileType } from '../utils/fileTypeChecker.js';
import { useQueueCore } from './useQueueCore.js';
import { extractFolderPath } from '../utils/filePathExtractor.js';

/**
 * Composable for managing upload table state
 * Handles queue management, file processing, status updates, and deduplication
 */
export function useUploadTable() {
  // Upload queue
  const uploadQueue = ref([]);

  // Duplicates visibility state
  const duplicatesHidden = ref(false);

  // Queue progress (for large batches >500 files)
  const queueProgress = ref({
    isQueueing: false,
    processed: 0,
    total: 0,
  });

  // Batch order counter (increments each time addFilesToQueue is called)
  // Used for sorting: files are sorted by batch order, then by folder path
  let batchOrderCounter = 0;

  // Initialize deduplication logic
  const queueCore = useQueueCore();

  /**
   * Sort queue by group timestamp and status
   * - Groups with most recently added files appear first (desc groupTimestamp)
   * - Within each group: ready → copy → duplicate
   * - Files with same hash are grouped together (primary duplicate immediately above 'duplicate' file)
   * - Maintains stable sort within same status
   */
  const sortQueueByGroupTimestamp = () => {
    const statusOrder = { ready: 0, copy: 1, duplicate: 2, 'n/a': 3, skip: 4, 'read error': 5 };

    uploadQueue.value.sort((a, b) => {
      // Primary sort: group timestamp (descending - most recent first)
      const timestampDiff = (b.groupTimestamp || 0) - (a.groupTimestamp || 0);
      if (timestampDiff !== 0) return timestampDiff;

      // Secondary sort: group by hash (ensures files with same hash appear together)
      // This ensures the primary duplicate appears immediately above its "duplicate" file
      const hashA = a.hash || '';
      const hashB = b.hash || '';
      const hashDiff = hashA.localeCompare(hashB);
      if (hashDiff !== 0) return hashDiff;

      // Tertiary sort: status order (ready < copy < duplicate)
      const statusA = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 99;
      const statusB = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 99;
      const statusDiff = statusA - statusB;
      if (statusDiff !== 0) return statusDiff;

      // Quaternary sort: maintain original add order (stable sort by id)
      return 0;
    });

    console.log('[QUEUE] Queue sorted by group timestamp');
  };

  /**
   * Deduplicate files against existing queue
   * Checks for redundant files (same content + metadata)
   * @param {Array} newQueueItems - New queue items to check
   * @param {Array} existingQueueSnapshot - Snapshot of queue BEFORE new items were added
   * @returns {Promise<Array>} - Queue items with duplicate status updated
   */
  const deduplicateAgainstExisting = async (newQueueItems, existingQueueSnapshot) => {
    console.log('[DEDUP-TABLE] Starting deduplication check:', {
      newFiles: newQueueItems.length,
      existingFiles: existingQueueSnapshot.length,
    });

    // Get all files that need to be checked (existing + new)
    // Use the snapshot of existing files from BEFORE this batch was added
    const allFiles = [...existingQueueSnapshot, ...newQueueItems];

    // Group by size first (optimization - files with unique sizes can't be duplicates)
    const sizeGroups = new Map();
    allFiles.forEach((item, index) => {
      if (!sizeGroups.has(item.size)) {
        sizeGroups.set(item.size, []);
      }
      sizeGroups.get(item.size).push({
        queueItem: item,
        isExisting: index < existingQueueSnapshot.length,
        index,
      });
    });

    console.log('[DEDUP-TABLE] Size groups:', sizeGroups.size);

    // Find files that need hashing (multiple files with same size)
    const filesToHash = [];
    for (const [size, items] of sizeGroups) {
      if (items.length > 1) {
        filesToHash.push(...items);
      }
    }

    if (filesToHash.length === 0) {
      console.log('[DEDUP-TABLE] No files need hashing (all unique sizes)');
      return newQueueItems;
    }

    console.log('[DEDUP-TABLE] Hashing', filesToHash.length, 'files');

    // Hash all files that need it
    const hashGroups = new Map();
    for (const { queueItem, isExisting } of filesToHash) {
      try {
        const hash = await queueCore.generateFileHash(queueItem.sourceFile);
        queueItem.hash = hash;

        if (!hashGroups.has(hash)) {
          hashGroups.set(hash, []);
        }
        hashGroups.get(hash).push({
          queueItem,
          isExisting,
        });
      } catch (error) {
        console.error('[DEDUP-TABLE] Hash failed for', queueItem.name, error);
        queueItem.status = 'read error';
        queueItem.canUpload = false;
      }
    }

    console.log('[DEDUP-TABLE] Hash groups:', hashGroups.size);

    // Check for duplicates within hash groups
    for (const [hash, items] of hashGroups) {
      if (items.length === 1) continue; // No duplicates

      // Group by metadata key (filename_size_modified_path)
      // MUST include folderPath to distinguish copies in different folders
      const metadataGroups = new Map();
      items.forEach(({ queueItem, isExisting }) => {
        const metadataKey = `${queueItem.name}_${queueItem.size}_${queueItem.sourceLastModified}_${queueItem.folderPath}`;

        if (!metadataGroups.has(metadataKey)) {
          metadataGroups.set(metadataKey, []);
        }
        metadataGroups.get(metadataKey).push({ queueItem, isExisting });
      });

      // Mark redundant files
      for (const [metadataKey, metadataItems] of metadataGroups) {
        if (metadataItems.length === 1) continue; // No redundant files

        // Keep first instance, mark others as duplicate
        for (let i = 1; i < metadataItems.length; i++) {
          const { queueItem } = metadataItems[i];
          queueItem.status = 'duplicate';
          queueItem.canUpload = false;
          queueItem.isDuplicate = true;
        }
      }

      // Handle copies (same hash, different metadata - e.g., different folders)
      if (metadataGroups.size > 1) {
        // Get first file from each metadata group (excluding redundant files)
        const uniqueFiles = Array.from(metadataGroups.values()).map((group) => group[0]);

        // Choose best file using priority rules
        const bestFile = queueCore.chooseBestFile(
          uniqueFiles.map(({ queueItem }) => ({
            metadata: {
              sourceFileName: queueItem.name,
              sourceFileSize: queueItem.size,
              lastModified: queueItem.sourceLastModified,
            },
            path: queueItem.folderPath + queueItem.name,
            originalIndex: queueItem.id,
          }))
        );

        // Mark all others as copies
        uniqueFiles.forEach(({ queueItem }) => {
          const filePath = queueItem.folderPath + queueItem.name;
          if (filePath !== bestFile.path) {
            queueItem.status = 'copy';
            queueItem.isCopy = true;
          }
        });
      }
    }

    console.log('[DEDUP-TABLE] Deduplication complete');

    return newQueueItems;
  };

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
    console.log('[QUEUE] Running deduplication for Phase 1 files');
    await deduplicateAgainstExisting(phase1Batch, existingQueueSnapshot);

    if (window.queueT0) {
      const elapsed = performance.now() - window.queueT0;
      console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - Deduplication complete for Phase 1`);
    }

    // ========================================================================
    // PHASE 1.6: Update group timestamps
    // For each unique hash in the new batch, update groupTimestamp for ALL
    // files with that hash (both new and existing) to move the group to the top
    // ========================================================================
    const currentTimestamp = Date.now();
    const newHashes = new Set(phase1Batch.filter((f) => f.hash).map((f) => f.hash));

    if (newHashes.size > 0) {
      // Update groupTimestamp for all files in the queue that match any of the new hashes
      uploadQueue.value.forEach((file) => {
        if (file.hash && newHashes.has(file.hash)) {
          file.groupTimestamp = currentTimestamp;
        }
      });

      // Update groupTimestamp for all files in the new batch that have hashes
      phase1Batch.forEach((file) => {
        if (file.hash) {
          file.groupTimestamp = currentTimestamp;
        }
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
            canUpload: !isUnsupported,
            isDuplicate: false,
            groupTimestamp: Date.now(), // Initial group timestamp (will be updated after deduplication)
          };
        });

        // Capture snapshot of queue BEFORE deduplicating this batch
        const phase2Snapshot = [...uploadQueue.value];

        // Deduplicate this batch against existing queue BEFORE adding to queue
        await deduplicateAgainstExisting(processedBatch, phase2Snapshot);

        // Update group timestamps for files with matching hashes
        const currentTimestamp = Date.now();
        const newHashes = new Set(processedBatch.filter((f) => f.hash).map((f) => f.hash));

        if (newHashes.size > 0) {
          // Update groupTimestamp for all files in the queue that match any of the new hashes
          uploadQueue.value.forEach((file) => {
            if (file.hash && newHashes.has(file.hash)) {
              file.groupTimestamp = currentTimestamp;
            }
          });

          // Update groupTimestamp for all files in the new batch that have hashes
          processedBatch.forEach((file) => {
            if (file.hash) {
              file.groupTimestamp = currentTimestamp;
            }
          });
        }

        // Now add to queue with correct statuses and groupTimestamps already set
        uploadQueue.value.push(...processedBatch);

        // Sort entire queue by group timestamp
        sortQueueByGroupTimestamp();

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
   * Clear skipped files from queue (files with status 'skip', 'duplicate', 'n/a', or 'read error')
   */
  const clearQueue = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) =>
      file.status !== 'skip' &&
      file.status !== 'duplicate' &&
      file.status !== 'n/a' &&
      file.status !== 'read error'
    );
    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} skipped files`);
  };

  /**
   * Clear duplicate files from queue (files with status 'duplicate' or legacy 'redundant')
   */
  const clearDuplicates = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) =>
      file.status !== 'duplicate' && file.status !== 'redundant'
    );
    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} duplicate files`);
  };

  /**
   * Clear skipped files from queue (files with status 'skip')
   */
  const clearSkipped = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) =>
      file.status !== 'skip'
    );
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
   * NOTE: Does NOT affect 'n/a', 'duplicate', or 'read error' files
   */
  const selectAll = () => {
    let restoredCount = 0;
    uploadQueue.value.forEach((file) => {
      // Only restore skipped files, don't change completed, n/a, duplicate, or read error files
      if (file.status === 'skip') {
        file.status = 'ready';
        restoredCount++;
      }
    });
    console.log(`[QUEUE] Selected all files (restored ${restoredCount} skipped files)`);
  };

  /**
   * Deselect all files (mark all files as 'skip', except completed, n/a, duplicate, copy, and read error files)
   * NOTE: Does NOT affect files with disabled checkboxes (n/a, duplicate, read error) or copy files
   */
  const deselectAll = () => {
    let skippedCount = 0;
    uploadQueue.value.forEach((file) => {
      // Skip all ready files, but exclude completed, n/a, duplicate, copy, and read error files
      // Copy files should NOT be affected by select all/deselect all
      if (
        file.status !== 'completed' &&
        file.status !== 'skip' &&
        file.status !== 'n/a' &&
        file.status !== 'duplicate' &&
        file.status !== 'copy' &&
        file.status !== 'read error'
      ) {
        file.status = 'skip';
        skippedCount++;
      }
    });
    console.log(`[QUEUE] Deselected all primary files (skipped ${skippedCount} files)`);
  };

  /**
   * Swap a copy file to become the primary (ready) file
   * The current primary file will become a copy
   * Rows remain in their current order - only statuses and checkboxes swap
   * @param {string} fileId - File ID of the copy to make primary
   */
  const swapCopyToPrimary = (fileId) => {
    // Find the copy file
    const copyFile = uploadQueue.value.find((f) => f.id === fileId);
    if (!copyFile) {
      console.error('[QUEUE] Cannot swap: file not found:', fileId);
      return;
    }

    if (copyFile.status !== 'copy') {
      console.error('[QUEUE] Cannot swap: file is not a copy:', fileId);
      return;
    }

    if (!copyFile.hash) {
      console.error('[QUEUE] Cannot swap: file has no hash:', fileId);
      return;
    }

    // Find all files with the same hash
    const sameHashFiles = uploadQueue.value.filter((f) => f.hash === copyFile.hash);

    // Find the current primary file (status = 'ready' or 'skip')
    // Check for 'ready' first, then 'skip' if the group is skipped
    let primaryFile = sameHashFiles.find((f) => f.status === 'ready');
    if (!primaryFile) {
      primaryFile = sameHashFiles.find((f) => f.status === 'skip');
    }

    if (!primaryFile) {
      console.warn('[QUEUE] No primary file found for hash group, making copy the primary:', copyFile.hash.substring(0, 8));
      copyFile.status = 'ready';
      copyFile.isCopy = false;
    } else {
      // Swap statuses (rows stay in current order)
      // The old primary becomes a copy, regardless of whether it was 'ready' or 'skip'
      const oldPrimaryWasSkipped = primaryFile.status === 'skip';
      primaryFile.status = 'copy';
      primaryFile.isCopy = true;
      copyFile.status = 'ready';
      copyFile.isCopy = false;

      console.log('[QUEUE] Swapped copy to primary (rows unchanged):', {
        newPrimary: copyFile.name,
        oldPrimary: primaryFile.name,
        oldPrimaryWasSkipped,
        hash: copyFile.hash.substring(0, 8) + '...',
      });
    }

    // Note: sortQueueByGroupTimestamp() NOT called - rows maintain their current positions
  };

  /**
   * Toggle visibility of duplicate files
   * When hidden, only shows files with status 'ready' (primary files)
   * When shown, displays all files including 'skipped', 'duplicate', and 'copy' statuses
   */
  const toggleDuplicatesVisibility = () => {
    duplicatesHidden.value = !duplicatesHidden.value;
    console.log(`[QUEUE] Duplicates ${duplicatesHidden.value ? 'hidden' : 'shown'}`);
  };

  return {
    uploadQueue,
    duplicatesHidden,
    queueProgress,
    addFilesToQueue,
    removeFromQueue,
    clearQueue,
    clearDuplicates,
    clearSkipped,
    updateFileStatus,
    skipFile,
    undoSkip,
    selectAll,
    deselectAll,
    swapCopyToPrimary,
    toggleDuplicatesVisibility,
  };
}
