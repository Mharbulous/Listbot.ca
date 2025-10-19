<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-64 bg-white border border-slate-200 m-6 rounded-lg shadow-sm"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-600">Loading matter details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="bg-red-50 border border-red-200 m-6 rounded-lg shadow-sm p-6"
    >
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
      <!-- Back Button -->
      <div class="mb-4">
        <button
          @click="router.push('/matters')"
          class="px-3 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Matters
        </button>
      </div>

      <!-- Matter Information Card -->
      <div class="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-slate-900">
                Matter #{{ matter.matterNumber }}
              </h2>
              <p class="text-sm text-slate-600 mt-1">{{ matter.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span
                v-if="matter.archived"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600"
              >
                Archived
              </span>
              <span
                v-else
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700"
              >
                {{ matter.status || 'Active' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Clients -->
            <div>
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                Client(s)
              </h3>
              <div v-if="Array.isArray(matter.clients) && matter.clients.length > 0">
                <div
                  v-for="(client, index) in matter.clients"
                  :key="index"
                  class="text-slate-900 py-1"
                >
                  {{ client }}
                </div>
              </div>
              <p v-else class="text-slate-400 italic">No clients listed</p>
            </div>

            <!-- Adverse Parties -->
            <div>
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                Adverse Parties
              </h3>
              <div
                v-if="Array.isArray(matter.adverseParties) && matter.adverseParties.length > 0"
              >
                <div
                  v-for="(party, index) in matter.adverseParties"
                  :key="index"
                  class="text-slate-900 py-1"
                >
                  {{ party }}
                </div>
              </div>
              <p v-else class="text-slate-400 italic">No adverse parties listed</p>
            </div>

            <!-- Matter Number -->
            <div>
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                Matter Number
              </h3>
              <p class="text-slate-900">{{ matter.matterNumber }}</p>
            </div>

            <!-- Status -->
            <div>
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                Status
              </h3>
              <p class="text-slate-900">{{ matter.status || 'Active' }}</p>
            </div>

            <!-- Last Accessed -->
            <div>
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                Last Accessed
              </h3>
              <p class="text-slate-900">{{ formatDate(matter.lastAccessed) }}</p>
            </div>

            <!-- Created -->
            <div>
              <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                Created
              </h3>
              <p class="text-slate-900">{{ formatDate(matter.createdAt) }}</p>
            </div>
          </div>

          <!-- Description (Full) -->
          <div v-if="matter.description" class="mt-6 pt-6 border-t border-slate-200">
            <h3 class="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
              Description
            </h3>
            <p class="text-slate-900 whitespace-pre-wrap">{{ matter.description }}</p>
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

// Component configuration
defineOptions({
  name: 'MatterDetailView',
});

// Router and route
const route = useRoute();
const router = useRouter();

// Use the matters composable
const { fetchMatter } = useMatters();

// Local state for this view
const matter = ref(null);
const loading = ref(true);
const error = ref(null);

// Load matter data
const loadMatter = async () => {
  loading.value = true;
  error.value = null;

  try {
    const matterId = route.params.id;
    const result = await fetchMatter(matterId);

    if (result) {
      matter.value = result;
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

// Load matter on mount
onMounted(() => {
  loadMatter();
});
</script>

<style scoped>
/* Matter detail component styles */
</style>
