<template>
  <header
    class="bg-white px-8 py-4 border-b border-slate-200 flex items-center justify-between h-16 box-border flex-shrink-0"
  >
    <!-- Left Section: Breadcrumb Navigation -->
    <nav class="flex items-center gap-2 flex-1 min-w-0" aria-label="Breadcrumb">
      <!-- Client Name -->
      <span class="text-sm font-medium text-slate-800 flex-shrink-0" :title="authStore.userDisplayName">
        {{ authStore.userDisplayName }}
      </span>

      <!-- Matter (if selected) -->
      <template v-if="matterViewStore.hasMatter">
        <span class="text-slate-400 flex-shrink-0">›</span>
        <div class="flex items-center gap-1.5 min-w-0">
          <span
            @click="isBannerClickable && navigateToMatter()"
            :class="[
              'text-sm font-medium truncate max-w-md',
              isBannerClickable
                ? 'text-primary-600 hover:text-primary-700 cursor-pointer hover:underline'
                : 'text-slate-800 cursor-default',
            ]"
            :title="
              matterViewStore.selectedMatter.matterNumber +
              ': ' +
              matterViewStore.selectedMatter.description
            "
          >
            {{ matterViewStore.selectedMatter.matterNumber }}:
            {{ matterViewStore.selectedMatter.description }}
          </span>
          <button
            @click.stop="clearMatter"
            class="flex-shrink-0 w-4 h-4 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            title="Clear selected matter"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </template>

      <!-- Current Page -->
      <span class="text-slate-400 flex-shrink-0">›</span>
      <span class="text-sm font-medium text-slate-800 truncate" :title="pageTitle">
        {{ pageTitle }}
      </span>

      <!-- Document (if viewing) -->
      <template v-if="documentViewStore.documentName">
        <span class="text-slate-400 flex-shrink-0">›</span>
        <span
          class="text-sm font-medium text-slate-800 truncate max-w-xs"
          :title="documentViewStore.documentName"
        >
          {{ documentViewStore.documentName }}
        </span>
      </template>
    </nav>

    <!-- Right Section: Contextual Action Buttons -->
    <div class="flex items-center gap-3 flex-shrink-0">
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

      <!-- Categories button (Collect page only) -->
      <div v-if="isOnMatterDocumentsPage" class="flex items-center">
        <v-btn color="primary" size="default" variant="elevated" @click="navigateToCategories">
          Categories
        </v-btn>
      </div>

      <!-- Collect button (Matter Categories page only) -->
      <div v-if="isOnMatterCategoriesPage" class="flex items-center">
        <v-btn
          color="primary"
          size="default"
          variant="elevated"
          prepend-icon="mdi-file-document-multiple"
          @click="navigateToDocuments"
        >
          Collect
        </v-btn>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/core/auth/stores/authStore';
import { useDocumentViewStore } from '@/features/documents/stores/documentView';
import { useMatterViewStore } from '@/features/matters/stores/matterView';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const documentViewStore = useDocumentViewStore();
const matterViewStore = useMatterViewStore();

const pageTitle = computed(() => {
  if (route.meta.titleFn && route.path.includes('/review/')) {
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
  window.dispatchEvent(new CustomEvent('upload-trigger-file-select'));
}

function triggerFolderRecursiveSelect() {
  window.dispatchEvent(new CustomEvent('upload-trigger-folder-recursive-select'));
}
</script>
