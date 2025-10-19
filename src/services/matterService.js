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
 * MatterService - Manages matter/case operations for team-based data
 *
 * All matters are scoped to a team following the path:
 * /teams/{teamId}/matters/{matterId}
 *
 * For solo users: teamId === userId
 */
export class MatterService {
  /**
   * Check if a matter number already exists in the team
   * @param {string} teamId - Team identifier
   * @param {string} matterNumber - Matter number to check
   * @param {string|null} excludeMatterId - Matter ID to exclude from check (for updates)
   * @returns {Promise<boolean>} - True if matter number exists, false otherwise
   */
  static async checkMatterNumberExists(teamId, matterNumber, excludeMatterId = null) {
    if (!teamId || !matterNumber) {
      return false;
    }

    try {
      const mattersRef = collection(db, 'teams', teamId, 'matters');
      const q = query(mattersRef, where('matterNumber', '==', matterNumber));
      const querySnapshot = await getDocs(q);

      // If excluding a specific matter ID (for updates), check if any OTHER matter has this number
      if (excludeMatterId) {
        return querySnapshot.docs.some((doc) => doc.id !== excludeMatterId);
      }

      // For new matters, any match means it exists
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking matter number:', error);
      throw error;
    }
  }

  /**
   * Create a new matter
   * @param {string} teamId - Team identifier
   * @param {Object} matterData - Matter information
   * @param {string} matterData.matterNumber - Human-readable matter number
   * @param {string} matterData.description - Matter description
   * @param {Array<string>} matterData.clients - Array of client name strings
   * @param {Array<string>} matterData.adverseParties - Array of adverse party names
   * @param {string} matterData.status - Status: 'active' | 'archived'
   * @param {boolean} matterData.archived - Whether matter is archived
   * @param {Array<string>} matterData.assignedTo - Array of user IDs
   * @param {string} matterData.responsibleLawyer - User ID of responsible lawyer
   * @param {string} createdBy - User ID of creator
   * @returns {Promise<string>} - Created matter ID
   */
  static async createMatter(teamId, matterData, createdBy) {
    if (!teamId || !matterData.matterNumber) {
      throw new Error('Team ID and matter number are required');
    }

    try {
      // Check for duplicate matter number
      const exists = await this.checkMatterNumberExists(teamId, matterData.matterNumber);
      if (exists) {
        throw new Error(`Matter number "${matterData.matterNumber}" already exists in this team`);
      }

      // Create reference with auto-generated ID
      const mattersRef = collection(db, 'teams', teamId, 'matters');
      const newMatterRef = doc(mattersRef);

      const matter = {
        matterNumber: matterData.matterNumber,
        description: matterData.description || '',
        clients: Array.isArray(matterData.clients) ? matterData.clients : [],
        adverseParties: Array.isArray(matterData.adverseParties)
          ? matterData.adverseParties
          : [],
        status: matterData.status || 'active',
        archived: matterData.archived || false,
        assignedTo: Array.isArray(matterData.assignedTo) ? matterData.assignedTo : [],
        responsibleLawyer: matterData.responsibleLawyer || null,
        lastAccessed: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: createdBy,
        updatedAt: serverTimestamp(),
        updatedBy: createdBy,
      };

      await setDoc(newMatterRef, matter);
      console.log(`Matter created: ${newMatterRef.id} in team ${teamId}`);

      return newMatterRef.id;
    } catch (error) {
      console.error('Error creating matter:', error);
      throw error;
    }
  }

