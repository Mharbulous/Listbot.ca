/**
 * Category Form Helper Functions
 *
 * Shared utility functions for category creation and editing.
 * These helpers handle regex generation, validation, and text formatting.
 */
import RandExp from 'randexp';

/**
 * Auto-generate regex examples from pattern
 * @param {string} regexDefinition - The regex pattern to generate examples from
 * @returns {string[]} Array of 7 generated examples, or empty array on error
 */
export function generateRegexExamples(regexDefinition) {
  if (!regexDefinition || !regexDefinition.trim()) {
    return [];
  }

  try {
    const pattern = regexDefinition.trim();
    const randexp = new RandExp(pattern);
    const examples = [];
    for (let i = 0; i < 7; i++) {
      examples.push(randexp.gen());
    }
    return examples;
  } catch (error) {
    return [];
  }
}

/**
 * Capitalize first letter of input string
 * @param {string} input - The string to capitalize
 * @returns {string} String with first letter capitalized
 */
export function capitalizeFirstLetter(input) {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Check if regex definition is valid based on generated examples
 * @param {string} regexDefinition - The regex pattern to validate
 * @param {string[]} examples - Array of generated examples
 * @returns {boolean} True if regex is valid and has examples
 */
export function isRegexDefinitionValid(regexDefinition, examples) {
  if (!regexDefinition || !regexDefinition.trim()) {
    return false;
  }
  return examples.length > 0;
}
