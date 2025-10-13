<template>
  <div class="category-creation-wizard">
    <v-card variant="flat" class="mx-auto" style="max-width: 800px">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-plus-circle</v-icon>
        New Category
        <v-spacer />
        <v-btn variant="text" icon :to="{ name: 'category-manager' }" color="default">
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
                :error-messages="newCategoryErrors.name"
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

            <!-- Date and Time Format Controls -->
            <!-- For Date category: Full width Date Format -->
            <v-col v-if="newCategory.type === 'Date'" cols="12">
              <v-select
                v-model="newCategory.defaultDateFormat"
                label="Date Format"
                variant="outlined"
                density="comfortable"
                :error-messages="newCategoryErrors.defaultDateFormat"
                :items="dateFormatOptions"
                item-title="title"
                item-value="value"
                placeholder="Select date format"
              >
                <template #selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon color="orange" size="20" class="mr-2">mdi-calendar</v-icon>
                    <span class="font-weight-medium mr-2">{{ item.raw.title }}</span>
                    <span class="text-caption text-medium-emphasis">({{ item.raw.example }})</span>
                  </div>
                </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.raw.title">
                    <template #prepend>
                      <v-icon color="orange" size="20"> mdi-calendar </v-icon>
                    </template>
                    <template #append>
                      <span class="text-caption text-medium-emphasis">
                        {{ item.raw.example }}
                      </span>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>

            <!-- For Timestamp category: Side-by-side Date and Time Formats -->
            <template v-if="newCategory.type === 'Timestamp'">
              <v-col cols="12" sm="6">
                <v-select
                  v-model="newCategory.defaultDateFormat"
                  label="Date Format"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="newCategoryErrors.defaultDateFormat"
                  :items="dateFormatOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select date format"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="orange" size="20" class="mr-2">mdi-calendar</v-icon>
                      <span class="font-weight-medium mr-2">{{ item.raw.title }}</span>
                      <span class="text-caption text-medium-emphasis"
                        >({{ item.raw.example }})</span
                      >
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title">
                      <template #prepend>
                        <v-icon color="orange" size="20"> mdi-calendar </v-icon>
                      </template>
                      <template #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ item.raw.example }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="newCategory.defaultTimeFormat"
                  label="Time Format"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="newCategoryErrors.defaultTimeFormat"
                  :items="timeFormatOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select time format"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="#7b1fa2" size="20" class="mr-2">mdi-clock-outline</v-icon>
                      <span class="font-weight-medium mr-2">{{ item.raw.title }}</span>
                      <span class="text-caption text-medium-emphasis"
                        >({{ item.raw.example }})</span
                      >
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title">
                      <template #prepend>
                        <v-icon color="#7b1fa2" size="20"> mdi-clock-outline </v-icon>
                      </template>
                      <template #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ item.raw.example }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </v-col>
            </template>

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
        <v-btn variant="outlined" :to="{ name: 'category-manager' }" class="mr-3">
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
            (newCategory.type === 'Currency' && !newCategory.defaultCurrency) ||
            ((newCategory.type === 'Date' || newCategory.type === 'Timestamp') &&
              !newCategory.defaultDateFormat) ||
            (newCategory.type === 'Timestamp' && !newCategory.defaultTimeFormat) ||
            (newCategory.type === 'Sequence' && !newCategory.defaultSequenceFormat) ||
            !isRegexValid ||
            (['Text Area', 'Sequence', 'Regex'].includes(newCategory.type) &&
              typeof newCategory.allowDuplicateValues !== 'boolean') ||
            (newCategory.type === 'Sequence' && typeof newCategory.allowGaps !== 'boolean')
          "
          @click="createCategory"
        >
          <v-icon start>mdi-plus</v-icon>
          Create Category
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
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useOrganizerStore } from '../stores/organizer.js';
import { getAutomaticTagColor } from '../utils/automaticTagColors.js';
import { categoryTypeOptions } from '../utils/categoryTypes.js';
import { currencyOptions } from '../utils/currencyOptions.js';
import { dateFormatOptions, timeFormatOptions, sequenceFormatOptions } from '../utils/categoryFormOptions.js';
import { generateRegexExamples, capitalizeFirstLetter, isRegexDefinitionValid } from '../utils/categoryFormHelpers.js';

const router = useRouter();
const organizerStore = useOrganizerStore();
const { categories } = storeToRefs(organizerStore);

const creating = ref(false);
const newCategory = ref({
  name: '',
  type: 'Fixed List',
  defaultCurrency: 'CAD',
  defaultDateFormat: 'YYYY-MM-DD',
  defaultTimeFormat: 'HH:mm',
  defaultSequenceFormat: '1, 2, 3, ...',
  regexDefinition: '.*',
  allowDuplicateValues: false,
  allowGaps: false,
});
const newCategoryErrors = ref({
  name: [],
  type: [],
  defaultCurrency: [],
  defaultDateFormat: [],
  defaultTimeFormat: [],
  defaultSequenceFormat: [],
  regexDefinition: [],
  allowDuplicateValues: [],
  allowGaps: [],
});

