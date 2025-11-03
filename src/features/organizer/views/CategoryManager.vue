<template>
  <div class="category-manager">
    <v-card variant="flat">
      <v-tabs v-model="activeTab" class="px-4">
        <v-tab value="system">
          <v-icon start>mdi-shield-star</v-icon>
          System
          <v-chip size="small" color="blue" class="ml-2">{{ systemcategories.length }}</v-chip>
        </v-tab>
        <v-tab value="firm">
          <v-icon start>mdi-office-building</v-icon>
          Firm
          <v-chip size="small" color="green" class="ml-2">{{ firmCategories.length }}</v-chip>
        </v-tab>
        <v-tab value="matter">
          <v-icon start>mdi-folder</v-icon>
          Matter
          <v-chip size="small" color="orange" class="ml-2">{{ matterCategories.length }}</v-chip>
        </v-tab>

        <v-spacer />

        <v-btn
          color="primary"
          :disabled="!canCreateCategory"
          :to="{ name: 'category-creation-wizard', params: { matterId }, query: { scope: activeTab } }"
          variant="elevated"
          class="align-self-center"
        >
          <v-icon start>mdi-plus</v-icon>
          New Category
        </v-btn>
      </v-tabs>

      <v-card-text>
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary" size="64" />
          <p class="mt-4 text-h6">Loading categories...</p>
        </div>

        <div v-else>
          <v-window v-model="activeTab">
            <!-- System Categories -->
            <v-window-item value="system">
              <div v-if="sortedSystemCategories.length === 0" class="text-center py-8 text-grey">
                <v-icon icon="mdi-package-variant" size="64" />
                <p class="mt-2 text-h6">No system categories</p>
              </div>
              <v-list v-else>
                <v-list-item
                  v-for="category in sortedSystemCategories"
                  :key="category.id"
                  class="category-item"
                  @click="editCategory(category)"
                >
                  <template #prepend>
                    <v-icon :color="getCategoryIconColor(category)" class="mr-3">
                      {{ getCategoryIcon(category) }}
                    </v-icon>
                  </template>

                  <v-list-item-title>
                    <div class="d-flex align-center">
                      <span class="font-weight-medium">{{ category.name }}</span>
                      <v-chip size="x-small" color="blue" variant="outlined" class="ml-2">
                        System
                      </v-chip>
                    </div>
                    <div
                      class="text-caption text-medium-emphasis"
                      v-html="getCategoryDisplayTextWithFormatting(category)"
                    ></div>
                  </v-list-item-title>

                  <template #append>
                    <v-icon class="edit-icon" color="primary">mdi-pencil</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>

            <!-- Firm Categories -->
            <v-window-item value="firm">
              <div v-if="sortedFirmCategories.length === 0" class="text-center py-8 text-grey">
                <v-icon icon="mdi-package-variant" size="64" />
                <p class="mt-2 text-h6">No firm categories</p>
              </div>
              <v-list v-else>
                <v-list-item
                  v-for="category in sortedFirmCategories"
                  :key="category.id"
                  class="category-item"
                  @click="editCategory(category)"
                >
                  <template #prepend>
                    <v-icon :color="getCategoryIconColor(category)" class="mr-3">
                      {{ getCategoryIcon(category) }}
                    </v-icon>
                  </template>

                  <v-list-item-title>
                    <div class="d-flex align-center">
                      <span class="font-weight-medium">{{ category.name }}</span>
                      <v-chip size="x-small" color="green" variant="outlined" class="ml-2">
                        Firm
                      </v-chip>
                    </div>
                    <div
                      class="text-caption text-medium-emphasis"
                      v-html="getCategoryDisplayTextWithFormatting(category)"
                    ></div>
                  </v-list-item-title>

                  <template #append>
                    <v-icon class="edit-icon" color="primary">mdi-pencil</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>

            <!-- Matter Categories -->
            <v-window-item value="matter">
              <div v-if="sortedMatterCategories.length === 0" class="text-center py-8 text-grey">
                <v-icon icon="mdi-package-variant" size="64" />
                <p class="mt-2 text-h6">No matter categories</p>
              </div>
              <v-list v-else>
                <v-list-item
                  v-for="category in sortedMatterCategories"
                  :key="category.id"
                  class="category-item"
                  @click="editCategory(category)"
                >
                  <template #prepend>
                    <v-icon :color="getCategoryIconColor(category)" class="mr-3">
                      {{ getCategoryIcon(category) }}
                    </v-icon>
                  </template>

                  <v-list-item-title>
                    <div class="d-flex align-center">
                      <span class="font-weight-medium">{{ category.name }}</span>
                      <v-chip size="x-small" color="orange" variant="outlined" class="ml-2">
                        Matter
                      </v-chip>
                    </div>
                    <div
                      class="text-caption text-medium-emphasis"
                      v-html="getCategoryDisplayTextWithFormatting(category)"
                    ></div>
                  </v-list-item-title>

                  <template #append>
                    <v-icon class="edit-icon" color="primary">mdi-pencil</v-icon>
                  </template>
                </v-list-item>
              </v-list>
            </v-window-item>
          </v-window>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-btn variant="outlined" :to="{ name: 'documents' }">
          <v-icon start>mdi-arrow-left</v-icon>
          Back
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCategoryManager } from '../composables/useCategoryManager.js';
import { getCategoryTypeInfo, getCategoryTypeLabel } from '../utils/categoryTypes.js';
import { getCurrencySymbol } from '../utils/currencyOptions.js';

const router = useRouter();
const route = useRoute();

// Get matterId from route params
const matterId = computed(() => route.params.matterId);

const categoryManager = useCategoryManager(matterId.value);

const snackbar = ref({ show: false, message: '', color: 'success' });

// Use composable state
const {
  systemcategories,
  firmCategories,
  matterCategories,
  currentCategories,
  loading,
  activeTab,
  canCreateCategory,
  setActiveTab,
  loadAllCategories,
} = categoryManager;

// Computed properties to sort categories alphabetically for each tab
const sortedSystemCategories = computed(() => {
  return [...systemcategories.value].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
});

const sortedFirmCategories = computed(() => {
  return [...firmCategories.value].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
});

const sortedMatterCategories = computed(() => {
  return [...matterCategories.value].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );
});

// Watch tab changes to log for debugging
watch(activeTab, (newTab) => {
  // Tab change tracking
});

const getCategoryIcon = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.icon : 'mdi-folder';
};

const getCategoryIconColor = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.color : 'grey';
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
        const duplicateStatus = category.allowDuplicateValues
          ? 'duplicates allowed'
          : 'unique values';
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
      const duplicateStatus = category.allowDuplicateValues
        ? 'duplicates allowed'
        : 'unique values';
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

const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

const editCategory = (category) => {
  router.push({
    name: 'category-edit',
    params: { matterId: matterId.value, id: category.id },
    query: { source: category.source },
  });
};

onMounted(async () => {
  try {
    await loadAllCategories();
  } catch (error) {
    console.error('[CategoryManager] Failed to load categories:', error);
    showNotification('Failed to load categories: ' + error.message, 'error');
  }
});
</script>

<style scoped>
.category-manager {
  min-width: 50%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.category-item {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.category-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.category-item .edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.category-item:hover .edit-icon {
  opacity: 1;
}
</style>
<!-- Streamlined from 312 lines to 188 lines on 2025-09-12 -->
