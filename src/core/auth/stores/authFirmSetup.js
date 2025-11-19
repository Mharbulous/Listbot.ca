/**
 * Auth Firm Setup Module
 *
 * Handles firm management and user preferences for authentication.
 * Part of the auth state machine - manages Solo Firm architecture.
 *
 * Architecture:
 * - Solo Firm: firmId === userId for solo users
 * - One-time firm creation in _createSoloFirm
 * - Creates: firm doc, default "general" matter, user preferences
 */

import { doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '../../../services/firebase';

/**
 * Check if user has an existing firm
 * @param {string} userId - User ID
 * @returns {Promise<string|null>} Firm ID if exists, null otherwise
 */
export async function _getUserFirmId(userId) {
  try {
    // Check if user has a solo firm
    const firmDoc = await getDoc(doc(db, 'firms', userId));
    if (firmDoc.exists()) {
      return userId; // Solo firm exists
    }

    // In the future, check for firm memberships here
    // For now, return null if no solo firm
    return null;
  } catch (error) {
    console.error('[Auth] Error checking firm', error, { userId });
    return null;
  }
}

/**
 * Get user's role in firm
 * @param {string} firmId - Firm ID
 * @param {string} userId - User ID
 * @returns {Promise<string>} User role (admin, member, etc.)
 */
export async function _getUserRole(firmId, userId) {
  try {
    const firmDoc = await getDoc(doc(db, 'firms', firmId));
    if (firmDoc.exists()) {
      const members = firmDoc.data().members || {};
      return members[userId]?.role || 'member';
    }
    return 'member';
  } catch (error) {
    console.error('[Auth] Error getting role', error, { firmId, userId });
    return 'member';
  }
}

/**
 * Create solo firm - ONE TIME ONLY
 *
 * Creates:
 * 1. Firm document (firmId === userId)
 * 2. Default "general" matter
 * 3. User document with preferences
 *
 * @param {Object} firebaseUser - Firebase user object
 * @throws {Error} If firm creation fails
 */
export async function _createSoloFirm(firebaseUser) {
  const batch = writeBatch(db);

  try {
    // 1. Create firm document
    const firmRef = doc(db, 'firms', firebaseUser.uid);
    batch.set(firmRef, {
      name: `${firebaseUser.displayName || 'User'}'s Workspace`,
      description: 'Personal workspace',
      members: {
        [firebaseUser.uid]: {
          email: firebaseUser.email,
          role: 'admin',
          isLawyer: false,
          joinedAt: serverTimestamp(),
        },
      },
      isPersonal: true,
      createdAt: serverTimestamp(),
    });

    // 2. Create default matter
    const matterRef = doc(db, 'firms', firebaseUser.uid, 'matters', 'general');
    batch.set(matterRef, {
      title: 'General Documents',
      description: 'Non-client documents and resources',
      clientId: null,
      matterNumber: 'GEN-001',
      status: 'active',
      priority: 'low',
      assignedTo: [firebaseUser.uid],
      createdAt: serverTimestamp(),
      createdBy: firebaseUser.uid,
      isSystemMatter: true,
    });

    // 3. Create user document with preferences (including new display preferences)
    const { UserService } = await import('@/features/profile/services/userService');
    await UserService.createOrUpdateUserDocument(firebaseUser, {
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'en',
        dateFormat: 'YYYY-MM-DD', // Default date format
        timeFormat: 'HH:mm', // Default time format
        darkMode: false, // Default dark mode
      },
    });

    await batch.commit();
  } catch (error) {
    console.error('[Auth] Error creating solo firm', error, { userId: firebaseUser?.uid });
    throw error;
  }
}

/**
 * Initialize user preferences
 * @param {string} userId - User ID
 */
export async function _initializeUserPreferences(userId) {
  try {
    const { useUserPreferencesStore } = await import('@/features/profile/stores/userPreferences');
    const preferencesStore = useUserPreferencesStore();
    await preferencesStore.initialize(userId);
  } catch (error) {
    console.error('[Auth] Error initializing user preferences', error, { userId });
    // Don't fail auth for this - preferences are not critical
  }
}
