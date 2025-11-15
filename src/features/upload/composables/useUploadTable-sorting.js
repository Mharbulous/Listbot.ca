/**
 * Composable for managing upload queue sorting
 * Handles multi-level sorting by group timestamp, hash, status, and metadata
 */
export function useUploadTableSorting(uploadQueue) {
  /**
   * Helper to get grouping key for a file
   * STABILITY: Prioritizes tentativeGroupId over hash to prevent groups from shifting
   * position when lazy hash verification completes (prevents zebra pattern flashing)
   */
  const getGroupingKey = (file) => {
    // PRIORITY 1: tentativeGroupId (stable group identifier)
    // This ensures groups maintain their position even after hash calculation
    if (file.tentativeGroupId) return file.tentativeGroupId;

    // PRIORITY 2: hash (for files that were hashed immediately)
    if (file.hash) return file.hash;

    // PRIORITY 3: referenceFileId (for tentative duplicates/copies)
    // Use the reference file's grouping key for grouping
    if (file.referenceFileId && (file.status === 'duplicate' || file.status === 'copy')) {
      const referenceFile = uploadQueue.value.find((f) => f.id === file.referenceFileId);
      if (referenceFile) {
        // Use reference file's tentativeGroupId if available, otherwise hash, otherwise referenceFileId
        return referenceFile.tentativeGroupId || referenceFile.hash || file.referenceFileId;
      }
      // Fallback: use referenceFileId if reference file not found
      return file.referenceFileId;
    }

    // No hash and no referenceFileId - use empty string (sorts to end)
    return '';
  };

  /**
   * Helper to compare metadata for copy/duplicate sorting
   * Uses same priority logic as chooseBestFile() to ensure consistent ordering
   */
  const compareMetadata = (a, b) => {
    // Only apply metadata sorting to copy/duplicate status files
    if ((a.status !== 'copy' && a.status !== 'duplicate') ||
        (b.status !== 'copy' && b.status !== 'duplicate')) {
      return 0;
    }

    // Priority 1: Earliest modification date (ascending)
    const lastModifiedA = a.sourceLastModified || 0;
    const lastModifiedB = b.sourceLastModified || 0;
    if (lastModifiedA !== lastModifiedB) {
      return lastModifiedA - lastModifiedB;
    }

    // Priority 2: Longest folder path (descending)
    const folderPathLengthA = (a.folderPath || '').length;
    const folderPathLengthB = (b.folderPath || '').length;
    if (folderPathLengthA !== folderPathLengthB) {
      return folderPathLengthB - folderPathLengthA;
    }

    // Priority 3: Shortest filename (ascending)
    const fileNameLengthA = (a.name || '').length;
    const fileNameLengthB = (b.name || '').length;
    if (fileNameLengthA !== fileNameLengthB) {
      return fileNameLengthA - fileNameLengthB;
    }

    // Priority 4: Alphanumeric filename sort (ascending)
    const fileNameA = a.name || '';
    const fileNameB = b.name || '';
    return fileNameA.localeCompare(fileNameB);
  };

  /**
   * Sort queue by group timestamp and status
   * - Groups with most recently added files appear first (desc groupTimestamp)
   * - Within each group: ready → copy → duplicate
   * - Files with same hash are grouped together (primary duplicate immediately above 'duplicate' file)
   * - Tentative duplicates (no hash yet) group with their reference file via referenceFileId
   * - Copies and duplicates are sorted by the same metadata criteria (ensuring matching order)
   */
  const sortQueueByGroupTimestamp = () => {
    const statusOrder = { ready: 0, copy: 1, duplicate: 2, 'n/a': 3, skip: 4, 'read error': 5 };

    uploadQueue.value.sort((a, b) => {
      // Primary sort: group timestamp (descending - most recent first)
      const timestampDiff = (b.groupTimestamp || 0) - (a.groupTimestamp || 0);
      if (timestampDiff !== 0) return timestampDiff;

      // Secondary sort: group by hash or referenceFileId (ensures files with same content appear together)
      // This ensures the primary file appears immediately above its "duplicate"/"copy" files
      // Tentative duplicates (no hash) will group with their reference file
      const groupKeyA = getGroupingKey(a);
      const groupKeyB = getGroupingKey(b);
      const hashDiff = groupKeyA.localeCompare(groupKeyB);
      if (hashDiff !== 0) return hashDiff;

      // Tertiary sort: status order (ready < copy < duplicate)
      const statusA = statusOrder[a.status] !== undefined ? statusOrder[a.status] : 99;
      const statusB = statusOrder[b.status] !== undefined ? statusOrder[b.status] : 99;
      const statusDiff = statusA - statusB;
      if (statusDiff !== 0) return statusDiff;

      // Quaternary sort: metadata comparison (for copy/duplicate files only)
      // Ensures copies and duplicates are sorted in the same order based on metadata
      const metadataDiff = compareMetadata(a, b);
      if (metadataDiff !== 0) return metadataDiff;

      // Quinary sort: maintain original add order (stable sort)
      return 0;
    });

    console.log('[QUEUE] Queue sorted by group timestamp');
  };

  return {
    sortQueueByGroupTimestamp,
  };
}
