import { ref, computed, reactive } from 'vue';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase.js';
import { useAuthStore } from '../../core/stores/auth.js';
import { DevTagService } from '../services/devTagService.js';

/**
 * Development Tags Composable
 * Manages development tag categories and test tags with real-time updates
 */
export function useDevTags() {
  // State
  const categories = ref([]);
  const testTags = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // Auth store reference
  const authStore = useAuthStore();

  // Computed
  const categoryCount = computed(() => categories.value.length);
  const testTagCount = computed(() => testTags.value.length);

  // Get reactive test tags split by type
  const fixedListTestTags = computed(() =>
    testTags.value.filter(tag => !tag.isOpenCategory)
  );

  const openListTestTags = computed(() =>
    testTags.value.filter(tag => tag.isOpenCategory)
  );

  /**
   * Load development categories with real-time updates
   */
  const loadCategories = async () => {
    try {
      loading.value = true;
      error.value = null;

      console.log('[useDevTags] Loading categories...');

      // Set up real-time listener for categories
      const categoriesRef = DevTagService.getDevCategoriesCollection();
      const unsubscribeCategories = onSnapshot(
        categoriesRef,
        async (snapshot) => {
          const loadedCategories = [];

          snapshot.docs.forEach(doc => {
            loadedCategories.push({
              id: doc.id,
              ...doc.data()
            });
          });

          // If no categories exist, create default ones
          if (loadedCategories.length === 0) {
            console.log('[useDevTags] No categories found, creating defaults...');
            try {
              await DevTagService.initializeDefaultCategories();
              // The onSnapshot will fire again after categories are created
              return;
            } catch (error) {
              console.error('[useDevTags] Failed to create default categories:', error);
              error.value = error.message;
            }
          }

          categories.value = loadedCategories;
          console.log(`[useDevTags] Loaded ${loadedCategories.length} categories`);
        },
        (err) => {
          console.error('[useDevTags] Error loading categories:', err);
          error.value = err.message;
          loading.value = false;
        }
      );

      return unsubscribeCategories;
    } catch (err) {
      console.error('[useDevTags] Failed to load categories:', err);
      error.value = err.message;
      loading.value = false;
    }
  };

  /**
   * Load development test tags with real-time updates
   */
  const loadTestTags = async () => {
    try {
      console.log('[useDevTags] Loading test tags...');

      // Set up real-time listener for test tags
      const testTagsRef = DevTagService.getDevTestTagsCollection();
      const unsubscribeTestTags = onSnapshot(
        testTagsRef,
        async (snapshot) => {
          const loadedTestTags = [];

          snapshot.docs.forEach(doc => {
            const data = doc.data();

            // Create reactive tag object with all required properties
            const reactiveTag = reactive({
              id: doc.id,
              categoryId: data.categoryId,
              tagName: data.tagName,
              isOpenCategory: data.isOpenCategory,
              source: data.source,
              confidence: data.confidence,
              // Reactive properties for EditableTag component
              isOpen: false,
              isHeaderEditing: false,
              hasStartedTyping: false,
              filterText: '',
              filterTextRaw: '',
              isFiltering: false,
              highlightedIndex: -1,
              customInputValue: '',
              createdAt: data.createdAt,
              updatedAt: data.updatedAt
            });

            loadedTestTags.push(reactiveTag);
          });

          // If no test tags exist, create default ones
          if (loadedTestTags.length === 0) {
            console.log('[useDevTags] No test tags found, creating defaults...');
            try {
              await DevTagService.initializeDefaultTestTags();
              // The onSnapshot will fire again after test tags are created
              return;
            } catch (error) {
              console.error('[useDevTags] Failed to create default test tags:', error);
              error.value = error.message;
            }
          }

          testTags.value = loadedTestTags;
          loading.value = false;
          isInitialized.value = true;

          console.log(`[useDevTags] Loaded ${loadedTestTags.length} test tags`);
        },
        (err) => {
          console.error('[useDevTags] Error loading test tags:', err);
          error.value = err.message;
          loading.value = false;
        }
      );

      return unsubscribeTestTags;
    } catch (err) {
      console.error('[useDevTags] Failed to load test tags:', err);
      error.value = err.message;
      loading.value = false;
    }
  };

  /**
   * Initialize complete development environment
   */
  const initializeDevEnvironment = async () => {
    if (!authStore.isAuthenticated) {
      error.value = 'User not authenticated';
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      console.log('[useDevTags] Initializing development environment...');

      // Initialize both categories and test tags
      await DevTagService.initializeDevEnvironment();

      // Set up real-time listeners
      const unsubscribeCategories = await loadCategories();
      const unsubscribeTestTags = await loadTestTags();

      // Return cleanup function
      return () => {
        if (unsubscribeCategories) unsubscribeCategories();
        if (unsubscribeTestTags) unsubscribeTestTags();
      };
    } catch (err) {
      console.error('[useDevTags] Failed to initialize development environment:', err);
      error.value = err.message;
      loading.value = false;
    }
  };

  /**
   * Get category options for a specific category ID
   */
  const getCategoryOptions = (categoryId) => {
    const category = categories.value.find(cat => cat.id === categoryId);
    if (!category?.options) return [];

    // Convert to format expected by EditableTag
    return category.options.map(option => ({
      id: option.id,
      tagName: option.name,
      source: option.source
    }));
  };

  /**
   * Add new option to a category (for open categories)
   */
  const addOptionToCategory = async (categoryId, newOptionName) => {
    try {
      console.log(`[useDevTags] Adding option "${newOptionName}" to category ${categoryId}`);

      await DevTagService.addOptionToCategory(categoryId, {
        name: newOptionName,
        source: 'human'
      });

      console.log(`[useDevTags] Successfully added option "${newOptionName}"`);
    } catch (err) {
      console.error('[useDevTags] Failed to add option to category:', err);
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Handle tag updated event
   */
  const handleTagUpdate = async (updatedTag) => {
    console.log('[useDevTags] Tag updated:', updatedTag);
    // Tag name is already updated by the EditableTag component
    // No additional Firestore update needed for tag name changes
  };

  /**
   * Handle tag created event (for open categories)
   */
  const handleTagCreated = async (newTagData) => {
    try {
      console.log('[useDevTags] Creating new tag:', newTagData);

      // Add the new option to the category
      await addOptionToCategory(newTagData.categoryId, newTagData.tagName);

      console.log(`[useDevTags] Successfully created tag "${newTagData.tagName}"`);
    } catch (err) {
      console.error('[useDevTags] Failed to create tag:', err);
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Reset store to initial state
   */
  const reset = () => {
    categories.value = [];
    testTags.value = [];
    loading.value = false;
    error.value = null;
    isInitialized.value = false;
  };

  return {
    // State
    categories,
    testTags,
    loading,
    error,
    isInitialized,

    // Computed
    categoryCount,
    testTagCount,
    fixedListTestTags,
    openListTestTags,

    // Actions
    initializeDevEnvironment,
    loadCategories,
    loadTestTags,
    getCategoryOptions,
    addOptionToCategory,
    handleTagUpdate,
    handleTagCreated,
    reset
  };
}