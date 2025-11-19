import { ref } from 'vue';
import { UserService } from '../services/userService.js';

/**
 * Composable for managing user data and display names
 *
 * Provides reactive user display name fetching with caching.
 * Handles loading states and errors for user-related operations.
 *
 * @returns {Object} User management utilities
 */
export function useUsers() {
  // State
  const userDisplayNames = ref(new Map());
  const loading = ref(false);
  const error = ref(null);

  /**
   * Fetch display name for a single user
   * @param {string} userId - User ID to fetch
   * @returns {Promise<string>} User display name
   */
  async function fetchUserDisplayName(userId) {
    if (!userId) {
      return 'Unknown User';
    }

    // Check local cache first
    if (userDisplayNames.value.has(userId)) {
      return userDisplayNames.value.get(userId);
    }

    loading.value = true;
    error.value = null;

    try {
      const displayName = await UserService.getUserDisplayName(userId);
      userDisplayNames.value.set(userId, displayName);
      return displayName;
    } catch (err) {
      console.error('Error fetching user display name', err, { userId });
      error.value = err.message || 'Failed to load user display name';
      return 'Unknown User';
    } finally {
      loading.value = false;
    }
  }

  /**
   * Fetch display names for multiple users at once
   * @param {string[]} userIds - Array of user IDs to fetch
   * @returns {Promise<Map<string, string>>} Map of userId -> displayName
   */
  async function fetchUserDisplayNames(userIds) {
    if (!userIds || userIds.length === 0) {
      return new Map();
    }

    // Filter out users we already have cached
    const uncachedUserIds = userIds.filter((id) => !userDisplayNames.value.has(id));

    if (uncachedUserIds.length === 0) {
      // All users are cached, return immediately
      const result = new Map();
      userIds.forEach((id) => {
        result.set(id, userDisplayNames.value.get(id));
      });
      return result;
    }

    loading.value = true;
    error.value = null;

    try {
      // Preload uncached user display names
      const fetchedNames = await UserService.preloadUserDisplayNames(uncachedUserIds);

      // Merge into our local cache
      fetchedNames.forEach((displayName, userId) => {
        userDisplayNames.value.set(userId, displayName);
      });

      // Return full result including cached entries
      const result = new Map();
      userIds.forEach((id) => {
        result.set(id, userDisplayNames.value.get(id) || 'Unknown User');
      });

      return result;
    } catch (err) {
      console.error('Error fetching user display names', err, { userIds, count: userIds.length });
      error.value = err.message || 'Failed to load user display names';
      return new Map();
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get a user display name from cache (synchronous)
   * @param {string} userId - User ID to get
   * @returns {string|null} Cached display name or null if not cached
   */
  function getCachedDisplayName(userId) {
    return userDisplayNames.value.get(userId) || null;
  }

  /**
   * Clear the user display name cache
   */
  function clearCache() {
    userDisplayNames.value.clear();
    UserService.clearCache();
  }

  return {
    // State
    userDisplayNames,
    loading,
    error,

    // Methods
    fetchUserDisplayName,
    fetchUserDisplayNames,
    getCachedDisplayName,
    clearCache,
  };
}
