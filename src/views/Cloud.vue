<template>
  <div class="analyze-mockup-page" style="min-width: 0">
    <DocumentTable
      :data="mockData"
      :columns="allColumns"
      :loading="isLoading"
      :error="error"
      :row-height="48"
      :overscan="5"
      column-selector-label="Cols"
      @dragover="onDragOver"
      @drop="onDrop"
      @retry="handleRetry"
    >
      <!-- Custom cell rendering for File Type column -->
      <template #cell-fileType="{ row, value }">
        <span
          :class="
            value.startsWith('ERROR:')
              ? 'error-text'
              : ['badge', getBadgeClass(formatMimeType(value))]
          "
        >
          {{ formatMimeType(value) }}
        </span>
      </template>

      <!-- Custom cell rendering for File Name column -->
      <template #cell-fileName="{ row, value }">
        <span :class="{ 'error-text': value.startsWith('ERROR:') }">
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Size column -->
      <template #cell-size="{ row, value }">
        <span :class="{ 'error-text': value.startsWith('ERROR:') }">
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Privilege column -->
      <template #cell-privilege="{ row, value }">
        <span
          :class="value.startsWith('ERROR:') ? 'error-text' : 'badge badge-privilege'"
        >
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Description column -->
      <template #cell-description="{ row, value }">
        <span :class="{ 'error-text': value.startsWith('ERROR:') }">
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Author column -->
      <template #cell-author="{ row, value }">
        <span :class="{ 'error-text': value.startsWith('ERROR:') }">
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Custodian column -->
      <template #cell-custodian="{ row, value }">
        <span :class="{ 'error-text': value.startsWith('ERROR:') }">
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Source Folder Path column -->
      <template #cell-sourceFolderPath="{ row, value }">
        <span :class="{ 'error-text': value.startsWith('ERROR:') }">
          {{ value }}
        </span>
      </template>

      <!-- Custom cell rendering for Timestamp columns (Upload Date, Source Modified Date) -->
      <template #cell-date="{ row, value }">
        <span :class="{ 'error-text': getCellValue(row, 'date').startsWith('ERROR:') }">
          {{ getCellValue(row, 'date') }}
        </span>
      </template>

      <template #cell-modifiedDate="{ row, value }">
        <span :class="{ 'error-text': getCellValue(row, 'modifiedDate').startsWith('ERROR:') }">
          {{ getCellValue(row, 'modifiedDate') }}
        </span>
      </template>

      <!-- Custom cell rendering for Multiple Source Files column -->
      <template #cell-alternateSources="{ row, value }">
        <span
          :class="
            value === 'No source information' ? 'error-text' : 'badge badge-status'
          "
        >
          {{ value }}
        </span>
      </template>
    </DocumentTable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { fetchFiles } from '@/services/uploadService';
import { useAuthStore } from '@/core/stores/auth';
import { useMatterViewStore } from '@/stores/matterView';
import { useUserPreferencesStore } from '@/core/stores/userPreferences';
import { formatDateTime as formatDateTimeUtil } from '@/utils/dateFormatter';
import { formatMimeType } from '@/utils/mimeTypeFormatter';
import { PerformanceMonitor } from '@/utils/performanceMonitor';
import DocumentTable from '@/components/base/DocumentTable.vue';

// Get route for accessing params
const route = useRoute();

// Initialize performance monitor
const perfMonitor = new PerformanceMonitor('Cloud Table');

// Auth and Matter stores
const authStore = useAuthStore();
const matterViewStore = useMatterViewStore();

// User preferences store for date and time formatting
const preferencesStore = useUserPreferencesStore();
const { dateFormat, timeFormat } = storeToRefs(preferencesStore);

// Data state
const mockData = ref([]);
const isLoading = ref(true);
const error = ref(null);
const systemCategories = ref([]);
const firmCategories = ref([]);
const matterCategories = ref([]);

