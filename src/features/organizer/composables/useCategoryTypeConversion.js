import { ref, computed } from 'vue';
import { categoryTypeOptions } from '../utils/categoryTypes.js';
import {
  getAllowedTypeConversions,
  requiresWarning,
  getConversionWarningMessage,
} from '../utils/categoryTypeConversions.js';

/**
 * Composable for managing category type conversion logic
 * @param {Object} params - Configuration parameters
 * @param {Ref} params.editedCategory - Edited category data
 * @param {Ref} params.originalType - Original category type
 * @returns {Object} Type conversion state and methods
 */
export function useCategoryTypeConversion({ editedCategory, originalType }) {
  // Type conversion warning dialog state
  const pendingType = ref(null);
  const showWarningDialog = ref(false);
  const conversionWarningMessage = ref('');

  /**
   * Computed property to get allowed type options based on current type
   */
  const allowedTypeOptions = computed(() => {
    if (!originalType.value) return categoryTypeOptions;

    const allowedTypes = getAllowedTypeConversions(originalType.value);
    return categoryTypeOptions.filter((option) => allowedTypes.includes(option.value));
  });

  /**
   * Handle type change with warning dialog if needed
   */
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

  /**
   * Apply type change and handle data transformations
   */
  const applyTypeChange = (newType) => {
    // Handle data transformations based on type change
    if (newType === 'Regex' && originalType.value === 'Sequence') {
      // Set default regex when converting from Sequence
      if (!editedCategory.value.regexDefinition || editedCategory.value.regexDefinition === '.*') {
        editedCategory.value.regexDefinition = '.*';
      }
    }
  };

  /**
   * Confirm type change from warning dialog
   */
  const confirmTypeChange = () => {
    showWarningDialog.value = false;
    if (pendingType.value) {
      applyTypeChange(pendingType.value);
      pendingType.value = null;
    }
  };

  /**
   * Cancel type change and revert to original
   */
  const cancelTypeChange = () => {
    showWarningDialog.value = false;
    // Revert type back to original
    editedCategory.value.type = originalType.value;
    pendingType.value = null;
  };

  return {
    // State
    showWarningDialog,
    conversionWarningMessage,

    // Computed
    allowedTypeOptions,

    // Methods
    handleTypeChange,
    confirmTypeChange,
    cancelTypeChange,
  };
}
