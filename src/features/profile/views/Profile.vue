<template>
  <div class="profile-page">
    <v-card variant="flat" class="mx-auto">
      <v-card-text class="pt-6">
        <!-- Profile Header with Avatar -->
        <div class="profile-header mb-8">
          <div class="profile-header-left">
            <div
              class="avatar w-16 h-16 bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white rounded-full flex items-center justify-center font-semibold text-xl"
            >
              {{ displayInitials }}
            </div>
            <div class="profile-info">
              <h2 class="profile-name">{{ displayFullName }}</h2>
              <p class="profile-email">{{ authStore.user?.email || 'user@example.com' }}</p>
            </div>
          </div>
          <div class="profile-header-right">
            <span class="lawyer-label">Lawyer</span>
            <v-switch
              v-model="isLawyerReversed"
              color="primary"
              density="compact"
              hide-details
              class="lawyer-switch"
            />
          </div>
        </div>

        <!-- Form -->
        <v-form v-model="formValid" @submit.prevent="handleSubmit">
          <!-- Personal Information Section -->
          <div class="section-header">PERSONAL INFORMATION</div>

          <!-- Name Fields Row -->
          <v-row class="mb-4">
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="formData.firstName"
                label="First Name *"
                variant="outlined"
                density="comfortable"
                placeholder="First"
                :rules="[rules.required, rules.maxLength(50)]"
                :error-messages="errors.firstName"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="formData.middleNames"
                label="Middle Names"
                variant="outlined"
                density="comfortable"
                placeholder="Optional"
                :rules="[rules.maxLength(100)]"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="formData.lastName"
                label="Last Name *"
                variant="outlined"
                density="comfortable"
                placeholder="Last"
                :rules="[rules.required, rules.maxLength(50)]"
                :error-messages="errors.lastName"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- Action Buttons -->
      <v-card-actions class="px-6 pb-6 d-flex">
        <v-btn variant="outlined" @click="handleCancel" size="large" :disabled="saving">
          Cancel
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="elevated"
          size="large"
          :loading="saving"
          :disabled="!hasChanges || !formValid"
          @click="handleSubmit"
        >
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Success/Error Snackbar -->
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
import { useAuthStore } from '@/core/auth/stores';
import { ProfileService } from '../services/profileService';

// Component configuration
defineOptions({
  name: 'ProfileView',
});

const authStore = useAuthStore();

// Form state
const formData = ref({
  firstName: '',
  middleNames: '',
  lastName: '',
  isLawyer: false,
});

const originalData = ref({
  firstName: '',
  middleNames: '',
  lastName: '',
  isLawyer: false,
});

const formValid = ref(false);
const loading = ref(false);
const saving = ref(false);
const errors = ref({
  firstName: [],
  lastName: [],
});

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
});

// Validation rules
const rules = {
  required: (value) => !!value?.trim() || 'This field is required',
  maxLength: (max) => (value) =>
    !value || value.length <= max || `Maximum ${max} characters allowed`,
};

// Computed properties
const displayFullName = computed(() => {
  if (formData.value.firstName && formData.value.lastName) {
    return ProfileService.constructDisplayName(
      formData.value.firstName,
      formData.value.middleNames,
      formData.value.lastName
    );
  }
  return authStore.userDisplayName || 'User';
});

const displayInitials = computed(() => {
  if (formData.value.firstName && formData.value.lastName) {
    const firstInitial = formData.value.firstName.charAt(0).toUpperCase();
    const lastInitial = formData.value.lastName.charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }
  return authStore.userInitials || 'U';
});

const hasChanges = computed(() => {
  return (
    formData.value.firstName !== originalData.value.firstName ||
    formData.value.middleNames !== originalData.value.middleNames ||
    formData.value.lastName !== originalData.value.lastName ||
    formData.value.isLawyer !== originalData.value.isLawyer
  );
});

// Inverted binding for the lawyer switch (CSS flips visual, this flips the value)
const isLawyerReversed = computed({
  get() {
    return !formData.value.isLawyer;
  },
  set(value) {
    formData.value.isLawyer = !value;
  },
});

