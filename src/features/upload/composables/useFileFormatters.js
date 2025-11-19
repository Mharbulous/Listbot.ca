import { storeToRefs } from 'pinia';
import { useUserPreferencesStore } from '@/features/profile/stores/userPreferences.js';
import { formatDate, formatTime } from '@/utils/dateFormatter.js';

/**
 * Composable for file formatting utilities in upload components
 * Provides human-readable formatting for file sizes and dates
 */
export function useFileFormatters() {
  // User preferences for date/time formatting
  const preferencesStore = useUserPreferencesStore();
  const { dateFormat, timeFormat } = storeToRefs(preferencesStore);

  /**
   * Format file size in bytes to human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format modified date with smart display logic
   * - Today: show time only
   * - Within 7 days: show "X days ago"
   * - Older: show date
   * Uses user's preferred date/time format from preferences
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Formatted date string
   */
  const formatModifiedDate = (timestamp) => {
    if (!timestamp) return '—';

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // If modified today, show time only using user's time format preference
    if (diffDays === 0) {
      return formatTime(timestamp, timeFormat.value);
    }

    // If modified within last 7 days, show "X days ago" (format-independent)
    if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }

    // Otherwise show date using user's date format preference
    return formatDate(timestamp, dateFormat.value);
  };

  /**
   * Get full modified date tooltip (date + time)
   * Uses user's preferred date/time format from preferences
   * @param {number} timestamp - Unix timestamp in milliseconds
   * @returns {string} Full date and time string for tooltip
   */
  const getModifiedDateTooltip = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = formatDate(timestamp, dateFormat.value);
    const time = formatTime(timestamp, timeFormat.value);
    return `${date} at ${time}`;
  };

  return {
    formatFileSize,
    formatModifiedDate,
    getModifiedDateTooltip,
  };
}
