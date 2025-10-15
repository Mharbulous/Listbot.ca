<template>
  <div class="category-edit-wizard">
    <v-card variant="flat" class="mx-auto">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-pencil</v-icon>
        Edit Category
        <v-spacer />
        <HoldToConfirmButton
          v-if="category"
          :duration="2000"
          text="DELETE"
          confirming-text="Deleting..."
          icon="mdi-delete"
          color="error"
          variant="outlined"
          @confirmed="deleteCategory"
        />
      </v-card-title>

      <v-card-text class="pt-6">
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate />
          <p class="mt-2">Loading category...</p>
        </div>

        <div v-else-if="!category" class="text-center py-6">
          <v-icon size="64" color="error">mdi-alert-circle</v-icon>
          <p class="text-h6 mt-2">Category not found</p>
          <v-btn :to="{ name: 'category-manager' }" class="mt-4">Back to Categories</v-btn>
        </div>

        <v-form v-else @submit.prevent="saveCategory">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="editedCategory.name"
                label="Category Name"
                variant="outlined"
                density="comfortable"
                :error-messages="categoryErrors.name"
                placeholder="e.g., Project Code, Invoices, Tax Documents"
                autofocus
                @input="capitalizeFirstLetters"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="editedCategory.type"
                label="Category Type"
                variant="outlined"
                density="comfortable"
                :error-messages="categoryErrors.type"
                :items="allowedTypeOptions"
                item-title="title"
                item-value="value"
                placeholder="Select category type"
                @update:model-value="handleTypeChange"
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
            <v-col v-if="editedCategory.type === 'Currency'" cols="12">
              <v-select
                v-model="editedCategory.defaultCurrency"
                label="Default Currency"
                variant="outlined"
                density="comfortable"
                :error-messages="categoryErrors.defaultCurrency"
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
            <v-col v-if="editedCategory.type === 'Sequence'" cols="12">
              <v-select
                v-model="editedCategory.defaultSequenceFormat"
                label="Sequence Format"
                variant="outlined"
                density="comfortable"
                :error-messages="categoryErrors.defaultSequenceFormat"
                :items="sequenceFormatOptions"
                item-title="title"
                item-value="value"
                placeholder="Select sequence format"
              />
            </v-col>

            <!-- Fixed List and Open List tag options -->
            <v-col v-if="['Fixed List', 'Open List'].includes(editedCategory.type)" cols="12">
              <TagOptionsManager
                v-model="editedCategory.tags"
                placeholder="Add tag option"
                :max-length="32"
              />
            </v-col>

            <!-- Regex-specific child controls -->
            <v-col v-if="editedCategory.type === 'Regex'" cols="12" class="pb-0">
              <v-textarea
                v-model="editedCategory.regexDefinition"
                label="Regex Definition"
                variant="outlined"
                density="comfortable"
                :error-messages="categoryErrors.regexDefinition"
                placeholder="e.g., ^[A-Z]{2}-\d{4}$"
                auto-grow
                rows="2"
              />
            </v-col>

            <v-col v-if="editedCategory.type === 'Regex'" cols="12" class="pt-0 mt-0">
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
            <v-col
              v-if="['Text Area', 'Sequence', 'Regex'].includes(editedCategory.type)"
              cols="12"
            >
              <v-checkbox
                v-model="editedCategory.allowDuplicateValues"
                label="Allow duplicate values"
                :error-messages="categoryErrors.allowDuplicateValues"
                color="primary"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>

            <!-- Allow Gaps checkbox for Sequence only -->
            <v-col v-if="editedCategory.type === 'Sequence'" cols="12">
              <v-checkbox
                v-model="editedCategory.allowGaps"
                label="Allow gaps in sequence"
                :error-messages="categoryErrors.allowGaps"
                color="primary"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions v-if="category" class="px-6 pb-6">
        <v-btn variant="outlined" :to="{ name: 'category-manager' }">
          <v-icon start>mdi-arrow-left</v-icon>
          Discard Changes
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="elevated"
          :loading="saving"
          :disabled="!isFormValid || !hasChanges"
          @click="saveCategory"
        >
          <v-icon start>mdi-content-save</v-icon>
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Type Conversion Warning Dialog -->
    <v-dialog v-model="showWarningDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Confirm Type Conversion
        </v-card-title>
        <v-card-text>
          <p>{{ conversionWarningMessage }}</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="cancelTypeChange">Cancel</v-btn>
          <v-btn color="warning" variant="elevated" @click="confirmTypeChange"> Continue </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { useOrganizerStore } from '../stores/organizer.js';
import { categoryTypeOptions } from '../utils/categoryTypes.js';
import { currencyOptions } from '../utils/currencyOptions.js';
import {
  sequenceFormatOptions,
} from '../utils/categoryFormOptions.js';
import {
  generateRegexExamples,
  capitalizeFirstLetter,
  isRegexDefinitionValid,
} from '../utils/categoryFormHelpers.js';
import {
  getAllowedTypeConversions,
  requiresWarning,
  getConversionWarningMessage,
} from '../utils/categoryTypeConversions.js';
import TagOptionsManager from '../components/TagOptionsManager.vue';
import HoldToConfirmButton from '../../../components/base/HoldToConfirmButton.vue';

const router = useRouter();
const route = useRoute();
const organizerStore = useOrganizerStore();
const { categories } = storeToRefs(organizerStore);

const loading = ref(true);
const saving = ref(false);
const category = ref(null);
const originalType = ref(null);
const pendingType = ref(null);
const showWarningDialog = ref(false);
const conversionWarningMessage = ref('');

