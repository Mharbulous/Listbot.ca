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

    <!-- Edit Matter Form -->
    <div v-else-if="matter" class="flex-1 overflow-auto p-6">
      <!-- Matter Information Card -->
      <div class="bg-blue-50 border border-slate-700 rounded-lg shadow-sm overflow-hidden">
        <!-- Header -->
        <div
          class="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-5 relative"
        >
          <h1 class="text-2xl font-bold text-white mb-2">Edit Matter Details</h1>
          <p class="text-base text-slate-300 leading-relaxed">
            Update the information for this matter
          </p>

          <!-- Close Button -->
          <button
            @click="cancelEdit"
            class="absolute top-5 right-6 flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
            title="Cancel and return to matter details"
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

        <!-- Two-Column Grid: Matter Info (2fr) and Firm (1fr) -->
        <div class="p-6">
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Matter Information and Parties (2fr) -->
            <div class="lg:col-span-2 space-y-6">
              <!-- Matter Information Section -->
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Matter Information</h2>

                <!-- Matter Number -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Matter Number
                  </label>
                  <input
                    v-model="formData.matterNumber"
                    type="text"
                    class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="e.g., MAT-2025-001"
                  />
                </div>

                <!-- Description -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">
                    Description <span class="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    v-model="formData.description"
                    rows="4"
                    class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    placeholder="Briefly describe this matter..."
                  ></textarea>
                </div>
              </div>

              <!-- Parties Section -->
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Parties</h2>

                <!-- Clients -->
                <div class="mb-4">
                  <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
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
                    Clients
                  </label>
                  <div class="space-y-2">
                    <div
                      v-for="(client, index) in formData.clients"
                      :key="index"
                      class="flex items-center gap-2"
                    >
                      <input
                        v-model="formData.clients[index]"
                        type="text"
                        class="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Client name"
                      />
                      <button
                        v-if="formData.clients.length > 1"
                        @click="removeClient(index)"
                        class="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove client"
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
                    <button
                      @click="addClient"
                      class="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Another Client
                    </button>
                  </div>
                  <p
                    v-if="showClientError"
                    class="mt-2 text-sm text-red-600"
                  >
                    At least one client is required
                  </p>
                </div>

                <!-- Adverse Parties -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
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
                  </label>
                  <div class="space-y-2">
                    <div
                      v-for="(party, index) in formData.adverseParties"
                      :key="index"
                      class="flex items-center gap-2"
                    >
                      <input
                        v-model="formData.adverseParties[index]"
                        type="text"
                        class="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Adverse party name"
                      />
                      <button
                        @click="removeAdverseParty(index)"
                        class="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove adverse party"
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
                    <button
                      @click="addAdverseParty"
                      class="w-full px-4 py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add Adverse Party
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Firm (1fr) -->
            <div class="lg:col-span-1">
              <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
                <h2 class="text-lg font-semibold text-slate-900 mb-4">Firm</h2>

                <!-- Responsible Lawyer -->
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
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
                  </label>
                  <select
                    v-model="formData.responsibleLawyer"
                    class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    :class="{ 'border-red-500': showLawyerError }"
                  >
                    <option value="" disabled>Select lawyer</option>
                    <option v-for="lawyer in lawyerNames" :key="lawyer" :value="lawyer">
                      {{ lawyer }}
                    </option>
                  </select>
                  <p
                    v-if="showLawyerError"
                    class="mt-2 text-sm text-red-600"
                  >
                    Responsible lawyer is required
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cancel and Save Buttons -->
        <div class="border-t border-slate-200 px-6 py-4 flex justify-between items-center">
          <button
            @click="cancelEdit"
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
            Cancel
          </button>

          <button
            @click="handleSubmit"
            :disabled="saving"
            class="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 rounded text-sm font-medium text-slate-800 bg-amber-200 hover:bg-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              v-if="!saving"
              class="w-4 h-4"
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
            <div
              v-else
              class="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-800"
            ></div>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
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
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMatters } from '../composables/useMatters.js';
import { useFirmMembers } from '@/features/profile/composables/useFirmMembers.js';

