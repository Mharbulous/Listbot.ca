/**
 * Web Worker Configuration Constants
 * Central configuration for worker health monitoring and timeouts
 */

// Health monitoring configuration
export const MAX_HEALTH_FAILURES = 3;
export const HEALTH_CHECK_INTERVAL = 15000; // 15 seconds - less aggressive
export const HEALTH_CHECK_TIMEOUT = 8000; // 8 seconds - more time for response
export const HEALTH_CHECK_GRACE_PERIOD = 30000; // 30 seconds before first health check

// Message timeout configuration
export const DEFAULT_MESSAGE_TIMEOUT = 30000; // 30 second default timeout
