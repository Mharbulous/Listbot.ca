<template>
  <div class="h-full flex flex-col bg-slate-50">
    <!-- Console-style Controls -->
    <div class="px-6 py-3">
      <div class="flex items-center gap-3">
        <!-- Filter Options -->
        <div class="flex items-center gap-2">
          <!-- My Matters / All Matters -->
          <button
            @click="showMyMattersOnly = !showMyMattersOnly"
            :class="[
              'px-2.5 py-1.5 rounded text-sm font-medium transition-colors',
              showMyMattersOnly
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50',
            ]"
            :title="showMyMattersOnly ? 'My matters' : 'All firm matters'"
          >
            <!-- Single person icon when showing only my matters -->
            <svg v-if="showMyMattersOnly" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
              />
            </svg>
            <!-- Three people icon when showing all firm matters -->
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"
              />
            </svg>
          </button>

          <!-- Active / All (including archived) -->
          <button
            @click="showArchivedMatters = !showArchivedMatters"
            :class="[
              'px-2.5 py-1.5 rounded text-sm font-medium transition-colors',
              showArchivedMatters
                ? 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50'
                : 'bg-slate-800 text-white',
            ]"
            :title="showArchivedMatters ? 'Archive files included' : 'Active files only'"
          >
            <!-- Folders icon when showing active only (teenyicons:folders-solid) -->
            <svg
              v-if="!showArchivedMatters"
              class="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 15 15"
            >
              <path
                d="M4.5 0A1.5 1.5 0 0 0 3 1.5v7A1.5 1.5 0 0 0 4.5 10h9A1.5 1.5 0 0 0 15 8.5v-5A1.5 1.5 0 0 0 13.5 2H9.707l-2-2z"
              />
              <path
                d="M12 11H4.5A2.5 2.5 0 0 1 2 8.5V5h-.5A1.5 1.5 0 0 0 0 6.5v7A1.5 1.5 0 0 0 1.5 15h9a1.5 1.5 0 0 0 1.5-1.5z"
              />
            </svg>
            <!-- Archive icon when showing active + archived (teenyicons:archive-solid) -->
            <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 15 15">
              <path d="M0 0h15v5H0z" />
              <path
                fill-rule="evenodd"
                d="M1 6v7.5A1.5 1.5 0 0 0 2.5 15h10a1.5 1.5 0 0 0 1.5-1.5V6zm9 3H5V8h5z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Case Sensitive -->
          <button
            @click="caseSensitive = !caseSensitive"
            :class="[
              'px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-colors',
              caseSensitive
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50',
            ]"
            :title="caseSensitive ? 'Case sensitive' : 'Case insensitive'"
          >
            {{ caseSensitive ? 'A ≠ a' : 'A = a' }}
          </button>

          <!-- Whole Word Match -->
          <button
            @click="wholeWord = !wholeWord"
            :class="[
              'px-2.5 py-1.5 rounded text-xs font-mono font-bold transition-colors',
              wholeWord
                ? 'bg-slate-800 text-white'
                : 'bg-slate-200/50 text-slate-600 hover:bg-slate-300/50',
            ]"
            :title="wholeWord ? 'Match whole words only' : 'Match partial words'"
          >
            {{ wholeWord ? 'word' : 'wor_' }}
          </button>
        </div>

        <!-- Search Input -->
        <div class="flex-1 relative">
          <input
            v-model="searchText"
            type="text"
            placeholder="filter matters..."
            class="w-full px-3 py-1.5 bg-white/50 border-b-2 border-slate-300 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all placeholder:text-slate-400"
          />
          <svg
            v-if="!searchText"
            class="absolute right-2 top-2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <button
            v-else
            @click="searchText = ''"
            class="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
          >
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

        <!-- New Matter Button -->
        <button
          class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Matter
        </button>

        <!-- Results Summary -->
        <div v-if="searchText" class="text-xs text-slate-500 whitespace-nowrap ml-2">
          {{ filteredMatters.length }}/{{ visibleMatters.length }}
        </div>
      </div>
    </div>

    <!-- Table Container -->
    <div class="flex-1 overflow-auto">
      <div class="bg-white border border-slate-200 m-6 rounded-lg shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 sticky top-0">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Matter No.
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Client(s)
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Other Parties
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
              >
                Last Accessed
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-slate-200">
            <tr
              v-for="matter in filteredMatters"
              :key="matter.id"
              class="hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                <div class="flex items-center gap-2">
                  {{ matter.matterNo }}
                  <span
                    v-if="matter.archived"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600"
                  >
                    Archived
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-900">
                {{ matter.clients }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-700">
                {{ matter.description }}
              </td>
              <td class="px-6 py-4 text-sm text-slate-700">
                {{ matter.otherParties }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {{ matter.lastAccessed }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// Component configuration
defineOptions({
  name: 'MattersView',
});

// Current user ID for "My Matters" filter
const currentUserId = 'user-1';

// Filter state
const searchText = ref('');
const showMyMattersOnly = ref(false);
const showArchivedMatters = ref(false);
const caseSensitive = ref(false);
const wholeWord = ref(false);

// Mock data for demonstration
const mockMatters = ref([
  {
    id: 1,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1', 'user-2'],
    matterNo: '2024-001',
    clients: 'John Smith',
    description: 'Real Estate Purchase - 123 Main Street',
    otherParties: 'ABC Realty Inc.',
    lastAccessed: '2024-03-15',
  },
  {
    id: 2,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1'],
    matterNo: '2024-002',
    clients: 'Jane Doe, Robert Doe',
    description: 'Estate Planning and Will Preparation',
    otherParties: '-',
    lastAccessed: '2024-03-14',
  },
  {
    id: 3,
    status: 'Pending',
    archived: false,
    assignedTo: ['user-3'],
    matterNo: '2024-003',
    clients: 'Acme Corporation',
    description: 'Contract Review and Negotiation',
    otherParties: 'XYZ Enterprises Ltd.',
    lastAccessed: '2024-03-13',
  },
  {
    id: 4,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1'],
    matterNo: '2024-004',
    clients: 'Sarah Johnson',
    description: 'Divorce Settlement',
    otherParties: 'Michael Johnson',
    lastAccessed: '2024-03-12',
  },
  {
    id: 5,
    status: 'Closed',
    archived: true,
    assignedTo: ['user-2'],
    matterNo: '2024-005',
    clients: 'Tech Startup Inc.',
    description: 'Business Incorporation',
    otherParties: '-',
    lastAccessed: '2024-03-10',
  },
  {
    id: 6,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1', 'user-3'],
    matterNo: '2024-006',
    clients: 'Emily Brown',
    description: 'Personal Injury Claim',
    otherParties: 'Insurance Co. of America',
    lastAccessed: '2024-03-09',
  },
  {
    id: 7,
    status: 'Pending',
    archived: false,
    assignedTo: ['user-2'],
    matterNo: '2024-007',
    clients: 'Green Energy Solutions',
    description: 'Commercial Lease Agreement',
    otherParties: 'Downtown Properties LLC',
    lastAccessed: '2024-03-08',
  },
  {
    id: 8,
    status: 'Active',
    archived: false,
    assignedTo: ['user-3'],
    matterNo: '2024-008',
    clients: 'David Wilson',
    description: 'Trademark Registration',
    otherParties: '-',
    lastAccessed: '2024-03-07',
  },
  {
    id: 9,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1'],
    matterNo: '2024-009',
    clients: 'Martha Stevens',
    description: 'Employment Contract Dispute',
    otherParties: 'Global Tech Industries',
    lastAccessed: '2024-03-06',
  },
  {
    id: 10,
    status: 'Pending',
    archived: false,
    assignedTo: ['user-2', 'user-3'],
    matterNo: '2024-010',
    clients: 'Richard Anderson',
    description: 'Patent Application - Medical Device',
    otherParties: '-',
    lastAccessed: '2024-03-05',
  },
  {
    id: 11,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1', 'user-2'],
    matterNo: '2024-011',
    clients: 'Blue Ocean Investments',
    description: 'Merger and Acquisition Due Diligence',
    otherParties: 'Coastal Ventures LLC',
    lastAccessed: '2024-03-04',
  },
  {
    id: 12,
    status: 'Closed',
    archived: true,
    assignedTo: ['user-3'],
    matterNo: '2024-012',
    clients: 'Lisa Martinez',
    description: 'Residential Lease Agreement',
    otherParties: 'Urban Properties Group',
    lastAccessed: '2024-03-03',
  },
  {
    id: 13,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1'],
    matterNo: '2024-013',
    clients: 'Thompson Family Trust',
    description: 'Trust Administration and Asset Transfer',
    otherParties: '-',
    lastAccessed: '2024-03-02',
  },
  {
    id: 14,
    status: 'Pending',
    archived: false,
    assignedTo: ['user-2'],
    matterNo: '2024-014',
    clients: "Kevin O'Brien",
    description: 'Construction Contract Negotiation',
    otherParties: 'BuildRight Contractors Inc.',
    lastAccessed: '2024-03-01',
  },
  {
    id: 15,
    status: 'Active',
    archived: false,
    assignedTo: ['user-3'],
    matterNo: '2024-015',
    clients: 'Sunrise Healthcare Ltd.',
    description: 'Corporate Compliance Review',
    otherParties: '-',
    lastAccessed: '2024-02-28',
  },
  {
    id: 16,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1', 'user-2'],
    matterNo: '2024-016',
    clients: 'Patricia Wong',
    description: 'Immigration Visa Application',
    otherParties: 'Department of Immigration',
    lastAccessed: '2024-02-27',
  },
  {
    id: 17,
    status: 'Closed',
    archived: true,
    assignedTo: ['user-2', 'user-3'],
    matterNo: '2024-017',
    clients: 'Riverside Development Corp.',
    description: 'Zoning Variance Application',
    otherParties: 'City Planning Commission',
    lastAccessed: '2024-02-26',
  },
  {
    id: 18,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1'],
    matterNo: '2024-018',
    clients: 'James Miller, Susan Miller',
    description: 'Child Custody Agreement',
    otherParties: '-',
    lastAccessed: '2024-02-25',
  },
  {
    id: 19,
    status: 'Pending',
    archived: false,
    assignedTo: ['user-3'],
    matterNo: '2024-019',
    clients: 'NextGen Software Inc.',
    description: 'Software Licensing Agreement',
    otherParties: 'Enterprise Solutions Group',
    lastAccessed: '2024-02-24',
  },
  {
    id: 20,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1', 'user-3'],
    matterNo: '2024-020',
    clients: 'Angela Rodriguez',
    description: 'Medical Malpractice Claim',
    otherParties: 'Metropolitan Hospital, Dr. Harrison',
    lastAccessed: '2024-02-23',
  },
  {
    id: 21,
    status: 'Active',
    archived: false,
    assignedTo: ['user-2'],
    matterNo: '2024-021',
    clients: 'Highland Manufacturing',
    description: 'Environmental Compliance Filing',
    otherParties: 'EPA Regional Office',
    lastAccessed: '2024-02-22',
  },
  {
    id: 22,
    status: 'Closed',
    archived: true,
    assignedTo: ['user-1', 'user-2'],
    matterNo: '2024-022',
    clients: 'Daniel Park',
    description: 'Bankruptcy Chapter 7 Filing',
    otherParties: '-',
    lastAccessed: '2024-02-21',
  },
  {
    id: 23,
    status: 'Active',
    archived: false,
    assignedTo: ['user-1'],
    matterNo: '2024-023',
    clients: 'Golden Years Retirement Fund',
    description: 'Securities Compliance Review',
    otherParties: '-',
    lastAccessed: '2024-02-20',
  },
]);

// Filter by user assignment and archived status
const visibleMatters = computed(() => {
  return mockMatters.value.filter((matter) => {
    // Filter by user assignment
    if (showMyMattersOnly.value && !matter.assignedTo.includes(currentUserId)) {
      return false;
    }

    // Filter by archived status
    if (!showArchivedMatters.value && matter.archived) {
      return false;
    }

    return true;
  });
});

// Filter by search text
const filteredMatters = computed(() => {
  if (!searchText.value) {
    return visibleMatters.value;
  }

  const search = caseSensitive.value ? searchText.value : searchText.value.toLowerCase();

  return visibleMatters.value.filter((matter) => {
    const fields = [matter.matterNo, matter.clients, matter.description, matter.otherParties].join(
      ' '
    );

    const content = caseSensitive.value ? fields : fields.toLowerCase();

    if (wholeWord.value) {
      const regex = new RegExp(`\\b${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return regex.test(content);
    }

    return content.includes(search);
  });
});
</script>

<style scoped>
/* Matters component styles */
</style>
