<template>
  <div class="file-list-container">
    <!-- File display with 2 view modes -->
    <div class="file-display">
      <!-- List view -->
      <div v-if="props.viewMode === 'list'" class="file-list">
        <template v-for="(evidence, index) in props.filteredEvidence" :key="evidence.id">
          <!-- Simple placeholder when not loaded -->
          <div
            v-if="!isItemLoaded(index)"
            class="document-placeholder"
            :style="{ height: '120px' }"
            :data-index="index"
          >
            <!-- Simple loading skeleton -->
            <div class="skeleton-content"></div>
          </div>

          <!-- Actual FileListItem when loaded -->
          <FileListItem
            v-else
            :evidence="evidence"
            :allow-manual-editing="false"
            :tagUpdateLoading="props.getTagUpdateLoading(evidence.id)"
            :aiProcessing="props.getAIProcessing(evidence.id)"
            :get-evidence-tags="props.getEvidenceTags"
            @process-with-ai="$emit('process-with-ai', $event)"
            @metadata-changed="handleMetadataChanged"
          />
        </template>
      </div>

      <!-- Tree view placeholder -->
      <div v-else-if="props.viewMode === 'tree'" class="file-tree">
        <p class="text-body-2 text-center text-medium-emphasis pa-8">
          <v-icon size="48" class="mb-2 d-block">mdi-file-tree</v-icon>
          Folder Tree coming in future updates
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import FileListItem from './FileListItem.vue';
import { useLazyDocuments } from '@/composables/useLazyDocuments.js';
import { useOrganizerStore } from '../stores/organizer.js';

// Get store instance
const organizerStore = useOrganizerStore();

// Props
const props = defineProps({
  filteredEvidence: {
    type: Array,
    default: () => [],
  },
  viewMode: {
    type: String,
    default: 'list',
  },
  getEvidenceTags: {
    type: Function,
    required: true,
  },
  getTagUpdateLoading: {
    type: Function,
    required: true,
  },
  getAIProcessing: {
    type: Function,
    required: true,
  },
});

// Add lazy loading composable
const { isItemLoaded, loadItem, preloadInitialItems } = useLazyDocuments(
  computed(() => props.filteredEvidence),
  { initialCount: 10 }
);

// Intersection Observer for lazy loading
let observer = null;

// Emits
const emit = defineEmits(['process-with-ai']);

/**
 * Handle metadata selection change from FileListItem
 * Delegates to store to update evidence with selected metadata
 */
const handleMetadataChanged = (evidenceId, metadataHash) => {
  organizerStore.selectMetadata(evidenceId, metadataHash);
};

// Setup lazy loading on mount
onMounted(async () => {
  // Initialize with first 10 items
  preloadInitialItems();

  // Wait for DOM updates
  await nextTick();

  // Setup Intersection Observer for remaining items
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index);
          loadItem(index);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '50px' }
  );

  // Observe all placeholder elements
  const placeholders = document.querySelectorAll('.document-placeholder');
  placeholders.forEach((placeholder) => {
    observer.observe(placeholder);
  });
});

// Cleanup on unmount
onUnmounted(() => {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
});
</script>

<style scoped>
.file-list-container {
  flex: 1;
  padding: 24px 32px;
}

.file-display {
  min-height: 0;
}

.file-tree {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Lazy loading placeholder styles */
.document-placeholder {
  background: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  position: relative;
  overflow: hidden;
}

.skeleton-content {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  height: 100%;
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .file-list-container {
    padding: 16px 20px;
  }
}
</style>
