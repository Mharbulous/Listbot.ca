/**
 * Column configuration for the Analyze table
 * Single source of truth for column definitions, labels, and default widths
 */

export const COLUMNS = [
  { key: 'fileType', label: 'File Type', defaultWidth: 80 },
  { key: 'fileName', label: 'File Name', defaultWidth: 300 },
  { key: 'size', label: 'Size', defaultWidth: 100 },
  { key: 'date', label: 'Uploaded', defaultWidth: 200 },
  { key: 'privilege', label: 'Privilege', defaultWidth: 140 },
  { key: 'description', label: 'Description', defaultWidth: 250 },
  { key: 'documentType', label: 'Document Type', defaultWidth: 200 },
  { key: 'author', label: 'Author', defaultWidth: 180 },
  { key: 'custodian', label: 'Custodian', defaultWidth: 180 },
  { key: 'modifiedDate', label: 'Modified Date', defaultWidth: 150 },
  { key: 'status', label: 'Status', defaultWidth: 120 }
];

/**
 * Get default column order (array of column keys)
 */
export function getDefaultColumnOrder() {
  return COLUMNS.map(col => col.key);
}

/**
 * Get default column widths object
 */
export function getDefaultColumnWidths() {
  return COLUMNS.reduce((acc, col) => {
    acc[col.key] = col.defaultWidth;
    return acc;
  }, {});
}

/**
 * Get column metadata by key
 */
export function getColumnByKey(key) {
  return COLUMNS.find(col => col.key === key);
}
