/**
 * Sequential Hash Worker Composable
 *
 * Provides a Web Worker interface for sequential hash verification (Stage 2)
 * Different from the batch worker approach - this hashes files one-by-one or in small groups
 *
 * This composable wraps the existing fileHashWorker.js and provides a simpler API
 * for the sequential verification use case.
 */

import { ref } from 'vue';
import { useWebWorker } from './useWebWorker.js';

export function useSequentialHashWorker() {
  const workerPath = '../workers/fileHashWorker.js';

  // Initialize Web Worker
  const worker = useWebWorker(workerPath);

  // Track if worker is initialized
  const isWorkerInitialized = ref(false);

  // Message types (must match worker)
  const MESSAGE_TYPES = {
    PROCESS_FILES: 'PROCESS_FILES',
    PROGRESS_UPDATE: 'PROGRESS_UPDATE',
    PROCESSING_COMPLETE: 'PROCESSING_COMPLETE',
    ERROR: 'ERROR',
  };

  /**
   * Initialize the worker
   * @returns {Promise<boolean>} Success status
   */
  const initWorker = async () => {
    if (isWorkerInitialized.value) {
      return true;
    }

    const success = worker.initializeWorker();
    if (success) {
      isWorkerInitialized.value = true;
      console.log('[SEQUENTIAL-HASH-WORKER] Worker initialized successfully');
    } else {
      console.error('[SEQUENTIAL-HASH-WORKER] Worker initialization failed');
    }

    return success;
  };

  /**
   * Hash a single file using the Web Worker
   * @param {File} file - Browser File object
   * @returns {Promise<string|null>} Hash string or null if failed
   */
  const hashFile = async (file) => {
    // Ensure worker is initialized
    if (!isWorkerInitialized.value) {
      const success = await initWorker();
      if (!success) {
        console.error('[SEQUENTIAL-HASH-WORKER] Cannot hash - worker not available');
        return null;
      }
    }

    // Create a batch with single file
    const batchId = `seq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const fileData = {
        id: batchId,
        file: file,
        originalIndex: 0,
        customPath: file.path || file.webkitRelativePath || file.name,
      };

      // Send to worker and wait for response
      const result = await worker.sendMessage({
        type: MESSAGE_TYPES.PROCESS_FILES,
        files: [fileData],
        batchId: batchId,
      });

      // Extract hash from result
      // Note: sendMessage already unwraps and returns data.result, not the full message
      if (result) {
        const { readyFiles, copyFiles } = result;

        // Find our file in the results
        const allFiles = [...(readyFiles || []), ...(copyFiles || [])];
        const fileResult = allFiles.find(f => f.id === batchId);

        if (fileResult && fileResult.hash) {
          return fileResult.hash;
        }
      }

      console.error('[SEQUENTIAL-HASH-WORKER] No hash in worker result:', result);
      return null;
    } catch (error) {
      console.error('[SEQUENTIAL-HASH-WORKER] Hash failed:', error);
      return null;
    }
  };

  /**
   * Hash multiple files using the Web Worker (batched for efficiency)
   * @param {Array<File>} files - Array of Browser File objects
   * @returns {Promise<Map<File, string>>} Map of File -> hash
   */
  const hashFiles = async (files) => {
    // Ensure worker is initialized
    if (!isWorkerInitialized.value) {
      const success = await initWorker();
      if (!success) {
        console.error('[SEQUENTIAL-HASH-WORKER] Cannot hash - worker not available');
        return new Map();
      }
    }

    const batchId = `seq-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const hashMap = new Map();

    try {
      const filesData = files.map((file, index) => ({
        id: `${batchId}-${index}`,
        file: file,
        originalIndex: index,
        customPath: file.path || file.webkitRelativePath || file.name,
      }));

      // Send to worker and wait for response
      const result = await worker.sendMessage({
        type: MESSAGE_TYPES.PROCESS_FILES,
        files: filesData,
        batchId: batchId,
      });

      // Extract hashes from result
      // Note: sendMessage already unwraps and returns data.result, not the full message
      if (result) {
        const { readyFiles, copyFiles } = result;
        const allFiles = [...(readyFiles || []), ...(copyFiles || [])];

        // Map results back to original files
        allFiles.forEach(fileResult => {
          if (fileResult.hash && fileResult.originalIndex !== undefined) {
            const originalFile = files[fileResult.originalIndex];
            if (originalFile) {
              hashMap.set(originalFile, fileResult.hash);
            }
          }
        });
      }

      return hashMap;
    } catch (error) {
      console.error('[SEQUENTIAL-HASH-WORKER] Batch hash failed:', error);
      return hashMap;
    }
  };

  /**
   * Terminate the worker
   */
  const terminateWorker = () => {
    if (isWorkerInitialized.value) {
      worker.terminateWorker();
      isWorkerInitialized.value = false;
      console.log('[SEQUENTIAL-HASH-WORKER] Worker terminated');
    }
  };

  return {
    // State
    isWorkerReady: worker.isWorkerReady,
    isWorkerHealthy: worker.isWorkerHealthy,
    workerError: worker.workerError,

    // Methods
    initWorker,
    hashFile,
    hashFiles,
    terminateWorker,
  };
}
