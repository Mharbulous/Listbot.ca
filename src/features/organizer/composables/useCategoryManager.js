import { ref, computed } from 'vue';
import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { systemcategoriesService } from '../services/systemCategoriesService.js';
import { CategoryService } from '../services/categoryService.js';

/**
 * Category Manager Composable
 *
 * Handles loading and managing categories from three different sources:
 * - System categories (/systemcategories)
 * - Firm categories (/firms/{firmId}/matters/general/categories)
 * - Matter categories (/firms/{firmId}/matters/{matterId}/categories)
 */
export function useCategoryManager(matterId = null) {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

  // State for each category type
  const systemcategories = ref([]);
  const firmCategories = ref([]);
  const matterCategories = ref([]);

  const loading = ref(false);
  const error = ref(null);
  const activeTab = ref('system'); // 'system', 'firm', 'matter'

  // Computed properties
  const allCategories = computed(() => {
    return [
      ...systemcategories.value.map((cat) => ({ ...cat, source: 'system' })),
      ...firmCategories.value.map((cat) => ({ ...cat, source: 'firm' })),
      ...matterCategories.value.map((cat) => ({ ...cat, source: 'matter' })),
    ];
  });

  const currentCategories = computed(() => {
    switch (activeTab.value) {
      case 'system':
        return systemcategories.value.map((cat) => ({ ...cat, source: 'system' }));
      case 'firm':
        return firmCategories.value.map((cat) => ({ ...cat, source: 'firm' }));
      case 'matter':
        return matterCategories.value.map((cat) => ({ ...cat, source: 'matter' }));
      default:
        return [];
    }
  });

  const canCreateCategory = computed(() => {
    // Cannot create system categories
    return activeTab.value !== 'system';
  });

  /**
   * Load all category types
   */
  const loadAllCategories = async () => {
    try {
      loading.value = true;
      error.value = null;

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Load all three types in parallel
      const [systemCats, firmCats, matterCats] = await Promise.all([
        loadsystemcategories(),
        loadFirmCategories(firmId),
        loadMatterCategories(firmId, matterId || matterStore.currentMatterId || 'general'),
      ]);

      systemcategories.value = systemCats;
      firmCategories.value = firmCats;
      matterCategories.value = matterCats;

      loading.value = false;

      return {
        systemcategories: systemCats,
        firmCategories: firmCats,
        matterCategories: matterCats,
      };
    } catch (err) {
      console.error('[CategoryManager] Failed to load categories:', err);
      error.value = err.message;
      loading.value = false;
      throw err;
    }
  };

  /**
   * Load system categories from /systemcategories
   */
  const loadsystemcategories = async () => {
    try {
      const categories = await systemcategoriesService.getsystemcategories();
      return categories;
    } catch (err) {
      console.error('[CategoryManager] Failed to load system categories:', err);
      return [];
    }
  };

  /**
   * Load firm categories from /firms/{firmId}/matters/general/categories
   */
  const loadFirmCategories = async (firmId) => {
    try {
      const categories = await CategoryService.getActiveCategories(firmId, 'general');
      return categories;
    } catch (err) {
      console.error('[CategoryManager] Failed to load firm categories:', err);
      return [];
    }
  };

  /**
   * Load matter-specific categories
   */
  const loadMatterCategories = async (firmId, matterId) => {
    try {
      if (!matterId || matterId === 'general') {
        // If no specific matter selected, return empty
        return [];
      }

      const categories = await CategoryService.getActiveCategories(firmId, matterId);
      return categories;
    } catch (err) {
      console.error('[CategoryManager] Failed to load matter categories:', err);
      return [];
    }
  };

  /**
   * Create a new category in the appropriate collection based on active tab
   */
  const createCategory = async (categoryData) => {
    try {
      if (!canCreateCategory.value) {
        throw new Error('Cannot create system categories');
      }

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      let matterIdForCreate = 'general';
      if (activeTab.value === 'matter') {
        matterIdForCreate = matterId || matterStore.currentMatterId || 'general';
      }

      const result = await CategoryService.createCategory(firmId, categoryData, matterIdForCreate);

      // Reload the appropriate category list
      await loadAllCategories();

      return result;
    } catch (err) {
      console.error('[CategoryManager] Failed to create category:', err);
      throw err;
    }
  };

  /**
   * Update a category
   */
  const updateCategory = async (categoryId, updates, categorySource) => {
    try {
      if (categorySource === 'system') {
        // Update system category
        await systemcategoriesService.updateSystemCategory(categoryId, updates);
      } else {
        // Update firm or matter category
        const firmId = authStore.currentFirm;
        if (!firmId) {
          throw new Error('No firm ID available');
        }

        const matterIdForUpdate =
          categorySource === 'matter' ? matterId || matterStore.currentMatterId || 'general' : 'general';

        await CategoryService.updateCategory(firmId, categoryId, updates, matterIdForUpdate);
      }

      // Reload categories
      await loadAllCategories();

      return true;
    } catch (err) {
      console.error('[CategoryManager] Failed to update category:', err);
      throw err;
    }
  };

  /**
   * Create a system category (for dev tools only)
   * This bypasses the normal restriction on creating system categories
   */
  const createSystemCategory = async (categoryData) => {
    try {
      const result = await systemcategoriesService.createSystemCategory(categoryData);

      // Reload categories
      await loadAllCategories();

      return result;
    } catch (err) {
      console.error('[CategoryManager] Failed to create system category:', err);
      throw err;
    }
  };

  /**
   * Delete a category (not allowed for system categories)
   * @param {string} categoryId - The category ID
   * @param {string} categorySource - The category source ('system', 'firm', 'matter')
   */
  const deleteCategory = async (categoryId, categorySource) => {
    try {
      if (categorySource === 'system') {
        throw new Error('System categories cannot be deleted');
      }

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      const matterIdForDelete =
        categorySource === 'matter' ? matterId || matterStore.currentMatterId || 'general' : 'general';

      await CategoryService.deleteCategory(firmId, categoryId, matterIdForDelete);

      // Reload categories
      await loadAllCategories();

      return true;
    } catch (err) {
      console.error('[CategoryManager] Failed to delete category:', err);
      throw err;
    }
  };

  /**
   * Set the active tab
   */
  const setActiveTab = (tab) => {
    if (['system', 'firm', 'matter'].includes(tab)) {
      activeTab.value = tab;
    }
  };

  return {
    // State
    systemcategories,
    firmCategories,
    matterCategories,
    loading,
    error,
    activeTab,

    // Computed
    allCategories,
    currentCategories,
    canCreateCategory,

    // Actions
    loadAllCategories,
    loadsystemcategories,
    loadFirmCategories,
    loadMatterCategories,
    createCategory,
    createSystemCategory,
    updateCategory,
    deleteCategory,
    setActiveTab,
  };
}
