<template>
  <div class="list-documents-page pa-6">
    <div class="page-header mb-6">
      <div class="d-flex align-center justify-space-between">
        <div>
          <h1 class="text-h4 font-weight-bold">Evidence Files</h1>
          <p class="text-subtitle-1 text-grey-darken-1 mt-2">
            High-performance virtual scrolling with dynamic columns
          </p>
        </div>
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

    <!-- Testing Instructions -->
    <v-card class="mb-6" variant="outlined">
      <v-card-title class="text-subtitle-1">Testing Instructions</v-card-title>
      <v-card-text>
        <ul class="pl-4">
          <li>
            <strong>Performance Testing:</strong> Click the buttons below to load different dataset
            sizes
          </li>
          <li>
            <strong>Column Management:</strong> Click the "Columns" button to show/hide columns
            dynamically
          </li>
          <li>Watch the console for detailed performance metrics</li>
          <li>
            <strong>Expected Performance:</strong>
            <ul class="pl-4 mt-2">
              <li>100 files: &lt;20ms render time</li>
              <li>1,000 files: &lt;50ms render time</li>
              <li>10,000 files: &lt;100ms render time</li>
              <li>DOM nodes should stay &lt;100 regardless of file count</li>
              <li>Scrolling should maintain 60fps</li>
              <li>Column changes should not impact performance</li>
            </ul>
          </li>
          <li class="mt-2">Open the browser console (F12) to see detailed performance logs</li>
          <li class="mt-2">
            <strong>Dynamic Columns:</strong> Column preferences are saved to localStorage and
            persist across sessions
          </li>
        </ul>
      </v-card-text>
    </v-card>

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

    <!-- Performance Indicators -->
    <v-alert
      v-if="lastRenderTime > 0"
      :type="getPerformanceAlertType()"
      variant="tonal"
      class="mb-4"
    >
      <div class="d-flex align-center">
        <div>
          <strong>{{ getPerformanceMessage() }}</strong>
          <div class="text-caption mt-1">
            Rendered {{ files.length.toLocaleString() }} files in {{ lastRenderTime.toFixed(2) }}ms
            with {{ domNodeCount.toLocaleString() }} DOM nodes ({{ visibleColumns.length }} columns
            visible)
          </div>
        </div>
      </div>
    </v-alert>

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
  console.clear();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Loading ${count.toLocaleString()} files...`);
  console.log(`📊 Visible Columns: ${visibleColumns.value.length}/${allColumns.value.length}`);
  console.log(`${'='.repeat(60)}\n`);

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

    // Additional performance analysis
    console.log('\n📈 Performance Analysis:');

    if (count >= 1000) {
      const timePerFile = (summary.renderTime / count) * 1000;
      console.log(`   - Time per file: ${timePerFile.toFixed(4)}ms`);
    }

    const visibleNodes = performanceMonitor.countVisibleNodes('app');
    console.log(`   - Visible DOM nodes: ${visibleNodes.toLocaleString()}`);

    const efficiency = count / summary.domNodeCount;
    console.log(`   - Efficiency ratio: ${efficiency.toFixed(2)}x (files per DOM node)`);

    // Virtual scrolling verification
    console.log('\n✅ Virtual Scrolling Verification:');
    console.log(`   - Dataset size: ${count.toLocaleString()} files`);
    console.log(`   - DOM nodes rendered: ${summary.domNodeCount.toLocaleString()}`);
    console.log(`   - Reduction: ${(((count - summary.domNodeCount) / count) * 100).toFixed(1)}%`);

    // Performance targets
    console.log('\n🎯 Performance Targets:');
    const target = count <= 100 ? 20 : count <= 1000 ? 50 : 100;
    const achieved = summary.renderTime < target;
    console.log(
      `   - Target: <${target}ms | Actual: ${summary.renderTime.toFixed(2)}ms | ${achieved ? '✅ PASS' : '❌ FAIL'}`
    );
    console.log(
      `   - DOM Nodes: <100 | Actual: ${summary.domNodeCount} | ${summary.domNodeCount < 100 ? '✅ PASS' : '❌ FAIL'}`
    );

    console.log(`\n${'='.repeat(60)}\n`);
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
  console.log('🗑️  Files cleared');
}

/**
 * Handle row click
 */
function handleRowClick(file) {
  console.log('📄 File clicked:', file.fileName);
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
  console.log('📊 Virtual File List - Performance Testing Page');
  console.log('💡 Features: Virtual Scrolling + Dynamic Columns');
  console.log('Click the buttons above to test different dataset sizes');
  console.log('Click the "Columns" button to show/hide columns\n');
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