// Component configuration
defineOptions({
  name: 'EditMatterView',
});

// Router and route
const route = useRoute();
const router = useRouter();

// Use the matters composable
const { fetchMatter, updateMatter } = useMatters();

// Use the firm members composable
const { lawyerNames, fetchFirmMembers } = useFirmMembers();

// Local state for this view
const matter = ref(null);
const loading = ref(true);
const error = ref(null);
const saving = ref(false);
const showClientError = ref(false);
const showLawyerError = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Form data
const formData = ref({
  matterNumber: '',
  responsibleLawyer: '',
  description: '',
  clients: [''],
  adverseParties: [],
});

// Load matter data and populate form
const loadMatter = async () => {
  loading.value = true;
  error.value = null;

  try {
    const matterId = route.params.matterId;
    const result = await fetchMatter(matterId);

    if (result) {
      // Check if matter is archived
      if (result.archived) {
        error.value = 'Cannot edit archived matter. Please reactivate it first.';
        loading.value = false;
        return;
      }

      matter.value = result;

      // Populate form with existing data
      formData.value = {
        matterNumber: result.matterNumber || '',
        responsibleLawyer: result.responsibleLawyer || '',
        description: result.description || '',
        clients: Array.isArray(result.clients) && result.clients.length > 0
          ? [...result.clients]
          : [''],
        adverseParties: Array.isArray(result.adverseParties) && result.adverseParties.length > 0
          ? [...result.adverseParties]
          : [],
      };
    } else {
      error.value = 'Matter not found';
    }
  } catch (err) {
    console.error('Error loading matter:', err);
    error.value = err.message || 'Failed to load Matter Details';
  } finally {
    loading.value = false;
  }
};

// Client management
const addClient = () => {
  formData.value.clients.push('');
};

const removeClient = (index) => {
  formData.value.clients.splice(index, 1);
};

// Adverse parties management
const addAdverseParty = () => {
  formData.value.adverseParties.push('');
};

const removeAdverseParty = (index) => {
  formData.value.adverseParties.splice(index, 1);
};

// Form validation
const validateForm = () => {
  let isValid = true;

  // Check if at least one client with a non-empty value exists
  const hasValidClient = formData.value.clients.some((client) => client.trim() !== '');

  if (!hasValidClient) {
    showClientError.value = true;
    isValid = false;
  } else {
    showClientError.value = false;
  }

  // Check if responsible lawyer is selected
  if (formData.value.responsibleLawyer.trim() === '') {
    showLawyerError.value = true;
    isValid = false;
  } else {
    showLawyerError.value = false;
  }

  return isValid;
};

// Notification helper
const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
  // Auto-hide after 4 seconds
  setTimeout(() => {
    snackbar.value.show = false;
  }, 4000);
};

// Cancel edit and return to detail view
const cancelEdit = () => {
  router.push({ name: 'matter-detail', params: { id: route.params.matterId } });
};

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  saving.value = true;

  try {
    const matterId = route.params.matterId;

    // Filter out empty clients and adverse parties
    const cleanedData = {
      matterNumber: formData.value.matterNumber.trim(),
      responsibleLawyer: formData.value.responsibleLawyer.trim(),
      description: formData.value.description.trim(),
      clients: formData.value.clients.filter((c) => c.trim() !== ''),
      adverseParties: formData.value.adverseParties.filter((p) => p.trim() !== ''),
    };

    // Update matter in Firestore using the composable
    const success = await updateMatter(matterId, cleanedData);

    if (success) {
      showNotification('Matter updated successfully', 'success');

      // Navigate to the matter detail page after a brief delay
      setTimeout(() => {
        router.push({ name: 'matter-detail', params: { id: matterId } });
      }, 1000);
    } else {
      throw new Error('Failed to update matter');
    }
  } catch (err) {
    console.error('Error updating matter:', err);
    showNotification('Failed to update matter: ' + err.message, 'error');
  } finally {
    saving.value = false;
  }
};

// Load matter on mount
onMounted(async () => {
  await fetchFirmMembers();
  await loadMatter();
});
</script>

<style scoped>
/* Edit Matter component styles */

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