// Non-system column definitions (fixed columns that don't come from systemcategories collection)
const NON_SYSTEM_COLUMNS = [
  { key: 'fileName', label: 'Source File Name', defaultWidth: 300 },
  { key: 'size', label: 'File Size', defaultWidth: 100 },
  { key: 'date', label: 'Upload Date', defaultWidth: 200 },
  { key: 'fileType', label: 'File Format', defaultWidth: 200 },
  { key: 'modifiedDate', label: 'Source Modified Date', defaultWidth: 150 },
  { key: 'sourceFolderPath', label: 'Source Folder', defaultWidth: 300 },
  { key: 'alternateSources', label: 'Multiple Source Files', defaultWidth: 180 },
];

// Columns that contain Firestore timestamps and should be formatted with date+time
const TIMESTAMP_COLUMNS = ['date', 'modifiedDate'];

/**
 * Calculate the width needed for column header text
 * Uses canvas measureText API for accurate measurement
 * @param {string} text - The column header text
 * @param {string} font - Font specification (default: '14px Roboto')
 * @returns {number} Width in pixels needed for the text plus padding/icons
 */
const calculateColumnWidth = (text, font = '14px Roboto, sans-serif') => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = metrics.width;

  // Add padding for: left/right padding (32px) + sort icon (24px) + resize handle (20px) + buffer (4px) = 80px
  const totalWidth = Math.ceil(textWidth + 80);

  // Ensure minimum width of 180px (same as built-in columns)
  return Math.max(180, totalWidth);
};

// Dynamic column configuration combining all four column types
const allColumns = computed(() => {
  const computeStart = performance.now();

  // Start with non-system (built-in) columns
  const columns = [...NON_SYSTEM_COLUMNS];

  // System category columns (with actual tag data)
  const systemCategoryColumns = systemCategories.value.map((category) => ({
    key: category.id,
    label: category.name,
    defaultWidth: calculateColumnWidth(category.name),
  }));

  // Firm category columns (placeholder data)
  const firmCategoryColumns = firmCategories.value.map((category) => ({
    key: category.id,
    label: category.name,
    defaultWidth: calculateColumnWidth(category.name),
  }));

  // Matter category columns (placeholder data)
  const matterCategoryColumns = matterCategories.value.map((category) => ({
    key: category.id,
    label: category.name,
    defaultWidth: calculateColumnWidth(category.name),
  }));

  // Combine: built-in, then system, then firm, then matter
  const allColumnsArray = [...columns, ...systemCategoryColumns, ...firmCategoryColumns, ...matterCategoryColumns];

  const totalColumnCount = allColumnsArray.length;
  const duration = performance.now() - computeStart;

  // Warn if column count is very high (potential performance issue)
  if (totalColumnCount > 50) {
    console.warn(`⚠️ High Column Count: ${totalColumnCount} columns (>50 may impact performance) | Computed in ${duration.toFixed(0)}ms`);
  }

  return allColumnsArray;
});

/**
 * Get badge CSS class based on file type
 */
const getBadgeClass = (fileType) => {
  const type = fileType.toUpperCase();
  if (type === 'PDF') return 'badge-pdf';
  if (type === 'DOC' || type === 'DOCX') return 'badge-doctype';
  if (type === 'XLS' || type === 'XLSX') return 'badge-status';
  return 'badge-privilege';
};

/**
 * Check if a column contains timestamp data
 */
const isTimestampColumn = (columnKey) => {
  return TIMESTAMP_COLUMNS.includes(columnKey);
};

/**
 * Get cell value with appropriate formatting
 * Handles timestamps, errors, and regular values
 */
const getCellValue = (row, columnKey) => {
  const value = row[columnKey];

  // Handle timestamp columns
  if (isTimestampColumn(columnKey)) {
    // If null or missing, show error
    if (!value) {
      return 'ERROR: Date not available';
    }
    // Format with user preferences (space separator, no "at")
    return formatDateTimeUtil(value, dateFormat.value, timeFormat.value);
  }

  // For non-timestamp columns, return value as-is
  return value;
};

/**
 * Handle drag over event for file upload
 */
