import { ref, computed } from 'vue';
import { MatterService } from '../services/matterService.js';
import { useAuthStore } from '../core/stores/auth.js';

/**
 * Composable for managing matter data
 *
 * Provides reactive matter list with loading states and error handling.
 * Automatically uses the current user's teamId from the auth store.
 *
 * @returns {Object} Matter management utilities
 */
export function useMatters() {
  const authStore = useAuthStore();

  // State
  const matters = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch all matters for the current team
   * @returns {Promise<Array>} Array of matters
   */
  async function fetchMatters() {
    if (!authStore.teamId) {
      error.value = 'No team ID available';
      return [];
    }

    loading.value = true;
    error.value = null;

    try {
      const fetchedMatters = await MatterService.getAllMatters(authStore.teamId);
      matters.value = fetchedMatters;
      return fetchedMatters;
    } catch (err) {
      console.error('Error fetching matters:', err);
      error.value = err.message || 'Failed to load matters';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch only active (non-archived) matters
   * @returns {Promise<Array>} Array of active matters
   */
  async function fetchActiveMatters() {
    if (!authStore.teamId) {
      error.value = 'No team ID available';
      return [];
    }

    loading.value = true;
    error.value = null;

    try {
      const fetchedMatters = await MatterService.getActiveMatters(authStore.teamId);
      matters.value = fetchedMatters;
      return fetchedMatters;
    } catch (err) {
      console.error('Error fetching active matters:', err);
      error.value = err.message || 'Failed to load active matters';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch matters assigned to the current user
   * @returns {Promise<Array>} Array of user's matters
   */
  async function fetchMyMatters() {
    if (!authStore.teamId || !authStore.user?.uid) {
      error.value = 'No team ID or user ID available';
      return [];
    }

    loading.value = true;
    error.value = null;

    try {
      const fetchedMatters = await MatterService.getUserMatters(authStore.teamId, authStore.user.uid);
      matters.value = fetchedMatters;
      return fetchedMatters;
    } catch (err) {
      console.error('Error fetching my matters:', err);
      error.value = err.message || 'Failed to load your matters';
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch a single matter by ID
   * @param {string} matterId - Matter ID to fetch
   * @returns {Promise<Object|null>} Matter object or null
   */
  async function fetchMatter(matterId) {
    if (!authStore.teamId) {
      error.value = 'No team ID available';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const matter = await MatterService.getMatter(authStore.teamId, matterId);
      return matter;
    } catch (err) {
      console.error('Error fetching matter:', err);
      error.value = err.message || 'Failed to load matter';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Create a new matter
   * @param {Object} matterData - Matter data to create
   * @returns {Promise<string|null>} Created matter ID or null on error
   */
  async function createMatter(matterData) {
    if (!authStore.teamId || !authStore.user?.uid) {
      error.value = 'No team ID or user ID available';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const matterId = await MatterService.createMatter(
        authStore.teamId,
        matterData,
        authStore.user.uid
      );

      // Refresh matters list after creation
      await fetchMatters();

      return matterId;
    } catch (err) {
      console.error('Error creating matter:', err);
      error.value = err.message || 'Failed to create matter';
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update an existing matter
   * @param {string} matterId - Matter ID to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async function updateMatter(matterId, updates) {
    if (!authStore.teamId || !authStore.user?.uid) {
      error.value = 'No team ID or user ID available';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await MatterService.updateMatter(authStore.teamId, matterId, updates, authStore.user.uid);

      // Refresh matters list after update
      await fetchMatters();

      return true;
    } catch (err) {
      console.error('Error updating matter:', err);
      error.value = err.message || 'Failed to update matter';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Archive a matter
   * @param {string} matterId - Matter ID to archive
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async function archiveMatter(matterId) {
    if (!authStore.teamId || !authStore.user?.uid) {
      error.value = 'No team ID or user ID available';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await MatterService.archiveMatter(authStore.teamId, matterId, authStore.user.uid);

      // Refresh matters list after archiving
      await fetchMatters();

      return true;
    } catch (err) {
      console.error('Error archiving matter:', err);
      error.value = err.message || 'Failed to archive matter';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Unarchive a matter
   * @param {string} matterId - Matter ID to unarchive
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async function unarchiveMatter(matterId) {
    if (!authStore.teamId || !authStore.user?.uid) {
      error.value = 'No team ID or user ID available';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await MatterService.unarchiveMatter(authStore.teamId, matterId, authStore.user.uid);

      // Refresh matters list after unarchiving
      await fetchMatters();

      return true;
    } catch (err) {
      console.error('Error unarchiving matter:', err);
      error.value = err.message || 'Failed to unarchive matter';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Delete a matter
   * @param {string} matterId - Matter ID to delete
   * @returns {Promise<boolean>} True if successful, false otherwise
   */
  async function deleteMatter(matterId) {
    if (!authStore.teamId) {
      error.value = 'No team ID available';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await MatterService.deleteMatter(authStore.teamId, matterId);

      // Refresh matters list after deletion
      await fetchMatters();

      return true;
    } catch (err) {
      console.error('Error deleting matter:', err);
      error.value = err.message || 'Failed to delete matter';
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Update the last accessed timestamp for a matter
   * @param {string} matterId - Matter ID
   */
  async function updateLastAccessed(matterId) {
    if (!authStore.teamId) {
      return;
    }

    try {
      await MatterService.updateLastAccessed(authStore.teamId, matterId);
    } catch (err) {
      console.error('Error updating last accessed:', err);
      // Don't set error for this non-critical operation
    }
  }

  // Computed properties
  const activeMatters = computed(() => {
    return matters.value.filter((matter) => !matter.archived);
  });

  const archivedMatters = computed(() => {
    return matters.value.filter((matter) => matter.archived);
  });

  const myMatters = computed(() => {
    if (!authStore.user?.uid) return [];
    return matters.value.filter((matter) =>
      matter.assignedTo?.includes(authStore.user.uid)
    );
  });

  const matterCount = computed(() => matters.value.length);
  const activeMatterCount = computed(() => activeMatters.value.length);
  const archivedMatterCount = computed(() => archivedMatters.value.length);

  return {
    // State
    matters,
    loading,
    error,

    // Computed
    activeMatters,
    archivedMatters,
    myMatters,
    matterCount,
    activeMatterCount,
    archivedMatterCount,

    // Methods
    fetchMatters,
    fetchActiveMatters,
    fetchMyMatters,
    fetchMatter,
    createMatter,
    updateMatter,
    archiveMatter,
    unarchiveMatter,
    deleteMatter,
    updateLastAccessed,
  };
}
