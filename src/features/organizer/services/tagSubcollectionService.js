import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDoc,
  deleteField,
} from 'firebase/firestore';
import { db } from '../../../services/firebase.js';
import { LogService } from '@/services/logService.js';

/**
 * Service for managing tags in Firestore subcollections (NEW structure)
 *
 * Data Structure:
 * /firms/{firmId}/evidence/{docId}/tags/{categoryId}
 *
 * Tag Document Structure:
 * {
 *   tagName: string,           // The actual tag text
 *   confidence: number,        // AI confidence score (0-100)
 *   status: string,           // 'pending' | 'approved' | 'rejected'
 *   autoApproved: boolean,    // Whether auto-approved by confidence threshold
 *   createdAt: timestamp,     // When tag was generated
 *   reviewedAt: timestamp,    // When tag was manually reviewed (if applicable)
 *   source: string,          // 'ai' | 'manual' | 'bulk_import'
 *   metadata: {              // Optional AI processing metadata
 *     model: string,         // AI model used
 *     processingTime: number,// Time taken to generate
 *     context: string        // Additional context used
 *   }
 * }
 */

class TagSubcollectionService {
  constructor() {
    this.confidenceThreshold = 85; // Default auto-approval threshold
  }

  /**
   * Get reference to tags subcollection for a document
   */
  getTagsCollection(docId, firmId) {
    if (!firmId) {
      throw new Error('Firm ID is required for tag operations');
    }
    return collection(db, 'firms', firmId, 'matters', 'general', 'evidence', docId, 'tags');
  }

  /**
   * Get reference to a specific tag document
   */
  getTagDoc(docId, tagId, firmId) {
    if (!firmId) {
      throw new Error('Firm ID is required for tag operations');
    }
    return doc(db, 'firms', firmId, 'matters', 'general', 'evidence', docId, 'tags', tagId);
  }

  /**
   * Get reference to evidence document (for embedded tags sync)
   */
  getEvidenceDoc(docId, firmId) {
    if (!firmId) {
      throw new Error('Firm ID is required for tag operations');
    }
    return doc(db, 'firms', firmId, 'matters', 'general', 'evidence', docId);
  }

  /**
   * Add a new tag to a document (using NEW data structure with categoryId as document ID)
   * OPTIMIZED: Uses batch writes to sync both subcollection AND embedded tags map
   */
  async addTag(docId, tagData, firmId) {
    try {
      const tagsCollection = this.getTagsCollection(docId, firmId);

      // Use categoryId as the document ID (per migration plan)
      if (!tagData.categoryId) {
        throw new Error('categoryId is required for new tag structure');
      }

      // Determine status based on auto-approval (for consistency with previous batch logic)
      const autoApproved = tagData.autoApproved ?? tagData.confidence >= this.confidenceThreshold;
      const status = autoApproved ? 'approved' : 'pending';

      // Create the tag document with NEW structure from migration plan
      const tagDoc = {
        categoryId: tagData.categoryId,
        categoryName: tagData.categoryName,
        tagName: tagData.tagName,
        // Removed color field - use category color as single source of truth
        source: tagData.source,
        confidence: tagData.confidence,
        status: status,
        autoApproved: autoApproved,
        reviewRequired: tagData.reviewRequired,
        createdAt: serverTimestamp(),
        createdBy: tagData.createdBy,
        metadata: tagData.metadata || {},
      };

      // Add reviewedAt timestamp if this is an auto-approved AI tag
      if (autoApproved && tagData.source !== 'human') {
        tagDoc.reviewedAt = serverTimestamp();
      }

      // Use batch writes to sync both subcollection and embedded tags
      const batch = writeBatch(db);

      // Write to subcollection (audit trail, full metadata)
      const tagDocRef = doc(tagsCollection, tagData.categoryId);
      batch.set(tagDocRef, tagDoc);

      // Write to parent document embedded tags (fast table access)
      const evidenceRef = this.getEvidenceDoc(docId, firmId);
      const embeddedTag = {
        tagName: tagData.tagName,
        confidence: tagData.confidence,
        autoApproved: autoApproved,
        reviewRequired: tagData.reviewRequired,
        source: tagData.source,
        createdAt: serverTimestamp(),
      };
      if (autoApproved && tagData.source !== 'human') {
        embeddedTag.reviewedAt = serverTimestamp();
      }
      batch.update(evidenceRef, {
        [`tags.${tagData.categoryId}`]: embeddedTag
      });

      await batch.commit();

      return { id: tagData.categoryId, ...tagDoc };
    } catch (error) {
      LogService.error('Error adding tag', error, {
        service: 'TagSubcollectionService',
        docId,
        categoryId: tagData.categoryId,
      });
      throw error;
    }
  }

