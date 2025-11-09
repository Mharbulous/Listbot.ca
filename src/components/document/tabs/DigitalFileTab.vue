<template>
  <!-- Digital File Tab Content -->
  <div>
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
</template>

<script setup>
import { computed } from 'vue';
import { formatDateTime } from '@/utils/dateFormatter.js';

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
const emit = defineEmits(['variant-selected', 'dropdown-toggled']);

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
</script>

<style scoped>
/* Component-specific styles - shared styles inherited from parent */

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
</style>
