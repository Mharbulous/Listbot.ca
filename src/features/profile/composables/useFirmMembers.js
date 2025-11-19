import { ref, computed } from 'vue';
import { useAuthStore } from '../core/stores/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { ProfileService } from '../services/profileService';

/**
 * Composable for fetching and filtering firm members
 * Provides reactive access to firm members with various filters
 */
export function useFirmMembers() {
  const authStore = useAuthStore();
  const firmMembers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Get lawyers from the current firm
   * Filters members where isLawyer === true
   */
  const lawyers = computed(() => {
    return firmMembers.value.filter((member) => member.isLawyer === true);
  });

  /**
   * Get display names for lawyers suitable for v-autocomplete
   * Returns array of display names (with email fallback)
   */
  const lawyerNames = computed(() => {
    return lawyers.value.map((member) => member.displayName);
  });

  /**
   * Fetch firm members from Firestore
   * Loads the firm document and processes member data
   */
  const fetchFirmMembers = async () => {
    loading.value = true;
    error.value = null;
    firmMembers.value = [];

    try {
      // Get current firm ID from auth store
      const firmId = authStore.currentFirm;

      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Fetch firm document
      const firmRef = doc(db, 'firms', firmId);
      const firmSnap = await getDoc(firmRef);

      if (!firmSnap.exists()) {
        throw new Error('Firm document not found');
      }

      const firmData = firmSnap.data();
      const members = firmData.members || {};

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
            console.warn(`Could not fetch display name for user ${userId}`, err);
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

      firmMembers.value = processedMembers;
    } catch (err) {
      console.error('Error fetching firm members', err, { firmId });
      error.value = err.message;
      firmMembers.value = [];
    } finally {
      loading.value = false;
    }
  };

  return {
    // State
    firmMembers,
    loading,
    error,

    // Computed
    lawyers,
    lawyerNames,

    // Methods
    fetchFirmMembers,
  };
}
