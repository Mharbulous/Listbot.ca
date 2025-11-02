import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * MatterService - Manages matter/case operations for firm-based data
 *
 * All matters are scoped to a firm following the path:
 * /firms/{firmId}/matter/{matterId}
 *
 * For solo users: firmId === userId
 */
export class MatterService {
  /**
   * Check if a matter number already exists in the firm
   * @param {string} firmId - Firm identifier
   * @param {string} matterNumber - Matter number to check
   * @param {string|null} excludeMatterId - Matter ID to exclude from check (for updates)
   * @returns {Promise<boolean>} - True if matter number exists, false otherwise
   */
  static async checkMatterNumberExists(firmId, matterNumber, excludeMatterId = null) {
    if (!firmId || !matterNumber) {
      return false;
    }

    try {
      const mattersRef = collection(db, 'firms', firmId, 'matters');
      const q = query(mattersRef, where('matterNumber', '==', matterNumber));
      const querySnapshot = await getDocs(q);

      // If excluding a specific matter ID (for updates), check if any OTHER matter has this number
      if (excludeMatterId) {
        return querySnapshot.docs.some((doc) => doc.id !== excludeMatterId);
      }

      // For new matters, any match means it exists
      return !querySnapshot.empty;
    } catch (error) {
      console.error('[MatterService] Error checking matter number existence', error, { firmId, matterNumber, excludeMatterId });
      throw error;
    }
  }

  /**
   * Create a new matter
   * @param {string} firmId - Firm identifier
   * @param {Object} matterData - Matter information
   * @param {string} matterData.matterNumber - Human-readable matter number
   * @param {string} matterData.description - Matter description
   * @param {Array<string>} matterData.clients - Array of client name strings
   * @param {Array<string>} matterData.adverseParties - Array of adverse party names
   * @param {string} matterData.status - Status: 'active' | 'archived'
   * @param {boolean} matterData.archived - Whether matter is archived
   * @param {Array<string>} matterData.assignedTo - Array of user IDs
   * @param {string} matterData.responsibleLawyer - User ID of responsible lawyer
   * @param {boolean} matterData.mockData - Flag for test data (default: false)
   * @param {string} createdBy - User ID of creator
   * @returns {Promise<string>} - Created matter ID
   */
  static async createMatter(firmId, matterData, createdBy) {
    if (!firmId || !matterData.matterNumber) {
      throw new Error('Firm ID and matter number are required');
    }

    try {
      // Check for duplicate matter number
      const exists = await this.checkMatterNumberExists(firmId, matterData.matterNumber);
      if (exists) {
        throw new Error(`Matter number "${matterData.matterNumber}" already exists in this firm`);
      }

      // Create reference with auto-generated ID
      const mattersRef = collection(db, 'firms', firmId, 'matters');
      const newMatterRef = doc(mattersRef);

      const matter = {
        matterNumber: matterData.matterNumber,
        description: matterData.description || '',
        clients: Array.isArray(matterData.clients) ? matterData.clients : [],
        adverseParties: Array.isArray(matterData.adverseParties) ? matterData.adverseParties : [],
        status: matterData.status || 'active',
        archived: matterData.archived || false,
        assignedTo: Array.isArray(matterData.assignedTo) ? matterData.assignedTo : [],
        responsibleLawyer: matterData.responsibleLawyer || null,
        mockData: matterData.mockData === true ? true : false, // Default to false for real data
        lastAccessed: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: createdBy,
      };

      await setDoc(newMatterRef, matter);
      console.log('[MatterService] Matter created successfully', { firmId, matterId: newMatterRef.id, matterNumber: matterData.matterNumber });

      return newMatterRef.id;
    } catch (error) {
      console.error('[MatterService] Error creating matter', error, { firmId, matterNumber: matterData.matterNumber, createdBy });
      throw error;
    }
  }

  /**
   * Get a single matter by ID
   * @param {string} firmId - Firm identifier
   * @param {string} matterId - Matter identifier
   * @returns {Promise<Object|null>} Matter data or null if not found
   */
  static async getMatter(firmId, matterId) {
    if (!firmId || !matterId) {
      return null;
    }

    try {
      const matterRef = doc(db, 'firms', firmId, 'matters', matterId);
      const matterDoc = await getDoc(matterRef);

      if (matterDoc.exists()) {
        return {
          id: matterDoc.id,
          ...matterDoc.data(),
        };
      }

      return null;
    } catch (error) {
      console.error('[MatterService] Error fetching matter', error, { firmId, matterId });
      throw error;
    }
  }

