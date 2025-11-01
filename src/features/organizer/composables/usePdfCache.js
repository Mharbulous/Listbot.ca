import { ref, shallowRef } from 'vue';
import { pdfjsLib } from '@/config/pdfWorker.js';
import { LogService } from '@/services/logService.js';

/**
 * Module-level singleton cache shared across all component instances
 * This ensures the cache persists across navigations and component re-renders
 *
 * Cache structure: Map<documentId, CacheEntry>
 * CacheEntry: { loadingTask, pdfDocument, downloadUrl, timestamp }
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
   * Get a PDF document from cache or load it if not cached
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {string|null} downloadUrl - Firebase Storage download URL (required for cache miss, optional for cache hit)
   * @returns {Promise<PDFDocumentProxy>} The loaded PDF document
   */
  const getDocument = async (documentId, downloadUrl = null) => {
    // DEBUG: Log cache state on entry
    LogService.info('🔍 Cache lookup', {
      requestedDocId: documentId,
      cacheSize: cache.value.size,
      cachedDocIds: Array.from(cache.value.keys()),
      hasDocument: cache.value.has(documentId),
    });

    // Check cache first
    if (cache.value.has(documentId)) {
      const entry = cache.value.get(documentId);

      // Verify the cached document is still valid
      if (entry.pdfDocument) {
        cacheHits.value++;
        LogService.info('✅ PDF cache HIT', {
          documentId,
          cacheSize: cache.value.size,
          hitRate: `${((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(1)}%`
        });

        // Update timestamp for LRU tracking
        entry.timestamp = Date.now();
        return entry.pdfDocument;
      } else {
        // Cache entry is invalid (no pdfDocument), remove it
        LogService.warn('Invalid cache entry found, evicting', { documentId });
        await evictDocument(documentId);
      }
    }

    // Cache miss - load the document
    cacheMisses.value++;
    LogService.info('❌ PDF cache MISS', {
      documentId,
      cacheSize: cache.value.size,
      hitRate: cacheHits.value + cacheMisses.value > 0
        ? `${((cacheHits.value / (cacheHits.value + cacheMisses.value)) * 100).toFixed(1)}%`
        : 'N/A'
    });

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
      LogService.debug('Loading PDF document', { documentId, url: downloadUrl });

      // Load PDF document with streaming enabled for better performance
      const loadingTask = pdfjsLib.getDocument({
        url: downloadUrl,
        // Enable streaming for better performance
        disableAutoFetch: false,
        disableStream: false,
      });

      const pdfDocument = await loadingTask.promise;

      LogService.info('PDF document loaded successfully', {
        documentId,
        totalPages: pdfDocument.numPages,
      });

      // Add to cache
      const entry = {
        loadingTask,
        pdfDocument,
        downloadUrl,
        timestamp: Date.now(),
      };

      cache.value.set(documentId, entry);

      // Enforce cache size limit using LRU eviction
      await enforceCacheLimit();

      return pdfDocument;
    } catch (err) {
      LogService.error('Failed to load PDF document', err, { documentId });
      throw err;
    }
  };

  /**
   * Pre-load adjacent documents for instant navigation
   *
   * @param {string|null} previousId - Previous document ID (null if at start)
   * @param {string|null} nextId - Next document ID (null if at end)
   * @param {Function} getDownloadUrl - Async function to get download URL for a document ID
   */
  const preloadAdjacentDocuments = async (previousId, nextId, getDownloadUrl) => {
    const preloadPromises = [];

    // Pre-load previous document if it exists and isn't cached
    if (previousId && !cache.value.has(previousId)) {
      LogService.debug('Pre-loading previous document', { previousId });
      preloadPromises.push(
        getDownloadUrl(previousId)
          .then(url => loadAndCacheDocument(previousId, url))
          .catch(err => {
            LogService.warn('Failed to pre-load previous document', { previousId, error: err.message });
          })
      );
    }

    // Pre-load next document if it exists and isn't cached
    if (nextId && !cache.value.has(nextId)) {
      LogService.debug('Pre-loading next document', { nextId });
      preloadPromises.push(
        getDownloadUrl(nextId)
          .then(url => loadAndCacheDocument(nextId, url))
          .catch(err => {
            LogService.warn('Failed to pre-load next document', { nextId, error: err.message });
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

    LogService.debug('Evicting document from cache', { documentId });

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
      LogService.warn('Error during document eviction cleanup', { documentId, error: err.message });
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
      LogService.debug('Cache limit exceeded, evicting oldest document', {
        documentId: oldestId,
        cacheSize: cache.value.size,
        maxSize: MAX_CACHE_SIZE
      });
      await evictDocument(oldestId);
    }
  };

  /**
   * Clear all cached documents and reset cache
   */
  const clearCache = async () => {
    LogService.debug('Clearing entire PDF cache', { cacheSize: cache.value.size });

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
    preloadAdjacentDocuments,
    clearCache,
    getCacheStats,

    // Statistics (read-only)
    cacheHits,
    cacheMisses,
  };
}
