/**
 * Evidence Deduplication Composable
 *
 * Groups evidence documents by fileHash (storage-level deduplication)
 * and provides metadata options for files with multiple metadata variants.
 *
 * Use Case:
 * - Same file uploaded twice → 2 evidence docs, same fileHash → 1 display row
 * - Same file with different names → 2 evidence docs, same fileHash, different metadataHash → 1 display row with dropdown
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
 * Deduplicate evidence list by fileHash
 *
 * @param {Array} evidenceList - Raw evidence documents from Firestore
 * @returns {Array} - Deduplicated list with metadata options
 *
 * Output Structure:
 * {
 *   ...evidence, // All fields from primary evidence doc
 *   metadataOptions: [ // Only present if multiple metadata variants exist
 *     {
 *       displayCopy: 'metadataHash1',
 *       displayName: 'File_v1.pdf',
 *       createdAt: timestamp1,
 *       evidenceId: 'evidence_1'
 *     },
 *     {
 *       displayCopy: 'metadataHash2',
 *       displayName: 'File_v2.pdf',
 *       createdAt: timestamp2,
 *       evidenceId: 'evidence_2'
 *     }
 *   ],
 *   selectedMetadataHash: 'metadataHash1' // Currently selected metadata
 * }
 */
export function deduplicateEvidence(evidenceList) {
  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    return [];
  }

  console.log(`[Deduplication] Starting with ${evidenceList.length} evidence documents`);

  // Step 1: Group by fileHash (same file content)
  const fileHashGroups = groupBy(evidenceList, 'storageRef.fileHash');

  console.log(`[Deduplication] Grouped into ${Object.keys(fileHashGroups).length} unique files`);

  // Step 2: For each fileHash group, collect unique metadata variants
  const deduplicated = Object.entries(fileHashGroups).map(([fileHash, docs]) => {
    // Get unique metadata variations (different displayCopy = different metadata)
    const uniqueMetadata = uniqueBy(docs, 'displayCopy');

    console.log(
      `[Deduplication] File ${fileHash.substring(0, 8)}... has ${docs.length} evidence docs → ${uniqueMetadata.length} unique metadata`
    );

    // Use the first unique metadata variant as the primary
    const primaryDoc = uniqueMetadata[0];

    // Build metadata options if multiple variants exist
    const metadataOptions =
      uniqueMetadata.length > 1
        ? uniqueMetadata.map((doc) => ({
            displayCopy: doc.displayCopy,
            displayName: doc.displayName,
            createdAt: doc.createdAt,
            evidenceId: doc.id,
          }))
        : null;

    return {
      ...primaryDoc, // Spread all fields from primary doc
      metadataOptions, // Add metadata options (null if only 1 variant)
      selectedMetadataHash: primaryDoc.displayCopy, // Track current selection
    };
  });

  console.log(
    `[Deduplication] Completed: ${evidenceList.length} → ${deduplicated.length} documents`
  );

  // Log files with multiple metadata for debugging
  const multiMetadata = deduplicated.filter((d) => d.metadataOptions);
  if (multiMetadata.length > 0) {
    console.log(
      `[Deduplication] ${multiMetadata.length} files have multiple metadata variants:`,
      multiMetadata.map((d) => ({
        id: d.id,
        displayName: d.displayName,
        variantCount: d.metadataOptions.length,
      }))
    );
  }

  return deduplicated;
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
