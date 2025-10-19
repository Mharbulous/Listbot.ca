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
            <button
              v-if="matter.archived"
              @click="handleArchivedBadgeClick"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-200 text-slate-800 shadow-sm cursor-pointer hover:bg-amber-300 transition-colors"
            >
              Archived
            </button>
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

        <!-- Two-Column Grid: Parties (2fr) and Firm (1fr) -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Parties (2fr) -->
            <div class="lg:col-span-2">
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Parties</h2>

                <!-- Clients -->
                <div class="mb-4">
                  <h3
                    class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 512 512"
                      class="flex-shrink-0"
                    >
                      <path
                        fill="currentColor"
                        fill-rule="evenodd"
                        d="M309.334 117.333c0-41.237-33.43-74.666-74.667-74.666l-4.097.11C191.238 44.904 160 77.471 160 117.333C160 158.571 193.43 192 234.667 192l4.097-.111c39.332-2.126 70.57-34.693 70.57-74.556M256 362.667c0 23.314 6.233 45.173 17.124 64H85.334v-76.8c0-62.033 47.668-112.614 107.383-115.104l4.616-.096H272c19.434 0 37.712 5.091 53.642 14.047C284.293 269.933 256 312.996 256 362.667m65.303 86.295L384 410.667l62.697 38.295l-17.046-71.463l55.795-47.794l-73.232-5.871L384 256l-28.214 67.834l-73.232 5.871l55.795 47.794z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    {{
                      Array.isArray(matter.clients) && matter.clients.length === 1
                        ? 'Client'
                        : 'Clients'
                    }}
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
                  <h3
                    class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      class="flex-shrink-0"
                    >
                      <path
                        fill="currentColor"
                        d="m18.839 20.696l-3.06-3.054l-1.923 1.924q-.102.101-.277.101t-.277-.102q-.46-.46-.46-1.136q0-.677.46-1.137l4.09-4.09q.46-.46 1.137-.46t1.137.46q.101.102.101.277t-.101.277l-1.924 1.923l3.054 3.06q.243.242.243.565t-.243.565l-.827.827q-.242.242-.565.242t-.565-.242M20.758 5.72l-10.8 10.82l.74.734q.46.46.46 1.137t-.46 1.136q-.102.102-.277.102t-.277-.102l-1.923-1.923l-3.06 3.054q-.242.242-.565.242t-.565-.242l-.827-.827q-.242-.242-.242-.565t.242-.566l3.054-3.06l-1.923-1.922q-.102-.102-.102-.277t.102-.277q.46-.46 1.136-.46q.677 0 1.137.46l.754.76L17.944 3.378q.218-.217.522-.348t.628-.131h1.098q.348 0 .578.23t.23.578v1.44q0 .162-.056.301t-.186.27M7.09 9.586l-3.63-3.63q-.218-.218-.339-.522T3 4.806V3.708q0-.349.23-.578t.578-.23h1.098q.323 0 .628.13q.305.131.522.349l3.611 3.63q.224.224.224.53t-.224.53L8.19 9.586q-.223.224-.55.224t-.548-.223"
                      />
                    </svg>
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

            <!-- Right Column: Firm (1fr) -->
            <div class="lg:col-span-1">
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Firm</h2>

                <!-- Responsible Lawyer -->
                <div class="mb-4">
                  <h3
                    class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 512 512"
                      class="flex-shrink-0"
                    >
                      <path
                        fill="currentColor"
                        fill-rule="evenodd"
                        d="M288 117.333c0-41.237-33.429-74.666-74.667-74.666l-4.096.11c-39.332 2.127-70.57 34.694-70.57 74.556c0 41.238 33.429 74.667 74.666 74.667l4.097-.111c39.332-2.126 70.57-34.693 70.57-74.556m-32 256c0 19.205 4.614 37.332 12.794 53.334H64v-76.8c0-62.033 47.668-112.614 107.383-115.104l4.617-.096h74.667c29.474 0 56.29 11.711 76.288 30.855C285.219 283.501 256 325.005 256 373.333m117.333-96c-53.019 0-96 42.981-96 96s42.981 96 96 96c53.02 0 96-42.981 96-96s-42.98-96-96-96m62.763 62.763l-84.095 84.094l-41.428-41.428l18.856-18.856l22.572 22.572l65.239-65.238z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    Responsible Lawyer
                  </h3>
                  <div v-if="matter.responsibleLawyer" class="text-slate-900">
                    {{ userDisplayNames.get(matter.responsibleLawyer) || 'Unknown User' }}
                  </div>
                  <p v-else class="text-slate-500 italic text-sm">Not assigned</p>
                </div>

                <!-- Firm Members -->
                <div>
                  <h3
                    class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 512 512"
                      class="flex-shrink-0"
                    >
                      <path
                        fill="currentColor"
                        fill-rule="evenodd"
                        d="M200.876 277.332c-5.588 12.789-8.74 26.884-8.872 41.7L192 320v128H64v-85.333c0-46.676 37.427-84.569 83.922-85.322l1.411-.012zm161.79-42.665c47.13 0 85.334 38.205 85.334 85.333v128H213.333V320c0-47.128 38.205-85.333 85.334-85.333zM170.667 128c35.286 0 64 28.715 64 64s-28.714 64-64 64c-35.285 0-64-28.715-64-64s28.715-64 64-64m160-64c41.174 0 74.667 33.493 74.667 74.667s-33.493 74.666-74.666 74.666c-41.174 0-74.667-33.493-74.667-74.666C256 97.493 289.493 64 330.667 64"
                      />
                    </svg>
                    Firm Members
                  </h3>
                  <div
                    v-if="
                      Array.isArray(matter.assignedTo) &&
                      matter.assignedTo.filter((id) => id !== matter.responsibleLawyer).length > 0
                    "
                    class="space-y-1.5"
                  >
                    <div
                      v-for="userId in matter.assignedTo.filter(
                        (id) => id !== matter.responsibleLawyer
                      )"
                      :key="userId"
                      class="text-slate-900"
                    >
                      {{ userDisplayNames.get(userId) || 'Unknown User' }}
                    </div>
                  </div>
                  <p v-else class="text-slate-500 italic text-sm">No firm members assigned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Back and Edit Buttons -->
        <div class="border-t border-slate-200 px-6 py-4 flex justify-between items-center">
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

          <button
            v-if="!matter.archived"
            @click="editMatter"
            class="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 rounded text-sm font-medium text-slate-800 bg-amber-200 hover:bg-amber-300 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
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

    <!-- Reactivation Dialog -->
    <div
      v-if="showReactivateDialog"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="handleCancel"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <!-- Dialog Header -->
        <div class="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
          <h2 class="text-xl font-semibold text-white">
            {{ currentUserIsLawyer ? 'Reactivate Matter' : 'Cannot Reactivate Matter' }}
          </h2>
        </div>

        <!-- Dialog Content -->
        <div class="px-6 py-5">
          <!-- Non-Lawyer Message -->
          <p v-if="!currentUserIsLawyer" class="text-slate-700">
            Only lawyers can reactivate archived matters.
          </p>

          <!-- Responsible Lawyer Message -->
          <p v-else-if="currentUserIsResponsibleLawyer" class="text-slate-700">
            Are you sure you want to reactivate this matter?
          </p>

          <!-- Non-Responsible Lawyer Message -->
          <div v-else>
            <p v-if="!hasAssumedResponsibility" class="text-slate-700">
              To reactivate this archived matter, you must assume responsibility for it. Do you want
              to become the responsible lawyer for this matter?
            </p>
            <p v-else class="text-slate-700">
              You will become the responsible lawyer for this matter. Click "Reactivate Matter" to
              continue.
            </p>
          </div>
        </div>

        <!-- Dialog Actions -->
        <div class="bg-slate-50 px-6 py-4 flex justify-end gap-3">
          <!-- Non-Lawyer Actions -->
          <button
            v-if="!currentUserIsLawyer"
            @click="handleCancel"
            class="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          <!-- Lawyer Actions -->
          <template v-else>
            <button
              @click="handleCancel"
              class="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            <!-- Responsible Lawyer or Already Assumed Responsibility -->
            <button
              v-if="currentUserIsResponsibleLawyer || hasAssumedResponsibility"
              @click="handleReactivate"
              class="px-4 py-2 border border-blue-600 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Reactivate Matter
            </button>

            <!-- Non-Responsible Lawyer - First Step -->
            <button
              v-else
              @click="handleAssumeResponsibility"
              class="px-4 py-2 border border-amber-500 rounded text-sm font-medium text-slate-800 bg-amber-500 hover:bg-amber-600 transition-colors"
            >
              Assume Responsibility
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Success/Error Snackbar -->
    <div v-if="snackbar.show" class="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        :class="[
          'rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 min-w-[300px]',
          snackbar.color === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
        ]"
      >
        <svg
          v-if="snackbar.color === 'success'"
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
        <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        <span class="flex-1">{{ snackbar.message }}</span>
        <button
          @click="snackbar.show = false"
          class="text-white hover:text-gray-200 transition-colors"
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
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMatters } from '../composables/useMatters.js';
import { useUsers } from '../composables/useUsers.js';
import { useMatterViewStore } from '../stores/matterView.js';
import { useFirmMembers } from '../composables/useFirmMembers.js';
import { useAuthStore } from '../core/stores/auth.js';

