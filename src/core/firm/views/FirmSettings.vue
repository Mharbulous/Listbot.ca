<template>
  <div class="p-8">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-800">Firm Settings</h1>
        <p class="text-slate-600 mt-2">
          Configure firm-wide settings and preferences that apply across all matters and team
          members.
        </p>
      </div>

      <div class="space-y-6">
        <!-- Firm Profile -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-4">Firm Profile</h2>

          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Firm Name</h3>
                <p class="text-sm text-slate-600">Your law firm's official name</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-text-field
                  v-model="firmName"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Enter firm name"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                ></v-text-field>
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Description</h3>
                <p class="text-sm text-slate-600">Brief description of your firm</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-textarea
                  v-model="firmDescription"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Enter firm description"
                  rows="3"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                ></v-textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Firm Preferences -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-4">Default Preferences</h2>
          <p class="text-sm text-slate-600 mb-4">
            These preferences will be used as defaults for all new matters and team members.
          </p>

          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Date Format</h3>
                <p class="text-sm text-slate-600">Default date format for the firm</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="defaultDateFormat"
                  variant="outlined"
                  density="comfortable"
                  :items="dateFormatOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select default date format"
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
                <p class="text-sm text-slate-600">Default time format for the firm</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="defaultTimeFormat"
                  variant="outlined"
                  density="comfortable"
                  :items="timeFormatOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select default time format"
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
          </div>
        </div>

        <!-- Matter Defaults -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-4">Matter Defaults</h2>
          <p class="text-sm text-slate-600 mb-4">
            Configure default settings that will be applied to all new matters.
          </p>

          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Matter Numbering</h3>
                <p class="text-sm text-slate-600">Default format for matter numbers</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="matterNumberingFormat"
                  variant="outlined"
                  density="comfortable"
                  :items="matterNumberingOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select numbering format"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="blue" size="20" class="mr-2">mdi-numeric</v-icon>
                      <span class="font-weight-medium mr-2">{{ item.raw.title }}</span>
                      <span class="text-caption text-medium-emphasis"
                        >({{ item.raw.example }})</span
                      >
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title">
                      <template #prepend>
                        <v-icon color="blue" size="20"> mdi-numeric </v-icon>
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
                <h3 class="text-sm font-medium text-slate-800">Default Matter Type</h3>
                <p class="text-sm text-slate-600">Default type for new matters</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="defaultMatterType"
                  variant="outlined"
                  density="comfortable"
                  :items="matterTypeOptions"
                  placeholder="Select default matter type"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="green" size="20" class="mr-2">mdi-briefcase</v-icon>
                      <span class="font-weight-medium">{{ item.value }}</span>
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template #prepend>
                        <v-icon color="green" size="20"> mdi-briefcase </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Document Retention</h3>
                <p class="text-sm text-slate-600">Default retention period for documents</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-select
                  v-model="documentRetention"
                  variant="outlined"
                  density="comfortable"
                  :items="retentionOptions"
                  item-title="title"
                  item-value="value"
                  placeholder="Select retention period"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                >
                  <template #selection="{ item }">
                    <div class="d-flex align-center">
                      <v-icon color="purple" size="20" class="mr-2">mdi-archive</v-icon>
                      <span class="font-weight-medium">{{ item.raw.title }}</span>
                    </div>
                  </template>
                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :title="item.raw.title">
                      <template #prepend>
                        <v-icon color="purple" size="20"> mdi-archive </v-icon>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
              </div>
            </div>
          </div>
        </div>

        <!-- File Processing Settings -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 class="text-xl font-semibold text-slate-800 mb-4">File Processing Settings</h2>
          <p class="text-sm text-slate-600 mb-4">
            Configure how files are processed and stored across all matters.
          </p>

          <div class="space-y-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Auto-Deduplication</h3>
                <p class="text-sm text-slate-600">Automatically detect and remove duplicate files</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-switch
                  v-model="autoDeduplication"
                  color="primary"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                  label="Enable auto-deduplication"
                ></v-switch>
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">OCR Processing</h3>
                <p class="text-sm text-slate-600">Enable OCR for scanned documents</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-switch
                  v-model="ocrProcessing"
                  color="primary"
                  hide-details
                  :disabled="isLoading"
                  :loading="isLoading"
                  label="Enable OCR processing"
                ></v-switch>
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Bates Numbering</h3>
                <p class="text-sm text-slate-600">Default Bates numbering prefix</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-text-field
                  v-model="batesPrefix"
                  variant="outlined"
                  density="comfortable"
                  placeholder="e.g., FIRM"
                  hint="Will be used as: FIRM-0001, FIRM-0002, etc."
                  persistent-hint
                  :disabled="isLoading"
                  :loading="isLoading"
                ></v-text-field>
              </div>
            </div>
          </div>
        </div>

        <!-- Branding (Future Feature) -->
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-xl font-semibold text-slate-800">Branding</h2>
              <p class="text-sm text-slate-600 mt-1">
                Customize your firm's visual identity across the platform.
              </p>
            </div>
            <v-chip color="amber" size="small" variant="flat">Coming Soon</v-chip>
          </div>

          <div class="space-y-4 opacity-60">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Firm Logo</h3>
                <p class="text-sm text-slate-600">Upload your firm's logo</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <v-btn variant="outlined" disabled prepend-icon="mdi-upload"
                  >Upload Logo</v-btn
                >
              </div>
            </div>

            <div class="flex items-start justify-between gap-4">
              <div class="flex-shrink-0" style="min-width: 200px">
                <h3 class="text-sm font-medium text-slate-800">Primary Color</h3>
                <p class="text-sm text-slate-600">Choose your brand color</p>
              </div>
              <div class="flex-grow" style="max-width: 400px">
                <div class="flex items-center gap-2">
                  <div
                    class="w-10 h-10 rounded border border-slate-300 bg-blue-600"
                    style="background-color: #2563eb"
                  ></div>
                  <v-text-field
                    value="#2563EB"
                    variant="outlined"
                    density="comfortable"
                    disabled
                    hide-details
                  ></v-text-field>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end gap-3 pt-4">
          <v-btn variant="outlined" :disabled="isLoading" @click="resetSettings"
            >Reset</v-btn
          >
          <v-btn
            color="primary"
            :loading="isSaving"
            :disabled="isLoading"
            @click="saveSettings"
            >Save Changes</v-btn
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useFirmStore } from '@/core/firm/stores/firm';
import { useAuthStore } from '@/core/auth/stores/authStore';
import {
  dateFormatOptions,
  timeFormatOptions,
} from '@/features/documents/utils/categoryFormOptions.js';

