<template>
  <div class="metadata-panel" :class="{ 'metadata-panel--collapsed': !visible }">
    <div class="metadata-box" :class="{ 'metadata-box--collapsed': !visible }">
      <v-card variant="flat" class="metadata-card">
        <!-- Card header with toggle button -->
        <div class="metadata-card-header">
          <div class="tabs-container">
            <button
              class="tab-button"
              :class="{ active: activeTab === 'document' }"
              @click="handleTabClick('document')"
            >
              <span class="tab-icon">✨</span>
              <span class="tab-label">AI</span>
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'review' }"
              @click="handleTabClick('review')"
            >
              <span class="tab-icon">👤</span>
              <span class="tab-label">Review</span>
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'doc-metadata' }"
              @click="handleTabClick('doc-metadata')"
            >
              <span class="tab-icon">📑</span>
              <span class="tab-label">Document</span>
            </button>
            <button
              class="tab-button"
              :class="{ active: activeTab === 'digital-file' }"
              @click="handleTabClick('digital-file')"
            >
              <span class="tab-icon">☁️</span>
              <span class="tab-label">File</span>
            </button>
          </div>
          <button
            :title="visible ? 'Collapse metadata' : 'Expand metadata'"
            class="toggle-btn"
            @click="$emit('toggle-visibility')"
          >
            <span v-if="visible" class="chevron-icon">▲</span>
            <span v-else class="chevron-icon">▼</span>
          </button>
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
            :active-tab="activeTab"
            :date-format="dateFormat"
          />

          <!-- Review Tab -->
          <ReviewTab
            v-if="activeTab === 'review'"
            :active-tab="activeTab"
            :file-hash="fileHash"
          />

          <!-- Document Tab -->
          <DocumentTab
            v-if="activeTab === 'doc-metadata'"
            :evidence="evidence"
            :file-hash="fileHash"
            :active-tab="activeTab"
            :date-format="dateFormat"
          />
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
import DocumentTab from './tabs/DocumentTab.vue';

// Tab state
const activeTab = ref('document');

// Handle tab click - expand panel if collapsed
const handleTabClick = (tab) => {
  activeTab.value = tab;
  // If panel is collapsed, expand it
  if (!props.visible) {
    emit('toggle-visibility');
  }
};

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
  background-color: #ffffff;
  border-radius: 0.75rem; /* rounded-xl */
  box-shadow: 0 25px 50px -12px rgb(59 130 246 / 0.1); /* shadow-2xl with blue tint */
  border: none !important; /* Override Vuetify's outlined variant */
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
  gap: 8px;
  flex-grow: 1;
}

.tab-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px 6px;
  font-size: 0.75rem;
  font-weight: 500;
  color: rgb(107 114 128); /* text-gray-500 - muted */
  background-color: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
  white-space: nowrap;
}

.tab-button:hover:not(.active) {
  color: rgb(75 85 99); /* Slightly darker gray on hover */
}

.tab-button.active {
  color: #1976d2; /* Primary blue */
  font-weight: 600;
  border-bottom-color: #1976d2;
}

.tab-icon {
  font-size: 1.25rem;
  line-height: 1;
}

.tab-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.toggle-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background-color: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: rgb(107 114 128);
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
  color: rgb(75 85 99);
}

.chevron-icon {
  transition: transform 0.2s ease;
}

/* Responsive layout for tablets and mobile */
@media (max-width: 1150px) {
  .metadata-panel {
    width: 100%;
    max-width: 100%;
    order: 2; /* Show second on mobile */
  }
}

/* Shared styles for all tab components (using :deep() to penetrate child scopes) */
:deep(.metadata-section) {
  margin-bottom: 24px;
  transition: opacity 0.15s ease-in-out;
}

:deep(.metadata-section:last-child) {
  margin-bottom: 0;
}

:deep(.metadata-section-title) {
  font-size: 0.9rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.metadata-notice) {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: center;
}

:deep(.metadata-notice p) {
  margin: 0;
  padding: 0;
}

:deep(.metadata-item) {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

:deep(.metadata-label) {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

:deep(.metadata-value) {
  font-size: 0.875rem;
  color: #333;
  word-break: break-all;
}
</style>
