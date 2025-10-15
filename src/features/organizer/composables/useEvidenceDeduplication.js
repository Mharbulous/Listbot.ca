/**
 * Evidence Deduplication Composable
 *
 * Groups evidence documents by document ID (which is the fileHash)
 * and provides metadata options for files with multiple metadata variants.
 *
 * Use Case:
 * - With the new schema, each unique fileHash gets ONE evidence document (automatic deduplication)
 * - Different metadata variants are handled through the originalMetadata collection
 * - This composable primarily handles UI display and metadata selection
 */

/**
 * Group array of objects by a key
 * @param {Array} array - Array to group
 * @param {string} key - Nested key path (e.g., 'storageRef.fileHash')
 * @returns {Object} - Object with key values as keys and grouped arrays as values
 */
function groupBy(array, key) {
  return array.reduce((groups, item) => {
    // Handle nested keys like 'storageRef.fileHash'
    const value = key.split('.').reduce((obj, k) => obj?.[k], item);

    if (!value) {
      console.warn('[Deduplication] Skipping item with missing key:', key, item);
      return groups;
    }

    if (!groups[value]) {
      groups[value] = [];
    }
    groups[value].push(item);
    return groups;
  }, {});
}

/**
 * Get unique items from array based on a key
 * @param {Array} array - Array to deduplicate
 * @param {string} key - Key to check for uniqueness
 * @returns {Array} - Array with unique items
 */
function uniqueBy(array, key) {
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Deduplicate evidence list by document ID (fileHash)
 *
 * @param {Array} evidenceList - Raw evidence documents from Firestore
 * @returns {Array} - Deduplicated list (already unique by design)
 *
 * Note: With the new schema, each fileHash is a document ID, so duplicates are impossible.
 * This function now primarily serves to ensure list consistency and could be simplified further.
 */
export function deduplicateEvidence(evidenceList) {
  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    return [];
  }

  // With new schema: document ID = fileHash, so deduplication is automatic
  // Just return the list as-is since each document is already unique
  return evidenceList;
}

/**
 * Composable hook for evidence deduplication
 * (For future use with reactive dependencies if needed)
 */
export function useEvidenceDeduplication() {
  return {
    deduplicateEvidence,
  };
}
