/**
 * Sequential Verification Composable
 * Automatically verifies Copy/Duplicate files using hash verification in the background
 * after the initial queue rendering is complete.
 *
 * This composable:
 * 1. Auto-starts verification when queue addition is complete
 * 2. Calls Stage 2 hash verification (verifyHashesForCopiesAndDuplicates)
 * 3. Applies changes using two-phase deletion strategy:
 *    - Phase 2A: Visible files - animated fade-out before deletion (user feedback)
 *    - Phase 2B: Non-visible files - batched deletion (no animation, single re-render)
 * 4. Marks hash-verified duplicates as "redundant" for removal in next batch
 */

import { ref, watch, onUnmounted } from 'vue';

/**
 * Composable for background sequential hash verification
 * @param {Ref<Array>} uploadQueue - Reactive upload queue reference
 * @param {Function} removeFromQueue - Function to remove a file from the queue
 * @param {Function} sortQueueByGroupTimestamp - Function to sort the queue
 * @param {Function} verifyHashesForCopiesAndDuplicates - Stage 2 hash verification function
 * @returns {Object} Verification state and controls
 */
export function useSequentialVerification(
  uploadQueue,
  removeFromQueue,
  sortQueueByGroupTimestamp,
  verifyHashesForCopiesAndDuplicates
) {
  // Verification state
  const verificationState = ref({
    isVerifying: false,
    processed: 0,
    total: 0,
  });

  // Flag to prevent multiple verification processes
  let isVerificationRunning = false;

  /**
   * Get all files that need hash verification
   * Files with status 'duplicate' or 'copy' that don't have a hash yet
   * @returns {Array} Array of files needing verification
   */
  const getFilesNeedingVerification = () => {
    return uploadQueue.value.filter(
      file => (file.status === 'duplicate' || file.status === 'copy') && !file.hash
    );
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
    uploadQueue.value.forEach(file => {
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
  const animateFileDeletion = async fileId => {
    const fileElement = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!fileElement) {
      return;
    }

    // Add fade-out animation class
    fileElement.classList.add('file-deletion-fade-out');

    // Wait for animation to complete (500ms duration)
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  /**
   * Start the verification process
   * Processes all Copy/Duplicate files using Stage 2 hash verification
   */
  const startVerification = async () => {
    // Prevent multiple verification processes
    if (isVerificationRunning) {
      return;
    }

    const filesNeedingVerification = getFilesNeedingVerification();

    if (filesNeedingVerification.length === 0) {
      return;
    }

    const verifyT0 = performance.now();

    console.log(
      `📊 [SEQUENTIAL-VERIFY] T=0.00ms - Starting Stage 2 hash verification: {files: ${filesNeedingVerification.length}}`
    );

    isVerificationRunning = true;
    verificationState.value.isVerifying = true;
    verificationState.value.processed = 0;
    verificationState.value.total = filesNeedingVerification.length;

    // Call Stage 2 hash verification
    const verificationResult = await verifyHashesForCopiesAndDuplicates();

    if (!verificationResult.verificationComplete) {
      console.error('[SEQUENTIAL-VERIFY] Verification failed:', verificationResult.stats);
      verificationState.value.isVerifying = false;
      isVerificationRunning = false;
      return;
    }

    // NOTE: Redundant files are NOT removed immediately
    // They will be removed in Stage 1 of the next batch (two-phase cleanup lifecycle)
    // Lifecycle: Duplicate → (hash match) → Redundant → (next batch Stage 1) → Removed
    const redundantFiles = uploadQueue.value.filter(file => file.status === 'redundant');

    if (redundantFiles.length > 0) {
      console.log(
        `  ├─ [LIFECYCLE] Marked ${redundantFiles.length} files as redundant (will be removed in next batch Stage 1)`
      );
    }

    // ========================================================================
    // Update groupTimestamp for verified duplicate groups
    // This ensures the primary file moves to the top when duplicates are verified
    // Similar to Phase 1.6 logic in useUploadTable-addition.js
    // ========================================================================
    const verifiedHashes = new Set();

    // Collect hashes from redundant files (verified duplicates)
    redundantFiles.forEach(file => {
      if (file.hash) {
        verifiedHashes.add(file.hash);
      }
    });

    // Also collect hashes from verified copies (files that stayed as 'copy' after hash verification)
    const verifiedCopies = uploadQueue.value.filter(
      file =>
        file.status === 'copy' &&
        file.hash &&
        filesNeedingVerification.some(f => f.id === file.id)
    );
    verifiedCopies.forEach(file => {
      if (file.hash) {
        verifiedHashes.add(file.hash);
      }
    });

    if (verifiedHashes.size > 0) {
      const currentTimestamp = Date.now();
      let groupTimestampUpdateCount = 0;

      // Update groupTimestamp for all files with verified hashes
      uploadQueue.value.forEach(file => {
        if (file.hash && verifiedHashes.has(file.hash)) {
          file.groupTimestamp = currentTimestamp;
          groupTimestampUpdateCount++;
        }
      });

      console.log(
        `  ├─ [GROUPING] Updated groupTimestamp for ${groupTimestampUpdateCount} files in ${verifiedHashes.size} verified groups`
      );
    }

    // Get files that were upgraded to primary (hash mismatch)
    const upgradedFiles = uploadQueue.value.filter(
      file =>
        file.isPrimary &&
        filesNeedingVerification.some(f => f.id === file.id && !f.isPrimary)
    );

    // Sort queue to move groups with updated timestamps to the top
    if (verifiedHashes.size > 0 || upgradedFiles.length > 0) {
      sortQueueByGroupTimestamp();
    }

    console.log(
      `  └─ [VERIFICATION] Upgraded ${verificationResult.stats.upgradedToPrimaryCount || 0} files to primary (hash mismatch)`
    );

    const totalTime = performance.now() - verifyT0;
    console.log(`📊 [SEQUENTIAL-VERIFY] T=${totalTime.toFixed(2)}ms - Complete\n`);

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
    let pollCount = 0;

    const checkInterval = setInterval(() => {
      const currentFlagState = window.queueAdditionComplete;
      pollCount++;

      // Debug logging every 10 polls (~1 second) if waiting for flag
      if (pollCount % 10 === 0 && !currentFlagState) {
        const filesNeedingVerification = getFilesNeedingVerification();
        console.log(`[SEQUENTIAL-VERIFY-DEBUG] Poll ${pollCount}: queueAdditionComplete=${currentFlagState}, filesNeedingVerification=${filesNeedingVerification.length}, isVerificationRunning=${isVerificationRunning}`);
      }

      // Detect transition from false -> true (new drop completed)
      if (currentFlagState && !lastFlagState && !isVerificationRunning) {
        const filesNeedingVerification = getFilesNeedingVerification();
        console.log(`[SEQUENTIAL-VERIFY-DEBUG] Flag transition detected! filesNeedingVerification=${filesNeedingVerification.length}`);
        if (filesNeedingVerification.length > 0) {
          console.log(`[SEQUENTIAL-VERIFY-DEBUG] Starting verification in 100ms...`);
          // Use setTimeout to ensure this runs after the current call stack clears
          setTimeout(() => {
            startVerification();
          }, 100);
        } else {
          console.log(`[SEQUENTIAL-VERIFY-DEBUG] No files need verification - skipping Stage 2`);
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

  // Also watch the upload queue for changes
  // This handles the case where files are added after initial queue is rendered
  watch(
    () => uploadQueue.value.length,
    () => {
      // Only auto-start if queue addition is complete and not already running
      if (window.queueAdditionComplete && !isVerificationRunning) {
        const filesNeedingVerification = getFilesNeedingVerification();
        if (filesNeedingVerification.length > 0) {
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
    getFilesNeedingVerification,
  };
}
