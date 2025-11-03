import { ref, shallowRef } from 'vue';
import { getMemoryStats, formatMemoryForLog } from '@/utils/memoryTracking.js';

/**
 * Module-level singleton cache for pre-rendered canvas content
 * Shared across all component instances to persist across navigations
 *
 * Cache structure: Map<cacheKey, CacheEntry>
 * Cache key format: `${documentId}-${pageNumber}`
 * CacheEntry: {
 *   bitmap,         // ImageBitmap (transferred from OffscreenCanvas or created from canvas)
 *   width,          // Canvas width in pixels
 *   height,         // Canvas height in pixels
 *   timestamp,      // LRU timestamp
 *   documentId,     // Source document ID
 *   pageNumber      // Source page number
 * }
 */
const canvasCache = shallowRef(new Map());

// Cache statistics for monitoring (module-level singleton)
const cacheHits = ref(0);
const cacheMisses = ref(0);
const preRenderAttempts = ref(0);
const preRenderSuccesses = ref(0);
const preRenderFailures = ref(0);

// Maximum number of pre-rendered canvases to keep in cache
// Strategy: Current doc page 1 + 2 adjacent docs page 1 = 3 total
const MAX_CACHE_SIZE = 3;

/**
 * Composable for pre-rendering and caching PDF page canvases
 *
 * Implements background canvas pre-rendering to achieve instant navigation:
 * - Pre-renders page 1 of adjacent documents during idle time
 * - Caches as ImageBitmap (memory-efficient, transferable)
 * - Provides instant canvas swap on navigation (5-15ms vs 650-750ms)
 *
 * LRU cache with MAX_CACHE_SIZE = 3 to balance memory vs hit rate.
 *
 * NOTE: Cache is a module-level singleton, shared across all calls to useCanvasPreloader()
 *
 * @returns {Object} Canvas preloader state and functions
 */
