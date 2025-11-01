import { ref, shallowRef } from 'vue';
import { pdfjsLib } from '@/config/pdfWorker.js';
import { LogService } from '@/services/logService.js';

/**
 * Composable for PDF viewing functionality
 *
 * Handles loading PDF documents and managing page rendering lifecycle.
 * Provides reactive state for loading/error states and cleanup functionality.
 *
 * @returns {Object} PDF viewer state and functions
 */
export function usePdfViewer() {
  // State
  const pdfDocument = shallowRef(null);
  const totalPages = ref(0);
  const loadingDocument = ref(false);
  const renderingPages = shallowRef(new Set());
  const loadError = ref(null);

  /**
   * Load PDF document from Firebase Storage URL
   *
   * @param {string} downloadUrl - Firebase Storage download URL
   */
  const loadPdf = async (downloadUrl) => {
    try {
      loadingDocument.value = true;
      loadError.value = null;

      LogService.debug('Loading PDF document', { url: downloadUrl });

      // Load PDF document with streaming enabled for better performance
      const loadingTask = pdfjsLib.getDocument({
        url: downloadUrl,
        // Enable streaming for better performance
        disableAutoFetch: false,
        disableStream: false,
      });

      const pdfDoc = await loadingTask.promise;

      pdfDocument.value = pdfDoc;
      totalPages.value = pdfDoc.numPages;

      LogService.info('PDF document loaded successfully', {
        totalPages: pdfDoc.numPages,
      });
    } catch (err) {
      LogService.error('Failed to load PDF document', err);
      loadError.value = err.message || 'Failed to load PDF document';
      pdfDocument.value = null;
      totalPages.value = 0;
    } finally {
      loadingDocument.value = false;
    }
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
      LogService.debug('Page already rendering, skipping', { pageNumber });
      return;
    }

    try {
      renderingPages.value.add(pageNumber);

      LogService.debug('Rendering PDF page', { pageNumber });

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

      LogService.debug('Page rendered successfully', { pageNumber });
    } catch (err) {
      LogService.error(`Failed to render page ${pageNumber}`, err);
      throw err;
    } finally {
      renderingPages.value.delete(pageNumber);
    }
  };

  /**
   * Clean up PDF resources when component unmounts
   */
  const cleanup = () => {
    // Release PDF.js resources
    if (pdfDocument.value) {
      LogService.debug('Cleaning up PDF document');
      pdfDocument.value.destroy();
      pdfDocument.value = null;
    }

    // Clear state
    totalPages.value = 0;
    renderingPages.value.clear();
    loadError.value = null;
    loadingDocument.value = false;
  };

  return {
    // State
    pdfDocument,
    totalPages,
    loadingDocument,
    renderingPages,
    loadError,

    // Methods
    loadPdf,
    renderPage,
    cleanup,
  };
}
