/**
 * useMatterDetail - Core logic for matter detail view
 *
 * Responsibilities:
 * - Matter loading and fetching
 * - User display names management
 * - Role checking computed properties
 * - Helper functions (formatDate, getInitials)
 * - Reactivation handlers
 */

import { ref, computed } from 'vue';
import { useMatters } from './useMatters.js';
import { useUsers } from '@/features/profile/composables/useUsers.js';
import { useFirmMembers } from '@/features/profile/composables/useFirmMembers.js';
import { useAuthStore } from '@/core/auth/stores/index.js';

export function useMatterDetail() {
  // Composables
  const { fetchMatter, updateMatter, unarchiveMatter } = useMatters();
  const { fetchUserDisplayNames } = useUsers();
  const { firmMembers, fetchFirmMembers } = useFirmMembers();
  const authStore = useAuthStore();

  // State
  const matter = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const userDisplayNames = ref(new Map());

  // Computed properties for user role checking
  const currentUserIsLawyer = computed(() => {
    const currentUserId = authStore.user?.uid;
    if (!currentUserId) return false;
    const member = firmMembers.value.find((m) => m.userId === currentUserId);
    return member?.isLawyer === true;
  });

  const currentUserIsResponsibleLawyer = computed(() => {
    const currentUserId = authStore.user?.uid;
    if (!currentUserId || !matter.value) return false;
    return matter.value.responsibleLawyer === currentUserId;
  });

  // Load matter data and associated user information
  const loadMatter = async (matterId) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fetchMatter(matterId);

      if (result) {
        matter.value = result;

        // Collect all user IDs that need display names
        const userIds = new Set();
        if (result.responsibleLawyer) userIds.add(result.responsibleLawyer);
        if (result.createdBy) userIds.add(result.createdBy);
        if (result.updatedBy) userIds.add(result.updatedBy);
        if (Array.isArray(result.assignedTo)) {
          result.assignedTo.forEach((id) => userIds.add(id));
        }

        // Fetch all user display names at once
        if (userIds.size > 0) {
          const names = await fetchUserDisplayNames([...userIds]);
          userDisplayNames.value = names;
        }
      } else {
        error.value = 'Matter not found';
      }
    } catch (err) {
      console.error('Error loading matter:', err);
      error.value = err.message || 'Failed to load Matter Details';
    } finally {
      loading.value = false;
    }
  };

  // Initialize firm members
  const initialize = async () => {
    await fetchFirmMembers();
  };

  // Handle reactivate matter
  const reactivateMatter = async (matterId, shouldUpdateResponsibleLawyer) => {
    const currentUserId = authStore.user?.uid;

    // If non-responsible lawyer and has assumed responsibility, update responsible lawyer
    if (shouldUpdateResponsibleLawyer && currentUserId) {
      await updateMatter(matterId, { responsibleLawyer: currentUserId });
    }

    // Unarchive the matter
    await unarchiveMatter(matterId);

    // Reload matter data
    await loadMatter(matterId);
  };

  return {
    // State
    matter,
    loading,
    error,
    userDisplayNames,

    // Computed
    currentUserIsLawyer,
    currentUserIsResponsibleLawyer,

    // Methods
    loadMatter,
    initialize,
    reactivateMatter,
  };
}

/**
 * Helper function to format Firestore Timestamp to date string
 */
export function formatDate(timestamp) {
  if (!timestamp) return 'N/A';

  // Handle Firestore Timestamp
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Handle JavaScript Date
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Handle date string
  return timestamp;
}

/**
 * Helper function to get initials from a user's display name
 */
export function getInitials(displayName) {
  if (!displayName) return '?';

  // Split by space and get first letter of each word
  const words = displayName.trim().split(/\s+/);
  if (words.length === 0) return '?';

  // Get first letter of first word and first letter of last word (or second word if only 2)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

  return firstInitial + lastInitial;
}
