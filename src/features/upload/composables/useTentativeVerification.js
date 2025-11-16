/**
 * Tentative Verification Composable
 * Automatically verifies tentative duplicates/copies in the background
 * after the initial queue rendering is complete.
 *
 * This composable:
 * 1. Auto-starts verification when queue addition is complete
 * 2. PHASE 1: Verifies tentative files using metadata comparison (size+name+date)
 *    - No content hashing needed (files already matched on metadata)
 *    - Confirms metadata match still holds or promotes to ready
 * 3. PHASE 2: Applies changes using two-phase deletion strategy:
 *    - Phase 2A: Visible files - animated fade-out before deletion (user feedback)
 *    - Phase 2B: Non-visible files - batched deletion (no animation, single re-render)
 * 4. Updates copy status from "Copy?" to "Copy"
 * 5. Moves newly discovered unique files to the top
 */

import { ref, watch, onUnmounted } from 'vue';

/**
 * Composable for background tentative file verification
 * @param {Ref<Array>} uploadQueue - Reactive upload queue reference
 * @param {Function} removeFromQueue - Function to remove a file from the queue
 * @param {Function} sortQueueByGroupTimestamp - Function to sort the queue
 * @returns {Object} Verification state and controls
 */
export function useTentativeVerification(uploadQueue, removeFromQueue, sortQueueByGroupTimestamp) {

  // Verification state
  const verificationState = ref({
    isVerifying: false,
    processed: 0,
    total: 0,
  });

  // Flag to prevent multiple verification processes
  let isVerificationRunning = false;

  /**
   * Get all tentative files from the queue
   * Tentative files: files with status 'duplicate' or 'copy' but NO hash
   * @returns {Array} Array of tentative files
   */
  const getTentativeFiles = () => {
    return uploadQueue.value.filter(
      (file) => (file.status === 'duplicate' || file.status === 'copy') && !file.hash
    );
  };

  /**
   * Verify tentative files using metadata comparison (no hashing needed)
   * Tentative files were marked as duplicates because their metadata (size+name+date)
   * matched existing queue files. We just need to confirm that match still holds.
   *
   * @param {Array} tentativeFiles - Files to verify
   * @returns {Object} Verification results with status changes
   */
  const verifyTentativeFilesOptimized = (tentativeFiles) => {
    const verifyT0 = performance.now();

    // Step 1: Build size-keyed map of reference file metadata
    const referenceFiles = uploadQueue.value.filter((f) => f.tentativeGroupId);
    const referenceBySizeMap = new Map(); // size -> Set of metadata strings

    referenceFiles.forEach((file) => {
      const size = file.sourceFile.size;
      const metadataKey = `${size}_${file.sourceFile.name}_${file.sourceFile.lastModified}`;

      if (!referenceBySizeMap.has(size)) {
        referenceBySizeMap.set(size, new Set());
      }
      referenceBySizeMap.get(size).add(metadataKey);
    });

    // Step 2: Verify each tentative file by metadata comparison
    const results = {
      duplicatesConfirmed: [],
      copiesConfirmed: [],
      promotedToReady: [],
    };

    tentativeFiles.forEach((file) => {
      const size = file.sourceFile.size;
      const metadataKey = `${size}_${file.sourceFile.name}_${file.sourceFile.lastModified}`;

      // Check if this size exists in references
      const referencesWithSize = referenceBySizeMap.get(size);

      if (!referencesWithSize || !referencesWithSize.has(metadataKey)) {
        // No metadata match - promote to ready
        file.status = 'ready';
        file.canUpload = true;
        file.isDuplicate = false;
        file.isCopy = false;
        delete file.tentativeGroupId;
        delete file.referenceFileId;
        file.groupTimestamp = Date.now();
        results.promotedToReady.push(file);
      } else {
        // Metadata match confirmed
        if (file.status === 'duplicate') {
          results.duplicatesConfirmed.push(file);
        } else if (file.status === 'copy') {
          results.copiesConfirmed.push(file);
        }
      }
    });

    const totalTime = performance.now() - verifyT0;

    console.log(
      `  ├─ [VERIFY-OPTIMIZED] ${tentativeFiles.length} files verified by metadata in ${totalTime.toFixed(2)}ms (no hashing)`
    );
    console.log(
      `  │  Confirmed: ${results.duplicatesConfirmed.length} duplicates, ${results.copiesConfirmed.length} copies | Promoted: ${results.promotedToReady.length}`
    );

    return { results, totalTime };
  };

  /**
   * Get IDs of files currently visible in the viewport
   * @returns {Set<string>} Set of file IDs that are currently visible
   */
  const getVisibleFileIds = () => {
    const scrollContainer = document.querySelector('.scrollable-content');
    if (!scrollContainer) {
      return new Set();
    }

    const containerRect = scrollContainer.getBoundingClientRect();
    const visibleIds = new Set();

    // Check each file item in the queue
    uploadQueue.value.forEach((file) => {
      const fileElement = document.querySelector(`[data-file-id="${file.id}"]`);
      if (fileElement) {
        const rect = fileElement.getBoundingClientRect();
        // Check if element is within visible viewport (with small buffer)
        if (rect.top < containerRect.bottom + 50 && rect.bottom > containerRect.top - 50) {
          visibleIds.add(file.id);
        }
      }
    });

    return visibleIds;
  };

  /**
   * Apply fade-out animation to a file element
   * @param {string} fileId - The ID of the file to animate
   * @returns {Promise<void>} Resolves when animation completes
   */
  const animateFileDeletion = async (fileId) => {
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileElement) {
      return;
    }

    // Add fade-out animation class
    fileElement.classList.add('file-deletion-fade-out');

    // Wait for animation to complete (500ms duration)
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  /**
   * Start the verification process
   * Processes all tentative files in the queue using metadata-only comparison
   */
  const startVerification = async () => {
    // Prevent multiple verification processes
    if (isVerificationRunning) {
      return;
    }

    const tentativeFiles = getTentativeFiles();

    if (tentativeFiles.length === 0) {
      return;
    }

    const verifyT0 = performance.now();

    // Count reference files
    const referenceFileCount = uploadQueue.value.filter((file) => file.tentativeGroupId).length;

    console.log(
      `📊 [VERIFY] T=0.00ms - Starting: {tentative: ${tentativeFiles.length}, reference: ${referenceFileCount}}`
    );

    isVerificationRunning = true;
    verificationState.value.isVerifying = true;
    verificationState.value.processed = 0;
    verificationState.value.total = tentativeFiles.length;

    // PHASE 1: Verify all tentative files using metadata comparison (no hashing!)
    const { results } = verifyTentativeFilesOptimized(tentativeFiles);

    // PHASE 2: Apply changes with two-phase deletion strategy for user feedback
    // Detect which files are currently visible in the viewport
    const visibleFileIds = getVisibleFileIds();

    // Separate confirmed duplicates into visible and non-visible
    const visibleDuplicates = results.duplicatesConfirmed.filter((file) =>
      visibleFileIds.has(file.id)
    );
    const nonVisibleDuplicates = results.duplicatesConfirmed.filter(
      (file) => !visibleFileIds.has(file.id)
    );

    // Track deletion stats
    let duplicatesRemoved = 0;

    // PHASE 2A: Process visible duplicates with animation feedback
    for (const file of visibleDuplicates) {
      // Apply fade-out animation before removing
      await animateFileDeletion(file.id);
      removeFromQueue(file.id);
      duplicatesRemoved++;
      verificationState.value.processed++;
    }

    // PHASE 2B: Batch remove non-visible duplicates (no animation needed)
    if (nonVisibleDuplicates.length > 0) {
      nonVisibleDuplicates.forEach((file) => {
        removeFromQueue(file.id);
        duplicatesRemoved++;
        verificationState.value.processed++;
      });
    }

    // Update progress for copies and promoted files
    verificationState.value.processed += results.copiesConfirmed.length;
    verificationState.value.processed += results.promotedToReady.length;

    // Sort queue to move promoted files to the top
    if (results.promotedToReady.length > 0) {
      sortQueueByGroupTimestamp();
    }

    console.log(
      `  └─ [CLEANUP] Removed ${duplicatesRemoved} duplicates, verified ${results.copiesConfirmed.length} copies, promoted ${results.promotedToReady.length} to ready`
    );

    const totalTime = performance.now() - verifyT0;
    console.log(`📊 [VERIFY] T=${totalTime.toFixed(2)}ms - Complete\n`);

    verificationState.value.isVerifying = false;
    isVerificationRunning = false;
  };

  /**
   * Watch for queue addition completion to auto-start verification
   * Polls window.queueAdditionComplete every 100ms
   * The interval persists throughout the component lifecycle to handle multiple drops
   */
  const setupAutoStart = () => {
    let lastFlagState = false; // Track flag state to detect transitions

    const checkInterval = setInterval(() => {
      const currentFlagState = window.queueAdditionComplete;

      // Detect transition from false -> true (new drop completed)
      if (currentFlagState && !lastFlagState && !isVerificationRunning) {
        const tentativeFiles = getTentativeFiles();
        if (tentativeFiles.length > 0) {
          // Use setTimeout to ensure this runs after the current call stack clears
          setTimeout(() => {
            startVerification();
          }, 100);
        }
      }

      lastFlagState = currentFlagState;
    }, 100);

    // Return cleanup function for component unmount
    return () => clearInterval(checkInterval);
  };

  // Set up auto-start on mount and store cleanup function
  const cleanupAutoStart = setupAutoStart();

  // Clean up interval on component unmount
  onUnmounted(() => {
    cleanupAutoStart();
  });

  // Also watch the upload queue for changes to tentative files
  // This handles the case where files are added after initial queue is rendered
  watch(
    () => uploadQueue.value.length,
    () => {
      // Only auto-start if queue addition is complete and not already running
      if (window.queueAdditionComplete && !isVerificationRunning) {
        const tentativeFiles = getTentativeFiles();
        if (tentativeFiles.length > 0) {
          setTimeout(() => {
            startVerification();
          }, 500); // Small delay to batch rapid changes
        }
      }
    }
  );

  return {
    verificationState,
    startVerification,
    getTentativeFiles,
  };
}
