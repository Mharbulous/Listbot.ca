/**
 * Category ID Generator and Validation Utilities
 *
 * Provides functions for generating system category IDs and checking for duplicates.
 * Used by both NewSystemCategory.vue and CategoryEditViewer.vue to ensure
 * consistent validation logic.
 */

/**
 * Generate a document ID for a system category based on its name
 * Removes all spaces from the category name
 * @param {string} categoryName - The category name
 * @returns {string} Document ID (e.g., "Control Number" -> "ControlNumber")
 */
export function generateSystemCategoryId(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') {
    return '';
  }
  // Remove all spaces from the category name
  return categoryName.trim().replace(/\s+/g, '');
}

/**
 * Check if a category name or its generated ID conflicts with existing system categories
 * @param {string} categoryName - The category name to check
 * @param {Array} systemCategories - Array of existing system categories
 * @param {string|null} excludeCategoryId - Category ID to exclude from check (for edit mode)
 * @returns {Object} Result object with conflict information
 * @property {boolean} nameConflict - True if name already exists
 * @property {boolean} idConflict - True if generated ID already exists
 * @property {Object|null} conflictingCategory - The category that conflicts (if any)
 * @property {string} generatedId - The ID that would be generated from the name
 */
export function checkForDuplicateSystemCategory(
  categoryName,
  systemCategories,
  excludeCategoryId = null
) {
  const trimmedName = categoryName.trim();
  const generatedId = generateSystemCategoryId(trimmedName);

  // Filter out the category being edited (if excludeCategoryId is provided)
  const categoriesToCheck = systemCategories.filter((cat) => cat.id !== excludeCategoryId);

  // Check for name conflict (case-insensitive)
  const nameConflictCategory = categoriesToCheck.find(
    (cat) => cat.name.toLowerCase() === trimmedName.toLowerCase()
  );

  // Check for ID conflict (case-insensitive)
  const idConflictCategory = categoriesToCheck.find(
    (cat) => cat.id.toLowerCase() === generatedId.toLowerCase()
  );

  return {
    nameConflict: !!nameConflictCategory,
    idConflict: !!idConflictCategory,
    conflictingCategory: nameConflictCategory || idConflictCategory || null,
    generatedId,
  };
}

/**
 * Get a descriptive error message for category name/ID conflicts
 * @param {Object} duplicateCheck - Result from checkForDuplicateSystemCategory
 * @returns {string[]} Array of error messages
 */
export function getCategoryConflictErrors(duplicateCheck) {
  const errors = [];

  if (duplicateCheck.nameConflict) {
    errors.push(`Category name "${duplicateCheck.conflictingCategory.name}" already exists`);
  }

  if (duplicateCheck.idConflict && !duplicateCheck.nameConflict) {
    // Only show ID conflict if it's different from the name conflict
    errors.push(
      `Category ID "${duplicateCheck.generatedId}" would conflict with existing category "${duplicateCheck.conflictingCategory.name}"`
    );
  }

  return errors;
}
