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
        <div
          class="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-5"
        >
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-3xl font-bold text-slate-900">
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
          <p class="text-base text-slate-700 leading-relaxed">{{ matter.description }}</p>
        </div>

        <!-- Primary Information: Parties -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Clients -->
            <div class="bg-blue-50 rounded-lg p-5 border border-blue-100">
              <h2
                class="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2"
              >
                <svg class="w-4 h-4" viewBox="0 0 512 512">
                  <path
                    fill="currentColor"
                    fill-rule="evenodd"
                    d="M309.334 117.333c0-41.237-33.43-74.666-74.667-74.666l-4.097.11C191.238 44.904 160 77.471 160 117.333C160 158.571 193.43 192 234.667 192l4.097-.111c39.332-2.126 70.57-34.693 70.57-74.556M256 362.667c0 23.314 6.233 45.173 17.124 64H85.334v-76.8c0-62.033 47.668-112.614 107.383-115.104l4.616-.096H272c19.434 0 37.712 5.091 53.642 14.047C284.293 269.933 256 312.996 256 362.667m65.303 86.295L384 410.667l62.697 38.295l-17.046-71.463l55.795-47.794l-73.232-5.871L384 256l-28.214 67.834l-73.232 5.871l55.795 47.794z"
                    clip-rule="evenodd"
                  />
                </svg>
                Client(s)
              </h2>
              <div
                v-if="Array.isArray(matter.clients) && matter.clients.length > 0"
                class="space-y-2"
              >
                <div
                  v-for="(client, index) in matter.clients"
                  :key="index"
                  class="flex items-center gap-2 text-slate-900 font-medium"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {{ client }}
                </div>
              </div>
              <p v-else class="text-slate-500 italic text-sm">No clients listed</p>
            </div>

            <!-- Adverse Parties -->
            <div class="bg-amber-50 rounded-lg p-5 border border-amber-100">
              <h2
                class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-3 flex items-center gap-2"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="m18.839 20.696l-3.06-3.054l-1.923 1.924q-.102.101-.277.101t-.277-.102q-.46-.46-.46-1.136q0-.677.46-1.137l4.09-4.09q.46-.46 1.137-.46t1.137.46q.101.102.101.277t-.101.277l-1.924 1.923l3.054 3.06q.243.242.243.565t-.243.565l-.827.827q-.242.242-.565.242t-.565-.242M20.758 5.72l-10.8 10.82l.74.734q.46.46.46 1.137t-.46 1.136q-.102.102-.277.102t-.277-.102l-1.923-1.923l-3.06 3.054q-.242.242-.565.242t-.565-.242l-.827-.827q-.242-.242-.242-.565t.242-.566l3.054-3.06l-1.923-1.922q-.102-.102-.102-.277t.102-.277q.46-.46 1.136-.46q.677 0 1.137.46l.754.76L17.944 3.378q.218-.217.522-.348t.628-.131h1.098q.348 0 .578.23t.23.578v1.44q0 .162-.056.301t-.186.27M7.09 9.586l-3.63-3.63q-.218-.218-.339-.522T3 4.806V3.708q0-.349.23-.578t.578-.23h1.098q.323 0 .628.13q.305.131.522.349l3.611 3.63q.224.224.224.53t-.224.53L8.19 9.586q-.223.224-.55.224t-.548-.223"
                  />
                </svg>
                Adverse Parties
              </h2>
              <div
                v-if="Array.isArray(matter.adverseParties) && matter.adverseParties.length > 0"
                class="space-y-2"
              >
                <div
                  v-for="(party, index) in matter.adverseParties"
                  :key="index"
                  class="flex items-center gap-2 text-slate-900 font-medium"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  {{ party }}
                </div>
              </div>
              <p v-else class="text-slate-500 italic text-sm">No adverse parties listed</p>
            </div>
          </div>
        </div>

        <!-- Metadata Footer -->
        <div class="bg-slate-50 border-t border-slate-200 px-6 py-3">
          <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <div class="flex items-center gap-1.5">
              <svg
                class="w-3.5 h-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span class="font-medium">Created:</span>
              <span>{{ formatDate(matter.createdAt) }}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <svg
                class="w-3.5 h-3.5 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span class="font-medium">Last Accessed:</span>
              <span>{{ formatDate(matter.lastAccessed) }}</span>
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