const firmStore = useFirmStore();
const authStore = useAuthStore();
const { currentFirm, loading: isLoading } = storeToRefs(firmStore);

// Firm Profile
const firmName = ref('');
const firmDescription = ref('');

// Default Preferences
const defaultDateFormat = ref('YYYY-MM-DD');
const defaultTimeFormat = ref('24h');

// Matter Defaults
const matterNumberingFormat = ref('sequential');
const defaultMatterType = ref('Litigation');
const documentRetention = ref('7years');

// File Processing
const autoDeduplication = ref(true);
const ocrProcessing = ref(true);
const batesPrefix = ref('FIRM');

// UI State
const isSaving = ref(false);

// Options
const matterNumberingOptions = [
  { title: 'Sequential', value: 'sequential', example: '2024-0001' },
  { title: 'Year-Based', value: 'year-based', example: '24-0001' },
  { title: 'Custom', value: 'custom', example: 'MATTER-0001' },
];

const matterTypeOptions = [
  'Litigation',
  'Corporate',
  'Real Estate',
  'Family Law',
  'Criminal Defense',
  'Estate Planning',
  'Other',
];

const retentionOptions = [
  { title: '5 Years', value: '5years' },
  { title: '7 Years', value: '7years' },
  { title: '10 Years', value: '10years' },
  { title: 'Indefinite', value: 'indefinite' },
];

// Load firm data
onMounted(async () => {
  const firmId = authStore.user?.uid;
  if (firmId && !currentFirm.value) {
    await firmStore.loadFirm(firmId);
  }

  // Load current firm settings
  if (currentFirm.value) {
    firmName.value = currentFirm.value.name || '';
    firmDescription.value = currentFirm.value.description || '';

    // Load settings if they exist
    const settings = currentFirm.value.settings || {};
    defaultDateFormat.value = settings.defaultDateFormat || 'YYYY-MM-DD';
    defaultTimeFormat.value = settings.defaultTimeFormat || '24h';
    matterNumberingFormat.value = settings.matterNumberingFormat || 'sequential';
    defaultMatterType.value = settings.defaultMatterType || 'Litigation';
    documentRetention.value = settings.documentRetention || '7years';
    autoDeduplication.value = settings.autoDeduplication ?? true;
    ocrProcessing.value = settings.ocrProcessing ?? true;
    batesPrefix.value = settings.batesPrefix || 'FIRM';
  }
});

// Save settings
const saveSettings = async () => {
  isSaving.value = true;

  try {
    // In a real implementation, this would call a firm service method to update settings
    console.log('Saving firm settings:', {
      firmName: firmName.value,
      firmDescription: firmDescription.value,
      settings: {
        defaultDateFormat: defaultDateFormat.value,
        defaultTimeFormat: defaultTimeFormat.value,
        matterNumberingFormat: matterNumberingFormat.value,
        defaultMatterType: defaultMatterType.value,
        documentRetention: documentRetention.value,
        autoDeduplication: autoDeduplication.value,
        ocrProcessing: ocrProcessing.value,
        batesPrefix: batesPrefix.value,
      },
    });

    // TODO: Implement actual save logic
    // await FirmService.updateFirmSettings(firmId, { ... });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    alert('Settings saved successfully!');
  } catch (error) {
    console.error('Error saving firm settings:', error);
    alert('Error saving settings. Please try again.');
  } finally {
    isSaving.value = false;
  }
};

// Reset settings
const resetSettings = () => {
  if (confirm('Are you sure you want to reset all settings to their current saved values?')) {
    // Reload the component or reset values
    window.location.reload();
  }
};
</script>
