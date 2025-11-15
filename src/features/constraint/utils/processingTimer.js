/**
 * Global timing utility for simplified console logging
 * Tracks all times relative to T=0 (processing start)
 */

let processingStartTime = null;

/**
 * Initialize the timing system and set T=0
 */
export function startProcessingTimer() {
  processingStartTime = Date.now();
  return processingStartTime;
}

/**
 * Log an event with time relative to T=0
 * @param {string} eventName - Name of the event (e.g., 'DEDUPLICATION_START')
 */
export function logProcessingTime(eventName) {
  if (processingStartTime === null) {
    return;
  }

  const relativeTime = Date.now() - processingStartTime;
}

/**
 * Get current time relative to T=0 (for calculations without logging)
 * @returns {number} Time in milliseconds since T=0
 */
export function getRelativeTime() {
  if (processingStartTime === null) {
    return 0;
  }
  return Date.now() - processingStartTime;
}

/**
 * Reset the timing system (for cleanup)
 */
export function resetProcessingTimer() {
  processingStartTime = null;
}
