/**
 * Composable for group-based styling in upload table
 *
 * BUSINESS LOGIC: Calculates background colors and boundaries for file groups
 * based on BLAKE3 hash values. Files with the same hash are visually grouped.
 *
 * WHY THIS IS A COMPOSABLE:
 * - This is business logic, NOT virtualization mechanics
 * - Keeps UploadTableVirtualizer.vue focused ONLY on virtualization
 * - Follows existing composable pattern (useUploadTable.js, useFileFormatters.js)
 */

/**
 * Helper function to get grouping key for a file
 * Uses the same logic as queue sorting to ensure consistency
 *
 * STABILITY: Prioritizes tentativeGroupId over hash to prevent groups from shifting
 * position when lazy hash verification completes (prevents zebra pattern flashing)
 *
 * @param {Object} file - File object
 * @param {Array} files - All files in the queue
 * @returns {string} - Grouping key (tentativeGroupId, hash, or referenceFileId)
 */
function getGroupingKey(file, files) {
  // PRIORITY 1: tentativeGroupId (stable group identifier)
  // This ensures groups maintain their position even after hash calculation
  if (file.tentativeGroupId) return file.tentativeGroupId;

  // PRIORITY 2: hash (for files that were hashed immediately)
  if (file.hash) return file.hash;

  // PRIORITY 3: referenceFileId (for tentative duplicates/copies)
  // Use the reference file's grouping key for grouping
  if (file.referenceFileId && (file.status === 'duplicate' || file.status === 'copy')) {
    const referenceFile = files.find((f) => f.id === file.referenceFileId);
    if (referenceFile) {
      // Use reference file's tentativeGroupId if available, otherwise hash, otherwise referenceFileId
      return referenceFile.tentativeGroupId || referenceFile.hash || file.referenceFileId;
    }
    // Fallback: use referenceFileId if reference file not found
    return file.referenceFileId;
  }

  // No hash and no referenceFileId - treat as unique group
  // Use file ID to ensure each unique file gets its own group
  return file.id || '';
}

/**
 * Get background color for a file based on its hash group
 * Alternates between white and light gray for each group (including unique files)
 * Handles tentative duplicates by grouping them with their reference file
 *
 * OPTIMIZATION: Tentative files (status=duplicate/copy, no hash) inherit color from
 * their reference file instead of recalculating group index. This prevents color
 * flashing during lazy hash verification (99%+ of tentatives are confirmed).
 *
 * @param {Object} file - File object with hash property
 * @param {Array} files - All files in the queue (for determining unique hashes)
 * @returns {string} - Background color (#ffffff or #f9fafb)
 */
export function getGroupBackgroundColor(file, files) {
  // Find this file's index in the array
  const fileIndex = files.indexOf(file);
  if (fileIndex === -1) return '#ffffff';

  // OPTIMIZATION: Tentative duplicates/copies inherit color from reference file
  // This prevents color flashing during lazy hash verification (99%+ of tentatives are confirmed)
  // Only in rare cases (0.1%) where hash verification fails will colors change (desired visual feedback)
  if ((file.status === 'duplicate' || file.status === 'copy') && !file.hash && file.referenceFileId) {
    // Find the reference file
    const referenceFile = files.find((f) => f.id === file.referenceFileId);
    if (referenceFile) {
      // Recursively get reference file's color (handles chains of tentatives)
      return getGroupBackgroundColor(referenceFile, files);
    }
    // Fallback: use file directly above (reference should be there due to sorting)
    if (fileIndex > 0) {
      return getGroupBackgroundColor(files[fileIndex - 1], files);
    }
  }

  // Standard group index calculation for all other files
  // (hashed files, unique files, and promoted files)
  let groupIndex = 0;

  for (let i = 0; i <= fileIndex; i++) {
    if (isFirstInGroup(files[i], i, files)) {
      groupIndex++;
    }
  }

  // Subtract 1 because we counted the current file's group
  groupIndex--;

  // Alternate between white and light gray
  // Even indexes (0, 2, 4...) → white
  // Odd indexes (1, 3, 5...) → light gray
  return groupIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
}

/**
 * Check if file is the first in its hash group
 * First file in each group gets a subtle top border
 * Handles tentative duplicates by comparing grouping keys
 *
 * OPTIMIZATION: Tentative files (status=duplicate/copy, no hash) are NEVER first in group
 * because they always belong to their reference file's group. This prevents extra borders
 * and maintains visual grouping stability.
 *
 * @param {Object} file - File object with hash property
 * @param {number} index - Index of file in the files array
 * @param {Array} files - All files in the queue
 * @returns {boolean} - True if first file in its hash group
 */
export function isFirstInGroup(file, index, files) {
  // First file overall is always first in its group
  if (index === 0) {
    return true;
  }

  // OPTIMIZATION: Tentative files are NEVER first in group
  // They always belong to their reference file's group
  if ((file.status === 'duplicate' || file.status === 'copy') && !file.hash) {
    return false;
  }

  // Get grouping keys for current and previous files
  const currentGroupKey = getGroupingKey(file, files);
  const prevFile = files[index - 1];
  const prevGroupKey = getGroupingKey(prevFile, files);

  // Different grouping keys = different groups
  return currentGroupKey !== prevGroupKey;
}

/**
 * Check if file is the last in its hash group
 * Last file in each group gets a bottom border to separate from next group
 * Handles tentative duplicates by comparing grouping keys
 *
 * OPTIMIZATION: If next file is a tentative that references this file, this file
 * is NOT last in group (tentatives belong to the same visual group as their reference).
 *
 * @param {Object} file - File object with hash property
 * @param {number} index - Index of file in the files array
 * @param {Array} files - All files in the queue
 * @returns {boolean} - True if last file in its hash group
 */
export function isLastInGroup(file, index, files) {
  // Last file overall is always last in its group
  if (index === files.length - 1) {
    return true;
  }

  const nextFile = files[index + 1];

  // OPTIMIZATION: If next file is a tentative that references this file, NOT last in group
  // This ensures tentatives are visually grouped with their reference file
  if (
    nextFile &&
    (nextFile.status === 'duplicate' || nextFile.status === 'copy') &&
    !nextFile.hash &&
    nextFile.referenceFileId === file.id
  ) {
    return false;
  }

  // Get grouping keys for current and next files
  const currentGroupKey = getGroupingKey(file, files);
  const nextGroupKey = getGroupingKey(nextFile, files);

  // Different grouping keys = different groups
  return currentGroupKey !== nextGroupKey;
}

/**
 * Composable export (for Vue component usage)
 * Not strictly needed since we export individual functions,
 * but follows Vue composable pattern for consistency
 */
export function useGroupStyling() {
  return {
    getGroupBackgroundColor,
    isFirstInGroup,
    isLastInGroup,
  };
}
