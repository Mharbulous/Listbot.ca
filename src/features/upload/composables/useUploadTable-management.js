/**
 * Composable for managing upload queue CRUD operations
 * Handles file removal, status updates, and bulk operations
 */
export function useUploadTableManagement(uploadQueue, duplicatesHidden) {
  /**
   * Remove file from queue
   * @param {string} fileId - File ID to remove
   */
  const removeFromQueue = (fileId) => {
    const index = uploadQueue.value.findIndex((f) => f.id === fileId);
    if (index !== -1) {
      uploadQueue.value.splice(index, 1);
      // Verbose logging removed - see batch operations for summary logs
    }
  };

  /**
   * Clear skipped files from queue (files with status 'skip', 'duplicate', 'n/a', or 'read error')
   */
  const clearQueue = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) =>
      file.status !== 'skip' &&
      file.status !== 'duplicate' &&
      file.status !== 'n/a' &&
      file.status !== 'read error'
    );
    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} skipped files`);
  };

  /**
   * Clear duplicate files from queue (files with status 'duplicate' or legacy 'redundant')
   */
  const clearDuplicates = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) =>
      file.status !== 'duplicate' && file.status !== 'redundant'
    );
    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} duplicate files`);
  };

  /**
   * Clear skipped files from queue (files with status 'skip')
   */
  const clearSkipped = () => {
    const beforeCount = uploadQueue.value.length;
    uploadQueue.value = uploadQueue.value.filter((file) =>
      file.status !== 'skip'
    );
    const removedCount = beforeCount - uploadQueue.value.length;
    console.log(`[QUEUE] Cleared ${removedCount} skipped files`);
  };

  /**
   * Update file status
   * @param {string} fileId - File ID
   * @param {string} status - New status
   */
  const updateFileStatus = (fileId, status) => {
    const file = uploadQueue.value.find((f) => f.id === fileId);
    if (file) {
      file.status = status;
    }
  };

  /**
   * Skip file (mark as 'skip' instead of removing)
   * @param {string} fileId - File ID to skip
   */
  const skipFile = (fileId) => {
    const file = uploadQueue.value.find((f) => f.id === fileId);
    if (file) {
      file.status = 'skip';
      console.log(`[QUEUE] Skipped file: ${fileId}`);
    }
  };

  /**
   * Undo skip (restore to 'ready' status)
   * @param {string} fileId - File ID to restore
   */
  const undoSkip = (fileId) => {
    const file = uploadQueue.value.find((f) => f.id === fileId);
    if (file && file.status === 'skip') {
      file.status = 'ready';
      console.log(`[QUEUE] Restored file: ${fileId}`);
    }
  };

  /**
   * Select all files (restore all skipped files to 'ready' status)
   * NOTE: Does NOT affect 'n/a', 'duplicate', or 'read error' files
   */
  const selectAll = () => {
    let restoredCount = 0;
    uploadQueue.value.forEach((file) => {
      // Only restore skipped files, don't change completed, n/a, duplicate, or read error files
      if (file.status === 'skip') {
        file.status = 'ready';
        restoredCount++;
      }
    });
    console.log(`[QUEUE] Selected all files (restored ${restoredCount} skipped files)`);
  };

  /**
   * Deselect all files (mark all files as 'skip', except completed, n/a, duplicate, copy, and read error files)
   * NOTE: Does NOT affect files with disabled checkboxes (n/a, duplicate, read error) or copy files
   */
  const deselectAll = () => {
    let skippedCount = 0;
    uploadQueue.value.forEach((file) => {
      // Skip all ready files, but exclude completed, n/a, duplicate, copy, and read error files
      // Copy files should NOT be affected by select all/deselect all
      if (
        file.status !== 'completed' &&
        file.status !== 'skip' &&
        file.status !== 'n/a' &&
        file.status !== 'duplicate' &&
        file.status !== 'copy' &&
        file.status !== 'read error'
      ) {
        file.status = 'skip';
        skippedCount++;
      }
    });
    console.log(`[QUEUE] Deselected all primary files (skipped ${skippedCount} files)`);
  };

  /**
   * Swap a copy file to become the primary (ready) file
   * The current primary file will become a copy
   * Rows remain in their current order - only statuses and checkboxes swap
   * @param {string} fileId - File ID of the copy to make primary
   */
  const swapCopyToPrimary = (fileId) => {
    // Find the copy file
    const copyFile = uploadQueue.value.find((f) => f.id === fileId);
    if (!copyFile) {
      console.error('[QUEUE] Cannot swap: file not found:', fileId);
      return;
    }

    if (copyFile.status !== 'copy') {
      console.error('[QUEUE] Cannot swap: file is not a copy:', fileId);
      return;
    }

    if (!copyFile.hash) {
      console.error('[QUEUE] Cannot swap: file has no hash:', fileId);
      return;
    }

    // Find all files with the same hash
    const sameHashFiles = uploadQueue.value.filter((f) => f.hash === copyFile.hash);

    // Find the current primary file (status = 'ready' or 'skip')
    // Check for 'ready' first, then 'skip' if the group is skipped
    let primaryFile = sameHashFiles.find((f) => f.status === 'ready');
    if (!primaryFile) {
      primaryFile = sameHashFiles.find((f) => f.status === 'skip');
    }

    if (!primaryFile) {
      console.warn('[QUEUE] No primary file found for hash group, making copy the primary:', copyFile.hash.substring(0, 8));
      copyFile.status = 'ready';
      copyFile.isCopy = false;
    } else {
      // Swap statuses (rows stay in current order)
      // The old primary becomes a copy, regardless of whether it was 'ready' or 'skip'
      const oldPrimaryWasSkipped = primaryFile.status === 'skip';
      primaryFile.status = 'copy';
      primaryFile.isCopy = true;
      copyFile.status = 'ready';
      copyFile.isCopy = false;

      console.log('[QUEUE] Swapped copy to primary (rows unchanged):', {
        newPrimary: copyFile.name,
        oldPrimary: primaryFile.name,
        oldPrimaryWasSkipped,
        hash: copyFile.hash.substring(0, 8) + '...',
      });
    }

    // Note: sortQueueByGroupTimestamp() NOT called - rows maintain their current positions
  };

  /**
   * Toggle visibility of duplicate files
   * When hidden, only shows files with status 'ready' (primary files)
   * When shown, displays all files including 'skipped', 'duplicate', and 'copy' statuses
   */
  const toggleDuplicatesVisibility = () => {
    duplicatesHidden.value = !duplicatesHidden.value;
    console.log(`[QUEUE] Duplicates ${duplicatesHidden.value ? 'hidden' : 'shown'}`);
  };

  return {
    removeFromQueue,
    clearQueue,
    clearDuplicates,
    clearSkipped,
    updateFileStatus,
    skipFile,
    undoSkip,
    selectAll,
    deselectAll,
    swapCopyToPrimary,
    toggleDuplicatesVisibility,
  };
}
