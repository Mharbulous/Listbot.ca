<template>
  <div class="table-container bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden min-w-[720px]">
    <table class="w-full min-w-[720px]">
      <thead class="sticky-table-header border-b border-slate-200 min-w-[720px]">
        <tr>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Name
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Role
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Type
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Organization
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Status
          </th>
          <th class="px-2 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            Relevance
          </th>
          <th class="px-2 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-slate-200">
        <tr
          v-for="character in characters"
          :key="character.id"
          class="hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <td class="px-2 py-1">
            <div class="text-sm font-medium text-slate-900">{{ character.name }}</div>
            <div class="text-xs text-slate-500">{{ character.jobTitle }}</div>
            <div v-if="character.tags && character.tags.length > 0" class="flex gap-1 mt-1 flex-wrap">
              <span
                v-for="tag in character.tags"
                :key="tag"
                class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
              >
                {{ tag }}
              </span>
            </div>
          </td>
          <td class="px-2 py-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-red-100 text-red-800': character.role === 'Defendant',
                'bg-blue-100 text-blue-800': character.role === 'Plaintiff',
                'bg-purple-100 text-purple-800': character.role === 'Expert Witness',
                'bg-slate-100 text-slate-800': character.role === 'Witness' || character.role === 'Third Party',
              }"
            >
              {{ character.role }}
            </span>
          </td>
          <td class="px-2 py-1">
            <span class="text-sm text-slate-900">{{ character.type }}</span>
          </td>
          <td class="px-2 py-1">
            <div class="text-sm text-slate-900">{{ character.organization }}</div>
          </td>
          <td class="px-2 py-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800': character.status === 'Deposed',
                'bg-yellow-100 text-yellow-800': character.status === 'Subpoenaed' || character.status === 'Contacted',
                'bg-indigo-100 text-indigo-800': character.status === 'Retained',
                'bg-slate-100 text-slate-600': character.status === 'Identified' || character.status === 'Not Deposed',
                'bg-red-100 text-red-800': character.status === 'Unavailable',
              }"
            >
              {{ character.status }}
            </span>
            <div v-if="character.depositionDate" class="text-xs text-slate-500 mt-1">
              Depo: {{ formatDate(character.depositionDate) }}
            </div>
          </td>
          <td class="px-2 py-1">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="{
                'bg-red-100 text-red-800': character.relevance === 'high',
                'bg-yellow-100 text-yellow-800': character.relevance === 'medium',
                'bg-slate-100 text-slate-600': character.relevance === 'low',
              }"
            >
              {{ character.relevance }}
            </span>
          </td>
          <td class="px-2 py-1 text-right">
            <button
              class="text-slate-400 hover:text-slate-600 transition-colors"
              @click.stop="handleActionMenu(character)"
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
      v-if="characters.length === 0"
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
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      <p class="text-lg font-medium mb-2">No characters found</p>
      <p class="text-sm">Add your first character to get started</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  characters: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['open-action-menu']);

function handleActionMenu(character) {
  emit('open-action-menu', character);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.table-container {
  position: relative;
  z-index: 25;
}
</style>
