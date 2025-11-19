import { ref, shallowRef } from 'vue';

/**
 * Module-level singleton cache for pre-rendered page canvases
 * Shared across component instances to persist during document viewing
 *
 * Cache structure: Map<pageNumber, CacheEntry>
 * Cache key: pageNumber (integer)
 * CacheEntry: {
 *   bitmap,         // ImageBitmap (pre-rendered page canvas)
 *   width,          // Canvas width in pixels
 *   height,         // Canvas height in pixels
 *   timestamp,      // Creation timestamp
 *   pageNumber      // Page number
 * }
 */
const pageCache = shallowRef(new Map());

// Current document ID (to detect document changes)
const currentDocumentId = ref(null);

// Cache statistics for monitoring
const cacheHits = ref(0);
const cacheMisses = ref(0);
const preRenderAttempts = ref(0);
const preRenderSuccesses = ref(0);
const preRenderFailures = ref(0);

/**
 * Composable for pre-rendering and caching PDF pages within the current document
 *
 * Strategy 8: Smart Preloading with Scroll Prediction
 * - Pre-renders the next page during idle time while user views current page
 * - Uses requestIdleCallback for non-blocking background rendering
 * - Caches as ImageBitmap for memory efficiency
 * - Provides instant page display when user scrolls forward (0-20ms)
 *
 * Works in conjunction with Strategy 7 (Virtualized Rendering):
 * - Strategy 7: Only renders visible pages ±1, destroys others
 * - Strategy 8: Pre-renders next page in background for instant display
 *
 * @returns {Object} Page preloader state and functions
 */
