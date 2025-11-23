<template>
  <div class="h-full flex flex-col" style="background-color: #FAF8F3;">
    <!-- Notification Banner for Redirects -->
    <div
      v-if="showNotification"
      :class="[
        'mx-6 mt-4 mb-2 px-4 py-3 rounded-lg shadow-md flex items-start gap-3',
        notificationType === 'warning'
          ? 'bg-amber-50 border border-amber-200'
          : 'bg-blue-50 border border-blue-200',
      ]"
    >
      <svg
        class="w-5 h-5 mt-0.5 flex-shrink-0"
        :class="notificationType === 'warning' ? 'text-amber-600' : 'text-blue-600'"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          v-if="notificationType === 'warning'"
          fill-rule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clip-rule="evenodd"
        />
        <path
          v-else
          fill-rule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <p
          :class="[
            'text-sm font-medium',
            notificationType === 'warning' ? 'text-amber-900' : 'text-blue-900',
          ]"
        >
          {{ notificationMessage }}
        </p>
      </div>
      <button
        @click="showNotification = false"
        :class="[
          'text-sm font-medium hover:underline',
          notificationType === 'warning' ? 'text-amber-700' : 'text-blue-700',
        ]"
      >
        Dismiss
      </button>
    </div>

    <!-- Scroll container with gradient and title -->
    <div class="scroll-container">
      <div class="gradient-background"></div>

      <div class="title-drawer">
        <h1 class="title-drawer-text">Matters</h1>
      </div>

      <!-- Table Container -->
      <div class="table-content">
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
              mattersFilterStore.searchText
                ? 'Try adjusting your search'
                : 'Create your first matter to get started'
            }}
          </p>
        </div>

        <!-- Table with Data -->
        <table v-else class="w-full">
          <thead class="matters-table-header">
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
                Documents
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
              v-for="(matter, index) in filteredMatters"
              :key="matter.id"
              :class="[
                'hover:!bg-slate-200 cursor-pointer transition-colors',
                isSelected(matter) ? '!bg-amber-50 border-l-4 border-l-amber-300' : (index % 2 === 0 ? 'bg-white' : 'bg-gray-50'),
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
              <td class="px-6 py-4 text-sm text-slate-900 text-center">
                <span v-if="documentCounts[matter.id] !== undefined" class="font-medium">
                  {{ documentCounts[matter.id] }}
                </span>
                <span v-else class="text-slate-400">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mx-auto"></div>
                </span>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMatters } from '../composables/useMatters.js';
import { useAuthStore } from '@/core/auth/stores/index.js';
import { useMatterViewStore } from '../stores/matterView.js';
import { useMattersFilterStore } from '../stores/mattersFilter.js';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/services/firebase.js';

// Component configuration
defineOptions({
  name: 'MattersView',
});

// Router for navigation
const router = useRouter();
const route = useRoute();

// Auth store for current user
const authStore = useAuthStore();

// Matter view store for tracking selected matter
const matterViewStore = useMatterViewStore();

// Matters filter store for filter controls
const mattersFilterStore = useMattersFilterStore();

// Use the matters composable
const { matters, loading, error, fetchMatters, updateLastAccessed } = useMatters();

// Notification state for redirects
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('info'); // 'info' | 'warning'

// Document counts for each matter
const documentCounts = ref({});

/**
 * Fetch document counts for all matters
 * Uses getCountFromServer for efficient counting without downloading documents
 */
async function fetchDocumentCounts() {
  if (!authStore.firmId || matters.value.length === 0) {
    return;
  }

  try {
    // Fetch counts for all matters in parallel
    const countPromises = matters.value.map(async (matter) => {
      try {
        const evidenceRef = collection(
          db,
          'firms',
          authStore.firmId,
          'matters',
          matter.id,
          'evidence'
        );
        const snapshot = await getCountFromServer(evidenceRef);
        return { matterId: matter.id, count: snapshot.data().count };
      } catch (error) {
        console.error('Error fetching document count for matter', error, {
          matterId: matter.id,
          firmId: authStore.firmId,
        });
        return { matterId: matter.id, count: 0 };
      }
    });

    const counts = await Promise.all(countPromises);

    // Update the documentCounts ref with all counts
    const countsMap = {};
    counts.forEach(({ matterId, count }) => {
      countsMap[matterId] = count;
    });
    documentCounts.value = countsMap;
  } catch (error) {
    console.error('Error fetching document counts', error, {
      firmId: authStore.firmId,
    });
  }
}

// Fetch matters on component mount
onMounted(async () => {
  await fetchMatters();
  await fetchDocumentCounts();

  // Check for redirect reasons from route guard
  const reason = route.query.reason;
  if (reason === 'no_matter_selected') {
    notificationMessage.value = 'Please select a matter to access that page.';
    notificationType.value = 'info';
    showNotification.value = true;
  } else if (reason === 'archived_matter') {
    notificationMessage.value =
      'Cannot upload to archived matter. Please select an active matter.';
    notificationType.value = 'warning';
    showNotification.value = true;
  }

  // Auto-hide notification after 8 seconds
  if (showNotification.value) {
    setTimeout(() => {
      showNotification.value = false;
    }, 8000);
  }
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
    if (mattersFilterStore.showMyMattersOnly && !matter.assignedTo?.includes(authStore.user?.uid)) {
      return false;
    }

    // Filter by status
    if (mattersFilterStore.statusFilter === 'active' && matter.archived) {
      return false;
    }
    if (mattersFilterStore.statusFilter === 'archived' && !matter.archived) {
      return false;
    }
    // 'all' shows everything, no filter needed

    return true;
  });
});

// Filter by search text
const filteredMatters = computed(() => {
  if (!mattersFilterStore.searchText) {
    return visibleMatters.value;
  }

  const search = mattersFilterStore.caseSensitive
    ? mattersFilterStore.searchText
    : mattersFilterStore.searchText.toLowerCase();

  return visibleMatters.value.filter((matter) => {
    // Convert arrays to strings for searching
    const clientsStr = Array.isArray(matter.clients) ? matter.clients.join(' ') : matter.clients;
    const adversePartiesStr = Array.isArray(matter.adverseParties)
      ? matter.adverseParties.join(' ')
      : matter.adverseParties;

    const fields = [matter.matterNumber, clientsStr, matter.description, adversePartiesStr].join(
      ' '
    );

    const content = mattersFilterStore.caseSensitive ? fields : fields.toLowerCase();

    if (mattersFilterStore.wholeWord) {
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

  // Navigate to Documents view with matter ID in route
  router.push({ name: 'documents', params: { matterId: matter.id } });
};
</script>

<style scoped>
.scroll-container {
  flex: 1;
  overflow: auto;
  position: relative;
  min-width: 0;
}

.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 800px;
  background: linear-gradient(179deg, #B2EBF2 0%, #FCFCF5 30%, #FCFCF5 100%);
  z-index: 0;
  pointer-events: none;
}

.title-drawer {
  padding: 20px 24px 0 24px;
  min-width: max-content;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 1;
  background: transparent;
  color: #455A64;
}

.title-drawer-text {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: inherit;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.table-content {
  position: relative;
  z-index: 1;
}

.matters-table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>