  /**
   * Get a single matter by ID
   * @param {string} teamId - Team identifier
   * @param {string} matterId - Matter identifier
   * @returns {Promise<Object|null>} Matter data or null if not found
   */
  static async getMatter(teamId, matterId) {
    if (!teamId || !matterId) {
      return null;
    }

    try {
      const matterRef = doc(db, 'teams', teamId, 'matters', matterId);
      const matterDoc = await getDoc(matterRef);

      if (matterDoc.exists()) {
        return {
          id: matterDoc.id,
          ...matterDoc.data(),
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching matter:', error);
      throw error;
    }
  }

  /**
   * Get all matters for a team
   * @param {string} teamId - Team identifier
   * @returns {Promise<Array>} Array of matters
   */
  static async getAllMatters(teamId) {
    if (!teamId) {
      return [];
    }

    try {
      const mattersRef = collection(db, 'teams', teamId, 'matters');
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
      console.error('Error fetching matters:', error);
      throw error;
    }
  }

  /**
   * Get active (non-archived) matters for a team
   * @param {string} teamId - Team identifier
   * @returns {Promise<Array>} Array of active matters
   */
  static async getActiveMatters(teamId) {
    if (!teamId) {
      return [];
    }

    try {
      const mattersRef = collection(db, 'teams', teamId, 'matters');
      const q = query(
        mattersRef,
        where('archived', '==', false),
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
      console.error('Error fetching active matters:', error);
      throw error;
    }
  }

  /**
   * Get matters assigned to a specific user
   * @param {string} teamId - Team identifier
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} Array of matters assigned to user
   */
  static async getUserMatters(teamId, userId) {
    if (!teamId || !userId) {
      return [];
    }

    try {
      const mattersRef = collection(db, 'teams', teamId, 'matters');
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
      console.error('Error fetching user matters:', error);
      throw error;
    }
  }

  /**
   * Update a matter
   * @param {string} teamId - Team identifier
   * @param {string} matterId - Matter identifier
   * @param {Object} updates - Fields to update
   * @param {string} updatedBy - User ID making the update
   * @returns {Promise<void>}
   */
  static async updateMatter(teamId, matterId, updates, updatedBy) {
    if (!teamId || !matterId) {
      throw new Error('Team ID and Matter ID are required');
    }

    try {
      // If updating matter number, check for duplicates
      if (updates.matterNumber) {
        const exists = await this.checkMatterNumberExists(
          teamId,
          updates.matterNumber,
          matterId
        );
        if (exists) {
          throw new Error(
            `Matter number "${updates.matterNumber}" already exists in this team`
          );
        }
      }

      const matterRef = doc(db, 'teams', teamId, 'matters', matterId);

      // Add update metadata
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: updatedBy,
      };

      await updateDoc(matterRef, updateData);
      console.log(`Matter updated: ${matterId} in team ${teamId}`);
    } catch (error) {
      console.error('Error updating matter:', error);
      throw error;
    }
  }

  /**
   * Archive a matter
   * @param {string} teamId - Team identifier
   * @param {string} matterId - Matter identifier
   * @param {string} updatedBy - User ID making the change
   * @returns {Promise<void>}
   */
  static async archiveMatter(teamId, matterId, updatedBy) {
    return this.updateMatter(
      teamId,
      matterId,
      {
        archived: true,
      },
      updatedBy
    );
  }

  /**
   * Unarchive a matter
   * @param {string} teamId - Team identifier
   * @param {string} matterId - Matter identifier
   * @param {string} updatedBy - User ID making the change
   * @returns {Promise<void>}
   */
  static async unarchiveMatter(teamId, matterId, updatedBy) {
    return this.updateMatter(
      teamId,
      matterId,
      {
        archived: false,
      },
      updatedBy
    );
  }

  /**
   * Update the last accessed timestamp
   * @param {string} teamId - Team identifier
   * @param {string} matterId - Matter identifier
   * @returns {Promise<void>}
   */
  static async updateLastAccessed(teamId, matterId) {
    if (!teamId || !matterId) {
      return;
    }

    try {
      const matterRef = doc(db, 'teams', teamId, 'matters', matterId);
      await updateDoc(matterRef, {
        lastAccessed: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating last accessed:', error);
      // Don't throw - this is a non-critical operation
    }
  }

  /**
   * Delete a matter
   * @param {string} teamId - Team identifier
   * @param {string} matterId - Matter identifier
   * @returns {Promise<void>}
   */
  static async deleteMatter(teamId, matterId) {
    if (!teamId || !matterId) {
      throw new Error('Team ID and Matter ID are required');
    }

    try {
      const matterRef = doc(db, 'teams', teamId, 'matters', matterId);
      await deleteDoc(matterRef);
      console.log(`Matter deleted: ${matterId} from team ${teamId}`);
    } catch (error) {
      console.error('Error deleting matter:', error);
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
      console.error('Error converting date string:', error);
      return serverTimestamp();
    }
  }
}

export default MatterService;