export function useCanvasPreloader() {

  /**
   * Generate cache key for a document page
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {string} Cache key
   * @private
   */
  const getCacheKey = (documentId, pageNumber) => {
    return `${documentId}-${pageNumber}`;
  };

  /**
   * Check if a page canvas is pre-rendered and cached
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {boolean} True if canvas is cached and valid
   */
  const hasPreRenderedCanvas = (documentId, pageNumber) => {
    const key = getCacheKey(documentId, pageNumber);
    if (!canvasCache.value.has(key)) {
      return false;
    }

    const entry = canvasCache.value.get(key);
    return entry?.bitmap != null;
  };

  /**
   * Get a pre-rendered canvas from cache
   *
   * Returns an ImageBitmap that can be drawn to a canvas using ctx.drawImage()
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {number} pageNumber - Page number (1-indexed)
   * @returns {ImageBitmap|null} Cached ImageBitmap or null if not cached
   */
  const getPreRenderedCanvas = (documentId, pageNumber) => {
    const key = getCacheKey(documentId, pageNumber);

    if (!canvasCache.value.has(key)) {
      cacheMisses.value++;

      const memoryStats = getMemoryStats();
      const hitRate = cacheHits.value + cacheMisses.value > 0
        ? `${((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(1)}%`
        : 'N/A';

      console.info(
        `❌ Canvas cache MISS | ${hitRate} | ${formatMemoryForLog(memoryStats, canvasCache.value.size)}`,
        {
          documentId: documentId.substring(0, 8),
          pageNumber,
          cacheSize: canvasCache.value.size,
          hitRate,
          memory: memoryStats,
        }
      );

      return null;
    }

    const entry = canvasCache.value.get(key);

    if (!entry?.bitmap) {
      // Invalid entry, evict it
      console.warn('Invalid canvas cache entry found, evicting', { documentId, pageNumber });
      evictCanvas(documentId, pageNumber);
      cacheMisses.value++;
      return null;
    }

    cacheHits.value++;

    const memoryStats = getMemoryStats();
    const hitRate = `${((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(1)}%`;

    console.info(
      `✅ Canvas cache HIT | ${hitRate} | ${formatMemoryForLog(memoryStats, canvasCache.value.size)}`,
      {
        documentId: documentId.substring(0, 8),
        pageNumber,
        cacheSize: canvasCache.value.size,
        hitRate,
        dimensions: `${entry.width}×${entry.height}`,
        memory: memoryStats,
      }
    );

    // Update timestamp for LRU tracking
    entry.timestamp = Date.now();

    return entry.bitmap;
  };

  /**
   * Pre-render a PDF page to canvas and cache as ImageBitmap
   *
   * Renders the page to a temporary canvas, converts to ImageBitmap for efficient storage,
   * then caches for instant display on navigation.
   *
   * Uses requestIdleCallback when available to avoid blocking the main thread.
   *
   * @param {PDFDocumentProxy} pdfDocument - PDF.js document object
   * @param {number} pageNumber - Page number to pre-render (1-indexed)
   * @param {string} documentId - Document ID for cache key
   * @param {number} scale - Render scale (default: 1.5 for 96 DPI)
   * @returns {Promise<void>}
   */
  const preRenderPage = async (pdfDocument, pageNumber, documentId, scale = 1.5) => {
    preRenderAttempts.value++;

    try {
      // Get the page
      const page = await pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale });

      // Create temporary canvas for rendering
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      // Convert canvas to ImageBitmap (more memory-efficient than storing full canvas)
      let bitmap;
      if (typeof createImageBitmap === 'function') {
        bitmap = await createImageBitmap(canvas);
      } else {
        // Fallback for browsers without createImageBitmap (rare, but handle gracefully)
        console.warn('createImageBitmap not supported, using canvas fallback');
        bitmap = canvas; // Store canvas itself as fallback
      }

      // Cache the bitmap
      const key = getCacheKey(documentId, pageNumber);
      canvasCache.value.set(key, {
        bitmap,
        width: viewport.width,
        height: viewport.height,
        timestamp: Date.now(),
        documentId,
        pageNumber,
      });

      preRenderSuccesses.value++;

      console.info('✅ Canvas pre-render complete', {
        documentId: documentId.substring(0, 8),
        pageNumber,
        dimensions: `${viewport.width}×${viewport.height}`,
        cacheSize: canvasCache.value.size,
      });

      // Enforce cache size limit
      enforceCacheLimit();

      // Clean up temporary canvas (bitmap is independent)
      canvas.width = 0;
      canvas.height = 0;

    } catch (err) {
      preRenderFailures.value++;
      console.warn('Failed to pre-render canvas', {
        documentId: documentId.substring(0, 8),
        pageNumber,
        error: err.message,
      });
      // Non-blocking: Pre-render failure doesn't affect normal rendering
    }
  };

  /**
   * Pre-render first page of adjacent documents in background (idle time)
   *
   * This is the main entry point for background pre-rendering.
   * Uses requestIdleCallback to avoid impacting current page performance.
   *
   * @param {PDFDocumentProxy} pdfDocument - PDF.js document object to pre-render
   * @param {string} documentId - Document ID for cache key
   * @param {number} scale - Render scale (default: 1.5 for 96 DPI)
   * @returns {void} Non-blocking, runs in background
   */
  const preRenderDocumentFirstPage = (pdfDocument, documentId, scale = 1.5) => {
    // Check if already cached
    if (hasPreRenderedCanvas(documentId, 1)) {
      console.info('⚡ Canvas already pre-rendered, skipping', {
        documentId: documentId.substring(0, 8),
        pageNumber: 1,
      });
      return;
    }

    // Use requestIdleCallback for non-blocking background work
    if ('requestIdleCallback' in window) {
      requestIdleCallback(
        () => {
          preRenderPage(pdfDocument, 1, documentId, scale);
        },
        { timeout: 5000 } // Fallback: Execute within 5s even if not idle
      );
    } else {
      // Fallback: Use setTimeout with delay for browsers without requestIdleCallback
      setTimeout(() => {
        preRenderPage(pdfDocument, 1, documentId, scale);
      }, 100);
    }
  };

  /**
   * Evict a canvas from cache and clean up resources
   *
   * @param {string} documentId - Document ID
   * @param {number} pageNumber - Page number
   * @private
   */
  const evictCanvas = (documentId, pageNumber) => {
    const key = getCacheKey(documentId, pageNumber);
    const entry = canvasCache.value.get(key);

    if (!entry) {
      return;
    }

    // Clean up ImageBitmap to free memory
    try {
      if (entry.bitmap && typeof entry.bitmap.close === 'function') {
        entry.bitmap.close(); // ImageBitmap cleanup
      }
    } catch (err) {
      console.warn('Error during bitmap cleanup', {
        documentId,
        pageNumber,
        error: err.message,
      });
    }

    // Remove from cache
    canvasCache.value.delete(key);
  };

  /**
   * Enforce cache size limit using LRU (Least Recently Used) eviction
   *
   * @private
   */
  const enforceCacheLimit = () => {
    if (canvasCache.value.size <= MAX_CACHE_SIZE) {
      return;
    }

    // Find the least recently used entry
    let oldestKey = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of canvasCache.value.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = canvasCache.value.get(oldestKey);
      console.info('🗑️ Evicting oldest canvas from cache (LRU)', {
        documentId: entry.documentId.substring(0, 8),
        pageNumber: entry.pageNumber,
        age: `${((Date.now() - entry.timestamp) / 1000).toFixed(1)}s`,
      });
      evictCanvas(entry.documentId, entry.pageNumber);
    }
  };

  /**
   * Clear all cached canvases and reset statistics
   */
  const clearCache = () => {
    // Clean up all bitmaps
    for (const [key, entry] of canvasCache.value.entries()) {
      try {
        if (entry.bitmap && typeof entry.bitmap.close === 'function') {
          entry.bitmap.close();
        }
      } catch (err) {
        console.warn('Error during bulk canvas cleanup', { key, error: err.message });
      }
    }

    // Clear cache and reset statistics
    canvasCache.value.clear();
    cacheHits.value = 0;
    cacheMisses.value = 0;
    preRenderAttempts.value = 0;
    preRenderSuccesses.value = 0;
    preRenderFailures.value = 0;
  };

  /**
   * Get current cache statistics
   *
   * @returns {Object} Cache statistics
   */
  const getCacheStats = () => {
    const totalRequests = cacheHits.value + cacheMisses.value;
    const hitRate = totalRequests > 0
      ? ((cacheHits.value / totalRequests) * 100).toFixed(1)
      : 0;

    const successRate = preRenderAttempts.value > 0
      ? ((preRenderSuccesses.value / preRenderAttempts.value) * 100).toFixed(1)
      : 0;

    return {
      size: canvasCache.value.size,
      maxSize: MAX_CACHE_SIZE,
      hits: cacheHits.value,
      misses: cacheMisses.value,
      hitRate: `${hitRate}%`,
      preRenderAttempts: preRenderAttempts.value,
      preRenderSuccesses: preRenderSuccesses.value,
      preRenderFailures: preRenderFailures.value,
      preRenderSuccessRate: `${successRate}%`,
      cachedPages: Array.from(canvasCache.value.values()).map(e => ({
        documentId: e.documentId.substring(0, 8),
        pageNumber: e.pageNumber,
        dimensions: `${e.width}×${e.height}`,
      })),
    };
  };

  return {
    // Methods
    hasPreRenderedCanvas,
    getPreRenderedCanvas,
    preRenderPage,
    preRenderDocumentFirstPage,
    clearCache,
    getCacheStats,

    // Statistics (read-only)
    cacheHits,
    cacheMisses,
    preRenderAttempts,
    preRenderSuccesses,
    preRenderFailures,
  };
}
