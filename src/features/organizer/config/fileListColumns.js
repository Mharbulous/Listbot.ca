/**
 * File List Column Configuration
 * Defines all available columns for the evidence files list
 */

export const FILE_LIST_COLUMNS = [
  {
    key: 'fileType',
    title: 'File Type',
    width: '80px',
    renderer: 'badge',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'File extension type',
    rendererProps: {
      variant: 'fileType',
    },
  },
  {
    key: 'fileName',
    title: 'File Name',
    width: 'minmax(200px, 2fr)',
    renderer: 'text',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Name of the file',
    rendererProps: {
      fontWeight: '500',
      showTooltip: true,
    },
  },
  {
    key: 'fileSize',
    title: 'File Size',
    width: '100px',
    renderer: 'fileSize',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Size of the file in bytes',
  },
  {
    key: 'documentDate',
    title: 'Document Date',
    width: '120px',
    renderer: 'date',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Date of the document',
  },
  {
    key: 'privilege',
    title: 'Privilege',
    width: '140px',
    renderer: 'badge',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Privilege status of the document',
    rendererProps: {
      variant: 'privilege',
    },
  },
  {
    key: 'description',
    title: 'Description',
    width: 'minmax(150px, 2fr)',
    renderer: 'text',
    sortable: false,
    visible: true,
    required: false,
    align: 'left',
    description: 'Document description',
    rendererProps: {
      muted: true,
      showTooltip: true,
    },
  },
  {
    key: 'documentType',
    title: 'Document Type',
    width: 'minmax(120px, 1.5fr)',
    renderer: 'tagList',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Type classification of the document',
  },
  {
    key: 'author',
    title: 'Author',
    width: 'minmax(120px, 1.5fr)',
    renderer: 'tagList',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Author(s) of the document',
  },
  {
    key: 'custodian',
    title: 'Custodian',
    width: 'minmax(120px, 1.5fr)',
    renderer: 'tagList',
    sortable: true,
    visible: true,
    required: false,
    align: 'left',
    description: 'Custodian(s) of the document',
  },
];

/**
 * Get default visible columns
 */
export function getDefaultVisibleColumns() {
  return FILE_LIST_COLUMNS.filter((col) => col.visible);
}

/**
 * Get required columns that cannot be hidden
 */
export function getRequiredColumns() {
  return FILE_LIST_COLUMNS.filter((col) => col.required);
}

/**
 * Get column by key
 */
export function getColumnByKey(key) {
  return FILE_LIST_COLUMNS.find((col) => col.key === key);
}

/**
 * Validate column keys exist
 */
export function validateColumnKeys(keys) {
  const validKeys = FILE_LIST_COLUMNS.map((col) => col.key);
  return keys.every((key) => validKeys.includes(key));
}

/**
 * Generate CSS grid template columns from column configurations
 */
export function generateGridTemplate(columns) {
  if (!columns || columns.length === 0) {
    return 'auto';
  }

  return columns.map((col) => col.width).join(' ');
}

/**
 * Calculate minimum table width from column configurations
 * Extracts minimum values from minmax() and sums fixed widths
 */
export function calculateMinimumTableWidth(columns) {
  if (!columns || columns.length === 0) {
    return 0;
  }

  // Extract minimum width from each column
  const columnWidths = columns.map((col) => {
    const width = col.width;

    // Handle minmax() syntax: extract the first value
    const minmaxMatch = width.match(/minmax\(([^,]+),/);
    if (minmaxMatch) {
      return parseInt(minmaxMatch[1], 10);
    }

    // Handle fixed pixel values
    const pxMatch = width.match(/(\d+)px/);
    if (pxMatch) {
      return parseInt(pxMatch[1], 10);
    }

    // Default fallback for other values
    return 150;
  });

  // Sum all column widths
  const totalColumnWidth = columnWidths.reduce((sum, width) => sum + width, 0);

  // Add gaps between columns (8px each)
  const gapWidth = (columns.length - 1) * 8;

  // Add padding (16px on each side)
  const paddingWidth = 32;

  return totalColumnWidth + gapWidth + paddingWidth;
}
