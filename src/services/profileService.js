import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { db, auth } from './firebase';

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
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * Updates Firestore user document, Firebase Auth displayName, and team member data
   * @param {string} userId - User identifier
   * @param {string} teamId - Team identifier
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.firstName - User's first name
   * @param {string} profileData.middleNames - User's middle name(s)
   * @param {string} profileData.lastName - User's last name
   * @param {boolean} profileData.isLawyer - Whether user is a lawyer
   * @returns {Promise<void>}
   */
  static async updateProfile(userId, teamId, profileData) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!teamId) {
      throw new Error('Team ID is required');
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

      // 3. Update team member isLawyer status if provided
      if (typeof isLawyer === 'boolean') {
        await this.updateTeamMemberIsLawyer(teamId, userId, isLawyer);
      }

      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update isLawyer status in team member data
   * @param {string} teamId - Team identifier
   * @param {string} userId - User identifier
   * @param {boolean} isLawyer - Whether user is a lawyer
   * @returns {Promise<void>}
   */
  static async updateTeamMemberIsLawyer(teamId, userId, isLawyer) {
    if (!teamId || !userId) {
      throw new Error('Team ID and User ID are required');
    }

    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists()) {
        throw new Error('Team document not found');
      }

      const teamData = teamSnap.data();
      const members = teamData.members || {};

      if (!members[userId]) {
        throw new Error('User is not a member of this team');
      }

      // Update isLawyer field for this user
      members[userId].isLawyer = isLawyer;

      // Update team document
      await updateDoc(teamRef, {
        members: members,
        updatedAt: serverTimestamp(),
      });

      console.log(`isLawyer status updated to ${isLawyer} for user ${userId}`);
    } catch (error) {
      console.error('Error updating team member isLawyer status:', error);
      throw error;
    }
  }

  /**
   * Get user's isLawyer status from team
   * @param {string} teamId - Team identifier
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} isLawyer status
   */
  static async getIsLawyerStatus(teamId, userId) {
    if (!teamId || !userId) {
      return false;
    }

    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists()) {
        return false;
      }

      const teamData = teamSnap.data();
      const members = teamData.members || {};

      return members[userId]?.isLawyer || false;
    } catch (error) {
      console.error('Error fetching isLawyer status:', error);
      return false;
    }
  }
}

export default ProfileService;
