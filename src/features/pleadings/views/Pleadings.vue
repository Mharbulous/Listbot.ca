<template>
  <div class="h-full flex flex-col bg-viewport-bg">
    <div class="scroll-container">
      <div class="gradient-background"></div>

      <div class="title-drawer">
        <h1 class="title-drawer-text">Pleadings</h1>
        <div class="flex gap-3">
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
            New Proceeding
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
            Upload Pleading
          </button>
        </div>
      </div>

      <ProceedingsTabs
        v-model="selectedProceeding"
        :proceedings="mockProceedings"
      />

      <PleadingsTable
        :pleadings="filteredPleadings"
        @show-version-history="handleShowVersionHistory"
        @open-action-menu="handleOpenActionMenu"
      />
    </div>

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

<style scoped>
.scroll-container {
  flex: 1;
  overflow: auto;
  position: relative;
  min-width: 0;
}

.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 800px;
  background: linear-gradient(179deg, #B2EBF2 0%, #FCFCF5 30%, #FCFCF5 100%);
  z-index: 0;
  pointer-events: none;
}

.title-drawer {
  padding: 20px 24px 0 24px;
  min-width: max-content;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 1;
  background: transparent;
  color: #455A64;
}

.title-drawer-text {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: inherit;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
</style>
