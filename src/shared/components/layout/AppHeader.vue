<template>
  <header
    class="header-fixed ocean-sky-gradient pr-3 py-4 flex items-center h-16 box-border flex-shrink-0"
  >
    <!-- Left Section: Logo and Hamburger (pinned to left) -->
    <div class="flex items-center flex-shrink-0 pl-3">
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
        :class="isCollapsed ? 'w-[22px]' : 'w-[118px]'"
      >
        <!-- Logo (only visible when sidebar is open) -->
        <RouterLink v-if="!isCollapsed" to="/" class="flex items-center gap-2 text-decoration-none flex-shrink-0 ml-4">
          <span class="text-lg font-bold text-primary-600">ListBot</span>
        </RouterLink>
      </div>

      <!-- Vertical Divider (aligned with sidebar edge) -->
      <div class="h-8 w-px bg-slate-200 flex-shrink-0"></div>
    </div>

    <!-- Center Section: Breadcrumb Navigation OR Matters Filter Controls -->
    <div class="flex items-center gap-2 flex-1 min-w-0 px-4">
      <!-- Matters Filter Controls (only on /matters page) -->
      <template v-if="isOnMattersListPage">
        <div class="flex items-center gap-3 flex-1">
          <!-- Segmented Control: My Matters / Firm Matters -->
          <div class="matters-switch inline-flex rounded-lg bg-white/50 p-0.5 flex-shrink-0 relative">
            <!-- Sliding background indicator with selected text -->
            <div
              class="switch-indicator"
              :class="{
                'switch-indicator-right': !mattersFilterStore.showMyMattersOnly,
                'switch-indicator-nudge-left': isHoveringMyMatters && !mattersFilterStore.showMyMattersOnly,
                'switch-indicator-nudge-right': isHoveringFirmMatters && mattersFilterStore.showMyMattersOnly,
              }"
            >
              <!-- Text that moves with the indicator -->
              <span class="switch-indicator-text">
                <Transition name="switch-text-fade" mode="out-in">
                  <span :key="mattersFilterStore.showMyMattersOnly ? 'my' : 'firm'">
                    {{ mattersFilterStore.showMyMattersOnly ? 'My Matters' : 'Firm Matters' }}
                  </span>
                </Transition>
              </span>
            </div>

            <!-- Background buttons (clickable areas with static text) -->
            <button
              @click="mattersFilterStore.setShowMyMatters(true)"
              @mouseenter="isHoveringMyMatters = true"
              @mouseleave="isHoveringMyMatters = false"
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 relative',
                mattersFilterStore.showMyMattersOnly
                  ? 'text-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/40',
              ]"
            >
              My Matters
            </button>
            <button
              @click="mattersFilterStore.setShowMyMatters(false)"
              @mouseenter="isHoveringFirmMatters = true"
              @mouseleave="isHoveringFirmMatters = false"
              :class="[
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-300 relative',
                !mattersFilterStore.showMyMattersOnly
                  ? 'text-transparent'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/40',
              ]"
            >
              Firm Matters
            </button>
          </div>

          <!-- Dropdown: Status Filter -->
          <div class="relative flex-shrink-0" data-matters-dropdown>
            <button
              @click="mattersFilterStore.toggleStatusDropdown()"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2"
            >
              <span>Status: {{ mattersFilterStore.statusFilterLabel }}</span>
              <svg
                class="w-4 h-4 transition-transform"
                :class="{ 'rotate-180': mattersFilterStore.statusDropdownOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <!-- Dropdown Menu -->
            <div
              v-if="mattersFilterStore.statusDropdownOpen"
              class="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
            >
              <button
                @click="mattersFilterStore.setStatusFilter('active')"
                class="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                :class="
                  mattersFilterStore.statusFilter === 'active'
                    ? 'text-blue-600 font-medium'
                    : 'text-slate-700'
                "
              >
                Active
              </button>
              <button
                @click="mattersFilterStore.setStatusFilter('archived')"
                class="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                :class="
                  mattersFilterStore.statusFilter === 'archived'
                    ? 'text-blue-600 font-medium'
                    : 'text-slate-700'
                "
              >
                Archived
              </button>
              <button
                @click="mattersFilterStore.setStatusFilter('all')"
                class="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                :class="
                  mattersFilterStore.statusFilter === 'all'
                    ? 'text-blue-600 font-medium'
                    : 'text-slate-700'
                "
              >
                All
              </button>
            </div>
          </div>

          <!-- Search Input with Integrated Actions -->
          <div class="flex-1 relative min-w-0">
            <input
              v-model="mattersFilterStore.searchText"
              type="text"
              placeholder="filter matters..."
              class="w-full pl-3 pr-24 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all placeholder:text-slate-400"
            />
            <!-- Integrated Search Actions -->
            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <!-- Case Sensitive Toggle -->
              <button
                @click="mattersFilterStore.toggleCaseSensitive()"
                :class="[
                  'p-1.5 rounded text-xs font-semibold transition-colors',
                  mattersFilterStore.caseSensitive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
                ]"
                :title="
                  mattersFilterStore.caseSensitive ? 'Case sensitive' : 'Case insensitive'
                "
              >
                <span class="font-mono">{{ mattersFilterStore.caseSensitive ? 'Aa' : 'aA' }}</span>
              </button>
              <!-- Whole Word Toggle -->
              <button
                @click="mattersFilterStore.toggleWholeWord()"
                :class="[
                  'px-1.5 py-1.5 rounded text-xs font-semibold transition-colors',
                  mattersFilterStore.wholeWord
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
                ]"
                :title="
                  mattersFilterStore.wholeWord ? 'Match whole words only' : 'Match partial words'
                "
              >
                <span class="font-mono">{{ mattersFilterStore.wholeWord ? 'Word' : 'Wo__' }}</span>
              </button>
              <!-- Clear Button -->
              <button
                v-if="mattersFilterStore.searchText"
                @click="mattersFilterStore.clearSearchText()"
                class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
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
          </div>

          <!-- New Matter Button -->
          <router-link
            to="/matters/new"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Matter
          </router-link>
        </div>
      </template>

      <!-- Breadcrumb Navigation (all other pages) -->
      <nav v-else class="flex items-center gap-2 flex-1 min-w-0" aria-label="Breadcrumb">
        <!-- Client Name (only shown when matter is selected) -->
        <template v-if="matterViewStore.hasMatter">
          <span
            @click="clearMatter"
            class="text-sm font-medium text-primary-600 hover:text-primary-700 cursor-pointer hover:underline flex-shrink-0"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/core/auth/stores/authStore';