  /**
   * Add multiple tags by calling addTag() for each one
   * This ensures consistency and reduces code duplication
   */
  async addTagsBatch(docId, tagsArray, firmId) {
    try {
      const addedTags = [];

      // Process each tag individually using the single addTag method
      for (const tagData of tagsArray) {
        const addedTag = await this.addTag(docId, tagData, firmId);
        addedTags.push(addedTag);
      }

      return addedTags;
    } catch (error) {
      LogService.error('Error adding tags batch', error, {
        service: 'TagSubcollectionService',
        docId,
        count: tagsArray.length,
      });
      throw error;
    }
  }

  /**
   * Get all tags for a document (NEW structure)
   */
  async getTags(docId, options = {}, firmId) {
    try {
      const tagsCollection = this.getTagsCollection(docId, firmId);
      let q = query(tagsCollection, orderBy('createdAt', 'desc'));

      // Note: No longer filtering by 'status' field - using new structure with autoApproved/reviewRequired
      // Filtering now handled by getTagsByStatus method

      const querySnapshot = await getDocs(q);
      const tags = [];

      querySnapshot.forEach((doc) => {
        tags.push({
          id: doc.id, // This is now the categoryId
          ...doc.data(),
        });
      });

      return tags;
    } catch (error) {
      LogService.error('Error getting tags', error, {
        service: 'TagSubcollectionService',
        docId,
      });
      throw error;
    }
  }

  /**
   * Get tags grouped by status (NEW structure using autoApproved/reviewRequired)
   */
  async getTagsByStatus(docId, firmId) {
    try {
      const allTags = await this.getTags(docId, {}, firmId);

      return {
        // Pending: AI tags that need review (reviewRequired = true)
        pending: allTags.filter((tag) => tag.reviewRequired === true),
        // Approved: Either human tags or auto-approved AI tags or manually approved AI tags
        approved: allTags.filter(
          (tag) =>
            tag.source === 'human' ||
            tag.autoApproved === true ||
            (tag.source === 'ai' && tag.reviewRequired === false && tag.reviewedAt)
        ),
        // Rejected: AI tags that were manually rejected (for future use)
        rejected: allTags.filter((tag) => tag.rejected === true), // New field for rejected tags
      };
    } catch (error) {
      LogService.error('Error getting tags by status', error, {
        service: 'TagSubcollectionService',
        docId,
      });
      throw error;
    }
  }

  /**
   * Get only approved tags for a document (NEW structure)
   */
  async getApprovedTags(docId, firmId) {
    const tagsByStatus = await this.getTagsByStatus(docId, firmId);
    return tagsByStatus.approved;
  }

  /**
   * Get only pending tags for a document (NEW structure)
   */
  async getPendingTags(docId, firmId) {
    const tagsByStatus = await this.getTagsByStatus(docId, firmId);
    return tagsByStatus.pending;
  }

  /**
   * Approve an AI tag (NEW structure)
   * OPTIMIZED: Uses batch writes to sync both subcollection AND embedded tags map
   */
  async approveAITag(docId, categoryId, firmId) {
    try {
      const batch = writeBatch(db);

      // Update subcollection (full metadata, audit trail)
      const tagRef = this.getTagDoc(docId, categoryId, firmId);
      const updateData = {
        reviewRequired: false,
        reviewedAt: serverTimestamp(),
        humanApproved: true,
      };
      batch.update(tagRef, updateData);

      // Update embedded tag in evidence document (fast table access)
      const evidenceRef = this.getEvidenceDoc(docId, firmId);
      batch.update(evidenceRef, {
        [`tags.${categoryId}.reviewRequired`]: false,
        [`tags.${categoryId}.reviewedAt`]: serverTimestamp(),
      });

      await batch.commit();
      return { id: categoryId, ...updateData };
    } catch (error) {
      LogService.error('Error approving AI tag', error, {
        service: 'TagSubcollectionService',
        docId,
        categoryId,
      });
      throw error;
    }
  }

