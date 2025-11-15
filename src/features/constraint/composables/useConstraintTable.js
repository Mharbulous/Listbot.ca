import { ref, nextTick } from 'vue';
import { isUnsupportedFileType } from '../utils/fileTypeChecker.js';
import { useQueueCore } from './useQueueCore.js';
import { extractFolderPath } from '../utils/filePathExtractor.js';
import { useAuthStore } from '@/core/stores/auth.js';

/**
 * Composable for managing constraint table state
 * Handles queue management, file processing, status updates, and deduplication
 */
export function useConstraintTable() {
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

  // Get auth store for firmId (Solo Firm: firmId === userId)
  const authStore = useAuthStore();

  /**
   * Sort queue by group timestamp and status
   * - Groups with most recently added files appear first (desc groupTimestamp)
   * - Within each group: ready → copy → duplicate
   * - Files with same hash are grouped together (primary duplicate immediately above 'duplicate' file)
   * - Tentative duplicates (no hash yet) group with their reference file via referenceFileId
   * - Copies and duplicates are sorted by the same metadata criteria (ensuring matching order)
   */
  const sortQueueByGroupTimestamp = () => {
    const statusOrder = { ready: 0, copy: 1, duplicate: 2, 'n/a': 3, skip: 4, 'read error': 5 };

    // Helper to get grouping key for a file
    // Phase 1: Use xxh3Hash for grouping (all hashes calculated immediately)
    const getGroupingKey = (file) => {
      // Use xxh3Hash for Phase 1 deduplication
      if (file.xxh3Hash) return file.xxh3Hash;

      // Fallback: use legacy hash (for compatibility during migration)
      if (file.hash) return file.hash;

      // No hash - use empty string (sorts to end)
      return '';
    };

    // Helper to compare metadata for copy/duplicate sorting
    // Uses same priority logic as chooseBestFile() to ensure consistent ordering
    const compareMetadata = (a, b) => {
      // Only apply metadata sorting to copy/duplicate status files
      if ((a.status !== 'copy' && a.status !== 'duplicate') ||
          (b.status !== 'copy' && b.status !== 'duplicate')) {
        return 0;
      }

      // Priority 1: Earliest modification date (ascending)
      const lastModifiedA = a.sourceLastModified || 0;
      const lastModifiedB = b.sourceLastModified || 0;
      if (lastModifiedA !== lastModifiedB) {
        return lastModifiedA - lastModifiedB;
      }

      // Priority 2: Longest folder path (descending)
      const folderPathLengthA = (a.folderPath || '').length;
      const folderPathLengthB = (b.folderPath || '').length;
      if (folderPathLengthA !== folderPathLengthB) {
        return folderPathLengthB - folderPathLengthA;
      }

      // Priority 3: Shortest filename (ascending)
      const fileNameLengthA = (a.name || '').length;
      const fileNameLengthB = (b.name || '').length;
      if (fileNameLengthA !== fileNameLengthB) {
        return fileNameLengthA - fileNameLengthB;
      }

      // Priority 4: Alphanumeric filename sort (ascending)
      const fileNameA = a.name || '';
      const fileNameB = b.name || '';
      return fileNameA.localeCompare(fileNameB);
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

      // Quaternary sort: metadata comparison (for copy/duplicate files only)
      // Ensures copies and duplicates are sorted in the same order based on metadata
      const metadataDiff = compareMetadata(a, b);
      if (metadataDiff !== 0) return metadataDiff;

      // Quinary sort: maintain original add order (stable sort)
      return 0;
    });

    console.log('[QUEUE] Queue sorted by group timestamp');
  };

  /**
   * Helper function to extract file extension
   * @param {string} filename - File name
   * @returns {string} - File extension (lowercase, without dot)
   */
  const getFileExtension = (filename) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return ''; // No extension
    return filename.substring(lastDot + 1).toLowerCase();
  };

  /**
   * Deduplicate files against existing queue - Phase 1 Implementation
   * Uses 3-layer XXH3-based deduplication with metadata-first optimization
   *
   * Layer 1: Size-based index (O(1) grouping)
   * Layer 3: XXH3 Metadata hash (BEFORE content) - catches "same folder twice"
   * Layer 2: XXH3 Content hash (only if metadata hash is new)
   *
   * @param {Array} newQueueItems - New queue items to check
   * @param {Array} existingQueueSnapshot - Snapshot of queue BEFORE new items were added
   * @returns {Promise<Array>} - Queue items with final status ('ready', 'copy', or 'duplicate')
   */
  const deduplicateAgainstExisting = async (newQueueItems, existingQueueSnapshot) => {
    const t0 = performance.now();
    console.log('[DEDUP-PHASE1] Starting Phase 1 deduplication:', {
      newFiles: newQueueItems.length,
      existingFiles: existingQueueSnapshot.length,
    });

    // Get firmId from auth store (Solo Firm: firmId === userId)
    const firmId = authStore.currentFirm;

    if (!firmId) {
      console.error('[DEDUP-PHASE1] CRITICAL: No firmId available from auth store');
      // Fallback: mark all as ready
      newQueueItems.forEach((file) => {
        file.status = 'ready';
        file.canUpload = true;
      });
      return newQueueItems;
    }

    // ════════════════════════════════════════════════════════════════
    // LAYER 1: Size-Based Index (O(1) grouping)
    // ════════════════════════════════════════════════════════════════
    const allFiles = [...existingQueueSnapshot, ...newQueueItems];
    const sizeIndex = new Map();

    allFiles.forEach((file) => {
      if (!sizeIndex.has(file.size)) {
        sizeIndex.set(file.size, []);
      }
      sizeIndex.get(file.size).push(file);
    });

    console.log('[DEDUP-PHASE1] Layer 1: Created size index with', sizeIndex.size, 'size groups');

    // Process each size group
    for (const [size, filesWithSize] of sizeIndex) {
      if (filesWithSize.length === 1) {
        // Unique size → mark 'ready', skip layers 2 & 3
        const file = filesWithSize[0];
        // Only update status if this is a new file (not existing)
        if (newQueueItems.includes(file)) {
          file.status = 'ready';
          file.canUpload = true;
        }
        continue;
      }

      // Multiple files with same size → proceed to Layer 3
      await processSizeCollisions(filesWithSize, firmId, newQueueItems);
    }

    const elapsed = performance.now() - t0;
    console.log(`[DEDUP-PHASE1] Deduplication complete in ${elapsed.toFixed(2)}ms`);

    return newQueueItems;
  };

  /**
   * Process files with size collisions using Layer 3 (metadata) and Layer 2 (content) hashing
   * @param {Array} filesWithSize - Files with the same size
   * @param {string} firmId - Firm ID for metadata hash
   * @param {Array} newQueueItems - New queue items (to identify which files to update)
   */
  const processSizeCollisions = async (filesWithSize, firmId, newQueueItems) => {
    // ════════════════════════════════════════════════════════════════
    // LAYER 3: Metadata Hash (BEFORE content hash)
    // Purpose: Catch "same folder twice" with cheap metadata hash
    // ════════════════════════════════════════════════════════════════
    const metadataIndex = new Map(); // metadataHash -> file

    for (const file of filesWithSize) {
      // Generate XXH3 Metadata Hash = XXH3(firmID + modDate + name + ext)
      const metadataHash = await queueCore.generateMetadataHash({
        firmId: firmId,
        modDate: file.sourceLastModified,
        name: file.name,
        extension: getFileExtension(file.name),
      });

      file.metadataHash = metadataHash;

      if (metadataIndex.has(metadataHash)) {
        // Metadata collision → this is a duplicate
        // Get the reference file (the first file with this metadata hash)
        const referenceFile = metadataIndex.get(metadataHash);

        // Only update if this is a new file
        if (newQueueItems.includes(file)) {
          // Generate xxh3Hash for the duplicate (needed to prevent tentative verification)
          const contentHash = await queueCore.generateXXH3Hash(file.sourceFile);
          file.xxh3Hash = contentHash;

          // Set reference to the original file
          file.referenceFileId = referenceFile.id;

          file.status = 'duplicate';
          file.canUpload = false;
          file.isDuplicate = true;
          console.log('[DEDUP-PHASE1] Layer 3: Duplicate caught by metadata hash:', file.name);
        }
        // Skip Layer 2 processing - we already have the content hash
        continue;
      }

      // New metadata hash → store in index and proceed to Layer 2
      metadataIndex.set(metadataHash, file);
    }

    // ════════════════════════════════════════════════════════════════
    // LAYER 2: Content Hash (only for files with unique metadata)
    // ════════════════════════════════════════════════════════════════
    const contentHashIndex = new Map(); // contentHash -> file

    // Only process files that passed Layer 3 (unique metadata hash)
    const filesForContentHash = Array.from(metadataIndex.values());

    for (const file of filesForContentHash) {
      // Generate XXH3 Content Hash
      const contentHash = await queueCore.generateXXH3Hash(file.sourceFile);
      file.xxh3Hash = contentHash;

      if (contentHashIndex.has(contentHash)) {
        // Content hash collision → this is a copy (same content, different metadata)
        // Get the reference file (the first file with this content hash)
        const referenceFile = contentHashIndex.get(contentHash);

        // Only update if this is a new file
        if (newQueueItems.includes(file)) {
          // Set reference to the original file
          file.referenceFileId = referenceFile.id;

          file.status = 'copy';
          file.canUpload = false; // Don't upload content (already exists)
          file.isCopy = true;
          console.log('[DEDUP-PHASE1] Layer 2: Copy detected (same content, different metadata):', file.name);
        }
      } else {
        // Unique content → mark as 'ready'
        // Only update if this is a new file
        if (newQueueItems.includes(file)) {
          file.status = 'ready';
          file.canUpload = true;
        }
        contentHashIndex.set(contentHash, file);
      }
    }
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
    // Phase 1: Uses xxh3Hash (all hashes calculated immediately)
    // ========================================================================
    const currentTimestamp = Date.now();
    const newHashes = new Set(phase1Batch.filter((f) => f.xxh3Hash).map((f) => f.xxh3Hash));

    if (newHashes.size > 0) {
      // Update groupTimestamp for all files in the queue that match any of the new hashes
      uploadQueue.value.forEach((file) => {
        const matchesHash = file.xxh3Hash && newHashes.has(file.xxh3Hash);
        if (matchesHash) {
          file.groupTimestamp = currentTimestamp;
        }
      });

      // Update groupTimestamp for all files in the new batch
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

        // Update group timestamps for files with matching hashes
        // Phase 1: Uses xxh3Hash (all hashes calculated immediately)
        const currentTimestamp = Date.now();
        const newHashes = new Set(processedBatch.filter((f) => f.xxh3Hash).map((f) => f.xxh3Hash));

        if (newHashes.size > 0) {
          // Update groupTimestamp for all files in the queue that match any of the new hashes
          uploadQueue.value.forEach((file) => {
            const matchesHash = file.xxh3Hash && newHashes.has(file.xxh3Hash);
            if (matchesHash) {
              file.groupTimestamp = currentTimestamp;
            }
          });

          // Update groupTimestamp for all files in the new batch
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
   * Also removes copy files that share the same hash as skipped primary files
   */
  const clearSkipped = () => {
    const beforeCount = uploadQueue.value.length;

    // Collect hashes from all skipped files
    const skippedHashes = new Set();
    uploadQueue.value.forEach((file) => {
      if (file.status === 'skip') {
        // Check both xxh3Hash (Phase 1) and legacy hash
        const hashToUse = file.xxh3Hash || file.hash;
        if (hashToUse) {
          skippedHashes.add(hashToUse);
        }
      }
    });

    // Remove files with status 'skip' AND copy files with matching hashes
    uploadQueue.value = uploadQueue.value.filter((file) => {
      // Remove if file is skipped
      if (file.status === 'skip') return false;

      // Remove if file is a copy and its hash matches a skipped file's hash
      if (file.status === 'copy') {
        const hashToUse = file.xxh3Hash || file.hash;
        if (hashToUse && skippedHashes.has(hashToUse)) {
          return false;
        }
      }

      // Keep all other files
      return true;
    });

    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} skipped files (including associated copies)`);
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

    // Phase 1: Use xxh3Hash instead of hash
    const hashToUse = copyFile.xxh3Hash || copyFile.hash;
    if (!hashToUse) {
      console.error('[QUEUE] Cannot swap: file has no hash:', fileId);
      return;
    }

    // Find all files with the same hash (check both xxh3Hash and legacy hash)
    const sameHashFiles = uploadQueue.value.filter((f) =>
      (f.xxh3Hash && f.xxh3Hash === hashToUse) || (f.hash && f.hash === hashToUse)
    );

    // Find the current primary file (status = 'ready' or 'skip')
    // Check for 'ready' first, then 'skip' if the group is skipped
    let primaryFile = sameHashFiles.find((f) => f.status === 'ready');
    if (!primaryFile) {
      primaryFile = sameHashFiles.find((f) => f.status === 'skip');
    }

    if (!primaryFile) {
      console.warn('[QUEUE] No primary file found for hash group, making copy the primary:', hashToUse.substring(0, 8));
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
        hash: hashToUse.substring(0, 8) + '...',
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
    sortQueueByGroupTimestamp,
  };
}
