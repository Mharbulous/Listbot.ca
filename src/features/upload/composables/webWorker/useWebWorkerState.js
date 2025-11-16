import { ref } from 'vue';
import { useAsyncRegistry } from '../../../../composables/useAsyncRegistry';

/**
 * Web Worker State Management
 * Manages reactive state, registry integration, and worker status tracking
 */
export function useWebWorkerState() {
  // Reactive state
  const isWorkerSupported = ref(typeof Worker !== 'undefined');
  const worker = ref(null);
  const isWorkerReady = ref(false);
  const workerError = ref(null);
  const isWorkerHealthy = ref(true);

  // Message handling state
  const pendingMessages = new Map(); // batchId -> { resolve, reject, timeout, startTime }
  const messageListeners = new Map(); // messageType -> callback[]

  // Health monitoring state
  let healthCheckInterval = null;
  let lastHealthCheck = null;
  let consecutiveHealthFailures = 0;

  // Registry integration
  const registry = useAsyncRegistry();
  let workerRegistryId = null;
  let healthCheckRegistryId = null;

  /**
   * Generate unique batch ID for message tracking
   * @returns {string} Unique batch identifier
   */
  const generateBatchId = () => {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Get comprehensive worker status
   * @returns {Object} Worker status information
   */
  const getWorkerStatus = () => {
    return {
      supported: isWorkerSupported.value,
      ready: isWorkerReady.value,
      healthy: isWorkerHealthy.value,
      error: workerError.value,
      pendingMessages: pendingMessages.size,
      consecutiveHealthFailures,
      lastHealthCheck: lastHealthCheck ? new Date(lastHealthCheck).toISOString() : null,
    };
  };

  /**
   * Reset health state to initial values
   */
  const resetHealthState = () => {
    consecutiveHealthFailures = 0;
    lastHealthCheck = null;
  };

  return {
    // Reactive state
    isWorkerSupported,
    worker,
    isWorkerReady,
    workerError,
    isWorkerHealthy,

    // Message handling state
    pendingMessages,
    messageListeners,

    // Health monitoring state
    healthCheckInterval: {
      get: () => healthCheckInterval,
      set: (value) => {
        healthCheckInterval = value;
      },
    },
    lastHealthCheck: {
      get: () => lastHealthCheck,
      set: (value) => {
        lastHealthCheck = value;
      },
    },
    consecutiveHealthFailures: {
      get: () => consecutiveHealthFailures,
      increment: () => {
        consecutiveHealthFailures++;
      },
      reset: () => {
        consecutiveHealthFailures = 0;
      },
      getValue: () => consecutiveHealthFailures,
    },

    // Registry integration
    registry,
    workerRegistryId: {
      get: () => workerRegistryId,
      set: (value) => {
        workerRegistryId = value;
      },
    },
    healthCheckRegistryId: {
      get: () => healthCheckRegistryId,
      set: (value) => {
        healthCheckRegistryId = value;
      },
    },

    // Utility methods
    generateBatchId,
    getWorkerStatus,
    resetHealthState,
  };
}
