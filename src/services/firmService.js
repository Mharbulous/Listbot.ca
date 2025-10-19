import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js';

/**
 * FirmService - Manages firm operations for Multi-App SSO
 */
export class FirmService {
  /**
   * Create a new firm
   * @param {string} firmId - Unique firm identifier
   * @param {Object} firmData - Firm information
   * @returns {Promise<void>}
   */
  static async createFirm(firmId, firmData) {
    if (!firmId || !firmData.name) {
      throw new Error('Firm ID and name are required');
    }

    try {
      const firmDocRef = doc(db, 'firms', firmId);

      const firm = {
        name: firmData.name,
        description: firmData.description || '',
        members: {},
        settings: firmData.settings || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(firmDocRef, firm);
      console.log(`Firm created: ${firmId}`);
    } catch (error) {
      console.error('Error creating firm:', error);
      throw error;
    }
  }

  /**
   * Get firm information
   * @param {string} firmId - Firm identifier
   * @returns {Promise<Object|null>} Firm data or null if not found
   */
  static async getFirm(firmId) {
    if (!firmId) {
      return null;
    }

    try {
      const firmDocRef = doc(db, 'firms', firmId);
      const firmDoc = await getDoc(firmDocRef);

      if (firmDoc.exists()) {
        return { id: firmDoc.id, ...firmDoc.data() };
      }

      return null;
    } catch (error) {
      console.error('Error fetching firm:', error);
      throw error;
    }
  }

  /**
   * Add user to firm
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @param {Object} memberData - Member information (email, role, etc.)
   * @returns {Promise<void>}
   */
  static async addFirmMember(firmId, userId, memberData) {
    if (!firmId || !userId || !memberData.email) {
      throw new Error('Firm ID, User ID, and email are required');
    }

    try {
      const firmDocRef = doc(db, 'firms', firmId);
      const firmDoc = await getDoc(firmDocRef);

      if (!firmDoc.exists()) {
        throw new Error('Firm does not exist');
      }

      const firmData = firmDoc.data();
      const members = firmData.members || {};

      // Add new member
      members[userId] = {
        email: memberData.email,
        role: memberData.role || 'member',
        isLawyer: memberData.isLawyer || false,
        joinedAt: serverTimestamp(),
      };

      // Update firm document
      await setDoc(firmDocRef, {
        ...firmData,
        members,
        updatedAt: serverTimestamp(),
      });

      console.log(`User ${userId} added to firm ${firmId}`);
    } catch (error) {
      console.error('Error adding firm member:', error);
      throw error;
    }
  }

  /**
   * Remove user from firm
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @returns {Promise<void>}
   */
  static async removeFirmMember(firmId, userId) {
    if (!firmId || !userId) {
      throw new Error('Firm ID and User ID are required');
    }

    try {
      const firmDocRef = doc(db, 'firms', firmId);
      const firmDoc = await getDoc(firmDocRef);

      if (!firmDoc.exists()) {
        throw new Error('Firm does not exist');
      }

      const firmData = firmDoc.data();
      const members = firmData.members || {};

      // Remove member
      delete members[userId];

      // Update firm document
      await setDoc(firmDocRef, {
        ...firmData,
        members,
        updatedAt: serverTimestamp(),
      });

      console.log(`User ${userId} removed from firm ${firmId}`);
    } catch (error) {
      console.error('Error removing firm member:', error);
      throw error;
    }
  }

  /**
   * Check if user is member of firm
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} True if user is member
   */
  static async isFirmMember(firmId, userId) {
    if (!firmId || !userId) {
      return false;
    }

    try {
      const firm = await this.getFirm(firmId);
      return firm && firm.members && firm.members[userId] !== undefined;
    } catch (error) {
      console.error('Error checking firm membership:', error);
      return false;
    }
  }

  /**
   * Get user's firms
   * @param {string} userId - User identifier
   * @returns {Promise<Array>} Array of firms user belongs to
   */
  static async getUserFirms(userId) {
    if (!userId) {
      return [];
    }

    try {
      const userFirms = [];

      // First, try to get user's solo firm (firmId === userId)
      try {
        const soloFirmRef = doc(db, 'firms', userId);
        const soloFirmSnap = await getDoc(soloFirmRef);

        if (soloFirmSnap.exists()) {
          const firmData = soloFirmSnap.data();
          if (firmData.members && firmData.members[userId]) {
            userFirms.push({
              id: soloFirmSnap.id,
              ...firmData,
              userRole: firmData.members[userId].role,
            });
          }
        }
      } catch (soloError) {
        console.log('Solo firm not found or not accessible:', soloError.message);
      }

      // TODO: In future phases, we would query for other firms the user belongs to
      // For now, we only support solo firms (firmId === userId)
      // When we implement firm invitations, we'll add logic here to find
      // firms where the user is a member but firmId !== userId

      return userFirms;
    } catch (error) {
      console.error('Error fetching user firms:', error);
      return [];
    }
  }

  /**
   * Update firm member role
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @param {string} newRole - New role for the user
   * @returns {Promise<void>}
   */
  static async updateMemberRole(firmId, userId, newRole) {
    if (!firmId || !userId || !newRole) {
      throw new Error('Firm ID, User ID, and new role are required');
    }

    try {
      const firmDocRef = doc(db, 'firms', firmId);
      const firmDoc = await getDoc(firmDocRef);

      if (!firmDoc.exists()) {
        throw new Error('Firm does not exist');
      }

      const firmData = firmDoc.data();
      const members = firmData.members || {};

      if (!members[userId]) {
        throw new Error('User is not a member of this firm');
      }

      // Update member role
      members[userId].role = newRole;

      // Update firm document
      await setDoc(firmDocRef, {
        ...firmData,
        members,
        updatedAt: serverTimestamp(),
      });

      console.log(`User ${userId} role updated to ${newRole} in firm ${firmId}`);
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }
}

export default FirmService;
