import {
  collection,
  doc,
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
 * Handles operations for the global /system/categories collection.
 * System categories can be edited but cannot be deleted.
 */
export class SystemCategoriesService {
  /**
   * Get the system categories collection reference
   * @returns {CollectionReference} Firestore collection reference
   */
  static getSystemCategoriesCollection() {
    return collection(db, 'system', 'categories');
  }

  /**
   * Get all system categories
   * @returns {Promise<Array>} Array of system category documents
   */
  static async getSystemCategories() {
    try {
      const systemCategoriesRef = this.getSystemCategoriesCollection();
      let q, snapshot;

      try {
        // Try querying with isActive filter first
        q = query(systemCategoriesRef, where('isActive', '==', true), orderBy('createdAt', 'asc'));
        snapshot = await getDocs(q);
      } catch (queryError) {
        console.log(
          '[SystemCategoriesService] isActive query failed, trying fallback query:',
          queryError.message
        );

        // Fallback: Get all categories without isActive filter
        q = query(systemCategoriesRef, orderBy('createdAt', 'asc'));
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

      console.log(`[SystemCategoriesService] Fetched ${categories.length} system categories`);
      return categories;
    } catch (error) {
      console.error('[SystemCategoriesService] Failed to get system categories:', error);
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
      const categoryRef = doc(db, 'system', 'categories', categoryId);
      await updateDoc(categoryRef, updateDoc);

      console.log(`[SystemCategoriesService] Updated system category: ${categoryId}`);
      return true;
    } catch (error) {
      console.error('[SystemCategoriesService] Failed to update system category:', error);
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
