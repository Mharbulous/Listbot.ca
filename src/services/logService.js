/**
 * LogService - Centralized logging service for the Bookkeeper application
 *
 * Provides standardized logging methods with automatic filtering of debug logs in production.
 * Eliminates duplicate logging patterns across services, composables, and stores.
 *
 * @see docs/CLAUDE.md for usage guidelines
 */

export class LogService {
  /**
   * Debug logging - automatically filtered out in production builds
   * Use for temporary debugging, flow tracing, and development-only information
   *
   * @param {string} message - The debug message
   * @param {...any} args - Additional arguments to log
   * @example
   * LogService.debug('Component mounted', { props, state })
   */
  static debug(message, ...args) {
    if (import.meta.env.DEV) {
      console.debug(message, ...args)
    }
  }

  /**
   * Info logging - always shown in production
   * Use for application events, user actions, and important state changes
   *
   * @param {string} message - The info message
   * @param {...any} args - Additional arguments to log
   * @example
   * LogService.info('User logged in', { userId, teamId })
   */
  static info(message, ...args) {
    console.info(message, ...args)
  }

  /**
   * Warning logging - always shown in production
   * Use for degraded states, fallbacks, and non-critical issues
   *
   * @param {string} message - The warning message
   * @param {...any} args - Additional arguments to log
   * @example
   * LogService.warn('Using fallback configuration', { reason })
   */
  static warn(message, ...args) {
    console.warn(message, ...args)
  }

  /**
   * Error logging - always shown in production
   * Use for errors and exceptions with context
   *
   * @param {string} message - The error message
   * @param {Error} error - The error object
   * @param {Object} context - Additional context for debugging
   * @example
   * LogService.error('Failed to create matter', error, { matterId, userId })
   */
  static error(message, error, context = {}) {
    console.error(message, error, context)
  }

  /**
   * Performance logging - always shown in production
   * Use for timing metrics and performance monitoring
   * Automatically formats with ⚡ prefix
   *
   * @param {string} event - The event/operation being measured
   * @param {number} duration - Duration in milliseconds
   * @param {Object} meta - Additional metadata
   * @example
   * LogService.performance('File hash computation', 1234, { fileCount: 5 })
   */
  static performance(event, duration, meta = {}) {
    console.log(`⚡ ${event}: ${duration}ms`, meta)
  }

  /**
   * Service operation logging - always shown in production
   * Use for logging service layer operations with standardized format
   * Automatically formats with [ServiceName] prefix
   *
   * @param {string} name - The service name
   * @param {string} operation - The operation being performed
   * @param {...any} args - Additional arguments to log
   * @example
   * LogService.service('MatterService', 'created', matterId)
   * LogService.service('AuthService', 'login attempt', { email })
   */
  static service(name, operation, ...args) {
    this.info(`[${name}] ${operation}`, ...args)
  }
}
