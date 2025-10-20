import { ref, computed } from 'vue';
import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { SystemCategoriesService } from '../services/systemCategoriesService.js';
import { CategoryService } from '../services/categoryService.js';

/**
 * Category Manager Composable
 *
 * Handles loading and managing categories from three different sources:
 * - System categories (/system/categories)
 * - Firm categories (/firms/{firmId}/matters/general/categories)
 * - Matter categories (/firms/{firmId}/matters/{matterId}/categories)
 */
export function useCategoryManager() {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

  // State for each category type
  const systemCategories = ref([]);
  const firmCategories = ref([]);
  const matterCategories = ref([]);

  const loading = ref(false);
  const error = ref(null);
  const activeTab = ref('system'); // 'system', 'firm', 'matter'

  // Computed properties
  const allCategories = computed(() => {
    return [
      ...systemCategories.value.map((cat) => ({ ...cat, source: 'system' })),
      ...firmCategories.value.map((cat) => ({ ...cat, source: 'firm' })),
      ...matterCategories.value.map((cat) => ({ ...cat, source: 'matter' })),
    ];
  });

  const currentCategories = computed(() => {
    switch (activeTab.value) {
      case 'system':
        return systemCategories.value.map((cat) => ({ ...cat, source: 'system' }));
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
        loadSystemCategories(),
        loadFirmCategories(firmId),
        loadMatterCategories(firmId, matterStore.currentMatterId || 'general'),
      ]);

      systemCategories.value = systemCats;
      firmCategories.value = firmCats;
      matterCategories.value = matterCats;

      loading.value = false;

      console.log(
        `[CategoryManager] Loaded categories - System: ${systemCats.length}, Firm: ${firmCats.length}, Matter: ${matterCats.length}`
      );

      return {
        systemCategories: systemCats,
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
   * Load system categories from /system/categories
   */
  const loadSystemCategories = async () => {
    try {
      const categories = await SystemCategoriesService.getSystemCategories();
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

      let matterId = 'general';
      if (activeTab.value === 'matter') {
        matterId = matterStore.currentMatterId || 'general';
      }

      const result = await CategoryService.createCategory(firmId, categoryData, matterId);

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
        await SystemCategoriesService.updateSystemCategory(categoryId, updates);
      } else {
        // Update firm or matter category
        const firmId = authStore.currentFirm;
        if (!firmId) {
          throw new Error('No firm ID available');
        }

        const matterId = categorySource === 'matter'
          ? (matterStore.currentMatterId || 'general')
          : 'general';

        await CategoryService.updateCategory(firmId, categoryId, updates, matterId);
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
   * Delete a category (not allowed for system categories)
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

      const matterId = categorySource === 'matter'
        ? (matterStore.currentMatterId || 'general')
        : 'general';

      await CategoryService.deleteCategory(firmId, categoryId, matterId);

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
    systemCategories,
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
    loadSystemCategories,
    loadFirmCategories,
    loadMatterCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    setActiveTab,
  };
}
