<template>
  <div class="list-documents-page pa-6">
    <div class="page-header mb-6">
      <div class="d-flex align-center justify-end">
        <ColumnSelector
          :all-columns="allColumns"
          :visible-column-keys="visibleColumnKeys"
          :is-column-visible="isColumnVisible"
          :is-column-required="isColumnRequired"
          :toggle-column="toggleColumn"
          :reset-to-defaults="resetToDefaults"
        />
      </div>
    </div>

    <!-- Performance Testing Controls -->
    <v-card class="mb-6">
      <v-card-title>Performance Testing Controls</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap gap-3 align-center">
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            @click="loadFiles(100)"
            :disabled="isGenerating"
          >
            Load 100 Files
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            @click="loadFiles(1000)"
            :disabled="isGenerating"
          >
            Load 1,000 Files
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            size="small"
            @click="loadFiles(10000)"
            :disabled="isGenerating"
          >
            Load 10,000 Files
          </v-btn>
          <v-btn
            color="error"
            variant="outlined"
            size="small"
            @click="clearFiles"
            :disabled="isGenerating || files.length === 0"
          >
            Clear Files
          </v-btn>
          <v-spacer></v-spacer>
          <div class="performance-stats">
            <span class="text-caption text-grey-darken-1">
              Files: {{ files.length.toLocaleString() }}
            </span>
            <span v-if="lastRenderTime > 0" class="text-caption ml-4">
              Last Render: {{ lastRenderTime.toFixed(2) }}ms
            </span>
            <span v-if="domNodeCount > 0" class="text-caption ml-4">
              DOM Nodes: {{ domNodeCount.toLocaleString() }}
            </span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Virtual File List -->
    <v-card class="file-list-container">
      <VirtualFileList
        :files="files"
        :loading="isGenerating"
        :columns="visibleColumns"
        @row-click="handleRowClick"
      />
    </v-card>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import VirtualFileList from '@/features/organizer/components/VirtualFileList.vue';
import ColumnSelector from '@/features/organizer/components/ColumnSelector.vue';
import { useMockFileData } from '@/composables/useMockFileData.js';
import { usePerformanceMonitor } from '@/composables/usePerformanceMonitor.js';
import { useFileListColumns } from '@/composables/useFileListColumns.js';

// Mock data composable
const { files, isGenerating, generateWithLogging, clearFiles: clearMockFiles } = useMockFileData();

// Column management
const {
  allColumns,
  visibleColumns,
  visibleColumnKeys,
  isColumnVisible,
  isColumnRequired,
  toggleColumn,
  resetToDefaults,
} = useFileListColumns();

// Performance monitoring
const performanceMonitor = usePerformanceMonitor('VirtualFileList');
const lastRenderTime = ref(0);
const domNodeCount = ref(0);

/**
 * Load files and measure performance
 */
async function loadFiles(count) {
  // Start performance monitoring
  performanceMonitor.startMonitoring();

  // Generate mock files
  generateWithLogging(count);

  // Wait for DOM update
  await nextTick();

  // Small delay to ensure rendering is complete
  setTimeout(() => {
    performanceMonitor.endMonitoring();

    // Store metrics for display
    const summary = performanceMonitor.getSummary();
    lastRenderTime.value = summary.renderTime;
    domNodeCount.value = summary.domNodeCount;
  }, 100);
}

/**
 * Clear all files
 */
function clearFiles() {
  clearMockFiles();
  lastRenderTime.value = 0;
  domNodeCount.value = 0;
  performanceMonitor.reset();
}

/**
 * Handle row click
 */
function handleRowClick(file) {
  // Handle file click
}

/**
 * Get performance alert type based on render time
 */
function getPerformanceAlertType() {
  if (lastRenderTime.value < 50) return 'success';
  if (lastRenderTime.value < 100) return 'info';
  if (lastRenderTime.value < 200) return 'warning';
  return 'error';
}

/**
 * Get performance message
 */
function getPerformanceMessage() {
  if (lastRenderTime.value < 50) return '🚀 Excellent Performance!';
  if (lastRenderTime.value < 100) return '✅ Good Performance';
  if (lastRenderTime.value < 200) return '⚠️ Acceptable Performance';
  return '❌ Poor Performance';
}

// Load 100 files by default on mount
onMounted(() => {
  loadFiles(100);
});
</script>

<style scoped>
.list-documents-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  flex-shrink: 0;
}

.file-list-container {
  flex: 1;
  min-height: 600px;
  max-height: calc(100vh - 400px);
  overflow: hidden;
}

.performance-stats {
  display: flex;
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>
