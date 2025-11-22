<template>
  <div class="sidebar-header">
    <!-- Logo (shown when expanded) -->
    <RouterLink v-if="!isCollapsed" to="/" class="sidebar-logo">
      <span class="logo-text">ListBot</span>
    </RouterLink>

    <!-- Toggle Button -->
    <button
      class="sidebar-toggle-btn"
      :class="{ 'sidebar-toggle-centered': isCollapsed }"
      @click="$emit('toggle')"
      :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    >
      <span class="toggle-icon">{{ isCollapsed ? '☰' : '«' }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  isCollapsed: {
    type: Boolean,
    required: true,
  },
});

defineEmits(['toggle']);
</script>

<style scoped>
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

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;
}

.sidebar-logo:hover {
  opacity: 0.8;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--sidebar-text-primary);
  white-space: nowrap;
}

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
</style>