const editedCategory = ref({
  name: '',
  type: '',
  tags: [],
  defaultCurrency: 'CAD',
  defaultSequenceFormat: '1, 2, 3, ...',
  regexDefinition: '.*',
  allowDuplicateValues: false,
  allowGaps: false,
});

const categoryErrors = ref({
  name: [],
  type: [],
  defaultCurrency: [],
  defaultSequenceFormat: [],
  regexDefinition: [],
  allowDuplicateValues: [],
  allowGaps: [],
});

const snackbar = ref({ show: false, message: '', color: 'success' });

// Computed property to get allowed type options based on current type
const allowedTypeOptions = computed(() => {
  if (!originalType.value) return categoryTypeOptions;

  const allowedTypes = getAllowedTypeConversions(originalType.value);
  return categoryTypeOptions.filter((option) => allowedTypes.includes(option.value));
});

// Computed property to auto-generate regex examples
const autoGeneratedExamples = computed(() => {
  if (editedCategory.value.type !== 'Regex') {
    return [];
  }
  return generateRegexExamples(editedCategory.value.regexDefinition);
});

// Computed property to check if regex is valid
const isRegexValid = computed(() => {
  // If not a Regex type, always valid
  if (editedCategory.value.type !== 'Regex') {
    return true;
  }
  // Check if regex is valid based on generated examples
  return isRegexDefinitionValid(editedCategory.value.regexDefinition, autoGeneratedExamples.value);
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

const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

const deleteCategory = async () => {
  try {
    const categoryName = category.value.name;
    await organizerStore.deleteCategory(category.value.id);
    showNotification(`Category "${categoryName}" deleted successfully`, 'success');
    setTimeout(() => {
      router.push({ name: 'category-manager' });
    }, 1500);
  } catch (error) {
    showNotification('Failed to delete category: ' + error.message, 'error');
  }
};

const capitalizeFirstLetters = (event) => {
  editedCategory.value.name = capitalizeFirstLetter(event.target.value);
};

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

const validateCategory = () => {
  const nameErrors = [];
  const typeErrors = [];
  const defaultCurrencyErrors = [];
  const defaultSequenceFormatErrors = [];
  const allowDuplicateValuesErrors = [];
  const allowGapsErrors = [];
  const regexDefinitionErrors = [];

  const name = editedCategory.value.name.trim();
  const type = editedCategory.value.type;
  const defaultCurrency = editedCategory.value.defaultCurrency;
  const defaultSequenceFormat = editedCategory.value.defaultSequenceFormat;
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

  categoryErrors.value.name = nameErrors;
  categoryErrors.value.type = typeErrors;
  categoryErrors.value.defaultCurrency = defaultCurrencyErrors;
  categoryErrors.value.defaultSequenceFormat = defaultSequenceFormatErrors;
  categoryErrors.value.regexDefinition = regexDefinitionErrors;
  categoryErrors.value.allowDuplicateValues = allowDuplicateValuesErrors;
  categoryErrors.value.allowGaps = allowGapsErrors;

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

const saveCategory = async () => {
  if (!validateCategory()) return;

  saving.value = true;
  try {
    const updates = {
      name: editedCategory.value.name.trim(),
      type: editedCategory.value.type,
    };

    // Add tags for Fixed List and Open List types
    if (['Fixed List', 'Open List'].includes(editedCategory.value.type)) {
      updates.tags = editedCategory.value.tags;
    }

    // Add type-specific fields
    if (editedCategory.value.type === 'Currency') {
      updates.defaultCurrency = editedCategory.value.defaultCurrency;
    }

    if (editedCategory.value.type === 'Sequence') {
      updates.defaultSequenceFormat = editedCategory.value.defaultSequenceFormat;
      updates.allowGaps = editedCategory.value.allowGaps;
    }

    if (editedCategory.value.type === 'Regex') {
      updates.regexDefinition = editedCategory.value.regexDefinition.trim();
      updates.regexExamples = autoGeneratedExamples.value.join(', ');
    }

    if (['Text Area', 'Sequence', 'Regex'].includes(editedCategory.value.type)) {
      updates.allowDuplicateValues = editedCategory.value.allowDuplicateValues;
    }

    await organizerStore.updateCategory(category.value.id, updates);

    showNotification(`Category "${updates.name}" updated successfully`, 'success');

    // Navigate back to category manager after a brief delay
    setTimeout(() => {
      router.push({ name: 'category-manager' });
    }, 1500);
  } catch (error) {
    showNotification('Failed to update category: ' + error.message, 'error');
    saving.value = false;
  }
};

const loadCategory = async () => {
  loading.value = true;
  try {
    const categoryId = route.params.id;

    // Ensure categories are loaded
    if (!organizerStore.isInitialized || !categories.value.length) {
      await organizerStore.initialize();
    }

    // Find the category
    const foundCategory = organizerStore.getCategoryById(categoryId);

    if (!foundCategory) {
      category.value = null;
      showNotification('Category not found', 'error');
      return;
    }

    category.value = foundCategory;
    originalType.value = foundCategory.type;

    // Populate editedCategory with existing values
    editedCategory.value = {
      name: foundCategory.name || '',
      type: foundCategory.type || 'Fixed List',
      tags: foundCategory.tags || [],
      defaultCurrency: foundCategory.defaultCurrency || 'CAD',
      defaultSequenceFormat: foundCategory.defaultSequenceFormat || '1, 2, 3, ...',
      regexDefinition: foundCategory.regexDefinition || '.*',
      allowDuplicateValues: foundCategory.allowDuplicateValues || false,
      allowGaps: foundCategory.allowGaps || false,
    };
  } catch (error) {
    showNotification('Failed to load category: ' + error.message, 'error');
    category.value = null;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadCategory();
});
</script>

<style scoped>
.category-edit-wizard {
  min-width: 50%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
</style>
