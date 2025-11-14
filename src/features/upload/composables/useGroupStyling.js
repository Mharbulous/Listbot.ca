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
 * Get background color for a file based on its hash group
 * Alternates between white and light gray for each unique hash
 *
 * @param {Object} file - File object with hash property
 * @param {Array} files - All files in the queue (for determining unique hashes)
 * @returns {string} - Background color (#ffffff or #f9fafb)
 */
export function getGroupBackgroundColor(file, files) {
  // Files without hashes get white background
  if (!file.hash) {
    return '#ffffff';
  }

  // Get all unique hashes in order of first appearance
  const uniqueHashes = [];
  const seen = new Set();

  for (const f of files) {
    if (f.hash && !seen.has(f.hash)) {
      uniqueHashes.push(f.hash);
      seen.add(f.hash);
    }
  }

  // Find index of this file's hash in the unique hashes array
  const hashIndex = uniqueHashes.indexOf(file.hash);

  // Alternate between white and light gray
  // Even indexes (0, 2, 4...) → white
  // Odd indexes (1, 3, 5...) → light gray
  return hashIndex % 2 === 0 ? '#ffffff' : '#f9fafb';
}

/**
 * Check if file is the first in its hash group
 * First file in each group gets a subtle top border
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

  // Files without hashes are considered individual groups
  if (!file.hash) {
    return true;
  }

  // Check if previous file has a different hash
  const prevFile = files[index - 1];
  return !prevFile.hash || prevFile.hash !== file.hash;
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
  };
}
