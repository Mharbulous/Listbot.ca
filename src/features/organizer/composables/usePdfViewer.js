import { ref, shallowRef } from 'vue';
import { pdfjsLib } from '@/config/pdfWorker.js';
import { usePdfCache } from './usePdfCache.js';

/**
 * Composable for PDF viewing functionality
 *
 * Handles loading PDF documents and managing page rendering lifecycle.
 * Uses document caching for instant navigation between PDFs.
 * Provides reactive state for loading/error states and cleanup functionality.
 *
 * @returns {Object} PDF viewer state and functions
 */
export function usePdfViewer() {
  // Initialize PDF cache
  const pdfCache = usePdfCache();

  // State
  const pdfDocument = shallowRef(null);
  const currentDocumentId = ref(null);
  const totalPages = ref(0);
  const loadingDocument = ref(false);
  const renderingPages = shallowRef(new Set());
  const loadError = ref(null);

  /**
   * Check if a document is already cached
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @returns {boolean} True if document is cached and ready
   */
  const isDocumentCached = (documentId) => {
    return pdfCache.hasDocument(documentId);
  };

  /**
   * Get cached metadata for a document
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @returns {Object|null} Cached metadata or null if not cached
   */
  const getCachedMetadata = (documentId) => {
    return pdfCache.getMetadata(documentId);
  };

  /**
   * Cache metadata for a document
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {Object} metadata - Metadata object with evidenceData, sourceVariants, storageMetadata
   */
  const cacheMetadata = (documentId, metadata) => {
    pdfCache.setMetadata(documentId, metadata);
  };

  /**
   * Load PDF document from Firebase Storage URL using cache
   *
   * @param {string} documentId - Unique document identifier (file hash)
   * @param {string|null} downloadUrl - Firebase Storage download URL (optional if cached)
   */
  const loadPdf = async (documentId, downloadUrl = null) => {
    try {
      loadingDocument.value = true;
      loadError.value = null;

      // Get document from cache (instant if cached, loads if not)
      const pdfDoc = await pdfCache.getDocument(documentId, downloadUrl);

      pdfDocument.value = pdfDoc;
      currentDocumentId.value = documentId;
      totalPages.value = pdfDoc.numPages;
    } catch (err) {
      console.error('Failed to load PDF document', err, { documentId });
      loadError.value = err.message || 'Failed to load PDF document';
      pdfDocument.value = null;
      currentDocumentId.value = null;
      totalPages.value = 0;
    } finally {
      loadingDocument.value = false;
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
    await pdfCache.preloadAdjacentDocuments(previousId, nextId, getDownloadUrl);
  };

  /**
   * Render a single PDF page to a canvas element
   *
   * @param {number} pageNumber - Page number to render (1-indexed)
   * @param {HTMLCanvasElement} canvas - Canvas element to render to
   * @param {number} targetWidth - Target width in pixels (default: 883.2px = 9.2in at 96 DPI)
   * @returns {Promise<void>}
   */
  const renderPage = async (pageNumber, canvas, targetWidth = 883.2) => {
    if (!pdfDocument.value) {
      throw new Error('PDF document not loaded');
    }

    if (renderingPages.value.has(pageNumber)) {
      return;
    }

    try {
      renderingPages.value.add(pageNumber);

      // Get page from document
      const page = await pdfDocument.value.getPage(pageNumber);

      // Get page viewport at default scale
      const viewport = page.getViewport({ scale: 1.0 });

      // Calculate scale to fit target width (9.2in = 883.2 CSS pixels at 96 DPI)
      const scale = targetWidth / viewport.width;

      // Apply scale to get final viewport
      const scaledViewport = page.getViewport({ scale });

      // Set canvas dimensions
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render to canvas
      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;
    } catch (err) {
      console.error(`Failed to render page ${pageNumber}`, err);
      throw err;
    } finally {
      renderingPages.value.delete(pageNumber);
    }
  };

  /**
   * Clean up PDF resources when component unmounts
   */
  const cleanup = async () => {
    // Clear all cached documents (cache handles resource cleanup)
    await pdfCache.clearCache();

    // Clear local state
    pdfDocument.value = null;
    currentDocumentId.value = null;
    totalPages.value = 0;
    renderingPages.value.clear();
    loadError.value = null;
    loadingDocument.value = false;
  };

  /**
   * Get cache statistics for monitoring
   *
   * @returns {Object} Cache statistics
   */
  const getCacheStats = () => {
    return pdfCache.getCacheStats();
  };

  return {
    // State
    pdfDocument,
    currentDocumentId,
    totalPages,
    loadingDocument,
    renderingPages,
    loadError,

    // Methods
    isDocumentCached,
    getCachedMetadata,
    cacheMetadata,
    loadPdf,
    preloadAdjacentDocuments,
    renderPage,
    cleanup,
    getCacheStats,
  };
}
