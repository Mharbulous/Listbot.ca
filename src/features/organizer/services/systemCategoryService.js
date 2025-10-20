import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../services/firebase.js';
import {
  SYSTEM_CATEGORY_IDS,
  SYSTEM_CATEGORIES,
  isSystemCategory,
  getSystemCategory,
} from '../constants/systemcategories.js';

/**
 * System Category Service
 *
 * Handles initialization and management of system categories.
 * System categories are predefined categories that should exist for every matter.
 */
export class SystemCategoryService {
  /**
   * Get all system categories from the global /systemcategories collection
   * @returns {Promise<Array>} Array of system category documents
   */
  static async getsystemcategories() {
    try {
      const systemcategoriesRef = collection(db, 'systemcategories');
      const snapshot = await getDocs(systemcategoriesRef);

      const categories = [];
      snapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      console.log(`[SystemCategoryService] Fetched ${categories.length} system categories`);
      return categories;
    } catch (error) {
      console.error('[SystemCategoryService] Failed to get system categories:', error);
      throw error;
    }
  }

  /**
   * Check which system categories are missing from a matter
   * @param {string} firmId - The firm ID
   * @param {string} matterId - The matter ID (default: 'general')
   * @returns {Promise<Array>} Array of missing system category IDs
   */
  static async checkMissingCategories(firmId, matterId = 'general') {
    try {
      if (!firmId || typeof firmId !== 'string') {
        throw new Error('Valid firm ID is required');
      }

      const missingIds = [];

      // Check each system category
      for (const categoryId of SYSTEM_CATEGORY_IDS) {
        const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', categoryId);
        const categoryDoc = await getDoc(categoryRef);

        if (!categoryDoc.exists()) {
          missingIds.push(categoryId);
        }
      }

      if (missingIds.length > 0) {
        console.log(
          `[SystemCategoryService] Matter ${matterId} missing ${missingIds.length} system categories:`,
          missingIds
        );
      }

      return missingIds;
    } catch (error) {
      console.error('[SystemCategoryService] Failed to check missing categories:', error);
      throw error;
    }
  }

  /**
   * Initialize system categories for a matter
   * Creates any missing system categories using reserved document IDs
   * @param {string} firmId - The firm ID
   * @param {string} matterId - The matter ID (default: 'general')
   * @returns {Promise<Object>} Result with counts of created and skipped categories
   */
  static async initializesystemcategories(firmId, matterId = 'general') {
    try {
      if (!firmId || typeof firmId !== 'string') {
        throw new Error('Valid firm ID is required');
      }

      console.log(
        `[SystemCategoryService] Initializing system categories for firm ${firmId}, matter ${matterId}`
      );

      // Check which categories are missing
      const missingIds = await this.checkMissingCategories(firmId, matterId);

      if (missingIds.length === 0) {
        console.log('[SystemCategoryService] All system categories already exist');
        return {
          created: 0,
          skipped: SYSTEM_CATEGORY_IDS.length,
          total: SYSTEM_CATEGORY_IDS.length,
        };
      }

      // Create missing categories using batch write
      const batch = writeBatch(db);
      let createdCount = 0;

      for (const categoryId of missingIds) {
        const categoryDef = getSystemCategory(categoryId);
        if (!categoryDef) {
          console.warn(
            `[SystemCategoryService] No definition found for category ID: ${categoryId}`
          );
          continue;
        }

        const categoryRef = doc(db, 'firms', firmId, 'matters', matterId, 'categories', categoryId);

        // Prepare category document
        const categoryDoc = {
          name: categoryDef.name,
          type: categoryDef.type,
          tags: categoryDef.tags || [],
          isActive: true,
          isSystemCategory: true,
          description: categoryDef.description || '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Add type-specific fields
        if (categoryDef.defaultDateFormat) {
          categoryDoc.defaultDateFormat = categoryDef.defaultDateFormat;
        }
        if (categoryDef.defaultTimeFormat) {
          categoryDoc.defaultTimeFormat = categoryDef.defaultTimeFormat;
        }
        if (categoryDef.defaultCurrency) {
          categoryDoc.defaultCurrency = categoryDef.defaultCurrency;
        }

        batch.set(categoryRef, categoryDoc);
        createdCount++;
      }

      // Commit the batch
      await batch.commit();

      console.log(
        `[SystemCategoryService] Successfully created ${createdCount} system categories for matter ${matterId}`
      );

      return {
        created: createdCount,
        skipped: SYSTEM_CATEGORY_IDS.length - createdCount,
        total: SYSTEM_CATEGORY_IDS.length,
      };
    } catch (error) {
      console.error('[SystemCategoryService] Failed to initialize system categories:', error);
      throw error;
    }
  }

  /**
   * Seed the global /systemcategories collection
   * This should be run once by an admin to populate the system categories
   * @returns {Promise<Object>} Result with count of created categories
   */
  static async seedGlobalsystemcategories() {
    try {
      console.log('[SystemCategoryService] Seeding global system categories collection');

      const batch = writeBatch(db);
      let createdCount = 0;

      for (const categoryDef of SYSTEM_CATEGORIES) {
        const categoryRef = doc(db, 'systemcategories', categoryDef.id);

        // Check if already exists
        const existingDoc = await getDoc(categoryRef);
        if (existingDoc.exists()) {
          console.log(
            `[SystemCategoryService] System category ${categoryDef.id} already exists, skipping`
          );
          continue;
        }

        // Prepare category document (exclude the 'id' field since it's the document ID)
        const { id, ...categoryDoc } = categoryDef;
        categoryDoc.createdAt = serverTimestamp();
        categoryDoc.updatedAt = serverTimestamp();

        batch.set(categoryRef, categoryDoc);
        createdCount++;
      }

      await batch.commit();

      console.log(
        `[SystemCategoryService] Successfully seeded ${createdCount} system categories globally`
      );

      return {
        created: createdCount,
        skipped: SYSTEM_CATEGORIES.length - createdCount,
        total: SYSTEM_CATEGORIES.length,
      };
    } catch (error) {
      console.error('[SystemCategoryService] Failed to seed global system categories:', error);
      throw error;
    }
  }

  /**
   * Check if a category ID is a system category
   * @param {string} categoryId - The category ID to check
   * @returns {boolean} True if the category is a system category
   */
  static isSystemCategory(categoryId) {
    return isSystemCategory(categoryId);
  }

  /**
   * Get array of all system category IDs
   * @returns {Array<string>} Array of system category IDs
   */
  static getSystemCategoryIds() {
    return [...SYSTEM_CATEGORY_IDS];
  }

  /**
   * Validate that a system category cannot be deleted
   * @param {string} categoryId - The category ID
   * @throws {Error} If attempting to delete a system category
   */
  static validateNotSystemCategory(categoryId) {
    if (this.isSystemCategory(categoryId)) {
      throw new Error(
        'System categories cannot be deleted. They can be edited but must remain in the system.'
      );
    }
  }
}
