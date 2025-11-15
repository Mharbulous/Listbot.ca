/**
 * File Type Checker Utility
 *
 * Determines if a file should be marked as "N/A" (not uploadable)
 * based on its file extension.
 *
 * CONFIGURATION: Add new unsupported file extensions to the array below
 */

/**
 * List of file extensions that should NOT be uploaded
 * These files will be marked with "N/A" status and cannot be selected
 *
 * To add new file types: simply add the extension (lowercase, with dot) to this array
 * Example: '.backup', '.cache', '.log', etc.
 */
export const UNSUPPORTED_FILE_EXTENSIONS = [
  '.lnk',  // Windows shortcut files
  '.tmp',  // Temporary files
  // Add more extensions here as needed
];

/**
 * Check if a file is unsupported based on its extension
 * @param {string} filename - The name of the file to check
 * @returns {boolean} - True if the file is unsupported, false otherwise
 */
export function isUnsupportedFileType(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // Get the file extension (lowercase for case-insensitive matching)
  const extension = ('.' + filename.split('.').pop()).toLowerCase();

  // Check if the extension is in the unsupported list
  return UNSUPPORTED_FILE_EXTENSIONS.includes(extension);
}

/**
 * Get a human-readable list of unsupported file extensions
 * Useful for displaying in UI or error messages
 * @returns {string} - Comma-separated list of extensions
 */
export function getUnsupportedExtensionsList() {
  return UNSUPPORTED_FILE_EXTENSIONS.join(', ');
}
