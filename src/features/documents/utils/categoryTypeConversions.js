/**
 * Category Type Conversion Rules
 *
 * Defines allowed conversions between category types and provides
 * validation and warning logic for type changes during category editing.
 */

/**
 * Type conversion rules matrix
 * Defines which type conversions are allowed and which require warnings
 */
const conversionRules = {
  'Fixed List': {
    allowedConversions: ['Fixed List', 'Open List'],
    warnings: {},
  },
  'Open List': {
    allowedConversions: ['Open List', 'Fixed List'],
    warnings: {},
  },
  Date: {
    allowedConversions: ['Date', 'Timestamp'],
    warnings: {},
  },
  Timestamp: {
    allowedConversions: ['Timestamp', 'Date'],
    warnings: {},
  },
  Sequence: {
    allowedConversions: ['Sequence', 'Regex'],
    warnings: {
      Regex:
        'Converting from Sequence to Regex is a one-way conversion that cannot be undone. Your sequence format and gap settings will be replaced with regex pattern matching.',
    },
  },
  Regex: {
    allowedConversions: ['Regex'], // Can only stay as Regex
    warnings: {},
  },
  Currency: {
    allowedConversions: ['Currency'], // Cannot convert to other types
    warnings: {},
  },
  Text: {
    allowedConversions: ['Text', 'Text Area'],
    warnings: {}, // No warnings needed for Text -> Text Area (safe upgrade)
  },
  'Text Area': {
    allowedConversions: ['Text Area', 'Text'],
    warnings: {
      Text: 'Converting from Text Area to Text will impose a 64-character limit and disallow line breaks. Existing values exceeding these limits may need to be edited.',
    },
  },
};

/**
 * Get all allowed type conversions for a given category type
 * @param {string} currentType - The current category type
 * @returns {string[]} Array of allowed type values
 */
export function getAllowedTypeConversions(currentType) {
  if (!currentType || !conversionRules[currentType]) {
    console.warn(`[CategoryTypeConversions] Unknown type: ${currentType}`);
    return [currentType]; // Default to only allowing current type
  }

  return conversionRules[currentType].allowedConversions;
}

/**
 * Check if a type conversion is allowed
 * @param {string} fromType - The current category type
 * @param {string} toType - The target category type
 * @returns {boolean} True if conversion is allowed
 */
export function isTypeConversionAllowed(fromType, toType) {
  const allowedConversions = getAllowedTypeConversions(fromType);
  return allowedConversions.includes(toType);
}

/**
 * Check if a type conversion requires a warning
 * @param {string} fromType - The current category type
 * @param {string} toType - The target category type
 * @returns {boolean} True if warning should be shown
 */
export function requiresWarning(fromType, toType) {
  if (!fromType || !toType || fromType === toType) {
    return false;
  }

  const rules = conversionRules[fromType];
  if (!rules || !rules.warnings) {
    return false;
  }

  return toType in rules.warnings;
}

/**
 * Get the warning message for a type conversion
 * @param {string} fromType - The current category type
 * @param {string} toType - The target category type
 * @returns {string|null} Warning message or null if no warning
 */
export function getConversionWarningMessage(fromType, toType) {
  if (!requiresWarning(fromType, toType)) {
    return null;
  }

  const rules = conversionRules[fromType];
  return rules.warnings[toType] || null;
}

/**
 * Get conversion summary for UI display
 * @param {string} fromType - The current category type
 * @param {string} toType - The target category type
 * @returns {Object} Conversion info object
 */
export function getConversionInfo(fromType, toType) {
  return {
    isAllowed: isTypeConversionAllowed(fromType, toType),
    requiresWarning: requiresWarning(fromType, toType),
    warningMessage: getConversionWarningMessage(fromType, toType),
    isNoChange: fromType === toType,
  };
}

/**
 * Validate category data after type conversion
 * Returns fields that should be preserved, added, or removed
 * @param {string} fromType - The current category type
 * @param {string} toType - The target category type
 * @param {Object} categoryData - Current category data
 * @returns {Object} Transformation instructions
 */
export function getTypeConversionTransform(fromType, toType, categoryData) {
  const transform = {
    preserve: ['name', 'id', 'color'], // Always preserve these
    add: {}, // Fields to add with default values
    remove: [], // Fields to remove
  };

  // No conversion needed
  if (fromType === toType) {
    return { ...transform, preserve: Object.keys(categoryData) };
  }

  // Fixed List ↔ Open List: Preserve tags
  if (
    (fromType === 'Fixed List' && toType === 'Open List') ||
    (fromType === 'Open List' && toType === 'Fixed List')
  ) {
    transform.preserve.push('tags');
  }

  // Date → Timestamp: Preserve date format, add time format
  if (fromType === 'Date' && toType === 'Timestamp') {
    transform.preserve.push('defaultDateFormat');
    transform.add.defaultTimeFormat = 'HH:mm';
  }

  // Timestamp → Date: Preserve date format, remove time format
  if (fromType === 'Timestamp' && toType === 'Date') {
    transform.preserve.push('defaultDateFormat');
    transform.remove.push('defaultTimeFormat');
  }

  // Sequence → Regex: Preserve allowDuplicateValues, remove sequence-specific fields
  if (fromType === 'Sequence' && toType === 'Regex') {
    transform.preserve.push('allowDuplicateValues');
    transform.remove.push('defaultSequenceFormat', 'allowGaps');
    transform.add.regexDefinition = '.*';
    transform.add.regexExamples = '';
  }

  // Text ↔ Text Area: Preserve allowDuplicateValues
  if (
    (fromType === 'Text' && toType === 'Text Area') ||
    (fromType === 'Text Area' && toType === 'Text')
  ) {
    transform.preserve.push('allowDuplicateValues');
  }

  return transform;
}
