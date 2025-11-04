import { ref, computed, markRaw } from 'vue';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { pdfjsLib } from '@/config/pdfWorker.js';
import { useThumbnailRenderer } from '@/features/organizer/composables/useThumbnailRenderer.js';

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
  const showEndOfDocument = ref(false); // Whether to show "End of Document" message
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

      // Load PDF with PDF.js
      const loadingTask = pdfjsLib.getDocument(downloadURL);
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
      const thumbnailUrl = await thumbnailRenderer.renderThumbnail(
        metadata.pdfDocument,
        pageNumber,
        300
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
   * Open peek for a document
   * Always starts at page 1
   */
  const openPeek = async (firmId, matterId, fileHash) => {
    currentPeekDocument.value = fileHash;
    currentPeekPage.value = 1;
    showEndOfDocument.value = false;
    error.value = null;

    try {
      // Load document metadata (uses cache if available)
      await getOrLoadDocument(firmId, matterId, fileHash);
    } catch (err) {
      console.error('[Peek] Failed to open peek:', err);
      // Error is already set in getOrLoadDocument
    }
  };

  /**
   * Cycle to next page
   * Logic: page 1 → page 2 → ... → page N → "End of Document" → page 1
   */
  const nextPage = () => {
    if (!currentPeekDocument.value) {
      return;
    }

    const metadata = documentMetadataCache.value.get(currentPeekDocument.value);
    if (!metadata) {
      return;
    }

    // If showing "End of Document", cycle back to page 1
    if (showEndOfDocument.value) {
      currentPeekPage.value = 1;
      showEndOfDocument.value = false;
      return;
    }

    // If PDF, check page count
    if (metadata.pdfDocument && metadata.pageCount) {
      if (currentPeekPage.value < metadata.pageCount) {
        // Go to next page
        currentPeekPage.value++;
      } else {
        // Reached end, show "End of Document"
        showEndOfDocument.value = true;
      }
    } else {
      // Non-PDF or single-page document, show "End of Document"
      showEndOfDocument.value = true;
    }
  };

  /**
   * Close peek and clean up
   */
  const closePeek = () => {
    currentPeekDocument.value = null;
    currentPeekPage.value = 1;
    showEndOfDocument.value = false;
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
    if (!currentPeekDocument.value || showEndOfDocument.value || !isCurrentDocumentPdf.value) {
      return null;
    }

    const metadata = currentDocumentMetadata.value;
    if (!metadata?.pdfDocument) {
      return null;
    }

    // Check if thumbnail is already cached
    const cacheKey = `${currentPeekPage.value}-300`;
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

  return {
    // State
    currentPeekDocument,
    currentPeekPage,
    showEndOfDocument,
    isLoading,
    error,

    // Computed
    currentDocumentMetadata,
    isCurrentDocumentPdf,
    currentThumbnailUrl,

    // Methods
    openPeek,
    nextPage,
    closePeek,
    generateThumbnail,
    getFileIcon,
    cleanup,
  };
}