  /**
   * Reject an AI tag (NEW structure)
   * OPTIMIZED: Uses batch writes to sync both subcollection AND embedded tags map
   * Rejected tags are removed from embedded tags (not displayed in table)
   */
  async rejectAITag(docId, categoryId, firmId) {
    try {
      const batch = writeBatch(db);

      // Update subcollection (full metadata, audit trail - keeps rejected tags for history)
      const tagRef = this.getTagDoc(docId, categoryId, firmId);
      const updateData = {
        reviewRequired: false,
        rejected: true,
        reviewedAt: serverTimestamp(),
        humanRejected: true,
      };
      batch.update(tagRef, updateData);

      // Remove from embedded tags (rejected tags should not appear in table)
      const evidenceRef = this.getEvidenceDoc(docId, firmId);
      batch.update(evidenceRef, {
        [`tags.${categoryId}`]: deleteField(),
      });

      await batch.commit();
      return { id: categoryId, ...updateData };
    } catch (error) {
      LogService.error('Error rejecting AI tag', error, {
        service: 'TagSubcollectionService',
        docId,
        categoryId,
      });
      throw error;
    }
  }

  /**
   * Approve a tag (compatibility wrapper for NEW structure)
   */
  async approveTag(docId, categoryId, firmId) {
    return await this.approveAITag(docId, categoryId, firmId);
  }

  /**
   * Reject a tag (compatibility wrapper for NEW structure)
   */
  async rejectTag(docId, categoryId, firmId) {
    return await this.rejectAITag(docId, categoryId, firmId);
  }

  /**
   * Bulk approve multiple tags (NEW structure)
   * OPTIMIZED: Syncs both subcollection AND embedded tags map in single batch
   */
  async approveTagsBatch(docId, categoryIds, firmId) {
    try {
      const batch = writeBatch(db);
      const evidenceRef = this.getEvidenceDoc(docId, firmId);

      for (const categoryId of categoryIds) {
        // Update subcollection (audit trail, full metadata)
        const tagRef = this.getTagDoc(docId, categoryId, firmId);
        batch.update(tagRef, {
          reviewRequired: false,
          reviewedAt: serverTimestamp(),
          humanApproved: true,
        });

        // Update embedded tag (fast table access)
        batch.update(evidenceRef, {
          [`tags.${categoryId}.reviewRequired`]: false,
          [`tags.${categoryId}.reviewedAt`]: serverTimestamp(),
        });
      }

      await batch.commit();
      return { approved: categoryIds.length };
    } catch (error) {
      LogService.error('Error approving tags batch', error, {
        service: 'TagSubcollectionService',
        docId,
        count: categoryIds.length,
      });
      throw error;
    }
  }

  /**
   * Bulk reject multiple tags (NEW structure)
   * OPTIMIZED: Syncs both subcollection AND embedded tags map in single batch
   * Rejected tags are removed from embedded tags (not displayed in table)
   */
  async rejectTagsBatch(docId, categoryIds, firmId) {
    try {
      const batch = writeBatch(db);
      const evidenceRef = this.getEvidenceDoc(docId, firmId);

      for (const categoryId of categoryIds) {
        // Update subcollection (audit trail - keeps rejected tags for history)
        const tagRef = this.getTagDoc(docId, categoryId, firmId);
        batch.update(tagRef, {
          reviewRequired: false,
          rejected: true,
          reviewedAt: serverTimestamp(),
          humanRejected: true,
        });

        // Remove from embedded tags (rejected tags should not appear in table)
        batch.update(evidenceRef, {
          [`tags.${categoryId}`]: deleteField(),
        });
      }

      await batch.commit();
      return { rejected: categoryIds.length };
    } catch (error) {
      LogService.error('Error rejecting tags batch', error, {
        service: 'TagSubcollectionService',
        docId,
        count: categoryIds.length,
      });
      throw error;
    }
  }

