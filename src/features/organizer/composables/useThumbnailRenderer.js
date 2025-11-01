import { ref } from 'vue';
import { LogService } from '@/services/logService.js';

/**
 * Composable for rendering PDF page thumbnails
 *
 * Generates small preview images of PDF pages optimized for navigation.
 * Uses lower resolution than main viewer for better performance.
 *
 * @returns {Object} Thumbnail rendering state and methods
 */
export function useThumbnailRenderer() {
  // State
  const thumbnailCache = ref(new Map()); // Map<pageNumber-maxWidth, blobURL>
  const renderingQueue = ref([]);
  const isRendering = ref(false);

  /**
   * Render a single page thumbnail
   * Uses the same aspect ratio calculation as the main viewer (8.5:11 for US Letter)
   * but scaled down proportionally.
   * 
   * @param {Object} pdfDocument - PDF.js document object
   * @param {Number} pageNumber - Page to render (1-indexed)
   * @param {Number} maxWidth - Maximum thumbnail width in pixels (default: 150)
   * @returns {Promise<String>} Blob URL of rendered thumbnail
   */
  const renderThumbnail = async (pdfDocument, pageNumber, maxWidth = 150) => {
    // Check cache first
    const cacheKey = `${pageNumber}-${maxWidth}`;
    if (thumbnailCache.value.has(cacheKey)) {
      return thumbnailCache.value.get(cacheKey);
    }

    try {
      // Get page
      const page = await pdfDocument.getPage(pageNumber);

      // Calculate scale using the same method as main viewer
      // Main viewer: scale = 883.2px / viewport.width (maintains aspect ratio)
      // Thumbnail: scale = maxWidth / viewport.width (same aspect ratio, smaller size)
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = maxWidth / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      // Create temporary canvas
      const canvas = document.createElement('canvas');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      // Render to canvas
      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;

      // Convert to Blob URL (2x more memory efficient than data URLs)
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          },
          'image/png'
        );
      });

      const blobURL = URL.createObjectURL(blob);
      thumbnailCache.value.set(cacheKey, blobURL);

      LogService.debug('Thumbnail rendered', { pageNumber, maxWidth });

      return blobURL;
    } catch (err) {
      LogService.error(`Failed to render thumbnail for page ${pageNumber}`, err);
      throw err;
    }
  };

  /**
   * Batch render all thumbnails for a PDF document
   * Renders in batches to avoid blocking the UI
   *
   * @param {Object} pdfDocument - PDF.js document object
   * @param {Number} totalPages - Total number of pages
   * @param {Number} batchSize - Pages to render per batch (default: 5)
   */
  const renderAllThumbnails = async (pdfDocument, totalPages, batchSize = 5) => {
    if (isRendering.value) {
      LogService.debug('Thumbnail rendering already in progress');
      return;
    }

    isRendering.value = true;

    try {
      LogService.debug('Starting thumbnail batch rendering', { totalPages, batchSize });

      for (let i = 1; i <= totalPages; i += batchSize) {
        const batch = [];
        const end = Math.min(i + batchSize - 1, totalPages);

        for (let pageNum = i; pageNum <= end; pageNum++) {
          batch.push(renderThumbnail(pdfDocument, pageNum));
        }

        // Render batch
        await Promise.all(batch);

        // Small delay to let UI breathe
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      LogService.info('All thumbnails rendered successfully', { totalPages });
    } catch (err) {
      LogService.error('Failed to render thumbnails', err);
      throw err;
    } finally {
      isRendering.value = false;
    }
  };

  /**
   * Clear thumbnail cache
   * Call when switching documents or component unmounts
   * CRITICAL: Revokes Blob URLs to prevent memory leaks
   */
  const clearCache = () => {
    // Revoke all Blob URLs before clearing cache
    thumbnailCache.value.forEach((blobURL) => {
      URL.revokeObjectURL(blobURL);
    });

    thumbnailCache.value.clear();
    LogService.debug('Thumbnail cache cleared');
  };

  return {
    thumbnailCache,
    isRendering,
    renderThumbnail,
    renderAllThumbnails,
    clearCache,
  };
}

