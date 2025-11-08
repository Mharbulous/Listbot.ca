import { useAuthStore } from '../../../core/stores/auth.js';
import { AIProcessingService } from './aiProcessingService.js';
import { EvidenceDocumentService } from './evidenceDocumentService.js';
import { TagOperationService } from './tagOperationService.js';
import { FileProcessingService } from './fileProcessingService.js';
import tagSubcollectionService from './tagSubcollectionService.js';

/**
 * AI Tag Service - Handles AI-powered document categorization using Firebase AI Logic
 * Orchestrates between specialized services for single document processing with confidence-based auto-approval
 * Uses subcollection-based tag storage for improved scalability and performance
 */
export class AITagService {
  constructor(firmId = null) {
    this.firmId = firmId;
    this.aiProcessingService = new AIProcessingService();
    this.evidenceService = new EvidenceDocumentService(firmId);
    this.tagOperationService = new TagOperationService(firmId);
    this.fileProcessingService = new FileProcessingService(firmId);
  }

  /**
   * Check if AI features are enabled and properly configured
   * @returns {boolean} - True if AI features are available
   */
  isAIEnabled() {
    return this.aiProcessingService.isAIEnabled();
  }

  /**
   * Get the current firm ID from auth store if not provided in constructor
   * @returns {string} - Current firm ID
   */
  getFirmId() {
    if (this.firmId) {
      return this.firmId;
    }

    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) {
      throw new Error('User not authenticated');
    }

