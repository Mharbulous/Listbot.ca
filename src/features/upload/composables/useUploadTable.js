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
    cancelled: false,
    filesReady: 0,
    filesCopies: 0,
    filesDuplicates: 0,
    filesUnsupported: 0,
    filesReadError: 0,
  });

  // Cancellation flag for queueing process
  let cancelQueueingFlag = false;

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
   * - Tentative duplicates (no hash yet) group with their reference file via referenceFileId
   * - Maintains stable sort within same status
   */
  const sortQueueByGroupTimestamp = () => {
    const statusOrder = { ready: 0, copy: 1, duplicate: 2, 'n/a': 3, skip: 4, 'read error': 5 };

    // Helper to get grouping key for a file (hash or reference file's hash)
    const getGroupingKey = (file) => {
      // If file has hash, use it directly
      if (file.hash) return file.hash;

      // If this file is referenced by tentative duplicates but not hashed yet
      if (file.tentativeGroupId) return file.tentativeGroupId;

      // If file is tentative duplicate/copy (no hash but has referenceFileId)
      // Use the reference file's hash for grouping
      if (file.referenceFileId && (file.status === 'duplicate' || file.status === 'copy')) {
        const referenceFile = uploadQueue.value.find((f) => f.id === file.referenceFileId);
        if (referenceFile) {
          // Reference file might also be tentative initially, but will get hashed first
          // Use reference file's hash if available, otherwise tentativeGroupId, otherwise referenceFileId as fallback
          return referenceFile.hash || referenceFile.tentativeGroupId || file.referenceFileId;
        }
        // Fallback: use referenceFileId if reference file not found
        return file.referenceFileId;
      }

      // No hash and no referenceFileId - use empty string (sorts to end)
      return '';
    };

    uploadQueue.value.sort((a, b) => {
      // Primary sort: group timestamp (descending - most recent first)
      const timestampDiff = (b.groupTimestamp || 0) - (a.groupTimestamp || 0);
      if (timestampDiff !== 0) return timestampDiff;

      // Secondary sort: group by hash or referenceFileId (ensures files with same content appear together)
      // This ensures the primary file appears immediately above its "duplicate"/"copy" files
      // Tentative duplicates (no hash) will group with their reference file
      const groupKeyA = getGroupingKey(a);
      const groupKeyB = getGroupingKey(b);
      const hashDiff = groupKeyA.localeCompare(groupKeyB);
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
   * Phase 3a: Pre-filter by metadata BEFORE hash calculation for performance
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

    // ========================================================================
    // PHASE 3a: Metadata Pre-Filter (BEFORE hash calculation)
    // Mark files as tentative duplicates/copies based on metadata + folder path
    // Hash calculation deferred to verification trigger points
    // ========================================================================
    const preFilterResult = queueCore.preFilterByMetadataAndPath(newQueueItems, existingQueueSnapshot);

    // OPTIMIZATION: Build queue index once (O(M+N)), then O(1) lookups
    // Prevents O(N×M) from repeated uploadQueue.value.find() calls
    // CRITICAL: Include BOTH existing queue AND new items (reference file might be in new batch)
    const queueIndex = new Map();
    uploadQueue.value.forEach((file) => {
      queueIndex.set(file.id, file);
    });
    newQueueItems.forEach((file) => {
      queueIndex.set(file.id, file);
    });

    // Mark ready files
    preFilterResult.readyFiles.forEach((newFile) => {
      newFile.status = 'ready';
      newFile.canUpload = true;
    });

    // Mark tentative duplicates (NO hash yet - will be verified on hover/delete/upload)
    preFilterResult.duplicateFiles.forEach((item) => {
      item.file.status = 'duplicate';
      item.file.canUpload = false;
      item.file.isDuplicate = true;
      item.file.referenceFileId = item.referenceFileId; // Track reference for hash verification

      // Update the reference file to know it's part of a tentative group (O(1) lookup)
      const refFile = queueIndex.get(item.referenceFileId);
      if (refFile && !refFile.hash) {
        refFile.tentativeGroupId = refFile.id; // Use own ID as group key
      }
    });

    // Mark tentative copies (NO hash yet - will be verified on hover/delete/upload)
    preFilterResult.copyFiles.forEach((item) => {
      item.file.status = 'copy';
      item.file.canUpload = true;
      item.file.isCopy = true;
      item.file.referenceFileId = item.referenceFileId; // Track reference for hash verification

      // Update the reference file to know it's part of a tentative group (O(1) lookup)
      const refFile = queueIndex.get(item.referenceFileId);
      if (refFile && !refFile.hash) {
        refFile.tentativeGroupId = refFile.id; // Use own ID as group key
      }
    });

    // Handle promotions - demote existing files when new file is more specific
    preFilterResult.promotions.forEach((promo) => {
      const existingFile = queueIndex.get(promo.existingFileId);
      if (existingFile) {
        existingFile.status = 'duplicate'; // Demote from 'ready' to 'duplicate'
        existingFile.canUpload = false;
        existingFile.isDuplicate = true;
        existingFile.referenceFileId = promo.newPrimaryId; // Point to new primary

        // Update the new primary file to know it's part of a tentative group (O(1) lookup)
        const newPrimary = queueIndex.get(promo.newPrimaryId);
        if (newPrimary && !newPrimary.hash) {
          newPrimary.tentativeGroupId = newPrimary.id; // Use own ID as group key
        }

        console.log('[PREFILTER] Demoted existing file to duplicate:', {
          fileName: existingFile.name,
          newPrimaryId: promo.newPrimaryId,
        });
      }
    });

    // ========================================================================
    // Hash-based deduplication (fallback for files marked as 'ready')
    // Only hash files that weren't pre-filtered as duplicates/copies
    // This ensures existing behavior is preserved for files that need it
    // ========================================================================
    const readyFiles = newQueueItems.filter((f) => f.status === 'ready');

    if (readyFiles.length === 0) {
      console.log('[DEDUP-TABLE] All files pre-filtered, no hash calculation needed');
      return newQueueItems;
    }

    // Get all files that need to be checked (existing + ready new files)
    const allFiles = [...existingQueueSnapshot, ...readyFiles];

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

    console.log('[DEDUP-TABLE] Size groups for ready files:', sizeGroups.size);

    // Find files that need hashing (multiple files with same size)
    const filesToHash = [];
    for (const [, items] of sizeGroups) {
      if (items.length > 1) {
        filesToHash.push(...items);
      }
    }

    if (filesToHash.length === 0) {
      console.log('[DEDUP-TABLE] No ready files need hashing (all unique sizes)');
      return newQueueItems;
    }

    console.log('[DEDUP-TABLE] Hashing', filesToHash.length, 'ready files');

    // Hash all files that need it (skip files that already have hashes)
    const hashGroups = new Map();
    for (const { queueItem, isExisting } of filesToHash) {
      try {
        if (!queueItem.hash) {
          // Only hash if file doesn't already have a hash (performance optimization)
          // Files from previous uploads already have hashes - no need to re-hash
          const hash = await queueCore.generateFileHash(queueItem.sourceFile);
          queueItem.hash = hash;
        }

        // Use existing or newly generated hash
        const hash = queueItem.hash;

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
    for (const [, items] of hashGroups) {
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
      for (const [, metadataItems] of metadataGroups) {
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

  /**
   * Cancel the queueing process
   * Sets the cancellation flag to stop Phase 2 processing
   */
  const cancelQueue = () => {
    console.log('[QUEUE] Cancel requested');
    cancelQueueingFlag = true;
  };

  /**
   * Phase 3a: Hash verification on status hover
   * Verifies tentative duplicate/copy status when user hovers over status column
   * @param {Object} queueItem - Queue item to verify
   * @returns {Promise<Object>} - { verified: boolean, hash: string, error: string }
   */
  const verifyHashOnHover = async (queueItem) => {
    // Only verify if status is duplicate/copy and no hash exists
    if (!queueItem.hash && (queueItem.status === 'duplicate' || queueItem.status === 'copy')) {
      // Race condition check: Hash might have been calculated by another trigger
      if (queueItem.hash) {
        return { verified: true, hash: queueItem.hash };
      }

      // Calculate hash with error handling
      try {
        const hash = await queueCore.generateFileHash(queueItem.sourceFile);
        queueItem.hash = hash;
      } catch (error) {
        console.error('[HASH-VERIFY] Hash calculation failed:', {
          file: queueItem.name,
          error: error.message,
        });
        queueItem.status = 'read error';
        queueItem.errorMessage = error.message;
        queueItem.canUpload = false;
        return { verified: false, error: error.message };
      }

      // Find best/primary copy using referenceFileId (set during pre-filter)
      const bestCopy = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

      // ERROR CHECK: Best copy MUST have hash
      if (!bestCopy?.hash) {
        console.error('[HASH-VERIFY] CRITICAL: Best copy has no hash', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
          bestCopyFound: !!bestCopy,
        });
        return {
          verified: false,
          error: 'Cannot verify duplicate status - best copy has no hash. Please report this issue.',
        };
      }

      // Compare hashes
      if (queueItem.hash !== bestCopy.hash) {
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        console.warn('[HASH-VERIFY] Hash mismatch - promoting to ready', {
          file: queueItem.name,
          tentativeHash: queueItem.hash,
          bestCopyHash: bestCopy.hash,
        });
        return {
          verified: false,
          hash: queueItem.hash,
          mismatch: true,
          message: `File "${queueItem.name}" was incorrectly marked as duplicate. Status changed to Ready.`,
        };
      }

      return { verified: true, hash: queueItem.hash };
    }

    // Already has hash or not a tentative status
    return { verified: true, hash: queueItem.hash || 'No hash' };
  };

  /**
   * Phase 3a: Hash verification before deletion
   * Verifies tentative duplicate status before allowing deletion
   * @param {Object} queueItem - Queue item to verify before deletion
   * @returns {Promise<Object>} - { allowDeletion: boolean, message: string }
   */
  const verifyHashBeforeDelete = async (queueItem) => {
    if (queueItem.status === 'duplicate' && !queueItem.hash) {
      // Race condition check
      if (queueItem.hash) {
        return { allowDeletion: true };
      }

      // Calculate hash with error handling
      try {
        const hash = await queueCore.generateFileHash(queueItem.sourceFile);
        queueItem.hash = hash;
      } catch (error) {
        console.error('[DELETE-VERIFY] Hash calculation failed:', {
          file: queueItem.name,
          error: error.message,
        });
        return {
          allowDeletion: false,
          error: `Cannot verify file "${queueItem.name}": ${error.message}`,
        };
      }

      // Find best/primary copy using referenceFileId
      const bestCopy = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

      if (!bestCopy?.hash) {
        console.error('[DELETE-VERIFY] CRITICAL: Best copy has no hash', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
        });
        return {
          allowDeletion: false,
          error: 'Cannot verify duplicate status - best copy has no hash. Please report this issue.',
        };
      }

      if (queueItem.hash !== bestCopy.hash) {
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        console.warn('[DELETE-VERIFY] Hash mismatch - blocking deletion', {
          file: queueItem.name,
        });
        return {
          allowDeletion: false,
          mismatch: true,
          message: `File "${queueItem.name}" is actually unique content, not a duplicate. Deletion blocked and status changed to Ready.`,
        };
      }
    }

    return { allowDeletion: true };
  };

  /**
   * Phase 3a: Hash verification before upload
   * Verifies tentative duplicate/copy status before upload
   * @param {Object} queueItem - Queue item to verify before upload
   * @returns {Promise<Object>} - { shouldSkip: boolean, message: string }
   */
  const verifyHashBeforeUpload = async (queueItem) => {
    // Always calculate hash if missing (required for Firestore document ID)
    if (!queueItem.hash) {
      try {
        queueItem.hash = await queueCore.generateFileHash(queueItem.sourceFile);
      } catch (error) {
        console.error('[UPLOAD-VERIFY] Hash calculation failed:', {
          file: queueItem.name,
          error: error.message,
        });
        queueItem.status = 'error';
        queueItem.errorMessage = error.message;
        return { shouldSkip: true, error: error.message }; // Don't upload files that can't be hashed
      }
    }

    // If this was tentatively marked as duplicate/copy, verify now
    if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
      const bestCopy = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

      if (!bestCopy?.hash) {
        console.error('[UPLOAD-VERIFY] CRITICAL: Best copy has no hash', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
        });
        // Fail-safe: treat as ready to avoid data loss
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
      } else if (queueItem.hash !== bestCopy.hash) {
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        console.warn('[UPLOAD-VERIFY] Hash mismatch - promoting to ready and uploading', {
          file: queueItem.name,
        });
      }
    }

    // Proceed with normal upload logic
    if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
      return { shouldSkip: true }; // Confirmed duplicate/copy - don't upload
    }

    return { shouldSkip: false };
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
    cancelQueue,

    // Phase 3a: Hash verification functions
    verifyHashOnHover,
    verifyHashBeforeDelete,
    verifyHashBeforeUpload,
  };
}
