/**
 * Date Formatting Utility
 *
 * Provides date formatting based on user preferences.
 * Supports all date format options available in the Settings page.
 */

/**
 * Month abbreviations for date formatting
 */
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Full month names for date formatting
 */
const MONTH_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Format a date according to the specified format string
 *
 * Supported format patterns:
 * - YYYY-MM-DD (2024-01-23)
 * - DD/MM/YYYY (23/01/2024)
 * - MM/DD/YYYY (01/23/2024)
 * - DD-MM-YYYY (23-01-2024)
 * - MM-DD-YYYY (01-23-2024)
 * - DD.MM.YYYY (23.01.2024)
 * - MM.DD.YYYY (01.23.2024)
 * - YYYY/MM/DD (2024/01/23)
 * - DD MMM YYYY (23 Jan 2024)
 * - MMM DD, YYYY (Jan 23, 2024)
 * - DD MMMM YYYY (23 January 2024)
 * - MMMM DD, YYYY (January 23, 2024)
 *
 * @param {*} timestamp - Firestore timestamp or Date object
 * @param {string} format - Date format pattern (defaults to 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, format = 'YYYY-MM-DD') => {
  if (!timestamp) return '';

  // Convert timestamp to Date object
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  // Extract date components
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-based index
  const day = date.getDate();

  // Pad numbers with leading zeros
  const yyyy = String(year);
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');

  // Get month names
  const mmm = MONTH_ABBR[date.getMonth()];
  const mmmm = MONTH_FULL[date.getMonth()];

  // Format based on pattern
  switch (format) {
    case 'YYYY-MM-DD':
      return `${yyyy}-${mm}-${dd}`;

    case 'DD/MM/YYYY':
      return `${dd}/${mm}/${yyyy}`;

    case 'MM/DD/YYYY':
      return `${mm}/${dd}/${yyyy}`;

    case 'DD-MM-YYYY':
      return `${dd}-${mm}-${yyyy}`;

    case 'MM-DD-YYYY':
      return `${mm}-${dd}-${yyyy}`;

    case 'DD.MM.YYYY':
      return `${dd}.${mm}.${yyyy}`;

    case 'MM.DD.YYYY':
      return `${mm}.${dd}.${yyyy}`;

    case 'YYYY/MM/DD':
      return `${yyyy}/${mm}/${dd}`;

    case 'DD MMM YYYY':
      return `${dd} ${mmm} ${yyyy}`;

    case 'MMM DD, YYYY':
      return `${mmm} ${dd}, ${yyyy}`;

    case 'DD MMMM YYYY':
      return `${dd} ${mmmm} ${yyyy}`;

    case 'MMMM DD, YYYY':
      return `${mmmm} ${dd}, ${yyyy}`;

    default:
      // Fallback to ISO format if unknown pattern
      return `${yyyy}-${mm}-${dd}`;
  }
};

/**
 * Format time according to the specified format string
 *
 * Supported format patterns:
 * - HH:mm (23:01)
 * - HH:mm:ss (23:01:45)
 * - h:mm a (11:01 PM)
 * - h:mm:ss a (11:01:45 PM)
 * - HH:mm:ss.SSS (23:01:45.123)
 *
 * @param {*} timestamp - Firestore timestamp or Date object
 * @param {string} format - Time format pattern (defaults to 'HH:mm')
 * @returns {string} Formatted time string
 */
export const formatTime = (timestamp, format = 'HH:mm') => {
  if (!timestamp) return '';

  // Convert timestamp to Date object
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  // Extract time components
  const hours24 = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  // Pad with leading zeros
  const hh = String(hours24).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  const sss = String(milliseconds).padStart(3, '0');

  // Calculate 12-hour format
  const hours12 = hours24 % 12 || 12;
  const h = String(hours12);
  const ampm = hours24 >= 12 ? 'PM' : 'AM';

  // Format based on pattern
  switch (format) {
    case 'HH:mm':
      return `${hh}:${mm}`;

    case 'HH:mm:ss':
      return `${hh}:${mm}:${ss}`;

    case 'h:mm a':
      return `${h}:${mm} ${ampm}`;

    case 'h:mm:ss a':
      return `${h}:${mm}:${ss} ${ampm}`;

    case 'HH:mm:ss.SSS':
      return `${hh}:${mm}:${ss}.${sss}`;

    default:
      // Fallback to HH:mm if unknown pattern
      return `${hh}:${mm}`;
  }
};

/**
 * Format date and time together
 *
 * @param {*} timestamp - Firestore timestamp or Date object
 * @param {string} dateFormat - Date format pattern
 * @param {string} timeFormat - Time format pattern
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (timestamp, dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm') => {
  if (!timestamp) return '';
  return `${formatDate(timestamp, dateFormat)} ${formatTime(timestamp, timeFormat)}`;
};

/**
 * Format timestamp with date and time using user preferences
 * Displays in format: "{date} at {time}"
 *
 * @param {*} timestamp - Firestore timestamp or Date object
 * @param {string} dateFormat - Date format pattern (defaults to 'YYYY-MM-DD')
 * @param {string} timeFormat - Time format pattern (defaults to 'HH:mm')
 * @returns {string} Formatted timestamp string with " at " separator
 */
export const formatTimestamp = (timestamp, dateFormat = 'YYYY-MM-DD', timeFormat = 'HH:mm') => {
  if (!timestamp) return '';
  return `${formatDate(timestamp, dateFormat)} at ${formatTime(timestamp, timeFormat)}`;
};
