import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrganizerStore } from '../stores/organizer.js';
import { categoryTypeOptions } from '../utils/categoryTypes.js';
import { currencyOptions } from '../utils/currencyOptions.js';
import { sequenceFormatOptions, booleanFormatOptions } from '../utils/categoryFormOptions.js';
import { capitalizeFirstLetter } from '../utils/categoryFormHelpers.js';

/**
 * Composable for category edit form state and validation
 * Handles form data, validation errors, and change detection
 *
 * @param {Object} category - Reactive reference to the original category
 * @param {Object} isRegexValid - Computed property for regex validation
 * @returns {Object} Form state and validation utilities
 */
export function useCategoryEditForm(category, isRegexValid) {
  const organizerStore = useOrganizerStore();
  const { categories } = storeToRefs(organizerStore);

  const editedCategory = ref({
    name: '',
    type: '',
    tags: [],
    defaultCurrency: 'CAD',
    defaultSequenceFormat: '1, 2, 3, ...',
    defaultBooleanFormat: 'TRUE/FALSE',
    regexDefinition: '.*',
    allowDuplicateValues: false,
    allowGaps: false,
  });

  const categoryErrors = ref({
    name: [],
    type: [],
    defaultCurrency: [],
    defaultSequenceFormat: [],
    defaultBooleanFormat: [],
    regexDefinition: [],
    allowDuplicateValues: [],
    allowGaps: [],
  });

  // Computed property to check if form is valid
  const isFormValid = computed(() => {
    const name = editedCategory.value.name.trim();
    const type = editedCategory.value.type;

    return (
      name.length >= 3 &&
      type &&
      (editedCategory.value.type !== 'Currency' || editedCategory.value.defaultCurrency) &&
      (editedCategory.value.type !== 'Sequence' || editedCategory.value.defaultSequenceFormat) &&
      (editedCategory.value.type !== 'Boolean' || editedCategory.value.defaultBooleanFormat) &&
      isRegexValid.value &&
      (!['Text Area', 'Sequence', 'Regex'].includes(editedCategory.value.type) ||
        typeof editedCategory.value.allowDuplicateValues === 'boolean') &&
      (editedCategory.value.type !== 'Sequence' ||
        typeof editedCategory.value.allowGaps === 'boolean')
    );
  });

  // Computed property to check if there are changes
  const hasChanges = computed(() => {
    if (!category.value) return false;

    // Compare all relevant fields
    const fields = [
      'name',
      'type',
      'defaultCurrency',
      'defaultSequenceFormat',
      'defaultBooleanFormat',
      'regexDefinition',
      'allowDuplicateValues',
      'allowGaps',
    ];

    // Special handling for tags array comparison
    if (category.value.tags || editedCategory.value.tags) {
      const originalTags = category.value.tags || [];
      const editedTags = editedCategory.value.tags || [];

      if (originalTags.length !== editedTags.length) {
        return true;
      }

      // Compare tag names (order-independent)
      const originalNames = originalTags.map((t) => t.name).sort();
      const editedNames = editedTags.map((t) => t.name).sort();

      if (JSON.stringify(originalNames) !== JSON.stringify(editedNames)) {
        return true;
      }
    }

    return fields.some((field) => {
      const originalValue = category.value[field];
      const editedValue = editedCategory.value[field];

      // Handle undefined/null comparison
      if (originalValue === undefined || originalValue === null) {
        return editedValue !== undefined && editedValue !== null;
      }

      return originalValue !== editedValue;
    });
  });

  const capitalizeFirstLetters = (event) => {
    editedCategory.value.name = capitalizeFirstLetter(event.target.value);
  };

  const validateCategory = () => {
    const nameErrors = [];
    const typeErrors = [];
    const defaultCurrencyErrors = [];
    const defaultSequenceFormatErrors = [];
    const defaultBooleanFormatErrors = [];
    const allowDuplicateValuesErrors = [];
    const allowGapsErrors = [];
    const regexDefinitionErrors = [];

    const name = editedCategory.value.name.trim();
    const type = editedCategory.value.type;
    const defaultCurrency = editedCategory.value.defaultCurrency;
    const defaultSequenceFormat = editedCategory.value.defaultSequenceFormat;
    const defaultBooleanFormat = editedCategory.value.defaultBooleanFormat;
    const regexDefinition = editedCategory.value.regexDefinition;
    const allowDuplicateValues = editedCategory.value.allowDuplicateValues;
    const allowGaps = editedCategory.value.allowGaps;

    // Validate name
    if (!name) {
      nameErrors.push('Category name is required');
    } else if (name.length > 50) {
      nameErrors.push('Category name must be 50 characters or less');
    } else if (
      categories.value.some(
        (cat) => cat.id !== category.value.id && cat.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      nameErrors.push('Category name already exists');
    }

    // Validate type
    if (!type) {
      typeErrors.push('Category type is required');
    } else if (!categoryTypeOptions.find((option) => option.value === type)) {
      typeErrors.push('Please select a valid category type');
    }

    // Validate currency-specific fields
    if (type === 'Currency') {
      if (!defaultCurrency) {
        defaultCurrencyErrors.push('Default currency is required for Currency categories');
      } else if (!currencyOptions.find((option) => option.value === defaultCurrency)) {
        defaultCurrencyErrors.push('Please select a valid currency');
      }
    }

    // Validate sequence-specific fields (for Sequence only)
    if (type === 'Sequence') {
      if (!defaultSequenceFormat) {
        defaultSequenceFormatErrors.push('Sequence format is required for Sequence categories');
      } else if (!sequenceFormatOptions.find((option) => option.value === defaultSequenceFormat)) {
        defaultSequenceFormatErrors.push('Please select a valid sequence format');
      }
    }

    // Validate boolean-specific fields (for Boolean only)
    if (type === 'Boolean') {
      if (!defaultBooleanFormat) {
        defaultBooleanFormatErrors.push('Boolean format is required for Boolean categories');
      } else if (!booleanFormatOptions.find((option) => option.value === defaultBooleanFormat)) {
        defaultBooleanFormatErrors.push('Please select a valid boolean format');
      }
    }

    // Validate allow duplicate values for applicable types
    if (['Text', 'Text Area', 'Sequence', 'Regex'].includes(type)) {
      if (typeof allowDuplicateValues !== 'boolean') {
        allowDuplicateValuesErrors.push('Allow duplicate values setting is required');
      }
    }

    // Validate allow gaps for Sequence type
    if (type === 'Sequence') {
      if (typeof allowGaps !== 'boolean') {
        allowGapsErrors.push('Allow gaps setting is required');
      }
    }

    // Validate regex-specific fields (for Regex only)
    if (type === 'Regex') {
      if (!regexDefinition || !regexDefinition.trim()) {
        regexDefinitionErrors.push('Regex definition is required for Regex categories');
      } else {
        // Basic regex syntax validation
        try {
          new RegExp(regexDefinition.trim());
        } catch (e) {
          regexDefinitionErrors.push('Invalid regex syntax: ' + e.message);
        }
      }
    }

    categoryErrors.value.name = nameErrors;
    categoryErrors.value.type = typeErrors;
    categoryErrors.value.defaultCurrency = defaultCurrencyErrors;
    categoryErrors.value.defaultSequenceFormat = defaultSequenceFormatErrors;
    categoryErrors.value.defaultBooleanFormat = defaultBooleanFormatErrors;
    categoryErrors.value.regexDefinition = regexDefinitionErrors;
    categoryErrors.value.allowDuplicateValues = allowDuplicateValuesErrors;
    categoryErrors.value.allowGaps = allowGapsErrors;

    return (
      nameErrors.length === 0 &&
      typeErrors.length === 0 &&
      defaultCurrencyErrors.length === 0 &&
      defaultSequenceFormatErrors.length === 0 &&
      defaultBooleanFormatErrors.length === 0 &&
      regexDefinitionErrors.length === 0 &&
      allowDuplicateValuesErrors.length === 0 &&
      allowGapsErrors.length === 0
    );
  };

  return {
    editedCategory,
    categoryErrors,
    isFormValid,
    hasChanges,
    capitalizeFirstLetters,
    validateCategory,
  };
}
