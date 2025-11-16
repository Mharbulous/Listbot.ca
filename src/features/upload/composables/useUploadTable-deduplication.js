import { useQueueCore } from './useQueueCore.js';
import { useQueueWorkers } from './useQueueWorkers.js';
import { applyMetadataPrefilter } from './deduplication/prefilter.js';
import { calculateHashGroups } from './deduplication/hashing.js';
import { detectDuplicatesAndCopies } from './deduplication/detection.js';

/**
 * Composable for managing upload queue deduplication
 * Handles metadata pre-filtering and hash-based deduplication
 *
 * Orchestrates 3-phase deduplication process:
 * 1. Metadata pre-filtering (before hash calculation)
 * 2. Hash calculation (web worker with fallback)
 * 3. Duplicate/copy detection (within hash groups)
 */
export function useUploadTableDeduplication(uploadQueue) {
  // Initialize deduplication logic
  const queueCore = useQueueCore();
  const queueWorkers = useQueueWorkers();

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
    console.log(
      `📊 [DEDUP] T=0.00ms - Starting: {new: ${newQueueItems.length}, existing: ${existingQueueSnapshot.length}}`
    );

    // ========================================================================
    // PHASE 1: Metadata Pre-Filter (BEFORE hash calculation)
    // Mark files as tentative duplicates/copies based on metadata + folder path
    // Hash calculation deferred to verification trigger points
    // ========================================================================
    const preFilterResult = applyMetadataPrefilter(
      newQueueItems,
      existingQueueSnapshot,
      uploadQueue.value,
      queueCore
    );

    const { readyFiles, preFilterTime, duplicateCount, copyCount } = preFilterResult;

    // Log prefilter results
    console.log(
      `  ├─ [PREFILTER] Complete: {ready: ${readyFiles.length}, dupe: ${duplicateCount}, copy: ${copyCount}} (${preFilterTime.toFixed(2)}ms)`
    );

    // Early exit if all files pre-filtered
    if (readyFiles.length === 0) {
      console.log('  └─ [HASH] Skipped - all files pre-filtered');
      const totalTime = performance.now() - dedupT0;
      console.log(`📊 [DEDUP] T=${totalTime.toFixed(2)}ms - Complete\n`);
      return newQueueItems;
    }

    // ========================================================================
    // PHASE 2: Hash Calculation
    // Only hash files that weren't pre-filtered as duplicates/copies
    // Uses web worker for performance, fallback to main thread
    // ========================================================================
    const hashResult = await calculateHashGroups(
      readyFiles,
      existingQueueSnapshot,
      queueCore,
      queueWorkers
    );

    const { hashGroups, hashTime, hashedCount, sizeGroupTime } = hashResult;

    // Early exit if all files have unique sizes
    if (hashGroups.size === 0) {
      console.log('  └─ [HASH] Skipped - all unique sizes');
      const totalTime = performance.now() - dedupT0;
      console.log(`📊 [DEDUP] T=${totalTime.toFixed(2)}ms - Complete\n`);
      return newQueueItems;
    }

    // Log hash results
    const avgHashTime = hashedCount > 0 ? (hashTime / hashedCount).toFixed(2) : '0.00';
    console.log(
      `  ├─ [HASH] Complete: {groups: ${hashGroups.size}, hashed: ${hashedCount}} (avg: ${avgHashTime}ms/file, total: ${hashTime.toFixed(2)}ms)`
    );

    // ========================================================================
    // PHASE 3: Duplicate & Copy Detection
    // Check for duplicates within hash groups
    // Mark redundant files and identify copies
    // ========================================================================
    detectDuplicatesAndCopies(hashGroups, queueCore);

    const totalTime = performance.now() - dedupT0;
    console.log(`📊 [DEDUP] T=${totalTime.toFixed(2)}ms - Complete\n`);

    return newQueueItems;
  };

  return {
    deduplicateAgainstExisting,
  };
}
