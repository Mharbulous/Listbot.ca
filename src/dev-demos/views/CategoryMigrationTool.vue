<template>
  <v-container fluid class="pa-6">
    <div class="max-w-7xl mx-auto">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-folder-multiple" class="me-2" />
          Category Viewer (Dev Tool)
        </v-card-title>
        <v-card-subtitle>
          View all categories across System, Firm, and Matter collections
        </v-card-subtitle>

        <v-card-text>
          <v-alert color="info" class="mb-4" variant="tonal">
            <v-icon icon="mdi-information" class="me-2" />
            <strong>Development Tool:</strong> This page displays categories from all three
            Firestore collections for debugging and inspection purposes.
          </v-alert>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-h6">Loading categories...</p>
          </div>

          <!-- Tabbed Category View -->
          <div v-else>
            <v-tabs v-model="activeTab" class="mb-4">
              <v-tab value="system">
                <v-icon start>mdi-shield-star</v-icon>
                System
                <v-chip size="small" color="blue" class="ml-2">{{
                  systemcategories.length
                }}</v-chip>
              </v-tab>
              <v-tab value="firm">
                <v-icon start>mdi-office-building</v-icon>
                Firm
                <v-chip size="small" color="green" class="ml-2">{{ firmCategories.length }}</v-chip>
              </v-tab>
              <v-tab value="matter">
                <v-icon start>mdi-folder</v-icon>
                Matter
                <v-chip size="small" color="orange" class="ml-2">{{
                  matterCategories.length
                }}</v-chip>
              </v-tab>
            </v-tabs>

            <!-- Tab Windows -->
            <v-window v-model="activeTab">
              <!-- System Categories -->
              <v-window-item value="system">
                <div v-if="systemcategories.length === 0" class="text-center py-8 text-grey">
                  <v-icon icon="mdi-package-variant" size="64" />
                  <p class="mt-2 text-h6">No system categories</p>
                </div>
                <v-list v-else>
                  <v-list-item
                    v-for="category in sortedsystemcategories"
                    :key="category.id"
                    class="category-item"
                    @click="editCategory(category, 'system')"
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
                      <div class="text-caption text-medium-emphasis">
                        {{ getCategoryDisplayText(category) }}
                      </div>
                    </v-list-item-title>

                    <template #append>
                      <v-chip size="small" variant="text"> ID: {{ category.id }} </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-window-item>

              <!-- Firm Categories -->
              <v-window-item value="firm">
                <div v-if="firmCategories.length === 0" class="text-center py-8 text-grey">
                  <v-icon icon="mdi-package-variant" size="64" />
                  <p class="mt-2 text-h6">No firm categories</p>
                </div>
                <v-list v-else>
                  <v-list-item
                    v-for="category in sortedFirmCategories"
                    :key="category.id"
                    class="category-item"
                    @click="editCategory(category, 'firm')"
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
                      <div class="text-caption text-medium-emphasis">
                        {{ getCategoryDisplayText(category) }}
                      </div>
                    </v-list-item-title>

                    <template #append>
                      <v-chip size="small" variant="text"> ID: {{ category.id }} </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-window-item>

              <!-- Matter Categories -->
              <v-window-item value="matter">
                <div v-if="matterCategories.length === 0" class="text-center py-8 text-grey">
                  <v-icon icon="mdi-package-variant" size="64" />
                  <p class="mt-2 text-h6">No matter categories</p>
                </div>
                <v-list v-else>
                  <v-list-item
                    v-for="category in sortedMatterCategories"
                    :key="category.id"
                    class="category-item"
                    @click="editCategory(category, 'matter')"
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
                      <div class="text-caption text-medium-emphasis">
                        {{ getCategoryDisplayText(category) }}
                      </div>
                    </v-list-item-title>

                    <template #append>
                      <v-chip size="small" variant="text"> ID: {{ category.id }} </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-window-item>
            </v-window>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn variant="outlined" :to="{ name: 'DevDemoIndex' }">
            <v-icon start>mdi-arrow-left</v-icon>
            Back to Demos
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="loadAllCategories">
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCategoryManager } from '../../features/organizer/composables/useCategoryManager.js';
import {
  getCategoryTypeInfo,
  getCategoryTypeLabel,
} from '../../features/organizer/utils/categoryTypes.js';
import { getCurrencySymbol } from '../../features/organizer/utils/currencyOptions.js';

const router = useRouter();
const categoryManager = useCategoryManager();

const loading = ref(false);
const activeTab = ref('system');
const snackbar = ref({ show: false, message: '', color: 'success' });

// Category lists
const systemcategories = ref([]);
const firmCategories = ref([]);
const matterCategories = ref([]);

// Sorted categories for each tab
const sortedsystemcategories = computed(() => {
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

/**
 * Get category type icon
 */
const getCategoryIcon = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.icon : 'mdi-folder';
};

/**
 * Get category icon color
 */
const getCategoryIconColor = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.color : 'grey';
};

/**
 * Get category display text with configuration details
 */
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

/**
 * Load all categories from all three sources
 */
const loadAllCategories = async () => {
  loading.value = true;
  try {
    const result = await categoryManager.loadAllCategories();
    systemcategories.value = result.systemcategories;
    firmCategories.value = result.firmCategories;
    matterCategories.value = result.matterCategories;

    console.log('[CategoryViewer] Loaded categories:', {
      system: systemcategories.value.length,
      firm: firmCategories.value.length,
      matter: matterCategories.value.length,
    });
  } catch (error) {
    console.error('[CategoryViewer] Failed to load categories:', error);
    showNotification('Failed to load categories: ' + error.message, 'error');
  } finally {
    loading.value = false;
  }
};

/**
 * Show notification
 */
const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

/**
 * Navigate to category editor
 */
const editCategory = (category, source) => {
  router.push({
    name: 'CategoryEditViewer',
    params: { id: category.id },
    query: { source },
  });
};

onMounted(() => {
  loadAllCategories();
});
</script>

<style scoped>
.category-item {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.category-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
