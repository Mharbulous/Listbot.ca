/**
 * Tentative Verification Composable
 * Automatically verifies tentative duplicates/copies in the background
 * after the initial queue rendering is complete.
 *
 * This composable:
 * 1. Auto-starts verification when queue addition is complete
 * 2. PHASE 1: Hashes reference files (those with tentativeGroupId) first
 * 3. PHASE 2: Verifies tentative files against their hashed references
 * 4. Processes files by size (smallest first for quick wins)
 * 5. Throttles hashing (one file at a time to avoid CPU spikes)
 * 6. Removes verified duplicates immediately
 * 7. Updates copy status from "Copy?" to "Copy"
 * 8. Moves newly discovered unique files to the top
 */

import { ref, watch } from 'vue';
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
   * @returns {Array} Array of tentative files
   */
  const getTentativeFiles = () => {
    return uploadQueue.value.filter(
      (file) => (file.status === 'duplicate' || file.status === 'copy') && !file.hash
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

    // Ensure reference file has a hash
    if (!referenceFile.hash) {
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
    if (hash !== referenceFile.hash) {
      // Hash mismatch - this is actually a unique file!
      console.log('[TENTATIVE-VERIFY] Hash mismatch - promoting to ready:', {
        file: file.name,
        fileHash: hash.substring(0, 8) + '...',
        referenceHash: referenceFile.hash.substring(0, 8) + '...',
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
   * @returns {Promise<number>} Number of reference files hashed
   */
  const hashReferenceFiles = async () => {
    // Find all reference files (files with tentativeGroupId) that need hashing
    const referenceFiles = uploadQueue.value.filter(
      (file) => file.tentativeGroupId && !file.hash
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
      const currentFile = uploadQueue.value.find((f) => f.id === refFile.id);
      if (!currentFile || currentFile.hash) {
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

    // PHASE 2: Verify tentative files against their references
    // Sort tentative files by size (smallest first for quick wins)
    const sortedTentativeFiles = [...tentativeFiles].sort((a, b) => a.size - b.size);

    // Process files one at a time (throttled to avoid CPU spikes)
    for (const file of sortedTentativeFiles) {
      // Re-check if file still exists and is still tentative (might have been removed/modified)
      const currentFile = uploadQueue.value.find((f) => f.id === file.id);
      if (!currentFile || currentFile.hash) {
        console.log('[TENTATIVE-VERIFY] File no longer tentative, skipping:', file.name);
        verificationState.value.processed++;
        continue;
      }

      const result = await verifyTentativeFile(currentFile);

      if (result.shouldRemove) {
        // Remove verified duplicate from queue
        removeFromQueue(currentFile.id);
      } else if (result.statusChange === 'ready') {
        // File was promoted to ready - resort queue to move it to top
        sortQueueByGroupTimestamp();
      }

      verificationState.value.processed++;
    }

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
   */
  const setupAutoStart = () => {
    const checkInterval = setInterval(() => {
      if (window.queueAdditionComplete && !isVerificationRunning) {
        const tentativeFiles = getTentativeFiles();
        if (tentativeFiles.length > 0) {
          console.log('[TENTATIVE-VERIFY] Queue addition complete, auto-starting verification');
          clearInterval(checkInterval);
          // Use setTimeout to ensure this runs after the current call stack clears
          setTimeout(() => {
            startVerification();
          }, 100);
        }
      }
    }, 100);

    // Cleanup after 30 seconds (safety timeout)
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  };

  // Set up auto-start on mount
  setupAutoStart();

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
