<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <PageLayout>
      <TitleDrawer title="Pleadings" :bottomPadding="'0'">
          <button
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
            class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
      </TitleDrawer>

      <ProceedingsTabs
        v-model="selectedProceeding"
        :proceedings="mockProceedings"
      />

      <PleadingsTable
        :pleadings="filteredPleadings"
        @show-version-history="handleShowVersionHistory"
        @open-action-menu="handleOpenActionMenu"
      />
    </PageLayout>

    <VersionHistoryModal
      v-model="showVersionModal"
      :version-history="mockVersionHistory"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ProceedingsTabs from '../components/ProceedingsTabs.vue';
import PleadingsTable from '../components/PleadingsTable.vue';
import VersionHistoryModal from '../components/VersionHistoryModal.vue';
import { mockProceedings, mockPleadings, mockVersionHistory } from '../data/pleadingsMockData.js';
import PageLayout from '@/shared/components/layout/PageLayout.vue';
import TitleDrawer from '@/shared/components/layout/TitleDrawer.vue';

const selectedProceeding = ref(null);
const showVersionModal = ref(false);

const filteredPleadings = computed(() => {
  if (!selectedProceeding.value) {
    return mockPleadings;
  }
  return mockPleadings.filter(p => p.proceeding.id === selectedProceeding.value);
});

function handleShowVersionHistory(pleading) {
  showVersionModal.value = true;
}

function handleOpenActionMenu(pleading) {
  console.log('Open action menu for:', pleading);
}
</script>
