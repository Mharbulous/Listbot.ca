/**
 * Document Preloader Composable
 *
 * Manages background pre-loading of adjacent documents for fast navigation.
 * Implements a 3-phase pipeline: PDF loading → Metadata loading → Canvas pre-rendering.
 *
 * @param {Object} authStore - Auth store for firm ID
 * @param {Object} matterStore - Matter store for matter ID
 * @param {Object} pdfViewer - usePdfViewer composable instance
 * @param {Object} pdfCache - usePdfCache composable instance
 * @param {Object} canvasPreloader - useCanvasPreloader composable instance
 * @param {ComputedRef} sortedEvidence - Sorted evidence list
 * @param {Object} performanceTracker - Navigation performance tracker (optional)
 * @returns {Object} Pre-loading methods
 */
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, getMetadata, getDownloadURL, getStorage } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { EvidenceService } from '@/features/documents/services/evidenceService.js';

/**
 * Check if a file is a PDF based on its display name
 * @param {string} displayName - File name with extension
 * @returns {boolean} True if file has .pdf extension
 */
function isPdfFile(displayName) {
  if (!displayName) return false;
  return displayName.toLowerCase().endsWith('.pdf');
}

export function useDocumentPreloader(
  authStore,
  matterStore,
  pdfViewer,
  pdfCache,
  canvasPreloader,
  sortedEvidence,
  performanceTracker = null
) {
  /**
   * Get download URL for a document by its ID
   */
  const getDocumentDownloadUrl = async (documentId) => {
    const firmId = authStore.currentFirm;
    const matterId = matterStore.currentMatterId;

    if (!firmId || !matterId || !documentId) {
      throw new Error('Missing firm ID, matter ID, or document ID');
    }

    // Find document in sorted evidence to get display name
    const doc = sortedEvidence.value.find((ev) => ev.id === documentId);
    if (!doc) {
      throw new Error(`Document ${documentId} not found in evidence list`);
    }

    // Check if file is a PDF - only PDFs can be pre-loaded
    if (!isPdfFile(doc.displayName)) {
      const extension = doc.displayName.split('.').pop() || 'unknown';
      throw new Error(`NON_PDF_FILE:${extension}`);
    }

    // Get file extension and construct storage path
    const extension = doc.displayName.split('.').pop() || 'pdf';
    const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${documentId}.${extension.toLowerCase()}`;
    const storage = getStorage();
    const fileRef = storageRef(storage, storagePath);

    return await getDownloadURL(fileRef);
  };

  /**
   * Fetch and cache metadata for a document (for pre-loading)
   */
  const fetchAndCacheMetadata = async (documentId) => {
    try {
      const firmId = authStore.currentFirm;
      const matterId = matterStore.currentMatterId;

      if (!firmId || !matterId || !documentId) {
        console.warn('Cannot pre-load metadata: missing firm/matters/document ID', { documentId });
        return;
      }

      // Skip if already cached
      const cached = pdfViewer.getCachedMetadata(documentId);
      if (cached) {
        return;
      }

      // Fetch evidence document
      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', documentId);
      const evidenceSnap = await getDoc(evidenceRef);

      if (!evidenceSnap.exists()) {
        console.warn('Evidence document not found during pre-load', { documentId });
        return;
      }

      const evidenceData = evidenceSnap.data();

      // Fetch sourceMetadata variants
      const evidenceService = new EvidenceService(firmId, matterId);
      const variants = await evidenceService.getAllSourceMetadata(documentId);

      // Compute displayName and selectedMetadataHash
      const currentMetadataHash = evidenceData.sourceID;
      const currentVariant = variants.find((v) => v.metadataHash === currentMetadataHash);

      let displayName = 'Unknown File';
      let selectedMetadataHash_local = currentMetadataHash;

      if (currentVariant) {
        displayName = currentVariant.sourceFileName || 'Unknown File';
      } else if (variants.length > 0) {
        displayName = variants[0].sourceFileName || 'Unknown File';
        selectedMetadataHash_local = variants[0].metadataHash;
      }

      // Fetch storage metadata
      const extension = displayName.split('.').pop() || 'pdf';
      const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${documentId}.${extension.toLowerCase()}`;
      const fileRef = storageRef(storage, storagePath);
      const storageMetadata_fetched = await getMetadata(fileRef);

      // Cache metadata
      pdfViewer.cacheMetadata(documentId, {
        evidenceData,
        sourceVariants: variants,
        storageMetadata: storageMetadata_fetched,
        displayName,
        selectedMetadataHash: selectedMetadataHash_local,
        pdfMetadata: null, // Will be populated when PDF metadata is extracted
      });
    } catch (err) {
      // Non-blocking - pre-load failures should not affect current navigation
      console.warn('Failed to pre-load metadata (non-blocking)', {
        documentId,
        error: err.message,
      });
    }
  };


  /**
   * Pre-render first page canvas for a document (Phase 4)
   * Uses requestIdleCallback for non-blocking background work
   * Reports all outcomes (success, skip, fail) to performance tracker
   */
  const preRenderDocumentCanvas = async (documentId) => {
    try {
      if (!documentId) {
        // Report skip: no document ID
        if (performanceTracker && performanceTracker.isNavigationActive()) {
          performanceTracker.recordEvent('canvas_prerender', {
            documentId: 'unknown',
            pageNumber: 1,
            skipped: true,
            reason: 'no_document_id',
          });
        }
        return;
      }

      // Check if PDF is cached
      if (!pdfViewer.isDocumentCached(documentId)) {
        // Report skip: PDF not cached
        if (performanceTracker && performanceTracker.isNavigationActive()) {
          performanceTracker.recordEvent('canvas_prerender', {
            documentId,
            pageNumber: 1,
            skipped: true,
            reason: 'pdf_not_cached',
          });
        }
        return;
      }

      // Skip if already pre-rendered
      if (canvasPreloader.hasPreRenderedCanvas(documentId, 1)) {
        // Report skip: already cached
        if (performanceTracker && performanceTracker.isNavigationActive()) {
          performanceTracker.recordEvent('canvas_prerender', {
            documentId,
            pageNumber: 1,
            skipped: true,
            reason: 'already_cached',
          });
        }
        return;
      }

      // Get PDF document from cache (guaranteed to exist after Phase 1)
      const pdfDoc = await pdfCache.getDocument(documentId, null);

      // Pre-render page 1 in background (non-blocking, uses requestIdleCallback)
      // Note: The actual pre-render will report success when it completes via useCanvasPreloader
      canvasPreloader.preRenderDocumentFirstPage(pdfDoc, documentId);
    } catch (err) {
      // Report failure
      if (performanceTracker && performanceTracker.isNavigationActive()) {
        performanceTracker.recordEvent('canvas_prerender', {
          documentId,
          pageNumber: 1,
          failed: true,
          error: err.message,
        });
      }

      // Non-blocking - pre-render failures should not affect UX
      console.warn('Failed to pre-render canvas (non-blocking)', {
        documentId,
        error: err.message,
      });
    }
  };

  /**
   * Start background pre-loading of adjacent documents
   * Called AFTER first page render to avoid race conditions
   *
   * Sequential flow:
   * 1. Pre-load PDFs (wait for completion)
   * 2. Pre-load metadata (wait for completion)
   * 3. Extract PDF metadata (PDFs guaranteed to be cached)
   * 4. Pre-render first page canvas (background, non-blocking)
   */
  const startBackgroundPreload = async (currentDocId, prevDocId, nextDocId) => {
    try {
      // Step 1: Pre-load PDFs and wait for completion
      await pdfViewer.preloadAdjacentDocuments(prevDocId, nextDocId, getDocumentDownloadUrl, performanceTracker);

      // Step 2: Pre-load metadata for adjacent documents (parallel)
      const metadataPromises = [];
      if (prevDocId) {
        metadataPromises.push(
          fetchAndCacheMetadata(prevDocId).catch((err) => {
            console.warn('Failed to pre-load metadata for previous doc', {
              prevDocId,
              error: err.message,
            });
          })
        );
      }
      if (nextDocId) {
        metadataPromises.push(
          fetchAndCacheMetadata(nextDocId).catch((err) => {
            console.warn('Failed to pre-load metadata for next doc', {
              nextDocId,
              error: err.message,
            });
          })
        );
      }
      await Promise.allSettled(metadataPromises);

      // Step 3: Pre-render first page canvas (non-blocking, uses requestIdleCallback)
      // This runs in the background and won't block other operations
      if (prevDocId) {
        await preRenderDocumentCanvas(prevDocId).catch((err) => {
          console.warn('Failed to pre-render canvas for previous doc', {
            prevDocId,
            error: err.message,
          });
        });
      }
      if (nextDocId) {
        await preRenderDocumentCanvas(nextDocId).catch((err) => {
          console.warn('Failed to pre-render canvas for next doc', {
            nextDocId,
            error: err.message,
          });
        });
      }
    } catch (err) {
      // Non-blocking - pre-load failures should not affect UX
      console.warn('Background pre-load failed (non-blocking)', {
        error: err.message,
      });
    }
  };

  return {
    startBackgroundPreload,
  };
}
