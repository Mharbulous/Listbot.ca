/**
 * Metadata-based pre-filtering for upload queue deduplication
 * Handles Phase 3a: Pre-filter by metadata BEFORE hash calculation
 * Marks files as tentative duplicates/copies based on metadata + folder path
 * Hash calculation deferred to verification trigger points
 */

/**
 * Build queue index for O(1) file lookups
 * CRITICAL: Include BOTH existing queue AND new items (reference file might be in new batch)
 * @param {Array} uploadQueue - Current upload queue
 * @param {Array} newQueueItems - New items being added
 * @returns {Map} - Index mapping file ID to file object
 */
function buildQueueIndex(uploadQueue, newQueueItems) {
  const queueIndex = new Map();
  uploadQueue.forEach((file) => {
    queueIndex.set(file.id, file);
  });
  newQueueItems.forEach((file) => {
    queueIndex.set(file.id, file);
  });
  return queueIndex;
}

/**
 * Mark files as ready (no duplicates/copies detected)
 * @param {Array} readyFiles - Files marked as ready by prefilter
 */
function markReadyFiles(readyFiles) {
  readyFiles.forEach((newFile) => {
    newFile.status = 'ready';
    newFile.canUpload = true;
  });
}

/**
 * Mark files as tentative duplicates
 * NO hash yet - will be verified on hover/delete/upload
 * @param {Array} duplicateFiles - Files marked as duplicates by prefilter
 * @param {Map} queueIndex - Queue index for O(1) lookups
 */
function markTentativeDuplicates(duplicateFiles, queueIndex) {
  duplicateFiles.forEach((item) => {
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
}

/**
 * Mark files as tentative copies
 * NO hash yet - will be verified on hover/delete/upload
 * @param {Array} copyFiles - Files marked as copies by prefilter
 * @param {Map} queueIndex - Queue index for O(1) lookups
 */
function markTentativeCopies(copyFiles, queueIndex) {
  copyFiles.forEach((item) => {
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
}

/**
 * Handle file promotions - demote existing files when new file is more specific
 * @param {Array} promotions - List of promotion decisions
 * @param {Map} queueIndex - Queue index for O(1) lookups
 */
function handlePromotions(promotions, queueIndex) {
  promotions.forEach((promo) => {
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
}

/**
 * Apply metadata-based pre-filtering to new queue items
 * @param {Array} newQueueItems - New queue items to check
 * @param {Array} existingQueueSnapshot - Snapshot of queue BEFORE new items were added
 * @param {Array} uploadQueue - Current upload queue (for index building)
 * @param {Object} queueCore - Queue core utilities (for preFilterByMetadataAndPath)
 * @returns {Object} - { readyFiles: Array, preFilterTime: number }
 */
export function applyMetadataPrefilter(
  newQueueItems,
  existingQueueSnapshot,
  uploadQueue,
  queueCore
) {
  const preFilterT0 = performance.now();

  // Execute pre-filter logic
  const preFilterResult = queueCore.preFilterByMetadataAndPath(
    newQueueItems,
    existingQueueSnapshot
  );

  // Build queue index for O(1) lookups
  const queueIndex = buildQueueIndex(uploadQueue, newQueueItems);

  // Apply status updates
  markReadyFiles(preFilterResult.readyFiles);
  markTentativeDuplicates(preFilterResult.duplicateFiles, queueIndex);
  markTentativeCopies(preFilterResult.copyFiles, queueIndex);
  handlePromotions(preFilterResult.promotions, queueIndex);

  const preFilterTime = performance.now() - preFilterT0;

  // Return ready files and timing
  const readyFiles = newQueueItems.filter((f) => f.status === 'ready');

  return {
    readyFiles,
    preFilterTime,
    duplicateCount: preFilterResult.duplicateFiles.length,
    copyCount: preFilterResult.copyFiles.length,
  };
}
