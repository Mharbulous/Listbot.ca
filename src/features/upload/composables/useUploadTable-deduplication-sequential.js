import { useQueueCore } from './useQueueCore.js';
import { applySequentialPrefilter, verifyWithHashing } from './useSequentialPrefilter.js';
import { useSequentialHashWorker } from './useSequentialHashWorker.js';

/**
 * Sequential Deduplication Composable
 *
 * Implements optimized 2-stage deduplication:
 * 1. Stage 1 (Pre-filter): Sort ALL files and do sequential metadata comparison
 * 2. Stage 2 (Hash verification): Only hash files marked as Copy/Duplicate for verification
 *
 * Benefits:
 * - Linear complexity: O(n log n) for sorting + O(n) for sequential scan
 * - Delays expensive hashing until after metadata filtering
 * - Only hashes likely duplicates (not all files)
 */
export function useUploadTableDeduplicationSequential(uploadQueue) {
  // Initialize core utilities
  const queueCore = useQueueCore();

  // Initialize Web Worker for hash verification
  const hashWorker = useSequentialHashWorker();

  // Flag to track if pre-filter is complete
  let preFilterComplete = false;

  // Store sorted files for hash verification stage
  let sortedFilesCache = [];

  /**
   * Deduplicate files using sequential pre-filter approach
   * @param {Array} newQueueItems - New queue items to check
   * @param {Array} existingQueueSnapshot - Snapshot of queue BEFORE new items were added
   * @returns {Promise<Array>} - Queue items with duplicate status updated
   */
  const deduplicateAgainstExisting = async (newQueueItems, existingQueueSnapshot) => {
    const dedupT0 = performance.now();
    console.log(
      `📊 [DEDUP-SEQUENTIAL] T=0.00ms - Starting: {new: ${newQueueItems.length}, existing: ${existingQueueSnapshot.length}}`
    );

    // DEBUG: Log file names in this deduplication batch
    const newFileNames = newQueueItems.map(item => item.name).slice(0, 5);
    console.log(`  │  [DEDUP-DEBUG] New files in batch: ${newFileNames.join(', ')}${newQueueItems.length > 5 ? ` ... and ${newQueueItems.length - 5} more` : ''}`);

    // ========================================================================
    // STAGE 1: Sequential Pre-filter (Main Thread)
    // Sort ALL files (existing + new) and perform sequential metadata comparison
    // Mark files as Primary, Copy, or Duplicate based on metadata + path
    // ========================================================================

    // Combine all files for sorting
    const allFiles = [...existingQueueSnapshot, ...newQueueItems];

    // Reset pre-filter flag
    preFilterComplete = false;

    // Apply sequential pre-filter
    const preFilterResult = applySequentialPrefilter(allFiles);
    const { sortedFiles, stats: preFilterStats } = preFilterResult;

    // Store sorted files for hash verification stage
    sortedFilesCache = sortedFiles;

    // Mark pre-filter as complete
    preFilterComplete = true;

    // Log prefilter results
    console.log(
      `  ├─ [PREFILTER] Complete: {primary: ${preFilterStats.primaryCount}, copy: ${preFilterStats.copyCount}, duplicate: ${preFilterStats.duplicateCount}} (${preFilterStats.preFilterTime.toFixed(2)}ms)`
    );

    const totalTime = performance.now() - dedupT0;
    console.log(`📊 [DEDUP-SEQUENTIAL] T=${totalTime.toFixed(2)}ms - Stage 1 Complete\n`);

    // NOTE: Stage 2 (Hash Verification) is triggered automatically after queue addition
    // by useSequentialVerification composable, which calls verifyHashesForCopiesAndDuplicates()

    return newQueueItems;
  };

  /**
   * Verify hashes for Copy/Duplicate files
   * This should be called after pre-filter is complete
   * @returns {Promise<Object>} - Verification stats
   */
  const verifyHashesForCopiesAndDuplicates = async () => {
    console.log('[DEDUP-SEQUENTIAL] Starting Stage 2: Hash verification');

    // Initialize Web Worker if not already done
    if (!hashWorker.isWorkerReady || !hashWorker.isWorkerReady.value) {
      console.log('[DEDUP-SEQUENTIAL] Initializing Web Worker for hash verification...');
      await hashWorker.initWorker();
    }

    // Check if pre-filter is complete
    const checkPreFilterComplete = () => preFilterComplete;

    // Use cached sorted files if available, otherwise use current queue
    const filesToVerify = sortedFilesCache.length > 0 ? sortedFilesCache : uploadQueue.value;

    // Verify hashes using the sequential verification approach
    // Pass Web Worker as 4th parameter (will fall back to main thread if worker unavailable)
    const verificationResult = await verifyWithHashing(
      filesToVerify,
      queueCore.generateFileHash,
      checkPreFilterComplete,
      hashWorker
    );

    return verificationResult;
  };

  return {
    deduplicateAgainstExisting,
    verifyHashesForCopiesAndDuplicates,
  };
}
