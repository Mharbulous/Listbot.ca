/**
 * File Path Extraction Utility
 *
 * SINGLE SOURCE OF TRUTH for extracting folder paths from File objects.
 *
 * This module provides a centralized, robust approach to extracting folder paths
 * from File objects that may come from different sources:
 * - Browser folder input (webkitdirectory)
 * - Drag-and-drop folders
 * - Individual file selection
 *
 * Design Principles:
 * 1. Extract path information ONCE, immediately when files enter the system
 * 2. Store extracted paths in queue items (NOT on File objects)
 * 3. Never rely on custom properties added to File objects
 * 4. Clear, documented priority order for path sources
 */

/**
 * Extracts folder path from a File object.
 *
 * This is the CANONICAL function for path extraction - all code should use this.
 *
 * Priority order for path sources:
 * 1. webkitRelativePath - Set by browser for folder input and drag-and-drop (most reliable)
 * 2. _dropPath - Custom property set by drag-and-drop handler (fallback)
 * 3. file.path - Non-standard property that may exist in some browsers
 * 4. Default to '/' - File is at root level (no folder structure)
 *
 * @param {File} file - File object to extract path from
 * @returns {string} Folder path (e.g., '/MyFolder/SubFolder' or '/')
 *
 * @example
 * // File from nested folder
 * extractFolderPath(file) // Returns: '/Documents/Reports'
 *
 * @example
 * // File from root folder
 * extractFolderPath(file) // Returns: '/Documents'
 *
 * @example
 * // Individual file (no folder)
 * extractFolderPath(file) // Returns: '/'
 */
export function extractFolderPath(file) {
  // Try to get path source in priority order
  const pathSource = file.webkitRelativePath || file._dropPath || file.path;

  // If no path source, or path is just the filename, file is at root
  if (!pathSource || pathSource === file.name) {
    return '/';
  }

  // Parse the full path to extract just the folder portion
  // Example: 'Documents/Reports/file.pdf' -> ['Documents', 'Reports', 'file.pdf']
  const parts = pathSource.split('/');

  // Remove the filename (last part)
  parts.pop();

  // If no parts remain, file is at root
  if (parts.length === 0) {
    return '/';
  }

  // Join folder parts with '/' and prepend with '/'
  // Example: ['Documents', 'Reports'] -> '/Documents/Reports'
  return '/' + parts.join('/');
}

/**
 * Extracts complete path information from a File object.
 *
 * Call this ONCE per file at the entry point (when files first enter the system).
 * Store the returned object in your queue item to avoid re-extracting paths.
 *
 * @param {File} file - File object
 * @returns {Object} Path information object
 * @property {string} folderPath - Folder path only (e.g., '/MyFolder/SubFolder' or '/')
 * @property {string} fullPath - Complete path including filename (e.g., 'MyFolder/SubFolder/file.pdf')
 * @property {string} fileName - Just the filename (e.g., 'file.pdf')
 *
 * @example
 * const pathInfo = extractFilePathInfo(file);
 * // {
 * //   folderPath: '/Documents/Reports',
 * //   fullPath: 'Documents/Reports/file.pdf',
 * //   fileName: 'file.pdf'
 * // }
 */
export function extractFilePathInfo(file) {
  const folderPath = extractFolderPath(file);
  const pathSource = file.webkitRelativePath || file._dropPath || file.path;
  const fullPath = pathSource || file.name;

  return {
    folderPath,
    fullPath,
    fileName: file.name,
  };
}

/**
 * Diagnostic utility to help debug path extraction issues.
 * Logs all available path sources for a file.
 *
 * @param {File} file - File object to diagnose
 * @returns {Object} All available path information
 */
export function diagnoseFilePaths(file) {
  const info = {
    fileName: file.name,
    webkitRelativePath: file.webkitRelativePath || '(not set)',
    _dropPath: file._dropPath || '(not set)',
    path: file.path || '(not set)',
    extractedFolderPath: extractFolderPath(file),
  };

  console.log('[Path Extractor] Diagnostic info:', info);
  return info;
}
