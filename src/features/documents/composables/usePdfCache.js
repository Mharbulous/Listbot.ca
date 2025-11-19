import { ref, shallowRef } from 'vue';
import { pdfjsLib, wasmUrl, standardFontDataUrl } from '@/config/pdfWorker.js';

/**
 * Module-level singleton cache shared across all component instances
 * This ensures the cache persists across navigations and component re-renders
 *
 * Cache structure: Map<documentId, CacheEntry>
 * CacheEntry: {
 *   loadingTask,
 *   pdfDocument,
 *   downloadUrl,
 *   timestamp,
 *   metadata: {
 *     evidenceData,      // Firestore evidence document data
 *     sourceVariants,    // Firestore sourceMetadata variants
 *     storageMetadata,   // Firebase Storage metadata
 *     displayName,       // Computed display name
 *     selectedMetadataHash, // Selected metadata variant hash
 *     pdfMetadata        // Extracted PDF metadata (from usePdfMetadata)
 *   }
 * }
 */
const cache = shallowRef(new Map());

// Cache statistics for monitoring (module-level singleton)
const cacheHits = ref(0);
const cacheMisses = ref(0);

// Maximum number of documents to keep in cache
const MAX_CACHE_SIZE = 3;

/**
 * Composable for caching PDF documents to enable instant navigation
 *
 * Implements a 3-document sliding window cache:
 * - Previous document (for backward navigation)
 * - Current document (active view)
 * - Next document (for forward navigation)
 *
 * Pre-loads adjacent documents to provide instant navigation experience.
 * Properly manages memory by calling loadingTask.destroy() on evicted documents.
 *
 * NOTE: Cache is now a module-level singleton, shared across all calls to usePdfCache()
 *
 * @returns {Object} PDF cache state and functions
 */
