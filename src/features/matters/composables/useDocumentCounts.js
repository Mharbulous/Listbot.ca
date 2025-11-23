import { ref } from 'vue';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/services/firebase.js';

/**
 * Composable for managing document counts across matters
 *
 * Fetches document counts for all matters efficiently using getCountFromServer
 * to avoid downloading all documents.
 *
 * @returns {Object} Document counts state and fetch function
 */
export function useDocumentCounts() {
  // Map of matter IDs to document counts
  const documentCounts = ref({});

  /**
   * Fetch document counts for all matters in parallel
   *
   * Uses getCountFromServer for efficient counting without downloading documents.
   * Handles individual matter failures gracefully by returning 0 count.
   *
   * @param {Array} matters - Array of matter objects
   * @param {string} firmId - Firm ID for Firestore path
   */
  async function fetchDocumentCounts(matters, firmId) {
    if (!firmId || !matters || matters.length === 0) {
      return;
    }

    try {
      // Fetch counts for all matters in parallel
      const countPromises = matters.map(async (matter) => {
        try {
          const evidenceRef = collection(db, 'firms', firmId, 'matters', matter.id, 'evidence');
          const snapshot = await getCountFromServer(evidenceRef);
          return { matterId: matter.id, count: snapshot.data().count };
        } catch (error) {
          console.error('Error fetching document count for matter', error, {
            matterId: matter.id,
            firmId,
          });
          return { matterId: matter.id, count: 0 };
        }
      });

      const counts = await Promise.all(countPromises);

      // Update the documentCounts ref with all counts
      const countsMap = {};
      counts.forEach(({ matterId, count }) => {
        countsMap[matterId] = count;
      });
      documentCounts.value = countsMap;
    } catch (error) {
      console.error('Error fetching document counts', error, {
        firmId,
      });
    }
  }

  return {
    documentCounts,
    fetchDocumentCounts,
  };
}
