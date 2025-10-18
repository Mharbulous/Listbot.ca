<template>
  <div class="new-matter-wizard">
    <v-card variant="flat" class="mx-auto">
      <v-card-text class="pt-6">
        <v-form @submit.prevent="handleSubmit">
          <!-- Matter Information Section -->
          <div class="section-header">MATTER INFORMATION</div>

          <!-- Matter Number and Responsible Lawyer Row -->
          <v-row class="mb-4">
            <v-col cols="12" sm="6">
              <div class="field-label">
                Matter Number
              </div>
              <v-text-field
                v-model="formData.matterNo"
                variant="outlined"
                density="compact"
                placeholder="e.g., MAT-2025-001"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="6">
              <div class="field-label">
                Responsible Lawyer
              </div>
              <v-autocomplete
                v-model="formData.responsibleLawyer"
                :items="lawyerNames"
                :loading="loadingLawyers"
                variant="outlined"
                density="compact"
                placeholder="Select or type lawyer name"
                :error-messages="showLawyerError ? ['Responsible lawyer is required'] : []"
                :hide-details="!showLawyerError"
                auto-select-first
                :no-data-text="loadingLawyers ? 'Loading lawyers...' : 'No lawyers found in team'"
              />
            </v-col>
          </v-row>

          <!-- Description -->
          <div class="mb-6">
            <div class="field-label">
              Description <span class="optional-text">(optional)</span>
            </div>
            <v-textarea
              v-model="formData.description"
              variant="outlined"
              density="compact"
              placeholder="Briefly describe this matter..."
              auto-grow
              rows="4"
              hide-details
            />
          </div>

          <!-- Clients Section -->
          <div class="section-header">CLIENTS</div>

          <div class="mb-6">
            <div v-for="(client, index) in formData.clients" :key="index" class="mb-2">
              <v-text-field
                v-model="formData.clients[index]"
                variant="outlined"
                density="compact"
                placeholder="Client name"
                :error-messages="index === 0 && showClientError ? ['At least one client is required'] : []"
                :hide-details="!(index === 0 && showClientError)"
              />
            </div>
            <v-btn
              variant="outlined"
              color="primary"
              block
              @click="addClient"
              class="add-button"
            >
              <v-icon start>mdi-plus</v-icon>
              Add Another Client
            </v-btn>
          </div>

          <!-- Adverse Parties Section -->
          <div class="section-header">ADVERSE PARTIES</div>

          <div class="mb-6">
            <div v-for="(party, index) in formData.adverseParties" :key="index" class="mb-2">
              <v-text-field
                v-model="formData.adverseParties[index]"
                variant="outlined"
                density="compact"
                placeholder="Adverse party name"
                hide-details
              />
            </div>
            <v-btn
              variant="outlined"
              color="primary"
              block
              @click="addAdverseParty"
              class="add-button"
            >
              <v-icon start>mdi-plus</v-icon>
              Add Adverse Party
            </v-btn>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6 d-flex">
        <v-btn variant="outlined" :to="{ name: 'matters' }" size="large">
          Cancel
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          :loading="creating"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          Create Matter
        </v-btn>
      </v-card-actions>

      <div class="text-right pb-4 px-6">
        <span class="bulk-import-text">
          Creating multiple matters? <router-link to="/matters/import" class="bulk-import-link">Use bulk import</router-link>
        </span>
      </div>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTeamMembers } from '../composables/useTeamMembers';

// Component configuration
defineOptions({
  name: 'NewMatterView',
});

const router = useRouter();
const { lawyerNames, loading: loadingLawyers, fetchTeamMembers } = useTeamMembers();

// Form state
const formData = ref({
  matterNo: '',
  responsibleLawyer: '',
  description: '',
  clients: [''],
  adverseParties: [],
});

const creating = ref(false);
const showClientError = ref(false);
const showLawyerError = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Fetch lawyers on component mount
onMounted(async () => {
  await fetchTeamMembers();
});

// Computed validation
const isFormValid = computed(() => {
  const hasValidClient = formData.value.clients.some((client) => client.trim() !== '');
  const hasResponsibleLawyer = formData.value.responsibleLawyer.trim() !== '';
  return hasValidClient && hasResponsibleLawyer;
});

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
};

// Form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  creating.value = true;

  try {
    // Filter out empty clients and adverse parties
    const cleanedData = {
      matterNo: formData.value.matterNo.trim(),
      responsibleLawyer: formData.value.responsibleLawyer.trim(),
      description: formData.value.description.trim(),
      clients: formData.value.clients.filter((c) => c.trim() !== ''),
      adverseParties: formData.value.adverseParties.filter((p) => p.trim() !== ''),
    };

    // TODO: Save to database/store
    console.log('Creating new matter:', cleanedData);

    showNotification('Matter created successfully', 'success');

    // Navigate back to matters list after a brief delay
    setTimeout(() => {
      router.push({ name: 'matters' });
    }, 1500);
  } catch (error) {
    showNotification('Failed to create matter: ' + error.message, 'error');
    creating.value = false;
  }
};
</script>

<style scoped>
.new-matter-wizard {
  min-width: 50%;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

/* Section Headers */
.section-header {
  color: #5b7ce6;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  margin-top: 24px;
}

.section-header:first-child {
  margin-top: 0;
}

/* Field Labels */
.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.optional-text {
  color: #999;
  font-weight: 400;
}

/* Helper Text */
.helper-text {
  font-size: 0.75rem;
  color: #5b7ce6;
  margin-top: 4px;
  cursor: pointer;
}

/* Add Buttons */
.add-button {
  border-style: dashed !important;
  text-transform: none;
  font-weight: 500;
}

/* Bulk Import Link */
.bulk-import-text {
  font-size: 0.875rem;
  color: #666;
}

.bulk-import-link {
  color: #5b7ce6;
  text-decoration: none;
}

.bulk-import-link:hover {
  text-decoration: underline;
}

/* Align text fields with buttons */
:deep(.v-input--density-compact .v-field) {
  height: 36px;
}
</style>