  /**
   * Get all matters for a firm
   * @param {string} firmId - Firm identifier
   * @returns {Promise<Array>} Array of matters
   */
  static async getAllMatters(firmId) {
    if (!firmId) {
      return [];
    }

    try {
      const mattersRef = collection(db, 'firms', firmId, 'matters');
      const q = query(mattersRef, orderBy('lastAccessed', 'desc'));
      const querySnapshot = await getDocs(q);

      const matters = [];
      querySnapshot.forEach((doc) => {
        matters.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return matters;
    } catch (error) {
      console.error('[MatterService] Error fetching all matters', error, { firmId });
      throw error;
    }
  }

  /**
   * Get active (non-archived) matters for a firm
   * @param {string} firmId - Firm identifier
   * @returns {Promise<Array>} Array of active matters
   */
  static async getActiveMatters(firmId) {
    if (!firmId) {
      return [];
    }

    try {
      const mattersRef = collection(db, 'firms', firmId, 'matters');
      const q = query(mattersRef, where('archived', '==', false), orderBy('lastAccessed', 'desc'));
      const querySnapshot = await getDocs(q);

      const matters = [];
      querySnapshot.forEach((doc) => {
        matters.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return matters;
    } catch (error) {
      console.error('[MatterService] Error fetching active matters', error, { firmId });
      throw error;
    }
  }

  /**
   * Get matters assigned to a specific user
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} Array of matters assigned to user
   */
  static async getUserMatters(firmId, userId) {
    if (!firmId || !userId) {
      return [];
    }

    try {
      const mattersRef = collection(db, 'firms', firmId, 'matters');
      const q = query(
        mattersRef,
        where('assignedTo', 'array-contains', userId),
        orderBy('lastAccessed', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const matters = [];
      querySnapshot.forEach((doc) => {
        matters.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return matters;
    } catch (error) {
      console.error('[MatterService] Error fetching user matters', error, { firmId, userId });
      throw error;
    }
  }

  /**
   * Update a matter
   * @param {string} firmId - Firm identifier
   * @param {string} matterId - Matter identifier
   * @param {Object} updates - Fields to update
   * @param {string} updatedBy - User ID making the update
   * @returns {Promise<void>}
   */
  static async updateMatter(firmId, matterId, updates, updatedBy) {
    if (!firmId || !matterId) {
      throw new Error('Firm ID and Matter ID are required');
    }

    try {
      // If updating matter number, check for duplicates
      if (updates.matterNumber) {
        const exists = await this.checkMatterNumberExists(firmId, updates.matterNumber, matterId);
        if (exists) {
          throw new Error(`Matter number "${updates.matterNumber}" already exists in this firm`);
        }
      }

      const matterRef = doc(db, 'firms', firmId, 'matters', matterId);

      // Add update metadata
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: updatedBy,
      };

      await updateDoc(matterRef, updateData);
      console.log('[MatterService] Matter updated successfully', { firmId, matterId, updatedBy });
    } catch (error) {
      console.error('[MatterService] Error updating matter', error, { firmId, matterId, updatedBy });
      throw error;
    }
  }

  /**
   * Archive a matter
   * @param {string} firmId - Firm identifier
   * @param {string} matterId - Matter identifier
   * @param {string} updatedBy - User ID making the change
   * @returns {Promise<void>}
   */
  static async archiveMatter(firmId, matterId, updatedBy) {
    return this.updateMatter(
      firmId,
      matterId,
      {
        archived: true,
      },
      updatedBy
    );
  }

  /**
   * Unarchive a matter
   * @param {string} firmId - Firm identifier
   * @param {string} matterId - Matter identifier
   * @param {string} updatedBy - User ID making the change
   * @returns {Promise<void>}
   */
  static async unarchiveMatter(firmId, matterId, updatedBy) {
    return this.updateMatter(
      firmId,
      matterId,
      {
        archived: false,
      },
      updatedBy
    );
  }

  /**
   * Update the last accessed timestamp
   * @param {string} firmId - Firm identifier
   * @param {string} matterId - Matter identifier
   * @returns {Promise<void>}
   */
  static async updateLastAccessed(firmId, matterId) {
    if (!firmId || !matterId) {
      return;
    }

    try {
      const matterRef = doc(db, 'firms', firmId, 'matters', matterId);
      await updateDoc(matterRef, {
        lastAccessed: serverTimestamp(),
      });
    } catch (error) {
      console.error('[MatterService] Error updating last accessed', error, { firmId, matterId });
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Delete a matter
   * @param {string} firmId - Firm identifier
   * @param {string} matterId - Matter identifier
   * @returns {Promise<void>}
   */
  static async deleteMatter(firmId, matterId) {
    if (!firmId || !matterId) {
      throw new Error('Firm ID and Matter ID are required');
    }

    try {
      const matterRef = doc(db, 'firms', firmId, 'matters', matterId);
      await deleteDoc(matterRef);
      console.log('[MatterService] Matter deleted successfully', { firmId, matterId });
    } catch (error) {
      console.error('[MatterService] Error deleting matter', error, { firmId, matterId });
      throw error;
    }
  }

  /**
   * Convert a date string to Firestore Timestamp
   * @private
   * @param {string} dateString - Date string (e.g., '2024-03-15')
   * @returns {Timestamp} - Firestore Timestamp
   */
  static _dateStringToTimestamp(dateString) {
    if (!dateString) {
      return serverTimestamp();
    }

    try {
      const date = new Date(dateString);
      return Timestamp.fromDate(date);
    } catch (error) {
      console.error('[MatterService] Error converting date string to timestamp', error, { dateString });
      return serverTimestamp();
    }
  }
}

export default MatterService;