// Component configuration
defineOptions({
  name: 'MatterDetailView',
});

// Router and route
const route = useRoute();
const router = useRouter();

// Use the matters composable
const { fetchMatter, updateMatter, unarchiveMatter } = useMatters();

// Use the users composable
const { fetchUserDisplayNames } = useUsers();

// Use the matter view store
const matterViewStore = useMatterViewStore();

// Use the firm members composable
const { firmMembers, fetchFirmMembers } = useFirmMembers();

// Use the auth store
const authStore = useAuthStore();

// Local state for this view
const matter = ref(null);
const loading = ref(true);
const error = ref(null);
const userDisplayNames = ref(new Map());

// Reactivation modal state
const showReactivateDialog = ref(false);
const hasAssumedResponsibility = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Computed properties for user role checking
const currentUserIsLawyer = computed(() => {
  const currentUserId = authStore.user?.uid;
  if (!currentUserId) return false;
  const member = firmMembers.value.find((m) => m.userId === currentUserId);
  return member?.isLawyer === true;
});

const currentUserIsResponsibleLawyer = computed(() => {
  const currentUserId = authStore.user?.uid;
  if (!currentUserId || !matter.value) return false;
  return matter.value.responsibleLawyer === currentUserId;
});

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

// Navigate to edit matter page
function editMatter() {
  router.push(`/matters/edit/${route.params.id}`);
}

