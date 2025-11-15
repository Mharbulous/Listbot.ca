/**
 * File Type Icon Utility
 *
 * Maps file extensions to emoji icons for visual file type identification
 * Used in the Upload Queue table to display icons next to filenames
 *
 * NOTE: Browser security prevents accessing system file icons,
 * so we use universally-supported emoji icons instead.
 */

/**
 * File type to emoji mapping
 * Organized by category for maintainability
 */
const FILE_TYPE_ICONS = {
  // Documents
  pdf: '📕',
  doc: '📘',
  docx: '📘',
  docm: '📘',
  dot: '📘',
  dotx: '📘',
  odt: '📘',
  rtf: '📄',
  txt: '📝',
  md: '📝',

  // Spreadsheets
  xls: '📊',
  xlsx: '📊',
  xlsm: '📊',
  xlsb: '📊',
  xlt: '📊',
  xltx: '📊',
  csv: '📊',
  ods: '📊',

  // Presentations
  ppt: '📙',
  pptx: '📙',
  pptm: '📙',
  pps: '📙',
  ppsx: '📙',
  odp: '📙',
  key: '📙',

  // Images
  jpg: '🖼️',
  jpeg: '🖼️',
  png: '🖼️',
  gif: '🖼️',
  bmp: '🖼️',
  svg: '🖼️',
  ico: '🖼️',
  webp: '🖼️',
  tiff: '🖼️',
  tif: '🖼️',
  heic: '🖼️',
  heif: '🖼️',

  // Audio
  mp3: '🎵',
  wav: '🎵',
  flac: '🎵',
  aac: '🎵',
  ogg: '🎵',
  wma: '🎵',
  m4a: '🎵',

  // Video
  mp4: '🎬',
  avi: '🎬',
  mov: '🎬',
  wmv: '🎬',
  flv: '🎬',
  mkv: '🎬',
  webm: '🎬',
  m4v: '🎬',

  // Archives
  zip: '📦',
  rar: '📦',
  '7z': '📦',
  tar: '📦',
  gz: '📦',
  bz2: '📦',
  xz: '📦',

  // Code
  js: '💻',
  ts: '💻',
  jsx: '💻',
  tsx: '💻',
  vue: '💻',
  html: '💻',
  css: '💻',
  scss: '💻',
  sass: '💻',
  less: '💻',
  json: '💻',
  xml: '💻',
  yaml: '💻',
  yml: '💻',
  py: '💻',
  java: '💻',
  c: '💻',
  cpp: '💻',
  h: '💻',
  cs: '💻',
  php: '💻',
  rb: '💻',
  go: '💻',
  rs: '💻',
  swift: '💻',
  kt: '💻',
  sql: '💻',
  sh: '💻',
  bash: '💻',

  // Executables
  exe: '⚙️',
  msi: '⚙️',
  app: '⚙️',
  dmg: '⚙️',
  deb: '⚙️',
  rpm: '⚙️',

  // Email
  eml: '📧',
  msg: '📧',

  // Fonts
  ttf: '🔤',
  otf: '🔤',
  woff: '🔤',
  woff2: '🔤',

  // Data
  db: '💾',
  sqlite: '💾',
  mdb: '💾',

  // CAD/Design
  dwg: '📐',
  dxf: '📐',
  ai: '🎨',
  psd: '🎨',
  sketch: '🎨',
  fig: '🎨',

  // Unsupported (will show red circle)
  lnk: '⛔',
  tmp: '⛔',
};

/**
 * Default icon for unknown file types
 */
const DEFAULT_ICON = '📄';

/**
 * Get emoji icon for a file based on its extension
 * @param {string} filename - The name of the file
 * @returns {string} - Emoji icon representing the file type
 */
export function getFileTypeIcon(filename) {
  if (!filename || typeof filename !== 'string') {
    return DEFAULT_ICON;
  }

  // Extract extension (lowercase, without dot)
  const parts = filename.split('.');
  if (parts.length === 1) {
    // No extension
    return DEFAULT_ICON;
  }

  const extension = parts.pop().toLowerCase();

  // Return mapped icon or default
  return FILE_TYPE_ICONS[extension] || DEFAULT_ICON;
}

/**
 * Get a description of the file type based on extension
 * Useful for tooltips/accessibility
 * @param {string} filename - The name of the file
 * @returns {string} - Human-readable file type description
 */
export function getFileTypeDescription(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'Unknown file type';
  }

  const parts = filename.split('.');
  if (parts.length === 1) {
    return 'File (no extension)';
  }

  const extension = parts.pop().toLowerCase();

  // Map extensions to descriptions
  const descriptions = {
    // Documents
    pdf: 'PDF Document',
    doc: 'Word Document',
    docx: 'Word Document',
    docm: 'Word Document (Macro-enabled)',
    txt: 'Text File',
    rtf: 'Rich Text Document',
    md: 'Markdown File',

    // Spreadsheets
    xls: 'Excel Spreadsheet',
    xlsx: 'Excel Spreadsheet',
    xlsm: 'Excel Spreadsheet (Macro-enabled)',
    csv: 'CSV Spreadsheet',

    // Presentations
    ppt: 'PowerPoint Presentation',
    pptx: 'PowerPoint Presentation',
    pptm: 'PowerPoint Presentation (Macro-enabled)',

    // Images
    jpg: 'JPEG Image',
    jpeg: 'JPEG Image',
    png: 'PNG Image',
    gif: 'GIF Image',
    svg: 'SVG Image',
    webp: 'WebP Image',

    // Audio
    mp3: 'MP3 Audio',
    wav: 'WAV Audio',
    flac: 'FLAC Audio',

    // Video
    mp4: 'MP4 Video',
    avi: 'AVI Video',
    mov: 'QuickTime Video',
    mkv: 'MKV Video',

    // Archives
    zip: 'ZIP Archive',
    rar: 'RAR Archive',
    '7z': '7-Zip Archive',
    tar: 'TAR Archive',

    // Code
    js: 'JavaScript File',
    ts: 'TypeScript File',
    vue: 'Vue Component',
    html: 'HTML File',
    css: 'CSS Stylesheet',
    json: 'JSON File',
    py: 'Python Script',

    // Unsupported
    lnk: 'Shortcut (not supported)',
    tmp: 'Temporary File (not supported)',
  };

  return descriptions[extension] || `${extension.toUpperCase()} File`;
}