export function usePagePreloader() {
  /**
   * Check if a page is pre-rendered and cached
   *
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {boolean} True if page is cached and valid
   */
  const hasPreRenderedPage = (pageNumber) => {
    if (!pageCache.value.has(pageNumber)) {
      return false;
    }

    const entry = pageCache.value.get(pageNumber);
    return entry?.bitmap != null;
  };

  /**
   * Get a pre-rendered page from cache
   *
   * Returns an ImageBitmap that can be drawn to a canvas using ctx.drawImage()
   *
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {ImageBitmap|null} Cached ImageBitmap or null if not cached
   */
  const getPreRenderedPage = (pageNumber) => {
    if (!pageCache.value.has(pageNumber)) {
      cacheMisses.value++;

      const hitRate =
        cacheHits.value + cacheMisses.value > 0
          ? `${((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(1)}%`
          : 'N/A';

      console.info(`❌ Page cache MISS | Hit rate: ${hitRate}`, {
        pageNumber,
        cacheSize: pageCache.value.size,
        hits: cacheHits.value,
        misses: cacheMisses.value,
      });

      return null;
    }

    const entry = pageCache.value.get(pageNumber);
    if (!entry?.bitmap) {
      cacheMisses.value++;
      return null;
    }

    cacheHits.value++;

    const hitRate = `${((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(1)}%`;

    console.info(`✅ Page cache HIT | Hit rate: ${hitRate}`, {
      pageNumber,
      dimensions: `${entry.width}×${entry.height}`,
      cacheSize: pageCache.value.size,
      hits: cacheHits.value,
      misses: cacheMisses.value,
    });

    return entry.bitmap;
  };

  /**
   * Pre-render a page to ImageBitmap and cache it
   *
   * Uses requestIdleCallback to avoid blocking current page performance
   *
   * @param {Object} pdfDocument - PDF.js document object
   * @param {number} pageNumber - Page number to pre-render (1-indexed)
   * @param {number} width - Target canvas width (default: 883.2px = 9.2in at 96 DPI)
   * @param {number} height - Target canvas height (default: 1056px = 11in at 96 DPI)
   * @returns {Promise<boolean>} True if successfully pre-rendered, false otherwise
   */
  const preRenderPage = async (pdfDocument, pageNumber, width = 883.2, height = 1056) => {
    if (!pdfDocument || !pageNumber) {
      return false;
    }

    // Skip if already cached
    if (hasPreRenderedPage(pageNumber)) {
      console.debug(`⏭️ Page ${pageNumber} already pre-rendered, skipping`);
      return true;
    }

    preRenderAttempts.value++;
    const startTime = performance.now();

    try {
      // Get the page from PDF.js
      const page = await pdfDocument.getPage(pageNumber);

      // Calculate scale to fit width
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = width / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Create an offscreen canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      const ctx = canvas.getContext('2d');

      // Render the page to the canvas
      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to ImageBitmap (more memory-efficient than keeping the canvas)
      const bitmap = await createImageBitmap(canvas);

      // Cache the bitmap
      pageCache.value.set(pageNumber, {
        bitmap,
        width: canvas.width,
        height: canvas.height,
        timestamp: Date.now(),
        pageNumber,
      });

      preRenderSuccesses.value++;

      const renderTime = performance.now() - startTime;

      console.info(`🎨 Pre-rendered page ${pageNumber} in ${renderTime.toFixed(1)}ms`, {
        pageNumber,
        dimensions: `${canvas.width}×${canvas.height}`,
        renderTime: renderTime.toFixed(1) + 'ms',
        cacheSize: pageCache.value.size,
        successRate: `${((preRenderSuccesses.value / preRenderAttempts.value) * 100).toFixed(1)}%`,
      });

      return true;
    } catch (err) {
      preRenderFailures.value++;

      console.warn(`Failed to pre-render page ${pageNumber}`, {
        pageNumber,
        error: err.message,
        successRate: `${((preRenderSuccesses.value / preRenderAttempts.value) * 100).toFixed(1)}%`,
      });

      return false;
    }
  };

  /**
   * Pre-render a page during idle time (non-blocking)
   *
   * Uses requestIdleCallback to ensure no impact on current page performance
   *
   * @param {Object} pdfDocument - PDF.js document object
   * @param {number} pageNumber - Page number to pre-render (1-indexed)
   * @param {number} width - Target canvas width
   * @param {number} height - Target canvas height
   */
  const preRenderPageIdle = (pdfDocument, pageNumber, width = 883.2, height = 1056) => {
    // Use requestIdleCallback if available, fallback to setTimeout
    const scheduleIdleTask = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

    console.debug(`[S8] Idle callback scheduled for page ${pageNumber}`);

    scheduleIdleTask(() => {
      console.debug(`[S8] Idle callback executing for page ${pageNumber}`);
      preRenderPage(pdfDocument, pageNumber, width, height);
    });
  };

  /**
   * Clear the page cache
   *
   * Should be called when switching to a different document
   *
   * @param {string} newDocumentId - The new document ID (optional, for tracking)
   */
  const clearCache = (newDocumentId = null) => {
    const previousSize = pageCache.value.size;

    // Close all ImageBitmaps to free memory
    pageCache.value.forEach((entry) => {
      if (entry.bitmap) {
        entry.bitmap.close();
      }
    });

    // Clear the cache
    pageCache.value.clear();

    // Reset statistics
    cacheHits.value = 0;
    cacheMisses.value = 0;

    // Update current document ID
    const previousDocId = currentDocumentId.value;
    currentDocumentId.value = newDocumentId;

    console.info('🗑️ Page cache cleared', {
      previousDocumentId: previousDocId ? previousDocId.substring(0, 8) : 'none',
      newDocumentId: newDocumentId ? newDocumentId.substring(0, 8) : 'none',
      clearedEntries: previousSize,
    });
  };

  /**
   * Get cache statistics
   *
   * @returns {Object} Cache statistics
   */
  const getCacheStats = () => {
    const totalRequests = cacheHits.value + cacheMisses.value;
    const hitRate =
      totalRequests > 0 ? ((cacheHits.value / totalRequests) * 100).toFixed(1) : 0;

    const totalAttempts = preRenderAttempts.value;
    const successRate =
      totalAttempts > 0
        ? ((preRenderSuccesses.value / totalAttempts) * 100).toFixed(1)
        : 0;

    return {
      cacheSize: pageCache.value.size,
      hits: cacheHits.value,
      misses: cacheMisses.value,
      hitRate: `${hitRate}%`,
      preRenderAttempts: preRenderAttempts.value,
      preRenderSuccesses: preRenderSuccesses.value,
      preRenderFailures: preRenderFailures.value,
      successRate: `${successRate}%`,
    };
  };

  return {
    // Cache access
    hasPreRenderedPage,
    getPreRenderedPage,

    // Pre-rendering
    preRenderPage,
    preRenderPageIdle,

    // Cache management
    clearCache,
    getCacheStats,

    // Statistics (for monitoring)
    cacheHits,
    cacheMisses,
    preRenderAttempts,
    preRenderSuccesses,
    preRenderFailures,
  };
}
