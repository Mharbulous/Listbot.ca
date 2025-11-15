import { useQueueCore } from './useQueueCore.js';

/**
 * Composable for lazy hash verification
 * Verifies tentative duplicate/copy status on-demand (hover, delete, upload triggers)
 */
export function useUploadTableHashVerification(uploadQueue) {
  // Initialize core logic
  const queueCore = useQueueCore();

  /**
   * Phase 3a: Hash verification on status hover
   * Verifies tentative duplicate/copy status when user hovers over status column
   * @param {Object} queueItem - Queue item to verify
   * @returns {Promise<Object>} - { verified: boolean, hash: string, error: string }
   */
  const verifyHashOnHover = async (queueItem) => {
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
      const bestCopy = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

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
        // Clear tentativeGroupId so file can form its own group (zebra pattern stability)
        delete queueItem.tentativeGroupId;
        delete queueItem.referenceFileId;
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
   * Phase 3a: Hash verification before deletion
   * Verifies tentative duplicate status before allowing deletion
   * @param {Object} queueItem - Queue item to verify before deletion
   * @returns {Promise<Object>} - { allowDeletion: boolean, message: string }
   */
  const verifyHashBeforeDelete = async (queueItem) => {
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
      const bestCopy = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

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
        // Clear tentativeGroupId so file can form its own group (zebra pattern stability)
        delete queueItem.tentativeGroupId;
        delete queueItem.referenceFileId;
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

  /**
   * Phase 3a: Hash verification before upload
   * Verifies tentative duplicate/copy status before upload
   * @param {Object} queueItem - Queue item to verify before upload
   * @returns {Promise<Object>} - { shouldSkip: boolean, message: string }
   */
  const verifyHashBeforeUpload = async (queueItem) => {
    // Always calculate hash if missing (required for Firestore document ID)
    if (!queueItem.hash) {
      try {
        queueItem.hash = await queueCore.generateFileHash(queueItem.sourceFile);
      } catch (error) {
        console.error('[UPLOAD-VERIFY] Hash calculation failed:', {
          file: queueItem.name,
          error: error.message,
        });
        queueItem.status = 'error';
        queueItem.errorMessage = error.message;
        return { shouldSkip: true, error: error.message }; // Don't upload files that can't be hashed
      }
    }

    // If this was tentatively marked as duplicate/copy, verify now
    if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
      const bestCopy = uploadQueue.value.find((f) => f.id === queueItem.referenceFileId);

      if (!bestCopy?.hash) {
        console.error('[UPLOAD-VERIFY] CRITICAL: Best copy has no hash', {
          tentativeFile: queueItem.name,
          referenceFileId: queueItem.referenceFileId,
        });
        // Fail-safe: treat as ready to avoid data loss
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        // Clear tentativeGroupId so file can form its own group (zebra pattern stability)
        delete queueItem.tentativeGroupId;
        delete queueItem.referenceFileId;
      } else if (queueItem.hash !== bestCopy.hash) {
        queueItem.status = 'ready';
        queueItem.canUpload = true;
        queueItem.isDuplicate = false;
        queueItem.isCopy = false;
        // Clear tentativeGroupId so file can form its own group (zebra pattern stability)
        delete queueItem.tentativeGroupId;
        delete queueItem.referenceFileId;
        console.warn('[UPLOAD-VERIFY] Hash mismatch - promoting to ready and uploading', {
          file: queueItem.name,
        });
      }
    }

    // Proceed with normal upload logic
    if (queueItem.status === 'duplicate' || queueItem.status === 'copy') {
      return { shouldSkip: true }; // Confirmed duplicate/copy - don't upload
    }

    return { shouldSkip: false };
  };

  return {
    verifyHashOnHover,
    verifyHashBeforeDelete,
    verifyHashBeforeUpload,
  };
}
