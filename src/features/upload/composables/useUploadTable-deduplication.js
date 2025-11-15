import { useQueueCore } from './useQueueCore.js';

/**
 * Composable for managing upload queue deduplication
 * Handles metadata pre-filtering and hash-based deduplication
 */
export function useUploadTableDeduplication(uploadQueue) {
  // Initialize deduplication logic
  const queueCore = useQueueCore();

  /**
   * Deduplicate files against existing queue
   * Phase 3a: Pre-filter by metadata BEFORE hash calculation for performance
   * Checks for redundant files (same content + metadata)
   * @param {Array} newQueueItems - New queue items to check
   * @param {Array} existingQueueSnapshot - Snapshot of queue BEFORE new items were added
   * @returns {Promise<Array>} - Queue items with duplicate status updated
   */
  const deduplicateAgainstExisting = async (newQueueItems, existingQueueSnapshot) => {
    const dedupT0 = performance.now();
    console.log(`📊 [DEDUP] T=0.00ms - Starting: {new: ${newQueueItems.length}, existing: ${existingQueueSnapshot.length}}`);

    // ========================================================================
    // PHASE 3a: Metadata Pre-Filter (BEFORE hash calculation)
    // Mark files as tentative duplicates/copies based on metadata + folder path
    // Hash calculation deferred to verification trigger points
    // ========================================================================
    const preFilterT0 = performance.now();
    const preFilterResult = queueCore.preFilterByMetadataAndPath(newQueueItems, existingQueueSnapshot);
    const preFilterTime = performance.now() - preFilterT0;

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

    // Log prefilter results
    console.log(`  ├─ [PREFILTER] Complete: {ready: ${readyFiles.length}, dupe: ${preFilterResult.duplicateFiles.length}, copy: ${preFilterResult.copyFiles.length}} (${preFilterTime.toFixed(2)}ms)`);

    if (readyFiles.length === 0) {
      console.log('  └─ [HASH] Skipped - all files pre-filtered');
      const totalTime = performance.now() - dedupT0;
      console.log(`📊 [DEDUP] T=${totalTime.toFixed(2)}ms - Complete\n`);
      return newQueueItems;
    }

    // Get all files that need to be checked (existing + ready new files)
    const allFiles = [...existingQueueSnapshot, ...readyFiles];

    // Group by size first (optimization - files with unique sizes can't be duplicates)
    const sizeGroupT0 = performance.now();
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
    const sizeGroupTime = performance.now() - sizeGroupT0;

    // Find files that need hashing (multiple files with same size)
    const filesToHash = [];
    for (const [, items] of sizeGroups) {
      if (items.length > 1) {
        filesToHash.push(...items);
      }
    }

    if (filesToHash.length === 0) {
      console.log('  └─ [HASH] Skipped - all unique sizes');
      const totalTime = performance.now() - dedupT0;
      console.log(`📊 [DEDUP] T=${totalTime.toFixed(2)}ms - Complete\n`);
      return newQueueItems;
    }

    // Count how many files actually need hashing (don't already have a hash)
    const filesNeedingHash = filesToHash.filter(({ queueItem }) => !queueItem.hash).length;

    // Hash all files that need it (skip files that already have hashes)
    if (filesNeedingHash > 0) {
      console.log(`  ├─ [HASH] Hashing ${filesNeedingHash} files...`);
    }
    const hashT0 = performance.now();
    const hashGroups = new Map();
    let hashedCount = 0;

    for (const { queueItem, isExisting } of filesToHash) {
      try {
        if (!queueItem.hash) {
          // Only hash if file doesn't already have a hash (performance optimization)
          // Files from previous uploads already have hashes - no need to re-hash
          const hash = await queueCore.generateFileHash(queueItem.sourceFile);
          queueItem.hash = hash;
          hashedCount++;
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
        console.error('  │  [HASH-ERROR]', queueItem.name, error.message);
        queueItem.status = 'read error';
        queueItem.canUpload = false;
      }
    }

    const hashTime = performance.now() - hashT0;
    const avgHashTime = hashedCount > 0 ? (hashTime / hashedCount).toFixed(2) : '0.00';
    console.log(`  ├─ [HASH] Complete: {groups: ${hashGroups.size}, hashed: ${hashedCount}} (avg: ${avgHashTime}ms/file, total: ${hashTime.toFixed(2)}ms)`);

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

    const totalTime = performance.now() - dedupT0;
    console.log(`  └─ [GROUPING] Identified duplicates and copies`);
    console.log(`📊 [DEDUP] T=${totalTime.toFixed(2)}ms - Complete\n`);

    return newQueueItems;
  };

  return {
    deduplicateAgainstExisting,
  };
}
