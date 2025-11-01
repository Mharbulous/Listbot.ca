import { ref, computed } from 'vue';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase.js';
import { useAuthStore } from '../../../core/stores/auth.js';
import { CategoryService } from '../services/categoryService.js';
import { LogService } from '../../../services/logService.js';

/**
 * Category Core Module
 * Handles basic CRUD operations, state management, and real-time updates
 */
export function useCategoryCore() {
  // State
  const categories = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const isInitialized = ref(false);

  // Auth store reference
  const authStore = useAuthStore();

  // Computed
  const categoryCount = computed(() => categories.value.length);
  const activeCategories = computed(() => categories.value.filter((cat) => cat.isActive));

  /**
   * Load categories from Firestore with real-time updates
   */
  const loadCategories = async () => {
    if (!authStore.isAuthenticated) {
      error.value = 'User not authenticated';
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Create query for categories collection
      // Note: Default to 'general' matter for now - matterId support can be added when needed
      const matterId = 'general';
      const categoriesRef = collection(db, 'firms', firmId, 'matters', matterId, 'categories');
      let categoriesQuery;

      try {
        // Try to create query with isActive filter
        categoriesQuery = query(
          categoriesRef,
          where('isActive', '==', true),
          orderBy('createdAt', 'asc')
        );
      } catch (queryError) {
        LogService.debug(
          '[CategoryCore] isActive query setup failed, using fallback query',
          { message: queryError.message }
        );
        // Fallback: Query without isActive filter
        categoriesQuery = query(categoriesRef, orderBy('createdAt', 'asc'));
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        categoriesQuery,
        async (snapshot) => {
          const loadedCategories = [];
          const categoriesToMigrate = [];

          snapshot.docs.forEach((doc) => {
            const data = doc.data();

            // Handle missing isActive field
            if (data.isActive === undefined) {
              // Mark for migration
              categoriesToMigrate.push({ id: doc.id, data });
              // Include in results as active (default behavior)
              loadedCategories.push({
                id: doc.id,
                ...data,
                isActive: true,
              });
            } else if (data.isActive === true) {
              // Include active categories
              loadedCategories.push({
                id: doc.id,
                ...data,
              });
            }
            // Skip categories where isActive === false
          });

          // Migrate categories missing isActive field
          if (categoriesToMigrate.length > 0) {
            LogService.debug(
              `[CategoryCore] Migrating ${categoriesToMigrate.length} categories to add isActive field`
            );
            CategoryService.migrateIsActiveField(firmId, categoriesToMigrate).catch((err) => {
              LogService.error('[CategoryCore] Migration failed', err, { firmId, count: categoriesToMigrate.length });
            });
          }

          categories.value = loadedCategories;
          loading.value = false;
          isInitialized.value = true;

          LogService.debug(`[CategoryCore] Loaded ${loadedCategories.length} categories`);
        },
        (err) => {
          LogService.error('[CategoryCore] Error loading categories', err, { firmId, matterId });
          error.value = err.message;
          loading.value = false;
        }
      );

      return unsubscribe;
    } catch (err) {
      LogService.error('[CategoryCore] Failed to load categories', err, { firmId: authStore.currentFirm });
      error.value = err.message;
      loading.value = false;
    }
  };

  /**
   * Create a new category
   */
  const createCategory = async (categoryData) => {
    try {
      if (!authStore.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Validate required fields
      if (!categoryData.name || !categoryData.name.trim()) {
        throw new Error('Category name is required');
      }

      // Check for duplicate names
      const existingCategory = categories.value.find(
        (cat) => cat.name.toLowerCase() === categoryData.name.trim().toLowerCase()
      );
      if (existingCategory) {
        throw new Error('Category name already exists');
      }

      const newCategory = {
        ...categoryData, // Preserve all fields from categoryData
        name: categoryData.name.trim(),
        type: categoryData.type || 'Fixed List', // Default type
        color: categoryData.color || '#1976d2', // Default color will be handled by color module
        tags: categoryData.tags || [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Note: Default to 'general' matter for now - matterId support can be added when needed
      const matterId = 'general';
      const categoriesRef = collection(db, 'firms', firmId, 'matters', matterId, 'categories');
      const docRef = await addDoc(categoriesRef, newCategory);

      LogService.debug(`[CategoryCore] Created category: ${categoryData.name}`, { categoryId: docRef.id });
      return docRef.id;
    } catch (err) {
      LogService.error('[CategoryCore] Failed to create category', err, { categoryData, firmId });
      throw err;
    }
  };

  /**
   * Update an existing category
   */
  const updateCategory = async (categoryId, updates) => {
    try {
      if (!authStore.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Validate name if being updated
      if (updates.name) {
        const existingCategory = categories.value.find(
          (cat) =>
            cat.id !== categoryId && cat.name.toLowerCase() === updates.name.trim().toLowerCase()
        );
        if (existingCategory) {
          throw new Error('Category name already exists');
        }
      }

      // Note: Default to 'general' matter for now - matterId support can be added when needed
      const matterId = 'general';
      const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', categoryId);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      LogService.debug(`[CategoryCore] Updated category: ${categoryId}`, { updates });
      return true;
    } catch (err) {
      LogService.error('[CategoryCore] Failed to update category', err, { categoryId, firmId, updates });
      throw err;
    }
  };

  /**
   * Delete a category (soft delete)
   */
  const deleteCategory = async (categoryId) => {
    try {
      if (!authStore.isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Note: Default to 'general' matter for now - matterId support can be added when needed
      const matterId = 'general';
      const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', categoryId);
      await updateDoc(categoryRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      LogService.debug(`[CategoryCore] Deleted category: ${categoryId}`);
      return true;
    } catch (err) {
      LogService.error('[CategoryCore] Failed to delete category', err, { categoryId, firmId });
      throw err;
    }
  };

  /**
   * Get category by ID
   */
  const getCategoryById = (categoryId) => {
    return categories.value.find((cat) => cat.id === categoryId);
  };

  /**
   * Reset store to initial state
   */
  const reset = () => {
    categories.value = [];
    loading.value = false;
    error.value = null;
    isInitialized.value = false;
  };

  return {
    // State
    categories,
    loading,
    error,
    isInitialized,

    // Computed
    categoryCount,
    activeCategories,

    // Actions
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    reset,
  };
}
