<template>
  <nav class="sidebar" :class="{ 'sidebar-collapsed': props.isCollapsed }" id="app-sidebar">
    <!-- Navigation Items -->
    <nav class="sidebar-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === item.path }"
        @mouseenter="handleMouseEnter($event, item.key)"
        @mouseleave="handleMouseLeave"
      >
        <span class="nav-icon">{{ getItemIcon(item) }}</span>
        <span v-if="!props.isCollapsed" class="nav-label">{{ item.label }}</span>
      </RouterLink>
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

// Emits (none currently used)
// const emit = defineEmits([])

// Get current route for active state
const route = useRoute();
const matterViewStore = useMatterViewStore();

// Navigation items configuration
const navItems = [
  { key: 'matters', path: '/matters', icon: '🗄️', label: 'Matters' },
  {
    key: 'categories',
    path: computed(() =>
      matterViewStore.currentMatterId
        ? `/matters/${matterViewStore.currentMatterId}/categories`
        : '/categories'
    ),
    icon: '🗃️',
    label: 'Categories',
  },
  { key: 'upload', path: '/upload', icon: '📤', label: 'Upload' },
  {
    key: 'cloud',
    path: computed(() =>
      matterViewStore.currentMatterId
        ? `/matters/${matterViewStore.currentMatterId}/documents`
        : '/documents'
    ),
    icon: '📁',
    label: 'Documents',
  },
  { key: 'list', path: '/list', icon: '📃', label: 'List' },
  { key: 'analyze', path: '/analyze', icon: '🕵️', label: 'Analyze' },
  { key: 'about', path: '/about', icon: 'ℹ️', label: 'Information' },
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
  // Special handling for Documents item - show open folder when hovered or active
  if (item.key === 'cloud') {
    const isHovered = hoveredItem.value === 'cloud';
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
  top: 80px;
  width: 240px;
  height: calc(100vh - 80px);
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
  width: 60px;
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
