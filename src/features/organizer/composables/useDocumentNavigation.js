/**
 * Document Navigation Composable
 *
 * Manages document navigation state and methods for the ViewDocument component.
 * Handles navigation between documents in the organizer's sorted evidence list.
 *
 * @param {Ref<string>} fileHash - Current document file hash
 * @param {Router} router - Vue Router instance
 * @param {Object} organizerStore - Pinia organizer store
 * @returns {Object} Navigation state and methods
 */
import { ref, computed } from 'vue';

export function useDocumentNavigation(fileHash, router, organizerStore) {
  // Performance timing
  const navigationStartTime = ref(null);

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

  // Navigation methods
  const goToFirstDocument = () => {
    if (sortedEvidence.value.length === 0) return;
    const firstDoc = sortedEvidence.value[0];
    router.push(`/documents/view/${firstDoc.id}`);
  };

  const goToPreviousDocument = () => {
    if (sortedEvidence.value.length === 0) return;

    const currentIndex = currentDocumentIndex.value - 1;
    if (currentIndex > 0) {
      const prevDoc = sortedEvidence.value[currentIndex - 1];
      navigationStartTime.value = performance.now();
      console.info('⬅️ Navigation to previous document started', {
        fromDoc: fileHash.value,
        toDoc: prevDoc.id,
      });
      router.push(`/documents/view/${prevDoc.id}`);
    }
  };

  const goToNextDocument = () => {
    if (sortedEvidence.value.length === 0) return;

    const currentIndex = currentDocumentIndex.value - 1;
    if (currentIndex < sortedEvidence.value.length - 1) {
      const nextDoc = sortedEvidence.value[currentIndex + 1];
      navigationStartTime.value = performance.now();
      console.info('➡️ Navigation to next document started', {
        fromDoc: fileHash.value,
        toDoc: nextDoc.id,
      });
      router.push(`/documents/view/${nextDoc.id}`);
    }
  };

  const goToLastDocument = () => {
    if (sortedEvidence.value.length === 0) return;
    const lastDoc = sortedEvidence.value[sortedEvidence.value.length - 1];
    router.push(`/documents/view/${lastDoc.id}`);
  };

  return {
    // State
    navigationStartTime,
    currentDocumentIndex,
    totalDocuments,
    previousDocumentId,
    nextDocumentId,

    // Methods
    goToFirstDocument,
    goToPreviousDocument,
    goToNextDocument,
    goToLastDocument,
  };
}
