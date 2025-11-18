/**
 * Sequential Hash Worker Composable
 *
 * Provides a Web Worker interface for sequential hash verification (Stage 2)
 * Different from the batch worker approach - this hashes files one-by-one or in small groups
 *
 * This composable wraps the existing fileHashWorker.js and provides a simpler API
 * for the sequential verification use case.
 */

import { ref, onUnmounted } from 'vue';
import { useWebWorkerState } from './webWorker/useWebWorkerState';
import { useWebWorkerHealth } from './webWorker/useWebWorkerHealth';
import { useWebWorkerMessages } from './webWorker/useWebWorkerMessages';
import { HEALTH_CHECK_GRACE_PERIOD } from './webWorker/webWorkerConstants';

export function useSequentialHashWorker() {
  // Initialize state management
  const state = useWebWorkerState();

  // Initialize message handling
  const messageHandling = useWebWorkerMessages(state);

  // Initialize health monitoring
  const healthMonitoring = useWebWorkerHealth(state, messageHandling.addMessageListener);

  const { worker, isWorkerReady, isWorkerSupported, workerError, isWorkerHealthy, pendingMessages, workerRegistryId, registry, resetHealthState } = state;
  const { handleWorkerMessage, sendMessage } = messageHandling;
  const { startHealthChecking, stopHealthChecking } = healthMonitoring;

  /**
   * Initialize the worker
   * IMPORTANT: Worker URL must be a literal string for Vite bundling
   */
  const initWorker = () => {
    if (!isWorkerSupported.value) {
      workerError.value = new Error('Web Workers are not supported in this browser');
      return false;
    }

    try {
      // CRITICAL: Path must be a literal string for Vite's static analysis
      worker.value = new Worker(
        new URL('../workers/fileHashWorker.js', import.meta.url),
        { type: 'module' }
      );

      worker.value.onmessage = (event) => {
        handleWorkerMessage(event.data);
      };

      worker.value.onerror = (error) => {
        workerError.value = error;
        isWorkerReady.value = false;
        isWorkerHealthy.value = false;
        console.error('Worker error:', error);
        stopHealthChecking();
        for (const [batchId, { reject }] of pendingMessages) {
          reject(new Error(`Worker error: ${error.message}`));
          pendingMessages.delete(batchId);
        }
      };

      worker.value.onmessageerror = (error) => {
        workerError.value = new Error(`Message error: ${error}`);
      };

      isWorkerReady.value = true;
      isWorkerHealthy.value = true;
      workerError.value = null;
      resetHealthState();

      // Register worker
      const registryId = registry.register(
        registry.generateId('worker'),
        'worker',
        () => {
          if (worker.value) {
            worker.value.terminate();
            worker.value = null;
            isWorkerReady.value = false;
            isWorkerHealthy.value = false;
          }
        },
        {
          component: 'SequentialHashWorker',
          initialized: Date.now(),
        }
      );

      workerRegistryId.set(registryId);

      // Start health monitoring
      setTimeout(() => {
        if (isWorkerReady.value) {
          startHealthChecking();
        }
      }, HEALTH_CHECK_GRACE_PERIOD);

      return true;
    } catch (error) {
      workerError.value = error;
      isWorkerReady.value = false;
      isWorkerHealthy.value = false;
      return false;
    }
  };

  const terminateWorker = () => {
    stopHealthChecking();
    if (workerRegistryId.get()) {
      registry.unregister(workerRegistryId.get());
      workerRegistryId.set(null);
    }
    if (worker.value) {
      worker.value.terminate();
      worker.value = null;
      isWorkerReady.value = false;
      isWorkerHealthy.value = false;
    }
    for (const [batchId, { reject }] of pendingMessages) {
      reject(new Error('Worker was terminated'));
      pendingMessages.delete(batchId);
    }
    resetHealthState();
  };

  onUnmounted(() => {
    terminateWorker();
  });

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
   * Initialize the worker wrapper
   * @returns {Promise<boolean>} Success status
   */
  const initializeWorker = async () => {
    if (isWorkerInitialized.value) {
      return true;
    }

    const success = initWorker();
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
      const success = await initializeWorker();
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
      const result = await sendMessage({
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
      const success = await initializeWorker();
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
      const result = await sendMessage({
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
   * Terminate the worker wrapper
   */
  const terminate = () => {
    if (isWorkerInitialized.value) {
      terminateWorker();
      isWorkerInitialized.value = false;
      console.log('[SEQUENTIAL-HASH-WORKER] Worker terminated');
    }
  };

  return {
    // State
    isWorkerReady,
    isWorkerHealthy,
    workerError,

    // Methods
    initWorker: initializeWorker,
    hashFile,
    hashFiles,
    terminateWorker: terminate,
  };
}
