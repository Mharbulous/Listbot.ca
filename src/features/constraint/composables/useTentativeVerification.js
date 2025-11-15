/**
 * Tentative Verification Composable
 * Automatically verifies tentative duplicates/copies in the background
 * after the initial queue rendering is complete.
 *
 * This composable:
 * 1. Auto-starts verification when queue addition is complete
 * 2. PHASE 1: Hashes reference files (those with tentativeGroupId) first
 * 3. PHASE 2: Verifies tentative files using two-phase deletion strategy:
 *    - Phase 2A: Visible files - animated fade-out before deletion (user feedback)
 *    - Phase 2B: Non-visible files - batched deletion (no animation, single re-render)
 * 4. Throttles hashing (one file at a time to avoid CPU spikes)
 * 5. Updates copy status from "Copy?" to "Copy"
 * 6. Moves newly discovered unique files to the top
 */

import { ref, watch, onUnmounted } from 'vue';
import { useQueueCore } from './useQueueCore.js';

/**
 * Composable for background tentative file verification
 * @param {Ref<Array>} uploadQueue - Reactive upload queue reference
 * @param {Function} removeFromQueue - Function to remove a file from the queue
 * @param {Function} sortQueueByGroupTimestamp - Function to sort the queue
 * @returns {Object} Verification state and controls
 */