export function usePdfCache() {

  /**
   * Check if a document is in the cache and ready to use
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @returns {boolean} True if document is cached and valid
   */
  const hasDocument = (documentId) => {
    if (!cache.value.has(documentId)) {
      return false;
    }

    const entry = cache.value.get(documentId);
    return entry?.pdfDocument != null;
  };

  /**
   * Get cached metadata for a document
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @returns {Object|null} Cached metadata object or null if not cached
   */
  const getMetadata = (documentId) => {
    const entry = cache.value.get(documentId);
    return entry?.metadata || null;
  };

  /**
   * Set metadata for a document (creates cache entry if needed)
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {Object} metadata - Metadata object with evidenceData, sourceVariants, storageMetadata
   */
  const setMetadata = (documentId, metadata) => {
    const entry = cache.value.get(documentId);

    if (entry) {
      // Update existing entry
      entry.metadata = metadata;
      entry.timestamp = Date.now(); // Update LRU timestamp
    } else {
      // Create new cache entry with metadata only
      cache.value.set(documentId, {
        loadingTask: null,
        pdfDocument: null,
        downloadUrl: null,
        timestamp: Date.now(),
        metadata,
      });
    }
  };

  /**
   * Get a PDF document from cache or load it if not cached
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {string|null} downloadUrl - Firebase Storage download URL (required for cache miss, optional for cache hit)
   * @returns {Promise<PDFDocumentProxy>} The loaded PDF document
   */
  const getDocument = async (documentId, downloadUrl = null) => {
    // Check cache first
    if (cache.value.has(documentId)) {
      const entry = cache.value.get(documentId);

      // Verify the cached document is still valid
      if (entry.pdfDocument) {
        cacheHits.value++;

        // Update timestamp for LRU tracking
        entry.timestamp = Date.now();
        return entry.pdfDocument;
      } else {
        // Cache entry is invalid (no pdfDocument), remove it
        console.warn('Invalid cache entry found, evicting', { documentId });
        await evictDocument(documentId);
      }
    }

    // Cache miss - load the document
    cacheMisses.value++;

    // Validate download URL is provided for cache miss
    if (!downloadUrl) {
      throw new Error(`Document ${documentId} not in cache and no download URL provided`);
    }

    return await loadAndCacheDocument(documentId, downloadUrl);
  };

  /**
   * Load a PDF document and add it to the cache
   *
   * @param {string} documentId - Unique document identifier
   * @param {string} downloadUrl - Firebase Storage download URL
   * @returns {Promise<PDFDocumentProxy>} The loaded PDF document
   * @private
   */
  const loadAndCacheDocument = async (documentId, downloadUrl) => {
    try {
      // Load PDF document with streaming enabled for better performance
      const loadingTask = pdfjsLib.getDocument({
        url: downloadUrl,
        // Enable streaming for better performance
        disableAutoFetch: false,
        disableStream: false,
        // Enable hardware acceleration (GPU rendering) for faster page rendering
        // Falls back to Canvas 2D automatically if HWA is not supported
        enableHWA: true,
        // WASM directory for image decoders (JPEG2000/JPX, JXL, color management)
        // PDF.js automatically loads openjpeg.wasm and fallback from this directory
        wasmUrl,
        // Standard fonts directory for font substitution
        // PDF.js loads Foxit font substitutes when PDFs reference missing system fonts
        // Eliminates "undefined TT function" and "Cannot load system font" warnings
        standardFontDataUrl,
      });

      const pdfDocument = await loadingTask.promise;

      // Get existing entry to preserve metadata (if pre-loaded)
      const existingEntry = cache.value.get(documentId);

      // Add to cache - preserve metadata if it was pre-loaded
      const entry = {
        loadingTask,
        pdfDocument,
        downloadUrl,
        timestamp: Date.now(),
        metadata: existingEntry?.metadata || null,
      };

      cache.value.set(documentId, entry);

      // Enforce cache size limit using LRU eviction
      await enforceCacheLimit();

      return pdfDocument;
    } catch (err) {
      console.error('Failed to load PDF document', err, { documentId });
      throw err;
    }
  };

  /**
   * Pre-load adjacent documents for instant navigation
   *
   * @param {string|null} previousId - Previous document ID (null if at start)
   * @param {string|null} nextId - Next document ID (null if at end)
   * @param {Function} getDownloadUrl - Async function to get download URL for a document ID
   * @param {Object|null} performanceTracker - Performance tracker for consolidated logging
   */
  const preloadAdjacentDocuments = async (previousId, nextId, getDownloadUrl, performanceTracker = null) => {
    const preloadPromises = [];

    // Pre-load previous document if it exists and isn't cached
    if (previousId && !cache.value.has(previousId)) {
      preloadPromises.push(
        getDownloadUrl(previousId)
          .then(url => loadAndCacheDocument(previousId, url))
          .catch(err => {
            // Check if error is due to non-PDF file
            if (err.message.startsWith('NON_PDF_FILE:')) {
              const extension = err.message.split(':')[1] || 'unknown';

              // Report to performance tracker if available
              if (performanceTracker && performanceTracker.isNavigationActive()) {
                performanceTracker.recordEvent('pdf_preload', {
                  documentId: previousId,
                  skipped: true,
                  reason: 'unsupported_format',
                  extension,
                });
              } else {
                // Fallback to console.log if no tracker
                const shortId = previousId.substring(0, 8);
                console.log(`Background: PDF preload of [${shortId}] skipped (unsupported file format: .${extension})`);
              }
            } else {
              console.warn('Failed to pre-load previous document', { previousId, error: err.message });
            }
          })
      );
    }

    // Pre-load next document if it exists and isn't cached
    if (nextId && !cache.value.has(nextId)) {
      preloadPromises.push(
        getDownloadUrl(nextId)
          .then(url => loadAndCacheDocument(nextId, url))
          .catch(err => {
            // Check if error is due to non-PDF file
            if (err.message.startsWith('NON_PDF_FILE:')) {
              const extension = err.message.split(':')[1] || 'unknown';

              // Report to performance tracker if available
              if (performanceTracker && performanceTracker.isNavigationActive()) {
                performanceTracker.recordEvent('pdf_preload', {
                  documentId: nextId,
                  skipped: true,
                  reason: 'unsupported_format',
                  extension,
                });
              } else {
                // Fallback to console.log if no tracker
                const shortId = nextId.substring(0, 8);
                console.log(`Background: PDF preload of [${shortId}] skipped (unsupported file format: .${extension})`);
              }
            } else {
              console.warn('Failed to pre-load next document', { nextId, error: err.message });
            }
          })
      );
    }

    // Wait for all pre-loads to complete (but don't block on errors)
    await Promise.allSettled(preloadPromises);
  };

  /**
   * Evict a document from the cache and clean up resources
   *
   * @param {string} documentId - Document ID to evict
   * @private
   */
  const evictDocument = async (documentId) => {
    const entry = cache.value.get(documentId);

    if (!entry) {
      return;
    }

    // Clean up PDF.js resources to prevent memory leaks
    try {
      // Destroy the loading task (aborts network requests, terminates worker)
      if (entry.loadingTask) {
        await entry.loadingTask.destroy();
      }

      // Also destroy the document proxy if it exists
      if (entry.pdfDocument) {
        await entry.pdfDocument.destroy();
      }
    } catch (err) {
      console.warn('Error during document eviction cleanup', { documentId, error: err.message });
    }

    // Remove from cache
    cache.value.delete(documentId);
  };

  /**
   * Enforce cache size limit using LRU (Least Recently Used) eviction
   *
   * @private
   */
  const enforceCacheLimit = async () => {
    if (cache.value.size <= MAX_CACHE_SIZE) {
      return;
    }

    // Find the least recently used entry
    let oldestId = null;
    let oldestTimestamp = Infinity;

    for (const [documentId, entry] of cache.value.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestId = documentId;
      }
    }

    if (oldestId) {
      await evictDocument(oldestId);
    }
  };

  /**
   * Clear all cached documents and reset cache
   */
  const clearCache = async () => {
    // Evict all documents
    const evictPromises = Array.from(cache.value.keys()).map(documentId =>
      evictDocument(documentId)
    );

    await Promise.all(evictPromises);

    // Reset cache and statistics
    cache.value.clear();
    cacheHits.value = 0;
    cacheMisses.value = 0;
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

    return {
      size: cache.value.size,
      maxSize: MAX_CACHE_SIZE,
      hits: cacheHits.value,
      misses: cacheMisses.value,
      hitRate: `${hitRate}%`,
      documents: Array.from(cache.value.keys()),
    };
  };

  return {
    // Methods
    hasDocument,
    getDocument,
    getMetadata,
    setMetadata,
    preloadAdjacentDocuments,
    clearCache,
    getCacheStats,

    // Statistics (read-only)
    cacheHits,
    cacheMisses,
  };
}
