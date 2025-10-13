<template>
  <div class="category-manager">
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-folder-multiple</v-icon>
        Categories List ({{ sortedCategories.length }})
      </v-card-title>
      <v-card-text>
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate />
          <p class="mt-2">Loading categories...</p>
        </div>

        <div v-else-if="!sortedCategories.length" class="text-center py-6">
          <v-icon size="64" color="grey">mdi-folder-outline</v-icon>
          <p class="text-h6 mt-2">No categories yet</p>
        </div>

        <v-expansion-panels v-else v-model="expandedPanels" multiple>
          <v-expansion-panel
            v-for="(category, idx) in sortedCategories"
            :key="category.id"
            :value="category.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-icon :color="getCategoryIconColor(category)" class="mr-3">
                  {{ getCategoryIcon(category) }}
                </v-icon>
                <div>
                  <div class="font-weight-medium">{{ category.name }}</div>
                  <div
                    class="text-caption text-medium-emphasis"
                    v-html="getCategoryDisplayTextWithFormatting(category)"
                  ></div>
                </div>
              </div>
              <template #actions="{ expanded }">
                <v-btn icon variant="text" size="small" :color="expanded ? 'primary' : 'default'">
                  <v-icon>{{ expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
              </template>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Tags for Fixed List / Open List -->
              <div v-if="categoryTypeUsesTags(category)" class="mb-4">
                <div v-if="category.tags?.length" class="mb-2">
                  <v-chip
                    v-for="tag in category.tags"
                    :key="tag.id || tag.name"
                    :color="getColor(idx)"
                    size="small"
                    class="ma-1"
                  >
                    <v-icon start size="14">mdi-tag</v-icon>
                    {{ tag.name }}
                  </v-chip>
                </div>
                <p v-else class="text-body-2 text-medium-emphasis">No tag options defined yet.</p>
              </div>

              <!-- Properties for other category types -->
              <v-list
                v-if="getCategoryProperties(category).length > 0"
                density="compact"
                class="mb-3"
              >
                <v-list-item
                  v-for="(prop, propIdx) in getCategoryProperties(category)"
                  :key="propIdx"
                  :prepend-icon="prop.icon"
                  :class="{ 'monospace-value': prop.monospace }"
                >
                  <template v-if="prop.symbol" #prepend>
                    <span class="currency-symbol mr-3">{{ prop.symbol }}</span>
                  </template>
                  <v-list-item-title class="text-body-2">
                    <span v-if="prop.label" class="text-medium-emphasis">{{ prop.label }}:</span>
                    <span
                      :class="[
                        prop.color ? `text-${prop.color}` : '',
                        prop.label ? 'ml-2' : '',
                        'font-weight-medium',
                      ]"
                    >
                      {{ prop.value }}
                    </span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>

              <!-- Regex Examples as Chips -->
              <div
                v-if="category.type === 'Regex' && getRegexExamples(category).length > 0"
                class="mb-4"
              >
                <div class="text-subtitle-2 mb-2" style="color: rgba(0, 0, 0, 0.87)">Examples</div>
                <div>
                  <v-chip
                    v-for="(example, exampleIdx) in getRegexExamples(category)"
                    :key="exampleIdx"
                    class="ma-1"
                    size="small"
                    variant="outlined"
                    color="primary"
                  >
                    {{ example }}
                  </v-chip>
                </div>
              </div>

              <div class="border-t pt-4 d-flex justify-space-between">
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  @click="editCategory(category)"
                >
                  <v-icon start>mdi-pencil</v-icon>
                  Edit
                </v-btn>
                <v-btn
                  color="error"
                  variant="outlined"
                  size="small"
                  @click="deleteCategory(category)"
                >
                  <v-icon start>mdi-delete</v-icon>
                  Delete
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <div class="text-center mt-6">
          <v-btn
            color="primary"
            :to="{ name: 'category-creation-wizard' }"
            variant="elevated"
            size="large"
          >
            <v-icon start>mdi-plus</v-icon>
            Create New Category
          </v-btn>
        </div>
      </v-card-text>
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
import { getCategoryTypeInfo, getCategoryTypeLabel } from '../utils/categoryTypes.js';
import { getCurrencyTitle, getCurrencySymbol } from '../utils/currencyOptions.js';

const router = useRouter();
const organizerStore = useOrganizerStore();
const { categories, loading } = storeToRefs(organizerStore);

const expandedPanels = ref([]);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Computed property to sort categories alphabetically
const sortedCategories = computed(() => {
  return [...categories.value].sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
});

const getColor = (index) => getAutomaticTagColor(index);

const getCategoryIcon = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.icon : 'mdi-folder';
};

