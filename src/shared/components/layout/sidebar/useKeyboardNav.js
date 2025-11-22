/**
 * Keyboard Navigation Composable
 * Manages keyboard navigation within the footer menu (ARIA-compliant)
 */

import { ref, reactive, nextTick } from 'vue';
import { userLinks, availableApps } from './footerConfig';

/**
 * Composable for keyboard navigation in footer menu
 * @param {Object} isOpen - Ref for menu open state
 * @param {Function} toggleMenu - Function to toggle menu
 * @param {Function} closeMenu - Function to close menu
 * @returns {Object} Keyboard navigation state and handlers
 */
export const useKeyboardNav = (isOpen, toggleMenu, closeMenu) => {
  // Menu items refs and focus tracking
  const menuItems = reactive([]);
  const focusedIndex = ref(-1);

  // Calculate total items (userLinks + availableApps + sign out button)
  const totalItems = userLinks.length + availableApps.length + 1;

  /**
   * Focus management helpers
   */
  const focusFirstItem = () => {
    if (totalItems > 0) {
      focusedIndex.value = 0;
      menuItems[0]?.focus();
    }
  };

  const focusLastItem = () => {
    if (totalItems > 0) {
      focusedIndex.value = totalItems - 1;
      menuItems[totalItems - 1]?.focus();
    }
  };

  const focusNextItem = (currentIndex) => {
    const nextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
    focusedIndex.value = nextIndex;
    menuItems[nextIndex]?.focus();
  };

  const focusPreviousItem = (currentIndex) => {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
    focusedIndex.value = prevIndex;
    menuItems[prevIndex]?.focus();
  };

  /**
   * Handle keyboard navigation on trigger button
   */
  const handleTriggerKeydown = (event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen.value) {
          toggleMenu();
          nextTick(() => {
            focusFirstItem();
          });
        } else {
          closeMenu();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen.value) {
          toggleMenu();
          nextTick(() => {
            focusFirstItem();
          });
        } else {
          focusFirstItem();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen.value) {
          toggleMenu();
          nextTick(() => {
            focusLastItem();
          });
        } else {
          focusLastItem();
        }
        break;
      case 'Escape':
        if (isOpen.value) {
          event.preventDefault();
          closeMenu();
        }
        break;
    }
  };

  /**
   * Handle keyboard navigation within menu items
   */
  const handleItemKeydown = (event, index) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        focusNextItem(index);
        break;
      case 'ArrowUp':
        event.preventDefault();
        focusPreviousItem(index);
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu();
        break;
      case 'Home':
        event.preventDefault();
        focusFirstItem();
        break;
      case 'End':
        event.preventDefault();
        focusLastItem();
        break;
      case 'Tab':
        // Allow natural tab flow, but close menu
        closeMenu();
        break;
      case 'Enter':
      case ' ':
        // Let the default behavior handle navigation/click
        break;
    }
  };

  /**
   * Reset focus index when menu opens
   */
  const resetFocusIndex = () => {
    focusedIndex.value = -1;
  };

  return {
    menuItems,
    focusedIndex,
    totalItems,
    handleTriggerKeydown,
    handleItemKeydown,
    resetFocusIndex,
  };
};
