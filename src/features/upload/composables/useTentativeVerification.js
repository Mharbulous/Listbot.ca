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
import { useQueueWorkers } from './useQueueWorkers.js';

/**
 * Composable for background tentative file verification
 * @param {Ref<Array>} uploadQueue - Reactive upload queue reference
 * @param {Function} removeFromQueue - Function to remove a file from the queue
 * @param {Function} sortQueueByGroupTimestamp - Function to sort the queue
 * @returns {Object} Verification state and controls
 */
export function useTentativeVerification(uploadQueue, removeFromQueue, sortQueueByGroupTimestamp) {
  // Get hash generation function (fallback only)
  const queueCore = useQueueCore();
  // Get web worker for batch hash processing
  const queueWorkers = useQueueWorkers();

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
   * Verify a single tentative file (assumes file already has hash from batch processing)
   * @param {Object} file - The file to verify
   * @returns {Promise<Object>} Verification result
   */
  const verifyTentativeFile = async (file) => {
    // Verbose logging removed - see summary logs in startVerification()

    // File should already have hash from batch processing
    if (!file.hash) {
      console.error('[TENTATIVE-VERIFY] File missing hash (should have been hashed in batch):', {
        file: file.name,
      });
      // Fail-safe: treat as ready to avoid data loss
      file.status = 'ready';
      file.canUpload = true;
      file.isDuplicate = false;
      file.isCopy = false;
      delete file.tentativeGroupId;
      delete file.referenceFileId;
      return { verified: false, error: 'missing hash', statusChange: 'ready' };
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
    const hash = file.hash;
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
      return { verified: true, statusChange: 'duplicate', shouldRemove: true };
    } else if (file.status === 'copy') {
      // Verified copy - just update status (remove "?")
      // Status stays as 'copy', but now it has a hash so the "?" will disappear
      return { verified: true, statusChange: 'copy', shouldRemove: false };
    }

    return { verified: true };
  };

  /**
   * Hash all reference files that need hashing using web worker batch processing
   * Reference files are identified by having a tentativeGroupId set
   * @returns {Promise<Object>} { hashedCount, totalTime }
   */
  const hashReferenceFiles = async () => {
    // Find all reference files (files with tentativeGroupId) that need hashing
    const referenceFiles = uploadQueue.value.filter(
      (file) => file.tentativeGroupId && !file.hash
    );

    if (referenceFiles.length === 0) {
      return { hashedCount: 0, totalTime: 0 };
    }

    const hashT0 = performance.now();
    let hashedCount = 0;
    let errorCount = 0;

    // Try web worker batch processing first
    const sourceFiles = referenceFiles.map((f) => f.sourceFile);
    const workerResult = await queueWorkers.processFilesWithWorker(sourceFiles);

    if (workerResult.success) {
      // Map worker results back to queue items
      const allWorkerFiles = [
        ...workerResult.result.readyFiles,
        ...workerResult.result.duplicateFiles,
      ];

      allWorkerFiles.forEach((fileResult) => {
        // Find corresponding queue item by matching file properties
        const queueItem = referenceFiles.find(
          (f) =>
            f.sourceFile.name === fileResult.file.name &&
            f.sourceFile.size === fileResult.file.size
        );
        if (queueItem && fileResult.hash) {
          queueItem.hash = fileResult.hash;
          hashedCount++;
        }
      });
    } else {
      // Fallback to main thread processing
      console.warn('  │  [HASH-FALLBACK] Worker unavailable, using main thread for reference files');
      for (const refFile of referenceFiles) {
        // Re-check if file still exists and still needs hashing
        const currentFile = uploadQueue.value.find((f) => f.id === refFile.id);
        if (!currentFile || currentFile.hash) {
          continue;
        }

        try {
          const hash = await queueCore.generateFileHash(currentFile.sourceFile);
          currentFile.hash = hash;
          hashedCount++;
        } catch (error) {
          errorCount++;
          console.error('  │  [HASH-ERROR] Reference file:', currentFile.name, error.message);
          // Mark as error so verification can handle it
          currentFile.status = 'read error';
          currentFile.errorMessage = error.message;
          currentFile.canUpload = false;
        }
      }
    }

    const totalTime = performance.now() - hashT0;
    const avgTime = hashedCount > 0 ? (totalTime / hashedCount).toFixed(2) : '0.00';

    return { hashedCount, totalTime, avgTime, errorCount };
  };

  /**
   * Hash all tentative files that need hashing using web worker batch processing
   * @param {Array} tentativeFiles - Array of tentative files to hash
   * @returns {Promise<Object>} { hashedCount, totalTime }
   */
  const hashTentativeFiles = async (tentativeFiles) => {
    // Filter to only files without hashes
    const filesToHash = tentativeFiles.filter((file) => !file.hash);

    if (filesToHash.length === 0) {
      return { hashedCount: 0, totalTime: 0 };
    }

    const hashT0 = performance.now();
    let hashedCount = 0;
    let errorCount = 0;

    // Try web worker batch processing first
    const sourceFiles = filesToHash.map((f) => f.sourceFile);
    const workerResult = await queueWorkers.processFilesWithWorker(sourceFiles);

    if (workerResult.success) {
      // Map worker results back to queue items
      const allWorkerFiles = [
        ...workerResult.result.readyFiles,
        ...workerResult.result.duplicateFiles,
      ];

      allWorkerFiles.forEach((fileResult) => {
        // Find corresponding queue item by matching file properties
        const queueItem = filesToHash.find(
          (f) =>
            f.sourceFile.name === fileResult.file.name &&
            f.sourceFile.size === fileResult.file.size
        );
        if (queueItem && fileResult.hash) {
          queueItem.hash = fileResult.hash;
          hashedCount++;
        }
      });
    } else {
      // Fallback to main thread processing
      console.warn('  │  [HASH-FALLBACK] Worker unavailable, using main thread for tentative files');
      for (const file of filesToHash) {
        // Re-check if file still exists and still needs hashing
        const currentFile = uploadQueue.value.find((f) => f.id === file.id);
        if (!currentFile || currentFile.hash) {
          continue;
        }

        try {
          const hash = await queueCore.generateFileHash(currentFile.sourceFile);
          currentFile.hash = hash;
          hashedCount++;
        } catch (error) {
          errorCount++;
          console.error('  │  [HASH-ERROR] Tentative file:', currentFile.name, error.message);
          // Mark as error so verification can handle it
          currentFile.status = 'read error';
          currentFile.errorMessage = error.message;
          currentFile.canUpload = false;
        }
      }
    }

    const totalTime = performance.now() - hashT0;
    const avgTime = hashedCount > 0 ? (totalTime / hashedCount).toFixed(2) : '0.00';

    return { hashedCount, totalTime, avgTime, errorCount };
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
   * Processes all tentative files in the queue
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
    const referenceFileCount = uploadQueue.value.filter(
      (file) => file.tentativeGroupId && !file.hash
    ).length;

    console.log(`📊 [VERIFY] T=0.00ms - Starting: {tentative: ${tentativeFiles.length}, reference: ${referenceFileCount}}`);

    isVerificationRunning = true;
    verificationState.value.isVerifying = true;
    verificationState.value.processed = 0;
    verificationState.value.total = tentativeFiles.length;

    // PHASE 1: Hash all files (reference files + tentative files) using batch processing
    // This ensures ALL files have hashes before we verify tentative files against them

    // PHASE 1A: Hash reference files
    const refHashResult = await hashReferenceFiles();
    if (refHashResult.hashedCount > 0) {
      console.log(`  ├─ [HASH-REF] Hashed ${refHashResult.hashedCount} reference files (avg: ${refHashResult.avgTime}ms/file, total: ${refHashResult.totalTime.toFixed(2)}ms)`);
    }

    // PHASE 1B: Hash tentative files
    const tentativeHashResult = await hashTentativeFiles(tentativeFiles);
    if (tentativeHashResult.hashedCount > 0) {
      console.log(`  ├─ [HASH-TENT] Hashed ${tentativeHashResult.hashedCount} tentative files (avg: ${tentativeHashResult.avgTime}ms/file, total: ${tentativeHashResult.totalTime.toFixed(2)}ms)`);
    }

    // PHASE 2: Verify tentative files with two-phase deletion strategy
    // Detect which files are currently visible in the viewport
    const visibleFileIds = getVisibleFileIds();

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

    // Track verification stats
    let duplicatesRemoved = 0;
    let copiesVerified = 0;
    let promotedToReady = 0;
    const verifyHashT0 = performance.now();

    // PHASE 2A: Process visible files with animation feedback
    // These get individual animated deletions so user sees progress
    for (const file of visibleFiles) {
      // Re-check if file still exists and is still tentative
      const currentFile = uploadQueue.value.find((f) => f.id === file.id);
      if (!currentFile || currentFile.hash) {
        verificationState.value.processed++;
        continue;
      }

      const result = await verifyTentativeFile(currentFile);

      if (result.shouldRemove) {
        // Apply fade-out animation before removing
        await animateFileDeletion(currentFile.id);
        removeFromQueue(currentFile.id);
        duplicatesRemoved++;
      } else if (result.statusChange === 'ready') {
        // File was promoted to ready - resort queue to move it to top
        sortQueueByGroupTimestamp();
        promotedToReady++;
      } else if (result.statusChange === 'copy') {
        copiesVerified++;
      }

      verificationState.value.processed++;
    }

    // PHASE 2B: Process non-visible files (batched deletion)
    // Process bottom-to-top to minimize impact, batch all deletions at end
    const sortedNonVisibleFiles = [...nonVisibleFiles].reverse();
    const filesToRemove = [];

    for (const file of sortedNonVisibleFiles) {
      // Re-check if file still exists and is still tentative
      const currentFile = uploadQueue.value.find((f) => f.id === file.id);
      if (!currentFile || currentFile.hash) {
        verificationState.value.processed++;
        continue;
      }

      const result = await verifyTentativeFile(currentFile);

      if (result.shouldRemove) {
        // Collect for batch deletion (no animation needed - not visible)
        filesToRemove.push(currentFile.id);
        duplicatesRemoved++;
      } else if (result.statusChange === 'ready') {
        // File was promoted to ready - resort queue to move it to top
        sortQueueByGroupTimestamp();
        promotedToReady++;
      } else if (result.statusChange === 'copy') {
        copiesVerified++;
      }

      verificationState.value.processed++;
    }

    const verifyHashTime = performance.now() - verifyHashT0;
    const avgVerifyTime = tentativeFiles.length > 0 ? (verifyHashTime / tentativeFiles.length).toFixed(2) : '0.00';

    console.log(`  ├─ [VERIFY] Checked ${tentativeFiles.length} files (avg: ${avgVerifyTime}ms/file, total: ${verifyHashTime.toFixed(2)}ms)`);

    // Batch remove all non-visible verified duplicates
    // This causes only ONE re-render instead of many
    if (filesToRemove.length > 0) {
      filesToRemove.forEach((id) => removeFromQueue(id));
    }

    // Sort queue one final time to ensure everything is in the right place
    sortQueueByGroupTimestamp();

    console.log(`  └─ [CLEANUP] Removed ${duplicatesRemoved} dupes, verified ${copiesVerified} copies, promoted ${promotedToReady} to ready`);

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
