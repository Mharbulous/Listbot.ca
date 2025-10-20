import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase.js';
import { SystemCategoryService } from './systemCategoryService.js';

/**
 * Category Service - Handles all category-related Firestore operations
 * Provides validation and error handling for category CRUD operations
 */
export class CategoryService {
  /**
   * Create categories collection reference
   * @param {string} firmId - The firm ID
   * @param {string} matterId - The matter ID (default: 'general')
   * @returns {CollectionReference} Firestore collection reference
   */
  static getCategoriesCollection(firmId, matterId = 'general') {
    return collection(db, 'firms', firmId, 'matters', matterId, 'categories');
  }

  /**
   * Validate category data structure
   */
  static validateCategoryData(categoryData) {
    const errors = [];

    // Required fields validation
    if (!categoryData.name || typeof categoryData.name !== 'string' || !categoryData.name.trim()) {
      errors.push('Category name is required and must be a non-empty string');
    }

    if (categoryData.name && categoryData.name.trim().length > 50) {
      errors.push('Category name must be 50 characters or less');
    }

    // Type validation
    if (!categoryData.type || typeof categoryData.type !== 'string') {
      errors.push('Category type is required and must be a string');
    }

    // Color validation removed - colors are now automatically assigned by UI

    // Tags validation
    if (categoryData.tags && !Array.isArray(categoryData.tags)) {
      errors.push('Category tags must be an array');
    }

    if (categoryData.tags && categoryData.tags.length > 100) {
      errors.push('Category cannot have more than 100 tags');
    }

    // Validate individual tags
    if (categoryData.tags && Array.isArray(categoryData.tags)) {
      categoryData.tags.forEach((tag, index) => {
        if (!tag.name || typeof tag.name !== 'string' || !tag.name.trim()) {
          errors.push(`Tag ${index + 1}: name is required and must be a non-empty string`);
        }
        if (tag.name && tag.name.trim().length > 30) {
          errors.push(`Tag ${index + 1}: name must be 30 characters or less`);
        }
        // Removed tag.color validation - tags no longer store individual colors
      });

      // Check for duplicate tag names
      const tagNames = categoryData.tags
        .map((tag) => tag.name?.trim().toLowerCase())
        .filter(Boolean);
      const uniqueNames = [...new Set(tagNames)];
      if (tagNames.length !== uniqueNames.length) {
        errors.push('Category cannot have duplicate tag names');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Category validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Create a new category
   * @param {string} firmId - The firm ID
   * @param {Object} categoryData - The category data
   * @param {string} matterId - The matter ID (default: 'general')
   */
  static async createCategory(firmId, categoryData, matterId = 'general') {
    try {
      // Validate input
      if (!firmId || typeof firmId !== 'string') {
        throw new Error('Valid firm ID is required');
      }

      this.validateCategoryData(categoryData);

      // Check for duplicate category name
      await this.validateUniqueName(firmId, categoryData.name.trim(), null, matterId);

      // Prepare category document - include all fields from categoryData
      const categoryDoc = {
        ...categoryData, // Spread all fields from categoryData
        name: categoryData.name.trim(), // Ensure name is trimmed
        tags: categoryData.tags || [], // Ensure tags is an array
        isActive: true, // Always set isActive to true for new categories
        createdAt: serverTimestamp(), // Set creation timestamp
        updatedAt: serverTimestamp(), // Set update timestamp
      };

      // Add to Firestore
      const categoriesRef = this.getCategoriesCollection(firmId, matterId);
      const docRef = await addDoc(categoriesRef, categoryDoc);

      console.log(`[CategoryService] Created category: ${categoryData.name} (${docRef.id})`);
      return {
        id: docRef.id,
        ...categoryDoc,
      };
    } catch (error) {
      console.error('[CategoryService] Failed to create category:', error);
      throw error;
    }
  }

  /**
   * Update an existing category
   * @param {string} firmId - The firm ID
   * @param {string} categoryId - The category ID
   * @param {Object} updates - The updates to apply
   * @param {string} matterId - The matter ID (default: 'general')
   */
  static async updateCategory(firmId, categoryId, updates, matterId = 'general') {
    try {
      // Validate input
      if (!firmId || typeof firmId !== 'string') {
        throw new Error('Valid firm ID is required');
      }
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Valid category ID is required');
      }

      // Validate updates
      if (updates.name !== undefined || updates.tags !== undefined) {
        this.validateCategoryData({
          name: updates.name || 'temp', // Temporary name for validation
          ...updates,
        });
      }

      // Check for duplicate name if name is being updated
      if (updates.name) {
        await this.validateUniqueName(firmId, updates.name.trim(), categoryId, matterId);
      }

      // Prepare update document
      const updateDoc = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Clean up undefined values
      Object.keys(updateDoc).forEach((key) => {
        if (updateDoc[key] === undefined) {
          delete updateDoc[key];
        }
      });

      // Update in Firestore
      const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', categoryId);
      await updateDoc(categoryRef, updateDoc);

      console.log(`[CategoryService] Updated category: ${categoryId}`);
      return true;
    } catch (error) {
      console.error('[CategoryService] Failed to update category:', error);
      throw error;
    }
  }

  /**
   * Soft delete a category
   * @param {string} firmId - The firm ID
   * @param {string} categoryId - The category ID
   * @param {string} matterId - The matter ID (default: 'general')
   */
  static async deleteCategory(firmId, categoryId, matterId = 'general') {
    try {
      // Validate input
      if (!firmId || typeof firmId !== 'string') {
        throw new Error('Valid firm ID is required');
      }
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Valid category ID is required');
      }

      // Prevent deletion of system categories
      SystemCategoryService.validateNotSystemCategory(categoryId);

      // Soft delete by setting isActive to false
      const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', categoryId);
      await updateDoc(categoryRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`[CategoryService] Deleted category: ${categoryId}`);
      return true;
    } catch (error) {
      console.error('[CategoryService] Failed to delete category:', error);
      throw error;
    }
  }

  /**
   * Get all active categories for a firm and matter
   * @param {string} firmId - The firm ID
   * @param {string} matterId - The matter ID (default: 'general')
   */
  static async getActiveCategories(firmId, matterId = 'general') {
    try {
      if (!firmId || typeof firmId !== 'string') {
        throw new Error('Valid firm ID is required');
      }

      const categoriesRef = this.getCategoriesCollection(firmId, matterId);
      let q, snapshot;

      try {
        // Try querying with isActive filter first
        q = query(categoriesRef, where('isActive', '==', true), orderBy('createdAt', 'asc'));
        snapshot = await getDocs(q);
      } catch (queryError) {
        console.log(
          '[CategoryService] isActive query failed, trying fallback query:',
          queryError.message
        );

        // Fallback: Get all categories without isActive filter
        q = query(categoriesRef, orderBy('createdAt', 'asc'));
        snapshot = await getDocs(q);
      }

      const categories = [];
      const categoriesToMigrate = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Check if isActive field exists
        if (data.isActive === undefined) {
          // Mark for migration
          categoriesToMigrate.push({ id: doc.id, data });
          // Include in results as active (default behavior)
          categories.push({
            id: doc.id,
            ...data,
            isActive: true, // Default to true for missing field
          });
        } else if (data.isActive === true) {
          // Include active categories
          categories.push({
            id: doc.id,
            ...data,
          });
        }
        // Skip categories where isActive === false
      });

      // Migrate categories missing isActive field
      if (categoriesToMigrate.length > 0) {
        console.log(
          `[CategoryService] Migrating ${categoriesToMigrate.length} categories to add isActive field`
        );
        await this.migrateIsActiveField(firmId, categoriesToMigrate, matterId);
      }

      return categories;
    } catch (error) {
      console.error('[CategoryService] Failed to get categories:', error);
      throw error;
    }
  }

  /**
   * Migrate categories to add missing isActive field
   * @param {string} firmId - The firm ID
   * @param {Array} categories - Categories to migrate
   * @param {string} matterId - The matter ID (default: 'general')
   */
  static async migrateIsActiveField(firmId, categories, matterId = 'general') {
    try {
      const migrationPromises = categories.map(async ({ id }) => {
        const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', id);
        return updateDoc(categoryRef, {
          isActive: true,
          updatedAt: serverTimestamp(),
        });
      });

      await Promise.all(migrationPromises);
      console.log(
        `[CategoryService] Successfully migrated ${categories.length} categories with isActive field`
      );
    } catch (error) {
      console.error('[CategoryService] Failed to migrate categories:', error);
      // Don't throw - this is a background migration
    }
  }

  /**
   * Validate that category name is unique within firm and matter
   * @param {string} firmId - The firm ID
   * @param {string} categoryName - The category name to validate
   * @param {string|null} excludeCategoryId - Category ID to exclude from uniqueness check
   * @param {string} matterId - The matter ID (default: 'general')
   */
  static async validateUniqueName(
    firmId,
    categoryName,
    excludeCategoryId = null,
    matterId = 'general'
  ) {
    try {
      const categoriesRef = this.getCategoriesCollection(firmId, matterId);
      let q, snapshot;

      try {
        // Try querying with isActive filter first
        q = query(
          categoriesRef,
          where('isActive', '==', true),
          where('name', '==', categoryName.trim())
        );
        snapshot = await getDocs(q);
      } catch (queryError) {
        console.log(
          '[CategoryService] isActive validation query failed, using fallback:',
          queryError.message
        );

        // Fallback: Get all categories with this name and filter manually
        q = query(categoriesRef, where('name', '==', categoryName.trim()));
        snapshot = await getDocs(q);

        // Filter for active categories (including those missing isActive field)
        const filteredDocs = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.isActive !== false) {
            // Include undefined and true
            filteredDocs.push(doc);
          }
        });

        // Create a mock snapshot-like object for consistency
        snapshot = { docs: filteredDocs };
      }

      const existingCategories = snapshot.docs.filter((doc) => doc.id !== excludeCategoryId);

      if (existingCategories.length > 0) {
        throw new Error(`Category name "${categoryName}" already exists`);
      }

      return true;
    } catch (error) {
      // Re-throw validation errors, log others
      if (error.message.includes('already exists')) {
        throw error;
      }
      console.error('[CategoryService] Failed to validate unique name:', error);
      throw new Error('Failed to validate category name uniqueness');
    }
  }

  /**
   * Create default categories for new users
   */
  static async createDefaultCategories(firmId) {
    try {
      // Check if categories already exist
      const existingCategories = await this.getActiveCategories(firmId);
      if (existingCategories.length > 0) {
        console.log(
          `[CategoryService] Firm ${firmId} already has categories, skipping default creation`
        );
        return existingCategories;
      }

      const defaultCategories = [
        {
          name: 'Document Type',
          color: '#1976d2',
          tags: [
            { name: 'Invoice', color: '#1976d2' },
            { name: 'Statement', color: '#1565c0' },
            { name: 'Receipt', color: '#0d47a1' },
            { name: 'Contract', color: '#1976d2' },
            { name: 'Report', color: '#1565c0' },
          ],
        },
        {
          name: 'Date/Period',
          color: '#388e3c',
          tags: [
            { name: 'Q1 2024', color: '#388e3c' },
            { name: 'Q2 2024', color: '#2e7d32' },
            { name: 'Q3 2024', color: '#1b5e20' },
            { name: 'Q4 2024', color: '#388e3c' },
            { name: '2024', color: '#2e7d32' },
          ],
        },
        {
          name: 'Institution',
          color: '#f57c00',
          tags: [
            { name: 'Bank of America', color: '#f57c00' },
            { name: 'Chase', color: '#ef6c00' },
            { name: 'Wells Fargo', color: '#e65100' },
            { name: 'Credit Union', color: '#f57c00' },
            { name: 'Other Bank', color: '#ef6c00' },
          ],
        },
      ];

      const createdCategories = [];
      for (const categoryData of defaultCategories) {
        const category = await this.createCategory(firmId, categoryData);
        createdCategories.push(category);
      }

      console.log(
        `[CategoryService] Created ${createdCategories.length} default categories for firm ${firmId}`
      );
      return createdCategories;
    } catch (error) {
      console.error('[CategoryService] Failed to create default categories:', error);
      throw error;
    }
  }

  /**
   * Count categories for a firm
   */
  static async getCategoryCount(firmId) {
    try {
      const categories = await this.getActiveCategories(firmId);
      return categories.length;
    } catch (error) {
      console.error('[CategoryService] Failed to get category count:', error);
      return 0;
    }
  }

  /**
   * Check if firm has reached category limit
   */
  static async validateCategoryLimit(firmId, limit = 50) {
    try {
      const count = await this.getCategoryCount(firmId);
      if (count >= limit) {
        throw new Error(`Cannot create more than ${limit} categories`);
      }
      return true;
    } catch (error) {
      if (error.message.includes('Cannot create more than')) {
        throw error;
      }
      console.error('[CategoryService] Failed to validate category limit:', error);
      throw new Error('Failed to validate category limit');
    }
  }
}
