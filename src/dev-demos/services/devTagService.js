import { collection, doc, addDoc, updateDoc, getDocs, setDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase.js';

/**
 * Development Tag Service - Handles development tag testing collections
 * Provides CRUD operations for development tag categories and test tags
 */
export class DevTagService {
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

      const defaultCategories = [
        {
          id: 'document-type',
          name: 'Document Type',
          options: [
            { id: 'd1', name: 'Invoice', source: 'ai' },
            { id: 'd2', name: 'Receipt', source: 'human' },
            { id: 'd3', name: 'Contract', source: 'human' },
            { id: 'd4', name: 'Report', source: 'ai' },
            { id: 'd5', name: 'Proposal', source: 'human' },
            { id: 'd6', name: 'Statement', source: 'ai' },
          ]
        },
        {
          id: 'priority',
          name: 'Priority',
          options: [
            { id: 'p1', name: 'High', source: 'ai' },
            { id: 'p2', name: 'Medium', source: 'human' },
            { id: 'p3', name: 'Low', source: 'ai' },
            { id: 'p4', name: 'Urgent', source: 'human' },
          ]
        },
        {
          id: 'status',
          name: 'Status',
          options: [
            { id: 's1', name: 'Draft', source: 'human' },
            { id: 's2', name: 'Review', source: 'ai' },
            { id: 's3', name: 'Approved', source: 'human' },
            { id: 's4', name: 'Published', source: 'ai' },
          ]
        },
        {
          id: 'year',
          name: 'Year',
          options: Array.from({ length: 76 }, (_, i) => ({
            id: `y${i + 1}`,
            name: (2025 - i).toString(),
            source: i % 2 === 0 ? 'ai' : 'human',
          }))
        }
      ];

      // Create categories with fixed document IDs
      const categoriesRef = this.getDevCategoriesCollection();
      const createdCategories = [];

      for (const categoryData of defaultCategories) {
        const categoryDoc = {
          name: categoryData.name,
          options: categoryData.options,
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
   * Create default test tags (8 tags: 4 locked + 4 open)
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
        console.log('[DevTagService] Test tags already exist, skipping initialization');
        return existingTags;
      }

      const defaultTestTags = [
        // Locked category tags
        {
          id: 'locked1',
          categoryId: 'document-type',
          tagName: 'Invoice',
          isOpenCategory: false,
          source: 'system',
          confidence: 100,
        },
        {
          id: 'locked2',
          categoryId: 'priority',
          tagName: 'High',
          isOpenCategory: false,
          source: 'system',
          confidence: 100,
        },
        {
          id: 'locked3',
          categoryId: 'status',
          tagName: 'Approved',
          isOpenCategory: false,
          source: 'system',
          confidence: 100,
        },
        {
          id: 'locked4',
          categoryId: 'year',
          tagName: '2024',
          isOpenCategory: false,
          source: 'system',
          confidence: 100,
        },
        // Open category tags
        {
          id: 'open1',
          categoryId: 'document-type',
          tagName: 'Proposal',
          isOpenCategory: true,
          source: 'human',
          confidence: 100,
        },
        {
          id: 'open2',
          categoryId: 'priority',
          tagName: 'Medium',
          isOpenCategory: true,
          source: 'human',
          confidence: 100,
        },
        {
          id: 'open3',
          categoryId: 'status',
          tagName: 'Draft',
          isOpenCategory: true,
          source: 'human',
          confidence: 100,
        },
        {
          id: 'open4',
          categoryId: 'year',
          tagName: '2023',
          isOpenCategory: true,
          source: 'human',
          confidence: 100,
        },
      ];

      // Create test tags with fixed document IDs
      const testTagsRef = this.getDevTestTagsCollection();
      const createdTags = [];

      for (const tagData of defaultTestTags) {
        const tagDoc = {
          categoryId: tagData.categoryId,
          tagName: tagData.tagName,
          isOpenCategory: tagData.isOpenCategory,
          source: tagData.source,
          confidence: tagData.confidence,
          // Add reactive properties required by EditableTag
          isOpen: false,
          isHeaderEditing: false,
          hasStartedTyping: false,
          filterText: '',
          filterTextRaw: '',
          isFiltering: false,
          highlightedIndex: -1,
          customInputValue: '',
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
   * Get all development categories
   */
  static async getDevCategories() {
    try {
      const categoriesRef = this.getDevCategoriesCollection();
      const snapshot = await getDocs(categoriesRef);

      const categories = [];
      snapshot.forEach(doc => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
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

      // Check if option already exists
      const existingOption = category.options.find(opt =>
        opt.name.toLowerCase() === newOption.name.toLowerCase()
      );

      if (existingOption) {
        console.log(`[DevTagService] Option "${newOption.name}" already exists in category ${categoryId}`);
        return category;
      }

      // Add new option
      const updatedOptions = [
        ...category.options,
        {
          id: newOption.id || crypto.randomUUID(),
          name: newOption.name,
          source: newOption.source || 'human'
        }
      ];

      // Update category
      await updateDoc(categoryRef, {
        options: updatedOptions,
        updatedAt: serverTimestamp()
      });

      console.log(`[DevTagService] Added option "${newOption.name}" to category ${categoryId}`);

      return {
        ...category,
        options: updatedOptions
      };
    } catch (error) {
      console.error('[DevTagService] Failed to add option to category:', error);
      throw error;
    }
  }

  /**
   * Initialize complete development environment
   */
  static async initializeDevEnvironment() {
    try {
      console.log('[DevTagService] Initializing development environment...');

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