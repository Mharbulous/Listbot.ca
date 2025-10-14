<template>
  <div class="organizer-container">
    <OrganizerHeader
      v-model:search-text="searchText"
      :evidence-count="evidenceCount"
      :filtered-count="filteredCount"
      @search="organizerStore.setFilter($event || '')"
      @manage-categories="router.push('/organizer/categories')"
      @view-mode-changed="viewMode = $event.mode"
    />

    <OrganizerStates
      :loading="loading"
      :is-initialized="isInitialized"
      :error="error"
      :evidence-count="evidenceCount"
      :filtered-count="filteredCount"
      @retry="organizerStore.loadEvidence()"
      @clear-search="clearSearch"
    />

    <FileListDisplay
      v-if="showFileList"
      :key="refreshKey"
      v-model:view-mode="viewMode"
      :filtered-evidence="filteredEvidence"
      :getEvidenceTags="organizerStore.getAllTags"
      :getTagUpdateLoading="(id) => tagUpdateLoading.has(id)"
      :getAIProcessing="(id) => aiProcessing.has(id)"
      @process-with-ai="processWithAI"
      @manage-categories="router.push('/organizer/categories')"
    />

    <v-overlay v-model="showUpdateOverlay" class="d-flex align-center justify-center" contained>
      <v-progress-circular indeterminate size="48" />
      <p class="ml-4">Updating tags...</p>
    </v-overlay>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="snackbar.timeout">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useOrganizerStore } from '../stores/organizer.js';
import { AITagService } from '../services/aiTagService.js';
import OrganizerHeader from '../components/OrganizerHeader.vue';
import OrganizerStates from '../components/OrganizerStates.vue';
import FileListDisplay from '../components/FileListDisplay.vue';

defineOptions({ name: 'OrganizerView' });

const organizerStore = useOrganizerStore();
const router = useRouter();
const aiTagService = new AITagService();

// State
const searchText = ref('');
const viewMode = ref('list');
const showUpdateOverlay = ref(false);
const tagUpdateLoading = ref(new Set());
const aiProcessing = ref(new Set());
const refreshKey = ref(0);
const unsubscribe = ref(null);
const snackbar = ref({ show: false, message: '', color: 'success', timeout: 4000 });

// Reactive store properties
const { filteredEvidence, loading, error, evidenceCount, filteredCount, isInitialized } =
  storeToRefs(organizerStore);

// Show file list when ready
const showFileList = computed(
  () => !loading.value && !error.value && isInitialized.value && filteredCount.value > 0
);

// Clear search and filters
const clearSearch = () => {
  searchText.value = '';
  organizerStore.clearFilters();
};

// AI error messages mapping
const getAIErrorMessage = (error) => {
  if (error.message.includes('File size')) return 'File too large for AI processing (max 20MB)';
  if (error.message.includes('categories'))
    return 'Please create categories before using AI tagging';
  if (error.message.includes('not found')) return 'Document not found';
  return 'AI processing failed';
};

// Process document with AI
const processWithAI = async (evidence) => {
  if (!aiTagService.isAIEnabled()) {
    showNotification('AI features are not enabled', 'warning');
    return;
  }

  try {
    aiProcessing.value.add(evidence.id);
    showNotification('Processing document with AI...', 'info', 2000);

    const result = await aiTagService.processSingleDocument(evidence.id);

    if (result.success) {
      const tagCount = result.suggestedTags.length;
      const message =
        tagCount > 0
          ? `AI processing complete! ${tagCount} tags applied.`
          : 'AI processing complete, but no tags were suggested.';
      showNotification(message, tagCount > 0 ? 'success' : 'info');
      await organizerStore.refreshEvidenceTags(evidence.id);
    } else {
      throw new Error(result.error || 'AI processing failed');
    }
  } catch (error) {
    console.error('AI processing failed:', error);
    showNotification(getAIErrorMessage(error), 'error');
  } finally {
    aiProcessing.value.delete(evidence.id);
  }
};

// Show notification
const showNotification = (message, color = 'success', timeout = 4000) => {
  snackbar.value = { show: true, message, color, timeout };
};

// Initialize on mount
onMounted(async () => {
  try {
    const { evidenceUnsubscribe } = await organizerStore.initialize();
    unsubscribe.value = evidenceUnsubscribe;

    const urlSearchQuery = router.currentRoute.value.query.search;
    if (urlSearchQuery) {
      searchText.value = urlSearchQuery;
      organizerStore.setFilter(urlSearchQuery);
    }
  } catch (error) {
    console.error('Failed to initialize organizer:', error);
    showNotification('Failed to load documents', 'error');
  }
});

// Cleanup on unmount
onBeforeUnmount(() => {
  if (unsubscribe.value) unsubscribe.value();
  organizerStore.reset();
});
</script>

<style scoped>
.organizer-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
