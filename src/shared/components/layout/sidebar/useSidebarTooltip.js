import { ref, computed } from 'vue';

/**
 * Composable for managing sidebar tooltip state and behavior
 * Handles tooltip visibility, positioning, and text based on hovered items
 *
 * @param {Array} navItems - Array of navigation items to display tooltips for
 * @returns {Object} Tooltip state and handlers
 */
export function useSidebarTooltip(navItems) {
  // State
  const hoveredItem = ref(null);
  const tooltipPosition = ref({ top: 0, left: 68 });

  // Computed: Get tooltip text for currently hovered item
  const tooltipText = computed(() => {
    if (!hoveredItem.value) return '';
    const item = navItems.find((i) => i.key === hoveredItem.value);
    return item?.label || '';
  });

  // Computed: Tooltip positioning styles
  const tooltipStyle = computed(() => ({
    top: `${tooltipPosition.value.top}px`,
    left: `${tooltipPosition.value.left}px`,
  }));

  /**
   * Mouse enter handler: Show tooltip and calculate position
   * @param {MouseEvent} event - The mouse event
   * @param {string} itemKey - The key of the hovered navigation item
   */
  const handleMouseEnter = (event, itemKey) => {
    hoveredItem.value = itemKey;

    // Calculate tooltip position relative to hovered element
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipPosition.value = {
      top: rect.top + rect.height / 2, // Vertically center on icon
      left: 68, // 60px sidebar width + 8px spacing
    };
  };

  /**
   * Mouse leave handler: Hide tooltip
   */
  const handleMouseLeave = () => {
    hoveredItem.value = null;
  };

  return {
    hoveredItem,
    tooltipText,
    tooltipStyle,
    handleMouseEnter,
    handleMouseLeave,
  };
}
