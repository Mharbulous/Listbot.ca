/**
 * Category Type Definitions
 *
 * Centralized constants for category types, icons, and colors.
 * Used across CategoryManager, CategoryCreationWizard, and other components
 * to ensure consistent display of category type information.
 */

/**
 * Category type options with visual properties
 */
export const categoryTypeOptions = [
  {
    title: 'Fixed List',
    value: 'Fixed List',
    icon: 'mdi-format-list-bulleted',
    color: '#1976d2', // Blue
  },
  {
    title: 'Open List',
    value: 'Open List',
    icon: 'mdi-playlist-plus',
    color: '#1565c0', // Darker blue (similar tone to Fixed List)
  },
  {
    title: 'Currency',
    value: 'Currency',
    icon: 'mdi-currency-usd',
    color: '#388e3c', // Green
  },
  {
    title: 'Date',
    value: 'Date',
    icon: 'mdi-calendar',
    color: '#f57c00', // Orange
  },
  {
    title: 'Timestamp',
    value: 'Timestamp',
    icon: 'mdi-clock-outline',
    color: '#7b1fa2', // Purple
  },
  {
    title: 'Sequence',
    value: 'Sequence',
    icon: 'mdi-numeric',
    color: '#00796b', // Teal
  },
  {
    title: 'Regex',
    value: 'Regex',
    icon: 'mdi-regex',
    color: '#c62828', // Red
  },
  {
    title: 'TextArea',
    value: 'TextArea',
    icon: 'mdi-text-box-outline',
    color: '#5d4037', // Brown
  },
];

/**
 * Get category type information by type value
 * @param {string} type - The category type value (e.g., 'Date', 'Regex')
 * @returns {Object|null} Category type info with icon, color, and title, or null if not found
 */
export function getCategoryTypeInfo(type) {
  if (!type) return null;

  const typeInfo = categoryTypeOptions.find(option => option.value === type);
  return typeInfo || null;
}

/**
 * Get a lowercase label for the category type
 * @param {string} type - The category type value (e.g., 'Date', 'Regex')
 * @returns {string} Lowercase type label (e.g., 'date', 'regex')
 */
export function getCategoryTypeLabel(type) {
  const typeInfo = getCategoryTypeInfo(type);
  return typeInfo ? typeInfo.title.toLowerCase() : 'unknown';
}

/**
 * Check if a category type value is valid
 * @param {string} type - The category type value to validate
 * @returns {boolean} True if the type is valid
 */
export function isValidCategoryType(type) {
  return categoryTypeOptions.some(option => option.value === type);
}
