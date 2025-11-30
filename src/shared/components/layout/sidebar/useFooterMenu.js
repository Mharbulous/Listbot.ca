/**
 * Footer Menu State Composable
 * Manages menu open/close state and handles sidebar collapse interactions
 */

import { ref, nextTick, watch } from 'vue';

/**
 * Composable for managing footer menu state
 * @param {Object} props - Component props (isCollapsed)
 * @param {Function} getTriggerButton - Function that returns the trigger button ref
 * @returns {Object} Menu state and handlers
 */
export const useFooterMenu = (props, getTriggerButton) => {
  // Menu state
  const isOpen = ref(false);

  // Generate unique ID for accessibility
  const menuId = `unified-menu-${Math.random().toString(36).substr(2, 9)}`;

  /**
   * Toggle menu open/closed state
   */
  const toggleMenu = () => {
    isOpen.value = !isOpen.value;
  };

  /**
   * Close menu and return focus to trigger
   */
  const closeMenu = () => {
    isOpen.value = false;
    nextTick(() => {
      getTriggerButton()?.focus();
    });
  };

  /**
   * Handle blur event to close menu when focus leaves button
   */
  const handleBlur = () => {
    // Small delay to allow click events to register
    setTimeout(() => {
      if (isOpen.value) {
        closeMenu();
      }
    }, 150);
  };

  /**
   * Watch for sidebar collapse and close menu
   * If sidebar goes from expanded to collapsed, close menu
   */
  watch(
    () => props.isCollapsed,
    (newValue, oldValue) => {
      if (oldValue === false && newValue === true && isOpen.value) {
        closeMenu();
        nextTick(() => {
          getTriggerButton()?.blur();
        });
      }
    }
  );

  return {
    isOpen,
    menuId,
    toggleMenu,
    closeMenu,
    handleBlur,
  };
};
