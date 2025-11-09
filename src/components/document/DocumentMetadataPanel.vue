<template>
  <div class="metadata-panel" :class="{ 'metadata-panel--collapsed': !visible }">
    <div class="metadata-box" :class="{ 'metadata-box--collapsed': !visible }">
      <v-card variant="outlined" class="metadata-card">
        <!-- Card header with toggle button -->
        <div class="metadata-card-header">
          <div class="tabs-container">
            <button
              class="tab-button"
              :class="{ active: activeTab === 'digital-file' }"
              @click="activeTab = 'digital-file'"
            >
              ℹ️ Metadata
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'document' }"
              @click="activeTab = 'document'"
            >
              🤖 AI
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'review' }"
              @click="activeTab = 'review'"
            >
             👤Review
            </button>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            :title="visible ? 'Hide metadata' : 'Show metadata'"
            class="toggle-btn"
            @click="$emit('toggle-visibility')"
          >
            <v-icon>{{ visible ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
          </v-btn>
        </div>

        <v-card-text v-if="visible">
          <!-- Digital File Tab -->
          <DigitalFileTab
            v-if="activeTab === 'digital-file'"
            :evidence="evidence"
            :storage-metadata="storageMetadata"
            :source-metadata-variants="sourceMetadataVariants"
            :selected-metadata-hash="selectedMetadataHash"
            :dropdown-open="dropdownOpen"
            :pdf-metadata="pdfMetadata"
            :metadata-loading="metadataLoading"
            :metadata-error="metadataError"
            :has-metadata="hasMetadata"
            :updating-metadata="updatingMetadata"
            :is-pdf-file="isPdfFile"
            :date-format="dateFormat"
            :time-format="timeFormat"
            :file-hash="fileHash"
            @variant-selected="$emit('variant-selected', $event)"
            @dropdown-toggled="$emit('dropdown-toggled', $event)"
          />

          <!-- AI Analysis Tab -->
          <AIAnalysisTab
            v-if="activeTab === 'document'"
            :evidence="evidence"
            :file-hash="fileHash"
          />

          <!-- Review Tab -->
          <ReviewTab v-if="activeTab === 'review'" />
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import DigitalFileTab from './tabs/DigitalFileTab.vue';
import AIAnalysisTab from './tabs/AIAnalysisTab.vue';
import ReviewTab from './tabs/ReviewTab.vue';

// Tab state
const activeTab = ref('digital-file');

// Props
const props = defineProps({
  evidence: {
    type: Object,
    required: true,
  },
  storageMetadata: {
    type: Object,
    default: null,
  },
  sourceMetadataVariants: {
    type: Array,
    default: () => [],
  },
  selectedMetadataHash: {
    type: String,
    default: '',
  },
  dropdownOpen: {
    type: Boolean,
    default: false,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  pdfMetadata: {
    type: Object,
    default: () => ({}),
  },
  metadataLoading: {
    type: Boolean,
    default: false,
  },
  metadataError: {
    type: String,
    default: null,
  },
  hasMetadata: {
    type: Boolean,
    default: false,
  },
  updatingMetadata: {
    type: Boolean,
    default: false,
  },
  isPdfFile: {
    type: Boolean,
    required: true,
  },
  dateFormat: {
    type: String,
    required: true,
  },
  timeFormat: {
    type: String,
    required: true,
  },
  fileHash: {
    type: String,
    required: true,
  },
});

// Events
const emit = defineEmits(['toggle-visibility', 'variant-selected', 'dropdown-toggled']);
</script>

<style scoped>
/* Right: File metadata panel */
.metadata-panel {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.metadata-box {
  width: 100%;
  flex-shrink: 0;
  flex: 1;
  overflow-y: auto;
}

.metadata-box--collapsed {
  overflow-y: hidden;
}

.metadata-panel--collapsed {
  width: auto;
}

.metadata-box--collapsed .metadata-card {
  height: 56px;
  box-sizing: border-box;
}

.metadata-box--collapsed .metadata-card-header {
  padding: 16px;
  min-height: 56px;
  border-bottom: none;
}

.metadata-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.metadata-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  min-height: 56px;
}

/* Tab Styling */
.tabs-container {
  display: flex;
  gap: 4px;
  flex-grow: 1;
}

.tab-button {
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #666;
  background-color: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover {
  color: #333;
  background-color: rgba(0, 0, 0, 0.04);
}

.tab-button.active {
  color: #1976d2;
  font-weight: 600;
  border-bottom-color: #1976d2;
}

.toggle-btn {
  flex-shrink: 0;
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

/* Responsive layout for tablets and mobile */
@media (max-width: 1150px) {
  .metadata-panel {
    width: 100%;
    max-width: 100%;
    order: 2; /* Show second on mobile */
  }
}
</style>
