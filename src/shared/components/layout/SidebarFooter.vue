<template>
  <div class="sidebar-footer" :class="{ 'sidebar-footer-collapsed': props.isCollapsed }">
    <!-- Trigger Button -->
    <button
      ref="triggerButton"
      @click="toggleMenu"
      @keydown="handleTriggerKeydown"
      @blur="handleBlur"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      :aria-controls="menuId"
      class="footer-trigger"
    >
      <!-- Avatar -->
      <div class="footer-avatar">
        <div v-if="authStore.userInitials === 'loading'" class="loading-spinner"></div>
        <span v-else>{{ authStore.userInitials }}</span>
      </div>

      <!-- User Name (only when expanded) -->
      <span v-if="!props.isCollapsed" class="footer-username">
        {{ authStore.userDisplayName || 'User' }}
      </span>

      <!-- Chevron (only when expanded) -->
      <div v-if="!props.isCollapsed" class="footer-chevron" :class="{ 'rotate-180': isOpen }">
        ▲
      </div>
    </button>

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
              @keydown="handleItemKeydown($event, index)"
              :ref="
                (el) => {
                  if (el) menuItems[index] = el;
                }
              "
            >
              <div class="menu-item-icon" v-html="link.icon"></div>
              <span class="menu-item-text">{{ link.label }}</span>
            </router-link>
          </div>
        </div>

        <!-- Section 2: Switch Apps -->
        <div class="menu-section">
          <h3 class="menu-section-header">Switch Apps</h3>
          <div class="menu-items">
            <a
              v-for="(app, index) in availableApps"
              :key="app.name"
              :href="getAppUrl(app.subdomain)"
              class="menu-item"
              role="menuitem"
              :tabindex="isOpen ? 0 : -1"
              @click="handleAppSwitch(app)"
              @keydown="handleItemKeydown($event, userLinks.length + index)"
              :ref="
                (el) => {
                  if (el) menuItems[userLinks.length + index] = el;
                }
              "
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
            @keydown="handleItemKeydown($event, userLinks.length + availableApps.length)"
            :ref="
              (el) => {
                if (el) menuItems[userLinks.length + availableApps.length] = el;
              }
            "
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
      @click="closeMenu"
      aria-hidden="true"
    ></div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/core/auth/stores';

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Setup
const router = useRouter();
const authStore = useAuthStore();

// Component state
const isOpen = ref(false);
const triggerButton = ref(null);
const menu = ref(null);
const menuItems = reactive([]);
const focusedIndex = ref(-1);

// Generate unique ID for accessibility
const menuId = `unified-menu-${Math.random().toString(36).substr(2, 9)}`;

// Watch for sidebar collapse and close menu
watch(
  () => props.isCollapsed,
  (newValue, oldValue) => {
    // If sidebar goes from expanded to collapsed, close menu
    if (oldValue === false && newValue === true && isOpen.value) {
      closeMenu();
      nextTick(() => {
        triggerButton.value?.blur();
      });
    }
  }
);

// User menu links
const userLinks = [
  {
    to: '/profile',
    label: 'Profile',
    icon: '<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" /></svg>',
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: '<svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.205 1.251l-1.18 2.044a1 1 0 01-1.186.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.205-1.251l1.18-2.044a1 1 0 011.186-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>',
  },
];

// Available apps configuration
const availableApps = [
  {
    name: 'Book Keeper',
    subdomain: 'bookkeeping',
    description: 'Bookkeeping and accounting',
    icon: '📚',
    port: '3001',
  },
  {
    name: 'Intranet',
    subdomain: 'intranet',
    description: 'Internal portal and resources',
    icon: '📇',
    port: '3000',
  },
];

// Get the base domain from environment
const baseDomain = import.meta.env.VITE_APP_DOMAIN || 'localhost:3000';

/**
 * Toggle menu open/closed state
 */
const toggleMenu = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    nextTick(() => {
      focusedIndex.value = -1;
    });
  } else {
    focusedIndex.value = -1;
  }
};

/**
 * Close menu and return focus to trigger
 */
const closeMenu = () => {
  isOpen.value = false;
  focusedIndex.value = -1;
  nextTick(() => {
    triggerButton.value?.focus();
  });
};

/**
 * Handle blur event to close menu when focus leaves button
 */