  /**
   * Delete a tag
   * OPTIMIZED: Uses batch writes to sync both subcollection AND embedded tags map
   */
  async deleteTag(docId, tagId, firmId) {
    try {
      const batch = writeBatch(db);

      // Delete from subcollection (removes audit trail)
      const tagRef = this.getTagDoc(docId, tagId, firmId);
      batch.delete(tagRef);

      // Remove from embedded tags (removes from table display)
      const evidenceRef = this.getEvidenceDoc(docId, firmId);
      batch.update(evidenceRef, {
        [`tags.${tagId}`]: deleteField(),
      });

      await batch.commit();
      return { id: tagId, deleted: true };
    } catch (error) {
      LogService.error('Error deleting tag', error, {
        service: 'TagSubcollectionService',
        docId,
        tagId,
      });
      throw error;
    }
  }

  /**
   * Delete all tags for a document
   * OPTIMIZED: Syncs both subcollection deletion AND embedded tags reset
   */
  async deleteAllTags(docId, firmId) {
    try {
      const tags = await this.getTags(docId, {}, firmId);
      const batch = writeBatch(db);

      // Delete all tag subcollection documents (removes audit trail)
      for (const tag of tags) {
        const tagRef = this.getTagDoc(docId, tag.id, firmId);
        batch.delete(tagRef);
      }

      // Reset embedded tags map to empty object (clears table display)
      const evidenceRef = this.getEvidenceDoc(docId, firmId);
      batch.update(evidenceRef, {
        tags: {},
      });

      await batch.commit();
      return { deleted: tags.length };
    } catch (error) {
      LogService.error('Error deleting all tags', error, {
        service: 'TagSubcollectionService',
        docId,
      });
      throw error;
    }
  }

  /**
   * Get tag statistics for a document
   */
  async getTagStats(docId, firmId) {
    try {
      const tags = await this.getTags(docId, {}, firmId);

      const stats = {
        total: tags.length,
        pending: 0,
        approved: 0,
        rejected: 0,
        autoApproved: 0,
        manuallyReviewed: 0,
        avgConfidence: 0,
        highConfidence: 0, // Count of tags above threshold
      };

      if (tags.length === 0) return stats;

      let confidenceSum = 0;

      for (const tag of tags) {
        stats[tag.status]++;

        if (tag.autoApproved) {
          stats.autoApproved++;
        }

        if (tag.reviewedAt && !tag.autoApproved) {
          stats.manuallyReviewed++;
        }

        confidenceSum += tag.confidence;

        if (tag.confidence >= this.confidenceThreshold) {
          stats.highConfidence++;
        }
      }

      stats.avgConfidence = Math.round(confidenceSum / tags.length);

      return stats;
    } catch (error) {
      LogService.error('Error getting tag stats', error, {
        service: 'TagSubcollectionService',
        docId,
      });
      throw error;
    }
  }

  /**
   * Update confidence threshold for auto-approval
   */
  setConfidenceThreshold(threshold) {
    this.confidenceThreshold = Math.max(0, Math.min(100, threshold));
  }

  /**
   * Get current confidence threshold
   */
  getConfidenceThreshold() {
    return this.confidenceThreshold;
  }

  /**
   * Check if a tag document exists
   */
  async tagExists(docId, tagId, firmId) {
    try {
      const tagRef = this.getTagDoc(docId, tagId, firmId);
      const doc = await getDoc(tagRef);
      return doc.exists();
    } catch (error) {
      LogService.error('Error checking tag existence', error, {
        service: 'TagSubcollectionService',
        docId,
        tagId,
      });
      return false;
    }
  }

  /**
   * Find duplicate tags by name
   */
  async findDuplicateTags(docId, tagName, firmId) {
    try {
      const tagsCollection = this.getTagsCollection(docId, firmId);
      const q = query(tagsCollection, where('tagName', '==', tagName));
      const querySnapshot = await getDocs(q);

      const duplicates = [];
      querySnapshot.forEach((doc) => {
        duplicates.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return duplicates;
    } catch (error) {
      LogService.error('Error finding duplicate tags', error, {
        service: 'TagSubcollectionService',
        docId,
        tagName,
      });
      throw error;
    }
  }
}

export default new TagSubcollectionService();