    return authStore.currentFirm;
  }

  /**
   * Process a single document with AI to suggest tags with confidence-based auto-approval
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<Object>} - Processing result with suggested tags and approval stats
   */
  async processSingleDocument(evidenceId) {
    try {
      if (!this.isAIEnabled()) {
        throw new Error('AI features are not enabled or properly configured');
      }

      const firmId = this.getFirmId();

      // Get evidence document
      const evidence = await this.evidenceService.getEvidenceDocumentWithValidation(
        evidenceId,
        firmId
      );

      // Validate file size
      this.aiProcessingService.validateFileSize(evidence);

      // Get file content from Firebase Storage
      const fileContent = await this.fileProcessingService.getFileForProcessing(evidence, firmId);

      // Get user's categories for AI context
      const categories = await this.evidenceService.validateAndGetCategories(firmId);

      // Generate AI suggestions (pass file extension as fallback)
      const extension = this.fileProcessingService.getFileExtension(evidence);
      const aiAlternatives = await this.aiProcessingService.generateTagSuggestions(
        fileContent,
        categories,
        evidence,
        extension
      );

      // Store AI suggestions in subcollection with confidence-based auto-approval
      const storedTags = await this.storeaiAlternativesWithConfidence(evidenceId, aiAlternatives);

      // Get approval statistics
      const stats = await tagSubcollectionService.getTagStats(evidenceId, firmId);

      console.info('[AITagService] processSingleDocument', {
        evidenceId,
        suggestionsCount: aiAlternatives.length,
        autoApproved: stats.autoApproved,
      });

      return {
        success: true,
        evidenceId,
        suggestedTags: storedTags,
        stats,
        processedAt: new Date(),
        categories: categories.length,
        autoApprovalThreshold: tagSubcollectionService.getConfidenceThreshold(),
      };
    } catch (error) {
      console.error('[AITagService] Failed to process document', error, evidenceId);
      throw error;
    }
  }

  /**
   * Get evidence document from Firestore
   * @param {string} evidenceId - Evidence document ID
   * @param {string} firmId - Firm ID
   * @returns {Promise<Object|null>} - Evidence document or null
   */
  async getEvidenceDocument(evidenceId, firmId) {
    return this.evidenceService.getEvidenceDocument(evidenceId, firmId);
  }

  /**
   * Retrieve file content from Firebase Storage for AI processing
   * @param {Object} evidence - Evidence document
   * @returns {Promise<string>} - Base64 encoded file content for AI processing
   */
  async getFileForProcessing(evidence) {
    const firmId = this.getFirmId();
    return this.fileProcessingService.getFileForProcessing(evidence, firmId);
  }

  /**
   * Get user's categories to provide context for AI suggestions
   * @param {string} firmId - Firm ID
   * @returns {Promise<Array>} - Array of category objects
   */
  async getUserCategories(firmId) {
    return this.evidenceService.getUserCategories(firmId);
  }

  /**
   * Generate tag suggestions using Firebase AI Logic
   * @param {string} base64Data - Base64 encoded file content
   * @param {Array} categories - User's categories
   * @param {Object} evidence - Evidence document
   * @param {string} extension - File extension as fallback for MIME type
   * @returns {Promise<Array>} - Array of suggested tags
   */
  async generateTagSuggestions(base64Data, categories, evidence, extension = 'pdf') {
    return this.aiProcessingService.generateTagSuggestions(
      base64Data,
      categories,
      evidence,
      extension
    );
  }

  /**
   * Parse AI response and validate suggestions
   * @param {string} aiResponse - AI response text
   * @param {Array} categories - Available categories
   * @returns {Array} - Validated suggested tags
   */
  parseAIResponse(aiResponse, categories) {
    return this.aiProcessingService.parseAIResponse(aiResponse, categories);
  }

  /**
   * Store AI suggestions in subcollection with confidence-based approval
   * @param {string} evidenceId - Evidence document ID
   * @param {Array} suggestions - AI tag suggestions with confidence scores
   * @returns {Promise<Array>} - Array of stored tag documents
   */
  async storeaiAlternativesWithConfidence(evidenceId, suggestions) {
    try {
      const firmId = this.getFirmId();

      // Transform suggestions to include confidence and metadata with proper constraint fields
      const tagData = suggestions.map((suggestion) => {
        // Convert decimal confidence (0.9) to percentage (90)
        let confidence = suggestion.confidence || 0;
        if (confidence <= 1) {
          confidence = Math.round(confidence * 100);
        } else {
          confidence = Math.round(confidence);
        }

        // Determine auto-approval based on confidence threshold
        const autoApproved = confidence >= tagSubcollectionService.getConfidenceThreshold();

        return {
          categoryId: suggestion.categoryId, // Required for constraint-based deduplication
          categoryName: suggestion.categoryName, // Category display name
          tagName: suggestion.tagName || suggestion.name,
          // Removed color field - use category color as single source of truth
          confidence: confidence,
          source: 'ai',
          autoApproved: autoApproved,
          reviewRequired: !autoApproved, // High confidence tags don't need review
          createdBy: this.getFirmId(), // Use firm ID as creator for AI tags
          metadata: {
            model: 'gemini-pro', // Updated to match actual model
            processingTime: suggestion.processingTime || 0,
            context: suggestion.reasoning || '',
          },
        };
      });

      // Store tags in subcollection (auto-approval handled by service)
      const storedTags = await tagSubcollectionService.addTagsBatch(evidenceId, tagData, firmId);

      return storedTags;
    } catch (error) {
      console.error('[AITagService] Error storing AI suggestions', error, evidenceId);
      throw error;
    }
  }

  /**
   * Store AI suggestions in evidence document (legacy method for compatibility)
   * @param {string} evidenceId - Evidence document ID
   * @param {string} firmId - Firm ID
   * @param {Array} suggestions - AI tag suggestions
   * @returns {Promise<void>}
   */
  async storeaiAlternatives(evidenceId, firmId, suggestions) {
    return this.evidenceService.storeaiAlternatives(evidenceId, firmId, suggestions);
  }

  /**
   * Get MIME type from filename
   * @param {string} filename - File name
   * @returns {string} - MIME type
   */
  getMimeType(filename) {
    return this.aiProcessingService.getMimeType(filename);
  }

  /**
   * Get all tags for a document grouped by status
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<Object>} - Tags grouped by status (pending, approved, rejected)
   */
  async getTagsByStatus(evidenceId) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.getTagsByStatus(evidenceId, firmId);
  }

  /**
   * Get approved tags for a document
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<Array>} - Array of approved tags
   */
  async getApprovedTags(evidenceId) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.getApprovedTags(evidenceId, firmId);
  }

  /**
   * Get pending tags for a document
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<Array>} - Array of pending tags
   */
  async getPendingTags(evidenceId) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.getPendingTags(evidenceId, firmId);
  }

  /**
   * Approve an AI suggested tag using subcollection service
   * @param {string} evidenceId - Evidence document ID
   * @param {string} tagId - Tag ID to approve
   * @returns {Promise<Object>} - Operation result
   */
  async approveAITag(evidenceId, tagId) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.approveTag(evidenceId, tagId, firmId);
  }

  /**
   * Reject an AI suggested tag using subcollection service
   * @param {string} evidenceId - Evidence document ID
   * @param {string} tagId - Tag ID to reject
   * @returns {Promise<Object>} - Operation result
   */
  async rejectAITag(evidenceId, tagId) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.rejectTag(evidenceId, tagId, firmId);
  }

  /**
   * Bulk approve multiple tags
   * @param {string} evidenceId - Evidence document ID
   * @param {Array} tagIds - Array of tag IDs to approve
   * @returns {Promise<Object>} - Operation result
   */
  async approveTagsBatch(evidenceId, tagIds) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.approveTagsBatch(evidenceId, tagIds, firmId);
  }

  /**
   * Bulk reject multiple tags
   * @param {string} evidenceId - Evidence document ID
   * @param {Array} tagIds - Array of tag IDs to reject
   * @returns {Promise<Object>} - Operation result
   */
  async rejectTagsBatch(evidenceId, tagIds) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.rejectTagsBatch(evidenceId, tagIds, firmId);
  }

  /**
   * Get tag statistics for a document
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<Object>} - Tag statistics
   */
  async getTagStats(evidenceId) {
    const firmId = this.getFirmId();
    return tagSubcollectionService.getTagStats(evidenceId, firmId);
  }

  /**
   * Set confidence threshold for auto-approval
   * @param {number} threshold - Confidence threshold (0-100)
   */
  setConfidenceThreshold(threshold) {
    tagSubcollectionService.setConfidenceThreshold(threshold);
  }

  /**
   * Get current confidence threshold
   * @returns {number} - Current confidence threshold
   */
  getConfidenceThreshold() {
    return tagSubcollectionService.getConfidenceThreshold();
  }

  /**
   * Process review changes from the AI review modal (legacy compatibility)
   * @param {string} evidenceId - Evidence document ID
   * @param {Object} changes - Changes object with approved and rejected arrays
   * @returns {Promise<Object>} - Operation result
   */
  async processReviewChanges(evidenceId, changes) {
    const firmId = this.getFirmId();
    return this.tagOperationService.processReviewChanges(evidenceId, firmId, changes);
  }
}

export default AITagService;
