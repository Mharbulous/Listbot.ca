<template>
  <div class="table-content">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center h-64 bg-white border border-slate-200 m-6 rounded-lg shadow-sm"
    >
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
        ></div>
        <p class="text-slate-600">Loading matters...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 m-6 rounded-lg shadow-sm p-6">
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
          <h3 class="text-red-900 font-medium">Error loading matters</h3>
          <p class="text-red-700 text-sm">{{ error }}</p>
        </div>
      </div>
      <button
        @click="$emit('retry-fetch')"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
      >
        Try Again
      </button>
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white border border-slate-200 m-6 rounded-lg shadow-sm overflow-hidden">
      <!-- Empty State -->
      <div
        v-if="matters.length === 0"
        class="flex flex-col items-center justify-center h-64 text-slate-500"
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
        <p class="text-lg font-medium mb-2">No matters found</p>
        <p class="text-sm">
          {{ emptyStateMessage }}
        </p>
      </div>

      <!-- Table with Data -->
      <table v-else class="w-full">
        <thead class="sticky-table-header">
          <tr>
            <th
              class="header-cell"
              :class="{
                'sorted-asc': isSorted('matterNumber') && getSortInfo('matterNumber')?.direction === 'asc',
                'sorted-desc': isSorted('matterNumber') && getSortInfo('matterNumber')?.direction === 'desc',
              }"
              @click="toggleSort('matterNumber')"
              :title="`Click to sort by Matter No.${isSorted('matterNumber') ? ' (sorted)' : ''}`"
            >
              <!-- Sort Indicator -->
              <span class="sort-indicator" v-if="isSorted('matterNumber')">
                <span class="sort-arrow">{{ getSortInfo('matterNumber')?.direction === 'asc' ? '↑' : '↓' }}</span>
                <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo('matterNumber')?.priority }}</span>
              </span>
              <span class="header-label">Matter No.</span>
            </th>
            <th
              class="header-cell"
              :class="{
                'sorted-asc': isSorted('clients') && getSortInfo('clients')?.direction === 'asc',
                'sorted-desc': isSorted('clients') && getSortInfo('clients')?.direction === 'desc',
              }"
              @click="toggleSort('clients')"
              :title="`Click to sort by Client(s)${isSorted('clients') ? ' (sorted)' : ''}`"
            >
              <!-- Sort Indicator -->
              <span class="sort-indicator" v-if="isSorted('clients')">
                <span class="sort-arrow">{{ getSortInfo('clients')?.direction === 'asc' ? '↑' : '↓' }}</span>
                <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo('clients')?.priority }}</span>
              </span>
              <span class="header-label">Client(s)</span>
            </th>
            <th
              class="header-cell"
              :class="{
                'sorted-asc': isSorted('description') && getSortInfo('description')?.direction === 'asc',
                'sorted-desc': isSorted('description') && getSortInfo('description')?.direction === 'desc',
              }"
              @click="toggleSort('description')"
              :title="`Click to sort by Description${isSorted('description') ? ' (sorted)' : ''}`"
            >
              <!-- Sort Indicator -->
              <span class="sort-indicator" v-if="isSorted('description')">
                <span class="sort-arrow">{{ getSortInfo('description')?.direction === 'asc' ? '↑' : '↓' }}</span>
                <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo('description')?.priority }}</span>
              </span>
              <span class="header-label">Description</span>
            </th>
            <th
              class="header-cell"
              :class="{
                'sorted-asc': isSorted('adverseParties') && getSortInfo('adverseParties')?.direction === 'asc',
                'sorted-desc': isSorted('adverseParties') && getSortInfo('adverseParties')?.direction === 'desc',
              }"
              @click="toggleSort('adverseParties')"
              :title="`Click to sort by Adverse Parties${isSorted('adverseParties') ? ' (sorted)' : ''}`"
            >
              <!-- Sort Indicator -->
              <span class="sort-indicator" v-if="isSorted('adverseParties')">
                <span class="sort-arrow">{{ getSortInfo('adverseParties')?.direction === 'asc' ? '↑' : '↓' }}</span>
                <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo('adverseParties')?.priority }}</span>
              </span>
              <span class="header-label">Adverse Parties</span>
            </th>
            <th
              class="header-cell"
              :class="{
                'sorted-asc': isSorted('documents') && getSortInfo('documents')?.direction === 'asc',
                'sorted-desc': isSorted('documents') && getSortInfo('documents')?.direction === 'desc',
              }"
              @click="toggleSort('documents')"
              :title="`Click to sort by Documents${isSorted('documents') ? ' (sorted)' : ''}`"
            >
              <!-- Sort Indicator -->
              <span class="sort-indicator" v-if="isSorted('documents')">
                <span class="sort-arrow">{{ getSortInfo('documents')?.direction === 'asc' ? '↑' : '↓' }}</span>
                <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo('documents')?.priority }}</span>
              </span>
              <span class="header-label">Documents</span>
            </th>
            <th
              class="header-cell"
              :class="{
                'sorted-asc': isSorted('lastAccessed') && getSortInfo('lastAccessed')?.direction === 'asc',
                'sorted-desc': isSorted('lastAccessed') && getSortInfo('lastAccessed')?.direction === 'desc',
              }"
              @click="toggleSort('lastAccessed')"
              :title="`Click to sort by Last Accessed${isSorted('lastAccessed') ? ' (sorted)' : ''}`"
            >
              <!-- Sort Indicator -->
              <span class="sort-indicator" v-if="isSorted('lastAccessed')">
                <span class="sort-arrow">{{ getSortInfo('lastAccessed')?.direction === 'asc' ? '↑' : '↓' }}</span>
                <span class="sort-priority" v-if="sortColumns.length > 1">{{ getSortInfo('lastAccessed')?.priority }}</span>
              </span>
              <span class="header-label">Last Accessed</span>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr
            v-for="(matter, index) in sortedMatters"
            :key="matter.id"
            :class="[
              'cursor-pointer transition-colors',
              isSelected(matter)
                ? '!bg-blue-700'
                : [
                    'hover:!bg-slate-200',
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  ],
            ]"
            @click="handleSingleClick(matter)"
            @dblclick="handleDoubleClick(matter)"
          >
            <td
              class="px-6 py-4 text-sm"
              :class="isSelected(matter) ? 'text-white' : 'text-slate-900'"
            >
              {{ Array.isArray(matter.clients) ? matter.clients.join(', ') : matter.clients }}
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm font-medium"
              :class="isSelected(matter) ? 'text-white' : 'text-slate-900'"
            >
              <div class="flex items-center gap-2">
                {{ matter.matterNumber }}
                <span
                  v-if="matter.archived"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="
                    isSelected(matter)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  "
                >
                  Archived
                </span>
              </div>
            </td>
            <td
              class="px-6 py-4 text-sm"
              :class="isSelected(matter) ? 'text-white' : 'text-slate-700'"
            >
              {{ matter.description }}
            </td>
            <td
              class="px-6 py-4 text-sm"
              :class="isSelected(matter) ? 'text-white' : 'text-slate-700'"
            >
              {{
                Array.isArray(matter.adverseParties)
                  ? matter.adverseParties.join(', ')
                  : matter.adverseParties
              }}
            </td>
            <td
              class="px-6 py-4 text-sm text-center"
              :class="isSelected(matter) ? 'text-white' : 'text-slate-900'"
            >
              <span v-if="documentCounts[matter.id] !== undefined" class="font-medium">
                {{ documentCounts[matter.id] }}
              </span>
              <span v-else :class="isSelected(matter) ? 'text-white' : 'text-slate-400'">
                <div
                  class="animate-spin rounded-full h-4 w-4 border-b-2 mx-auto"
                  :class="isSelected(matter) ? 'border-white' : 'border-slate-400'"
                ></div>
              </span>
            </td>
            <td
              class="px-6 py-4 whitespace-nowrap text-sm"
              :class="isSelected(matter) ? 'text-white' : 'text-slate-500'"
            >
              {{ formatDate(matter.lastAccessed) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useMattersSort } from '../composables/useMattersSort.js';

defineOptions({
  name: 'MattersTable',
});

const props = defineProps({
  matters: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
  documentCounts: {
    type: Object,
    required: true,
  },
  selectedMatterId: {
    type: String,
    default: null,
  },
  emptyStateMessage: {
    type: String,
    default: 'Create your first matter to get started',
  },
});

const emit = defineEmits(['select-matter', 'navigate-matter', 'retry-fetch']);

// Compute enriched matters with document counts for sorting
const enrichedMatters = computed(() => {
  return props.matters.map((matter) => ({
    ...matter,
    documents: props.documentCounts[matter.id] || 0,
  }));
});

// Use sorting composable
const {
  sortedData: sortedMatters,
  toggleSort,
  isSorted,
  getSortInfo,
  sortColumns,
} = useMattersSort(enrichedMatters);

/**
 * Handle single click - select matter without navigation
 */
function handleSingleClick(matter) {
  emit('select-matter', matter);
}

/**
 * Handle double click - navigate to documents
 */
function handleDoubleClick(matter) {
  emit('navigate-matter', matter);
}

/**
 * Check if a matter is currently selected
 */
function isSelected(matter) {
  return props.selectedMatterId === matter.id;
}

/**
 * Format Firestore Timestamp to date string
 */
function formatDate(timestamp) {
  if (!timestamp) return '';

  // Handle Firestore Timestamp
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString().split('T')[0];
  }

  // Handle JavaScript Date
  if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0];
  }

  // Handle date string
  return timestamp;
}
</script>

