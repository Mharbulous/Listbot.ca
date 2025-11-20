<template>
  <header
    class="bg-white px-8 py-5 border-b border-slate-200 flex items-center justify-between h-20 box-border flex-shrink-0"
  >
    <!-- Left Section: Page Title -->
    <div class="flex items-center gap-4 flex-shrink-0">
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
        <v-btn color="primary" size="default" variant="elevated" @click="navigateToCategories">
          Categories
        </v-btn>
      </div>
      <!-- Documents button (Matter Categories page only) -->
      <div v-if="isOnMatterCategoriesPage" class="flex items-center">
        <v-btn
          color="primary"
          size="default"
          variant="elevated"
          prepend-icon="mdi-file-document-multiple"
          @click="navigateToDocuments"
        >
          Documents
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

    <!-- Right Section: Mouse Position Debug Display -->
    <div class="flex items-center gap-3">
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
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useDocumentViewStore } from '@/features/documents/stores/documentView';
import { useMatterViewStore } from '@/features/matters/stores/matterView';

const router = useRouter();
const route = useRoute();
const documentViewStore = useDocumentViewStore();
const matterViewStore = useMatterViewStore();

const isHoveringBanner = ref(false);
const isHoveringCloseButton = ref(false);

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

const isOnMatterCategoriesPage = computed(() => {
  // Match routes like /matters/:matterId/categories
  return route.path.match(/^\/matters\/[^/]+\/categories$/);
});

const isBannerClickable = computed(() => !isOnMatterDetailPage.value);

const shouldShowBannerHover = computed(
  () => isBannerClickable.value && isHoveringBanner.value && !isHoveringCloseButton.value
);

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

function navigateToDocuments() {
  // Extract matterId from current route path
  const match = route.path.match(/^\/matters\/([^/]+)\/categories$/);
  if (match && match[1]) {
    router.push(`/matters/${match[1]}/documents`);
  }
}

// File selection triggers for Upload page
function triggerFileSelect() {
  window.dispatchEvent(new CustomEvent('testing-trigger-file-select'));
}

function triggerFolderRecursiveSelect() {
  window.dispatchEvent(new CustomEvent('testing-trigger-folder-recursive-select'));
}
</script>