// Handle archived badge click
function handleArchivedBadgeClick() {
  hasAssumedResponsibility.value = false;
  showReactivateDialog.value = true;
}

// Handle cancel button in dialog
function handleCancel() {
  showReactivateDialog.value = false;
  hasAssumedResponsibility.value = false;
}

// Handle assume responsibility button
function handleAssumeResponsibility() {
  hasAssumedResponsibility.value = true;
}

// Handle reactivate matter
async function handleReactivate() {
  try {
    const currentUserId = authStore.user?.uid;
    const matterId = route.params.id;

    // If non-responsible lawyer and has assumed responsibility, update responsible lawyer
    if (!currentUserIsResponsibleLawyer.value && hasAssumedResponsibility.value && currentUserId) {
      await updateMatter(matterId, { responsibleLawyer: currentUserId });
    }

    // Unarchive the matter
    await unarchiveMatter(matterId);

    // Reload matter data
    await loadMatter();

    // Show success message
    snackbar.value = {
      show: true,
      message: 'Matter reactivated successfully',
      color: 'success',
    };

    // Close dialog and reset state
    showReactivateDialog.value = false;
    hasAssumedResponsibility.value = false;
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
  await fetchFirmMembers();
  await loadMatter();
});
</script>

<style scoped>
/* Matter detail component styles */

@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
