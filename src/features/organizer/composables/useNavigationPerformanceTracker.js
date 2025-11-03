import { ref } from 'vue';

/**
 * Navigation Performance Tracker
 *
 * Tracks all timing events during document navigation and outputs a single
 * consolidated console message when navigation is complete.
 *
 * This replaces scattered console.log statements across multiple files with
 * a unified performance tracking system.
 */

/**
 * Module-level singleton to track navigation performance across all component instances
 */
const currentNavigation = ref(null);

/**
 * Composable for tracking document navigation performance
 *
 * Collects timing data from various stages of navigation:
 * - Metadata loading (cache hit/miss)
 * - PDF loading (cache hit/miss)
 * - First page rendering
 * - Canvas swap (if pre-rendered)
 * - Thumbnail rendering
 * - Canvas pre-rendering (background)
 *
 * @returns {Object} Navigation tracking methods
 */
export function useNavigationPerformanceTracker() {
  /**
   * Start tracking a new navigation
   *
   * @param {string} direction - 'next' or 'previous'
   * @param {string} fromDocId - Source document ID
   * @param {string} toDocId - Target document ID
   */
  const startNavigation = (direction, fromDocId, toDocId) => {
    currentNavigation.value = {
      direction,
      fromDocId,
      toDocId,
      startTime: performance.now(),
      events: [],
    };
  };

  /**
   * Record a navigation event with timing
   *
   * @param {string} eventType - Type of event (e.g., 'metadata_load', 'pdf_load')
   * @param {Object} data - Event-specific data
   */
  const recordEvent = (eventType, data) => {
    if (!currentNavigation.value) {
      return; // No active navigation
    }

    const elapsed = performance.now() - currentNavigation.value.startTime;

    currentNavigation.value.events.push({
      eventType,
      timestamp: elapsed,
      data,
    });
  };

  /**
   * Get the start time of the current navigation
   *
   * @returns {number|null} Performance timestamp or null if no active navigation
   */
  const getStartTime = () => {
    return currentNavigation.value?.startTime || null;
  };

  /**
   * Check if there is an active navigation being tracked
   *
   * @returns {boolean} True if navigation is active
   */
  const isNavigationActive = () => {
    return currentNavigation.value !== null;
  };

  /**
   * Complete navigation tracking and output consolidated log
   */
  const completeNavigation = () => {
    if (!currentNavigation.value) {
      return; // No active navigation
    }

    const nav = currentNavigation.value;
    const totalTime = performance.now() - nav.startTime;

    // Build consolidated message
    const lines = [];
    const directionArrow = nav.direction === 'next' ? '➡️' : '⬅️';

    lines.push(
      `⚡ ${directionArrow} Navigation to ${nav.direction} document complete (${totalTime.toFixed(0)}ms total):`
    );

    // Process events in chronological order
    nav.events.forEach((event) => {
      const line = formatEvent(event);
      if (line) {
        lines.push(`  ${line}`);
      }
    });

    // Output single consolidated message
    console.log(lines.join('\n'), {
      direction: nav.direction,
      fromDoc: nav.fromDocId,
      toDoc: nav.toDocId.substring(0, 8),
      totalMs: totalTime.toFixed(1),
      eventCount: nav.events.length,
    });

    // Clear navigation state
    currentNavigation.value = null;
  };

  /**
   * Cancel current navigation tracking
   * Used when navigation is interrupted or fails
   */
  const cancelNavigation = () => {
    currentNavigation.value = null;
  };

  /**
   * Format an event into a human-readable log line
   *
   * @param {Object} event - Event object with eventType and data
   * @returns {string} Formatted log line
   * @private
   */
  const formatEvent = (event) => {
    const { eventType, data } = event;

    switch (eventType) {
      case 'metadata_load':
        if (data.cacheHit) {
          return `→ Metadata loaded from cache in ${data.duration.toFixed(0)}ms`;
        } else {
          return `→ Metadata loaded from Firebase in ${data.duration.toFixed(0)}ms`;
        }

      case 'pdf_load':
        if (data.cacheHit) {
          return `→ PDF loaded from cache in ${data.duration.toFixed(0)}ms`;
        } else {
          return `→ PDF loaded from Firestore in ${data.duration.toFixed(0)}ms`;
        }

      case 'canvas_swap':
        return `→ Canvas swap complete in ${data.duration.toFixed(1)}ms (pre-rendered)`;

      case 'first_page_render':
        const performance = data.isOptimal ? '🚀' : data.isGood ? '✅' : '⚠️';
        return `→ ${performance} First page rendered in ${data.duration.toFixed(0)}ms (${data.renderType})`;

      case 'all_pages_render':
        return `→ All ${data.totalPages} pages rendered in ${data.duration.toFixed(0)}ms`;

      case 'thumbnails_complete':
        return `→ All ${data.totalPages} thumbnails rendered in ${data.duration.toFixed(0)}ms`;

      case 'canvas_prerender':
        return `→ Background: Canvas pre-render of [${data.documentId.substring(0, 8)}] page ${data.pageNumber} complete`;

      default:
        return null;
    }
  };

  return {
    startNavigation,
    recordEvent,
    getStartTime,
    isNavigationActive,
    completeNavigation,
    cancelNavigation,
  };
}
