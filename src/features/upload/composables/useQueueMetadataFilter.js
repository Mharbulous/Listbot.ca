/**
 * Queue Metadata Filter Composable
 *
 * Phase 3a optimization: Pre-filter files by metadata and folder path hierarchy BEFORE hash calculation
 * Reduces initial processing time from ~10s to <2s for 1000-file double drop
 *
 * DEDUPLICATION TERMINOLOGY:
 * - "duplicate": Files with identical content (hash) and core metadata where folder path variations
 *                have no informational value. Duplicates are not uploaded and their metadata is not copied.
 * - "copy": Files with the same hash value but different file metadata that IS meaningful.
 *           Copies are not uploaded to storage, but their metadata is recorded for informational value.
 * - "best" or "primary": The file with the most meaningful metadata that will be uploaded to storage.
 */
export function useQueueMetadataFilter() {
  /**
   * Find best matching file based on folder path hierarchy
   * Longer paths are "more specific" and win over shorter paths
   * @param {Object} newFile - New queue item to compare
   * @param {Array} existingMatches - Array of existing queue items with matching metadata
   * @returns {Object} - { file, type } where type is 'duplicate', 'promote_new', 'keep_existing', or 'copy'
   */
  const findBestMatchingFile = (newFile, existingMatches) => {
    const newFolderPath = newFile.folderPath;
    let bestMatch = null;
    let bestMatchScore = -1;
    let bestMatchType = null;

    for (const existing of existingMatches) {
      const existingFolderPath = existing.folderPath;

      // STOP immediately on exact match (highest priority)
      if (newFolderPath === existingFolderPath) {
        return { file: existing, type: 'duplicate' };
      }

      // NEW is more specific (longer) - ends with EXISTING path
      if (newFolderPath.endsWith(existingFolderPath)) {
        const score = existingFolderPath.length; // Longer suffix = better match
        if (score > bestMatchScore) {
          bestMatch = existing;
          bestMatchScore = score;
          bestMatchType = 'promote_new'; // Demote EXISTING, NEW becomes primary
        }
      }
      // EXISTING is more specific (longer) - ends with NEW path
      else if (existingFolderPath.endsWith(newFolderPath)) {
        const score = newFolderPath.length;
        if (score > bestMatchScore) {
          bestMatch = existing;
          bestMatchScore = score;
          bestMatchType = 'keep_existing'; // NEW is duplicate of EXISTING
        }
      }
    }

    // No parent/child match found → mark as copy of first match
    return {
      file: bestMatch || existingMatches[0],
      type: bestMatch ? bestMatchType : 'copy',
    };
  };

  /**
   * Pre-filter files by metadata and folder path hierarchy BEFORE hash calculation
   * Phase 3a optimization: Reduces initial processing time from ~10s to <2s for 1000-file double drop
   *
   * @param {Array} newQueueItems - New queue items to filter
   * @param {Array} existingQueue - Existing queue items (snapshot from BEFORE new items added)
   * @returns {Object} - { readyFiles, duplicateFiles, copyFiles, promotions }
   */
  const preFilterByMetadataAndPath = (newQueueItems, existingQueue) => {
    const t0 = performance.now();

    const readyFiles = [];
    const duplicateFiles = [];
    const copyFiles = [];
    const promotions = [];

    // OPTIMIZATION: Build size map first (O(M) - one-time cost)
    // This groups existing files by size to reduce metadata comparisons from O(N×M) to O(N×k)
    // where k = avg files per size bucket (typically 3-5, not M which could be 1000+)
    const existingSizeMap = new Map();
    existingQueue.forEach((item) => {
      if (!existingSizeMap.has(item.size)) {
        existingSizeMap.set(item.size, []);
      }
      existingSizeMap.get(item.size).push(item);
    });

    // CRITICAL FIX: Pre-build metadata indices for EACH size group (O(M) total)
    // Previously this was built inside the new file loop = O(N×k) bug!
    // Now: Build once per size group, lookup O(1) per new file
    const metadataIndicesBySize = new Map();
    for (const [size, items] of existingSizeMap) {
      const metadataIndex = new Map();
      items.forEach((item) => {
        const metadataKey = `${item.name}_${item.size}_${item.sourceLastModified}`;
        if (!metadataIndex.has(metadataKey)) {
          metadataIndex.set(metadataKey, []);
        }
        metadataIndex.get(metadataKey).push(item);
      });
      metadataIndicesBySize.set(size, metadataIndex);
    }

    // Process each new file (O(N) with O(1) metadata lookups)
    newQueueItems.forEach((newFile) => {
      // EARLY EXIT: If size is unique, skip all metadata checks
      const existingSizeGroup = existingSizeMap.get(newFile.size);
      if (!existingSizeGroup || existingSizeGroup.length === 0) {
        readyFiles.push(newFile);
        return;
      }

      // Lookup pre-built metadata index for this size group (O(1))
      const metadataIndex = metadataIndicesBySize.get(newFile.size);

      // Check for metadata matches within same-size group
      const metadataKey = `${newFile.name}_${newFile.size}_${newFile.sourceLastModified}`;
      const existingMatches = metadataIndex.get(metadataKey);

      // No metadata matches → mark as ready
      if (!existingMatches || existingMatches.length === 0) {
        readyFiles.push(newFile);
        return;
      }

      // Find best match using folder path hierarchy
      const { file: bestMatch, type } = findBestMatchingFile(newFile, existingMatches);

      if (type === 'duplicate') {
        // Exact folder path match → NEW is duplicate of EXISTING
        duplicateFiles.push({
          file: newFile,
          referenceFileId: bestMatch.id,
        });
      } else if (type === 'promote_new') {
        // NEW is more specific → promote NEW to ready, demote EXISTING to duplicate
        readyFiles.push(newFile);
        promotions.push({
          existingFileId: bestMatch.id,
          newPrimaryId: newFile.id,
        });
      } else if (type === 'keep_existing') {
        // EXISTING is more specific → NEW is duplicate of EXISTING
        duplicateFiles.push({
          file: newFile,
          referenceFileId: bestMatch.id,
        });
      } else {
        // type === 'copy' - Different folder paths (not parent/child) → mark as copy
        copyFiles.push({
          file: newFile,
          referenceFileId: bestMatch.id,
        });
      }
    });

    const t1 = performance.now();
    console.log(`[METADATA-FILTER] Pre-filtering completed in ${(t1 - t0).toFixed(2)}ms`);
    console.log(`[METADATA-FILTER] Ready: ${readyFiles.length}, Duplicates: ${duplicateFiles.length}, Copies: ${copyFiles.length}, Promotions: ${promotions.length}`);

    return { readyFiles, duplicateFiles, copyFiles, promotions };
  };

  return {
    findBestMatchingFile,
    preFilterByMetadataAndPath,
  };
}