import { useDocumentViewStore } from '@/features/documents/stores/documentView';
import { useMatterViewStore } from '@/features/matters/stores/matterView';
import { useMattersFilterStore } from '@/features/matters/stores/mattersFilter';

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
const mattersFilterStore = useMattersFilterStore();

// Hover state for matters switch anticipatory nudge
const isHoveringMyMatters = ref(false);
const isHoveringFirmMatters = ref(false);

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

const isOnMatterDocumentsPage = computed(() => {
  // Match routes like /matters/:matterId/documents
  return route.path.match(/^\/matters\/[^/]+\/documents$/);
});

const isOnMatterCategoriesPage = computed(() => {
  // Match routes like /matters/:matterId/categories
  return route.path.match(/^\/matters\/[^/]+\/categories$/);
});

const isBannerClickable = computed(() => !isOnMatterDetailPage.value);

const isOnMattersListPage = computed(() => route.path === '/matters');

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

// Close dropdown when clicking outside (for matters filter)
function handleClickOutside(event) {
  if (mattersFilterStore.statusDropdownOpen) {
    const dropdown = event.target.closest('[data-matters-dropdown]');
    if (!dropdown) {
      mattersFilterStore.closeStatusDropdown();
    }
  }
}

// Setup click-outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

// Clean up event listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
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

/* Matters switch animations */
.matters-switch {
  position: relative;
}

.switch-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 6px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.switch-indicator-right {
  transform: translateX(100%);
}

/* Anticipatory nudge when hovering inactive button */
.switch-indicator-nudge-left {
  transform: translateX(calc(100% - 5px)) !important;
}

.switch-indicator-nudge-right {
  transform: translateX(5px) !important;
}

/* Text inside the sliding indicator */
.switch-indicator-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 0.875rem; /* text-sm */
  font-weight: 500; /* font-medium */
  white-space: nowrap;
  pointer-events: none;
}

/* Fade transition for text when switching */
.switch-text-fade-enter-active,
.switch-text-fade-leave-active {
  transition: opacity 0.15s ease;
}

.switch-text-fade-enter-from,
.switch-text-fade-leave-to {
  opacity: 0;
}

.switch-text-fade-enter-to,
.switch-text-fade-leave-from {
  opacity: 1;
}

.matters-switch button {
  cursor: pointer;
  border: none;
  background: transparent;
}
</style>
