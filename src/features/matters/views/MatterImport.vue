<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <PageLayout>
      <TitleDrawer title="Bulk Import">
        <button
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          @click="mockImport"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          Import Selected ({{ selectedCount }})
        </button>
      </TitleDrawer>

      <!-- Tabbed Import Tables -->
      <div class="mx-6 mb-6 relative z-10">
        <v-card class="shadow-sm">
          <v-tabs
            v-model="activeTab"
            bg-color="white"
            color="blue"
            grow
          >
            <v-tab value="folder">
              <div class="flex items-center gap-2">
                <span class="text-2xl">📁</span>
                <span class="font-medium">Import from Folders</span>
              </div>
            </v-tab>
            <v-tab value="document">
              <div class="flex items-center gap-2">
                <span class="text-2xl">📄</span>
                <span class="font-medium">Import from Matter List</span>
              </div>
            </v-tab>
            <v-tab value="map-fields">
              <div class="flex items-center gap-2">
                <span class="text-2xl">🤖</span>
                <span class="font-medium">Map Fields with AI</span>
              </div>
            </v-tab>
            <v-tab value="review-mappings">
              <div class="flex items-center gap-2">
                <span class="text-2xl">🔍</span>
                <span class="font-medium">Review Field Mappings</span>
              </div>
            </v-tab>
            <v-tab value="confirm-import">
              <div class="flex items-center gap-2">
                <span class="text-2xl">✅</span>
                <span class="font-medium">Confirm Import</span>
              </div>
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Folder Import Table -->
            <v-window-item value="folder">
              <div class="table-container bg-white min-w-[720px]">
                <table class="w-full min-w-[720px]">
                  <thead class="sticky-table-header border-b border-slate-200 min-w-[720px]">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                        Import
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Matter Number
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Folder Path
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Confidence
                      </th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-slate-200">
                    <tr
                      v-for="item in mockFolderData"
                      :key="item.matterNumber"
                      class="hover:bg-slate-50 transition-colors"
                    >
                      <td class="px-4 py-3">
                        <input
                          v-model="item.import"
                          type="checkbox"
                          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.clientName }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.matterNumber }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.folderPath }}</td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="{
                            'bg-green-100 text-green-800': item.confidence >= 90,
                            'bg-yellow-100 text-yellow-800': item.confidence >= 70 && item.confidence < 90,
                            'bg-red-100 text-red-800': item.confidence < 70,
                          }"
                        >
                          {{ item.confidence }}%
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <button class="text-slate-400 hover:text-slate-600 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </v-window-item>

            <!-- Document Import Table -->
            <v-window-item value="document">
              <div class="table-container bg-white min-w-[720px]">
                <table class="w-full min-w-[720px]">
                  <thead class="sticky-table-header border-b border-slate-200 min-w-[720px]">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-16">
                        Import
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Client Name
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Matter Number
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Status
                      </th>
                      <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                        Date Opened
                      </th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-slate-200">
                    <tr
                      v-for="item in mockDocumentData"
                      :key="item.matterNumber"
                      class="hover:bg-slate-50 transition-colors"
                    >
                      <td class="px-4 py-3">
                        <input
                          v-model="item.import"
                          type="checkbox"
                          class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.clientName }}</td>
                      <td class="px-4 py-3 text-sm text-slate-900">{{ item.matterNumber }}</td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.description }}</td>
                      <td class="px-4 py-3">
                        <span
                          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          :class="getStatusClass(item.status)"
                        >
                          {{ item.status }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-slate-600">{{ item.dateOpened }}</td>
                      <td class="px-4 py-3 text-right">
                        <button class="text-slate-400 hover:text-slate-600 transition-colors">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </v-window-item>

            <!-- Map Fields with AI Tab -->
            <v-window-item value="map-fields">
              <div class="bg-white p-8">
                <div class="text-center text-slate-500">
                  <span class="text-4xl mb-4 block">🤖</span>
                  <h3 class="text-lg font-semibold mb-2">Map Fields with AI</h3>
                  <p class="text-sm">AI-powered field mapping will be displayed here</p>
                </div>
              </div>
            </v-window-item>

            <!-- Review Field Mappings Tab -->
            <v-window-item value="review-mappings">
              <div class="bg-white p-8">
                <div class="text-center text-slate-500">
                  <span class="text-4xl mb-4 block">🔍</span>
                  <h3 class="text-lg font-semibold mb-2">Review Field Mappings</h3>
                  <p class="text-sm">Field mapping review interface will be displayed here</p>
                </div>
              </div>
            </v-window-item>

            <!-- Confirm Import Tab -->
            <v-window-item value="confirm-import">
              <div class="bg-white p-8">
                <div class="text-center text-slate-500">
                  <span class="text-4xl mb-4 block">✅</span>
                  <h3 class="text-lg font-semibold mb-2">Confirm Import</h3>
                  <p class="text-sm">Import confirmation and summary will be displayed here</p>
                </div>
              </div>
            </v-window-item>
          </v-window>
        </v-card>
      </div>
    </PageLayout>

    <!-- Success Notification -->
    <div
      v-if="showSuccessNotification"
      class="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 z-50"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span class="text-sm font-medium">Mock import successful!</span>
      <button class="ml-2 hover:text-green-100" @click="showSuccessNotification = false">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
</template>

<script setup>
import { ref, computed } from 'vue';
import PageLayout from '@/shared/components/layout/PageLayout.vue';
import TitleDrawer from '@/shared/components/layout/TitleDrawer.vue';
import folderImportData from '../data/import-from-folders.json';
import documentImportData from '../data/import-from-matter-list.json';

defineOptions({
  name: 'MatterImportView',
});

// State
const activeTab = ref('folder');
const showSuccessNotification = ref(false);

// Mock Data for Folder Import
const mockFolderData = ref(folderImportData);

// Mock Data for Document Import
const mockDocumentData = ref(documentImportData);

// Computed
const selectedCount = computed(() => {
  const data = activeTab.value === 'folder' ? mockFolderData.value : mockDocumentData.value;
  return data.filter(item => item.import).length;
});

// Methods
function mockImport() {
  showSuccessNotification.value = true;
  setTimeout(() => {
    showSuccessNotification.value = false;
  }, 3000);
}

function getStatusClass(status) {
  const classes = {
    Active: 'bg-green-100 text-green-800',
    Pending: 'bg-yellow-100 text-yellow-800',
    Closed: 'bg-slate-100 text-slate-600',
  };
  return classes[status] || 'bg-slate-100 text-slate-600';
}
</script>

<style scoped>
.bg-viewport-bg {
  background-color: #faf8f3;
}

.sticky-table-header {
  position: sticky;
  top: 0;
  background-color: #f8fafc;
  z-index: 10;
}

</style>
