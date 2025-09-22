import { collection, doc, updateDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.js';

/**
 * Development Tag Service - Handles development tag testing collections
 * Provides CRUD operations for development tag categories and test tags
 */
export class DevTagService {
  /**
   * Soft delete a category (set isActive to false)
   */
  static async softDeleteCategory(categoryId) {
    try {
      const categoriesRef = this.getDevCategoriesCollection();
      const categoryRef = doc(categoriesRef, categoryId);

      await updateDoc(categoryRef, {
        isActive: false,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`[DevTagService] Soft deleted category: ${categoryId}`);
    } catch (error) {
      console.error('[DevTagService] Failed to soft delete category:', error);
      throw error;
    }
  }

  /**
   * Restore a soft deleted category
   */
  static async restoreCategory(categoryId) {
    try {
      const categoriesRef = this.getDevCategoriesCollection();
      const categoryRef = doc(categoriesRef, categoryId);

      await updateDoc(categoryRef, {
        isActive: true,
        deletedAt: null,
        updatedAt: serverTimestamp()
      });

      console.log(`[DevTagService] Restored category: ${categoryId}`);
    } catch (error) {
      console.error('[DevTagService] Failed to restore category:', error);
      throw error;
    }
  }
  /**
   * Get development tag categories collection reference
   */
  static getDevCategoriesCollection() {
    return collection(db, 'devTesting');
  }

  /**
   * Get development test tags collection reference (subcollection)
   */
  static getDevTestTagsCollection() {
    return collection(db, 'devTesting', 'config', 'TestTags');
  }

  /**
   * Create default development categories (original four categories)
   */
  static async initializeDefaultCategories() {
    try {
      // Check if categories already exist
      const existingCategories = await this.getDevCategories();
      if (existingCategories.length > 0) {
        console.log('[DevTagService] Categories already exist, skipping initialization');
        return existingCategories;
      }

      // Triadic color pattern for categories
      const TRIADIC_COLORS = ['#733381', '#589C48', '#F58024']; // Purple, Green, Orange

      const defaultCategories = [
        // Fixed List Categories (read-only for demo)
        {
          id: 'document-type-fixed',
          name: 'Document Type (Fixed)',
          color: TRIADIC_COLORS[0], // Purple
          isActive: true,
          tags: [
            { id: 'd1f', name: 'Invoice', color: TRIADIC_COLORS[0] },
            { id: 'd2f', name: 'Receipt', color: TRIADIC_COLORS[0] },
            { id: 'd3f', name: 'Contract', color: TRIADIC_COLORS[0] },
            { id: 'd4f', name: 'Report', color: TRIADIC_COLORS[0] },
            { id: 'd5f', name: 'Proposal', color: TRIADIC_COLORS[0] },
            { id: 'd6f', name: 'Statement', color: TRIADIC_COLORS[0] },
          ]
        },
        {
          id: 'priority-fixed',
          name: 'Priority (Fixed)',
          color: TRIADIC_COLORS[1], // Green
          isActive: true,
          tags: [
            { id: 'p1f', name: 'High', color: TRIADIC_COLORS[1] },
            { id: 'p2f', name: 'Medium', color: TRIADIC_COLORS[1] },
            { id: 'p3f', name: 'Low', color: TRIADIC_COLORS[1] },
            { id: 'p4f', name: 'Urgent', color: TRIADIC_COLORS[1] },
          ]
        },
        {
          id: 'status-fixed',
          name: 'Status (Fixed)',
          color: TRIADIC_COLORS[2], // Orange
          isActive: true,
          tags: [
            { id: 's1f', name: 'Draft', color: TRIADIC_COLORS[2] },
            { id: 's2f', name: 'Review', color: TRIADIC_COLORS[2] },
            { id: 's3f', name: 'Approved', color: TRIADIC_COLORS[2] },
            { id: 's4f', name: 'Published', color: TRIADIC_COLORS[2] },
          ]
        },
        {
          id: 'year-fixed',
          name: 'Year (Fixed)',
          color: TRIADIC_COLORS[0], // Purple (cycling back)
          isActive: true,
          tags: [
            { id: 'y1f', name: '2024', color: TRIADIC_COLORS[0] },
            { id: 'y2f', name: '2023', color: TRIADIC_COLORS[0] },
            { id: 'y3f', name: '2022', color: TRIADIC_COLORS[0] },
            { id: 'y4f', name: '2021', color: TRIADIC_COLORS[0] },
          ]
        },
        // Open List Categories (editable for demo)
        {
          id: 'document-type-open',
          name: 'Document Type (Open)',
          color: TRIADIC_COLORS[0], // Purple
          isActive: true,
          tags: [
            { id: 'd1o', name: 'Invoice', color: TRIADIC_COLORS[0] },
            { id: 'd2o', name: 'Receipt', color: TRIADIC_COLORS[0] },
            { id: 'd3o', name: 'Contract', color: TRIADIC_COLORS[0] },
            { id: 'd4o', name: 'Report', color: TRIADIC_COLORS[0] },
            { id: 'd5o', name: 'Proposal', color: TRIADIC_COLORS[0] },
            { id: 'd6o', name: 'Statement', color: TRIADIC_COLORS[0] },
          ]
        },
        {
          id: 'priority-open',
          name: 'Priority (Open)',
          color: TRIADIC_COLORS[1], // Green
          isActive: true,
          tags: [
            { id: 'p1o', name: 'High', color: TRIADIC_COLORS[1] },
            { id: 'p2o', name: 'Medium', color: TRIADIC_COLORS[1] },
            { id: 'p3o', name: 'Low', color: TRIADIC_COLORS[1] },
            { id: 'p4o', name: 'Urgent', color: TRIADIC_COLORS[1] },
          ]
        },
        {
          id: 'status-open',
          name: 'Status (Open)',
          color: TRIADIC_COLORS[2], // Orange
          isActive: true,
          tags: [
            { id: 's1o', name: 'Draft', color: TRIADIC_COLORS[2] },
            { id: 's2o', name: 'Review', color: TRIADIC_COLORS[2] },
            { id: 's3o', name: 'Approved', color: TRIADIC_COLORS[2] },
            { id: 's4o', name: 'Published', color: TRIADIC_COLORS[2] },
          ]
        },
        {
          id: 'year-open',
          name: 'Year (Open)',
          color: TRIADIC_COLORS[0], // Purple (cycling back)
          isActive: true,
          tags: [
            { id: 'y1o', name: '2024', color: TRIADIC_COLORS[0] },
            { id: 'y2o', name: '2023', color: TRIADIC_COLORS[0] },
            { id: 'y3o', name: '2022', color: TRIADIC_COLORS[0] },
            { id: 'y4o', name: '2021', color: TRIADIC_COLORS[0] },
          ]
        }
      ];

      // Create categories with fixed document IDs
      const categoriesRef = this.getDevCategoriesCollection();
      const createdCategories = [];

      for (const categoryData of defaultCategories) {
        const categoryDoc = {
          name: categoryData.name,
          color: categoryData.color,
          isActive: categoryData.isActive,
          deletedAt: null,
          tags: categoryData.tags,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Use setDoc with the category ID as document ID
        const categoryRef = doc(categoriesRef, categoryData.id);
        await setDoc(categoryRef, categoryDoc);

        createdCategories.push({
          id: categoryData.id,
          ...categoryDoc
        });

        console.log(`[DevTagService] Created category: ${categoryData.name} (${categoryData.id})`);
      }

      console.log(`[DevTagService] Initialized ${createdCategories.length} default categories`);
      return createdCategories;
    } catch (error) {
      console.error('[DevTagService] Failed to initialize default categories:', error);
      throw error;
    }
  }

  /**
   * Create default test tags (8 tags: 4 fixed + 4 open)
   */
  static async initializeDefaultTestTags() {
    try {
      // First ensure the config document exists
      const configRef = doc(db, 'devTesting', 'config');
      await setDoc(configRef, {
        initialized: true,
        createdAt: serverTimestamp()
      }, { merge: true });

      // Check if test tags already exist
      const existingTags = await this.getDevTestTags();
      if (existingTags.length > 0) {
        console.log(`[DevTagService] Found ${existingTags.length} existing test tags`);

        // Check if existing tags have the correct structure (testCategory field)
        const hasCorrectStructure = existingTags.every(tag => tag.testCategory);

        if (hasCorrectStructure) {
          console.log('[DevTagService] Test tags have correct structure, skipping initialization');
          return existingTags;
        } else {
          console.log('[DevTagService] Test tags have old structure, recreating...');
          // Clear old-format tags and recreate
          const testTagsRef = this.getDevTestTagsCollection();
          const snapshot = await getDocs(testTagsRef);

          for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
          }
          console.log('[DevTagService] Cleared old-format test tags');
        }
      }

      const defaultTestTags = [
        // Fixed list tags (for testing fixed list behavior)
        {
          id: 'fixed1',
          categoryId: 'document-type-fixed',
          categoryName: 'Document Type (Fixed)',
          tagName: 'Invoice',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'fixed', // Test-only field for demo purposes
        },
        {
          id: 'fixed2',
          categoryId: 'priority-fixed',
          categoryName: 'Priority (Fixed)',
          tagName: 'High',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'fixed',
        },
        {
          id: 'fixed3',
          categoryId: 'status-fixed',
          categoryName: 'Status (Fixed)',
          tagName: 'Approved',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'fixed',
        },
        {
          id: 'fixed4',
          categoryId: 'year-fixed',
          categoryName: 'Year (Fixed)',
          tagName: '2024',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'fixed',
        },
        // Open list tags (for testing open behavior)
        {
          id: 'open1',
          categoryId: 'document-type-open',
          categoryName: 'Document Type (Open)',
          tagName: 'Proposal',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'open',
        },
        {
          id: 'open2',
          categoryId: 'priority-open',
          categoryName: 'Priority (Open)',
          tagName: 'Medium',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'open',
        },
        {
          id: 'open3',
          categoryId: 'status-open',
          categoryName: 'Status (Open)',
          tagName: 'Draft',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'open',
        },
        {
          id: 'open4',
          categoryId: 'year-open',
          categoryName: 'Year (Open)',
          tagName: '2023',
          source: 'human',
          confidence: 1.0,
          autoApproved: true,
          reviewRequired: false,
          testCategory: 'open',
        },
      ];

      // Create test tags with fixed document IDs
      const testTagsRef = this.getDevTestTagsCollection();
      const createdTags = [];

      for (const tagData of defaultTestTags) {
        const tagDoc = {
          categoryId: tagData.categoryId,
          categoryName: tagData.categoryName,
          tagName: tagData.tagName,
          source: tagData.source,
          confidence: tagData.confidence,
          autoApproved: tagData.autoApproved,
          reviewRequired: tagData.reviewRequired,
          testCategory: tagData.testCategory, // Test-only field for demo
          createdBy: 'dev-system',
          reviewedAt: null,
          reviewedBy: null,
          humanApproved: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        // Use setDoc with the tag ID as document ID
        const tagRef = doc(testTagsRef, tagData.id);
        await setDoc(tagRef, tagDoc);

        createdTags.push({
          id: tagData.id,
          ...tagDoc
        });

        console.log(`[DevTagService] Created test tag: ${tagData.tagName} (${tagData.id})`);
      }

      console.log(`[DevTagService] Initialized ${createdTags.length} default test tags`);
      return createdTags;
    } catch (error) {
      console.error('[DevTagService] Failed to initialize default test tags:', error);
      throw error;
    }
  }

  /**
   * Get all active development categories (with soft delete handling)
   */
  static async getDevCategories() {
    try {
      const categoriesRef = this.getDevCategoriesCollection();
      const snapshot = await getDocs(categoriesRef);

      const categories = [];
      snapshot.forEach(doc => {
        const data = doc.data();

        // Handle soft delete - treat undefined isActive as true for backward compatibility
        const isActive = data.isActive !== false;

        if (isActive) {
          categories.push({
            id: doc.id,
            ...data
          });
        }
      });

      return categories;
    } catch (error) {
      console.error('[DevTagService] Failed to get dev categories:', error);
      throw error;
    }
  }

  /**
   * Get all development test tags
   */
  static async getDevTestTags() {
    try {
      const testTagsRef = this.getDevTestTagsCollection();
      const snapshot = await getDocs(testTagsRef);

      const testTags = [];
      snapshot.forEach(doc => {
        testTags.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return testTags;
    } catch (error) {
      console.error('[DevTagService] Failed to get dev test tags:', error);
      throw error;
    }
  }

  /**
   * Add a new option to a category
   */
  static async addOptionToCategory(categoryId, newOption) {
    try {
      if (!categoryId || !newOption?.name) {
        throw new Error('Category ID and option name are required');
      }

      // Get current category
      const categoriesRef = this.getDevCategoriesCollection();
      const categoryRef = doc(categoriesRef, categoryId);

      // Get current options
      const categories = await this.getDevCategories();
      const category = categories.find(cat => cat.id === categoryId);

      if (!category) {
        throw new Error(`Category ${categoryId} not found`);
      }

      // Check if tag already exists
      const existingTag = category.tags.find(tag =>
        tag.name.toLowerCase() === newOption.name.toLowerCase()
      );

      if (existingTag) {
        console.log(`[DevTagService] Tag "${newOption.name}" already exists in category ${categoryId}`);
        return category;
      }

      // Add new tag to category
      const updatedTags = [
        ...category.tags,
        {
          id: newOption.id || crypto.randomUUID(),
          name: newOption.name,
          color: category.color // Inherit category color
        }
      ];

      // Update category
      await updateDoc(categoryRef, {
        tags: updatedTags,
        updatedAt: serverTimestamp()
      });

      console.log(`[DevTagService] Added option "${newOption.name}" to category ${categoryId}`);

      return {
        ...category,
        tags: updatedTags
      };
    } catch (error) {
      console.error('[DevTagService] Failed to add option to category:', error);
      throw error;
    }
  }

  /**
   * Clear all development testing data
   */
  static async clearDevTestingData() {
    try {
      console.log('[DevTagService] Clearing development testing data...');

      // Clear test tags first
      const testTagsRef = this.getDevTestTagsCollection();
      const testTagsSnapshot = await getDocs(testTagsRef);

      for (const doc of testTagsSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`[DevTagService] Deleted test tag: ${doc.id}`);
      }

      // Clear config document
      const configRef = doc(db, 'devTesting', 'config');
      try {
        await deleteDoc(configRef);
        console.log('[DevTagService] Deleted config document');
      } catch (error) {
        // Config doc might not exist, that's ok
        console.log('[DevTagService] Config document did not exist');
      }

      // Clear categories
      const categoriesRef = this.getDevCategoriesCollection();
      const categoriesSnapshot = await getDocs(categoriesRef);

      for (const doc of categoriesSnapshot.docs) {
        await deleteDoc(doc.ref);
        console.log(`[DevTagService] Deleted category: ${doc.id}`);
      }

      console.log('[DevTagService] Development testing data cleared successfully');
    } catch (error) {
      console.error('[DevTagService] Failed to clear development testing data:', error);
      throw error;
    }
  }

  /**
   * Initialize complete development environment
   */
  static async initializeDevEnvironment(forceRecreate = false) {
    try {
      console.log('[DevTagService] Initializing development environment...');

      // If force recreate, clear existing data first
      if (forceRecreate) {
        await this.clearDevTestingData();
      }

      // Initialize categories first
      const categories = await this.initializeDefaultCategories();

      // Then initialize test tags
      const testTags = await this.initializeDefaultTestTags();

      console.log('[DevTagService] Development environment initialized successfully');

      return {
        categories,
        testTags
      };
    } catch (error) {
      console.error('[DevTagService] Failed to initialize development environment:', error);
      throw error;
    }
  }
}