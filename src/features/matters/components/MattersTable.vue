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
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Client(s)
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Matter No.
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Description
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Adverse Parties
            </th>
            <th
              class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
            >
              Documents
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
            v-for="(matter, index) in matters"
            :key="matter.id"
            :class="[
              'cursor-pointer transition-colors',
              isSelected(matter)
                ? '!bg-blue-700 border-l-4 border-l-blue-700'
                : [
                    'hover:!bg-slate-200',
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                  ],
            ]"
            @click="$emit('select-matter', matter)"
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

defineEmits(['select-matter', 'retry-fetch']);

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
</style>
