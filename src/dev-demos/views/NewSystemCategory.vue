<template>
  <div class="category-creation-wizard">
    <v-card variant="flat" class="mx-auto">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-plus-circle</v-icon>
        New System Category
        <v-spacer />
        <v-btn variant="text" icon :to="{ name: 'CategoryMigrationTool' }" color="default">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-6">
        <v-form @submit.prevent="createCategory">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="newCategory.name"
                label="Category Name"
                variant="outlined"
                density="comfortable"
                :error-messages="nameErrorMessages"
                placeholder="e.g., Project Code, Invoices, Tax Documents"
                autofocus
                @input="capitalizeFirstLetters"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="newCategory.type"
                label="Category Type"
                variant="outlined"
                density="comfortable"
                :error-messages="newCategoryErrors.type"
                :items="categoryTypeOptions"
                item-title="title"
                item-value="value"
                placeholder="Select category type"
              >
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="item.raw.color" size="20" class="mr-2">
                      {{ item.raw.icon }}
                    </v-icon>
                    <span>{{ item.raw.title }}</span>
                  </div>
                </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <v-icon :color="item.raw.color" size="20">
                        {{ item.raw.icon }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- Currency-specific child controls -->
            <v-col v-if="newCategory.type === 'Currency'" cols="12">
              <v-select
                v-model="newCategory.defaultCurrency"
                label="Default Currency"
                variant="outlined"
                density="comfortable"
                :error-messages="newCategoryErrors.defaultCurrency"
                :items="currencyOptions"
                item-title="title"
                item-value="value"
                placeholder="Select default currency"
              >
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <span class="font-weight-medium mr-2">{{ item.raw.symbol }}</span>
                    <span>{{ item.raw.title }}</span>
                  </div>
                </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <span
                        class="font-weight-bold text-h6 mr-2"
                        style="min-width: 24px; text-align: center"
                      >
                        {{ item.raw.symbol }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- Sequence-specific child controls -->
            <v-col v-if="newCategory.type === 'Sequence'" cols="12">
              <v-select
                v-model="newCategory.defaultSequenceFormat"
                label="Sequence Format"
                variant="outlined"
                density="comfortable"
                :error-messages="newCategoryErrors.defaultSequenceFormat"
                :items="sequenceFormatOptions"
                item-title="title"
                item-value="value"
                placeholder="Select sequence format"
              />
            </v-col>

            <!-- Fixed List and Open List tag options -->
            <v-col v-if="['Fixed List', 'Open List'].includes(newCategory.type)" cols="12">
              <TagOptionsManager
                v-model="newCategory.tags"
                placeholder="Add tag option"
                :max-length="32"
              />
            </v-col>

            <!-- Regex-specific child controls -->
            <v-col v-if="newCategory.type === 'Regex'" cols="12" class="pb-0">
              <v-textarea
                v-model="newCategory.regexDefinition"
                label="Regex Definition"
                variant="outlined"
                density="comfortable"
                :error-messages="newCategoryErrors.regexDefinition"
                placeholder="e.g., ^[A-Z]{2}-\d{4}$"
                auto-grow
                rows="2"
              />
            </v-col>

            <v-col v-if="newCategory.type === 'Regex'" cols="12" class="pt-0 mt-0">
              <div class="auto-generated-examples">
                <template v-if="autoGeneratedExamples.length > 0">
                  <div class="text-subtitle-2 mb-3" style="color: rgba(0, 0, 0, 0.87)">
                    Examples
                  </div>
                  <div class="examples-container">
                    <v-chip
                      v-for="(example, index) in autoGeneratedExamples"
                      :key="index"
                      class="ma-1"
                      size="small"
                      variant="outlined"
                      color="primary"
                    >
                      {{ example }}
                    </v-chip>
                  </div>
                </template>
                <div v-else class="text-caption" style="color: #d32f2f">
                  Enter a valid regex pattern to see Examples
                </div>
              </div>
            </v-col>

            <!-- Allow Duplicate Values checkbox for Text Area, Sequence, and Regex -->
            <v-col v-if="['Text Area', 'Sequence', 'Regex'].includes(newCategory.type)" cols="12">
              <v-checkbox
                v-model="newCategory.allowDuplicateValues"
                label="Allow duplicate values"
                :error-messages="newCategoryErrors.allowDuplicateValues"
                color="primary"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>

            <!-- Allow Gaps checkbox for Sequence only -->
            <v-col v-if="newCategory.type === 'Sequence'" cols="12">
              <v-checkbox
                v-model="newCategory.allowGaps"
                label="Allow gaps in sequence"
                :error-messages="newCategoryErrors.allowGaps"
                color="primary"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-btn variant="outlined" :to="{ name: 'CategoryMigrationTool' }" class="mr-3">
          <v-icon start>mdi-arrow-left</v-icon>
          Back
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="elevated"
          :loading="creating"
          :disabled="
            newCategory.name.trim().length < 3 ||
            !newCategory.type ||
            hasAnyConflict ||
            (newCategory.type === 'Currency' && !newCategory.defaultCurrency) ||
            (newCategory.type === 'Sequence' && !newCategory.defaultSequenceFormat) ||
            !isRegexValid ||
            (['Text Area', 'Sequence', 'Regex'].includes(newCategory.type) &&
              typeof newCategory.allowDuplicateValues !== 'boolean') ||
            (newCategory.type === 'Sequence' && typeof newCategory.allowGaps !== 'boolean')
          "
          @click="createCategory"
        >
          <v-icon start>mdi-plus</v-icon>
          Create System Category
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoryManager } from '../../features/documents/composables/useCategoryManager.js';
import { getAutomaticTagColor } from '../../features/documents/utils/automaticTagColors.js';
import { categoryTypeOptions } from '../../features/documents/utils/categoryTypes.js';
import { currencyOptions } from '../../features/documents/utils/currencyOptions.js';
import { sequenceFormatOptions } from '../../features/documents/utils/categoryFormOptions.js';
import {
  generateRegexExamples,
  capitalizeFirstLetter,
  isRegexDefinitionValid,
} from '../../features/documents/utils/categoryFormHelpers.js';
import {
  checkForDuplicateSystemCategory,
  getCategoryConflictErrors,
} from '../../features/documents/utils/categoryIdGenerator.js';
import TagOptionsManager from '../../features/documents/components/TagOptionsManager.vue';

const router = useRouter();
const categoryManager = useCategoryManager();

const creating = ref(false);
const newCategory = ref({
  name: '',
  type: 'Fixed List',
  defaultCurrency: 'CAD',
  defaultSequenceFormat: '1, 2, 3, ...',
  regexDefinition: '.*',
  allowDuplicateValues: false,
  allowGaps: false,
});
const newCategoryErrors = ref({
  name: [],
  type: [],
  defaultCurrency: [],
  defaultSequenceFormat: [],
  regexDefinition: [],
  allowDuplicateValues: [],
  allowGaps: [],
});

// State for duplicate checking
const systemCategoriesForValidation = ref([]);

// Computed property to check for duplicate names/IDs
const duplicateCheck = computed(() => {
  if (!newCategory.value.name.trim()) {
    return { nameConflict: false, idConflict: false, conflictingCategory: null, generatedId: '' };
  }
  return checkForDuplicateSystemCategory(
    newCategory.value.name,
    systemCategoriesForValidation.value,
    null
  );
});

// Computed properties for conflict detection
const hasNameConflict = computed(() => duplicateCheck.value.nameConflict);
const hasIdConflict = computed(() => duplicateCheck.value.idConflict);
const hasAnyConflict = computed(() => hasNameConflict.value || hasIdConflict.value);

// Computed property to auto-generate regex examples
const autoGeneratedExamples = computed(() => {
  if (newCategory.value.type !== 'Regex') {
    return [];
  }
  return generateRegexExamples(newCategory.value.regexDefinition);
});

const snackbar = ref({ show: false, message: '', color: 'success' });

const previewColor = computed(() => {
  // Use a default color for system categories
  return getAutomaticTagColor(0);
});

// Computed property to check if regex is valid
const isRegexValid = computed(() => {
  // If not a Regex type, always valid
  if (newCategory.value.type !== 'Regex') {
    return true;
  }
  // Check if regex is valid based on generated examples
  return isRegexDefinitionValid(newCategory.value.regexDefinition, autoGeneratedExamples.value);
});

// Computed property for real-time name validation error messages
const nameErrorMessages = computed(() => {
  const name = newCategory.value.name.trim();
  const errors = [];

  // Don't show errors for empty field
  if (!name) return errors;

  // Check length
  if (name.length > 50) {
    errors.push('Category name must be 50 characters or less');
  }

  // Check for duplicates
  const conflictErrors = getCategoryConflictErrors(duplicateCheck.value);
  errors.push(...conflictErrors);

  return errors;
});

const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

const capitalizeFirstLetters = (event) => {
  newCategory.value.name = capitalizeFirstLetter(event.target.value);
};

const validateNewCategory = async () => {
  const nameErrors = [];
  const typeErrors = [];
  const defaultCurrencyErrors = [];
  const defaultSequenceFormatErrors = [];
  const allowDuplicateValuesErrors = [];
  const allowGapsErrors = [];
  const regexDefinitionErrors = [];
  const name = newCategory.value.name.trim();
  const type = newCategory.value.type;
  const defaultCurrency = newCategory.value.defaultCurrency;
  const defaultSequenceFormat = newCategory.value.defaultSequenceFormat;
  const regexDefinition = newCategory.value.regexDefinition;
  const allowDuplicateValues = newCategory.value.allowDuplicateValues;
  const allowGaps = newCategory.value.allowGaps;

  // Load system categories to check for duplicates
  const systemCategories = await categoryManager.loadsystemcategories();
  systemCategoriesForValidation.value = systemCategories;

  // Validate name - check for both name and ID conflicts
  if (!name) {
    nameErrors.push('Category name is required');
  } else if (name.length > 50) {
    nameErrors.push('Category name must be 50 characters or less');
  } else {
    // Use the shared validation utility to check for conflicts
    const conflictErrors = getCategoryConflictErrors(duplicateCheck.value);
    nameErrors.push(...conflictErrors);
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

  // Validate allow duplicate values for applicable types
  if (['Text Area', 'Sequence', 'Regex'].includes(type)) {
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

  newCategoryErrors.value.name = nameErrors;
  newCategoryErrors.value.type = typeErrors;
  newCategoryErrors.value.defaultCurrency = defaultCurrencyErrors;
  newCategoryErrors.value.defaultSequenceFormat = defaultSequenceFormatErrors;
  newCategoryErrors.value.regexDefinition = regexDefinitionErrors;
  newCategoryErrors.value.allowDuplicateValues = allowDuplicateValuesErrors;
  newCategoryErrors.value.allowGaps = allowGapsErrors;

  return (
    nameErrors.length === 0 &&
    typeErrors.length === 0 &&
    defaultCurrencyErrors.length === 0 &&
    defaultSequenceFormatErrors.length === 0 &&
    regexDefinitionErrors.length === 0 &&
    allowDuplicateValuesErrors.length === 0 &&
    allowGapsErrors.length === 0
  );
};

const createCategory = async () => {
  if (!(await validateNewCategory())) return;

  creating.value = true;
  try {
    const name = newCategory.value.name.trim();
    const type = newCategory.value.type;
    const categoryData = {
      name,
      type,
      color: previewColor.value,
      tags: [],
    };

    // Add currency-specific data if Currency type is selected
    if (type === 'Currency') {
      categoryData.defaultCurrency = newCategory.value.defaultCurrency;
    }

    // Add sequence-specific data if Sequence type is selected
    if (type === 'Sequence') {
      categoryData.defaultSequenceFormat = newCategory.value.defaultSequenceFormat;
      categoryData.allowGaps = newCategory.value.allowGaps;
    }

    // Add regex-specific data if Regex type is selected
    if (type === 'Regex') {
      categoryData.regexDefinition = newCategory.value.regexDefinition.trim();
      // Store Examples as a comma-separated string
      categoryData.regexExamples = autoGeneratedExamples.value.join(', ');
    }

    // Add allow duplicate values data if applicable type is selected
    if (['Text Area', 'Sequence', 'Regex'].includes(type)) {
      categoryData.allowDuplicateValues = newCategory.value.allowDuplicateValues;
    }

    // Use createSystemCategory method to create in system collection
    await categoryManager.createSystemCategory(categoryData);

    showNotification(`System category "${name}" created successfully`, 'success');

    // Navigate back to category viewer after a brief delay
    setTimeout(() => {
      router.push({ name: 'CategoryMigrationTool' });
    }, 1500);
  } catch (error) {
    showNotification('Failed to create system category: ' + error.message, 'error');
    creating.value = false;
  }
};

// Load system categories on mount for real-time validation
onMounted(async () => {
  try {
    const systemCategories = await categoryManager.loadsystemcategories();
    systemCategoriesForValidation.value = systemCategories;
  } catch (error) {
    console.error('[NewSystemCategory] Failed to load system categories for validation:', error);
  }
});
</script>

<style scoped>
.category-creation-wizard {
  width: 800px;
  max-width: 95vw;
  margin: 0 auto;
  padding: 24px;
}
</style>
