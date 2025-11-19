/**
 * Shared Deduplication Logic
 *
 * Defines the core metadata comparison logic used across both Phase 1 (client-side)
 * and Phase 2 (server-side) deduplication.
 *
 * CRITICAL: This module ensures consistent deduplication behavior by providing a
 * single source of truth for metadata comparison.
 *
 * DEDUPLICATION TERMINOLOGY:
 * - "duplicate": Files with identical content (hash) and core metadata where folder path variations
 *                have no informational value. Duplicates are not uploaded and their metadata is not copied.
 * - "copy": Files with the same hash value but different file metadata that IS meaningful.
 *           Copies are not uploaded to storage, but their metadata is recorded for informational value.
 * - "best" or "primary": The file with the most meaningful metadata that will be uploaded to storage.
 */

/**
 * Generate metadata key for Phase 1 client-side grouping
 *
 * Used to group files by their metadata BEFORE hashing (size-based pre-filter).
 * Files with the same metadata key are considered duplicates (exact same metadata).
 * Files with different metadata keys but same hash are considered copies.
 *
 * @param {string} name - Source file name
 * @param {number} size - File size in bytes
 * @param {number} lastModified - Last modified timestamp (milliseconds)
 * @param {string} folderPath - Source folder path (without filename)
 * @returns {string} - Metadata key for grouping (name_size_lastModified_folderPath)
 */
export function generateMetadataKey(name, size, lastModified, folderPath) {
  return `${name}_${size}_${lastModified}_${folderPath}`;
}

/**
 * Generate metadata hash input string for Phase 2 server-side deduplication
 *
 * Used to create a hash that uniquely identifies a file's metadata variant.
 * This hash is used as the Firestore document ID in /sourceMetadata/{metadataHash}.
 *
 * CRITICAL: This MUST include folderPath to distinguish between copies with different paths.
 * Without folderPath, files in different folders would get the same metadata hash and be
 * incorrectly marked as duplicates instead of copies.
 *
 * @param {string} name - Source file name
 * @param {number} lastModified - Last modified timestamp (milliseconds)
 * @param {string} hash - Content hash (BLAKE3)
 * @param {string} folderPath - Source folder path (without filename)
 * @returns {string} - Metadata string to be hashed (name|lastModified|hash|folderPath)
 */
export function generateMetadataHashInput(name, lastModified, hash, folderPath) {
  // Use pipe delimiter for consistency with existing Phase 2 format
  // Order: name|lastModified|hash|folderPath
  return `${name}|${lastModified}|${hash}|${folderPath}`;
}

/**
 * Extract metadata fields from a queue item
 *
 * Helper function to extract standard metadata fields from queue items.
 * Handles both Phase 1 (queue items) and Phase 2 (uploaded files) data structures.
 *
 * @param {Object} item - Queue item or file object
 * @returns {Object} - Extracted metadata { name, size, lastModified, folderPath }
 */
export function extractMetadata(item) {
  return {
    name: item.name || item.sourceFileName,
    size: item.size || item.sourceFileSize,
    lastModified: item.sourceLastModified || item.lastModified,
    folderPath: item.folderPath || item.sourceFolderPath || '',
  };
}

/**
 * Compare two metadata objects for equality
 *
 * Used to determine if two files have identical metadata (duplicates) or
 * different metadata (copies).
 *
 * @param {Object} metadata1 - First metadata object
 * @param {Object} metadata2 - Second metadata object
 * @returns {boolean} - True if metadata is identical
 */
export function metadataEquals(metadata1, metadata2) {
  return (
    metadata1.name === metadata2.name &&
    metadata1.size === metadata2.size &&
    metadata1.lastModified === metadata2.lastModified &&
    metadata1.folderPath === metadata2.folderPath
  );
}

/**
 * Determine relationship between two files with the same hash
 *
 * Returns the relationship type:
 * - 'duplicate': Identical metadata (including folderPath)
 * - 'copy': Same hash, different metadata (meaningful variation)
 *
 * @param {Object} file1 - First file metadata
 * @param {Object} file2 - Second file metadata
 * @returns {string} - Relationship type ('duplicate' or 'copy')
 */
export function determineRelationship(file1, file2) {
  const metadata1 = extractMetadata(file1);
  const metadata2 = extractMetadata(file2);

  if (metadataEquals(metadata1, metadata2)) {
    return 'duplicate';
  }

  return 'copy';
}
