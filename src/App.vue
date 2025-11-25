<template>
  <div class="flex flex-col min-h-screen">
    <!-- Loading state during initialization -->
    <div v-if="!authStore.isInitialized" class="flex items-center justify-center w-full h-screen">
      <div class="text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-gray-600">Initializing...</p>
      </div>
    </div>

    <!-- Normal app content -->
    <template v-else>
      <!-- T-Layout: Column [ Header, Row [ Sidebar, Content ] ] -->
      <template v-if="$route.path !== '/login'">
        <!-- Header (spans full width at top) -->
        <AppHeader
          :is-collapsed="isSidebarCollapsed"
          @toggle-sidebar="toggleSidebar"
        />

        <!-- Row container for Sidebar and Content -->
        <div class="flex flex-grow mt-16" style="height: calc(100vh - 64px)">
          <!-- Sidebar (left, below header) -->
          <NewSideBar :is-collapsed="isSidebarCollapsed" />

          <!-- Main content (right, below header) -->
          <div
            class="flex-grow transition-all duration-300 overflow-auto"
            :class="{
              'ml-[64px]': isSidebarCollapsed,
              'ml-[170px]': !isSidebarCollapsed,
            }"
            style="min-width: 0"
          >
            <router-view />
          </div>
        </div>
      </template>

      <!-- Login page (no sidebar/header) -->
      <div
        v-else
        class="flex-grow flex flex-col justify-center items-center"
      >
        <router-view />
      </div>

      <!-- Mobile menu overlay (if needed) -->
      <template v-if="$route.path !== '/login'">
        <div
          class="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[99]"
          :class="{ hidden: !isMobileMenuOpen, block: isMobileMenuOpen }"
          @click="closeMobileMenu"
        ></div>
      </template>
    </template>
  </div>
</template>

<script>
import { onUnmounted } from 'vue';
import { useAuthStore } from './core/auth/stores';
import NewSideBar from './shared/components/layout/AppSideBar.vue';
import AppHeader from './shared/components/layout/AppHeader.vue';
import { useFavicon } from './core/composables/useFavicon';
import { useAsyncInspector } from './core/composables/useAsyncInspector';
import { useAsyncRegistry } from './core/composables/useAsyncRegistry';

export default {
  name: 'App',
  components: {
    NewSideBar,
    AppHeader,
  },
  setup() {
    const authStore = useAuthStore();
    const registry = useAsyncRegistry();

    // Initialize favicon switching
    useFavicon();

    // Development inspector integration
    const inspector = useAsyncInspector();

    // Optional: Auto-log stats every 30 seconds in development
    let statsIntervalId = null;
    if (inspector.isEnabled) {
      const intervalId = setInterval(() => {
        if (inspector.stats.value.total > 0) {
          inspector.logStats();
        }
      }, 30000);

      // Register the monitoring interval with the async registry
      statsIntervalId = registry.register(
        registry.generateId('async-monitoring'),
        'async-monitoring',
        () => {
          clearInterval(intervalId);
        },
        {
          component: 'App',
          purpose: 'stats-logging',
          interval: 30000,
        }
      );
    }

    onUnmounted(() => {
      if (statsIntervalId) {
        registry.unregister(statsIntervalId);
      }
    });

    return { authStore, inspector };
  },
  data() {
    return {
      isMobileMenuOpen: false,
      isSidebarCollapsed: localStorage.getItem('sidebarCollapsed') === 'true',
    };
  },
  methods: {
    closeMobileMenu() {
      this.isMobileMenuOpen = false;
    },
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', this.isSidebarCollapsed);
    },
  },
};
</script>

<style scoped>
.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(59, 130, 246, 0.3);
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
