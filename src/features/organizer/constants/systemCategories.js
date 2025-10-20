/**
 * System Categories Constants
 *
 * Defines the predefined system categories that should exist for every matter.
 * These categories use reserved document IDs and are automatically initialized.
 */

/**
 * Reserved document IDs for system categories
 * These IDs are used directly as Firestore document IDs
 */
export const SYSTEM_CATEGORY_IDS = [
  'DocumentDate',
  'Privilege',
  'Description',
  'DocumentType',
  'Author',
  'Custodian',
];

/**
 * Complete system category definitions with all required fields
 * These definitions are used to:
 * 1. Seed the global /systemcategories collection
 * 2. Initialize matter-specific categories
 */
export const SYSTEM_CATEGORIES = [
  {
    id: 'DocumentDate',
    name: 'Document Date',
    type: 'Date',
    defaultDateFormat: 'YYYY-MM-DD',
    isActive: true,
    isSystemCategory: true,
    description: 'The date the document was created or signed',
    tags: [],
  },
  {
    id: 'Privilege',
    name: 'Privilege',
    type: 'Fixed List',
    isActive: true,
    isSystemCategory: true,
    description: 'Legal privilege classification',
    tags: [
      {
        id: 'privilege-attorney-client',
        name: 'Attorney-Client',
      },
      {
        id: 'privilege-work-product',
        name: 'Work Product',
      },
      {
        id: 'privilege-not-privileged',
        name: 'Not Privileged',
      },
    ],
  },
  {
    id: 'Description',
    name: 'Description',
    type: 'Text Area',
    isActive: true,
    isSystemCategory: true,
    description: 'Free-form description of the document',
    tags: [],
  },
  {
    id: 'DocumentType',
    name: 'Document Type',
    type: 'Open List',
    isActive: true,
    isSystemCategory: true,
    description: 'Classification of document type',
    tags: [
      {
        id: 'doctype-email',
        name: 'Email',
      },
      {
        id: 'doctype-memo',
        name: 'Memo',
      },
      {
        id: 'doctype-letter',
        name: 'Letter',
      },
      {
        id: 'doctype-contract',
        name: 'Contract',
      },
      {
        id: 'doctype-invoice',
        name: 'Invoice',
      },
      {
        id: 'doctype-report',
        name: 'Report',
      },
    ],
  },
  {
    id: 'Author',
    name: 'Author',
    type: 'Open List',
    isActive: true,
    isSystemCategory: true,
    description: 'Person or entity who created the document',
    tags: [],
  },
  {
    id: 'Custodian',
    name: 'Custodian',
    type: 'Open List',
    isActive: true,
    isSystemCategory: true,
    description: 'Person or entity who possessed or controlled the document',
    tags: [],
  },
];

/**
 * Check if a category ID is a system category
 * @param {string} categoryId - The category ID to check
 * @returns {boolean} True if the category is a system category
 */
export function isSystemCategory(categoryId) {
  return SYSTEM_CATEGORY_IDS.includes(categoryId);
}

/**
 * Get system category definition by ID
 * @param {string} categoryId - The system category ID
 * @returns {Object|null} The system category definition or null if not found
 */
export function getSystemCategory(categoryId) {
  return SYSTEM_CATEGORIES.find((cat) => cat.id === categoryId) || null;
}

/**
 * Get all system category definitions
 * @returns {Array} Array of all system category definitions
 */
export function getAllsystemcategories() {
  return [...SYSTEM_CATEGORIES];
}
