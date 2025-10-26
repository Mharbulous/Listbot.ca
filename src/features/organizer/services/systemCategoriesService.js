import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../services/firebase.js';

/**
 * System Categories Service
 *
 * Handles operations for the global /systemcategories collection.
 * System categories can be edited but cannot be deleted.
 */
export class systemcategoriesService {
  /**
   * Generate a document ID for a system category based on its name
   * Removes all spaces from the category name
   * @param {string} categoryName - The category name
   * @returns {string} Document ID (e.g., "Control Number" -> "ControlNumber")
   */
  static generateSystemCategoryId(categoryName) {
    if (!categoryName || typeof categoryName !== 'string') {
      throw new Error('Category name is required to generate document ID');
    }
    // Remove all spaces from the category name
    return categoryName.trim().replace(/\s+/g, '');
  }

  /**
   * Get the system categories collection reference
   * @returns {CollectionReference} Firestore collection reference
   */
  static getsystemcategoriesCollection() {
    return collection(db, 'systemcategories');
  }

  /**
   * Get all system categories
   * @returns {Promise<Array>} Array of system category documents
   */
  static async getsystemcategories() {
    try {
      const systemcategoriesRef = this.getsystemcategoriesCollection();
      let q, snapshot;

      try {
        // Try querying with isActive filter first
        q = query(systemcategoriesRef, where('isActive', '==', true), orderBy('createdAt', 'asc'));
        snapshot = await getDocs(q);
      } catch (queryError) {
        // Fallback: Get all categories without isActive filter
        q = query(systemcategoriesRef, orderBy('createdAt', 'asc'));
        snapshot = await getDocs(q);
      }

      const categories = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Include only active categories (or those with undefined isActive field - default to true)
        if (data.isActive !== false) {
          categories.push({
            id: doc.id,
            ...data,
            isActive: data.isActive !== undefined ? data.isActive : true,
            isSystemCategory: true, // Mark as system category
          });
        }
      });

      return categories;
    } catch (error) {
      console.error('[systemcategoriesService] Failed to get system categories:', error);
      throw error;
    }
  }

  /**
   * Create a new system category (for dev tools only)
   * @param {Object} categoryData - The category data
   * @returns {Promise<Object>} The created category with ID
   */
  static async createSystemCategory(categoryData) {
    try {
      // Validate category data
      if (
        !categoryData.name ||
        typeof categoryData.name !== 'string' ||
        !categoryData.name.trim()
      ) {
        throw new Error('Category name is required and must be a non-empty string');
      }

      if (categoryData.name.trim().length > 50) {
        throw new Error('Category name must be 50 characters or less');
      }

      if (!categoryData.type || typeof categoryData.type !== 'string') {
        throw new Error('Category type is required');
      }

      // Check for duplicate names in system collection
      const systemcategoriesRef = this.getsystemcategoriesCollection();
      const existingQuery = query(
        systemcategoriesRef,
        where('name', '==', categoryData.name.trim())
      );
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        throw new Error(`A system category named "${categoryData.name.trim()}" already exists`);
      }

      // Prepare category document
      const categoryDoc = {
        name: categoryData.name.trim(),
        type: categoryData.type,
        color: categoryData.color || '#9E9E9E',
        tags: categoryData.tags || [],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add type-specific fields
      if (categoryData.type === 'Currency' && categoryData.defaultCurrency) {
        categoryDoc.defaultCurrency = categoryData.defaultCurrency;
      }

      if (categoryData.type === 'Sequence') {
        if (categoryData.defaultSequenceFormat) {
          categoryDoc.defaultSequenceFormat = categoryData.defaultSequenceFormat;
        }
        if (typeof categoryData.allowGaps === 'boolean') {
          categoryDoc.allowGaps = categoryData.allowGaps;
        }
      }

      if (categoryData.type === 'Regex') {
        if (categoryData.regexDefinition) {
          categoryDoc.regexDefinition = categoryData.regexDefinition;
        }
        if (categoryData.regexExamples) {
          categoryDoc.regexExamples = categoryData.regexExamples;
        }
      }

      if (['Text Area', 'Sequence', 'Regex'].includes(categoryData.type)) {
        if (typeof categoryData.allowDuplicateValues === 'boolean') {
          categoryDoc.allowDuplicateValues = categoryData.allowDuplicateValues;
        }
      }

      // Generate human-readable document ID from category name
      const categoryId = this.generateSystemCategoryId(categoryData.name);

      // Create document reference with custom ID
      const docRef = doc(db, 'systemcategories', categoryId);

      // Use setDoc to create document with custom ID
      await setDoc(docRef, categoryDoc);

      return {
        id: categoryId,
        ...categoryDoc,
        isSystemCategory: true,
      };
    } catch (error) {
      console.error('[systemcategoriesService] Failed to create system category:', error);
      throw error;
    }
  }

  /**
   * Update a system category
   * @param {string} categoryId - The category ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<boolean>} True if update successful
   */
  static async updateSystemCategory(categoryId, updates) {
    try {
      // Validate input
      if (!categoryId || typeof categoryId !== 'string') {
        throw new Error('Valid category ID is required');
      }

      // Prevent deletion-related updates
      if (updates.isActive === false || updates.deletedAt) {
        throw new Error('System categories cannot be deleted');
      }

      // Prepare update document
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Clean up undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Update in Firestore
      const categoryRef = doc(db, 'systemcategories', categoryId);
      await updateDoc(categoryRef, updateData);

      return true;
    } catch (error) {
      console.error('[systemcategoriesService] Failed to update system category:', error);
      throw error;
    }
  }

  /**
   * Check if a category ID is a system category
   * @param {string} categorySource - The category source identifier
   * @returns {boolean} True if the category is from system collection
   */
  static isSystemCategory(categorySource) {
    return categorySource === 'system';
  }

  /**
   * Prevent deletion of system categories
   * @param {string} categorySource - The category source identifier
   * @throws {Error} Always throws error for system categories
   */
  static validateNotSystemCategory(categorySource) {
    if (this.isSystemCategory(categorySource)) {
      throw new Error(
        'System categories cannot be deleted. They can be edited but must remain in the system.'
      );
    }
  }
}
