<template>
  <div class="category-manager">
    <v-card variant="flat">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-folder-multiple</v-icon>
        Categories List ({{ sortedCategories.length }})
      </v-card-title>
      <v-card-text>
        <div v-if="loading || initializingCategories" class="text-center py-6">
          <v-progress-circular indeterminate />
          <p class="mt-2">{{ initializingCategories ? 'Initializing system categories...' : 'Loading categories...' }}</p>
        </div>

        <div v-else-if="!sortedCategories.length" class="text-center py-6">
          <v-icon size="64" color="grey">mdi-folder-outline</v-icon>
          <p class="text-h6 mt-2">No categories yet</p>
        </div>

        <v-list v-else>
          <v-list-item
            v-for="category in sortedCategories"
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
                <v-chip
                  v-if="isSystemCategory(category.id)"
                  size="x-small"
                  color="primary"
                  variant="outlined"
                  class="ml-2"
                >
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
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-btn variant="outlined" :to="{ name: 'organizer' }">
          <v-icon start>mdi-arrow-left</v-icon>
          Back
        </v-btn>

        <v-spacer />

        <v-btn color="primary" :to="{ name: 'category-creation-wizard' }" variant="elevated">
          <v-icon start>mdi-plus</v-icon>
          New Category
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
import { useAuthStore } from '../../../core/stores/auth.js';
import { useOrganizerStore } from '../stores/organizer.js';
import { getCategoryTypeInfo, getCategoryTypeLabel } from '../utils/categoryTypes.js';
import { getCurrencySymbol } from '../utils/currencyOptions.js';
import { SystemCategoryService } from '../services/systemCategoryService.js';
import { isSystemCategory } from '../constants/systemCategories.js';

const router = useRouter();
const authStore = useAuthStore();
const organizerStore = useOrganizerStore();
const { categories, loading } = storeToRefs(organizerStore);

const snackbar = ref({ show: false, message: '', color: 'success' });
const initializingCategories = ref(false);

// Computed property to sort categories: system categories first, then custom categories alphabetically
const sortedCategories = computed(() => {
  const systemCategories = categories.value.filter((cat) => isSystemCategory(cat.id));
  const customCategories = categories.value.filter((cat) => !isSystemCategory(cat.id));

  // Sort system categories by a predefined order or alphabetically
  const sortedSystem = systemCategories.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  // Sort custom categories alphabetically
  const sortedCustom = customCategories.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return [...sortedSystem, ...sortedCustom];
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

/**
 * Initialize system categories for the current matter
 */
const initializeSystemCategories = async () => {
  try {
    if (!authStore.isAuthenticated || !authStore.currentTeam) {
      console.log('[CategoryManager] User not authenticated, skipping system category initialization');
      return;
    }

    initializingCategories.value = true;
    const teamId = authStore.currentTeam;
    const matterId = 'general'; // Default to general matter

    console.log('[CategoryManager] Initializing system categories...');
    const result = await SystemCategoryService.initializeSystemCategories(teamId, matterId);

    if (result.created > 0) {
      showNotification(`Initialized ${result.created} system categories`, 'success');
      // Reload categories to show the new system categories
      await organizerStore.initialize();
    }

    console.log('[CategoryManager] System categories initialized:', result);
  } catch (error) {
    console.error('[CategoryManager] Failed to initialize system categories:', error);
    showNotification('Failed to initialize system categories: ' + error.message, 'error');
  } finally {
    initializingCategories.value = false;
  }
};

onMounted(async () => {
  if (!organizerStore.isInitialized || !categories.value.length) {
    console.log('[CategoryManager] Initializing organizer store for categories...');
    await organizerStore.initialize();
  }

  // Initialize system categories after loading existing categories
  await initializeSystemCategories();
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