const onDragOver = (event) => {
  event.preventDefault();
};

/**
 * Handle drop event for file upload
 */
const onDrop = (event) => {
  event.preventDefault();
  // File upload logic would go here
  console.log('Files dropped:', event.dataTransfer.files);
};

/**
 * Handle retry button click
 */
const handleRetry = () => {
  window.location.reload();
};

// Component lifecycle
onMounted(async () => {
  const mountStart = performance.now();

  // Fetch real data from Firestore
  try {
    // Wait for auth to be ready
    if (!authStore.isAuthenticated) {
      error.value = 'Please log in to view files';
      isLoading.value = false;
      return;
    }

    const firmId = authStore.currentFirm;
    if (!firmId) {
      error.value = 'No firm ID available';
      isLoading.value = false;
      return;
    }

    // Get matter ID from route params
    const matterId = route.params.matterId;
    if (!matterId) {
      error.value = 'No matter ID in route';
      isLoading.value = false;
      return;
    }

    // Fetch system categories first (global, alphabetically sorted)
    perfMonitor.start('System Categories Fetch');
    try {
      const systemCategoriesRef = collection(db, 'systemcategories');
      const q = query(systemCategoriesRef, orderBy('name', 'asc'));
      const querySnapshot = await getDocs(q);

      systemCategories.value = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[Cloud Table] Loaded ${systemCategories.value.length} system categories`);
    } catch (categoryError) {
      console.error('[Cloud Table] Failed to load system categories:', categoryError);
      // Continue without system categories rather than failing completely
      systemCategories.value = [];
    }
    perfMonitor.end('System Categories Fetch');

    // Fetch firm categories (firm-wide, from 'general' matter)
    perfMonitor.start('Firm Categories Fetch');
    try {
      const firmCategoriesRef = collection(db, 'firms', firmId, 'matters', 'general', 'categories');
      const firmQuery = query(firmCategoriesRef, orderBy('name', 'asc'));
      const firmSnapshot = await getDocs(firmQuery);

      firmCategories.value = firmSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[Cloud Table] Loaded ${firmCategories.value.length} firm categories`);
    } catch (firmError) {
      console.error('[Cloud Table] Failed to load firm categories:', firmError);
      firmCategories.value = [];
    }
    perfMonitor.end('Firm Categories Fetch');

    // Fetch matter categories (matter-specific)
    perfMonitor.start('Matter Categories Fetch');
    try {
      const matterCategoriesRef = collection(db, 'firms', firmId, 'matters', matterId, 'categories');
      const matterQuery = query(matterCategoriesRef, orderBy('name', 'asc'));
      const matterSnapshot = await getDocs(matterQuery);

      matterCategories.value = matterSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`[Cloud Table] Loaded ${matterCategories.value.length} matter categories`);
    } catch (matterError) {
      console.error('[Cloud Table] Failed to load matter categories:', matterError);
      matterCategories.value = [];
    }
    perfMonitor.end('Matter Categories Fetch');

    // Fetch files with system categories
    perfMonitor.start('Data Fetch');
    mockData.value = await fetchFiles(firmId, matterId, systemCategories.value, 10000);
    perfMonitor.end('Data Fetch');

    isLoading.value = false;

    const totalMountTime = performance.now() - mountStart;
    console.log(`✅ Table Ready: ${totalMountTime.toFixed(0)}ms | ${mockData.value.length} documents | ${allColumns.value.length} columns`);
  } catch (err) {
    console.error('[Cloud Table] Error fetching files:', err);
    error.value = `Failed to load files: ${err.message}`;
    isLoading.value = false;
    return;
  }
});
</script>

<style scoped>
/* Page Container - Natural height for window scrolling */
.analyze-mockup-page {
  width: 100%; /* Full width of parent */
  background: white;
  display: flex;
  flex-direction: column;
  /* Removed height constraint and overflow:hidden to allow window scrolling */
  /* Table will expand to natural height and window provides scrolling */
  min-height: calc(100vh - 80px); /* Minimum height to fill viewport */
}
</style>
