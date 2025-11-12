import { ref } from 'vue';

/**
 * Composable for managing notification/snackbar state
 * @returns {Object} An object containing snackbar state and showNotification function
 */
export function useNotification() {
  const snackbar = ref({
    show: false,
    message: '',
    color: 'success',
  });

  /**
   * Display a notification message
   * @param {string} message - The message to display
   * @param {string} color - The color of the snackbar (success, error, info, warning)
   */
  const showNotification = (message, color = 'success') => {
    snackbar.value = { show: true, message, color };
  };

  return {
    snackbar,
    showNotification,
  };
}
