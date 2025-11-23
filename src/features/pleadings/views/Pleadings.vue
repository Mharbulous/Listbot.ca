<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <!-- Scroll Container with Gradient -->
    <div class="scroll-container">
      <!-- Extended Gradient Background (sits behind all content) -->
      <div class="gradient-background"></div>

      <!-- Title Drawer (scrollable - slides up behind sticky tabs) -->
      <div class="title-drawer">
        <h1 class="title-drawer-text">Pleadings</h1>
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

      <!-- Proceedings Tabs (Sticky) -->
      <div class="proceedings-tabs-sticky">
        <div class="px-6 flex justify-between items-end">
          <!-- Left-aligned proceeding tabs -->
          <div class="flex overflow-x-auto gap-1">
            <button
              v-for="proceeding in mockProceedings"
              :key="proceeding.id"
              @click="selectedProceeding = proceeding.id"
              class="folder-tab px-5 py-3 text-sm transition-all whitespace-nowrap relative"
              :class="selectedProceeding === proceeding.id ? 'folder-tab-active' : 'folder-tab-inactive'"
            >
              <div class="flex flex-col items-start">
                <div class="font-bold">{{ proceeding.styleCause }}</div>
                <div class="text-xs text-slate-500">{{ proceeding.venue }} • {{ proceeding.registry }} • {{ proceeding.courtFileNo }}</div>
              </div>
            </button>
          </div>

          <!-- Right-aligned "ALL" tab -->
          <button
            @click="selectedProceeding = null"
            class="folder-tab px-5 py-3 text-sm font-medium transition-all whitespace-nowrap relative"
            :class="selectedProceeding === null ? 'folder-tab-active' : 'folder-tab-inactive'"
          >
            ALL
          </button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="table-container">
      <!-- Data Table -->
      <div class="bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden">
        <!-- Table -->
        <table class="w-full">
          <thead class="table-header border-b border-slate-200 sticky top-0" style="background-color: #e0f2fe;">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Document Name
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Version
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Filing Date
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Filing Party
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Proceeding
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Expires
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
                <div class="text-sm font-medium text-slate-900">{{ pleading.documentName }}</div>
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
                <div class="text-sm">
                  <div class="font-medium text-slate-900">{{ pleading.partyName }}</div>
                  <div class="text-xs text-slate-500">{{ pleading.partyRole }}</div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-xs font-medium rounded-full"
                  :class="{
                    'bg-slate-100 text-slate-700': pleading.status === 'Drafting',
                    'bg-blue-100 text-blue-700': pleading.status === 'Filed' || pleading.status === 'Partially Served',
                    'bg-emerald-100 text-emerald-700': pleading.status === 'Fully Served',
                    'bg-yellow-100 text-yellow-700': pleading.status === 'Expiring soon' || pleading.status === 'Overdue',
                    'bg-red-100 text-red-700': pleading.status === 'Expired' || pleading.status === 'Struck'
                  }"
                >
                  {{ pleading.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm">
                  <div class="font-medium text-slate-900">{{ pleading.proceeding.venue }}</div>
                  <div class="text-xs text-slate-500">{{ pleading.proceeding.courtFileNo }}</div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">
                {{ pleading.expires || '—' }}
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
    styleCause: 'Smith et al. v. Jones et al.',
    jurisdiction: 'BC, Canada',
    venue: 'BCSC',
    registry: 'Coquitlam',
    courtFileNo: 'S-321451',
  },
  {
    id: '2',
    styleCause: 'Doe v. XYZ Ltd.',
    jurisdiction: 'BC, Canada',
    venue: 'BCSC',
    registry: 'Vancouver',
    courtFileNo: 'S-245678',
  },
  {
    id: '3',
    styleCause: 'Adams et al. v. British Columbia',
    jurisdiction: 'BC, Canada',
    venue: 'BCCA',
    registry: 'Vancouver',
    courtFileNo: 'CA-456789',
  },
]);

