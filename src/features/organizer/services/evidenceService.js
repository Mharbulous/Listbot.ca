import { db } from '../../../services/firebase.js';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';

/**
 * Evidence Service - Manages core CRUD operations for evidence documents in Firestore
 * Handles creation, updating, deletion, and basic retrieval of evidence entries
 */
export class EvidenceService {
  constructor(firmId, matterId) {
    this.firmId = firmId;
    this.matterId = matterId;

    if (!this.matterId) {
      throw new Error('EvidenceService requires a matterId. Please select a matter first.');
    }
  }

  /**
   * Create a new evidence document from uploaded source file metadata
   * @param {Object} uploadMetadata - Source file metadata from the upload system
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Evidence document ID (fileHash)
   */
  async createEvidenceFromUpload(uploadMetadata, options = {}) {
    try {
      if (!uploadMetadata.hash || !uploadMetadata.sourceFileName) {
        throw new Error('Missing required upload metadata: hash and sourceFileName');
      }

      // Use fileHash as document ID
      const fileHash = uploadMetadata.hash;
      const metadataHash = uploadMetadata.metadataHash;

      // Create evidence document with simplified structure
      const evidenceData = {
        // Display configuration (simplified to just metadataHash string)
        displayCopy: metadataHash,

        // Source file properties (for quick access)
        fileSize: uploadMetadata.size || 0,

        // Processing status (for future Document Processing Workflow)
        isProcessed: false,
        hasAllPages: null, // null = unknown, true/false after processing
        processingStage: 'uploaded', // uploaded|splitting|merging|complete

        // Tag counters (for subcollection)
        tagCount: 0,
        autoApprovedCount: 0,
        reviewRequiredCount: 0,

        // Timestamps
        updatedAt: serverTimestamp(),
      };

      // Use setDoc with fileHash as document ID (automatic deduplication)
      const docRef = doc(db, 'firms', this.firmId, 'matters', this.matterId, 'evidence', fileHash);
      await setDoc(docRef, evidenceData);

      console.log(`[EvidenceService] Created evidence document: ${fileHash.substring(0, 8)}...`, {
        metadataHash: metadataHash.substring(0, 8) + '...',
        fileHash: fileHash.substring(0, 8) + '...',
        processingStage: evidenceData.processingStage,
      });

      return fileHash;
    } catch (error) {
      console.error('[EvidenceService] Failed to create evidence:', error);
      throw error;
    }
  }

  /**
   * Batch create evidence documents from multiple uploaded source files
   * @param {Array} uploadMetadataList - Array of source file upload metadata objects
   * @returns {Promise<Array>} - Array of evidence document IDs (fileHashes)
   */
  async createEvidenceFromUploads(uploadMetadataList) {
    try {
      if (!Array.isArray(uploadMetadataList) || uploadMetadataList.length === 0) {
        return [];
      }

      const batch = writeBatch(db);
      const evidenceIds = [];

      for (const uploadMetadata of uploadMetadataList) {
        const fileHash = uploadMetadata.hash;
        const evidenceRef = doc(
          db,
          'firms',
          this.firmId,
          'matters',
          this.matterId,
          'evidence',
          fileHash
        );
        evidenceIds.push(fileHash);

        const evidenceData = {
          // Simplified displayCopy (just metadataHash string)
          displayCopy: uploadMetadata.metadataHash || 'temp-hash',

          fileSize: uploadMetadata.size || 0,

          isProcessed: false,
          hasAllPages: null,
          processingStage: 'uploaded',

          // Tag counters
          tagCount: 0,
          autoApprovedCount: 0,
          reviewRequiredCount: 0,

          updatedAt: serverTimestamp(),
        };

        batch.set(evidenceRef, evidenceData);
      }

      await batch.commit();

      console.log(`[EvidenceService] Batch created ${evidenceIds.length} evidence documents`);
      return evidenceIds;
    } catch (error) {
      console.error('[EvidenceService] Failed to batch create evidence:', error);
      throw error;
    }
  }

