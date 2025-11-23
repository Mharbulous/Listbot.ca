<template>
  <div class="table-container bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden">
    <table class="w-full min-w-[720px]">
      <thead class="table-header border-b border-slate-200 sticky top-0 min-w-[720px]" style="background-color: #e0f2fe;">
        <tr>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Document Name
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Version
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Filing Date
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Filing Party
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Proceeding
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Expires
          </th>
          <th class="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-slate-200">
        <tr
          v-for="pleading in pleadings"
          :key="pleading.id"
          class="hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <td class="px-2 py-1">
            <div class="text-sm font-medium text-slate-900">{{ pleading.documentName }}</div>
          </td>
          <td class="px-2 py-1">
            <div class="flex items-center gap-2">
              <span class="text-sm text-slate-900">{{ pleading.version }}</span>
              <button
                v-if="pleading.hasAmendments"
                class="text-xs text-purple-600 hover:text-purple-700 font-medium"
                @click.stop="handleVersionHistory(pleading)"
              >
                View History
              </button>
            </div>
          </td>
          <td class="px-2 py-1 text-sm text-slate-900">
            {{ pleading.filedDate }}
          </td>
          <td class="px-2 py-1">
            <div class="text-sm">
              <div class="font-medium text-slate-900">{{ pleading.partyName }}</div>
              <div class="text-xs text-slate-500">{{ pleading.partyRole }}</div>
            </div>
          </td>
          <td class="px-2 py-1">
            <div class="text-sm">
              <div class="font-medium text-slate-900">{{ pleading.proceeding.venue }}</div>
              <div class="text-xs text-slate-500">{{ pleading.proceeding.courtFileNo }}</div>
            </div>
          </td>
          <td class="px-2 py-1 text-sm text-slate-600">
            {{ pleading.expires || '—' }}
          </td>
          <td class="px-2 py-1 text-right">
            <button
              class="text-slate-400 hover:text-slate-600 transition-colors"
              @click.stop="handleActionMenu(pleading)"
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
      v-if="pleadings.length === 0"
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
</template>

<script setup>
const props = defineProps({
  pleadings: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['show-version-history', 'open-action-menu']);

function handleVersionHistory(pleading) {
  emit('show-version-history', pleading);
}

function handleActionMenu(pleading) {
  emit('open-action-menu', pleading);
}
</script>

<style scoped>
.table-container {
  position: relative;
  z-index: 25;
}

.table-header {
  border-top-right-radius: 12px;
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}
</style>
