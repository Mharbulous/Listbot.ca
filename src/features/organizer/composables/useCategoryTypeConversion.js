import { ref, computed } from 'vue';
import { categoryTypeOptions } from '../utils/categoryTypes.js';
import {
  getAllowedTypeConversions,
  requiresWarning,
  getConversionWarningMessage,
} from '../utils/categoryTypeConversions.js';

/**
 * Composable for category type conversion logic
 * Handles type changes, conversion warnings, and allowed type options
 *
 * @param {Object} editedCategory - Reactive reference to the edited category
 * @param {Object} originalType - Reactive reference to the original category type
 * @returns {Object} Type conversion utilities and state
 */
export function useCategoryTypeConversion(editedCategory, originalType) {
  const pendingType = ref(null);
  const showWarningDialog = ref(false);
  const conversionWarningMessage = ref('');

  // Computed property to get allowed type options based on current type
  const allowedTypeOptions = computed(() => {
    if (!originalType.value) return categoryTypeOptions;

    const allowedTypes = getAllowedTypeConversions(originalType.value);
    return categoryTypeOptions.filter((option) => allowedTypes.includes(option.value));
  });

  const handleTypeChange = (newType) => {
    // Check if this change requires a warning
    if (requiresWarning(originalType.value, newType)) {
      pendingType.value = newType;
      conversionWarningMessage.value = getConversionWarningMessage(originalType.value, newType);
      showWarningDialog.value = true;
    } else {
      applyTypeChange(newType);
    }
  };

  const applyTypeChange = (newType) => {
    // Handle data transformations based on type change
    if (newType === 'Regex' && originalType.value === 'Sequence') {
      // Set default regex when converting from Sequence
      if (!editedCategory.value.regexDefinition || editedCategory.value.regexDefinition === '.*') {
        editedCategory.value.regexDefinition = '.*';
      }
    }
  };

  const confirmTypeChange = () => {
    showWarningDialog.value = false;
    if (pendingType.value) {
      applyTypeChange(pendingType.value);
      pendingType.value = null;
    }
  };

  const cancelTypeChange = () => {
    showWarningDialog.value = false;
    // Revert type back to original
    editedCategory.value.type = originalType.value;
    pendingType.value = null;
  };

  return {
    allowedTypeOptions,
    showWarningDialog,
    conversionWarningMessage,
    handleTypeChange,
    confirmTypeChange,
    cancelTypeChange,
  };
}
