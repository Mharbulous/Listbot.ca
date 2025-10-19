<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-64 bg-white border border-slate-200 m-6 rounded-lg shadow-sm"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
        ></div>
        <p class="text-slate-600">Loading matter details...</p>
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
          <h3 class="text-red-900 font-medium">Error loading matter</h3>
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <button
          @click="loadMatter"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
        >
          Try Again
        </button>
        <button
          @click="router.push('/matters')"
          class="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors"
        >
          Back to Matters
        </button>
      </div>
    </div>

    <!-- Matter Details -->
    <div v-else-if="matter" class="flex-1 overflow-auto p-6">
      <!-- Matter Information Card -->
      <div class="bg-blue-50 border border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <!-- Header -->
        <div
          class="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-5 relative"
        >
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold text-white">
              {{ matter.matterNumber }}
            </h1>
            <span
              v-if="matter.archived"
              class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-slate-200 text-slate-700 shadow-sm"
            >
              Archived
            </span>
            <span
              v-else
              class="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800 shadow-sm"
            >
              {{ matter.status || 'Active' }}
            </span>
          </div>
          <p class="text-base text-slate-300 leading-relaxed">{{ matter.description }}</p>

          <!-- Close Button -->
          <button
            @click="clearMatter"
            class="absolute top-5 right-6 flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Clear selected matter"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Two-Column Grid: Parties (2fr) and Team (1fr) -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Parties (2fr) -->
            <div class="lg:col-span-2">
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Parties</h2>

                <!-- Clients -->
                <div class="mb-4">
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Client(s)
                  </h3>
                  <div
                    v-if="Array.isArray(matter.clients) && matter.clients.length > 0"
                    class="space-y-1.5"
                  >
                    <div
                      v-for="(client, index) in matter.clients"
                      :key="index"
                      class="flex items-center gap-2 text-slate-900"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {{ client }}
                    </div>
                  </div>
                  <p v-else class="text-slate-500 italic text-sm">No clients listed</p>
                </div>

                <!-- Adverse Parties -->
                <div>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Adverse Parties
                  </h3>
                  <div
                    v-if="Array.isArray(matter.adverseParties) && matter.adverseParties.length > 0"
                    class="space-y-1.5"
                  >
                    <div
                      v-for="(party, index) in matter.adverseParties"
                      :key="index"
                      class="flex items-center gap-2 text-slate-900"
                    >
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {{ party }}
                    </div>
                  </div>
                  <p v-else class="text-slate-500 italic text-sm">No adverse parties listed</p>
                </div>
              </div>
            </div>

            <!-- Right Column: Team (1fr) -->
            <div class="lg:col-span-1">
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Team</h2>

                <!-- Responsible Lawyer -->
                <div class="mb-4">
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Responsible Lawyer
                  </h3>
                  <div
                    v-if="matter.responsibleLawyer"
                    class="flex items-center gap-2 text-slate-900"
                  >
                    <span
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold"
                    >
                      {{ getInitials(userDisplayNames.get(matter.responsibleLawyer)) }}
                    </span>
                    {{ userDisplayNames.get(matter.responsibleLawyer) || 'Unknown User' }}
                  </div>
                  <p v-else class="text-slate-500 italic text-sm">Not assigned</p>
                </div>

                <!-- Team Members -->
                <div>
                  <h3 class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Team Members
                  </h3>
                  <div
                    v-if="Array.isArray(matter.assignedTo) && matter.assignedTo.length > 0"
                    class="space-y-1.5"
                  >
                    <div
                      v-for="userId in matter.assignedTo"
                      :key="userId"
                      class="text-slate-900"
                    >
                      {{ userDisplayNames.get(userId) || 'Unknown User' }}
                    </div>
                  </div>
                  <p v-else class="text-slate-500 italic text-sm">No team members assigned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Back Button -->
        <div class="border-t border-slate-200 px-6 py-4">
          <button
            @click="router.push('/matters')"
            class="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        <!-- History Footer -->
        <div class="bg-slate-800 border-t border-slate-700 px-6 py-3">
          <div class="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-slate-400">
            <!-- Created -->
            <div
              class="cursor-help"
              :title="
                matter.createdBy
                  ? `Created by ${userDisplayNames.get(matter.createdBy) || 'Unknown User'}`
                  : undefined
              "
            >
              <span class="font-medium">Created:</span>
              <span class="ml-1.5">{{ formatDate(matter.createdAt) }}</span>
            </div>

            <!-- Last Updated -->
            <div
              v-if="matter.updatedAt"
              class="cursor-help"
              :title="
                matter.updatedBy
                  ? `Updated by ${userDisplayNames.get(matter.updatedBy) || 'Unknown User'}`
                  : undefined
              "
            >
              <span class="font-medium">Last Updated:</span>
              <span class="ml-1.5">{{ formatDate(matter.updatedAt) }}</span>
            </div>

            <!-- Last Accessed -->
            <div>
              <span class="font-medium">Last Accessed:</span>
              <span class="ml-1.5">{{ formatDate(matter.lastAccessed) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMatters } from '../composables/useMatters.js';
import { useUsers } from '../composables/useUsers.js';
import { useMatterViewStore } from '../stores/matterView.js';

// Component configuration
defineOptions({
  name: 'MatterDetailView',
});

// Router and route
const route = useRoute();
const router = useRouter();

// Use the matters composable
const { fetchMatter } = useMatters();

// Use the users composable
const { fetchUserDisplayNames } = useUsers();

// Use the matter view store
const matterViewStore = useMatterViewStore();

// Local state for this view
const matter = ref(null);
const loading = ref(true);
const error = ref(null);
const userDisplayNames = ref(new Map());

// Load matter data and associated user information
const loadMatter = async () => {
  loading.value = true;
  error.value = null;

  try {
    const matterId = route.params.id;
    const result = await fetchMatter(matterId);

    if (result) {
      matter.value = result;

      // Collect all user IDs that need display names
      const userIds = new Set();
      if (result.responsibleLawyer) userIds.add(result.responsibleLawyer);
      if (result.createdBy) userIds.add(result.createdBy);
      if (result.updatedBy) userIds.add(result.updatedBy);
      if (Array.isArray(result.assignedTo)) {
        result.assignedTo.forEach((id) => userIds.add(id));
      }

      // Fetch all user display names at once
      if (userIds.size > 0) {
        const names = await fetchUserDisplayNames([...userIds]);
        userDisplayNames.value = names;
      }
    } else {
      error.value = 'Matter not found';
    }
  } catch (err) {
    console.error('Error loading matter:', err);
    error.value = err.message || 'Failed to load matter details';
  } finally {
    loading.value = false;
  }
};

// Helper function to format Firestore Timestamp to date string
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';

  // Handle Firestore Timestamp
  if (timestamp.toDate) {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Handle JavaScript Date
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Handle date string
  return timestamp;
}

// Helper function to get initials from a user's display name
function getInitials(displayName) {
  if (!displayName) return '?';

  // Split by space and get first letter of each word
  const words = displayName.trim().split(/\s+/);
  if (words.length === 0) return '?';

  // Get first letter of first word and first letter of last word (or second word if only 2)
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  const firstInitial = words[0].charAt(0).toUpperCase();
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase();

  return firstInitial + lastInitial;
}

// Clear selected matter and redirect to matters list
function clearMatter() {
  matterViewStore.clearMatter();
  router.push('/matters');
}

// Load matter on mount
onMounted(() => {
  loadMatter();
});
</script>

<style scoped>
/* Matter detail component styles */
</style>
