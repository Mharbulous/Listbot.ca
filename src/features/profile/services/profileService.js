import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { db, auth } from '@/services/firebase';

/**
 * ProfileService - Manages user profile operations
 */
export class ProfileService {
  /**
   * Construct display name from name components
   * @param {string} firstName - User's first name
   * @param {string} middleNames - User's middle name(s) (optional)
   * @param {string} lastName - User's last name
   * @returns {string} Formatted display name
   */
  static constructDisplayName(firstName, middleNames, lastName) {
    const parts = [firstName?.trim(), middleNames?.trim(), lastName?.trim()].filter(Boolean);
    return parts.join(' ') || 'User';
  }

  /**
   * Get user profile data from Firestore
   * @param {string} userId - User identifier
   * @returns {Promise<Object|null>} User profile data or null
   */
  static async getProfile(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
      }

      return null;
    } catch (error) {
      console.error('[ProfileService] Error fetching user profile', error, { userId });
      throw error;
    }
  }

  /**
   * Update user profile
   * Updates Firestore user document, Firebase Auth displayName, and firm member data
   * @param {string} userId - User identifier
   * @param {string} firmId - Firm identifier
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.firstName - User's first name
   * @param {string} profileData.middleNames - User's middle name(s)
   * @param {string} profileData.lastName - User's last name
   * @param {boolean} profileData.isLawyer - Whether user is a lawyer
   * @returns {Promise<void>}
   */
  static async updateProfile(userId, firmId, profileData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!firmId) {
      throw new Error('Firm ID is required');
    }

    const { firstName, middleNames, lastName, isLawyer } = profileData;

    // Validate required fields
    if (!firstName?.trim()) {
      throw new Error('First name is required');
    }

    if (!lastName?.trim()) {
      throw new Error('Last name is required');
    }

    try {
      // 1. Update Firestore user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        firstName: firstName.trim(),
        middleNames: middleNames?.trim() || '',
        lastName: lastName.trim(),
        updatedAt: serverTimestamp(),
      });

      // 2. Update Firebase Auth displayName
      const displayName = this.constructDisplayName(firstName, middleNames, lastName);
      const currentUser = auth.currentUser;

      if (currentUser) {
        await updateFirebaseProfile(currentUser, {
          displayName: displayName,
        });
      }

      // 3. Update firm member isLawyer status if provided
      if (typeof isLawyer === 'boolean') {
        await this.updateFirmMemberIsLawyer(firmId, userId, isLawyer);
      }

      console.log('[ProfileService] profile updated successfully', { userId, firmId });
    } catch (error) {
      console.error('[ProfileService] Error updating profile', error, { userId, firmId, profileData });
      throw error;
    }
  }

  /**
   * Update isLawyer status in firm member data
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @param {boolean} isLawyer - Whether user is a lawyer
   * @returns {Promise<void>}
   */
  static async updateFirmMemberIsLawyer(firmId, userId, isLawyer) {
    if (!firmId || !userId) {
      throw new Error('Firm ID and User ID are required');
    }

    try {
      const firmRef = doc(db, 'firms', firmId);
      const firmSnap = await getDoc(firmRef);

      if (!firmSnap.exists()) {
        throw new Error('Firm document not found');
      }

      const firmData = firmSnap.data();
      const members = firmData.members || {};

      if (!members[userId]) {
        throw new Error('User is not a member of this firm');
      }

      // Update isLawyer field for this user
      members[userId].isLawyer = isLawyer;

      // Update firm document
      await updateDoc(firmRef, {
        members: members,
        updatedAt: serverTimestamp(),
      });

      console.log('[ProfileService] isLawyer status updated', { firmId, userId, isLawyer });
    } catch (error) {
      console.error('[ProfileService] Error updating firm member isLawyer status', error, { firmId, userId, isLawyer });
      throw error;
    }
  }

  /**
   * Get user's isLawyer status from firm
   * @param {string} firmId - Firm identifier
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} isLawyer status
   */
  static async getIsLawyerStatus(firmId, userId) {
    if (!firmId || !userId) {
      return false;
    }

    try {
      const firmRef = doc(db, 'firms', firmId);
      const firmSnap = await getDoc(firmRef);

      if (!firmSnap.exists()) {
        return false;
      }

      const firmData = firmSnap.data();
      const members = firmData.members || {};

      return members[userId]?.isLawyer || false;
    } catch (error) {
      console.error('[ProfileService] Error fetching isLawyer status', error, { firmId, userId });
      return false;
    }
  }
}

export default ProfileService;
