<template>
  <nav class="sidebar" :class="{ 'sidebar-collapsed': props.isCollapsed }" id="app-sidebar">
    <!-- Navigation Items (fills available space) -->
    <SidebarNav
      :nav-items="navItems"
      :is-collapsed="props.isCollapsed"
      :hovered-item-key="hoveredItem"
      @item-hover="handleMouseEnter"
      @item-leave="handleMouseLeave"
    />

    <!-- Sidebar Footer (User + App Menu) -->
    <SidebarFooter :is-collapsed="props.isCollapsed" />

    <!-- Floating Tooltip (only shown when collapsed) -->
    <SidebarTooltip
      :show="!!hoveredItem && props.isCollapsed"
      :text="tooltipText"
      :style="tooltipStyle"
    />
  </nav>
</template>

<script setup>
import SidebarNav from './sidebar/SidebarNav.vue';
import SidebarFooter from './SidebarFooter.vue';
import SidebarTooltip from './sidebar/SidebarTooltip.vue';
import { useNavItems } from './sidebar/sidebarNavConfig';
import { useSidebarTooltip } from './sidebar/useSidebarTooltip';

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Navigation items
const navItems = useNavItems();

// Tooltip management
const { hoveredItem, tooltipText, tooltipStyle, handleMouseEnter, handleMouseLeave } =
  useSidebarTooltip(navItems);
</script>

<style scoped>
.sidebar {
  position: fixed;
  left: 0;
  top: 64px;
  width: 240px;
  height: calc(100vh - 64px);
  z-index: 50;
  /* Ocean depth gradient - from surface to abyss */
  background: linear-gradient(
    to bottom,
    #22d3ee 0%,     /* Cyan 400 (Surface Water Start) */
    #1d4ed8 25%,    /* Blue 700 - Mid-Transition (Photic Zone) */
    #3730a3 35%,    /* Indigo 900 - Twilight Zone */
    #111827 100%    /* Gray 900 - Midnight Zone (Abyss) */
  );
  color: var(--sidebar-text-primary);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  overflow: hidden;
}

.sidebar-collapsed {
  width: 64px;
}
</style>
