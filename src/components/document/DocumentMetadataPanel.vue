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
          <!-- Digital File Tab Content -->
          <div v-if="activeTab === 'digital-file'">
            <!-- Source File Section -->
            <div class="metadata-section">
            <h3 class="metadata-section-title">Source File</h3>

            <!-- File name dropdown for selecting metadata variants -->
            <div class="metadata-item">
              
              <div class="dropdown-container" @click="handleToggleDropdown">
                <div
                  class="source-file-selector"
                  :class="{ disabled: updatingMetadata || sourceMetadataVariants.length === 0 }"
                >
                  {{
                    sourceMetadataVariants.find((v) => v.metadataHash === selectedMetadataHash)
                      ?.sourceFileName || 'Unknown File'
                  }}
                  <span v-if="sourceMetadataVariants.length > 1" class="dropdown-arrow">▼</span>
                </div>
                <span v-if="updatingMetadata" class="updating-indicator">Updating...</span>

                <!-- Custom dropdown menu -->
                <div v-if="dropdownOpen" class="dropdown-menu" @click.stop>
                  <div
                    v-for="variant in sourceMetadataVariants"
                    :key="variant.metadataHash"
                    class="dropdown-item"
                    :class="{ selected: variant.metadataHash === selectedMetadataHash }"
                    @click="handleSelectVariant(variant.metadataHash)"
                  >
                    {{ variant.sourceFileName }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Date modified display -->
            <div class="metadata-item">
              <span class="metadata-label">Date Modified (Source):</span>
              <div class="date-with-notification">
                <span class="metadata-value">{{
                  formatDateTime(evidence.createdAt, dateFormat, timeFormat)
                }}</span>
                <span v-if="earlierCopyMessage" class="earlier-copy-message">{{
                  earlierCopyMessage
                }}</span>
              </div>
            </div>

            <!-- File size -->
            <div class="metadata-item">
              <span class="metadata-label">Size:</span>
              <span class="metadata-value">{{ formatUploadSize(evidence.fileSize) }}</span>
            </div>

            <!-- MIME type -->
            <div class="metadata-item">
              <span class="metadata-label">MIME Type:</span>
              <span class="metadata-value">{{ mimeType }}</span>
            </div>
          </div>

          <!-- Cloud Section -->
          <div class="metadata-section">
            <h3 class="metadata-section-title">Cloud Storage</h3>
            <div class="metadata-item">
              <span class="metadata-label">Upload Date:</span>
              <span class="metadata-value">{{
                storageMetadata?.timeCreated
                  ? formatDateTime(
                      new Date(storageMetadata.timeCreated),
                      dateFormat,
                      timeFormat
                    )
                  : storageMetadata === null
                    ? 'Unknown'
                    : 'Loading...'
              }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">File Hash:</span>
              <span class="metadata-value text-caption">{{ fileHash }}</span>
            </div>
          </div>

          <!-- Embedded Metadata Section -->
          <div class="metadata-section">
            <h3 class="metadata-section-title">Embedded Metadata</h3>

            <!-- Loading state -->
            <div v-if="isPdfFile && metadataLoading" class="metadata-notice">
              <p>Loading PDF metadata...</p>
            </div>

            <!-- Error state -->
            <div v-else-if="isPdfFile && metadataError" class="metadata-error">
              <p>Failed to load PDF metadata</p>
              <p class="error-detail">{{ metadataError }}</p>
            </div>

            <!-- PDF Metadata Display -->
            <div v-else-if="isPdfFile && hasMetadata" class="pdf-metadata-container">
              <!-- Document Information Dictionary -->
              <div v-if="pdfMetadata.info" class="metadata-field-group">
                <div v-if="pdfMetadata.info.title" class="metadata-item">
                  <span class="metadata-label">Title:</span>
                  <span class="metadata-value">{{ pdfMetadata.info.title }}</span>
                </div>

                <div v-if="pdfMetadata.info.author" class="metadata-item">
                  <span class="metadata-label">Author:</span>
                  <span class="metadata-value">{{ pdfMetadata.info.author }}</span>
                </div>

                <div v-if="pdfMetadata.info.subject" class="metadata-item">
                  <span class="metadata-label">Subject:</span>
                  <span class="metadata-value">{{ pdfMetadata.info.subject }}</span>
                </div>

                <div v-if="pdfMetadata.info.creator" class="metadata-item">
                  <span class="metadata-label">Creator:</span>
                  <span class="metadata-value">{{ pdfMetadata.info.creator }}</span>
                </div>

                <div v-if="pdfMetadata.info.producer" class="metadata-item">
                  <span class="metadata-label">Producer:</span>
                  <span class="metadata-value">{{ pdfMetadata.info.producer }}</span>
                </div>

                <div v-if="pdfMetadata.info.creationDate" class="metadata-item">
                  <span class="metadata-label">Creation Date:</span>
                  <span class="metadata-value">
                    {{
                      pdfMetadata.info.creationDate.formatted || pdfMetadata.info.creationDate
                    }}
                  </span>
                  <span v-if="pdfMetadata.info.creationDate.timezone" class="metadata-timezone">
                    ({{ pdfMetadata.info.creationDate.timezone }})
                  </span>
                </div>

                <div v-if="pdfMetadata.info.modDate" class="metadata-item">
                  <span class="metadata-label">Modified Date:</span>
                  <span class="metadata-value">
                    {{ pdfMetadata.info.modDate.formatted || pdfMetadata.info.modDate }}
                  </span>
                  <span v-if="pdfMetadata.info.modDate.timezone" class="metadata-timezone">
                    ({{ pdfMetadata.info.modDate.timezone }})
                  </span>
                </div>

                <div v-if="pdfMetadata.info.keywords" class="metadata-item">
                  <span class="metadata-label">Keywords:</span>
                  <span class="metadata-value">{{ pdfMetadata.info.keywords }}</span>
                </div>
              </div>

              <!-- XMP Metadata (forensically valuable fields) -->
              <div v-if="pdfMetadata.xmp" class="metadata-field-group xmp-metadata">
                <h4 class="xmp-title">XMP Metadata</h4>

                <div v-if="pdfMetadata.xmp.documentId" class="metadata-item">
                  <span class="metadata-label">Document ID:</span>
                  <span class="metadata-value text-caption">{{
                    pdfMetadata.xmp.documentId
                  }}</span>
                </div>

                <div v-if="pdfMetadata.xmp.instanceId" class="metadata-item">
                  <span class="metadata-label">Instance ID:</span>
                  <span class="metadata-value text-caption">{{
                    pdfMetadata.xmp.instanceId
                  }}</span>
                </div>

                <!-- Revision History - Complete Audit Trail -->
                <div v-if="pdfMetadata.xmp.history" class="metadata-item revision-history">
                  <span class="metadata-label">Revision History:</span>
                  <div class="revision-history-content">
                    <pre class="revision-history-data">{{
                      JSON.stringify(pdfMetadata.xmp.history, null, 2)
                    }}</pre>
                  </div>
                </div>
              </div>
            </div>

            <!-- No metadata available for PDF -->
            <div v-else-if="isPdfFile && !metadataLoading" class="metadata-notice">
              <p>...getting embedded metadata...</p>
            </div>

            <!-- Not a PDF file -->
            <div v-else class="metadata-notice">
              <p>Metadata viewing has not been implemented for file type:</p>
              <p>{{ mimeType }}</p>
            </div>
          </div>
          </div>

          <!-- Document Tab Content -->
          <div v-if="activeTab === 'document'">
            <!-- System Fields Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">System Fields</h3>

              <!-- Document Date -->
              <div class="metadata-item">
                <span class="metadata-label">Document Date:</span>

                <!-- State 1: Analyze Button -->
                <v-btn
                  v-if="!aiResults.documentDate && !isAnalyzing"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-robot"
                  @click="handleAnalyzeClick('documentDate')"
                  class="analyze-button"
                  size="small"
                >
                  Analyze Document
                </v-btn>

                <!-- State 2: Analyzing Spinner -->
                <div v-else-if="isAnalyzing" class="analyzing-state">
                  <v-progress-circular indeterminate size="20" color="primary" />
                  <span class="analyzing-text">Analyzing...</span>
                </div>

                <!-- State 3: AI Result with Tooltip -->
                <div v-else class="ai-result">
                  <v-tooltip location="bottom" max-width="400">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <div v-bind="tooltipProps" class="ai-result-content">
                        <span class="ai-result-value">{{ aiResults.documentDate.value }}</span>
                        <v-chip
                          :color="aiResults.documentDate.confidence >= 85 ? 'success' : 'warning'"
                          size="small"
                          variant="flat"
                          class="ai-result-badge"
                        >
                          {{ aiResults.documentDate.confidence }}% ✓
                        </v-chip>
                      </div>
                    </template>

                    <!-- Tooltip Content -->
                    <div class="ai-tooltip-content">
                      <div class="ai-tooltip-section">
                        <strong>Context:</strong>
                        <p>{{ aiResults.documentDate.context }}</p>
                      </div>
                      <div
                        v-if="aiResults.documentDate.alternatives.length"
                        class="ai-tooltip-section"
                      >
                        <strong>Alternatives:</strong>
                        <ul>
                          <li v-for="alt in aiResults.documentDate.alternatives" :key="alt.value">
                            {{ alt.value }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </v-tooltip>
                </div>
              </div>

              <!-- Document Type -->
              <div class="metadata-item">
                <span class="metadata-label">Document Type:</span>

                <!-- State 1: Analyze Button -->
                <v-btn
                  v-if="!aiResults.documentType && !isAnalyzing"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-robot"
                  @click="handleAnalyzeClick('documentType')"
                  class="analyze-button"
                  size="small"
                >
                  Analyze Document
                </v-btn>

                <!-- State 2: Analyzing Spinner -->
                <div v-else-if="isAnalyzing" class="analyzing-state">
                  <v-progress-circular indeterminate size="20" color="primary" />
                  <span class="analyzing-text">Analyzing...</span>
                </div>

                <!-- State 3: AI Result with Tooltip -->
                <div v-else class="ai-result">
                  <v-tooltip location="bottom" max-width="400">
                    <template v-slot:activator="{ props: tooltipProps }">
                      <div v-bind="tooltipProps" class="ai-result-content">
                        <span class="ai-result-value">{{ aiResults.documentType.value }}</span>
                        <v-chip
                          :color="aiResults.documentType.confidence >= 85 ? 'success' : 'warning'"
                          size="small"
                          variant="flat"
                          class="ai-result-badge"
                        >
                          {{ aiResults.documentType.confidence }}% ✓
                        </v-chip>
                      </div>
                    </template>

                    <!-- Tooltip Content -->
                    <div class="ai-tooltip-content">
                      <div class="ai-tooltip-section">
                        <strong>Context:</strong>
                        <p>{{ aiResults.documentType.context }}</p>
                      </div>
                      <div
                        v-if="aiResults.documentType.alternatives.length"
                        class="ai-tooltip-section"
                      >
                        <strong>Alternatives:</strong>
                        <ul>
                          <li v-for="alt in aiResults.documentType.alternatives" :key="alt.value">
                            {{ alt.value }} ({{ alt.confidence }}%) - {{ alt.reasoning }}
                          </li>
                        </ul>
                      </div>
                    </div>
                  </v-tooltip>
                </div>
              </div>
            </div>

            <!-- Firm Fields Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Firm fields</h3>
              <div class="metadata-notice">
                <p>Coming soon...</p>
              </div>
            </div>

            <!-- Matter Fields Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Matter fields</h3>
              <div class="metadata-notice">
                <p>Coming soon...</p>
              </div>
            </div>
          </div>

          <!-- Review Tab Content -->
          <div v-if="activeTab === 'review'">
            <!-- Review Status Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Review Status</h3>
              <div class="metadata-notice">
                <p>Review functionality coming soon...</p>
              </div>
            </div>

            <!-- Review Notes Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Review Notes</h3>
              <div class="metadata-notice">
                <p>Notes and comments will appear here...</p>
              </div>
            </div>

            <!-- Review History Section -->
            <div class="metadata-section">
              <h3 class="metadata-section-title">Review History</h3>
              <div class="metadata-notice">
                <p>Review timeline will be displayed here...</p>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { formatDateTime } from '@/utils/dateFormatter.js';

// Tab state
const activeTab = ref('digital-file');

// AI Analysis state
const isAnalyzing = ref(false);
const aiResults = ref({
  documentDate: null,
  documentType: null,
});

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

// Computed properties
const earlierCopyMessage = computed(() => {
  // Only show message if there are multiple variants
  if (props.sourceMetadataVariants.length <= 1) {
    return '';
  }

  // Find the currently selected variant
  const currentVariant = props.sourceMetadataVariants.find(
    (v) => v.metadataHash === props.selectedMetadataHash
  );

  if (!currentVariant) {
    return '';
  }

  // Check if any other variant has an earlier sourceLastModified date
  const hasEarlierCopy = props.sourceMetadataVariants.some(
    (v) =>
      v.metadataHash !== props.selectedMetadataHash &&
      v.sourceLastModified < currentVariant.sourceLastModified
  );

  return hasEarlierCopy ? 'earlier copy found' : 'no earlier copies found';
});

const mimeType = computed(() => {
  return (
    props.storageMetadata?.contentType ||
    (props.storageMetadata === null ? 'Unknown' : 'Loading...')
  );
});

// Format file size helper
const formatUploadSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const formattedBytes = bytes.toLocaleString('en-US');
  if (bytes < 1024) return `${bytes} B (${formattedBytes} bytes)`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB (${formattedBytes} bytes)`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB (${formattedBytes} bytes)`;
};

// Toggle dropdown menu
const handleToggleDropdown = () => {
  if (props.updatingMetadata || props.sourceMetadataVariants.length === 0) return;
  emit('dropdown-toggled', !props.dropdownOpen);
};

// Select a variant from dropdown
const handleSelectVariant = (metadataHash) => {
  emit('dropdown-toggled', false);
  if (metadataHash !== props.selectedMetadataHash) {
    emit('variant-selected', metadataHash);
  }
};

// Mock AI analysis data (WILL BE REPLACED IN PHASE 2)
const MOCK_RESULTS = {
  documentDate: {
    value: '2024-03-15',
    confidence: 92,
    context: "Found 'Invoice Date: March 15, 2024' in document header",
    alternatives: [
      {
        value: '2024-03-14',
        confidence: 78,
        reasoning: 'Possible scan date in footer',
      },
    ],
  },
  documentType: {
    value: 'Invoice',
    confidence: 98,
    context: "Document contains 'INVOICE' header, itemized charges, and total due",
    alternatives: [],
  },
};

// Handle analyze button click (WILL BE REPLACED IN PHASE 2 with real Gemini API call)
const handleAnalyzeClick = (fieldName) => {
  console.log(`Analyze clicked for: ${fieldName}`);
  console.log('Analysis started');

  isAnalyzing.value = true;

  // Simulate 3-second analysis
  setTimeout(() => {
    isAnalyzing.value = false;

    // Set mock results for both fields (simulating single API call)
    aiResults.value.documentDate = MOCK_RESULTS.documentDate;
    aiResults.value.documentType = MOCK_RESULTS.documentType;

    console.log('Analysis completed');
    console.log('Mock results:', aiResults.value);
  }, 3000);
};
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

.metadata-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
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

.metadata-section {
  margin-bottom: 24px;
  transition: opacity 0.15s ease-in-out;
}

.metadata-section:last-child {
  margin-bottom: 0;
}

.metadata-section-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #444;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.metadata-notice {
  font-size: 0.8rem;
  color: #666;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.metadata-notice p {
  margin: 0;
  padding: 0;
}

.metadata-item-simple {
  margin-bottom: 8px;
}

.date-with-notification {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.earlier-copy-message {
  font-size: 0.75rem;
  color: #888;
  font-style: italic;
  margin-left: 12px;
}

.dropdown-container {
  position: relative;
}

.source-file-selector {
  width: 100%;
  padding: 0;
  font-size: 0.875rem;
  color: #333;
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.source-file-selector.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.dropdown-arrow {
  font-size: 0.6rem;
  margin-left: 6px;
  color: #666;
  opacity: 0.7;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background-color: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.875rem;
  color: #333;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.dropdown-item:hover {
  background-color: #475569;
  color: white;
}

.dropdown-item.selected {
  background-color: #e2e8f0;
  color: #1e293b;
  font-weight: 500;
}

.dropdown-item.selected:hover {
  background-color: #475569;
  color: white;
}

.updating-indicator {
  display: inline-block;
  margin-left: 8px;
  font-size: 0.75rem;
  color: #666;
  font-style: italic;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.metadata-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.metadata-value {
  font-size: 0.875rem;
  color: #333;
  word-break: break-all;
}

.metadata-placeholder {
  color: #999;
  font-style: italic;
}

/* PDF Metadata Styling */
.pdf-metadata-container {
  margin-top: 8px;
}

.metadata-field-group {
  margin-bottom: 20px;
}

.metadata-field-group:last-child {
  margin-bottom: 0;
}

.metadata-error {
  font-size: 0.8rem;
  color: #dc3545;
  font-style: italic;
  margin-top: 8px;
  margin-bottom: 16px;
  text-align: center;
}

.metadata-error .error-detail {
  font-size: 0.75rem;
  color: #888;
  margin-top: 4px;
}

.metadata-timezone {
  font-size: 0.7rem;
  color: #888;
  margin-left: 6px;
  font-style: italic;
}

.xmp-metadata {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.xmp-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 12px;
}

/* Revision History Styling */
.revision-history {
  margin-top: 16px;
}

.revision-history-content {
  max-height: 300px;
  overflow-y: auto;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  margin-top: 8px;
}

.revision-history-data {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.75rem;
  color: #212529;
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* AI Analysis Styles */
/* Analyze Button */
.analyze-button {
  margin: 8px 0;
}

/* Analyzing State */
.analyzing-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.analyzing-text {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
}

/* AI Result */
.ai-result {
  margin: 8px 0;
}

.ai-result-content {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: fit-content;
}

.ai-result-content:hover {
  background-color: #f5f5f5;
}

.ai-result-value {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.ai-result-badge {
  font-size: 0.7rem;
  font-weight: 600;
}

/* Tooltip Content */
.ai-tooltip-content {
  padding: 4px;
}

.ai-tooltip-section {
  margin-bottom: 12px;
}

.ai-tooltip-section:last-child {
  margin-bottom: 0;
}

.ai-tooltip-section strong {
  display: block;
  margin-bottom: 4px;
  color: #1976d2;
  font-size: 0.8rem;
  text-transform: uppercase;
  font-weight: 600;
}

.ai-tooltip-section p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: #333;
  font-style: italic;
}

.ai-tooltip-section ul {
  margin: 0;
  padding-left: 16px;
  list-style: disc;
}

.ai-tooltip-section li {
  font-size: 0.8rem;
  line-height: 1.4;
  color: #555;
  margin-bottom: 4px;
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
