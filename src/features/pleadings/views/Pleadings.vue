<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Page Header -->
    <div class="bg-white border-b border-slate-200 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">Pleadings</h1>
          <p class="text-sm text-slate-600 mt-1">
            Manage pleadings documents and track amendments across proceedings
          </p>
        </div>
        <div class="flex gap-3">
          <button
            class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Proceeding
          </button>
          <button
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Upload Pleading
          </button>
        </div>
      </div>
    </div>

    <!-- Proceedings Summary Cards -->
    <div class="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        v-for="proceeding in mockProceedings"
        :key="proceeding.id"
        class="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        @click="selectedProceeding = selectedProceeding === proceeding.id ? null : proceeding.id"
        :class="{ 'ring-2 ring-purple-500': selectedProceeding === proceeding.id }"
      >
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1">
            <div class="text-xs font-medium text-slate-500 uppercase">{{ proceeding.jurisdiction }}</div>
            <div class="text-sm font-semibold text-slate-900 mt-1">{{ proceeding.venue }}</div>
          </div>
          <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
            {{ proceeding.pleadingCount }} docs
          </span>
        </div>
        <div class="text-xs text-slate-600">
          <div><span class="font-medium">File No:</span> {{ proceeding.courtFileNo }}</div>
          <div class="mt-1"><span class="font-medium">Status:</span> {{ proceeding.status }}</div>
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="flex-1 overflow-auto">
      <!-- Data Table -->
      <div class="bg-white border border-slate-200 m-6 rounded-lg shadow-sm overflow-hidden">
        <!-- Filter Bar -->
        <div class="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-4">
          <div class="flex-1">
            <input
              type="text"
              placeholder="Search pleadings..."
              class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            class="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Document Types</option>
            <option value="complaint">Complaint</option>
            <option value="answer">Answer</option>
            <option value="counterclaim">Counterclaim</option>
            <option value="reply">Reply</option>
          </select>
          <div v-if="selectedProceeding" class="flex items-center gap-2">
            <span class="text-xs text-slate-600">Filtered by proceeding</span>
            <button
              @click="selectedProceeding = null"
              class="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        <!-- Table -->
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Document Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Proceeding
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Version
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Filed Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr
              v-for="pleading in filteredPleadings"
              :key="pleading.id"
              class="hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex-shrink-0 w-8 h-8 bg-purple-100 rounded flex items-center justify-center"
                  >
                    <svg class="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fill-rule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </div>
                  <div class="text-sm">
                    <div class="font-medium text-slate-900">{{ pleading.documentName }}</div>
                    <div class="text-xs text-slate-500">{{ pleading.fileSize }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getDocumentTypeBadgeClass(pleading.documentType)"
                >
                  {{ pleading.documentType }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="font-medium text-slate-900">{{ pleading.proceeding.venue }}</div>
                  <div class="text-xs text-slate-500">{{ pleading.proceeding.courtFileNo }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-slate-900">{{ pleading.version }}</span>
                  <button
                    v-if="pleading.hasAmendments"
                    class="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    @click.stop="showVersionHistory(pleading)"
                  >
                    View History
                  </button>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-900">
                {{ pleading.filedDate }}
              </td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="getStatusBadgeClass(pleading.status)"
                >
                  {{ pleading.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  class="text-slate-400 hover:text-slate-600 transition-colors"
                  @click.stop="openActionMenu(pleading)"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div
          v-if="filteredPleadings.length === 0"
          class="flex flex-col items-center justify-center py-12 text-slate-500"
        >
          <svg
            class="w-16 h-16 mb-4 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p class="text-lg font-medium mb-2">No pleadings found</p>
          <p class="text-sm">Upload your first pleading to get started</p>
        </div>
      </div>
    </div>

    <!-- Version History Modal (placeholder) -->
    <div
      v-if="showVersionModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showVersionModal = false"
    >
      <div
        class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
        @click.stop
      >
        <div class="border-b border-slate-200 px-6 py-4">
          <h2 class="text-xl font-bold text-slate-900">Amendment History</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div
              v-for="(version, index) in mockVersionHistory"
              :key="index"
              class="flex items-start gap-4 p-4 border border-slate-200 rounded-lg"
            >
              <div class="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span class="text-purple-700 font-semibold">{{ version.version }}</span>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-slate-900">{{ version.title }}</span>
                  <span
                    v-if="version.isCurrent"
                    class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                  >
                    Current
                  </span>
                </div>
                <div class="text-sm text-slate-600">Filed: {{ version.filedDate }}</div>
                <div class="text-sm text-slate-500 mt-1">{{ version.changes }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="border-t border-slate-200 px-6 py-4 flex justify-end">
          <button
            @click="showVersionModal = false"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Mock data for proceedings
const mockProceedings = ref([
  {
    id: '1',
    jurisdiction: 'Federal',
    venue: 'Northern District of California',
    courtFileNo: '3:24-cv-01234',
    status: 'Active',
    pleadingCount: 5,
  },
  {
    id: '2',
    jurisdiction: 'State',
    venue: 'Superior Court of California',
    courtFileNo: 'BC-2024-567890',
    status: 'Active',
    pleadingCount: 3,
  },
  {
    id: '3',
    jurisdiction: 'Federal',
    venue: 'Southern District of New York',
    courtFileNo: '1:24-cv-05678',
    status: 'Settled',
    pleadingCount: 2,
  },
]);

// Mock data for pleadings
const mockPleadings = ref([
  {
    id: '1',
    documentName: 'Complaint for Damages',
    documentType: 'Complaint',
    proceeding: {
      id: '1',
      venue: 'Northern District of California',
      courtFileNo: '3:24-cv-01234',
    },
    version: 'Original',
    filedDate: '2024-03-15',
    status: 'Active',
    fileSize: '2.3 MB',
    hasAmendments: false,
  },
  {
    id: '2',
    documentName: 'Answer to Complaint',
    documentType: 'Answer',
    proceeding: {
      id: '1',
      venue: 'Northern District of California',
      courtFileNo: '3:24-cv-01234',
    },
    version: 'Original',
    filedDate: '2024-04-12',
    status: 'Active',
    fileSize: '1.8 MB',
    hasAmendments: false,
  },
  {
    id: '3',
    documentName: 'Counterclaim',
    documentType: 'Counterclaim',
    proceeding: {
      id: '1',
      venue: 'Northern District of California',
      courtFileNo: '3:24-cv-01234',
    },
    version: 'Original',
    filedDate: '2024-04-12',
    status: 'Active',
    fileSize: '1.5 MB',
    hasAmendments: false,
  },
  {
    id: '4',
    documentName: 'First Amended Complaint',
    documentType: 'Complaint',
    proceeding: {
      id: '1',
      venue: 'Northern District of California',
      courtFileNo: '3:24-cv-01234',
    },
    version: 'First Amendment',
    filedDate: '2024-05-20',
    status: 'Active',
    fileSize: '2.5 MB',
    hasAmendments: true,
  },
  {
    id: '5',
    documentName: 'Reply to Counterclaim',
    documentType: 'Reply',
    proceeding: {
      id: '1',
      venue: 'Northern District of California',
      courtFileNo: '3:24-cv-01234',
    },
    version: 'Original',
    filedDate: '2024-05-28',
    status: 'Active',
    fileSize: '1.2 MB',
    hasAmendments: false,
  },
  {
    id: '6',
    documentName: 'Petition for Damages',
    documentType: 'Complaint',
    proceeding: {
      id: '2',
      venue: 'Superior Court of California',
      courtFileNo: 'BC-2024-567890',
    },
    version: 'Original',
    filedDate: '2024-06-01',
    status: 'Active',
    fileSize: '3.1 MB',
    hasAmendments: false,
  },
  {
    id: '7',
    documentName: 'Answer and Affirmative Defenses',
    documentType: 'Answer',
    proceeding: {
      id: '2',
      venue: 'Superior Court of California',
      courtFileNo: 'BC-2024-567890',
    },
    version: 'Original',
    filedDate: '2024-07-10',
    status: 'Active',
    fileSize: '2.2 MB',
    hasAmendments: false,
  },
  {
    id: '8',
    documentName: 'First Amended Petition',
    documentType: 'Complaint',
    proceeding: {
      id: '2',
      venue: 'Superior Court of California',
      courtFileNo: 'BC-2024-567890',
    },
    version: 'First Amendment',
    filedDate: '2024-08-05',
    status: 'Active',
    fileSize: '3.3 MB',
    hasAmendments: true,
  },
]);

// Mock version history data
const mockVersionHistory = ref([
  {
    version: 'v1',
    title: 'Original Complaint',
    filedDate: '2024-03-15',
    changes: 'Initial filing',
    isCurrent: false,
  },
  {
    version: 'v2',
    title: 'First Amended Complaint',
    filedDate: '2024-05-20',
    changes: 'Added count for breach of contract, clarified damages calculation',
    isCurrent: true,
  },
]);

// State
const selectedProceeding = ref(null);
const showVersionModal = ref(false);

// Computed
const filteredPleadings = computed(() => {
  if (!selectedProceeding.value) {
    return mockPleadings.value;
  }
  return mockPleadings.value.filter(p => p.proceeding.id === selectedProceeding.value);
});

// Methods
function getDocumentTypeBadgeClass(type) {
  const classes = {
    'Complaint': 'bg-red-100 text-red-700',
    'Answer': 'bg-blue-100 text-blue-700',
    'Counterclaim': 'bg-orange-100 text-orange-700',
    'Reply': 'bg-green-100 text-green-700',
  };
  return classes[type] || 'bg-slate-100 text-slate-700';
}

function getStatusBadgeClass(status) {
  const classes = {
    'Active': 'bg-green-100 text-green-700',
    'Superseded': 'bg-slate-100 text-slate-700',
    'Dismissed': 'bg-red-100 text-red-700',
  };
  return classes[status] || 'bg-slate-100 text-slate-700';
}

function showVersionHistory(pleading) {
  showVersionModal.value = true;
}

function openActionMenu(pleading) {
  console.log('Open action menu for:', pleading);
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
