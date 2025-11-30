<template>
  <!-- Unified Menu Popover -->
  <Transition
    enter-active-class="transition ease-out duration-200"
    enter-from-class="opacity-0 translate-y-1 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition ease-in duration-150"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-1 scale-95"
  >
    <div
      v-if="isOpen"
      ref="menu"
      :id="menuId"
      class="unified-menu"
      role="menu"
      :aria-labelledby="menuId + '-trigger'"
    >
      <!-- Section 1: User Actions -->
      <div class="menu-section">
        <h3 class="menu-section-header">Account</h3>
        <div class="menu-items">
          <router-link
            v-for="(link, index) in userLinks"
            :key="link.to"
            :to="link.to"
            class="menu-item"
            role="menuitem"
            :tabindex="isOpen ? 0 : -1"
            @click="handleMenuItemClick"
            @keydown="emit('item-keydown', $event, index)"
            :ref="(el) => setMenuItemRef(el, index)"
          >
            <div class="menu-item-icon" v-html="link.icon"></div>
            <span class="menu-item-text">{{ link.label }}</span>
          </router-link>
        </div>
      </div>

      <!-- Section 2: Switch Apps -->
      <div class="menu-section">
        <div class="menu-section-header-with-button">
          <h3 class="menu-section-header">Switch Apps</h3>
          <a
            href="http://localhost:5173/#/sso"
            class="menu-section-button"
            title="Go to SSO page"
            @click="emit('close')"
          >
            ℹ️
          </a>
        </div>
        <div class="menu-items">
          <a
            v-for="(app, index) in availableApps"
            :key="app.name"
            :href="getAppUrl(app.subdomain)"
            class="menu-item"
            role="menuitem"
            :tabindex="isOpen ? 0 : -1"
            @click="handleAppSwitch(app)"
            @keydown="emit('item-keydown', $event, userLinks.length + index)"
            :ref="(el) => setMenuItemRef(el, userLinks.length + index)"
          >
            <div class="menu-item-icon">{{ app.icon }}</div>
            <div class="menu-item-details">
              <div class="menu-item-text">{{ app.name }}</div>
              <div class="menu-item-description">{{ app.description }}</div>
            </div>
          </a>
        </div>
      </div>

      <!-- Section 3: Sign Out -->
      <div class="menu-section menu-section-last">
        <button
          class="menu-item menu-item-logout"
          role="menuitem"
          :tabindex="isOpen ? 0 : -1"
          @click="handleSignOut"
          @keydown="emit('item-keydown', $event, userLinks.length + availableApps.length)"
          :ref="(el) => setMenuItemRef(el, userLinks.length + availableApps.length)"
        >
          <div class="menu-item-icon">
            <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
              <path
                fill-rule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <span class="menu-item-text">Sign Out</span>
        </button>
      </div>
    </div>
  </Transition>

  <!-- Mobile Backdrop -->
  <div
    v-if="isOpen"
    class="fixed inset-0 z-40 lg:hidden"
    @click="emit('close')"
    aria-hidden="true"
  ></div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/stores';
import { userLinks, availableApps, getAppUrl } from './footerConfig';

// Props
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  menuId: {
    type: String,
    required: true,
  },
  menuItems: {
    type: Array,
    required: true,
  },
});

// Emits
const emit = defineEmits(['close', 'item-keydown']);

// Setup
const router = useRouter();
const authStore = useAuthStore();

// Template refs
const menu = ref(null);

/**
 * Set menu item ref for keyboard navigation
 */
const setMenuItemRef = (el, index) => {
  if (el) {
    props.menuItems[index] = el;
  }
};

/**
 * Handle menu item click (for router links)
 */
const handleMenuItemClick = () => {
  emit('close');
};

/**
 * Handle app switching
 */
const handleAppSwitch = (app) => {
  console.log(`Switching to app: ${app.name}`);
  emit('close');
};

/**
 * Handle sign out
 */
const handleSignOut = async () => {
  try {
    await authStore.logout();
    emit('close');
    router.push('/login');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};
</script>

<style scoped>
/* Unified Menu Popover */
.unified-menu {
  @apply fixed z-[2000] bg-slate-800 border border-slate-600 rounded-lg shadow-lg min-w-[280px] max-w-[320px];
  bottom: 80px; /* Position above the footer */
  left: 68px; /* Static position to the right of 60px collapsed sidebar */
  /* Material Design elevation styles */
  box-shadow:
    0px 5px 5px -3px rgba(0, 0, 0, 0.2),
    0px 8px 10px 1px rgba(0, 0, 0, 0.14),
    0px 3px 14px 2px rgba(0, 0, 0, 0.12);
}

/* Menu Section */
.menu-section {
  @apply border-b border-slate-700;
}

.menu-section-last {
  @apply border-b-0;
}

.menu-section-header-with-button {
  @apply flex items-center justify-between px-4 py-2;
}

.menu-section-header {
  @apply px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide;
}

.menu-section-header-with-button .menu-section-header {
  @apply px-0 py-0;
}

.menu-section-button {
  @apply text-base hover:bg-slate-700 px-2 py-1 rounded transition-colors no-underline;
}

/* Menu Items Container */
.menu-items {
  @apply divide-y divide-slate-700;
}

/* Menu Item */
.menu-item {
  @apply flex items-center px-4 py-3 hover:bg-slate-700 transition-colors no-underline text-slate-200 focus:outline-none focus:bg-slate-700 focus:ring-2 focus:ring-brand-blue focus:ring-inset cursor-pointer bg-transparent border-none w-full text-left;
}

.menu-item-logout {
  @apply hover:bg-red-900 hover:text-red-100 focus:bg-red-900 focus:text-red-100;
}

.menu-item-icon {
  @apply mr-3 flex-shrink-0 text-slate-400 flex items-center justify-center w-5 h-5;
}

.menu-item-text {
  @apply text-sm font-medium flex-1;
}

.menu-item-details {
  @apply flex-1 min-w-0;
}

.menu-item-description {
  @apply text-xs text-slate-400 mt-0.5;
}
</style>
