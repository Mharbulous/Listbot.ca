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
 * Alternates between white and light gray for each group (including unique files)
 *
 * OPTIMIZATION: Tentative files (no hash) inherit color from row above
 * instead of counting groups, since they're always positioned directly below
 * the file they tentatively match.
 *
 * @param {Object} file - File object with hash property
 * @param {Array} files - All files in the queue (for determining unique hashes)
 * @returns {string} - Background color (#ffffff or #f9fafb)
 */
export function getGroupBackgroundColor(file, files) {
  // Find this file's index in the array
  const fileIndex = files.indexOf(file);
  if (fileIndex === -1) return '#ffffff';

  // TENTATIVE files (no hash) → inherit color from row above
  // Tentative duplicates and copies don't have hash values yet,
  // but are sorted to appear directly below the files they match.
  // No need to count groups - just use the same color as above.
  if (!file.hash && fileIndex > 0) {
    return getGroupBackgroundColor(files[fileIndex - 1], files);
  }

  // Files WITH hashes → count groups to determine color
  // IMPORTANT: Skip tentative files (no hash) when counting groups
  // since they inherit color and shouldn't be counted as separate groups
  let groupIndex = 0;

  for (let i = 0; i <= fileIndex; i++) {
    // Skip tentative files - they don't form their own groups
    if (!files[i].hash) continue;

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
 * Check if file is the last in its hash group
 * Last file in each group gets a bottom border to separate from next group
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

  // Files without hashes are considered individual groups
  if (!file.hash) {
    return true;
  }

  // Check if next file has a different hash
  const nextFile = files[index + 1];
  return !nextFile.hash || nextFile.hash !== file.hash;
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
