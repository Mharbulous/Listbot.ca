/**
 * Lazy Hash Verification Composable
 * Verifies tentative duplicate/copy hashes when rows become visible in the virtual table
 *
 * PERFORMANCE NOTE:
 * - Only verifies files that are currently visible in the viewport
 * - Prevents blocking UI by calculating hashes incrementally
 * - Uses debouncing to avoid excessive hash calculations during rapid scrolling
 */

import { ref, watch } from 'vue';
import { useQueueCore } from './useQueueCore.js';

/**
 * Composable for lazy hash verification
 * @param {Ref<Array>} uploadQueue - Reactive upload queue reference
 * @param {Ref<Array>} virtualItems - Virtual items from TanStack virtualizer
 * @returns {Object} Lazy verification state and functions
 */
export function useLazyHashVerification(uploadQueue, virtualItems) {
  // Track files currently being verified to prevent duplicate work
  const verifyingFiles = ref(new Set());

  // Get hash generation function
  const queueCore = useQueueCore();

  /**
   * Verify hash for a single tentative duplicate/copy file
   * @param {Object} queueItem - Queue item to verify
   * @returns {Promise<boolean>} - True if verified successfully, false otherwise
   */
  const verifyFileHash = async (queueItem) => {
    // Skip if already being verified
    if (verifyingFiles.value.has(queueItem.id)) {
      return false;
    }

    // Skip if already has hash
    if (queueItem.hash) {
      return true;
    }

    // Only verify tentative duplicates/copies
    if (queueItem.status !== 'duplicate' && queueItem.status !== 'copy') {
      return false;
    }

    try {
      // Mark as being verified
      verifyingFiles.value.add(queueItem.id);

      console.log('[LAZY-VERIFY] Calculating hash for visible tentative file:', {
        name: queueItem.name,
        status: queueItem.status,
      });

      // Calculate hash
      const hash = await queueCore.generateFileHash(queueItem.sourceFile);
      queueItem.hash = hash;

      // Find reference file using referenceFileId
      const referenceFile = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

      if (!referenceFile) {
        console.error('[LAZY-VERIFY] Reference file not found:', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
        });
        // Promote to ready as fail-safe
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        return false;
      }

      // If reference file doesn't have hash yet, calculate it first
      if (!referenceFile.hash) {
        console.log('[LAZY-VERIFY] Reference file needs hashing:', referenceFile.name);
        try {
          const refHash = await queueCore.generateFileHash(referenceFile.sourceFile);
          referenceFile.hash = refHash;
        } catch (error) {
          console.error('[LAZY-VERIFY] Reference file hash failed:', {
            file: referenceFile.name,
            error: error.message,
          });
          // Promote both to ready as fail-safe
          queueItem.status = 'ready';
          queueItem.canUpload = true;
          queueItem.isDuplicate = false;
          queueItem.isCopy = false;
          return false;
        }
      }

      // Compare hashes
      if (queueItem.hash !== referenceFile.hash) {
        console.warn('[LAZY-VERIFY] Hash mismatch - promoting to ready:', {
          file: queueItem.name,
          tentativeHash: queueItem.hash.substring(0, 8),
          referenceHash: referenceFile.hash.substring(0, 8),
        });
        // Hashes don't match - promote to ready
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        return false;
      }

      console.log('[LAZY-VERIFY] Hash verified successfully:', {
        file: queueItem.name,
        status: queueItem.status,
        hash: hash.substring(0, 8),
      });

      return true;
    } catch (error) {
      console.error('[LAZY-VERIFY] Hash calculation failed:', {
        file: queueItem.name,
        error: error.message,
      });
      // Set error status
      queueItem.status = 'read error';
      queueItem.errorMessage = error.message;
      queueItem.canUpload = false;
      return false;
    } finally {
      // Remove from verifying set
      verifyingFiles.value.delete(queueItem.id);
    }
  };

  /**
   * Verify hashes for all visible tentative duplicates/copies
   * Called automatically when virtual items change (scroll)
   * @returns {Promise<void>}
   */
  const verifyVisibleFiles = async () => {
    if (!virtualItems.value || virtualItems.value.length === 0) {
      return;
    }

    // Get visible file indices
    const visibleIndices = virtualItems.value.map((item) => item.index);

    // Get visible tentative files (duplicates/copies without hashes)
    const tentativeFiles = visibleIndices
      .map((index) => uploadQueue.value[index])
      .filter((file) => file && !file.hash && (file.status === 'duplicate' || file.status === 'copy'));

    if (tentativeFiles.length === 0) {
      return;
    }

    console.log('[LAZY-VERIFY] Found', tentativeFiles.length, 'visible tentative files to verify');

    // Verify all visible tentative files in parallel
    // NOTE: We limit concurrency by only verifying visible files
    await Promise.all(tentativeFiles.map((file) => verifyFileHash(file)));
  };

  // Watch for changes in visible items and verify hashes
  // Debounce to avoid excessive verification during rapid scrolling
  let verificationTimeout = null;
  const VERIFICATION_DEBOUNCE = 300; // ms

  watch(
    virtualItems,
    () => {
      // Clear previous timeout
      if (verificationTimeout) {
        clearTimeout(verificationTimeout);
      }

      // Debounce verification to avoid excessive hash calculations
      verificationTimeout = setTimeout(() => {
        verifyVisibleFiles();
      }, VERIFICATION_DEBOUNCE);
    },
    { deep: true }
  );

  return {
    verifyingFiles,
    verifyFileHash,
    verifyVisibleFiles,
  };
}