const handleBlur = () => {
  // Small delay to allow click events to register
  setTimeout(() => {
    if (isOpen.value) {
      closeMenu();
    }
  }, 150);
};

/**
 * Handle keyboard navigation on trigger button
 */
const handleTriggerKeydown = (event) => {
  switch (event.key) {
    case 'Enter':
    case ' ':
      event.preventDefault();
      if (!isOpen.value) {
        toggleMenu();
        nextTick(() => {
          focusFirstItem();
        });
      } else {
        closeMenu();
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (!isOpen.value) {
        toggleMenu();
        nextTick(() => {
          focusFirstItem();
        });
      } else {
        focusFirstItem();
      }
      break;
    case 'ArrowDown':
      event.preventDefault();
      if (!isOpen.value) {
        toggleMenu();
        nextTick(() => {
          focusLastItem();
        });
      } else {
        focusLastItem();
      }
      break;
    case 'Escape':
      if (isOpen.value) {
        event.preventDefault();
        closeMenu();
      }
      break;
  }
};

/**
 * Handle keyboard navigation within menu items
 */
const handleItemKeydown = (event, index) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      focusNextItem(index);
      break;
    case 'ArrowUp':
      event.preventDefault();
      focusPreviousItem(index);
      break;
    case 'Escape':
      event.preventDefault();
      closeMenu();
      break;
    case 'Home':
      event.preventDefault();
      focusFirstItem();
      break;
    case 'End':
      event.preventDefault();
      focusLastItem();
      break;
    case 'Tab':
      // Allow natural tab flow, but close menu
      closeMenu();
      break;
    case 'Enter':
    case ' ':
      // Let the default behavior handle navigation/click
      break;
  }
};

/**
 * Focus management helpers
 */
const totalItems = userLinks.length + availableApps.length + 1; // +1 for sign out

const focusFirstItem = () => {
  if (totalItems > 0) {
    focusedIndex.value = 0;
    menuItems[0]?.focus();
  }
};

const focusLastItem = () => {
  if (totalItems > 0) {
    focusedIndex.value = totalItems - 1;
    menuItems[totalItems - 1]?.focus();
  }
};

const focusNextItem = (currentIndex) => {
  const nextIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
  focusedIndex.value = nextIndex;
  menuItems[nextIndex]?.focus();
};

const focusPreviousItem = (currentIndex) => {
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
  focusedIndex.value = prevIndex;
  menuItems[prevIndex]?.focus();
};

/**
 * Generate URL for an app subdomain
 */
const getAppUrl = (subdomain) => {
  // Find the app configuration for the subdomain
  const app = availableApps.find((a) => a.subdomain === subdomain);

  // For local development - use specific ports
  if (baseDomain.includes('localhost')) {
    const port = app?.port || '5173';
    return `http://localhost:${port}`;
  }

  // For production
  return `https://${subdomain}.${baseDomain}`;
};

/**
 * Handle menu item click (for router links)
 */
const handleMenuItemClick = () => {
  closeMenu();
};

/**
 * Handle app switching
 */
const handleAppSwitch = (app) => {
  console.log(`Switching to app: ${app.name}`);
  closeMenu();
};

/**
 * Handle sign out
 */
const handleSignOut = async () => {
  try {
    await authStore.logout();
    closeMenu();
    router.push('/login');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
};
</script>

<style scoped>
/* Footer Container */
.sidebar-footer {
  @apply border-t border-slate-600 bg-slate-800;
  position: relative;
}

.sidebar-footer-collapsed {
  @apply border-t border-slate-600;
}

/* Trigger Button */
.footer-trigger {
  @apply w-full flex items-center gap-3 px-3 py-3.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer bg-transparent border-none outline-none;
}

.sidebar-footer-collapsed .footer-trigger {
  @apply justify-center px-0;
}

/* Avatar */
.footer-avatar {
  @apply w-9 h-9 bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0;
}

/* Username */
.footer-username {
  @apply flex-1 text-sm font-medium text-slate-200 truncate text-left;
}

/* Chevron */
.footer-chevron {
  @apply text-slate-400 transition-transform duration-200 text-xs flex-shrink-0;
}

.footer-chevron.rotate-180 {
  transform: rotate(180deg);
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

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

.menu-section-header {
  @apply px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide;
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
