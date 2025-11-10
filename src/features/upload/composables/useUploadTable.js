import { ref, nextTick } from 'vue';

/**
 * Composable for managing upload table state
 * Handles queue management, file processing, and status updates
 */
export function useUploadTable() {
  // Upload queue
  const uploadQueue = ref([]);

  // Queue progress (for large batches >500 files)
  const queueProgress = ref({
    isQueueing: false,
    processed: 0,
    total: 0,
  });

  /**
   * Add files to queue with batch processing
   * @param {File[]} files - Array of File objects to add
   */
  const addFilesToQueue = async (files) => {
    const BATCH_SIZE = 100;
    const totalFiles = files.length;

    // Show progress indicator for large batches
    if (totalFiles > 500) {
      queueProgress.value = {
        isQueueing: true,
        processed: 0,
        total: totalFiles,
      };
    }

    // Process files in batches
    for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const processedBatch = batch.map((file, index) => ({
        id: `${Date.now()}-${i + index}`,
        name: file.name,
        size: file.size,
        status: 'ready',
        folderPath: extractFolderPath(file),
        sourceFile: file,
        sourceLastModified: file.lastModified,
      }));

      uploadQueue.value.push(...processedBatch);

      // Update progress
      if (queueProgress.value.isQueueing) {
        queueProgress.value.processed = Math.min(i + BATCH_SIZE, totalFiles);
        await nextTick();
      }
    }

    // Hide progress indicator
    queueProgress.value.isQueueing = false;

    console.log(`[QUEUE] Added ${totalFiles} files to queue`);
  };

  /**
   * Extract folder path from file
   * @param {File} file - File object
   * @returns {string} - Folder path
   */
  const extractFolderPath = (file) => {
    if (file.webkitRelativePath) {
      const parts = file.webkitRelativePath.split('/');
      parts.pop(); // Remove filename
      return '/' + parts.join('/');
    }
    return '/';
  };

  /**
   * Remove file from queue
   * @param {string} fileId - File ID to remove
   */
  const removeFromQueue = (fileId) => {
    const index = uploadQueue.value.findIndex((f) => f.id === fileId);
    if (index !== -1) {
      uploadQueue.value.splice(index, 1);
      console.log(`[QUEUE] Removed file: ${fileId}`);
    }
  };

  /**
   * Clear entire queue
   */
  const clearQueue = () => {
    uploadQueue.value = [];
    console.log('[QUEUE] Cleared all files');
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

  return {
    uploadQueue,
    queueProgress,
    addFilesToQueue,
    removeFromQueue,
    clearQueue,
    updateFileStatus,
  };
}
