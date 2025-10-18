import { ref, computed } from 'vue';
import { useAuthStore } from '../core/stores/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { ProfileService } from '../services/profileService';

/**
 * Composable for fetching and filtering team members
 * Provides reactive access to team members with various filters
 */
export function useTeamMembers() {
  const authStore = useAuthStore();
  const teamMembers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Get lawyers from the current team
   * Filters members where isLawyer === true
   */
  const lawyers = computed(() => {
    return teamMembers.value.filter((member) => member.isLawyer === true);
  });

  /**
   * Get display names for lawyers suitable for v-autocomplete
   * Returns array of display names (with email fallback)
   */
  const lawyerNames = computed(() => {
    return lawyers.value.map((member) => member.displayName);
  });

  /**
   * Fetch team members from Firestore
   * Loads the team document and processes member data
   */
  const fetchTeamMembers = async () => {
    loading.value = true;
    error.value = null;
    teamMembers.value = [];

    try {
      // Get current team ID from auth store
      const teamId = authStore.currentTeam;

      if (!teamId) {
        throw new Error('No team ID available');
      }

      // Fetch team document
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists()) {
        throw new Error('Team document not found');
      }

      const teamData = teamSnap.data();
      const members = teamData.members || {};

      // Process members and get display names
      const processedMembers = await Promise.all(
        Object.entries(members).map(async ([userId, memberData]) => {
          let displayName = memberData.email;

          try {
            // Fetch user document to get structured name fields
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              const userData = userSnap.data();

              // Construct display name from firstName, middleNames, lastName
              if (userData.firstName && userData.lastName) {
                displayName = ProfileService.constructDisplayName(
                  userData.firstName,
                  userData.middleNames,
                  userData.lastName
                );
              } else {
                // Fallback to email-based display name if name fields not set
                displayName = memberData.email?.split('@')[0] || memberData.email;
              }
            } else {
              // User document doesn't exist - use email prefix
              displayName = memberData.email?.split('@')[0] || memberData.email;
            }
          } catch (err) {
            console.warn(`Could not fetch display name for user ${userId}:`, err);
            // Fallback to email prefix
            displayName = memberData.email?.split('@')[0] || memberData.email;
          }

          return {
            userId,
            email: memberData.email,
            role: memberData.role,
            isLawyer: memberData.isLawyer || false, // Default to false if undefined
            joinedAt: memberData.joinedAt,
            displayName,
          };
        })
      );

      teamMembers.value = processedMembers;
    } catch (err) {
      console.error('Error fetching team members:', err);
      error.value = err.message;
      teamMembers.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    teamMembers,
    loading,
    error,

    // Computed
    lawyers,
    lawyerNames,

    // Methods
    fetchTeamMembers,
  };
}
