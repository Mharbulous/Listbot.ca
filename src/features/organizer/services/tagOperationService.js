import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../services/firebase.js';
import { EvidenceDocumentService } from './evidenceDocumentService.js';
import tagSubcollectionService from './tagSubcollectionService.js';
import { LogService } from '@/services/logService.js';

/**
 * Tag Operation Service - Handles tag approval/rejection workflow operations
 * Provides operations for managing AI suggested tags and their lifecycle
 */
export class TagOperationService {
  constructor(firmId = null) {
    this.firmId = firmId;
    this.evidenceService = new EvidenceDocumentService(firmId);
    this.tagService = tagSubcollectionService;
  }

  /**
   * Approve an AI suggested tag - converts AI tag to human tag in subcollection
   * @param {string} evidenceId - Evidence document ID
   * @param {string} firmId - Firm ID
   * @param {Object} aiTag - AI tag to approve (must have id from subcollection)
   * @returns {Promise<Object>} - Operation result
   */
  async approveAITag(evidenceId, firmId, aiTag) {
    try {
      if (!aiTag.id) {
        throw new Error('AI tag must have subcollection ID for approval');
      }

      // Get current AI tag from subcollection
      const aiTags = await this.tagService.getPendingTags(evidenceId, this.firmId);
      const currentAITag = aiTags.find((tag) => tag.id === aiTag.id);

      if (!currentAITag) {
        throw new Error('AI tag not found in subcollection');
      }

      // Use the subcollection service's approve method instead of updating directly
      const updatedTag = await this.tagService.approveAITag(evidenceId, aiTag.id, firmId);

      LogService.service('TagOperationService', 'approveAITag', {
        tagName: aiTag.tagName,
        evidenceId,
      });

      return {
        success: true,
        approvedTag: updatedTag,
        evidenceId,
      };
    } catch (error) {
      LogService.error('Failed to approve AI tag', error, {
        service: 'TagOperationService',
        evidenceId,
        tagName: aiTag.tagName,
      });
      throw error;
    }
  }

  /**
   * Reject an AI suggested tag - updates its status to rejected in subcollection
   * @param {string} evidenceId - Evidence document ID
   * @param {string} firmId - Firm ID
   * @param {Object} aiTag - AI tag to reject (must have id from subcollection)
   * @returns {Promise<Object>} - Operation result
   */
  async rejectAITag(evidenceId, firmId, aiTag) {
    try {
      if (!aiTag.id) {
        throw new Error('AI tag must have subcollection ID for rejection');
      }

      // Use the subcollection service's reject method instead of updating directly
      const updatedTag = await this.tagService.rejectAITag(evidenceId, aiTag.id, firmId);

      LogService.service('TagOperationService', 'rejectAITag', {
        tagName: aiTag.tagName,
        evidenceId,
      });

      return {
        success: true,
        rejectedTag: updatedTag,
        evidenceId,
      };
    } catch (error) {
      LogService.error('Failed to reject AI tag', error, {
        service: 'TagOperationService',
        evidenceId,
        tagName: aiTag.tagName,
      });
      throw error;
    }
  }

  /**
   * Process review changes from the AI review modal
   * @param {string} evidenceId - Evidence document ID
   * @param {string} firmId - Firm ID
   * @param {Object} changes - Changes object with approved and rejected arrays
   * @returns {Promise<Object>} - Operation result
   */
  async processReviewChanges(evidenceId, firmId, changes) {
    try {
      const { approved = [], rejected = [] } = changes;
      const results = {
        approvedCount: 0,
        rejectedCount: 0,
        errors: [],
      };

      // Process approvals and rejections sequentially to avoid conflicts
      for (const aiTag of approved) {
        try {
          await this.approveAITag(evidenceId, firmId, aiTag);
          results.approvedCount++;
        } catch (error) {
          LogService.error(`Failed to approve tag ${aiTag.tagName}`, error, {
            service: 'TagOperationService',
            evidenceId,
            tagName: aiTag.tagName,
          });
          results.errors.push({ tag: aiTag, error: error.message, action: 'approve' });
        }
      }

      for (const aiTag of rejected) {
        try {
          await this.rejectAITag(evidenceId, firmId, aiTag);
          results.rejectedCount++;
        } catch (error) {
          LogService.error(`Failed to reject tag ${aiTag.tagName}`, error, {
            service: 'TagOperationService',
            evidenceId,
            tagName: aiTag.tagName,
          });
          results.errors.push({ tag: aiTag, error: error.message, action: 'reject' });
        }
      }

      LogService.service('TagOperationService', 'processReviewChanges', {
        approvedCount: results.approvedCount,
        rejectedCount: results.rejectedCount,
        evidenceId,
      });

      return {
        success: true,
        results,
        evidenceId,
      };
    } catch (error) {
      LogService.error('Failed to process review changes', error, {
        service: 'TagOperationService',
        evidenceId,
      });
      throw error;
    }
  }

  /**
   * Get AI tags with specific status from subcollection
   * @param {string} evidenceId - Evidence document ID
   * @param {string} firmId - Firm ID
   * @param {string} status - Tag status to filter by (optional)
   * @returns {Promise<Array>} - Array of AI tags
   */
  async getAITagsByStatus(evidenceId, firmId, status = null) {
    try {
      // Get all tags and filter for AI source
      const allTags = await this.tagService.getTags(evidenceId, {}, firmId);
      const aiTags = allTags.filter((tag) => tag.source === 'ai');

      if (status === 'pending') {
        return aiTags.filter((tag) => tag.reviewRequired === true);
      } else if (status === 'approved') {
        return aiTags.filter(
          (tag) => tag.autoApproved === true || (tag.reviewRequired === false && tag.reviewedAt)
        );
      } else if (status === 'rejected') {
        return aiTags.filter((tag) => tag.rejected === true);
      }

      return aiTags;
    } catch (error) {
      LogService.error('Failed to get AI tags by status', error, {
        service: 'TagOperationService',
        evidenceId,
        status,
      });
      throw error;
    }
  }
}

export default TagOperationService;
