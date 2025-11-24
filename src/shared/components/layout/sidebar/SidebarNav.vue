<template>
  <div class="sidebar-nav">
    <template v-for="item in navItems" :key="item.key">
      <!-- Section Header -->
      <div v-if="item.type === 'header'" class="nav-section-header">
        <span v-if="!isCollapsed" class="section-label">{{ item.label }}</span>
        <span v-else class="section-divider"></span>
      </div>

      <!-- Spacer (invisible element for spacing) -->
      <div v-else-if="item.type === 'spacer'" class="nav-spacer"></div>

      <!-- Navigation Link -->
      <div v-else class="nav-item-wrapper">
        <RouterLink
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item-active': route.path === item.path }"
          @mouseenter="$emit('item-hover', $event, item.key)"
          @mouseleave="$emit('item-leave')"
        >
          <span class="nav-icon">
            <img
              v-if="isImageIcon(getItemIcon(item, hoveredItemKey, route.path))"
              :src="getItemIcon(item, hoveredItemKey, route.path)"
              :alt="item.label"
              class="nav-icon-img"
            />
            <template v-else>{{ getItemIcon(item, hoveredItemKey, route.path) }}</template>
          </span>
          <span v-if="!isCollapsed" class="nav-label">{{ item.label }}</span>
        </RouterLink>
        <RouterLink
          v-if="item.stubPath && !isCollapsed"
          :to="item.stubPath"
          class="stub-button"
          :class="{ 'stub-button-active': route.path === item.stubPath }"
          title="View detailed feature roadmap"
        >
          {{ getStubIcon(item) }}
        </RouterLink>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { getItemIcon, getStubIcon } from './sidebarNavConfig';

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

/**
 * Check if icon is an image path (imported PNG/JPG/SVG) vs emoji string
 */
const isImageIcon = (icon) => {
  return typeof icon === 'string' && (
    icon.includes('.png') ||
    icon.includes('.jpg') ||
    icon.includes('.svg') ||
    icon.includes('.jpeg') ||
    icon.startsWith('/') ||
    icon.startsWith('data:') ||
    icon.startsWith('http')
  );
};
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
  direction: rtl; /* Move scrollbar to left */
}

/* Custom scrollbar styling */
.sidebar-nav::-webkit-scrollbar {
  width: 8px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: linear-gradient(
    to bottom,
    var(--sidebar-bg-primary),
    var(--sidebar-bg-secondary)
  );
  border-radius: 4px;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-text-secondary);
  opacity: 0.3;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--sidebar-hover-text);
  opacity: 0.5;
}

.nav-section-header {
  padding: 0px 12px;
  min-height: 24px;
  display: flex;
  align-items: center;
  flex: 0.5 1 auto;
  direction: ltr; /* Reset content direction */
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

.nav-item-wrapper {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  direction: ltr; /* Reset content direction */
  position: relative;
  min-height: 36px;
}

/* Stub buttons positioned at right: 42px with no additional padding needed */
.nav-item-wrapper:has(.stub-button) .nav-item {
  padding-right: 0px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0px 0px 0px 12px;
  min-height: 36px;
  gap: 12px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  white-space: nowrap;
  width: 100%;
}

.sidebar-collapsed .nav-item {
  /* Keep left alignment for smooth transitions */
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

.nav-icon-img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: brightness(0.9);
}

.nav-item:hover .nav-icon-img {
  filter: brightness(1.1);
}

.nav-item-active .nav-icon-img {
  filter: brightness(1.2);
}

.nav-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stub-button {
  position: absolute;
  right: 1px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  border-radius: 4px;
  padding-left: 0px;
}

.stub-button:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
  transform: translateY(-50%) scale(1.1);
}

.stub-button-active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
}

.nav-spacer {
  flex: 1 1 auto;
  min-height: 36px;
  direction: ltr;
  /* Invisible but takes up space */
}

/* Hide spacer when vertical space is limited */
@media (max-height: 800px) {
  .nav-spacer {
    display: none;
  }
}
</style>
