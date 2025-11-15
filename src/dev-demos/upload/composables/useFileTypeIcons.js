/**
 * File Type Icons Composable
 *
 * Maps file extensions to SVG icons from src/assets/icons/file_types/
 * or emoji fallbacks for images and unrecognized types.
 *
 * Used in the dedicated File Type Icon column of the Upload Queue table.
 */

// Import SVG icons
import audioIcon from '@/assets/icons/file_types/audio.svg';
import emailIcon from '@/assets/icons/file_types/email.svg';
import excelIcon from '@/assets/icons/file_types/excel.svg';
import movieIcon from '@/assets/icons/file_types/movie.svg';
import pdfIcon from '@/assets/icons/file_types/pdf.svg';
import spreadsheetIcon from '@/assets/icons/file_types/spreadsheet.svg';
import wordIcon from '@/assets/icons/file_types/word.svg';

/**
 * File extension to icon mapping
 * Maps extensions to either SVG paths or emoji strings
 */
const FILE_TYPE_MAP = {
  // PDF Documents
  pdf: { type: 'svg', path: pdfIcon, description: 'PDF Document' },

  // Word Documents
  doc: { type: 'svg', path: wordIcon, description: 'Word Document' },
  docx: { type: 'svg', path: wordIcon, description: 'Word Document' },
  docm: { type: 'svg', path: wordIcon, description: 'Word Document (Macro-enabled)' },
  dot: { type: 'svg', path: wordIcon, description: 'Word Template' },
  dotx: { type: 'svg', path: wordIcon, description: 'Word Template' },
  odt: { type: 'svg', path: wordIcon, description: 'OpenDocument Text' },
  rtf: { type: 'svg', path: wordIcon, description: 'Rich Text Document' },

  // Excel Spreadsheets
  xls: { type: 'svg', path: excelIcon, description: 'Excel Spreadsheet' },
  xlsx: { type: 'svg', path: excelIcon, description: 'Excel Spreadsheet' },
  xlsm: { type: 'svg', path: excelIcon, description: 'Excel Spreadsheet (Macro-enabled)' },
  xlsb: { type: 'svg', path: excelIcon, description: 'Excel Spreadsheet (Binary)' },
  xlt: { type: 'svg', path: excelIcon, description: 'Excel Template' },
  xltx: { type: 'svg', path: excelIcon, description: 'Excel Template' },

  // Other Spreadsheets
  csv: { type: 'svg', path: spreadsheetIcon, description: 'CSV Spreadsheet' },
  ods: { type: 'svg', path: spreadsheetIcon, description: 'OpenDocument Spreadsheet' },

  // Audio Files
  mp3: { type: 'svg', path: audioIcon, description: 'MP3 Audio' },
  wav: { type: 'svg', path: audioIcon, description: 'WAV Audio' },
  flac: { type: 'svg', path: audioIcon, description: 'FLAC Audio' },
  aac: { type: 'svg', path: audioIcon, description: 'AAC Audio' },
  ogg: { type: 'svg', path: audioIcon, description: 'OGG Audio' },
  wma: { type: 'svg', path: audioIcon, description: 'WMA Audio' },
  m4a: { type: 'svg', path: audioIcon, description: 'M4A Audio' },

  // Video Files
  mp4: { type: 'svg', path: movieIcon, description: 'MP4 Video' },
  avi: { type: 'svg', path: movieIcon, description: 'AVI Video' },
  mov: { type: 'svg', path: movieIcon, description: 'QuickTime Video' },
  wmv: { type: 'svg', path: movieIcon, description: 'WMV Video' },
  flv: { type: 'svg', path: movieIcon, description: 'FLV Video' },
  mkv: { type: 'svg', path: movieIcon, description: 'MKV Video' },
  webm: { type: 'svg', path: movieIcon, description: 'WebM Video' },
  m4v: { type: 'svg', path: movieIcon, description: 'M4V Video' },

  // Email Files
  eml: { type: 'svg', path: emailIcon, description: 'Email Message' },
  msg: { type: 'svg', path: emailIcon, description: 'Outlook Message' },
};

/**
 * Image file extensions (use emoji instead of SVG)
 */
const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'svg',
  'ico',
  'webp',
  'tiff',
  'tif',
  'heic',
  'heif',
];

/**
 * Get file type icon information based on filename
 *
 * @param {string} fileName - The name of the file
 * @returns {Object} Object containing:
 *   - iconPath: SVG path (if SVG icon) or null
 *   - iconEmoji: Emoji string (if emoji icon) or null
 *   - tooltip: Tooltip text describing the file type
 */
export function getFileTypeIcon(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return {
      iconPath: null,
      iconEmoji: '⚠️',
      tooltip: 'unrecognized file type',
    };
  }

  // Extract file extension (lowercase, without dot)
  const parts = fileName.split('.');
  if (parts.length === 1) {
    // No extension
    return {
      iconPath: null,
      iconEmoji: '⚠️',
      tooltip: 'unrecognized file type',
    };
  }

  const ext = parts.pop().toLowerCase();

  // Check if it's an image file (use emoji)
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return {
      iconPath: null,
      iconEmoji: '🖼️',
      tooltip: 'Image file',
    };
  }

  // Check if we have an SVG for this type
  const iconInfo = FILE_TYPE_MAP[ext];
  if (iconInfo) {
    return {
      iconPath: iconInfo.path,
      iconEmoji: null,
      tooltip: iconInfo.description,
    };
  }

  // Default fallback for unrecognized types
  return {
    iconPath: null,
    iconEmoji: '⚠️',
    tooltip: 'unrecognized file type',
  };
}
