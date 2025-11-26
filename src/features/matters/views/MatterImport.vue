<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <PageLayout>
      <TitleDrawer title="Import Matters">
        <button
          v-if="selectedPath"
          class="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          @click="resetPath"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Change Import Path
        </button>
        <button
          v-if="selectedPath"
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

      <!-- Import Path Selection -->
      <div v-if="!selectedPath" class="mx-6 mb-6 relative z-10">
        <div class="grid gap-6 md:grid-cols-2">
          <!-- Path 1: Folder Structure Import -->
          <button
            class="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left"
            @click="selectPath('folder')"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="text-4xl">📁</div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">Folder Structure Import</h3>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              Select the root folder containing your client matters. Listbot will identify and reproduce your client schema automatically.
            </p>
          </button>

          <!-- Path 2: Import Matter List -->
          <button
            class="bg-white border-2 border-slate-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left"
            @click="selectPath('document')"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="text-4xl">📄</div>
              <div>
                <h3 class="text-lg font-bold text-slate-900">Import Matter List</h3>
              </div>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed">
              Upload a client matter list in CSV/Excel/PDF format. Listbot will identify and reproduce your matter schema.
            </p>
          </button>
        </div>
      </div>

      <!-- Folder Import Table -->
      <div v-if="selectedPath === 'folder'" class="table-container bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden min-w-[720px] relative z-10">
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

      <!-- Document Import Table -->
      <div v-if="selectedPath === 'document'" class="table-container bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden min-w-[720px] relative z-10">
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

defineOptions({
  name: 'MatterImportView',
});

// State
const selectedPath = ref(null);
const showSuccessNotification = ref(false);

// Mock Data for Folder Import
const mockFolderData = ref([
  {
    import: true,
    clientName: 'Smith, John',
    matterNumber: 'M-2024-001',
    folderPath: '/Clients/Smith, John - M-2024-001',
    confidence: 95,
  },
  {
    import: true,
    clientName: 'Johnson Corp',
    matterNumber: 'M-2024-002',
    folderPath: '/Clients/Johnson Corp - M-2024-002',
    confidence: 92,
  },
  {
    import: true,
    clientName: 'Williams Estate',
    matterNumber: 'M-2024-003',
    folderPath: '/Clients/Williams Estate - M-2024-003',
    confidence: 88,
  },
  {
    import: true,
    clientName: 'Davis & Associates',
    matterNumber: 'M-2024-004',
    folderPath: '/Clients/Davis & Associates - M-2024-004',
    confidence: 96,
  },
  {
    import: false,
    clientName: 'Miller Corp',
    matterNumber: 'M-2024-005',
    folderPath: '/Clients/Miller Corp - M-2024-005',
    confidence: 68,
  },
]);

// Mock Data for Document Import
const mockDocumentData = ref([
  {
    import: true,
    clientName: 'Anderson, Sarah',
    matterNumber: 'M-2024-101',
    description: 'Real Estate Transaction',
    status: 'Active',
    dateOpened: '2024-01-15',
  },
  {
    import: true,
    clientName: 'Brown Industries',
    matterNumber: 'M-2024-102',
    description: 'Contract Review',
    status: 'Active',
    dateOpened: '2024-02-01',
  },
  {
    import: true,
    clientName: 'Davis Family Trust',
    matterNumber: 'M-2024-103',
    description: 'Estate Planning',
    status: 'Active',
    dateOpened: '2024-02-10',
  },
  {
    import: true,
    clientName: 'Miller & Associates',
    matterNumber: 'M-2024-104',
    description: 'Corporate Restructuring',
    status: 'Pending',
    dateOpened: '2024-03-05',
  },
  {
    import: false,
    clientName: 'Wilson, Robert',
    matterNumber: 'M-2024-105',
    description: 'Litigation Support',
    status: 'Closed',
    dateOpened: '2024-01-20',
  },
]);

// Computed
const selectedCount = computed(() => {
  const data = selectedPath.value === 'folder' ? mockFolderData.value : mockDocumentData.value;
  return data.filter(item => item.import).length;
});

// Methods
function selectPath(path) {
  selectedPath.value = path;
}

function resetPath() {
  selectedPath.value = null;
}

function mockImport() {
  showSuccessNotification.value = true;
  setTimeout(() => {
    showSuccessNotification.value = false;
    resetPath();
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

.table-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}
</style>
