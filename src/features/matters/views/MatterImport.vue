<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <PageLayout>
      <TitleDrawer title="Bulk Import">
        <div class="flex items-center gap-3">
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            @click="importFolders"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Folders
          </button>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            @click="importList"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import List
          </button>
        </div>
      </TitleDrawer>

      <!-- 
        FIX: Import Tabs now wraps the content via slot.
        This puts tabs and content in the SAME stacking context,
        allowing z-index values to properly compete.
      -->
      <ImportTabs v-model="activeTab">
        <template #content>
          <!-- Tabbed Import Content - now INSIDE ImportTabs component -->
          <div class="mx-6 mb-6">
            <div class="content-container">
              <!-- Folder Import Table -->
              <div v-if="activeTab === 'folder'" class="table-container bg-white min-w-[720px]">
                    <table class="w-full min-w-[720px]">
                      <thead class="sticky-table-header border-b border-slate-300 min-w-[720px]">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider w-16">
                            Import
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">
                            Client Name
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">
                            Matter Number
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">
                            Folder Path
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider w-32">
                            Confidence
                          </th>
                          <th class="px-4 py-3 text-right text-xs font-medium text-slate-900 uppercase tracking-wider w-20">
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

              <!-- Document Import Table -->
              <div v-if="activeTab === 'document'" class="table-container bg-white min-w-[720px]">
                    <table class="w-full min-w-[720px]">
                      <thead class="sticky-table-header border-b border-slate-300 min-w-[720px]">
                        <tr>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider w-16">
                            Import
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">
                            Client Name
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">
                            Matter Number
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider">
                            Description
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider w-32">
                            Status
                          </th>
                          <th class="px-4 py-3 text-left text-xs font-medium text-slate-900 uppercase tracking-wider w-32">
                            Date Opened
                          </th>
                          <th class="px-4 py-3 text-right text-xs font-medium text-slate-900 uppercase tracking-wider w-20">
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
                              class="inline-flex items-center px-2.5 py-0.5 rounded-wider text-xs font-medium"
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

              <!-- Map Fields with AI Tab -->
              <div v-if="activeTab === 'map-fields'" class="bg-white p-8">
                    <div class="text-center text-slate-500">
                      <span class="text-4xl mb-4 block">🤖</span>
                      <h3 class="text-lg font-semibold mb-2">Map Fields with AI</h3>
                      <p class="text-sm">AI-powered field mapping will be displayed here</p>
                    </div>
                  </div>

              <!-- Review Field Mappings Tab -->
              <div v-if="activeTab === 'review-mappings'" class="bg-white p-8">
                    <div class="text-center text-slate-500">
                      <span class="text-4xl mb-4 block">🔍</span>
                      <h3 class="text-lg font-semibold mb-2">Review Field Mappings</h3>
                      <p class="text-sm">Field mapping review interface will be displayed here</p>
                    </div>
                  </div>

              <!-- Confirm Import Tab -->
              <div v-if="activeTab === 'confirm-import'" class="bg-white p-8">
                    <div class="text-center text-slate-500">
                      <span class="text-4xl mb-4 block">✅</span>
                      <h3 class="text-lg font-semibold mb-2">Confirm Import</h3>
                      <p class="text-sm">Import confirmation and summary will be displayed here</p>
                    </div>
                  </div>
            </div>
          </div>
        </template>
      </ImportTabs>
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
import ImportTabs from '../components/ImportTabs.vue';
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
function importFolders() {
  const selectedFolders = mockFolderData.value.filter(item => item.import);
  console.log('Importing folders:', selectedFolders);
  showSuccessNotification.value = true;
  setTimeout(() => {
    showSuccessNotification.value = false;
  }, 3000);
}

function importList() {
  const selectedDocuments = mockDocumentData.value.filter(item => item.import);
  console.log('Importing list:', selectedDocuments);
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

.content-container {
  position: relative;
  z-index: 25; /* Now competes with tab wrappers in SAME stacking context! */
  background: white;
  border: 1px solid #cbd5e1;
  border-top: none; /* Tab connects to content - no visible line between active tab and table header */
  border-radius: 0 0 12px 12px; /* Square top corners, rounded bottom corners */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.sticky-table-header {
  position: sticky;
  top: 0;
  background: #e0f2fe;
  z-index: 10;
  border-top: 1px solid #cbd5e1; /* Matches border-slate-300 bottom border */
}

.table-container {
  overflow-x: auto;
}
</style>