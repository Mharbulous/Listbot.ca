/**
 * Document Navigation Composable
 *
 * Manages document navigation state and methods for the ViewDocument component.
 * Handles navigation between documents in the organizer's sorted evidence list.
 *
 * @param {Ref<string>} fileHash - Current document file hash
 * @param {Router} router - Vue Router instance
 * @param {Object} organizerStore - Pinia organizer store
 * @param {Object} pdfViewer - usePdfViewer composable instance (for cache checks)
 * @param {Object} documentViewStore - Document view store (for breadcrumb updates)
 * @returns {Object} Navigation state and methods
 */
import { ref, computed } from 'vue';
import { useNavigationPerformanceTracker } from './useNavigationPerformanceTracker.js';

export function useDocumentNavigation(fileHash, router, organizerStore, pdfViewer, documentViewStore) {
  // Performance tracking
  const navigationStartTime = ref(null);
  const performanceTracker = useNavigationPerformanceTracker();

  // Sorted evidence list from organizer store
  const sortedEvidence = computed(() => organizerStore.sortedEvidenceList || []);
  const totalDocuments = computed(() => organizerStore.evidenceCount || 1);

  // Current document index (1-based)
  const currentDocumentIndex = computed(() => {
    if (!fileHash.value || sortedEvidence.value.length === 0) {
      return 1;
    }

    const index = sortedEvidence.value.findIndex((ev) => ev.id === fileHash.value);
    return index >= 0 ? index + 1 : 1;
  });

  // Adjacent document IDs for pre-loading
  const previousDocumentId = computed(() => {
    if (sortedEvidence.value.length === 0) return null;

    const currentIndex = currentDocumentIndex.value - 1; // Convert to 0-based
    if (currentIndex > 0) {
      return sortedEvidence.value[currentIndex - 1]?.id || null;
    }
    return null;
  });

  const nextDocumentId = computed(() => {
    if (sortedEvidence.value.length === 0) return null;

    const currentIndex = currentDocumentIndex.value - 1; // Convert to 0-based
    if (currentIndex < sortedEvidence.value.length - 1) {
      return sortedEvidence.value[currentIndex + 1]?.id || null;
    }
    return null;
  });

  /**
   * Pre-emptively update breadcrumb if target document metadata is cached
   * This makes breadcrumb updates synchronous with cached navigation
   * @param {string} targetDocId - Target document ID to check cache for
   * @returns {boolean} True if breadcrumb was updated from cache, false otherwise
   */
  const preUpdateBreadcrumb = (targetDocId) => {
    if (!pdfViewer || !documentViewStore) {
      return false;
    }

    const cachedMetadata = pdfViewer.getCachedMetadata(targetDocId);
    if (cachedMetadata?.displayName) {
      documentViewStore.setDocumentName(cachedMetadata.displayName);
      return true;
    }
    return false;
  };

  /**
   * Calculate how many adjacent documents will be pre-rendered after navigating to target
   * @param {string} targetDocId - Target document ID
   * @returns {number} Expected pre-render count (0, 1, or 2)
   */
  const calculateExpectedPreRenders = (targetDocId) => {
    if (sortedEvidence.value.length === 0) return 0;

    const targetIndex = sortedEvidence.value.findIndex((ev) => ev.id === targetDocId);
    if (targetIndex === -1) return 0;

    const hasPrevious = targetIndex > 0;
    const hasNext = targetIndex < sortedEvidence.value.length - 1;

    let count = 0;
    if (hasPrevious) count++;
    if (hasNext) count++;

    return count;
  };

  // Navigation methods
  const goToFirstDocument = () => {
    if (sortedEvidence.value.length === 0) return;
    const firstDoc = sortedEvidence.value[0];
    preUpdateBreadcrumb(firstDoc.id);
    router.push(`/documents/view/${firstDoc.id}`);
  };

  const goToPreviousDocument = () => {
    if (sortedEvidence.value.length === 0) return;

    const currentIndex = currentDocumentIndex.value - 1;
    if (currentIndex > 0) {
      const prevDoc = sortedEvidence.value[currentIndex - 1];
      const expectedPreRenders = calculateExpectedPreRenders(prevDoc.id);
      preUpdateBreadcrumb(prevDoc.id);
      navigationStartTime.value = performance.now();
      performanceTracker.startNavigation('previous', fileHash.value, prevDoc.id, expectedPreRenders);
      router.push(`/documents/view/${prevDoc.id}`);
    }
  };

  const goToNextDocument = () => {
    if (sortedEvidence.value.length === 0) return;

    const currentIndex = currentDocumentIndex.value - 1;
    if (currentIndex < sortedEvidence.value.length - 1) {
      const nextDoc = sortedEvidence.value[currentIndex + 1];
      const expectedPreRenders = calculateExpectedPreRenders(nextDoc.id);
      preUpdateBreadcrumb(nextDoc.id);
      navigationStartTime.value = performance.now();
      performanceTracker.startNavigation('next', fileHash.value, nextDoc.id, expectedPreRenders);
      router.push(`/documents/view/${nextDoc.id}`);
    }
  };

  const goToLastDocument = () => {
    if (sortedEvidence.value.length === 0) return;
    const lastDoc = sortedEvidence.value[sortedEvidence.value.length - 1];
    preUpdateBreadcrumb(lastDoc.id);
    router.push(`/documents/view/${lastDoc.id}`);
  };

  return {
    // State
    navigationStartTime,
    currentDocumentIndex,
    totalDocuments,
    previousDocumentId,
    nextDocumentId,

    // Performance tracking
    performanceTracker,

    // Methods
    goToFirstDocument,
    goToPreviousDocument,
    goToNextDocument,
    goToLastDocument,
  };
}
