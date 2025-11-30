/**
 * MIME Type Formatter Utility
 * Converts MIME types to user-friendly file type abbreviations
 */

/**
 * Map of common MIME types to user-friendly abbreviations
 */
const MIME_TYPE_MAP = {
  // PDF
  'application/pdf': 'PDF',

  // Microsoft Word
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',

  // Microsoft Excel
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',

  // Microsoft PowerPoint
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',

  // Images
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'image/bmp': 'BMP',
  'image/svg+xml': 'SVG',
  'image/tiff': 'TIFF',
  'image/webp': 'WEBP',

  // Text files
  'text/plain': 'TXT',
  'text/csv': 'CSV',
  'text/html': 'HTML',
  'text/css': 'CSS',
  'text/javascript': 'JS',
  'application/json': 'JSON',
  'application/xml': 'XML',
  'text/xml': 'XML',

  // Archives
  'application/zip': 'ZIP',
  'application/x-rar-compressed': 'RAR',
  'application/x-7z-compressed': '7Z',
  'application/gzip': 'GZIP',
  'application/x-tar': 'TAR',

  // Audio
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/mp4': 'M4A',

  // Video
  'video/mp4': 'MP4',
  'video/mpeg': 'MPEG',
  'video/quicktime': 'MOV',
  'video/x-msvideo': 'AVI',
  'video/x-ms-wmv': 'WMV',

  // Email formats
  'application/vnd.ms-outlook': 'MSG',
  'message/rfc822': 'EML',

  // Other common formats
  'application/rtf': 'RTF',
  'application/vnd.oasis.opendocument.text': 'ODT',
  'application/vnd.oasis.opendocument.spreadsheet': 'ODS',
};

/**
 * Format MIME type to user-friendly abbreviation
 * @param {string} mimeType - The MIME type to format (e.g., "application/pdf")
 * @returns {string} User-friendly abbreviation (e.g., "PDF") or original MIME type if unrecognized
 */
export function formatMimeType(mimeType) {
  // Preserve error messages
  if (!mimeType || mimeType.startsWith('ERROR:')) {
    return mimeType;
  }

  // Convert to lowercase for case-insensitive matching
  const normalizedMimeType = mimeType.toLowerCase().trim();

  // Look up the friendly name
  const friendlyName = MIME_TYPE_MAP[normalizedMimeType];

  // Return friendly name if found, otherwise return original MIME type
  return friendlyName || mimeType;
}