export function useTentativeVerification(uploadQueue, removeFromQueue, sortQueueByGroupTimestamp) {
  // Get hash generation function
  const queueCore = useQueueCore();

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
   * PHASE 1 NOTE: Excludes Phase 1 files (which have xxh3Hash) - those are already verified
   * @returns {Array} Array of tentative files
   */
  const getTentativeFiles = () => {
    return uploadQueue.value.filter(
      (file) => (file.status === 'duplicate' || file.status === 'copy') && !file.hash && !file.xxh3Hash
    );
  };

  /**
   * Verify a single tentative file
   * @param {Object} file - The file to verify
   * @returns {Promise<Object>} Verification result
   */
  const verifyTentativeFile = async (file) => {
    console.log('[TENTATIVE-VERIFY] Verifying file:', file.name);

    // Calculate hash with error handling
    let hash;
    try {
      hash = await queueCore.generateFileHash(file.sourceFile);
      file.hash = hash;
    } catch (error) {
      console.error('[TENTATIVE-VERIFY] Hash calculation failed:', {
        file: file.name,
        error: error.message,
      });
      file.status = 'read error';
      file.errorMessage = error.message;
      file.canUpload = false;
      return { verified: false, error: error.message };
    }

    // Find the reference file (the primary file this was tentatively matching)
    const referenceFile = uploadQueue.value.find((f) => f.id === file.referenceFileId);

    if (!referenceFile) {
      console.error('[TENTATIVE-VERIFY] Reference file not found:', {
        file: file.name,
        referenceFileId: file.referenceFileId,
      });
      // Fail-safe: treat as ready to avoid data loss
      file.status = 'ready';
      file.canUpload = true;
      file.isDuplicate = false;
      file.isCopy = false;
      delete file.tentativeGroupId;
      delete file.referenceFileId;
      return { verified: false, mismatch: true, statusChange: 'ready' };
    }

    // Ensure reference file has a hash (BLAKE3 or XXH3 for Phase 1 compatibility)
    const referenceHash = referenceFile.hash || referenceFile.xxh3Hash;
    if (!referenceHash) {
      console.error('[TENTATIVE-VERIFY] Reference file has no hash:', {
        file: file.name,
        referenceFile: referenceFile.name,
      });
      // Fail-safe: treat as ready to avoid data loss
      file.status = 'ready';
      file.canUpload = true;
      file.isDuplicate = false;
      file.isCopy = false;
      delete file.tentativeGroupId;
      delete file.referenceFileId;
      return { verified: false, mismatch: true, statusChange: 'ready' };
    }

    // Compare hashes
    if (hash !== referenceHash) {
      // Hash mismatch - this is actually a unique file!
      console.log('[TENTATIVE-VERIFY] Hash mismatch - promoting to ready:', {
        file: file.name,
        fileHash: hash.substring(0, 8) + '...',
        referenceHash: referenceHash.substring(0, 8) + '...',
      });

      file.status = 'ready';
      file.canUpload = true;
      file.isDuplicate = false;
      file.isCopy = false;
      delete file.tentativeGroupId;
      delete file.referenceFileId;

      // Set groupTimestamp to now so it moves to the top
      file.groupTimestamp = Date.now();

      return { verified: false, mismatch: true, statusChange: 'ready' };
    }

    // Hash matches - verify the status
    if (file.status === 'duplicate') {
      // Verified duplicate - should be removed
      console.log('[TENTATIVE-VERIFY] Verified duplicate:', file.name);
      return { verified: true, statusChange: 'duplicate', shouldRemove: true };
    } else if (file.status === 'copy') {
      // Verified copy - just update status (remove "?")
      console.log('[TENTATIVE-VERIFY] Verified copy:', file.name);
      // Status stays as 'copy', but now it has a hash so the "?" will disappear
      return { verified: true, statusChange: 'copy', shouldRemove: false };
    }

    return { verified: true };
  };

  /**
   * Hash all reference files that need hashing
   * Reference files are identified by having a tentativeGroupId set
   * PHASE 1 NOTE: Excludes Phase 1 files (which have xxh3Hash) - those are already verified
   * @returns {Promise<number>} Number of reference files hashed
   */
  const hashReferenceFiles = async () => {
    // Find all reference files (files with tentativeGroupId) that need hashing
    // Skip Phase 1 files (which already have xxh3Hash)
    const referenceFiles = uploadQueue.value.filter(
      (file) => file.tentativeGroupId && !file.hash && !file.xxh3Hash
    );

    if (referenceFiles.length === 0) {
      return 0;
    }

    console.log('[TENTATIVE-VERIFY] Hashing reference files:', {
      totalReferenceFiles: referenceFiles.length,
    });

    // Hash reference files one at a time (smallest first for quick wins)
    const sortedReferenceFiles = [...referenceFiles].sort((a, b) => a.size - b.size);

    let hashedCount = 0;
    for (const refFile of sortedReferenceFiles) {
      // Re-check if file still exists and still needs hashing
      // Skip Phase 1 files (which already have xxh3Hash)
      const currentFile = uploadQueue.value.find((f) => f.id === refFile.id);
      if (!currentFile || currentFile.hash || currentFile.xxh3Hash) {
        continue;
      }

      try {
        const hash = await queueCore.generateFileHash(currentFile.sourceFile);
        currentFile.hash = hash;
        hashedCount++;
        console.log('[TENTATIVE-VERIFY] Hashed reference file:', {
          name: currentFile.name,
          hash: hash.substring(0, 8) + '...',
        });
      } catch (error) {
        console.error('[TENTATIVE-VERIFY] Failed to hash reference file:', {
          name: currentFile.name,
          error: error.message,
        });
        // Mark as error so verification can handle it
        currentFile.status = 'read error';
        currentFile.errorMessage = error.message;
        currentFile.canUpload = false;
      }
    }

    console.log('[TENTATIVE-VERIFY] Reference file hashing complete:', {
      hashedCount,
      totalReferenceFiles: referenceFiles.length,
    });

    return hashedCount;
  };

  /**
   * Get IDs of files currently visible in the viewport
   * @returns {Set<string>} Set of file IDs that are currently visible
   */
  const getVisibleFileIds = () => {
    const scrollContainer = document.querySelector('.scrollable-content');
    if (!scrollContainer) {
      console.log('[TENTATIVE-VERIFY] Scroll container not found');
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

    console.log('[TENTATIVE-VERIFY] Detected visible files:', visibleIds.size);
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
   * Processes all tentative files in the queue
   */
  const startVerification = async () => {
    // Prevent multiple verification processes
    if (isVerificationRunning) {
      console.log('[TENTATIVE-VERIFY] Verification already running, skipping');
      return;
    }

    const tentativeFiles = getTentativeFiles();

    if (tentativeFiles.length === 0) {
      console.log('[TENTATIVE-VERIFY] No tentative files to verify');
      return;
    }

    console.log('[TENTATIVE-VERIFY] Starting verification process:', {
      totalTentativeFiles: tentativeFiles.length,
    });

    isVerificationRunning = true;
    verificationState.value.isVerifying = true;
    verificationState.value.processed = 0;
    verificationState.value.total = tentativeFiles.length;

    // PHASE 1: Hash all reference files first
    // This ensures reference files have hashes before we verify tentative files against them
    await hashReferenceFiles();

    // PHASE 2: Verify tentative files with two-phase deletion strategy
    // Detect which files are currently visible in the viewport
    const visibleFileIds = getVisibleFileIds();

    console.log('[TENTATIVE-VERIFY] Two-phase deletion strategy:', {
      totalTentativeFiles: tentativeFiles.length,
      visibleFiles: visibleFileIds.size,
      nonVisibleFiles: tentativeFiles.length - visibleFileIds.size,
    });

    // Separate files into visible and non-visible
    const visibleFiles = [];
    const nonVisibleFiles = [];

    tentativeFiles.forEach((file) => {
      if (visibleFileIds.has(file.id)) {
        visibleFiles.push(file);
      } else {
        nonVisibleFiles.push(file);
      }
    });

    // PHASE 2A: Process visible files with animation feedback
    // These get individual animated deletions so user sees progress
    console.log('[TENTATIVE-VERIFY] Phase 2A: Processing visible files with animation');
    for (const file of visibleFiles) {
      // Re-check if file still exists and is still tentative
      // Skip Phase 1 files (which already have xxh3Hash)
      const currentFile = uploadQueue.value.find((f) => f.id === file.id);
      if (!currentFile || currentFile.hash || currentFile.xxh3Hash) {
        console.log('[TENTATIVE-VERIFY] File no longer tentative, skipping:', file.name);
        verificationState.value.processed++;
        continue;
      }

      const result = await verifyTentativeFile(currentFile);

      if (result.shouldRemove) {
        // Apply fade-out animation before removing
        await animateFileDeletion(currentFile.id);
        removeFromQueue(currentFile.id);
      } else if (result.statusChange === 'ready') {
        // File was promoted to ready - resort queue to move it to top
        sortQueueByGroupTimestamp();
      }

      verificationState.value.processed++;
    }

    // PHASE 2B: Process non-visible files (batched deletion)
    // Process bottom-to-top to minimize impact, batch all deletions at end
    console.log('[TENTATIVE-VERIFY] Phase 2B: Processing non-visible files (batched)');
    const sortedNonVisibleFiles = [...nonVisibleFiles].reverse();
    const filesToRemove = [];

    for (const file of sortedNonVisibleFiles) {
      // Re-check if file still exists and is still tentative
      // Skip Phase 1 files (which already have xxh3Hash)
      const currentFile = uploadQueue.value.find((f) => f.id === file.id);
      if (!currentFile || currentFile.hash || currentFile.xxh3Hash) {
        console.log('[TENTATIVE-VERIFY] File no longer tentative, skipping:', file.name);
        verificationState.value.processed++;
        continue;
      }

      const result = await verifyTentativeFile(currentFile);

      if (result.shouldRemove) {
        // Collect for batch deletion (no animation needed - not visible)
        filesToRemove.push(currentFile.id);
      } else if (result.statusChange === 'ready') {
        // File was promoted to ready - resort queue to move it to top
        sortQueueByGroupTimestamp();
      }

      verificationState.value.processed++;
    }

    // Batch remove all non-visible verified duplicates
    // This causes only ONE re-render instead of many
    console.log('[TENTATIVE-VERIFY] Batch removing non-visible files:', filesToRemove.length);
    filesToRemove.forEach((id) => removeFromQueue(id));

    // Sort queue one final time to ensure everything is in the right place
    sortQueueByGroupTimestamp();

    console.log('[TENTATIVE-VERIFY] Verification complete:', {
      totalProcessed: verificationState.value.processed,
    });

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
          console.log('[TENTATIVE-VERIFY] Queue addition complete, auto-starting verification');
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
          console.log('[TENTATIVE-VERIFY] New tentative files detected, starting verification');
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
