<template>
  <div class="flex flex-col h-full">
    <!-- Tabs -->
    <div class="bg-white border-b border-slate-200 mx-6">
      <div class="flex space-x-1 px-2 pt-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-2 text-sm font-medium rounded-t-lg transition-colors"
          :class="activeTab === tab.id
            ? 'bg-white text-teal-600 border-t border-l border-r border-slate-200'
            : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'"
        >
          {{ tab.label }}
          <span
            v-if="tab.count"
            class="ml-2 px-2 py-0.5 text-xs rounded-full"
            :class="activeTab === tab.id
              ? 'bg-teal-100 text-teal-700'
              : 'bg-slate-100 text-slate-600'"
          >
            {{ tab.count }}
          </span>
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="table-container bg-white border border-slate-200 mx-6 mb-6 rounded-b-lg border-t-0 shadow-sm overflow-hidden min-w-[720px]">
      <!-- Issues Tab -->
      <table v-if="activeTab === 'issues'" class="w-full min-w-[720px]">
        <thead class="sticky-table-header border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Legal Issue
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Linked Items
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr
            v-for="issue in issues"
            :key="issue.id"
            class="hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-slate-900">{{ issue.title }}</div>
              <div class="text-xs text-slate-500 mt-1">{{ issue.description }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-900">{{ issue.category }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': issue.status === 'Resolved',
                  'bg-blue-100 text-blue-800': issue.status === 'Active',
                  'bg-yellow-100 text-yellow-800': issue.status === 'Pending',
                }"
              >
                {{ issue.status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-3 text-sm text-slate-600">
                <span>{{ issue.linkedFacts }} facts</span>
                <span>{{ issue.linkedAuthorities }} authorities</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-slate-400 hover:text-slate-600 transition-colors"
                @click.stop="handleAction(issue)"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Authorities Tab -->
      <table v-if="activeTab === 'authorities'" class="w-full min-w-[720px]">
        <thead class="sticky-table-header border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Citation
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Type
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Key Holding
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Last Noted Up
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr
            v-for="authority in authorities"
            :key="authority.id"
            class="hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-slate-900">{{ authority.citation }}</div>
              <div class="text-xs text-slate-500 mt-1">{{ authority.jurisdiction }} ({{ authority.year }})</div>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-purple-100 text-purple-800': authority.type === 'Case Law',
                  'bg-blue-100 text-blue-800': authority.type === 'Statute',
                  'bg-teal-100 text-teal-800': authority.type === 'Regulation',
                }"
              >
                {{ authority.type }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-slate-900">{{ authority.keyHolding }}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-slate-900">{{ authority.lastNotedUp }}</div>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1"
                :class="{
                  'bg-green-100 text-green-800': authority.notationStatus === 'Current',
                  'bg-yellow-100 text-yellow-800': authority.notationStatus === 'Needs Update',
                  'bg-red-100 text-red-800': authority.notationStatus === 'Outdated',
                }"
              >
                {{ authority.notationStatus }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-slate-400 hover:text-slate-600 transition-colors"
                @click.stop="handleAction(authority)"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Memos Tab -->
      <table v-if="activeTab === 'memos'" class="w-full min-w-[720px]">
        <thead class="sticky-table-header border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Memo Title
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Issue
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Last Modified
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Links
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr
            v-for="memo in memos"
            :key="memo.id"
            class="hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <td class="px-4 py-3">
              <div class="text-sm font-medium text-slate-900">{{ memo.title }}</div>
              <div class="text-xs text-slate-500 mt-1">{{ memo.wordCount }} words</div>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-900">{{ memo.issue }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': memo.status === 'Final',
                  'bg-yellow-100 text-yellow-800': memo.status === 'Draft',
                  'bg-blue-100 text-blue-800': memo.status === 'In Review',
                }"
              >
                {{ memo.status }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-900">
              {{ memo.lastModified }}
            </td>
            <td class="px-4 py-3">
              <div class="flex gap-3 text-sm text-slate-600">
                <span>{{ memo.linkedAuthorities }} authorities</span>
                <span>{{ memo.linkedFacts }} facts</span>
              </div>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-slate-400 hover:text-slate-600 transition-colors"
                @click.stop="handleAction(memo)"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Fact Connections Tab -->
      <table v-if="activeTab === 'connections'" class="w-full min-w-[720px]">
        <thead class="sticky-table-header border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Fact Statement
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Linked Issue
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Authority
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Relevance
            </th>
            <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              Confidence
            </th>
            <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          <tr
            v-for="connection in factConnections"
            :key="connection.id"
            class="hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <td class="px-4 py-3">
              <div class="text-sm text-slate-900">{{ connection.factStatement }}</div>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-900">{{ connection.linkedIssue }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-900">{{ connection.linkedAuthority }}</span>
            </td>
            <td class="px-4 py-3">
              <span class="text-sm text-slate-600">{{ connection.relevance }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800': connection.confidence === 'High',
                  'bg-yellow-100 text-yellow-800': connection.confidence === 'Medium',
                  'bg-red-100 text-red-800': connection.confidence === 'Low',
                }"
              >
                {{ connection.confidence }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-slate-400 hover:text-slate-600 transition-colors"
                @click.stop="handleAction(connection)"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty State -->
      <div
        v-if="currentTabData.length === 0"
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
        <p class="text-lg font-medium mb-2">No {{ currentTabLabel }} found</p>
        <p class="text-sm">Add your first {{ currentTabLabel.toLowerCase() }} to get started</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  issues: {
    type: Array,
    required: true,
  },
  authorities: {
    type: Array,
    required: true,
  },
  memos: {
    type: Array,
    required: true,
  },
  factConnections: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['open-action-menu']);

const activeTab = ref('issues');

const tabs = computed(() => [
  { id: 'issues', label: 'Legal Issues', count: props.issues.length },
  { id: 'authorities', label: 'Authority List', count: props.authorities.length },
  { id: 'memos', label: 'Memo Library', count: props.memos.length },
  { id: 'connections', label: 'Fact Finder', count: props.factConnections.length },
]);

const currentTabData = computed(() => {
  switch (activeTab.value) {
    case 'issues':
      return props.issues;
    case 'authorities':
      return props.authorities;
    case 'memos':
      return props.memos;
    case 'connections':
      return props.factConnections;
    default:
      return [];
  }
});

const currentTabLabel = computed(() => {
  const tab = tabs.value.find(t => t.id === activeTab.value);
  return tab ? tab.label : '';
});

function handleAction(item) {
  emit('open-action-menu', { tab: activeTab.value, item });
}
</script>

<style scoped>
.table-container {
  position: relative;
  z-index: 25;
}

.sticky-table-header {
  position: sticky;
  top: 0;
  background-color: #f8fafc;
  z-index: 10;
}
</style>
