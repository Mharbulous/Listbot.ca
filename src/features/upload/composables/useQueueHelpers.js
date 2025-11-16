import { blake3 } from 'hash-wasm';

/**
 * Queue Helpers Composable
 *
 * Provides utility functions for queue file processing:
 * - File path extraction
 * - Folder filtering
 * - Hash generation
 * - Best file selection
 */
export function useQueueHelpers() {
  /**
   * Get source file path consistently from various file reference formats
   * @param {File|Object} fileRef - File object or file reference object
   * @returns {string} - File path
   */
  const getFilePath = (fileRef) => {
    // Handle direct file objects
    if (fileRef instanceof File) {
      return fileRef.path || fileRef.webkitRelativePath || fileRef.name;
    }
    // Handle file reference objects
    return (
      fileRef.path ||
      fileRef.file?.webkitRelativePath ||
      fileRef.file?.path ||
      fileRef.file?.name ||
      fileRef.name
    );
  };

  /**
   * Check if file is in a skipped folder
   * @param {string} filePath - Path to check
   * @param {Array<string>} skippedFolders - Array of folder paths to skip
   * @returns {boolean} - True if file should be skipped
   */
  const isFileInSkippedFolder = (filePath, skippedFolders = []) => {
    if (!skippedFolders || skippedFolders.length === 0) {
      return false;
    }

    return skippedFolders.some((skippedPath) => {
      // Normalize paths for comparison
      const normalizedFilePath = filePath.replace(/\\/g, '/').toLowerCase();
      const normalizedSkippedPath = skippedPath.replace(/\\/g, '/').toLowerCase();

      return normalizedFilePath.startsWith(normalizedSkippedPath);
    });
  };

  /**
   * Filter files to exclude those from skipped folders
   * @param {Array} files - Array of files to filter
   * @param {Array<string>} skippedFolders - Array of folder paths to skip
   * @returns {Object} - { processableFiles, skippedFiles }
   */
  const filterFilesFromSkippedFolders = (files, skippedFolders = []) => {
    if (!skippedFolders || skippedFolders.length === 0) {
      console.log('No skipped folders - processing all files');
      return { processableFiles: files, skippedFiles: [] };
    }

    const processableFiles = [];
    const skippedFiles = [];

    files.forEach((file) => {
      const filePath = getFilePath(file);

      if (isFileInSkippedFolder(filePath, skippedFolders)) {
        skippedFiles.push(file);
        console.log(`Skipping file from cloud folder: ${filePath}`);
      } else {
        processableFiles.push(file);
      }
    });

    console.log(
      `File filtering complete: ${processableFiles.length} processable, ${skippedFiles.length} skipped`
    );
    return { processableFiles, skippedFiles };
  };

  /**
   * Generate BLAKE3 hash for a file (MAIN THREAD FALLBACK)
   *
   * WARNING: This function runs on the main thread and can block the UI for large files.
   * It should ONLY be used as a fallback when the Web Worker is unavailable.
   *
   * Preferred method: Use useSequentialHashWorker composable for non-blocking hashing.
   *
   * @param {File} file - Browser File object
   * @returns {Promise<string>} - 32-character hex hash string
   */
  const generateFileHash = async (file) => {
    const hashStartTime = performance.now();
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Generate BLAKE3 hash with 128-bit output (16 bytes = 32 hex characters)
    const hash = await blake3(uint8Array, 128);

    const hashDuration = performance.now() - hashStartTime;
    console.warn(`[HASH-PERF-FALLBACK] ${file.name}: ${hashDuration.toFixed(2)}ms (${(file.size / 1024 / 1024).toFixed(2)} MB) - Using main thread fallback (Web Worker unavailable)`);

    // Return BLAKE3 hash of source file content (32 hex characters)
    return hash;
  };

  /**
   * Choose best file from array based on priority rules
   * Priority: 1) Earliest modification date, 2) Longest folder path, 3) Shortest filename,
   *           4) Alphanumeric sort, 5) Original selection order
   *
   * Used by legacy deduplication systems and the Web Worker.
   * Sequential deduplication uses metadata comparison in useUploadTable-sorting.js instead.
   *
   * @param {Array} fileRefs - Array of file reference objects
   * @returns {Object} - Best file reference
   */
  const chooseBestFile = (fileRefs) => {
    return fileRefs.sort((a, b) => {
      // Priority 1: Earliest modification date
      if (a.metadata.lastModified !== b.metadata.lastModified) {
        return a.metadata.lastModified - b.metadata.lastModified;
      }

      // Priority 2: Longest folder path
      const aFolderPath = a.path.substring(0, a.path.lastIndexOf('/') + 1);
      const bFolderPath = b.path.substring(0, b.path.lastIndexOf('/') + 1);
      if (aFolderPath.length !== bFolderPath.length) {
        return bFolderPath.length - aFolderPath.length; // Descending (longest first)
      }

      // Priority 3: Shortest filename
      if (a.metadata.sourceFileName.length !== b.metadata.sourceFileName.length) {
        return a.metadata.sourceFileName.length - b.metadata.sourceFileName.length;
      }

      // Priority 4: Alphanumeric filename sort
      if (a.metadata.sourceFileName !== b.metadata.sourceFileName) {
        return a.metadata.sourceFileName.localeCompare(b.metadata.sourceFileName);
      }

      // Priority 5: Initial selection order (stable sort)
      return a.originalIndex - b.originalIndex;
    })[0];
  };

  return {
    getFilePath,
    isFileInSkippedFolder,
    filterFilesFromSkippedFolders,
    generateFileHash,
    chooseBestFile,
  };
}
