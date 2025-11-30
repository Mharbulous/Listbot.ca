<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-64 bg-white border border-slate-200 m-6 rounded-lg shadow-sm"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-slate-600">Loading Matter Details...</p>
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
          @click="loadMatter(route.params.id)"
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
      <MatterInfoCard
        :matter="matter"
        :user-display-names="userDisplayNames"
        @close="clearMatter"
        @back="router.push('/matters')"
        @edit="router.push(`/matters/edit/${route.params.id}`)"
        @archived-badge-click="showReactivateDialog = true"
      />
    </div>

    <!-- Reactivation Dialog -->
    <ReactivationDialog
      v-model="showReactivateDialog"
      :is-lawyer="currentUserIsLawyer"
      :is-responsible-lawyer="currentUserIsResponsibleLawyer"
      @reactivate="handleReactivate"
    />

    <!-- Success/Error Snackbar -->
    <MatterSnackbar
      v-model="snackbar.show"
      :message="snackbar.message"
      :color="snackbar.color"
    />
  </div>
</template>

<script setup>
/**
 * MatterDetail - Matter detail view orchestrator
 *
 * Responsibilities:
 * - Page layout with background
 * - Orchestrates child components
 * - Route handling and data loading
 * - Loading and error state display
 */

import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMatterViewStore } from '../stores/matterView.js';
import { useMatterDetail } from '../composables/useMatterDetail.js';
import MatterInfoCard from '../components/MatterInfoCard.vue';
import ReactivationDialog from '../components/ReactivationDialog.vue';
import MatterSnackbar from '../components/MatterSnackbar.vue';

defineOptions({
  name: 'MatterDetailView',
});

// Router and route
const route = useRoute();
const router = useRouter();

// Matter view store
const matterViewStore = useMatterViewStore();

// Use the matter detail composable
const {
  matter,
  loading,
  error,
  userDisplayNames,
  currentUserIsLawyer,
  currentUserIsResponsibleLawyer,
  loadMatter,
  initialize,
  reactivateMatter,
} = useMatterDetail();

// Local UI state
const showReactivateDialog = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Clear selected matter and redirect to matters list
function clearMatter() {
  matterViewStore.clearMatter();
  router.push('/matters');
}

// Handle reactivate matter
async function handleReactivate(shouldUpdateResponsibleLawyer) {
  try {
    const matterId = route.params.id;
    await reactivateMatter(matterId, shouldUpdateResponsibleLawyer);

    snackbar.value = {
      show: true,
      message: 'Matter reactivated successfully',
      color: 'success',
    };
  } catch (err) {
    console.error('Error reactivating matter:', err);
    snackbar.value = {
      show: true,
      message: 'Failed to reactivate matter',
      color: 'error',
    };
  }
}

// Load matter on mount
onMounted(async () => {
  await initialize();
  await loadMatter(route.params.id);
});
</script>
