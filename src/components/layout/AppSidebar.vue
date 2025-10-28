<template>
  <nav
    class="w-[60px] transition-all duration-300 ease-in-out fixed left-0 top-0 h-screen z-[1000] overflow-hidden hover:w-[280px] group sidebar-nav"
    id="app-sidebar"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div class="p-5 h-20 flex items-center relative sidebar-header">
      <!-- Text that appears on hover -->
      <div
        class="absolute left-5 top-1/2 transform -translate-y-1/2 font-bold text-lg whitespace-nowrap transition-opacity duration-300 ease-in-out sidebar-title"
        :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
      >
        Coryphaeus
      </div>
      <!-- Icon that appears when collapsed -->
      <div
        class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ease-in-out"
        :class="{ 'opacity-0': isHovered, 'opacity-100': !isHovered }"
      >
        <img
          src="/src/assets/images/BDLC Logo transparent.png"
          alt="Logo"
          class="w-8 h-8 object-cover rounded"
        />
      </div>
      <div
        class="absolute right-2 top-1/2 transform -translate-y-1/2 text-base opacity-100 transition-all duration-300 ease-in-out before:content-['❯'] group-hover:before:content-['❮'] sidebar-arrow"
      ></div>
    </div>

    <div class="py-0">
      <!-- App Switcher with integrated dropdown -->
      <AppSwitcher :is-hovered="isHovered" />
    </div>

    <div class="py-0 relative">
      <div
        class="absolute top-5 left-2 text-xs font-semibold uppercase tracking-wider transition-opacity duration-300 ease-in-out pointer-events-none sidebar-menu-label"
        :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
      >
        Main Menu
      </div>
      <div class="h-14"></div>
      <router-link
        to="/matters"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/matters' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">🗄️</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >Matters</span
        >
      </router-link>
      <router-link
        to="/categories"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/categories' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">🗃️</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >Categories</span
        >
      </router-link>
      <router-link
        to="/upload"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/upload' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">📤</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >Upload</span
        >
      </router-link>
      <router-link
        to="/cloud"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/cloud' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">☁️</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >Cloud</span
        >
      </router-link>
      <router-link
        to="/list"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/list' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">📃</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >List</span
        >
      </router-link>
      <router-link
        to="/analyze"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/analyze' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">🕵️</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >Analyze</span
        >
      </router-link>
      <router-link
        to="/about"
        class="flex items-center py-3 px-3 no-underline transition-all duration-200 ease-in-out relative cursor-pointer sidebar-link"
        :class="{ 'sidebar-link-active': $route.path === '/about' }"
      >
        <div class="min-w-[30px] h-[30px] mr-3 flex items-center justify-center">ℹ️</div>
        <span
          class="whitespace-nowrap transition-opacity duration-300 ease-in-out"
          :class="{ 'opacity-100': isHovered, 'opacity-0': !isHovered }"
          >Information</span
        >
      </router-link>
    </div>
  </nav>
</template>

<script>
import AppSwitcher from '../AppSwitcher.vue';

export default {
  name: 'AppSidebar',
  components: {
    AppSwitcher,
  },
  data() {
    return {
      isHovered: false,
    };
  },
};
</script>

<style scoped>
/* Sidebar styles using CSS variables from main.css */
.sidebar-nav {
  background: linear-gradient(to bottom, var(--sidebar-bg-primary), var(--sidebar-bg-secondary));
  color: var(--sidebar-text-primary);
}

.sidebar-header {
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-title {
  color: var(--sidebar-text-primary);
}

.sidebar-arrow {
  color: var(--sidebar-icon-accent);
}

.sidebar-menu-label {
  color: var(--sidebar-text-accent);
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
</style>
