<template>
  <div class="p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-slate-800 mb-8">Settings</h1>

      <div class="space-y-6">
        <!-- Preferences -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-4">Preferences</h2>

          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Date Format</h3>
                <p class="text-sm text-slate-600">Set default date format</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="selectedDateFormat"
                  variant="outlined"
                  density="comfortable"
                  :items="dateFormatOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select date format"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="orange" size="20" class="mr-2">mdi-calendar</v-icon>
                      <span class="font-weight-medium mr-2">{{ item.raw.title }}</span>
                      <span class="text-caption text-medium-emphasis"
                        >({{ item.raw.example }})</span
                      >
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title">
                      <template #prepend>
                        <v-icon color="orange" size="20"> mdi-calendar </v-icon>
                      </template>
                      <template #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ item.raw.example }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Time Format</h3>
                <p class="text-sm text-slate-600">Set default time format</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="selectedTimeFormat"
                  variant="outlined"
                  density="comfortable"
                  :items="timeFormatOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select time format"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="#7b1fa2" size="20" class="mr-2">mdi-clock-outline</v-icon>
                      <span class="font-weight-medium mr-2">{{ item.raw.title }}</span>
                      <span class="text-caption text-medium-emphasis"
                        >({{ item.raw.example }})</span
                      >
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title">
                      <template #prepend>
                        <v-icon color="#7b1fa2" size="20"> mdi-clock-outline </v-icon>
                      </template>
                      <template #append>
                        <span class="text-caption text-medium-emphasis">
                          {{ item.raw.example }}
                        </span>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-slate-800">Dark Mode</h3>
                <p class="text-sm text-slate-600">Switch to dark theme</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="isDarkModeEnabled"
                  type="checkbox"
                  class="sr-only peer"
                  :disabled="isLoading"
                />
                <div
                  class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-blue/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Account Settings -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-4">Account Settings</h2>

          <div class="space-y-4">
            <button
              class="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue"
            >
              Change Password
            </button>

            <button
              class="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserPreferencesStore } from '@/core/stores/userPreferences.js';
import {
  dateFormatOptions,
  timeFormatOptions,
} from '@/features/organizer/utils/categoryFormOptions.js';

const preferencesStore = useUserPreferencesStore();
const { dateFormat, timeFormat, darkMode, isLoading } = storeToRefs(preferencesStore);

// Computed properties for v-model binding
const selectedDateFormat = computed({
  get: () => dateFormat.value,
  set: async (value) => {
    try {
      await preferencesStore.updateDateFormat(value);
    } catch (error) {
      console.error('Error updating date format:', error);
    }
  },
});

const selectedTimeFormat = computed({
  get: () => timeFormat.value,
  set: async (value) => {
    try {
      await preferencesStore.updateTimeFormat(value);
    } catch (error) {
      console.error('Error updating time format:', error);
    }
  },
});

const isDarkModeEnabled = computed({
  get: () => darkMode.value,
  set: async (value) => {
    try {
      await preferencesStore.updateDarkMode(value);
    } catch (error) {
      console.error('Error updating dark mode:', error);
    }
  },
});
</script>