// Mock data for pleadings
const mockPleadings = ref([
  {
    id: '1',
    documentName: 'Notice of Civil Claim',
    documentType: 'Complaint',
    proceeding: {
      id: '1',
      venue: 'BCSC',
      courtFileNo: 'S-321451',
    },
    partyName: 'John Smith',
    partyRole: 'Plaintiff',
    status: 'Filed',
    version: 'Original',
    filedDate: '2024-03-15',
    expires: null,
    hasAmendments: false,
  },
  {
    id: '2',
    documentName: 'Response to Civil Claim',
    documentType: 'Answer',
    proceeding: {
      id: '1',
      venue: 'BCSC',
      courtFileNo: 'S-321451',
    },
    partyName: 'Acme Corp',
    partyRole: 'Defendant',
    status: 'Fully Served',
    version: 'Original',
    filedDate: '2024-04-12',
    expires: '2024-12-15',
    hasAmendments: false,
  },
  {
    id: '3',
    documentName: 'Counterclaim',
    documentType: 'Counterclaim',
    proceeding: {
      id: '1',
      venue: 'BCSC',
      courtFileNo: 'S-321451',
    },
    partyName: 'Acme Corp',
    partyRole: 'Defendant',
    status: 'Partially Served',
    version: 'Original',
    filedDate: '2024-04-12',
    expires: '2025-01-20',
    hasAmendments: false,
  },
  {
    id: '4',
    documentName: 'Amended Notice of Civil Claim',
    documentType: 'Complaint',
    proceeding: {
      id: '1',
      venue: 'BCSC',
      courtFileNo: 'S-321451',
    },
    partyName: 'John Smith',
    partyRole: 'Plaintiff',
    status: 'Drafting',
    version: 'First Amendment',
    filedDate: '2024-05-20',
    expires: null,
    hasAmendments: true,
  },
  {
    id: '5',
    documentName: 'Reply to Counterclaim',
    documentType: 'Reply',
    proceeding: {
      id: '1',
      venue: 'BCSC',
      courtFileNo: 'S-321451',
    },
    partyName: 'John Smith',
    partyRole: 'Plaintiff',
    status: 'Expiring soon',
    version: 'Original',
    filedDate: '2024-05-28',
    expires: '2024-11-30',
    hasAmendments: false,
  },
  {
    id: '6',
    documentName: 'Notice of Civil Claim',
    documentType: 'Complaint',
    proceeding: {
      id: '2',
      venue: 'BCSC',
      courtFileNo: 'S-245678',
    },
    partyName: 'Jane Doe',
    partyRole: 'Plaintiff',
    status: 'Expired',
    version: 'Original',
    filedDate: '2024-06-01',
    expires: '2024-10-15',
    hasAmendments: false,
  },
  {
    id: '7',
    documentName: 'Response to Civil Claim',
    documentType: 'Answer',
    proceeding: {
      id: '2',
      venue: 'BCSC',
      courtFileNo: 'S-245678',
    },
    partyName: 'XYZ Ltd',
    partyRole: 'Defendant',
    status: 'Overdue',
    version: 'Original',
    filedDate: '2024-07-10',
    expires: '2024-09-20',
    hasAmendments: false,
  },
  {
    id: '8',
    documentName: 'Amended Notice of Civil Claim',
    documentType: 'Complaint',
    proceeding: {
      id: '2',
      venue: 'BCSC',
      courtFileNo: 'S-245678',
    },
    partyName: 'Jane Doe',
    partyRole: 'Plaintiff',
    status: 'Struck',
    version: 'First Amendment',
    filedDate: '2024-08-05',
    expires: '2024-08-20',
    hasAmendments: true,
  },
]);

// Mock version history data
const mockVersionHistory = ref([
  {
    version: 'v2',
    title: 'First Amended Complaint',
    filedDate: '2024-05-20',
    changes: 'Added count for breach of contract, clarified damages calculation',
    isCurrent: true,
  },
  {
    version: 'v1',
    title: 'Original Complaint',
    filedDate: '2024-03-15',
    changes: 'Initial filing',
    isCurrent: false,
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
function showVersionHistory(pleading) {
  showVersionModal.value = true;
}

function openActionMenu(pleading) {
  console.log('Open action menu for:', pleading);
}
</script>

<style scoped>
/* Scroll Container - Fills available space, provides scrolling */
.scroll-container {
  flex: 1; /* Fill available vertical space */
  overflow: auto; /* Browser's native scrollbars for both directions */
  position: relative;
  min-width: 0; /* Allow flex child to shrink below content size */
}

/* Extended Gradient Background - Provides vertical blending space */
.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 800px; /* Extended height for smoother gradient blend */
  background: linear-gradient(179deg, #B2EBF2 0%, #FCFCF5 30%, #FCFCF5 100%);
  z-index: 0; /* Behind all content */
  pointer-events: none; /* Don't interfere with clicks */
}

/* Title Drawer - Scrollable drawer that slides up behind sticky tabs */
.title-drawer {
  padding: 20px 24px;
  min-width: max-content; /* Match table width */
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 1; /* Above gradient background */
  background: transparent;
  color: #455A64;
}

.title-drawer-text {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: inherit; /* Inherit color from parent .title-drawer */
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* Proceedings Tabs - Sticky at top */
.proceedings-tabs-sticky {
  position: sticky;
  top: 0;
  z-index: 10; /* Above scrolling title drawer */
  background: transparent;
  padding-top: 8px;
}

/* Table Container */
.table-container {
  position: relative;
  z-index: 1; /* Above gradient background */
}

/* Folder Tab Base Styles */
.folder-tab {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border: 1px solid #cbd5e1;
  border-bottom: none;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

/* Active Tab - Appears raised and connected to table */
.folder-tab-active {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0f172a; /* slate-900 */
  transform: translateY(1px);
  z-index: 10;
  border-color: #cbd5e1;
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}

/* Inactive Tabs - Appear lower and behind */
.folder-tab-inactive {
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  transform: translateY(4px);
  z-index: 5;
  border-color: #cbd5e1;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.folder-tab-inactive:hover {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  transform: translateY(2px);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.07);
}

/* Override table border radius to connect with tabs */
.folder-tab-active + .folder-tab-active {
  margin-left: -1px;
}

/* Table Header - Matches active tab styling for visual connection */
.table-header {
  border-top-right-radius: 12px;
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}
</style>
