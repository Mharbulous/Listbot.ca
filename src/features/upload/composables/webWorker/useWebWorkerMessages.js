import { DEFAULT_MESSAGE_TIMEOUT } from './webWorkerConstants';

/**
 * Web Worker Message Handling
 * Manages bidirectional communication between main thread and worker
 */
export function useWebWorkerMessages(state) {
  const {
    worker,
    isWorkerReady,
    isWorkerHealthy,
    pendingMessages,
    messageListeners,
    generateBatchId,
  } = state;

  /**
   * Handle incoming messages from worker
   * Routes messages to appropriate handlers based on type
   * @param {Object} data - Message data from worker
   */
  const handleWorkerMessage = (data) => {
    const { type, batchId } = data;

    // Handle completion/error messages that resolve promises
    if (batchId && pendingMessages.has(batchId)) {
      const { resolve, reject, timeout } = pendingMessages.get(batchId);

      if (type === 'PROCESSING_COMPLETE') {
        clearTimeout(timeout);
        const { startTime } = pendingMessages.get(batchId);
        const duration = Date.now() - startTime;
        console.debug(`Worker operation completed in ${duration}ms`);
        pendingMessages.delete(batchId);
        resolve(data.result);
        return;
      }

      if (type === 'ERROR') {
        clearTimeout(timeout);
        const { startTime } = pendingMessages.get(batchId);
        const duration = Date.now() - startTime;
        console.error(`Worker operation failed after ${duration}ms:`, data.error);
        pendingMessages.delete(batchId);
        reject(new Error(data.error.message || 'Worker processing failed'));
        return;
      }
    }

    // Handle progress and other message types with listeners
    if (messageListeners.has(type)) {
      const listeners = messageListeners.get(type);
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in message listener for ${type}:`, error);
        }
      });
    }
  };

  /**
   * Send message to worker and return promise
   * @param {Object} message - Message to send
   * @param {Object} options - Options (timeout, ignoreHealth)
   * @returns {Promise} Resolves with worker response or rejects on error/timeout
   */
  const sendMessage = (message, options = {}) => {
    return new Promise((resolve, reject) => {
      if (!isWorkerReady.value || !worker.value) {
        reject(new Error('Worker is not ready'));
        return;
      }

      if (!isWorkerHealthy.value && !options.ignoreHealth) {
        reject(new Error('Worker is not healthy'));
        return;
      }

      const batchId = message.batchId || generateBatchId();
      const timeout = options.timeout || DEFAULT_MESSAGE_TIMEOUT;
      const startTime = Date.now();

      // Set up timeout with enhanced error message
      const timeoutId = setTimeout(() => {
        const operation = message.type || 'operation';
        pendingMessages.delete(batchId);
        reject(new Error(`Worker ${operation} timed out after ${timeout}ms`));
      }, timeout);

      // Store promise handlers with start time for performance tracking
      pendingMessages.set(batchId, { resolve, reject, timeout: timeoutId, startTime });

      try {
        // Send message with batchId
        worker.value.postMessage({ ...message, batchId });
      } catch (error) {
        clearTimeout(timeoutId);
        pendingMessages.delete(batchId);
        reject(new Error(`Failed to send message to worker: ${error.message}`));
      }
    });
  };

  /**
   * Add message listener for specific message types
   * @param {string} messageType - Type of message to listen for
   * @param {Function} callback - Callback function to invoke
   * @returns {Function} Unsubscribe function
   */
  const addMessageListener = (messageType, callback) => {
    if (!messageListeners.has(messageType)) {
      messageListeners.set(messageType, []);
    }
    messageListeners.get(messageType).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = messageListeners.get(messageType);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
        if (listeners.length === 0) {
          messageListeners.delete(messageType);
        }
      }
    };
  };

  /**
   * Remove message listener
   * @param {string} messageType - Type of message
   * @param {Function} callback - Callback to remove
   */
  const removeMessageListener = (messageType, callback) => {
    const listeners = messageListeners.get(messageType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        messageListeners.delete(messageType);
      }
    }
  };

  return {
    handleWorkerMessage,
    sendMessage,
    addMessageListener,
    removeMessageListener,
  };
}
