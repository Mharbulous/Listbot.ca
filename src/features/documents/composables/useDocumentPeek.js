import { ref, computed, markRaw, watch } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { pdfjsLib, wasmUrl, standardFontDataUrl } from '@/config/pdfWorker.js';
import { useThumbnailRenderer } from '@/features/documents/composables/useThumbnailRenderer.js';

/**
 * Composable for managing document peek functionality
 *
 * Handles loading PDFs, generating thumbnails, page cycling, and LRU caching.
 * Integrates with existing thumbnail rendering and PDF loading infrastructure.
 *
 * @returns {Object} Peek state and methods
 */
export function useDocumentPeek() {
  // Thumbnail renderer
  const thumbnailRenderer = useThumbnailRenderer();

  // State
  const currentPeekDocument = ref(null); // fileHash of currently peeked document
  const currentPeekPage = ref(1); // Current page number (1-based)
  const isLoading = ref(false); // Thumbnail generation in progress
  const error = ref(null); // Error message if load fails

  // Document metadata cache: Map<fileHash, { pageCount, fileType, displayName, pdfDocument }>
  const documentMetadataCache = ref(new Map());

  // LRU cache tracking: Array of fileHash in order of access (most recent last)
  const lruOrder = ref([]);
  const MAX_CACHE_SIZE = 20;

  /**
   * Get file type icon for non-PDF files
   */
  const getFileIcon = (fileType) => {
    if (!fileType) return '📁';
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('word')) return '📄';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊';
    return '📁';
  };

  /**
   * Check if file is a PDF
   */
  const isPdf = (fileType) => {
    return fileType === 'application/pdf';
  };

  /**
   * Update LRU cache order
   * Moves accessed fileHash to end (most recent)
   */
  const updateLruOrder = (fileHash) => {
    // Remove if exists
    const index = lruOrder.value.indexOf(fileHash);
    if (index > -1) {
      lruOrder.value.splice(index, 1);
    }

    // Add to end (most recent)
    lruOrder.value.push(fileHash);

    // Evict oldest if over limit
    while (lruOrder.value.length > MAX_CACHE_SIZE) {
      const oldestHash = lruOrder.value.shift();
      evictFromCache(oldestHash);
    }
  };

  /**
   * Evict a document from cache
   * Revokes Blob URLs and removes metadata
   */
  const evictFromCache = (fileHash) => {
    const metadata = documentMetadataCache.value.get(fileHash);
    if (metadata?.pdfDocument) {
      // Clean up PDF.js document
      metadata.pdfDocument.destroy();
    }

    documentMetadataCache.value.delete(fileHash);
    console.log(`[Peek] Evicted ${fileHash} from cache`);
  };

  /**
   * Load document metadata from Firestore
   */
  const loadDocumentMetadata = async (firmId, matterId, fileHash) => {
    try {
      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);
      const evidenceDoc = await getDoc(evidenceRef);

      if (!evidenceDoc.exists()) {
        throw new Error('Document not found');
      }

      const data = evidenceDoc.data();
      return {
        fileType: data.fileType || 'application/pdf',
        displayName: data.displayName || 'Unknown Document',
        fileHash: fileHash,
      };
    } catch (err) {
      console.error('[Peek] Failed to load document metadata:', err);
      throw err;
    }
  };

  /**
   * Get file extension from MIME type
   */
  const getExtensionFromMimeType = (mimeType) => {
    const mimeToExtension = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    };
    return mimeToExtension[mimeType] || 'pdf';
  };

  /**
   * Load PDF document from Firebase Storage
   */
  const loadPdfDocument = async (firmId, matterId, fileHash, displayName, fileType) => {
    try {
      // Get file extension - validate it first
      let extension = displayName.split('.').pop() || 'pdf';

      // Validate the extension (must be 2-5 chars and alphanumeric)
      if (!extension.match(/^[a-zA-Z0-9]{2,5}$/)) {
        // Invalid extension, derive from MIME type
        extension = getExtensionFromMimeType(fileType);
      }

      const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension.toLowerCase()}`;
      const fileRef = storageRef(storage, storagePath);

      // Get download URL
      const downloadURL = await getDownloadURL(fileRef);

      // Load PDF with PDF.js with proper configuration
      // Match configuration from usePdfCache.js to ensure WASM decoders work
      const loadingTask = pdfjsLib.getDocument({
        url: downloadURL,
        // Enable streaming for better performance
        disableAutoFetch: false,
        disableStream: false,
        // Enable hardware acceleration (GPU rendering) for faster page rendering
        enableHWA: true,
        // WASM directory for image decoders (JPEG2000/JPX, JXL)
        // Critical for PDFs with JPEG2000 images (common in scanned legal documents)
        wasmUrl,
        // Standard fonts directory for font substitution
        standardFontDataUrl,
      });
      const pdfDocument = await loadingTask.promise;

      return pdfDocument;
    } catch (err) {
      console.error('[Peek] Failed to load PDF document:', err);
      throw err;
    }
  };

  /**
   * Load and cache document metadata
   * Returns cached data if available, otherwise loads from Firestore/Storage
   */
  const getOrLoadDocument = async (firmId, matterId, fileHash) => {
    // Check cache first
    if (documentMetadataCache.value.has(fileHash)) {
      updateLruOrder(fileHash);
      return documentMetadataCache.value.get(fileHash);
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Load metadata from Firestore
      const metadata = await loadDocumentMetadata(firmId, matterId, fileHash);

      // If PDF, load the document
      let pdfDocument = null;
      let pageCount = null;

      if (isPdf(metadata.fileType)) {
        pdfDocument = await loadPdfDocument(firmId, matterId, fileHash, metadata.displayName, metadata.fileType);
        pageCount = pdfDocument.numPages;
        // IMPORTANT: Use markRaw() to prevent Vue from making the PDF.js document reactive
        // PDF.js uses private class members that break when wrapped in a Proxy
        pdfDocument = markRaw(pdfDocument);
      }

      // Cache metadata
      const cacheEntry = {
        ...metadata,
        pdfDocument,
        pageCount,
      };

      documentMetadataCache.value.set(fileHash, cacheEntry);
      updateLruOrder(fileHash);

      return cacheEntry;
    } catch (err) {
      error.value = `Failed to load document: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Generate thumbnail for current page
   * Returns Blob URL or null if not a PDF
   */
  const generateThumbnail = async (fileHash, pageNumber) => {
    const metadata = documentMetadataCache.value.get(fileHash);
    if (!metadata || !metadata.pdfDocument) {
      return null;
    }

    try {
      isLoading.value = true;
      // Generate thumbnail at 300px width for good quality/performance balance
      // IMPORTANT: Pass fileHash to prevent cross-document cache collisions
      const thumbnailUrl = await thumbnailRenderer.renderThumbnail(
        metadata.pdfDocument,
        pageNumber,
        300,
        fileHash
      );
      return thumbnailUrl;
    } catch (err) {
      console.error('[Peek] Failed to generate thumbnail:', err);
      error.value = `Failed to generate thumbnail: ${err.message}`;
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Pre-generate thumbnails for adjacent pages
   * Generates previous and next page thumbnails in background for instant navigation
   * Respects document boundaries (no generation for invalid pages)
   */
  const preGenerateAdjacentThumbnails = async (fileHash, currentPage, pageCount) => {
    if (!fileHash || !pageCount) return;

    const metadata = documentMetadataCache.value.get(fileHash);
    if (!metadata?.pdfDocument) return;

    const pagesToGenerate = [];

    // Previous page (if not at first page)
    if (currentPage > 1) {
      pagesToGenerate.push(currentPage - 1);
    }

    // Next page (if not at last page)
    if (currentPage < pageCount) {
      pagesToGenerate.push(currentPage + 1);
    }

    // Generate thumbnails in parallel (non-blocking)
    Promise.all(
      pagesToGenerate.map(page => generateThumbnail(fileHash, page))
    ).catch(err => {
      console.warn('[Peek] Pre-generation failed:', err);
      // Silent failure - pre-generation is a performance optimization
    });
  };

  /**
   * Open peek for a document
   * Always starts at page 1
   */
  const openPeek = async (firmId, matterId, fileHash) => {
    currentPeekDocument.value = fileHash;
    currentPeekPage.value = 1;
    error.value = null;

    try {
      // Load document metadata (uses cache if available)
      await getOrLoadDocument(firmId, matterId, fileHash);

      // Pre-generate adjacent pages for instant navigation
      const metadata = documentMetadataCache.value.get(fileHash);
      if (metadata?.pageCount) {
        preGenerateAdjacentThumbnails(fileHash, 1, metadata.pageCount);
      }
    } catch (err) {
      console.error('[Peek] Failed to open peek:', err);
      // Error is already set in getOrLoadDocument
    }
  };

  /**
   * Go to next page
   * Logic: page 1 → page 2 → ... → page N (stops at last page, no wrap-around)
   */
  const nextPage = () => {
    if (!currentPeekDocument.value) {
      return;
    }

    const metadata = documentMetadataCache.value.get(currentPeekDocument.value);
    if (!metadata || !metadata.pageCount) {
      return;
    }

    // Don't go beyond last page
    if (currentPeekPage.value < metadata.pageCount) {
      currentPeekPage.value++;
    }
    // If already at last page, do nothing (no wrap-around)
  };

  /**
   * Go to previous page
   * Logic: page N → ... → page 2 → page 1 (stops at page 1, no wrap-around)
   */
  const previousPage = () => {
    if (!currentPeekDocument.value) {
      return;
    }

    const metadata = documentMetadataCache.value.get(currentPeekDocument.value);
    if (!metadata) {
      return;
    }

    // Don't go before page 1
    if (currentPeekPage.value > 1) {
      currentPeekPage.value--;
    }
    // If already at page 1, do nothing (no wrap-around)
  };

  /**
   * Close peek and clean up
   */
  const closePeek = () => {
    currentPeekDocument.value = null;
    currentPeekPage.value = 1;
    error.value = null;
    // Note: We don't clear the cache here, allowing for faster re-peeks
  };

  /**
   * Get current document metadata
   */
  const currentDocumentMetadata = computed(() => {
    if (!currentPeekDocument.value) {
      return null;
    }
    return documentMetadataCache.value.get(currentPeekDocument.value);
  });

  /**
   * Check if current document is a PDF
   */
  const isCurrentDocumentPdf = computed(() => {
    const metadata = currentDocumentMetadata.value;
    return metadata && isPdf(metadata.fileType);
  });

  /**
   * Get current thumbnail URL
   * Returns null if loading, error, or not a PDF
   */
  const currentThumbnailUrl = computed(() => {
    if (!currentPeekDocument.value || !isCurrentDocumentPdf.value) {
      return null;
    }

    const metadata = currentDocumentMetadata.value;
    if (!metadata?.pdfDocument) {
      return null;
    }

    // Check if thumbnail is already cached
    // IMPORTANT: Include fileHash in cache key to prevent cross-document collisions
    const cacheKey = `${currentPeekDocument.value}-${currentPeekPage.value}-300`;
    return thumbnailRenderer.thumbnailCache.value.get(cacheKey) || null;
  });

  /**
   * Full cleanup - clear all caches
   * Call when component unmounts
   */
  const cleanup = () => {
    // Destroy all PDF documents
    documentMetadataCache.value.forEach((metadata) => {
      if (metadata.pdfDocument) {
        metadata.pdfDocument.destroy();
      }
    });

    // Clear thumbnail cache (revokes Blob URLs)
    thumbnailRenderer.clearCache();

    // Clear metadata cache
    documentMetadataCache.value.clear();
    lruOrder.value = [];

    // Reset state
    closePeek();
  };

  /**
   * Watch for page changes and pre-generate adjacent thumbnails
   * Ensures instant navigation by caching next/previous pages
   */
  watch(
    () => [currentPeekDocument.value, currentPeekPage.value],
    ([fileHash, page]) => {
      if (!fileHash || !page) return;

      const metadata = documentMetadataCache.value.get(fileHash);
      if (metadata?.pageCount) {
        // Pre-generate adjacent pages in background
        preGenerateAdjacentThumbnails(fileHash, page, metadata.pageCount);
      }
    }
  );

  return {
    // State
    currentPeekDocument,
    currentPeekPage,
    isLoading,
    error,

    // Computed
    currentDocumentMetadata,
    isCurrentDocumentPdf,
    currentThumbnailUrl,

    // Methods
    openPeek,
    nextPage,
    previousPage,
    closePeek,
    generateThumbnail,
    getFileIcon,
    cleanup,
  };
}
