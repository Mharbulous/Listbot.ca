<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Console-style Controls -->
    <div class="px-6 py-3">
      <div class="flex items-center gap-3">
        <!-- Filter Options -->
        <div class="flex items-center gap-2">
          <!-- My Matters / All Matters -->
          <button
            @click="showMyMattersOnly = !showMyMattersOnly"
            :class="[
              'px-2.5 py-1.5 rounded text-sm font-medium transition-colors',
              showMyMattersOnly
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50',
            ]"
            :title="showMyMattersOnly ? 'My matters' : 'All firm matters'"
          >
            <!-- Single person icon when showing only my matters -->
            <svg v-if="showMyMattersOnly" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
            <!-- Three people icon when showing all firm matters -->
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </svg>
          </button>

          <!-- Active / All (including archived) -->
          <button
            @click="showArchivedMatters = !showArchivedMatters"
            :class="[
              'px-2.5 py-1.5 rounded text-sm font-medium transition-colors',
              showArchivedMatters
                ? 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50'
                : 'bg-slate-800 text-white',
            ]"
            :title="showArchivedMatters ? 'Archive files included' : 'Active files only'"
          >
            <!-- Folders icon when showing active only (teenyicons:folders-solid) -->
            <svg
              v-if="!showArchivedMatters"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 15 15"
            >
              <path
                d="M4.5 0A1.5 1.5 0 0 0 3 1.5v7A1.5 1.5 0 0 0 4.5 10h9A1.5 1.5 0 0 0 15 8.5v-5A1.5 1.5 0 0 0 13.5 2H9.707l-2-2z"
              />
              <path
                d="M12 11H4.5A2.5 2.5 0 0 1 2 8.5V5h-.5A1.5 1.5 0 0 0 0 6.5v7A1.5 1.5 0 0 0 1.5 15h9a1.5 1.5 0 0 0 1.5-1.5z"
              />
            </svg>
            <!-- Archive icon when showing active + archived (teenyicons:archive-solid) -->
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 15 15">
              <path d="M0 0h15v5H0z" />
              <path
                fill-rule="evenodd"
                d="M1 6v7.5A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5V6zm9 3H5V8h5z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Case Sensitive -->
          <button
            @click="caseSensitive = !caseSensitive"
            :class="[
              'px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-colors',
              caseSensitive
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50',
            ]"
            :title="caseSensitive ? 'Case sensitive' : 'Case insensitive'"
          >
            {{ caseSensitive ? 'A ≠ a' : 'A = a' }}
          </button>

          <!-- Whole Word Match -->
          <button
            @click="wholeWord = !wholeWord"
            :class="[
              'px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-colors',
              wholeWord
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50',
            ]"
            :title="wholeWord ? 'Match whole words only' : 'Match partial words'"
          >
            {{ wholeWord ? 'word' : 'wor_' }}
          </button>
        </div>

        <!-- Search Input -->
        <div class="flex-1 relative">
          <input
            v-model="searchText"
            type="text"
            placeholder="filter matters..."
            class="w-full px-3 py-1.5 bg-white/50 border-b-2 border-slate-300 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all placeholder:text-slate-400"
          />
          <svg
            v-if="!searchText"
            class="absolute right-2 top-2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <button
            v-else
            @click="searchText = ''"
            class="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
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

        <!-- New Matter Button -->
        <router-link
          to="/matters/new"
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1.5"
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

        <!-- Results Summary -->
        <div v-if="searchText" class="text-xs text-slate-500 whitespace-nowrap ml-2">
          {{ filteredMatters.length }}/{{ visibleMatters.length }}
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="flex-1 overflow-auto">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex items-center justify-center h-64 bg-white border border-slate-200 m-6 rounded-lg shadow-sm"
      >
        <div class="text-center">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
          ></div>
          <p class="text-slate-600">Loading matters...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 m-6 rounded-lg shadow-sm p-6">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="text-red-900 font-medium">Error loading matters</h3>
            <p class="text-red-700 text-sm">{{ error }}</p>
          </div>
        </div>
        <button
          @click="fetchMatters"
          class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
        >
          Try Again
        </button>
      </div>

      <!-- Data Table -->
      <div v-else class="bg-white border border-slate-200 m-6 rounded-lg shadow-sm overflow-hidden">
        <!-- Empty State -->
        <div
          v-if="filteredMatters.length === 0"
          class="flex flex-col items-center justify-center h-64 text-slate-500"
        >
          <svg
            class="w-16 h-16 mb-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="text-lg font-medium mb-2">No matters found</p>
          <p class="text-sm">
            {{
              searchText ? 'Try adjusting your search' : 'Create your first matter to get started'
            }}
          </p>
        </div>

        <!-- Table with Data -->
        <table v-else class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Matter No.
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Client(s)
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Adverse Parties
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Last Accessed
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr
              v-for="matter in filteredMatters"
              :key="matter.id"
              :class="[
                'hover:bg-slate-50 cursor-pointer transition-colors',
                isSelected(matter) ? 'bg-blue-50 border-l-4 border-l-blue-500' : '',
              ]"
              @click="selectMatter(matter)"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                <div class="flex items-center gap-2">
                  {{ matter.matterNumber }}
                  <span
                    v-if="matter.archived"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
                  >
                    Archived
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-900">
                {{ Array.isArray(matter.clients) ? matter.clients.join(', ') : matter.clients }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-700">
                {{ matter.description }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-700">
                {{
                  Array.isArray(matter.adverseParties)
                    ? matter.adverseParties.join(', ')
                    : matter.adverseParties
                }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ formatDate(matter.lastAccessed) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMatters } from '../composables/useMatters.js';
import { useAuthStore } from '../core/stores/auth.js';
import { useMatterViewStore } from '../stores/matterView.js';

// Component configuration
defineOptions({
  name: 'MattersView',
});

// Router for navigation
const router = useRouter();

// Auth store for current user
const authStore = useAuthStore();

// Matter view store for tracking selected matter
const matterViewStore = useMatterViewStore();

// Use the matters composable
const { matters, loading, error, fetchMatters, updateLastAccessed } = useMatters();

// Filter state
const searchText = ref('');
const showMyMattersOnly = ref(false);
const showArchivedMatters = ref(false);
const caseSensitive = ref(false);
const wholeWord = ref(false);

// Fetch matters on component mount
onMounted(async () => {
  await fetchMatters();
});

// Helper function to format Firestore Timestamp to date string
function formatDate(timestamp) {
  if (!timestamp) return '';

  // Handle Firestore Timestamp
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString().split('T')[0];
  }

  // Handle JavaScript Date
  if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0];
  }

  // Handle date string
  return timestamp;
}