<style scoped>
.table-content {
  position: relative;
  z-index: 1;
}

/* ===================================
   Sortable Column Header Styles
   =================================== */

/* Sticky header row styles */
thead.sticky-table-header {
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Header cell base styles */
.header-cell {
  padding: 12px 24px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  cursor: pointer;
  user-select: none;
  position: relative;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  color: #374151;
  transition: background 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

/* Hover state for entire header cell - show faint sort indicator */
.header-cell:hover {
  background: #eff1fd;
}

.header-cell:hover .header-label::before {
  content: '⇅';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: normal;
  color: #667eea;
  line-height: 1;
}

/* Hide hover indicator when column is actively sorted */
.header-cell.sorted-asc:hover .header-label::before,
.header-cell.sorted-desc:hover .header-label::before {
  content: none;
}

/* Sorted Ascending - Convex Appearance (entire cell) */
.header-cell.sorted-asc {
  background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
  box-shadow:
    inset 0 1px 2px rgba(255, 255, 255, 0.8),  /* Top highlight */
    inset 0 -1px 2px rgba(0, 0, 0, 0.1),       /* Bottom shadow */
    0 1px 3px rgba(102, 126, 234, 0.15);       /* Outer glow */
}

.header-cell.sorted-asc .header-label {
  color: #667eea;
  font-weight: 700;
}

.header-cell.sorted-asc .sort-indicator {
  color: #667eea;
}

/* Sorted Descending - Concave Appearance (entire cell) */
.header-cell.sorted-desc {
  background: linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%);
  box-shadow:
    inset 0 -1px 2px rgba(255, 255, 255, 0.8), /* Bottom highlight */
    inset 0 1px 2px rgba(0, 0, 0, 0.1),        /* Top shadow */
    0 1px 3px rgba(102, 126, 234, 0.15);       /* Outer glow */
}

.header-cell.sorted-desc .header-label {
  color: #667eea;
  font-weight: 700;
}

.header-cell.sorted-desc .sort-indicator {
  color: #667eea;
}

/* Header label styling - centered to avoid overlap with sort indicator */
.header-label {
  position: relative;
  padding-left: 0;
  display: inline-block;
  width: 100%;
  text-align: center;
}

/* Sort Indicator (Arrow + Priority) - positioned in left padding, vertically centered */
.sort-indicator {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  display: flex;
  align-items: center;
  gap: 2px;
}

/* Sort arrow within indicator */
.sort-arrow {
  display: inline-block;
}

/* Sort priority number (shown when multiple columns sorted) */
.sort-priority {
  display: inline-block;
  font-size: 8px;
  font-weight: 600;
  color: #667eea;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 3px;
  padding: 1px 3px;
  line-height: 1.2;
  min-width: 12px;
  text-align: center;
}
</style>
