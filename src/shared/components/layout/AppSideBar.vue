<template>
  <nav class="sidebar" :class="{ 'sidebar-collapsed': props.isCollapsed }" id="app-sidebar">
    <!-- Top Section: Logo + Toggle Button -->
    <div class="sidebar-header">
      <!-- Logo (shown when expanded) -->
      <div v-if="!props.isCollapsed" class="sidebar-logo">
        <span class="logo-text">ListBot</span>
      </div>

      <!-- Toggle Button -->
      <button
        class="sidebar-toggle-btn"
        :class="{ 'sidebar-toggle-centered': props.isCollapsed }"
        @click="handleToggle"
        :title="props.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span class="toggle-icon">{{ props.isCollapsed ? '☰' : '«' }}</span>
      </button>
    </div>

    <!-- Navigation Items -->
    <nav class="sidebar-nav">
      <template v-for="item in navItems" :key="item.key">
        <!-- Section Header -->
        <div v-if="item.type === 'header'" class="nav-section-header">
          <span v-if="!props.isCollapsed" class="section-label">{{ item.label }}</span>
          <span v-else class="section-divider"></span>
        </div>

        <!-- Navigation Link -->
        <RouterLink
          v-else
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item-active': route.path === item.path }"
          @mouseenter="handleMouseEnter($event, item.key)"
          @mouseleave="handleMouseLeave"
        >
          <span class="nav-icon">{{ getItemIcon(item) }}</span>
          <span v-if="!props.isCollapsed" class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <!-- Flexible spacer to push footer to bottom -->
    <div class="sidebar-flex-spacer"></div>

    <!-- Sidebar Footer (User + App Menu) -->
    <SidebarFooter :is-collapsed="props.isCollapsed" />

    <!-- Floating Tooltip (only shown when collapsed) -->
    <Teleport to="body">
      <div v-if="hoveredItem && props.isCollapsed" class="sidebar-tooltip" :style="tooltipStyle">
        {{ tooltipText }}
      </div>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMatterViewStore } from '@/features/matters/stores/matterView';
import SidebarFooter from './SidebarFooter.vue';

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['toggle'])

// Toggle handler
const handleToggle = () => {
  emit('toggle')
}

// Get current route for active state
const route = useRoute();
const matterViewStore = useMatterViewStore();

// Navigation items configuration
const navItems = [
  // Matters (Special - not part of EDRM workflow)
  { key: 'matters', path: '/matters', icon: '🗄️', label: 'Matters' },

  // EDRM Workflow Section Header
  { key: 'edrm-header', type: 'header', label: 'E-Discovery Workflow' },

  // EDRM Stage 1: Identify
  { key: 'identify', path: '/identify', icon: '🔍', label: 'Identify' },

  // EDRM Stage 2: Preserve
  { key: 'preserve', path: '/upload', icon: '🔒', label: 'Preserve' },

  // EDRM Stage 3: Collect
  {
    key: 'collect',
    path: computed(() =>
      matterViewStore.currentMatterId
        ? `/matters/${matterViewStore.currentMatterId}/documents`
        : '/documents'
    ),
    icon: '📁',
    label: 'Collect',
  },

  // EDRM Stage 4: Process
  { key: 'process', path: '/process', icon: '🤖', label: 'Process' },

  // EDRM Stage 5: Review
  { key: 'review', path: '/analyze', icon: '🕵️', label: 'Review' },

  // EDRM Stage 6: Analyze
  { key: 'analyze', path: '/analysis', icon: '📊', label: 'Analyze' },

  // EDRM Stage 7: Produce
  { key: 'produce', path: '/list', icon: '📋', label: 'Produce' },

  // EDRM Stage 8: Present
  { key: 'present', path: '/present', icon: '🏛️', label: 'Present' },

  // End of Workflow Section Header
  { key: 'workflow-end', type: 'header', label: 'Resources' },

  // About (Special - not part of EDRM workflow)
  { key: 'about', path: '/about', icon: 'ℹ️', label: 'About' },
];

// Tooltip state
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

// Mouse enter handler: Show tooltip and calculate position
const handleMouseEnter = (event, itemKey) => {
  hoveredItem.value = itemKey;

  // Calculate tooltip position relative to hovered element
  const rect = event.currentTarget.getBoundingClientRect();
  tooltipPosition.value = {
    top: rect.top + rect.height / 2, // Vertically center on icon
    left: 68, // 60px sidebar width + 8px spacing
  };
};

// Mouse leave handler: Hide tooltip
const handleMouseLeave = () => {
  hoveredItem.value = null;
};

// Get icon for item (handles dynamic folder icon for Documents)
const getItemIcon = (item) => {
  // Special handling for Collect (Documents) item - show open folder when hovered or active
  if (item.key === 'collect') {
    const isHovered = hoveredItem.value === 'collect';
    const isActive = route.path === item.path;
    return isHovered || isActive ? '📂' : '📁';
  }
  return item.icon;
};
</script>

<style scoped>
/* Sidebar Container */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  z-index: 50;
  background: linear-gradient(to bottom, var(--sidebar-bg-primary), var(--sidebar-bg-secondary));
  color: var(--sidebar-text-primary);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  overflow: hidden;
}

/* Sidebar Collapsed State */
.sidebar-collapsed {
  width: 64px;
}

/* Sidebar Header: Logo + Toggle */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid var(--sidebar-border, rgba(255, 255, 255, 0.1));
  min-height: 64px;
  flex-shrink: 0;
}

.sidebar-collapsed .sidebar-header {
  justify-content: center;
  padding: 16px 8px;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--sidebar-text-primary);
  white-space: nowrap;
}

/* Toggle Button */
.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--sidebar-text-secondary);
  border-radius: 6px;
  transition: all 200ms ease-in-out;
  flex-shrink: 0;
}

.sidebar-toggle-btn:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
}

.sidebar-toggle-centered {
  margin: 0 auto;
}

.toggle-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Section Container */
.sidebar-section {
  padding: 0;
}

/* Flexible Spacer - Pushes AppSwitcher to bottom */
.sidebar-flex-spacer {
  flex-grow: 1;
}

/* Navigation Container */
.sidebar-nav {
  position: relative;
  padding: 0;
}

/* Section Header */
.nav-section-header {
  padding: 16px 12px 8px 12px;
  margin-top: 8px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--sidebar-text-secondary);
  opacity: 0.7;
}

.section-divider {
  display: block;
  width: 32px;
  height: 1px;
  background: var(--sidebar-border, rgba(255, 255, 255, 0.2));
  margin: 0 auto;
}

/* Navigation Item */
.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 12px;
  gap: 12px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  white-space: nowrap;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  gap: 0;
}

.nav-item:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
}

.nav-item-active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

/* Icon */
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 20px;
  flex-shrink: 0;
}

/* Text Label */
.nav-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Floating Tooltip - Rendered to Body */
.sidebar-tooltip {
  position: fixed;
  background: var(--sidebar-bg-primary);
  color: var(--sidebar-text-primary);
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--sidebar-border);
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  z-index: 10000;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transform: translateY(-50%);
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}
</style>