  /**
   * Update display name for an evidence document
   * @param {string} evidenceId - Evidence document ID
   * @param {string} displayName - New display name
   * @returns {Promise<void>}
   */
  async updateDisplayName(evidenceId, displayName) {
    try {
      if (!displayName || !displayName.trim()) {
        throw new Error('Display name cannot be empty');
      }

      const evidenceRef = doc(
        db,
        'firms',
        this.firmId,
        'matters',
        this.matterId,
        'evidence',
        evidenceId
      );
      await updateDoc(evidenceRef, {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp(),
      });

      console.log(`[EvidenceService] Updated display name for ${evidenceId}: ${displayName}`);
    } catch (error) {
      console.error('[EvidenceService] Failed to update display name:', error);
      throw error;
    }
  }

  /**
   * Update processing stage for an evidence document
   * @param {string} evidenceId - Evidence document ID
   * @param {string} stage - Processing stage
   * @param {Object} additionalData - Additional data to update
   * @returns {Promise<void>}
   */
  async updateProcessingStage(evidenceId, stage, additionalData = {}) {
    try {
      const validStages = ['uploaded', 'splitting', 'merging', 'complete'];
      if (!validStages.includes(stage)) {
        throw new Error(`Invalid processing stage: ${stage}`);
      }

      const updateData = {
        processingStage: stage,
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      const evidenceRef = doc(
        db,
        'firms',
        this.firmId,
        'matters',
        this.matterId,
        'evidence',
        evidenceId
      );
      await updateDoc(evidenceRef, updateData);

      console.log(`[EvidenceService] Updated processing stage for ${evidenceId}: ${stage}`);
    } catch (error) {
      console.error('[EvidenceService] Failed to update processing stage:', error);
      throw error;
    }
  }

  /**
   * Delete an evidence document
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<void>}
   */
  async deleteEvidence(evidenceId) {
    try {
      const evidenceRef = doc(
        db,
        'firms',
        this.firmId,
        'matters',
        this.matterId,
        'evidence',
        evidenceId
      );
      await deleteDoc(evidenceRef);

      console.log(`[EvidenceService] Deleted evidence document: ${evidenceId}`);
    } catch (error) {
      console.error('[EvidenceService] Failed to delete evidence:', error);
      throw error;
    }
  }

  /**
   * Get evidence document by ID
   * @param {string} evidenceId - Evidence document ID
   * @returns {Promise<Object|null>} - Evidence document or null if not found
   */
  async getEvidence(evidenceId) {
    try {
      const evidenceRef = doc(
        db,
        'firms',
        this.firmId,
        'matters',
        this.matterId,
        'evidence',
        evidenceId
      );
      const docSnap = await getDoc(evidenceRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('[EvidenceService] Failed to get evidence:', error);
      throw error;
    }
  }

  /**
   * Get all source metadata variants for a file (all copies with different names/dates)
   * @param {string} fileHash - Evidence document ID (file hash)
   * @returns {Promise<Array>} - Array of metadata variants sorted by lastModified (oldest to newest)
   */
  async getAllSourceMetadata(fileHash) {
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');

      const metadataRef = collection(
        db,
        'firms',
        this.firmId,
        'matters',
        this.matterId,
        'evidence',
        fileHash,
        'sourceMetadata'
      );

      // Query and sort by lastModified (oldest first)
      const metadataQuery = query(metadataRef, orderBy('lastModified', 'asc'));
      const querySnapshot = await getDocs(metadataQuery);

      const variants = [];
      querySnapshot.forEach((doc) => {
        variants.push({
          metadataHash: doc.id,
          ...doc.data(),
        });
      });

      console.log(
        `[EvidenceService] Found ${variants.length} metadata variants for ${fileHash.substring(0, 8)}...`
      );

      return variants;
    } catch (error) {
      console.error('[EvidenceService] Failed to get source metadata variants:', error);
      throw error;
    }
  }
}

export default EvidenceService;
