<template>
  <nav class="sidebar" id="app-sidebar">
    <!-- Header with Logo -->
    <div class="sidebar-header">
      <img
        src="/src/assets/images/BDLC Logo transparent.png"
        alt="Logo"
        class="sidebar-logo"
      />
    </div>

    <!-- Spacer -->
    <div class="sidebar-spacer"></div>

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
      </RouterLink>
    </nav>

    <!-- Flexible spacer to push AppSwitcher to bottom -->
    <div class="sidebar-flex-spacer"></div>

    <!-- App Switcher -->
    <div class="sidebar-section">
      <AppSwitcher :is-hovered="false" />
    </div>

    <!-- Floating Tooltip (rendered to body) -->
    <Teleport to="body">
      <div
        v-if="hoveredItem"
        class="sidebar-tooltip"
        :style="tooltipStyle"
      >
        {{ tooltipText }}
      </div>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AppSwitcher from '../AppSwitcher.vue'

// Get current route for active state
const route = useRoute()

// Navigation items configuration
const navItems = [
  { key: 'matters', path: '/matters', icon: '🗄️', label: 'Matters' },
  { key: 'categories', path: '/categories', icon: '🗃️', label: 'Categories' },
  { key: 'upload', path: '/upload', icon: '📤', label: 'Upload' },
  { key: 'cloud', path: '/documents', icon: '📁', label: 'Documents' },
  { key: 'list', path: '/list', icon: '📃', label: 'List' },
  { key: 'analyze', path: '/analyze', icon: '🕵️', label: 'Analyze' },
  { key: 'about', path: '/about', icon: 'ℹ️', label: 'Information' },
]

// Tooltip state
const hoveredItem = ref(null)
const tooltipPosition = ref({ top: 0, left: 68 })

// Computed: Get tooltip text for currently hovered item
const tooltipText = computed(() => {
  if (!hoveredItem.value) return ''
  const item = navItems.find(i => i.key === hoveredItem.value)
  return item?.label || ''
})

// Computed: Tooltip positioning styles
const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
}))

// Mouse enter handler: Show tooltip and calculate position
const handleMouseEnter = (event, itemKey) => {
  hoveredItem.value = itemKey

  // Calculate tooltip position relative to hovered element
  const rect = event.currentTarget.getBoundingClientRect()
  tooltipPosition.value = {
    top: rect.top + rect.height / 2, // Vertically center on icon
    left: 68 // 60px sidebar width + 8px spacing
  }
}

// Mouse leave handler: Hide tooltip
const handleMouseLeave = () => {
  hoveredItem.value = null
}

// Get icon for item (handles dynamic folder icon for Documents)
const getItemIcon = (item) => {
  // Special handling for Documents item - show open folder when hovered or active
  if (item.key === 'cloud') {
    const isHovered = hoveredItem.value === 'cloud'
    const isActive = route.path === item.path
    return (isHovered || isActive) ? '📂' : '📁'
  }
  return item.icon
}
</script>

<style scoped>
/* Sidebar Container */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 60px;
  height: 100vh;
  z-index: 1000;
  background: linear-gradient(
    to bottom,
    var(--sidebar-bg-primary),
    var(--sidebar-bg-secondary)
  );
  color: var(--sidebar-text-primary);
  display: flex;
  flex-direction: column;
}

/* Header Section */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  padding: 20px;
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-logo {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 4px;
}

/* Section Container */
.sidebar-section {
  padding: 0;
}

/* Spacer */
.sidebar-spacer {
  height: 32px;
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
  justify-content: center;
  padding: 12px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
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
