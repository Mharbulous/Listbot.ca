/**
 * Network Utility Functions
 * Handles network connectivity detection and error classification
 */

/**
 * Check if browser reports being online
 * Note: This is a basic check and may not catch all connectivity issues
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Determine if an error is network-related
 * Checks error codes and messages for common network failure patterns
 *
 * @param {Error} error - The error to classify
 * @returns {boolean} - True if error is network-related
 */
export const isNetworkError = (error) => {
  if (!error) return false;

  // Check navigator.onLine first
  if (!navigator.onLine) {
    return true;
  }

  const errorString = error.toString().toLowerCase();
  const errorMessage = (error.message || '').toLowerCase();
  const errorCode = error.code || '';

  // Firebase Storage specific error codes
  const networkErrorCodes = [
    'storage/retry-limit-exceeded',
    'storage/canceled',
    'storage/unknown',
  ];

  if (networkErrorCodes.includes(errorCode)) {
    return true;
  }

  // Common network error patterns
  const networkErrorPatterns = [
    'network request failed',
    'network error',
    'failed to fetch',
    'networkerror',
    'net::err_',
    'connection',
    'timeout',
    'timed out',
    'econnrefused',
    'enotfound',
    'offline',
    'no internet',
    'unreachable',
    'socket hang up',
    'cors',
  ];

  // Check if error message matches any network error pattern
  return networkErrorPatterns.some(
    (pattern) => errorString.includes(pattern) || errorMessage.includes(pattern)
  );
};

/**
 * Get user-friendly error message for network errors
 *
 * @param {Error} error - The error object
 * @param {string} context - Context of where error occurred (e.g., 'upload', 'hash', 'metadata')
 * @returns {string} - User-friendly error message
 */
export const getNetworkErrorMessage = (error, context = 'operation') => {
  if (!navigator.onLine) {
    return `No internet connection detected. Please check your network and try again.`;
  }

  switch (context) {
    case 'upload':
      return `Upload failed due to network issues. Please check your connection and retry.`;
    case 'hash':
      return `File processing interrupted by network issues. Please check your connection.`;
    case 'metadata':
      return `Failed to save file information due to network issues. Please check your connection.`;
    case 'check_exists':
      return `Cannot verify file status due to network issues. Please check your connection.`;
    default:
      return `Network error during ${context}. Please check your connection and try again.`;
  }
};

/**
 * Wait for specified delay (used for retry backoff)
 *
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after delay
 */
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Calculate exponential backoff delay
 *
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @returns {number} - Delay in milliseconds
 */
export const getRetryDelay = (attempt) => {
  // Base delay: 2 seconds, doubled for each attempt
  // Attempt 0: 2s, Attempt 1: 4s, Attempt 2: 8s, Attempt 3: 16s
  return Math.pow(2, attempt + 1) * 1000;
};

/**
 * Execute operation with retry logic for network errors
 *
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 4)
 * @param {Function} options.onRetry - Callback called before each retry with (attempt, delay)
 * @param {Function} options.shouldRetry - Custom function to determine if error should be retried
 * @returns {Promise} - Result of operation or throws last error
 */
export const retryOnNetworkError = async (
  operation,
  { maxRetries = 4, onRetry = null, shouldRetry = isNetworkError } = {}
) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a network error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay and notify
      const delayMs = getRetryDelay(attempt);
      if (onRetry) {
        await onRetry(attempt, delayMs);
      }

      // Wait before retrying
      await delay(delayMs);
    }
  }

  // Should never reach here, but throw last error just in case
  throw lastError;
};

/**
 * Check network connectivity by attempting to reach Firebase
 * More reliable than navigator.onLine alone
 *
 * @returns {Promise<boolean>} - True if network is accessible
 */
export const checkNetworkConnectivity = async () => {
  if (!navigator.onLine) {
    return false;
  }

  try {
    // Try to fetch a small resource from Firebase
    // Using HEAD request to minimize data transfer
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js', {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};
