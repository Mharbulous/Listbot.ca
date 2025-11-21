<template>
  <div class="sidebar-nav">
    <template v-for="item in navItems" :key="item.key">
      <!-- Section Header -->
      <div v-if="item.type === 'header'" class="nav-section-header">
        <span v-if="!isCollapsed" class="section-label">{{ item.label }}</span>
        <span v-else class="section-divider"></span>
      </div>

      <!-- Navigation Link -->
      <RouterLink
        v-else
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item-active': route.path === item.path }"
        @mouseenter="$emit('item-hover', $event, item.key)"
        @mouseleave="$emit('item-leave')"
      >
        <span class="nav-icon">{{ getItemIcon(item, hoveredItemKey, route.path) }}</span>
        <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
      </RouterLink>
    </template>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { getItemIcon } from './sidebarNavConfig';

defineProps({
  navItems: {
    type: Array,
    required: true,
  },
  isCollapsed: {
    type: Boolean,
    required: true,
  },
  hoveredItemKey: {
    type: String,
    default: null,
  },
});

defineEmits(['item-hover', 'item-leave']);

const route = useRoute();
</script>

<style scoped>
.sidebar-nav {
  position: relative;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: space-evenly;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section-header {
  padding: 0 12px;
  min-height: 24px;
  display: flex;
  align-items: center;
  flex: 0.5 1 auto;
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

.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  min-height: 36px;
  gap: 12px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  white-space: nowrap;
  flex: 1 1 auto;
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

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 20px;
  flex-shrink: 0;
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
