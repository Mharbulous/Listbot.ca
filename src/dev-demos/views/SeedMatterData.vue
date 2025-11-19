<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div class="bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-slate-900 mb-2">Matter Database Seeding Utility</h1>
      <p class="text-slate-600 mb-6">
        Populate your Firestore database with 23 sample matters for testing. This is a one-time
        operation typically used during development.
      </p>

      <!-- User Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 class="font-semibold text-blue-900 mb-2">Current User Information</h3>
        <div class="text-sm text-blue-800 space-y-1">
          <p><strong>User ID:</strong> {{ authStore.user?.uid || 'Not logged in' }}</p>
          <p><strong>Firm ID:</strong> {{ authStore.firmId || 'No firm' }}</p>
          <p><strong>Email:</strong> {{ authStore.user?.email || 'N/A' }}</p>
          <p class="mt-3 text-blue-700">
            All matters will be created in your firm ({{ authStore.firmId }}) and assigned to you.
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-4">
        <!-- Seed Button -->
        <div class="flex items-start gap-4">
          <button
            @click="handleSeed"
            :disabled="seeding || !authStore.firmId"
            class="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg
              v-if="seeding"
              class="animate-spin h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            {{ seeding ? 'Seeding Database...' : 'Seed Database (23 Matters)' }}
          </button>
          <div class="flex-1 text-sm text-slate-600 pt-3">
            This will create 23 sample matters in your Firestore database. Each matter will include
            clients, descriptions, and other realistic data.
          </div>
        </div>

        <!-- Clear Button (Dangerous) -->
        <div class="flex items-start gap-4">
          <button
            @click="handleClear"
            :disabled="clearing || !authStore.firmId"
            class="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg
              v-if="clearing"
              class="animate-spin h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {{ clearing ? 'Clearing...' : 'Clear All Mock Data Matters' }}
          </button>
          <div class="flex-1 text-sm text-red-600 pt-3">
            <strong>⚠️ Warning:</strong> This will permanently delete ALL MOCK DATA matters from
            your firm. Manually created matters are safe and will not be deleted.
          </div>
        </div>
      </div>

      <!-- Result Messages -->
      <div v-if="successMessage" class="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 class="text-green-900 font-medium">Success!</h3>
            <p class="text-green-700 text-sm">{{ successMessage }}</p>
          </div>
        </div>
      </div>

      <div v-if="errorMessage" class="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
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
            <h3 class="text-red-900 font-medium">Error</h3>
            <p class="text-red-700 text-sm">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-8 border-t border-slate-200 pt-6">
        <h3 class="font-semibold text-slate-900 mb-3">Usage Instructions</h3>
        <ol class="list-decimal list-inside space-y-2 text-sm text-slate-700">
          <li>Make sure you're logged in with a valid user account</li>
          <li>Click "Seed Database" to populate Firestore with 23 sample matters</li>
          <li>Navigate to the Matters page to view the seeded data</li>
          <li>
            If you need to re-seed, first click "Clear All Matters" then "Seed Database" again
          </li>
        </ol>

        <div class="mt-4 text-sm text-slate-600">
          <p class="mb-2">
            <strong>Note:</strong> This utility is for development use only. After initial database
            population, you can remove this view or keep it for testing purposes.
          </p>
          <router-link to="/matters" class="text-blue-600 hover:text-blue-700 underline">
            Go to Matters Page →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/core/auth/stores/index.js';
import { seedMatters, clearMatters } from '@/features/matters/utils/seedMatters.js';

// Auth store
const authStore = useAuthStore();

// State
const seeding = ref(false);
const clearing = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

/**
 * Handle seeding the database
 */
async function handleSeed() {
  if (!authStore.firmId || !authStore.user?.uid) {
    errorMessage.value = 'You must be logged in to seed the database';
    return;
  }

  seeding.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const result = await seedMatters(authStore.firmId, authStore.user.uid);

    if (result.success > 0) {
      successMessage.value = `Successfully seeded ${result.success} matters into your database!`;

      if (result.failed > 0) {
        successMessage.value += ` (${result.failed} failed - check console for details)`;
      }
    } else {
      errorMessage.value = 'Failed to seed any matters. Check console for details.';
    }
  } catch (error) {
    console.error('Seeding error:', error);
    errorMessage.value = error.message || 'An error occurred while seeding the database';
  } finally {
    seeding.value = false;
  }
}

/**
 * Handle clearing all matters
 */
async function handleClear() {
  if (!authStore.firmId) {
    errorMessage.value = 'You must be logged in to clear matters';
    return;
  }

  // Confirm before clearing
  const confirmed = confirm(
    'Are you sure you want to delete ALL MOCK DATA matters from your firm? Manually created matters will be safe. This action cannot be undone!'
  );

  if (!confirmed) {
    return;
  }

  clearing.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  try {
    const count = await clearMatters(authStore.firmId);
    successMessage.value = `Successfully cleared ${count} mock data matters from your firm`;
  } catch (error) {
    console.error('Clearing error:', error);
    errorMessage.value = error.message || 'An error occurred while clearing mock matters';
  } finally {
    clearing.value = false;
  }
}
</script>

<style scoped>
/* Component-specific styles if needed */
</style>
