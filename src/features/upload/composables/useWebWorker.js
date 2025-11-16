import { onUnmounted } from 'vue';
import { useWebWorkerState } from './webWorker/useWebWorkerState';
import { useWebWorkerHealth } from './webWorker/useWebWorkerHealth';
import { useWebWorkerMessages } from './webWorker/useWebWorkerMessages';
import { HEALTH_CHECK_GRACE_PERIOD } from './webWorker/webWorkerConstants';

/**
 * Generic Web Worker communication composable
 * Provides a clean API for worker lifecycle management and message passing
 *
 * @param {string} workerPath - Path to the worker script
 * @returns {Object} Worker API with methods and reactive state
 */
export function useWebWorker(workerPath) {
  // Initialize state management
  const state = useWebWorkerState();

  // Initialize message handling (needs to be created before health checks)
  const messageHandling = useWebWorkerMessages(state);

  // Initialize health monitoring (depends on addMessageListener)
  const healthMonitoring = useWebWorkerHealth(state, messageHandling.addMessageListener);

  // Destructure commonly used state
  const {
    isWorkerSupported,
    worker,
    isWorkerReady,
    workerError,
    isWorkerHealthy,
    pendingMessages,
    messageListeners,
    registry,
    workerRegistryId,
    getWorkerStatus,
    resetHealthState,
  } = state;

  // Destructure message handling methods
  const { handleWorkerMessage, sendMessage, addMessageListener, removeMessageListener } =
    messageHandling;

  // Destructure health monitoring methods
  const { startHealthChecking, stopHealthChecking, forceHealthCheck } = healthMonitoring;

  /**
   * Initialize the web worker
   * Sets up worker instance, event handlers, and health monitoring
   * @returns {boolean} Success status
   */
  const initializeWorker = () => {
    if (!isWorkerSupported.value) {
      workerError.value = new Error('Web Workers are not supported in this browser');
      return false;
    }

    try {
      worker.value = new Worker(new URL(workerPath, import.meta.url), { type: 'module' });

      worker.value.onmessage = (event) => {
        handleWorkerMessage(event.data);
      };

      worker.value.onerror = (error) => {
        workerError.value = error;
        isWorkerReady.value = false;
        isWorkerHealthy.value = false;

        console.error('Worker error:', error);

        // Stop health checks
        stopHealthChecking();

        // Reject all pending messages
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

      // Register worker with registry
      const registryId = registry.register(
        registry.generateId('worker'),
        'worker',
        () => {
          // The proper cleanup is handled by terminateWorker()
          // This cleanup function is called by the registry's global cleanup
          if (worker.value) {
            worker.value.terminate();
            worker.value = null;
            isWorkerReady.value = false;
            isWorkerHealthy.value = false;
          }
          // Note: We can't unregister here due to circular reference
          // The registry will handle removing this entry after cleanup executes
        },
        {
          component: 'WebWorker',
          workerPath,
          initialized: Date.now(),
        }
      );

      workerRegistryId.set(registryId);

      if (import.meta.env.DEV) {
        console.debug('[WebWorker] Main worker registered with ID:', registryId);
      }

      // Start health monitoring after grace period
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

  /**
   * Terminate the worker and clean up all resources
   * Stops health checks, unregisters from registry, and cleans up state
   */
  const terminateWorker = () => {
    if (import.meta.env.DEV) {
      console.debug(
        '[WebWorker] Terminating worker. Main registry ID:',
        workerRegistryId.get(),
        'Health registry ID:',
        state.healthCheckRegistryId.get()
      );
    }

    // Stop health checking
    stopHealthChecking();

    // Unregister worker from registry
    if (workerRegistryId.get()) {
      if (import.meta.env.DEV) {
        console.debug('[WebWorker] Unregistering main worker with ID:', workerRegistryId.get());
      }

      registry.unregister(workerRegistryId.get());
      workerRegistryId.set(null);

      if (import.meta.env.DEV) {
        console.debug('[WebWorker] Main worker unregistered successfully');
      }
    }

    if (worker.value) {
      worker.value.terminate();
      worker.value = null;
      isWorkerReady.value = false;
      isWorkerHealthy.value = false;
    }

    // Reject all pending messages
    for (const [batchId, { reject }] of pendingMessages) {
      reject(new Error('Worker was terminated'));
      pendingMessages.delete(batchId);
    }

    // Clear message listeners
    messageListeners.clear();

    // Reset health state
    resetHealthState();
  };

  /**
   * Restart the worker
   * Terminates existing worker and initializes a new one
   * @returns {boolean} Success status
   */
  const restartWorker = () => {
    console.info('Restarting worker...');
    terminateWorker();
    const success = initializeWorker();
    if (success) {
      console.info('Worker restarted successfully');
    } else {
      console.error('Worker restart failed');
    }
    return success;
  };

  // Auto-cleanup on unmount
  onUnmounted(() => {
    terminateWorker();
  });

  return {
    // Reactive state
    isWorkerSupported: isWorkerSupported.value,
    isWorkerReady,
    isWorkerHealthy,
    workerError,

    // Methods
    initializeWorker,
    sendMessage,
    addMessageListener,
    removeMessageListener,
    terminateWorker,
    restartWorker,
    getWorkerStatus,
    forceHealthCheck,
  };
}