// Filter by user assignment and archived status
const visibleMatters = computed(() => {
  return matters.value.filter((matter) => {
    // Filter by user assignment
    if (showMyMattersOnly.value && !matter.assignedTo?.includes(authStore.user?.uid)) {
      return false;
    }

    // Filter by archived status
    if (!showArchivedMatters.value && matter.archived) {
      return false;
    }

    return true;
  });
});

// Filter by search text
const filteredMatters = computed(() => {
  if (!searchText.value) {
    return visibleMatters.value;
  }

  const search = caseSensitive.value ? searchText.value : searchText.value.toLowerCase();

  return visibleMatters.value.filter((matter) => {
    // Convert arrays to strings for searching
    const clientsStr = Array.isArray(matter.clients) ? matter.clients.join(' ') : matter.clients;
    const adversePartiesStr = Array.isArray(matter.adverseParties)
      ? matter.adverseParties.join(' ')
      : matter.adverseParties;

    const fields = [matter.matterNumber, clientsStr, matter.description, adversePartiesStr].join(
      ' '
    );

    const content = caseSensitive.value ? fields : fields.toLowerCase();

    if (wholeWord.value) {
      const regex = new RegExp(`\\b${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return regex.test(content);
    }

    return content.includes(search);
  });
});

// Check if a matter is currently selected
const isSelected = (matter) => {
  return matterViewStore.selectedMatter?.id === matter.id;
};

// Handle matter selection
const selectMatter = async (matter) => {
  // Set the matter in the store (persists to localStorage)
  matterViewStore.setMatter(matter);

  // Update last accessed timestamp
  await updateLastAccessed(matter.id);

  // Navigate to Matter Details view
  router.push(`/matters/${matter.id}`);
};
</script>

<style scoped>
/* Matters component styles */
</style>
