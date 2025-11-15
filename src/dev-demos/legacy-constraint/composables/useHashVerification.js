/**
 * Hash Verification Composable
 * Phase 3a: Provides hash verification for tentative duplicates/copies
 * Verifies metadata-based pre-filter results by calculating and comparing hashes
 */

import { useQueueCore } from './useQueueCore.js';

/**
 * Composable for hash verification
 * Provides verification functions for hover, delete, and upload triggers
 * @param {Ref<Array>} uploadQueue - Reactive upload queue reference
 * @returns {Object} Hash verification functions
 */
export function useHashVerification(uploadQueue) {
  // Get hash generation function
  const queueCore = useQueueCore();

  /**
   * Verify hash on hover (for status tooltip)
   * @param {Object} queueItem - Queue item to verify
   * @returns {Promise<Object>} - { verified: boolean, hash: string, error: string, mismatch: boolean, message: string }
   */
  const verifyHashOnHover = async (queueItem) => {
    if (!uploadQueue) {
      console.warn('[HASH-VERIFY] Upload queue not available in context');
      return { verified: false, error: 'Upload queue not available' };
    }

    // Only verify if status is duplicate/copy and no hash exists
    if (!queueItem.hash && (queueItem.status === 'duplicate' || queueItem.status === 'copy')) {
      // Race condition check: Hash might have been calculated by another trigger
      if (queueItem.hash) {
        return { verified: true, hash: queueItem.hash };
      }

      // Calculate hash with error handling
      try {
        const hash = await queueCore.generateFileHash(queueItem.sourceFile);
        queueItem.hash = hash;
      } catch (error) {
        console.error('[HASH-VERIFY] Hash calculation failed:', {
          file: queueItem.name,
          error: error.message,
        });
        queueItem.status = 'read error';
        queueItem.errorMessage = error.message;
        queueItem.canUpload = false;
        return { verified: false, error: error.message };
      }

      // Find best/primary copy using referenceFileId (set during pre-filter)
      const bestCopy = uploadQueue.value?.find((f) => f.id === queueItem.referenceFileId);

      // ERROR CHECK: Best copy MUST have hash
      if (!bestCopy?.hash) {
        console.error('[HASH-VERIFY] CRITICAL: Best copy has no hash', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
          bestCopyFound: !!bestCopy,
        });
        return {
          verified: false,
          error: 'Cannot verify duplicate status - best copy has no hash. Please report this issue.',
        };
      }

      // Compare hashes
      if (queueItem.hash !== bestCopy.hash) {
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        console.warn('[HASH-VERIFY] Hash mismatch - promoting to ready', {
          file: queueItem.name,
          tentativeHash: queueItem.hash,
          bestCopyHash: bestCopy.hash,
        });
        return {
          verified: false,
          hash: queueItem.hash,
          mismatch: true,
          message: `File "${queueItem.name}" was incorrectly marked as duplicate. Status changed to Ready.`,
        };
      }

      return { verified: true, hash: queueItem.hash };
    }

    // Already has hash or not a tentative status
    return { verified: true, hash: queueItem.hash || 'No hash' };
  };

  /**
   * Verify hash before deletion
   * @param {Object} queueItem - Queue item to verify before deletion
   * @returns {Promise<Object>} - { allowDeletion: boolean, error: string, mismatch: boolean, message: string }
   */
  const verifyHashBeforeDelete = async (queueItem) => {
    if (!uploadQueue) {
      console.warn('[DELETE-VERIFY] Upload queue not available in context');
      return { allowDeletion: false, error: 'Upload queue not available' };
    }

    if (queueItem.status === 'duplicate' && !queueItem.hash) {
      // Race condition check
      if (queueItem.hash) {
        return { allowDeletion: true };
      }

      // Calculate hash with error handling
      try {
        const hash = await queueCore.generateFileHash(queueItem.sourceFile);
        queueItem.hash = hash;
      } catch (error) {
        console.error('[DELETE-VERIFY] Hash calculation failed:', {
          file: queueItem.name,
          error: error.message,
        });
        return {
          allowDeletion: false,
          error: `Cannot verify file "${queueItem.name}": ${error.message}`,
        };
      }

      // Find best/primary copy using referenceFileId
      const bestCopy = uploadQueue.value?.find((f) => f.id === queueItem.referenceFileId);

      if (!bestCopy?.hash) {
        console.error('[DELETE-VERIFY] CRITICAL: Best copy has no hash', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
        });
        return {
          allowDeletion: false,
          error: 'Cannot verify duplicate status - best copy has no hash. Please report this issue.',
        };
      }

      if (queueItem.hash !== bestCopy.hash) {
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        console.warn('[DELETE-VERIFY] Hash mismatch - blocking deletion', {
          file: queueItem.name,
        });
        return {
          allowDeletion: false,
          mismatch: true,
          message: `File "${queueItem.name}" is actually unique content, not a duplicate. Deletion blocked and status changed to Ready.`,
        };
      }
    }

    return { allowDeletion: true };
  };

  return {
    verifyHashOnHover,
    verifyHashBeforeDelete,
  };
}
