<template>
  <header
    class="fixed top-0 left-[60px] right-0 z-[50] bg-white px-8 py-5 border-b border-slate-200 flex items-center justify-between h-20 box-border"
  >
    <!-- Left Section: Menu + Page Title -->
    <div class="flex items-center gap-4 flex-shrink-0">
      <button
        class="md:hidden bg-transparent border-none text-2xl cursor-pointer text-slate-600"
        id="mobileMenuBtn"
      >
        ☰
      </button>
      <h1 class="page-title text-2xl md:text-xl font-semibold text-slate-800 whitespace-nowrap">
        {{ pageTitle }}
      </h1>
      <!-- Add to Queue button (Upload page only) -->
      <div v-if="route.path === '/upload'" class="flex items-center">
        <v-menu location="bottom">
          <template v-slot:activator="{ props: menuProps }">
            <v-btn
              color="primary"
              size="default"
              variant="elevated"
              prepend-icon="mdi-plus"
              append-icon="mdi-chevron-down"
              v-bind="menuProps"
            >
              Add to Queue
            </v-btn>
          </template>

          <v-list density="compact">
            <v-list-item
              prepend-icon="mdi-file-multiple"
              title="Files"
              @click="triggerFileSelect"
            />
            <v-list-item
              prepend-icon="mdi-folder-multiple"
              title="Folder w. Subfolders"
              @click="triggerFolderRecursiveSelect"
            />
          </v-list>
        </v-menu>
      </div>
      <!-- Categories button (Matter Documents page only) -->
      <div v-if="isOnMatterDocumentsPage" class="flex items-center">
        <v-btn
          color="primary"
          size="default"
          variant="elevated"
          @click="navigateToCategories"
        >
          Categories
        </v-btn>
      </div>
    </div>

    <!-- Center Section: Active Matter Display -->
    <div
      v-if="matterViewStore.hasMatter"
      @click="isBannerClickable && navigateToMatter()"
      @mouseenter="isHoveringBanner = true"
      @mouseleave="isHoveringBanner = false"
      :class="[
        'flex items-center gap-2 px-4 py-2 border border-amber-300 rounded-lg mx-4 flex-1 max-w-2xl transition-colors',
        shouldShowBannerHover ? 'bg-amber-100' : 'bg-amber-50',
        isBannerClickable ? 'cursor-pointer' : 'cursor-default',
      ]"
      :title="isBannerClickable ? 'View Matter Details' : ''"
    >
      <p class="flex-1 min-w-0 text-sm font-medium text-slate-800 truncate text-center">
        {{ matterViewStore.selectedMatter.matterNumber }}:
        {{ matterViewStore.selectedMatter.description }}
      </p>
      <button
        @click.stop="clearMatter"
        @mouseenter="isHoveringCloseButton = true"
        @mouseleave="isHoveringCloseButton = false"
        class="flex-shrink-0 w-5 h-5 flex items-center justify-center text-amber-700 hover:text-amber-900 hover:bg-amber-200 rounded transition-colors"
        title="Clear selected matter"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Right Section: User -->
    <div class="flex items-center gap-3">
      <!-- Mouse X Position Debug Display -->
      <div
        class="px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-700"
      >
        X: {{ mouseX }}px
      </div>

      <div
        class="relative inline-block cursor-pointer outline-none group"
        tabindex="0"
        id="user-dropdown-menu"
      >
        <div
          class="w-10 h-10 md:w-9 md:h-9 bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white rounded-full flex items-center justify-center font-semibold md:text-sm shadow-sm group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200"
        >
          <div v-if="authStore.userInitials === 'loading'" class="loading-spinner"></div>
          <span v-else>{{ authStore.userInitials }}</span>
        </div>
        <div
          class="user-dropdown-menu hidden group-focus-within:block absolute top-full right-0 bg-white border border-gray-200/50 rounded-xl shadow-xl backdrop-blur-sm z-[1000] min-w-[200px] overflow-hidden mt-2"
        >
          <div class="py-1">
            <router-link
              v-for="link in menuLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 w-full px-4 py-3 text-left bg-transparent border-none text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-blue-50 hover:text-brand-blue group/item no-underline"
            >
              <div
                class="w-4 h-4 flex items-center justify-center text-gray-400 group-hover/item:text-brand-blue transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4" v-html="link.icon" />
              </div>
              <span>{{ link.label }}</span>
            </router-link>
          </div>
          <div class="border-t border-gray-100 py-2">
            <div class="px-4 py-2 text-right">
              <div class="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                Signed in as
              </div>
              <div class="text-sm text-gray-800 font-medium mt-1">
                {{ authStore.isInitialized ? authStore.userDisplayName || 'User' : 'Loading...' }}
              </div>
            </div>
          </div>
          <div class="border-t border-gray-100 py-1">
            <button
              class="flex items-center gap-3 w-full px-4 py-3 text-left bg-transparent border-none text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-red-50 hover:text-red-600 group/item"
              @click="signOut"
            >
              <div
                class="w-4 h-4 flex items-center justify-center text-gray-400 group-hover/item:text-red-600 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                  <path
                    fill-rule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/core/auth/stores';