const getCategoryIconColor = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.color : 'grey';
};

const getCategoryTypeText = (category) => {
  return getCategoryTypeLabel(category.type);
};

const getCategoryDisplayText = (category) => {
  const baseType = getCategoryTypeLabel(category.type);

  switch (category.type) {
    case 'Currency':
      if (category.defaultCurrency) {
        const symbol = getCurrencySymbol(category.defaultCurrency);
        const code = category.defaultCurrency;
        return `${baseType}, ${symbol} ${code}`;
      }
      break;

    case 'Regex': {
      const parts = [];
      if (category.allowDuplicateValues !== undefined) {
        const duplicateStatus = category.allowDuplicateValues ? 'duplicates allowed' : 'unique values';
        parts.push(duplicateStatus);
      }
      if (category.regexDefinition) {
        parts.push(`pattern: ${category.regexDefinition}`);
      }
      if (parts.length > 0) {
        return `${baseType}, ${parts.join(', ')}`;
      }
      break;
    }

    case 'Fixed List':
    case 'Open List': {
      const tagCount = category.tags?.length || 0;
      const tagWord = tagCount === 1 ? 'tag option' : 'tag options';
      return `${baseType}, ${tagCount} ${tagWord}`;
    }

    case 'Date':
      if (category.defaultDateFormat) {
        return `${baseType}, ${category.defaultDateFormat}`;
      }
      break;

    case 'Timestamp': {
      const parts = [];
      if (category.defaultDateFormat) {
        parts.push(category.defaultDateFormat);
      }
      if (category.defaultTimeFormat) {
        parts.push(category.defaultTimeFormat);
      }
      if (parts.length > 0) {
        return `${baseType}, ${parts.join(' ')}`;
      }
      break;
    }

    case 'Sequence': {
      const parts = [];
      if (category.allowGaps !== undefined) {
        const gapsStatus = category.allowGaps ? 'gaps allowed' : 'no gaps';
        parts.push(gapsStatus);
      }
      if (category.defaultSequenceFormat) {
        parts.push(category.defaultSequenceFormat);
      }
      if (parts.length > 0) {
        return `${baseType}, ${parts.join(', ')}`;
      }
      break;
    }
  }

  return baseType;
};

const getCategoryDisplayTextWithFormatting = (category) => {
  const baseType = getCategoryTypeLabel(category.type);

  if (category.type === 'Regex') {
    const parts = [];
    if (category.allowDuplicateValues !== undefined) {
      const duplicateStatus = category.allowDuplicateValues ? 'duplicates allowed' : 'unique values';
      parts.push(duplicateStatus);
    }
    if (category.regexDefinition) {
      // Escape HTML in regex pattern to prevent XSS
      const escapedPattern = category.regexDefinition
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      parts.push(`pattern: <em>${escapedPattern}</em>`);
    }
    if (parts.length > 0) {
      return `${baseType}, ${parts.join(', ')}`;
    }
    return baseType;
  }

  return getCategoryDisplayText(category);
};

const categoryTypeUsesTags = (category) => {
  return category.type === 'Fixed List' || category.type === 'Open List';
};

