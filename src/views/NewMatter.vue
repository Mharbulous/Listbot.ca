<template>
  <div class="new-matter-wizard">
    <v-card variant="flat" class="mx-auto">
      <v-card-title class="d-flex align-center">
        New Matter
        <v-spacer />
        <v-btn variant="text" icon :to="{ name: 'matters' }" color="default">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-6">
        <v-form @submit.prevent="handleSubmit">
          <v-row>
            <!-- Matter Number -->
            <v-col cols="4">
              <v-text-field
                v-model="formData.matterNo"
                label="Matter Number"
                variant="outlined"
                density="compact"
                placeholder="e.g., 2024-024"
                hide-details
              />
            </v-col>

            <!-- Create Multiple Matters Button -->
            <v-col cols="8" class="d-flex align-center justify-end">
              <v-btn variant="outlined" color="orange" class="text-white">
                Create Multiple Matters
              </v-btn>
            </v-col>

            <!-- Clients (Required) -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">
                Clients <span class="text-error">*</span>
              </div>
              <div class="client-list">
                <div v-for="(client, index) in formData.clients" :key="index" class="d-flex mb-2">
                  <v-text-field
                    v-model="formData.clients[index]"
                    variant="outlined"
                    density="compact"
                    :placeholder="`Client ${index + 1}`"
                    :error-messages="index === 0 && showClientError ? ['At least one client is required'] : []"
                    :hide-details="!(index === 0 && showClientError)"
                    class="flex-grow-1"
                  />
                  <v-btn
                    v-if="formData.clients.length > 1"
                    icon
                    variant="text"
                    color="error"
                    class="ml-2"
                    @click="removeClient(index)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <v-btn
                  variant="outlined"
                  color="primary"
                  block
                  @click="addClient"
                  class="mt-2"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Add Client
                </v-btn>
              </div>
            </v-col>

            <!-- Description -->
            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Description"
                variant="outlined"
                density="compact"
                placeholder="Brief description of the matter..."
                auto-grow
                rows="2"
                hide-details
              />
            </v-col>

            <!-- Adverse Parties (Optional) -->
            <v-col cols="12">
              <div class="text-subtitle-2 mb-2">
                Adverse Parties <span class="text-grey text-caption">(optional)</span>
              </div>
              <div class="party-list">
                <div v-for="(party, index) in formData.adverseParties" :key="index" class="d-flex mb-2">
                  <v-text-field
                    v-model="formData.adverseParties[index]"
                    variant="outlined"
                    density="compact"
                    :placeholder="`Adverse Party ${index + 1}`"
                    class="flex-grow-1"
                    hide-details
                  />
                  <v-btn
                    icon
                    variant="text"
                    color="error"
                    class="ml-2"
                    @click="removeAdverseParty(index)"
                  >
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <v-btn
                  variant="outlined"
                  color="primary"
                  block
                  @click="addAdverseParty"
                  class="mt-2"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Add Adverse Party
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions class="px-6 pb-6">
        <v-btn variant="outlined" :to="{ name: 'matters' }" class="mr-3">
          <v-icon start>mdi-arrow-left</v-icon>
          Back
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="elevated"
          :loading="creating"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          <v-icon start>mdi-plus</v-icon>
          Create Matter
        </v-btn>
      </v-card-actions>
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// Component configuration
defineOptions({
  name: 'NewMatterView',
});

const router = useRouter();

// Form state
const formData = ref({
  matterNo: '',
  description: '',
  clients: [''],
  adverseParties: [],
});

const creating = ref(false);
const showClientError = ref(false);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Computed validation
const isFormValid = computed(() => {
  return formData.value.clients.some((client) => client.trim() !== '');
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
  // Check if at least one client with a non-empty value exists
  const hasValidClient = formData.value.clients.some((client) => client.trim() !== '');

  if (!hasValidClient) {
    showClientError.value = true;
    return false;
  }

  showClientError.value = false;
  return true;
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

/* Align text fields with buttons by reducing height to compensate for nested containers */
:deep(.v-input--density-compact .v-field) {
  height: 36px;
}
</style>
