/**
 * Document Preloader Composable
 *
 * Manages background pre-loading of adjacent documents for fast navigation.
 * Implements a 4-phase pipeline: PDF loading → Metadata loading → PDF metadata extraction → Canvas pre-rendering.
 *
 * @param {Object} authStore - Auth store for firm ID
 * @param {Object} matterStore - Matter store for matter ID
 * @param {Object} pdfViewer - usePdfViewer composable instance
 * @param {Object} pdfMetadataComposable - usePdfMetadata composable instance
 * @param {Object} pdfCache - usePdfCache composable instance
 * @param {Object} canvasPreloader - useCanvasPreloader composable instance
 * @param {ComputedRef} sortedEvidence - Sorted evidence list
 * @returns {Object} Pre-loading methods
 */
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, getMetadata, getDownloadURL, getStorage } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { EvidenceService } from '@/features/organizer/services/evidenceService.js';

export function useDocumentPreloader(
  authStore,
  matterStore,
  pdfViewer,
  pdfMetadataComposable,
  pdfCache,
  canvasPreloader,
  sortedEvidence
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
   * Extract and cache PDF metadata for a pre-loaded document
   */
  const extractAndCachePdfMetadata = async (documentId) => {
    try {
      const firmId = authStore.currentFirm;
      const matterId = matterStore.currentMatterId;

      if (!firmId || !matterId || !documentId) {
        console.warn('Cannot extract PDF metadata: missing firm/matters/document ID', { documentId });
        return;
      }

      // Check if PDF is cached
      if (!pdfViewer.isDocumentCached(documentId)) {
        return;
      }

      // Get existing cached metadata
      const cachedMetadata = pdfViewer.getCachedMetadata(documentId);

      // Skip if PDF metadata already cached
      if (cachedMetadata?.pdfMetadata) {
        return;
      }

      // Skip if basic metadata not available
      if (!cachedMetadata?.displayName) {
        return;
      }

      // Retrieve pre-loaded PDF from cache
      const pdfDoc = await pdfCache.getDocument(documentId, null);

      // Extract metadata
      await pdfMetadataComposable.extractMetadata(documentId, cachedMetadata.displayName, pdfDoc);

      // Update cache with extracted metadata
      pdfViewer.cacheMetadata(documentId, {
        ...cachedMetadata,
        pdfMetadata: { ...pdfMetadataComposable.pdfMetadata },
      });
    } catch (err) {
      // Non-blocking - pre-load failures should not affect current navigation
      console.warn('Failed to pre-load PDF metadata (non-blocking)', {
        documentId,
        error: err.message,
      });
    }
  };

  /**
   * Pre-render first page canvas for a document (Phase 4)
   * Uses requestIdleCallback for non-blocking background work
   */
  const preRenderDocumentCanvas = async (documentId) => {
    try {
      if (!documentId) {
        return;
      }

      // Check if PDF is cached
      if (!pdfViewer.isDocumentCached(documentId)) {
        return;
      }

      // Skip if already pre-rendered
      if (canvasPreloader.hasPreRenderedCanvas(documentId, 1)) {
        return;
      }

      // Get PDF document from cache (guaranteed to exist after Phase 1)
      const pdfDoc = await pdfCache.getDocument(documentId, null);

      // Pre-render page 1 in background (non-blocking, uses requestIdleCallback)
      canvasPreloader.preRenderDocumentFirstPage(pdfDoc, documentId);
    } catch (err) {
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
      await pdfViewer.preloadAdjacentDocuments(prevDocId, nextDocId, getDocumentDownloadUrl);

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

      // Step 3: Extract PDF metadata (PDFs are guaranteed cached now)
      if (prevDocId) {
        await extractAndCachePdfMetadata(prevDocId).catch((err) => {
          console.warn('Failed to extract PDF metadata for previous doc', {
            prevDocId,
            error: err.message,
          });
        });
      }
      if (nextDocId) {
        await extractAndCachePdfMetadata(nextDocId).catch((err) => {
          console.warn('Failed to extract PDF metadata for next doc', {
            nextDocId,
            error: err.message,
          });
        });
      }

      // Step 4: Pre-render first page canvas (non-blocking, uses requestIdleCallback)
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
