<template>
  <header
    class="header-fixed ocean-sky-gradient pr-3 py-4 flex items-center h-16 box-border flex-shrink-0"
  >
    <!-- Left Section: Logo and Hamburger (pinned to left) -->
    <div class="flex items-center flex-shrink-0 pl-2">
      <!-- Hamburger Toggle Button (always at same position) -->
      <button
        class="hamburger-btn"
        @click="$emit('toggle-sidebar')"
        :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span class="text-3xl">{{ isCollapsed ? '☰' : '«' }}</span>
      </button>

      <!-- Spacer that adjusts to keep divider aligned with sidebar edge -->
      <div
        class="flex items-center transition-all duration-300"
        :class="isCollapsed ? 'w-[16px]' : 'w-[122px]'"
      >
        <!-- Logo (only visible when sidebar is open) -->
        <RouterLink v-if="!isCollapsed" to="/" class="flex items-center gap-2 text-decoration-none flex-shrink-0 ml-4">
          <span class="text-2xl font-bold text-primary-600">ListBot</span>
        </RouterLink>
      </div>

      <!-- Vertical Divider (aligned with sidebar edge) -->
      <div class="h-8 w-px bg-slate-200 flex-shrink-0"></div>
    </div>

    <!-- Center Section: Breadcrumb Navigation -->
    <div class="flex items-center gap-2 flex-1 min-w-0 px-4">
      <!-- Breadcrumb Navigation -->
      <nav class="flex items-center gap-2 flex-1 min-w-0" aria-label="Breadcrumb">
        <!-- Client Name (only shown when matter is selected) -->
        <template v-if="matterViewStore.hasMatter">
          <span
            @click="clearMatter"
            class="text-xl font-medium text-primary-600 hover:text-primary-700 cursor-pointer hover:underline flex-shrink-0"
            :title="clientName"
          >
            {{ clientName }}
          </span>
        </template>

        <!-- Matter (if selected) -->
        <template v-if="matterViewStore.hasMatter">
          <span class="text-slate-400 flex-shrink-0">›</span>
          <span
            @click="isBannerClickable && navigateToMatter()"
            :class="[
              'text-xl font-medium truncate max-w-md',
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
        </template>

        <!-- Current Page -->
        <span class="text-slate-400 flex-shrink-0">›</span>
        <span class="text-xl font-medium text-slate-800 truncate" :title="pageTitle">
          {{ pageTitle }}
        </span>

        <!-- Document (if viewing) -->
        <template v-if="documentViewStore.documentName">
          <span class="text-slate-400 flex-shrink-0">›</span>
          <span
            class="text-xl font-medium text-slate-800 truncate max-w-xs"
            :title="documentViewStore.documentName"
          >
            {{ documentViewStore.documentName }}
          </span>
        </template>
      </nav>
    </div>

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

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['toggle-sidebar']);

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

const clientName = computed(() => {
  if (!matterViewStore.hasMatter) return null;
  const clients = matterViewStore.selectedMatter?.clients || [];
  return clients.length > 0 ? clients[0] : 'No Client';
});

const isOnMatterDetailPage = computed(() => {
  const matterId = matterViewStore.selectedMatter?.id;
  return matterId ? route.path === `/matters/${matterId}` : false;
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

<style scoped>
.header-fixed {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 100;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #64748b;
  border-radius: 6px;
  transition: all 200ms ease-in-out;
  flex-shrink: 0;
}

.hamburger-btn:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

/* Ocean sky gradient - air above the water */
.ocean-sky-gradient {
  background: linear-gradient(
    to bottom,
    #f0f9ff 0%,     /* Sky-100 (Air Gradient Start) */
    #e0f2fe 100%    /* Sky-200 (Air Gradient End) */
  );
  /* Thin bottom border representing ocean waves */
  border-bottom: 2px solid #22d3ee; /* Cyan 400 - matches ocean surface */
}
</style>