// Computed property to auto-generate regex examples
const autoGeneratedExamples = computed(() => {
  if (newCategory.value.type !== 'Regex') {
    return [];
  }
  return generateRegexExamples(newCategory.value.regexDefinition);
});

const snackbar = ref({ show: false, message: '', color: 'success' });

const previewColor = computed(() => {
  return getAutomaticTagColor(categories.value.length);
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

const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

const capitalizeFirstLetters = (event) => {
  newCategory.value.name = capitalizeFirstLetter(event.target.value);
};

const validateNewCategory = () => {
  const nameErrors = [];
  const typeErrors = [];
  const defaultCurrencyErrors = [];
  const defaultDateFormatErrors = [];
  const defaultTimeFormatErrors = [];
  const defaultSequenceFormatErrors = [];
  const allowDuplicateValuesErrors = [];
  const allowGapsErrors = [];
  const regexDefinitionErrors = [];
  const name = newCategory.value.name.trim();
  const type = newCategory.value.type;
  const defaultCurrency = newCategory.value.defaultCurrency;
  const defaultDateFormat = newCategory.value.defaultDateFormat;
  const defaultTimeFormat = newCategory.value.defaultTimeFormat;
  const defaultSequenceFormat = newCategory.value.defaultSequenceFormat;
  const regexDefinition = newCategory.value.regexDefinition;
  const allowDuplicateValues = newCategory.value.allowDuplicateValues;
  const allowGaps = newCategory.value.allowGaps;

  // Validate name
  if (!name) {
    nameErrors.push('Category name is required');
  } else if (name.length > 50) {
    nameErrors.push('Category name must be 50 characters or less');
  } else if (categories.value.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
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

  // Validate date-specific fields (for Date and Timestamp)
  if (type === 'Date' || type === 'Timestamp') {
    if (!defaultDateFormat) {
      defaultDateFormatErrors.push('Date format is required for Date and Timestamp categories');
    } else if (!dateFormatOptions.find((option) => option.value === defaultDateFormat)) {
      defaultDateFormatErrors.push('Please select a valid date format');
    }
  }

  // Validate time-specific fields (for Timestamp only)
  if (type === 'Timestamp') {
    if (!defaultTimeFormat) {
      defaultTimeFormatErrors.push('Time format is required for Timestamp categories');
    } else if (!timeFormatOptions.find((option) => option.value === defaultTimeFormat)) {
      defaultTimeFormatErrors.push('Please select a valid time format');
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
  newCategoryErrors.value.defaultDateFormat = defaultDateFormatErrors;
  newCategoryErrors.value.defaultTimeFormat = defaultTimeFormatErrors;
  newCategoryErrors.value.defaultSequenceFormat = defaultSequenceFormatErrors;
  newCategoryErrors.value.regexDefinition = regexDefinitionErrors;
  newCategoryErrors.value.allowDuplicateValues = allowDuplicateValuesErrors;
  newCategoryErrors.value.allowGaps = allowGapsErrors;

  return (
    nameErrors.length === 0 &&
    typeErrors.length === 0 &&
    defaultCurrencyErrors.length === 0 &&
    defaultDateFormatErrors.length === 0 &&
    defaultTimeFormatErrors.length === 0 &&
    defaultSequenceFormatErrors.length === 0 &&
    regexDefinitionErrors.length === 0 &&
    allowDuplicateValuesErrors.length === 0 &&
    allowGapsErrors.length === 0
  );
};

const createCategory = async () => {
  if (!validateNewCategory()) return;

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

    // Add date-specific data if Date or Timestamp type is selected
    if (type === 'Date' || type === 'Timestamp') {
      categoryData.defaultDateFormat = newCategory.value.defaultDateFormat;
    }

    // Add time-specific data if Timestamp type is selected
    if (type === 'Timestamp') {
      categoryData.defaultTimeFormat = newCategory.value.defaultTimeFormat;
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

    await organizerStore.createCategory(categoryData);

    showNotification(`Category "${name}" created successfully`, 'success');

    // Navigate back to category manager after a brief delay
    setTimeout(() => {
      router.push({ name: 'category-manager' });
    }, 1500);
  } catch (error) {
    showNotification('Failed to create category: ' + error.message, 'error');
    creating.value = false;
  }
};

onMounted(async () => {
  if (!organizerStore.isInitialized || !categories.value.length) {
    console.log('[CategoryCreationWizard] Initializing organizer store...');
    await organizerStore.initialize();
  }
});
</script>

<style scoped>
.category-creation-wizard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
</style>