const getRegexExamples = (category) => {
  if (category.type !== 'Regex' || !category.regexExamples) {
    return [];
  }
  return category.regexExamples
    .split(',')
    .map((ex) => ex.trim())
    .filter((ex) => ex.length > 0);
};

// Helper functions to get category-specific properties for display
const getCategoryProperties = (category) => {
  const properties = [];

  switch (category.type) {
    case 'Currency':
      if (category.defaultCurrency) {
        properties.push({
          symbol: getCurrencySymbol(category.defaultCurrency),
          label: '',
          value: getCurrencyTitle(category.defaultCurrency),
        });
      }
      break;

    case 'Date':
      if (category.defaultDateFormat) {
        properties.push({
          icon: 'mdi-calendar',
          label: 'Date Format',
          value: category.defaultDateFormat,
        });
      }
      break;

    case 'Timestamp':
      if (category.defaultDateFormat) {
        properties.push({
          icon: 'mdi-calendar',
          label: 'Date Format',
          value: category.defaultDateFormat,
        });
      }
      if (category.defaultTimeFormat) {
        properties.push({
          icon: 'mdi-clock-outline',
          label: 'Time Format',
          value: category.defaultTimeFormat,
        });
      }
      break;

    case 'Sequence':
      if (category.defaultSequenceFormat) {
        properties.push({
          icon: 'mdi-numeric',
          label: 'Sequence Format',
          value: category.defaultSequenceFormat,
        });
      }
      properties.push({
        icon: category.allowGaps ? 'mdi-check-circle' : 'mdi-close-circle',
        label: 'Gaps',
        value: category.allowGaps ? 'Allowed' : 'Not Allowed',
        color: category.allowGaps ? 'success' : 'error',
      });
      properties.push({
        icon: category.allowDuplicateValues ? 'mdi-check-circle' : 'mdi-close-circle',
        label: 'Duplicates',
        value: category.allowDuplicateValues ? 'Allowed' : 'Not Allowed',
        color: category.allowDuplicateValues ? 'success' : 'error',
      });
      break;

    case 'Regex':
      if (category.regexDefinition) {
        properties.push({
          icon: 'mdi-regex',
          label: 'Pattern',
          value: category.regexDefinition,
          monospace: true,
        });
      }
      // Note: regexExamples are displayed as chips, not in properties list
      properties.push({
        icon: category.allowDuplicateValues ? 'mdi-check-circle' : 'mdi-close-circle',
        label: 'Duplicates',
        value: category.allowDuplicateValues ? 'Allowed' : 'Not Allowed',
        color: category.allowDuplicateValues ? 'success' : 'error',
      });
      break;

    case 'TextArea':
      properties.push({
        icon: 'mdi-text-box-outline',
        label: 'Type',
        value: 'Multi-line text input',
      });
      break;
  }

  return properties;
};

const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

const editCategory = (category) => {
  router.push({ name: 'category-edit', params: { id: category.id } });
};

const deleteCategory = async (category) => {
  if (!confirm(`Are you sure you want to delete the "${category.name}" category?`)) return;

  try {
    await organizerStore.deleteCategory(category.id);
    showNotification(`Category "${category.name}" deleted successfully`, 'success');
  } catch (error) {
    showNotification('Failed to delete category: ' + error.message, 'error');
  }
};

onMounted(async () => {
  if (!organizerStore.isInitialized || !categories.value.length) {
    console.log('[CategoryManager] Initializing organizer store for categories...');
    await organizerStore.initialize();
  }
  if (sortedCategories.value.length > 0) {
    expandedPanels.value = [sortedCategories.value[0].id];
  }
});
</script>

<style scoped>
.category-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.border-t {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.monospace-value span:last-child {
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}
.currency-symbol {
  font-size: 1.2em;
  font-weight: bold;
  min-width: 24px;
  display: inline-block;
  text-align: center;
}
</style>
<!-- Streamlined from 312 lines to 188 lines on 2025-09-12 -->
