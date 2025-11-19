import { ref } from 'vue';

/**
 * Navigation Performance Tracker
 *
 * Tracks all timing events during document navigation and outputs a single
 * consolidated console message when ALL operations complete, including:
 * - Core navigation (metadata, PDF load, first page render)
 * - Background canvas pre-rendering of adjacent documents
 * - Canvas cache evictions
 *
 * This replaces scattered console.log statements across multiple files with
 * a unified performance tracking system.
 */

/**
 * Module-level singleton to track navigation performance across all component instances
 */
const currentNavigation = ref(null);

// Timeout duration for pre-render completion (10 seconds)
const PRERENDER_TIMEOUT_MS = 10000;

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
 * - Canvas evictions
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
   * @param {number} expectedPreRenders - Number of adjacent docs that will be pre-rendered (0-2)
   */
  const startNavigation = (direction, fromDocId, toDocId, expectedPreRenders = 0) => {
    // Clear any existing timeout
    if (currentNavigation.value?.timeoutId) {
      clearTimeout(currentNavigation.value.timeoutId);
    }

    currentNavigation.value = {
      direction,
      fromDocId,
      toDocId,
      startTime: performance.now(),
      events: [],
      navigationCoreCompleteTime: null,
      expectedPreRenders,
      completedPreRenders: 0,
      timeoutId: null,
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

    // If this is a canvas pre-render event (success, skip, or fail) OR thumbnails completion,
    // increment counter and check completion
    // All outcomes count as "complete" for tracking purposes
    if (eventType === 'canvas_prerender' || eventType === 'thumbnails_complete') {
      currentNavigation.value.completedPreRenders++;
      checkAndCompleteIfReady();
    }
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
   * Mark navigation core as complete (first page rendered)
   * This records the user-facing navigation time but doesn't output yet
   * Waits for background pre-renders to complete before outputting
   */
  const markNavigationCoreComplete = () => {
    if (!currentNavigation.value) {
      return;
    }

    const elapsed = performance.now() - currentNavigation.value.startTime;
    currentNavigation.value.navigationCoreCompleteTime = elapsed;

    // Start timeout to ensure we output even if pre-renders don't complete
    currentNavigation.value.timeoutId = setTimeout(() => {
      if (currentNavigation.value) {
        console.warn('Navigation pre-render timeout - outputting incomplete results');
        outputConsolidatedLog();
      }
    }, PRERENDER_TIMEOUT_MS);

    // Check if we can complete immediately (no pre-renders expected)
    checkAndCompleteIfReady();
  };

  /**
   * Check if navigation is ready to complete and output log
   * Completes when all expected pre-renders are done OR core navigation is done with 0 expected
   *
   * @private
   */
  const checkAndCompleteIfReady = () => {
    if (!currentNavigation.value) {
      return;
    }

    const nav = currentNavigation.value;

    // Ready if core is complete AND (no pre-renders expected OR all pre-renders done)
    const isReady =
      nav.navigationCoreCompleteTime !== null &&
      nav.completedPreRenders >= nav.expectedPreRenders;

    if (isReady) {
      outputConsolidatedLog();
    }
  };

  /**
   * Output the consolidated performance log
   * Called when all operations complete or timeout expires
   *
   * @private
   */
  const outputConsolidatedLog = () => {
    if (!currentNavigation.value) {
      return;
    }

    const nav = currentNavigation.value;

    // Clear timeout
    if (nav.timeoutId) {
      clearTimeout(nav.timeoutId);
    }

    const totalTime = performance.now() - nav.startTime;
    const coreTime = nav.navigationCoreCompleteTime || totalTime;
    const preRenderTime = totalTime - coreTime;

    // Build consolidated message
    const lines = [];

    // Header - simple start marker
    lines.push(`⚡ Navigation to ${nav.direction} document: T = 0ms`);

    // Separate events into core navigation and background operations
    const coreEvents = [];
    const backgroundEvents = [];

    nav.events.forEach((event) => {
      if (
        event.eventType === 'canvas_prerender' ||
        event.eventType === 'canvas_eviction' ||
        event.eventType === 'pdf_preload'
      ) {
        backgroundEvents.push(event);
      } else {
        coreEvents.push(event);
      }
    });

    // Output core navigation events
    coreEvents.forEach((event) => {
      const line = formatEvent(event);
      if (line) {
        lines.push(`  ${line}`);
      }
    });

    // Add separator if there are background events
    if (backgroundEvents.length > 0 && coreEvents.length > 0) {
      lines.push(`  ▸ Navigation core complete in ${coreTime.toFixed(0)}ms`);
    }

    // Output background events
    backgroundEvents.forEach((event) => {
      const line = formatEvent(event, nav.startTime);
      if (line) {
        lines.push(`  ${line}`);
      }
    });

    // Add total time summary if there were background operations
    if (backgroundEvents.length > 0) {
      lines.push(`  ▸ Total time including background operations: ${totalTime.toFixed(0)}ms`);
    }

    // Output single consolidated message
    console.log(lines.join('\n'));

    // Clear navigation state
    currentNavigation.value = null;
  };

  /**
   * Complete navigation tracking immediately (legacy method)
   * Now delegates to markNavigationCoreComplete
   */
  const completeNavigation = () => {
    markNavigationCoreComplete();
  };

  /**
   * Cancel current navigation tracking
   * Used when navigation is interrupted or fails
   */
  const cancelNavigation = () => {
    if (currentNavigation.value?.timeoutId) {
      clearTimeout(currentNavigation.value.timeoutId);
    }
    currentNavigation.value = null;
  };

  /**
   * Format an event into a human-readable log line
   *
   * @param {Object} event - Event object with eventType and data
   * @param {number} startTime - Navigation start time for calculating deltas
   * @returns {string} Formatted log line
   * @private
   */
  const formatEvent = (event, startTime = null) => {
    const { eventType, data, timestamp } = event;

    switch (eventType) {
      case 'metadata_load':
        if (data.cacheHit) {
          return `→ Metadata loaded from cache in ${timestamp.toFixed(0)}ms`;
        } else {
          return `→ Metadata loaded from Firebase in ${timestamp.toFixed(0)}ms`;
        }

      case 'pdf_load':
        if (data.cacheHit) {
          return `→ PDF loaded from cache in ${timestamp.toFixed(0)}ms`;
        } else {
          return `→ PDF loaded from Firestore in ${timestamp.toFixed(0)}ms`;
        }

      case 'canvas_swap':
        return `→ Canvas swap complete in ${timestamp.toFixed(1)}ms (pre-rendered)`;

      case 'first_page_render':
        const fileName = data.fileName || 'unknown.pdf';
        return `→ 🖥️ First page of [${fileName}] rendered in ${timestamp.toFixed(0)}ms (${data.renderType})`;

      case 'all_pages_render':
        return `→ All ${data.totalPages} pages rendered in ${timestamp.toFixed(0)}ms`;

      case 'thumbnails_complete':
        return `→ 🖼️ All ${data.totalPages} thumbnails rendered in ${timestamp.toFixed(0)}ms`;

      case 'canvas_prerender':
        const docIdShort = data.documentId === 'unknown' ? 'unknown' : data.documentId.substring(0, 8);

        if (data.skipped) {
          // Skipped pre-render
          let skipReason = '';
          switch (data.reason) {
            case 'already_cached':
              skipReason = 'already cached';
              break;
            case 'pdf_not_cached':
              skipReason = 'PDF not cached';
              break;
            case 'no_document_id':
              skipReason = 'no document ID';
              break;
            default:
              skipReason = data.reason || 'unknown';
          }
          return `→ Background: Canvas pre-render of [${docIdShort}] skipped (${skipReason})`;
        } else if (data.failed) {
          // Failed pre-render
          return `→ Background: Canvas pre-render of [${docIdShort}] failed (${data.error || 'unknown error'})`;
        } else {
          // Successful pre-render
          return `→ Background: Canvas pre-render of [${docIdShort}] page ${data.pageNumber} complete (${timestamp.toFixed(0)}ms)`;
        }

      case 'canvas_eviction':
        return `→ Background: Evicted canvas [${data.documentId.substring(0, 8)}] page ${data.pageNumber} from cache (LRU)`;

      case 'pdf_preload':
        const pdfDocIdShort = data.documentId === 'unknown' ? 'unknown' : data.documentId.substring(0, 8);

        if (data.skipped) {
          // Skipped PDF preload
          if (data.reason === 'unsupported_format') {
            return `→ Background: PDF preload of [${pdfDocIdShort}] skipped for unsupported file format: .${data.extension}`;
          } else {
            return `→ Background: PDF preload of [${pdfDocIdShort}] skipped (${data.reason})`;
          }
        } else if (data.failed) {
          // Failed PDF preload
          return `→ Background: PDF preload of [${pdfDocIdShort}] failed (${data.error || 'unknown error'})`;
        } else {
          // Successful PDF preload
          return `→ Background: PDF preload of [${pdfDocIdShort}] complete (${timestamp.toFixed(0)}ms)`;
        }

      default:
        return null;
    }
  };

  return {
    startNavigation,
    recordEvent,
    getStartTime,
    isNavigationActive,
    markNavigationCoreComplete,
    completeNavigation,
    cancelNavigation,
  };
}
