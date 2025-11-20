<template>
  <header
    class="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between h-16 box-border flex-shrink-0"
  >
    <!-- Left Section: Page Title -->
    <div class="flex items-center gap-4 flex-shrink-0">
      <h1 class="page-title text-2xl md:text-xl font-semibold text-slate-800 whitespace-nowrap">
        {{ pageTitle }}
      </h1>
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

    <!-- Right Section: Contextual Action Buttons -->
    <div class="flex items-center gap-3">
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
              title="Folder"
              @click="triggerFolderRecursiveSelect"
            />
          </v-list>
        </v-menu>
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

    <!-- Right Section: Categories Button -->
    <div class="flex items-center gap-3">
      <!-- Categories button (Matter Documents page only) -->
      <div v-if="isOnMatterDocumentsPage" class="flex items-center">
        <v-btn color="primary" size="default" variant="elevated" @click="navigateToCategories">
          Categories
        </v-btn>
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
