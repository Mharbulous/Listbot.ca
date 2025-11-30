/**
 * MIME Type Detector Utility
 * Provides fallback MIME type detection from file extensions
 * Used when browser's file.type is empty or unrecognized
 */

/**
 * Map of file extensions to MIME types
 * Focuses on common document types and email formats
 */
const EXTENSION_TO_MIME = {
  // Email formats
  msg: 'application/vnd.ms-outlook',
  eml: 'message/rfc822',

  // PDF
  pdf: 'application/pdf',

  // Microsoft Word
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  docm: 'application/vnd.ms-word.document.macroEnabled.12',

  // Microsoft Excel
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xlsm: 'application/vnd.ms-excel.sheet.macroEnabled.12',

  // Microsoft PowerPoint
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',

  // Images
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  webp: 'image/webp',
  tiff: 'image/tiff',
  tif: 'image/tiff',

  // Text files
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  json: 'application/json',
  xml: 'application/xml',

  // Archives
  zip: 'application/zip',
  rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  tar: 'application/x-tar',
  gz: 'application/gzip',

  // Audio
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',

  // Video
  mp4: 'video/mp4',
  avi: 'video/x-msvideo',
  mov: 'video/quicktime',
  wmv: 'video/x-ms-wmv',

  // Other common formats
  rtf: 'application/rtf',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
};

/**
 * Detect MIME type from filename
 * @param {string} filename - The filename to detect from
 * @returns {string} The detected MIME type or empty string if unknown
 */
export function detectMimeTypeFromFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return '';
  }

  // Extract extension (lowercase, without dot)
  const parts = filename.split('.');
  if (parts.length === 1) {
    // No extension
    return '';
  }

  const extension = parts.pop().toLowerCase();
  return EXTENSION_TO_MIME[extension] || '';
}

/**
 * Get MIME type from file, with fallback to extension-based detection
 * @param {File} file - The browser File object
 * @returns {string} The MIME type (from file.type or extension fallback)
 */
export function getMimeType(file) {
  if (!file) {
    return '';
  }

  // First try browser-provided MIME type
  if (file.type && file.type.trim() !== '') {
    return file.type;
  }

  // Fallback to extension-based detection
  return detectMimeTypeFromFilename(file.name);
}
