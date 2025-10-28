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
  Timestamp,
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

      // Convert Storage timestamp to Firestore Timestamp, or fallback to serverTimestamp
      let uploadDateTimestamp;
      if (uploadMetadata.storageCreatedTimestamp) {
        try {
          uploadDateTimestamp = Timestamp.fromDate(new Date(uploadMetadata.storageCreatedTimestamp));
        } catch (error) {
          console.warn('[EvidenceService] Failed to convert Storage timestamp, using serverTimestamp:', error);
          uploadDateTimestamp = serverTimestamp();
        }
      } else {
        uploadDateTimestamp = serverTimestamp();
      }

      // Create evidence document with simplified structure
      const evidenceData = {
        // Display configuration (simplified to just metadataHash string)
        sourceID: metadataHash,

        // Source file properties (for quick access)
        fileSize: uploadMetadata.size || 0,
        fileType: uploadMetadata.fileType || '', // MIME type from source file

        // Processing status (for future Document Processing Workflow)
        isProcessed: false,
        hasAllPages: null, // null = unknown, true/false after processing
        processingStage: 'uploaded', // uploaded|splitting|merging|complete

        // Tag counters (for subcollection)
        tagCount: 0,
        autoApprovedCount: 0,
        reviewRequiredCount: 0,

        // Timestamps
        uploadDate: uploadDateTimestamp,
      };

      // Use setDoc with fileHash as document ID (automatic deduplication)
      const docRef = doc(db, 'firms', this.firmId, 'matters', this.matterId, 'evidence', fileHash);
      await setDoc(docRef, evidenceData);

      return fileHash;
    } catch (error) {
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

        // Convert Storage timestamp to Firestore Timestamp, or fallback to serverTimestamp
        let uploadDateTimestamp;
        if (uploadMetadata.storageCreatedTimestamp) {
          try {
            uploadDateTimestamp = Timestamp.fromDate(new Date(uploadMetadata.storageCreatedTimestamp));
          } catch (error) {
            console.warn('[EvidenceService] Failed to convert Storage timestamp, using serverTimestamp:', error);
            uploadDateTimestamp = serverTimestamp();
          }
        } else {
          uploadDateTimestamp = serverTimestamp();
        }

        const evidenceData = {
          // Simplified sourceID (just metadataHash string)
          sourceID: uploadMetadata.metadataHash || 'temp-hash',

          fileSize: uploadMetadata.size || 0,
          fileType: uploadMetadata.fileType || '', // MIME type from source file

          isProcessed: false,
          hasAllPages: null,
          processingStage: 'uploaded',

          // Tag counters
          tagCount: 0,
          autoApprovedCount: 0,
          reviewRequiredCount: 0,

          uploadDate: uploadDateTimestamp,
        };

        batch.set(evidenceRef, evidenceData);
      }

      await batch.commit();

      return evidenceIds;
    } catch (error) {
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
        uploadDate: serverTimestamp(),
      });
    } catch (error) {
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
        uploadDate: serverTimestamp(),
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
    } catch (error) {
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
    } catch (error) {
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
      throw error;
    }
  }

  /**
   * Get all source metadata variants for a file (all copies with different names/dates)
   * @param {string} fileHash - Evidence document ID (file hash)
   * @returns {Promise<Array>} - Array of metadata variants sorted by sourceLastModified (oldest to newest)
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

      // Query and sort by sourceLastModified (oldest first)
      const metadataQuery = query(metadataRef, orderBy('sourceLastModified', 'asc'));
      const querySnapshot = await getDocs(metadataQuery);

      const variants = [];
      querySnapshot.forEach((doc) => {
        variants.push({
          metadataHash: doc.id,
          ...doc.data(),
        });
      });

      return variants;
    } catch (error) {
      throw error;
    }
  }
}

export default EvidenceService;