import { useDocumentViewStore } from '@/features/documents/stores/documentView';
import { useMatterViewStore } from '@/features/matters/stores/matterView';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const documentViewStore = useDocumentViewStore();
const matterViewStore = useMatterViewStore();

const isHoveringBanner = ref(false);
const isHoveringCloseButton = ref(false);
const mouseX = ref(0);
let lastUpdateTime = 0;

const menuLinks = [
  {
    to: '/settings',
    label: 'Settings',
    icon: '<path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.205 1.251l-1.18 2.044a1 1 0 01-1.186.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.205-1.251l1.18-2.044a1 1 0 011.186-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />',
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: '<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />',
  },
];

const pageTitle = computed(() => {
  if (route.meta.titleFn && route.path.startsWith('/documents/view/')) {
    const documentName = documentViewStore.documentName || 'Loading...';
    return documentName;
  }
  return route.meta.title || 'Home';
});

const isOnMatterDetailPage = computed(() => {
  const matterId = matterViewStore.selectedMatter?.id;
  return matterId ? route.path === `/matters/${matterId}` : false;
});

const isOnMatterDocumentsPage = computed(() => {
  // Match routes like /matters/:matterId/documents
  return route.path.match(/^\/matters\/[^/]+\/documents$/);
});

const isBannerClickable = computed(() => !isOnMatterDetailPage.value);

const shouldShowBannerHover = computed(
  () => isBannerClickable.value && isHoveringBanner.value && !isHoveringCloseButton.value
);

async function signOut() {
  try {
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Sign out failed:', error);
  }
}

function clearMatter() {
  matterViewStore.clearMatter();
  router.push('/matters');
}

function navigateToMatter() {
  const matterId = matterViewStore.selectedMatter?.id;
  if (matterId) {
    router.push(`/matters/${matterId}`);
  }
}

function navigateToCategories() {
  // Extract matterId from current route path
  const match = route.path.match(/^\/matters\/([^/]+)\/documents$/);
  if (match && match[1]) {
    router.push(`/matters/${match[1]}/categories`);
  }
}

// File selection triggers for Upload page
function triggerFileSelect() {
  window.dispatchEvent(new CustomEvent('testing-trigger-file-select'));
}

function triggerFolderRecursiveSelect() {
  window.dispatchEvent(new CustomEvent('testing-trigger-folder-recursive-select'));
}

function updateMousePosition(event) {
  const currentTime = Date.now();
  // Throttle to 100ms
  if (currentTime - lastUpdateTime >= 100) {
    mouseX.value = event.clientX;
    lastUpdateTime = currentTime;
  }
}

// Add global mousemove and drag listeners on mount
onMounted(() => {
  window.addEventListener('mousemove', updateMousePosition);
  window.addEventListener('drag', updateMousePosition);
  window.addEventListener('dragover', updateMousePosition);
});

// Clean up listeners on unmount
onUnmounted(() => {
  window.removeEventListener('mousemove', updateMousePosition);
  window.removeEventListener('drag', updateMousePosition);
  window.removeEventListener('dragover', updateMousePosition);
});
</script>

<style scoped>
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
</style>
