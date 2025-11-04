/**
 * Evidence Loader Composable
 *
 * Manages loading evidence documents, metadata variants, and storage metadata.
 * Integrates with PDF viewer and metadata extraction.
 *
 * @param {Object} authStore - Auth store for firm ID
 * @param {Object} matterStore - Matter store for matter ID
 * @param {Object} documentViewStore - Document view store for breadcrumb
 * @param {Object} pdfViewer - usePdfViewer composable instance
 * @param {Object} pdfMetadataComposable - usePdfMetadata composable instance
 * @param {Object} performanceTracker - Navigation performance tracker (optional)
 * @returns {Object} Evidence loading state and methods
 */
import { ref } from 'vue';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, getMetadata, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/services/firebase.js';
import { EvidenceService } from '@/features/organizer/services/evidenceService.js';

export function useEvidenceLoader(
  authStore,
  matterStore,
  documentViewStore,
  pdfViewer,
  pdfMetadataComposable,
  performanceTracker = null
) {
  // State
  const evidence = ref(null);
  const loading = ref(true);
  const viewerLoading = ref(false);
  const error = ref(null);
  const storageMetadata = ref(null);
  const sourceMetadataVariants = ref([]);
  const selectedMetadataHash = ref(null);
  const updatingMetadata = ref(false);

  /**
   * Load Firebase Storage metadata and PDF
   */
  const loadStorageAndPdf = async (firmId, fileHash, displayName, navigationStartTime) => {
    try {
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected');
      }

      // Get file extension and build storage path
      const extension = displayName.split('.').pop() || 'pdf';
      const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension.toLowerCase()}`;
      const fileRef = storageRef(storage, storagePath);

      // Load storage metadata if not cached
      if (!storageMetadata.value) {
        const metadata = await getMetadata(fileRef);
        storageMetadata.value = metadata;
      }

      // Load PDF if applicable
      if (displayName?.toLowerCase().endsWith('.pdf')) {
        const pdfLoadStart = performance.now();
        const isCached = pdfViewer.isDocumentCached(fileHash);

        // Check cache first
        if (isCached) {
          await pdfViewer.loadPdf(fileHash);
        } else {
          const downloadURL = await getDownloadURL(fileRef);
          await pdfViewer.loadPdf(fileHash, downloadURL);
        }

        // Track PDF load timing
        if (performanceTracker && performanceTracker.isNavigationActive()) {
          performanceTracker.recordEvent('pdf_load', {
            cacheHit: isCached,
            duration: performance.now() - pdfLoadStart,
          });
        }

        // Extract PDF metadata (check cache first)
        const cachedMetadata = pdfViewer.getCachedMetadata(fileHash);
        if (cachedMetadata?.pdfMetadata) {
          console.log(`[EvidenceLoader] 💾 Cache HIT - Restoring PDF metadata for ${fileHash}`);
          pdfMetadataComposable.pdfMetadata.value = cachedMetadata.pdfMetadata;
        } else {
          console.log(`[EvidenceLoader] 🔍 Cache MISS - Will extract metadata in background for ${fileHash}`);
          // Extract PDF metadata in background
          const backgroundTaskId = `${fileHash}-${Date.now()}`;
          console.log(`[EvidenceLoader] ⏰ Scheduling background metadata extraction - Task: ${backgroundTaskId}, File: ${fileHash}`);
          setTimeout(async () => {
            console.log(`[EvidenceLoader] ▶️ Starting background metadata extraction - Task: ${backgroundTaskId}, File: ${fileHash}`);
            try {
              await pdfMetadataComposable.extractMetadata(
                fileHash,
                displayName,
                pdfViewer.pdfDocument.value
              );

              // Update cache with extracted metadata
              pdfViewer.cacheMetadata(fileHash, {
                evidenceData: evidence.value,
                sourceVariants: sourceMetadataVariants.value,
                storageMetadata: storageMetadata.value,
                displayName: evidence.value.displayName,
                selectedMetadataHash: selectedMetadataHash.value,
                pdfMetadata: { ...pdfMetadataComposable.pdfMetadata.value },
              });
              console.log(`[EvidenceLoader] ✅ Completed background metadata extraction - Task: ${backgroundTaskId}, File: ${fileHash}`);
            } catch (err) {
              console.warn(`[EvidenceLoader] ❌ Failed background metadata extraction - Task: ${backgroundTaskId}, File: ${fileHash}`, err);
            }
          }, 0);
        }
      }
    } catch (err) {
      console.error('Failed to load storage metadata:', err);
      storageMetadata.value = null;
    }
  };

  /**
   * Load evidence document from Firestore
   */
  const loadEvidence = async (fileHash, navigationStartTime = null) => {
    try {
      const isInitialLoad = !evidence.value;

      if (isInitialLoad) {
        loading.value = true;
      } else {
        viewerLoading.value = true;
      }

      error.value = null;

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID found');
      }

      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter to view documents.');
      }

      if (!fileHash) {
        throw new Error('No file hash provided');
      }

      // Check metadata cache first
      const cachedMetadata = pdfViewer.getCachedMetadata(fileHash);

      let evidenceData;
      let variants;
      let displayName;
      let selectedMetadataHash_local;
      let storageMetadata_cached;

      let metadataLoadStart = performance.now();

      if (cachedMetadata) {
        // Cache HIT - instant load
        evidenceData = cachedMetadata.evidenceData;
        variants = cachedMetadata.sourceVariants;
        displayName = cachedMetadata.displayName;
        selectedMetadataHash_local = cachedMetadata.selectedMetadataHash;
        storageMetadata_cached = cachedMetadata.storageMetadata;

        sourceMetadataVariants.value = variants;
        selectedMetadataHash.value = selectedMetadataHash_local;
        storageMetadata.value = storageMetadata_cached;

        // Track metadata load from cache
        if (performanceTracker && performanceTracker.isNavigationActive()) {
          performanceTracker.recordEvent('metadata_load', {
            cacheHit: true,
            duration: performance.now() - metadataLoadStart,
          });
        }
      } else {
        // Cache MISS - fetch from Firestore/Storage

        // Fetch evidence document
        const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);
        const evidenceSnap = await getDoc(evidenceRef);

        if (!evidenceSnap.exists()) {
          throw new Error('Document not found');
        }

        evidenceData = evidenceSnap.data();

        // Fetch metadata variants
        const evidenceService = new EvidenceService(firmId, matterId);
        variants = await evidenceService.getAllSourceMetadata(fileHash);
        sourceMetadataVariants.value = variants;

        // Determine selected metadata
        const currentMetadataHash = evidenceData.sourceID;
        selectedMetadataHash.value = currentMetadataHash;
        selectedMetadataHash_local = currentMetadataHash;

        const currentVariant = variants.find((v) => v.metadataHash === currentMetadataHash);

        if (currentVariant) {
          displayName = currentVariant.sourceFileName || 'Unknown File';
        } else if (variants.length > 0) {
          displayName = variants[0].sourceFileName || 'Unknown File';
          selectedMetadataHash.value = variants[0].metadataHash;
          selectedMetadataHash_local = variants[0].metadataHash;
        } else {
          displayName = 'Unknown File';
        }

        // Fetch storage metadata
        const extension = displayName.split('.').pop() || 'pdf';
        const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension.toLowerCase()}`;
        const fileRef = storageRef(storage, storagePath);
        const metadata = await getMetadata(fileRef);
        storageMetadata.value = metadata;
        storageMetadata_cached = metadata;

        // Track metadata load from Firebase
        if (performanceTracker && performanceTracker.isNavigationActive()) {
          performanceTracker.recordEvent('metadata_load', {
            cacheHit: false,
            duration: performance.now() - metadataLoadStart,
          });
        }
      }

      // Find createdAt from variants
      const currentVariant = variants.find((v) => v.metadataHash === selectedMetadataHash_local);
      const createdAt =
        currentVariant?.sourceLastModified ||
        (variants.length > 0 ? variants[0].sourceLastModified : null);

      // Update evidence state
      evidence.value = {
        id: fileHash,
        ...evidenceData,
        displayName,
        createdAt,
      };

      // Update breadcrumb
      documentViewStore.setDocumentName(displayName);

      // Load PDF and storage metadata
      await loadStorageAndPdf(firmId, fileHash, displayName, navigationStartTime);
    } catch (err) {
      console.error('Failed to load evidence:', err);
      error.value = err.message || 'Failed to load document';
    } finally {
      loading.value = false;
      viewerLoading.value = false;
    }
  };

  /**
   * Update selected metadata variant
   */
  const updateSelectedMetadata = async (fileHash, newMetadataHash) => {
    if (!newMetadataHash || updatingMetadata.value) return;

    try {
      updatingMetadata.value = true;

      const firmId = authStore.currentFirm;
      const matterId = matterStore.currentMatterId;
      if (!firmId || !fileHash || !matterId) {
        throw new Error('Missing firm ID, matter ID, or file hash');
      }

      // Find selected variant
      const selectedVariant = sourceMetadataVariants.value.find(
        (v) => v.metadataHash === newMetadataHash
      );

      if (!selectedVariant) {
        throw new Error('Selected metadata variant not found');
      }

      // Update Firestore
      const evidenceRef = doc(db, 'firms', firmId, 'matters', matterId, 'evidence', fileHash);
      await updateDoc(evidenceRef, {
        sourceID: newMetadataHash,
      });

      // Update local state
      evidence.value = {
        ...evidence.value,
        sourceID: newMetadataHash,
        displayName: selectedVariant.sourceFileName || 'Unknown File',
        createdAt: selectedVariant.sourceLastModified,
      };

      selectedMetadataHash.value = newMetadataHash;
      documentViewStore.setDocumentName(selectedVariant.sourceFileName || 'Unknown File');
    } catch (err) {
      console.error('[EvidenceLoader] Failed to update metadata selection:', err);
      // Revert selection on error
      selectedMetadataHash.value = evidence.value.sourceID;
    } finally {
      updatingMetadata.value = false;
    }
  };

  return {
    // State
    evidence,
    loading,
    viewerLoading,
    error,
    storageMetadata,
    sourceMetadataVariants,
    selectedMetadataHash,
    updatingMetadata,

    // Methods
    loadEvidence,
    updateSelectedMetadata,
  };
}
