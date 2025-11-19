<template>
  <div class="category-edit-wizard">
    <v-card variant="flat" class="mx-auto">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-pencil</v-icon>
        Edit Category
        <v-spacer />
        <v-chip v-if="isSystemCategoryComputed" size="default" color="primary" variant="outlined">
          System Category
        </v-chip>
        <HoldToConfirmButton
          v-else-if="category"
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
          <v-btn :to="{ name: 'category-manager', params: { matterId: route.params.matterId } }" class="mt-4">Back to Categories</v-btn>
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

            <!-- Boolean-specific child controls -->
            <v-col v-if="editedCategory.type === 'Boolean'" cols="12">
              <v-select
                v-model="editedCategory.defaultBooleanFormat"
                label="Boolean Format"
                variant="outlined"
                density="comfortable"
                :error-messages="categoryErrors.defaultBooleanFormat"
                :items="booleanFormatOptions"
                item-title="title"
                item-value="value"
                placeholder="Select boolean format"
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

            <!-- Allow Duplicate Values checkbox for Text, Text Area, Sequence, and Regex -->
            <v-col
              v-if="['Text', 'Text Area', 'Sequence', 'Regex'].includes(editedCategory.type)"
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
        <v-btn variant="outlined" :to="{ name: 'category-manager', params: { matterId: route.params.matterId } }">
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
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCategoryEditForm } from '../composables/useCategoryEditForm.js';
import { useCategoryTypeConversion } from '../composables/useCategoryTypeConversion.js';
import { useCategoryEditActions } from '../composables/useCategoryEditActions.js';
import { useCategoryFormHelpers } from '../composables/useCategoryFormHelpers.js';
import { currencyOptions } from '../utils/currencyOptions.js';
import { sequenceFormatOptions, booleanFormatOptions } from '../utils/categoryFormOptions.js';
import TagOptionsManager from '../components/TagOptionsManager.vue';
import HoldToConfirmButton from '@/shared/components/base/HoldToConfirmButton.vue';

const route = useRoute();

// Extract source from route query
const categorySource = ref(route.query.source || 'firm'); // Default to 'firm' if no source provided

// Shared state refs
const category = ref(null);
const originalType = ref(null);

// Initialize form composable (creates editedCategory ref)
const {
  editedCategory,
  categoryErrors,
  hasChanges,
  isFormValid,
  capitalizeFirstLetters,
  validateCategory,
} = useCategoryEditForm({
  category,
});

// Initialize form helpers (provides isRegexValid and autoGeneratedExamples)
const {
  autoGeneratedExamples,
  isRegexValid,
  isSystemCategoryComputed,
} = useCategoryFormHelpers({
  categorySource,
  editedCategory,
});

// Initialize type conversion composable
const {
  showWarningDialog,
  conversionWarningMessage,
  allowedTypeOptions,
  handleTypeChange,
  confirmTypeChange,
  cancelTypeChange,
} = useCategoryTypeConversion({
  editedCategory,
  originalType,
});

// Initialize actions composable
const {
  loading,
  saving,
  snackbar,
  loadCategory,
  saveCategory,
  deleteCategory,
} = useCategoryEditActions({
  categorySource,
  category,
  editedCategory,
  originalType,
  autoGeneratedExamples,
  validateCategory,
});

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
