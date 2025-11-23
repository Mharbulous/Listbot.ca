<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <PageLayout>
      <TitleDrawer title="Characters (Cast)">
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            New Character
          </button>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Characters
          </button>
      </TitleDrawer>

      <!-- Filter/Search Bar -->
      <div class="mx-6 mb-4 flex gap-4">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name, organization, or role..."
            class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          v-model="selectedRole"
          class="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Roles</option>
          <option v-for="role in roleTypes" :key="role" :value="role">{{ role }}</option>
        </select>
        <select
          v-model="selectedStatus"
          class="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option v-for="status in statusTypes" :key="status" :value="status">{{ status }}</option>
        </select>
      </div>

      <CharactersTable
        :characters="filteredCharacters"
        @open-action-menu="handleOpenActionMenu"
      />
    </PageLayout>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import CharactersTable from '../components/CharactersTable.vue';
import { mockCharacters, roleTypes, statusTypes } from '../data/castMockData.js';
import PageLayout from '@/shared/components/layout/PageLayout.vue';
import TitleDrawer from '@/shared/components/layout/TitleDrawer.vue';

const searchQuery = ref('');
const selectedRole = ref('');
const selectedStatus = ref('');

const filteredCharacters = computed(() => {
  let result = mockCharacters;

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      character =>
        character.name.toLowerCase().includes(query) ||
        character.organization.toLowerCase().includes(query) ||
        character.role.toLowerCase().includes(query) ||
        character.type.toLowerCase().includes(query)
    );
  }

  // Filter by role
  if (selectedRole.value) {
    result = result.filter(character => character.role === selectedRole.value);
  }

  // Filter by status
  if (selectedStatus.value) {
    result = result.filter(character => character.status === selectedStatus.value);
  }

  return result;
});

function handleOpenActionMenu(character) {
  console.log('Open action menu for:', character);
}
</script>
