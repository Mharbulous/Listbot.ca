import {
  MAX_HEALTH_FAILURES,
  HEALTH_CHECK_INTERVAL,
  HEALTH_CHECK_TIMEOUT,
} from './webWorkerConstants';

/**
 * Web Worker Health Monitoring
 * Manages periodic health checks and worker health status
 */
export function useWebWorkerHealth(state, addMessageListener) {
  const {
    worker,
    isWorkerReady,
    isWorkerHealthy,
    registry,
    healthCheckInterval,
    lastHealthCheck,
    consecutiveHealthFailures,
    healthCheckRegistryId,
  } = state;

  /**
   * Start periodic health monitoring
   */
  const startHealthChecking = () => {
    if (healthCheckInterval.get()) {
      clearInterval(healthCheckInterval.get());
      if (healthCheckRegistryId.get()) {
        registry.unregister(healthCheckRegistryId.get());
      }
    }

    const interval = setInterval(async () => {
      try {
        await performHealthCheck();
      } catch (error) {
        console.warn('Health check failed:', error.message);
        handleHealthCheckFailure();
      }
    }, HEALTH_CHECK_INTERVAL);

    healthCheckInterval.set(interval);

    // Register health check interval with registry
    const registryId = registry.register(
      registry.generateId('health-check'),
      'health-monitor',
      () => {
        if (healthCheckInterval.get()) {
          clearInterval(healthCheckInterval.get());
          healthCheckInterval.set(null);
        }
      },
      {
        component: 'WebWorker',
        interval: HEALTH_CHECK_INTERVAL,
        purpose: 'worker-health-monitoring',
      }
    );

    healthCheckRegistryId.set(registryId);

    if (import.meta.env.DEV) {
      console.debug('[WebWorker] Health monitor registered with ID:', registryId);
    }
  };

  /**
   * Stop health monitoring and clean up resources
   */
  const stopHealthChecking = () => {
    if (import.meta.env.DEV) {
      console.debug(
        '[WebWorker] Stopping health monitoring. Interval exists:',
        !!healthCheckInterval.get(),
        'Registry ID exists:',
        !!healthCheckRegistryId.get()
      );
    }

    if (healthCheckInterval.get()) {
      clearInterval(healthCheckInterval.get());
      healthCheckInterval.set(null);

      if (import.meta.env.DEV) {
        console.debug('[WebWorker] Health check interval cleared');
      }
    }

    if (healthCheckRegistryId.get()) {
      if (import.meta.env.DEV) {
        console.debug('[WebWorker] Unregistering health monitor with ID:', healthCheckRegistryId.get());
      }

      registry.unregister(healthCheckRegistryId.get());
      healthCheckRegistryId.set(null);

      if (import.meta.env.DEV) {
        console.debug('[WebWorker] Health monitor unregistered successfully');
      }
    }
  };

  /**
   * Perform a single health check
   * @returns {Promise} Resolves if healthy, rejects if unhealthy
   */
  const performHealthCheck = () => {
    return new Promise((resolve, reject) => {
      if (!isWorkerReady.value || !worker.value) {
        reject(new Error('Worker not ready for health check'));
        return;
      }

      const healthCheckId = `health_${Date.now()}`;
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'));
      }, HEALTH_CHECK_TIMEOUT);

      // Listen for health check response
      const healthResponseHandler = (data) => {
        if (data.type === 'HEALTH_CHECK_RESPONSE' && data.batchId === healthCheckId) {
          clearTimeout(timeout);
          lastHealthCheck.set(Date.now());
          consecutiveHealthFailures.reset();
          isWorkerHealthy.value = true;
          resolve();
        }
      };

      const unsubscribe = addMessageListener('HEALTH_CHECK_RESPONSE', healthResponseHandler);

      // Clean up listener after timeout
      setTimeout(() => {
        unsubscribe();
      }, HEALTH_CHECK_TIMEOUT + 1000);

      // Send health check
      worker.value.postMessage({
        type: 'HEALTH_CHECK',
        batchId: healthCheckId,
        timestamp: Date.now(),
      });
    });
  };

  /**
   * Handle failed health check attempt
   */
  const handleHealthCheckFailure = () => {
    consecutiveHealthFailures.increment();
    console.warn(
      `Worker health check failed (${consecutiveHealthFailures.getValue()}/${MAX_HEALTH_FAILURES})`
    );

    // Only mark unhealthy after MAX_HEALTH_FAILURES consecutive failures
    if (consecutiveHealthFailures.getValue() >= MAX_HEALTH_FAILURES) {
      console.error(
        `Worker failed ${MAX_HEALTH_FAILURES} consecutive health checks, marking as unhealthy`
      );
      isWorkerHealthy.value = false;
    } else {
      // Keep worker healthy until max failures reached
      console.info(
        `Worker still healthy despite health check failure (${consecutiveHealthFailures.getValue()}/${MAX_HEALTH_FAILURES})`
      );
    }
  };

  /**
   * Force a health check (for debugging/testing)
   * @returns {Promise<Object>} Result object with success status and message
   */
  const forceHealthCheck = async () => {
    try {
      await performHealthCheck();
      return { success: true, message: 'Health check passed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return {
    startHealthChecking,
    stopHealthChecking,
    performHealthCheck,
    handleHealthCheckFailure,
    forceHealthCheck,
  };
}
