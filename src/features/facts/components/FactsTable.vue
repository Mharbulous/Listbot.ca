<template>
  <div class="table-container bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden min-w-[720px]">
    <table class="w-full min-w-[720px]">
      <thead class="sticky-table-header border-b border-slate-200 min-w-[720px]">
        <tr>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Fact Statement
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Category
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Source Document
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-[110px] min-w-[110px]">
            Date Occurred
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Status
          </th>
          <th class="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-slate-200">
        <tr
          v-for="fact in facts"
          :key="fact.id"
          class="hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <td class="px-2 py-1">
            <div class="text-sm font-medium text-slate-900">{{ fact.statement }}</div>
            <div v-if="fact.tags && fact.tags.length > 0" class="flex gap-1 mt-1">
              <span
                v-for="tag in fact.tags"
                :key="tag"
                class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
              >
                {{ tag }}
              </span>
            </div>
          </td>
          <td class="px-2 py-1">
            <span class="text-sm text-slate-900">{{ fact.category }}</span>
          </td>
          <td class="px-2 py-1">
            <div class="text-sm text-slate-900">{{ fact.sourceDocument }}</div>
          </td>
          <td class="px-2 py-1 text-sm text-slate-900 w-[110px] min-w-[110px] whitespace-nowrap">
            {{ fact.dateOccurred }}
          </td>
          <td class="px-2 py-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800': fact.verifiedStatus === 'Verified',
                'bg-yellow-100 text-yellow-800': fact.verifiedStatus === 'Pending',
                'bg-red-100 text-red-800': fact.verifiedStatus === 'Disputed',
              }"
            >
              {{ fact.verifiedStatus }}
            </span>
          </td>
          <td class="px-2 py-1 text-right">
            <button
              class="text-slate-400 hover:text-slate-600 transition-colors"
              @click.stop="handleActionMenu(fact)"
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
      v-if="facts.length === 0"
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
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
        />
      </svg>
      <p class="text-lg font-medium mb-2">No facts found</p>
      <p class="text-sm">Add your first fact to get started</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  facts: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['open-action-menu']);

function handleActionMenu(fact) {
  emit('open-action-menu', fact);
}
</script>

<style scoped>
.table-container {
  position: relative;
  z-index: 25;
}
</style>
