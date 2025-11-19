/**
 * Category Field Mapping Utility
 * Maps category types to their corresponding Firestore tag document field names
 */

/**
 * Get the Firestore field name for a given category type
 * @param {string} type - The category type (e.g., 'Text', 'Text Area', 'Fixed List', 'Currency')
 * @returns {string} The Firestore field name ('text', 'textArea', or 'value')
 */
export function getCategoryFieldName(type) {
  if (type === 'Text') {
    return 'text';
  }
  if (type === 'Text Area') {
    return 'textArea';
  }
  // All other types (Fixed List, Open List, Currency, Date, Timestamp, Sequence, Regex) use 'value'
  return 'value';
}
