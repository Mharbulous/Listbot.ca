<template>
  <nav class="w-[60px] fixed left-0 top-0 h-screen z-[1000] sidebar-nav" id="app-sidebar">
    <div class="p-5 h-20 flex items-center justify-center sidebar-header">
      <img
        src="/src/assets/images/BDLC Logo transparent.png"
        alt="Logo"
        class="w-8 h-8 object-cover rounded"
      />
    </div>

    <div class="py-0">
      <!-- App Switcher -->
      <AppSwitcher :is-hovered="false" />
    </div>

    <div class="py-0 relative">
      <div class="h-8"></div>

      <!-- Navigation Links with Tooltips -->
      <router-link
        to="/matters"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/matters' }"
        @mouseenter="setHoveredItem('matters', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">🗄️</div>
      </router-link>

      <router-link
        to="/categories"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/categories' }"
        @mouseenter="setHoveredItem('categories', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">🗃️</div>
      </router-link>

      <router-link
        to="/upload"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/upload' }"
        @mouseenter="setHoveredItem('upload', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">📤</div>
      </router-link>

      <router-link
        to="/cloud"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/cloud' }"
        @mouseenter="setHoveredItem('cloud', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">☁️</div>
      </router-link>

      <router-link
        to="/list"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/list' }"
        @mouseenter="setHoveredItem('list', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">📃</div>
      </router-link>

      <router-link
        to="/analyze"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/analyze' }"
        @mouseenter="setHoveredItem('analyze', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">🕵️</div>
      </router-link>

      <router-link
        to="/about"
        class="flex items-center justify-center py-3 px-3 no-underline transition-all duration-200 ease-in-out cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/about' }"
        @mouseenter="setHoveredItem('about', $event)"
        @mouseleave="hoveredItem = null"
      >
        <div class="w-[30px] h-[30px] flex items-center justify-center text-xl">ℹ️</div>
      </router-link>
    </div>

    <!-- Floating Tooltip (rendered outside sidebar, using Teleport) -->
    <Teleport to="body">
      <div
        v-if="hoveredItem && tooltipPosition"
        class="sidebar-tooltip"
        :style="{ top: tooltipPosition.top + 'px', left: tooltipPosition.left + 'px' }"
      >
        {{ tooltipLabels[hoveredItem] }}
      </div>
    </Teleport>
  </nav>
</template>

<script>
import AppSwitcher from '../AppSwitcher.vue'

export default {
  name: 'AppSidebar',
  components: {
    AppSwitcher,
  },
  data() {
    return {
      hoveredItem: null,
      tooltipPosition: null,
      tooltipLabels: {
        matters: 'Matters',
        categories: 'Categories',
        upload: 'Upload',
        cloud: 'Cloud',
        list: 'List',
        analyze: 'Analyze',
        about: 'Information',
      },
    }
  },
  methods: {
    setHoveredItem(item, event) {
      this.hoveredItem = item
      const rect = event.currentTarget.getBoundingClientRect()
      this.tooltipPosition = {
        top: rect.top + rect.height / 2,
        left: 68, // 60px sidebar + 8px spacing
      }
    },
  },
}
</script>

<style scoped>
/* Sidebar styles using CSS variables from main.css */
.sidebar-nav {
  background: linear-gradient(
    to bottom,
    var(--sidebar-bg-primary),
    var(--sidebar-bg-secondary)
  );
  color: var(--sidebar-text-primary);
}

.sidebar-header {
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-link {
  color: var(--sidebar-text-secondary);
}

.sidebar-link:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
}

.sidebar-link-active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

/* Floating Tooltip styles */
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