// Methods
const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

const loadProfile = async () => {
  loading.value = true;
  errors.value = { firstName: [], lastName: [] };

  try {
    const userId = authStore.user?.uid;
    const firmId = authStore.currentFirm;

    if (!userId || !firmId) {
      throw new Error('User not authenticated or no firm found');
    }

    // Fetch user profile data
    const profile = await ProfileService.getProfile(userId);

    // Fetch isLawyer status from firm
    const isLawyer = await ProfileService.getIsLawyerStatus(firmId, userId);

    if (profile) {
      formData.value = {
        firstName: profile.firstName || '',
        middleNames: profile.middleNames || '',
        lastName: profile.lastName || '',
        isLawyer: isLawyer,
      };

      // Store original values for change detection
      originalData.value = { ...formData.value };
    } else {
      // No profile yet - initialize with defaults
      formData.value = {
        firstName: '',
        middleNames: '',
        lastName: '',
        isLawyer: false,
      };
      originalData.value = { ...formData.value };
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    showNotification('Failed to load profile: ' + error.message, 'error');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  // Validate form
  if (!formValid.value) {
    showNotification('Please fix the errors in the form', 'error');
    return;
  }

  if (!hasChanges.value) {
    showNotification('No changes to save', 'info');
    return;
  }

  saving.value = true;
  errors.value = { firstName: [], lastName: [] };

  try {
    const userId = authStore.user?.uid;
    const firmId = authStore.currentFirm;

    if (!userId || !firmId) {
      throw new Error('User not authenticated or no firm found');
    }

    // Update profile
    await ProfileService.updateProfile(userId, firmId, {
      firstName: formData.value.firstName,
      middleNames: formData.value.middleNames,
      lastName: formData.value.lastName,
      isLawyer: formData.value.isLawyer,
    });

    // Update original data to reflect saved state
    originalData.value = { ...formData.value };

    showNotification('Profile updated successfully', 'success');

    // Refresh auth store to update display name
    if (authStore.user) {
      authStore.user.displayName = ProfileService.constructDisplayName(
        formData.value.firstName,
        formData.value.middleNames,
        formData.value.lastName
      );
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    showNotification('Failed to save profile: ' + error.message, 'error');
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  // Reset form to original values
  formData.value = { ...originalData.value };
};

// Lifecycle
onMounted(async () => {
  await loadProfile();
});
</script>

<style scoped>
.profile-page {
  min-width: 50%;
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

/* Profile Header */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.profile-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #5b7ce6 0%, #4a5fc1 100%);
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.profile-email {
  font-size: 0.875rem;
  color: #64748b;
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

.section-header:first-of-type {
  margin-top: 0;
}

/* Field Labels */
.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.required-indicator {
  color: #ef4444;
}

.optional-text {
  color: #999;
  font-weight: 400;
}

/* Lawyer Switch Styling */
.lawyer-label {
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
}

/* Flip the switch visually with CSS transform */
.lawyer-switch :deep(.v-switch__track) {
  background-color: #5b7ce6 !important;
  opacity: 1 !important;
  transform: scaleX(-1);
}

.lawyer-switch :deep(.v-switch__thumb) {
  transform: scaleX(-1);
  background-color: white !important;
  box-shadow: 0 0 8px 2px rgba(91, 124, 230, 0.3) !important;
}

.lawyer-switch :deep(.v-selection-control--dirty .v-switch__track) {
  background-color: #9ca3af !important;
}

.lawyer-switch :deep(.v-selection-control--dirty .v-switch__thumb) {
  background-color: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

/* Align text fields with buttons */
:deep(.v-input--density-compact .v-field) {
  height: 36px;
}

/* Vuetify brand color override */
.from-brand-blue {
  --tw-gradient-from: #5b7ce6;
}

.to-brand-blue-dark {
  --tw-gradient-to: #4a5fc1;
}
</style>
