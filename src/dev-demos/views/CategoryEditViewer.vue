<template>
  <v-container fluid class="pa-6">
    <div class="max-w-7xl mx-auto">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-pencil-box" class="me-2" />
          Category Viewer (Dev Tool)
        </v-card-title>
        <v-card-subtitle> View category details and configuration </v-card-subtitle>

        <v-card-text>
          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-h6">Loading category...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="text-center py-12">
            <v-icon icon="mdi-alert-circle" size="64" color="error" />
            <p class="mt-4 text-h6 text-error">{{ error }}</p>
          </div>

          <!-- Category Details -->
          <div v-else-if="category">
            <v-alert color="info" class="mb-4" variant="tonal">
              <v-icon icon="mdi-information" class="me-2" />
              <strong>Development Tool:</strong> This page displays detailed category information
              for debugging and inspection purposes.
            </v-alert>

            <!-- Basic Information -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Basic Information</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Name:</span>
                      <span class="info-value font-weight-bold">{{ category.name }}</span>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Type:</span>
                      <v-chip :color="getCategoryIconColor(category)" size="small" class="ml-2">
                        <v-icon start size="16">{{ getCategoryIcon(category) }}</v-icon>
                        {{ category.type }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Source:</span>
                      <v-chip :color="getSourceColor(source)" size="small" class="ml-2">
                        {{ source }}
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Category ID:</span>
                      <code class="ml-2">{{ categoryId }}</code>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Type-Specific Configuration -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Configuration</v-card-title>
              <v-card-text>
                <div v-if="Object.keys(typeSpecificFields).length > 0">
                  <v-row>
                    <v-col
                      v-for="(value, key) in typeSpecificFields"
                      :key="key"
                      cols="12"
                      md="6"
                    >
                      <div class="info-item">
                        <span class="info-label">{{ formatFieldName(key) }}:</span>
                        <span class="info-value ml-2">{{ formatFieldValue(value) }}</span>
                      </div>
                    </v-col>
                  </v-row>
                </div>
                <div v-else class="text-center text-grey py-4">
                  <v-icon icon="mdi-information-outline" size="32" />
                  <p class="mt-2">No type-specific configuration</p>
                </div>
              </v-card-text>
            </v-card>

            <!-- Timestamps -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title class="text-h6">Metadata</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col v-if="category.createdAt" cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Created:</span>
                      <span class="info-value ml-2">{{ formatTimestamp(category.createdAt) }}</span>
                    </div>
                  </v-col>
                  <v-col v-if="category.updatedAt" cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Updated:</span>
                      <span class="info-value ml-2">{{ formatTimestamp(category.updatedAt) }}</span>
                    </div>
                  </v-col>
                  <v-col v-if="category.firmId" cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Firm ID:</span>
                      <code class="ml-2">{{ category.firmId }}</code>
                    </div>
                  </v-col>
                  <v-col v-if="category.matterId" cols="12" md="6">
                    <div class="info-item">
                      <span class="info-label">Matter ID:</span>
                      <code class="ml-2">{{ category.matterId }}</code>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Raw JSON -->
            <v-card variant="outlined">
              <v-card-title class="text-h6">
                Raw JSON
                <v-spacer />
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  @click="copyToClipboard"
                />
              </v-card-title>
              <v-card-text>
                <pre class="json-display">{{ JSON.stringify(category, null, 2) }}</pre>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn variant="outlined" :to="{ name: 'CategoryMigrationTool' }">
            <v-icon start>mdi-arrow-left</v-icon>
            Back to Categories
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="loadCategory">
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCategoryManager } from '../../features/organizer/composables/useCategoryManager.js';
import { getCategoryTypeInfo } from '../../features/organizer/utils/categoryTypes.js';

const route = useRoute();
const categoryManager = useCategoryManager();

const loading = ref(false);
const error = ref(null);
const category = ref(null);
const snackbar = ref({ show: false, message: '', color: 'success' });

// Get route parameters
const categoryId = computed(() => route.params.id);
const source = computed(() => route.query.source || 'unknown');

// Type-specific fields to display
const typeSpecificFields = computed(() => {
  if (!category.value) return {};

  const fields = {};
  const excludeKeys = [
    'id',
    'name',
    'type',
    'source',
    'createdAt',
    'updatedAt',
    'firmId',
    'matterId',
  ];

  Object.keys(category.value).forEach((key) => {
    if (!excludeKeys.includes(key)) {
      fields[key] = category.value[key];
    }
  });

  return fields;
});

/**
 * Get category type icon
 */
const getCategoryIcon = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.icon : 'mdi-folder';
};

/**
 * Get category icon color
 */
const getCategoryIconColor = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.color : 'grey';
};

/**
 * Get source color based on source type
 */
const getSourceColor = (source) => {
  switch (source) {
    case 'system':
      return 'blue';
    case 'firm':
      return 'green';
    case 'matter':
      return 'orange';
    default:
      return 'grey';
  }
};

/**
 * Format field name for display
 */
const formatFieldName = (key) => {
  // Convert camelCase to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

/**
 * Format field value for display
 */
const formatFieldValue = (value) => {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';

  try {
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return 'Invalid date';
  }
};

/**
 * Copy category JSON to clipboard
 */
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(category.value, null, 2));
    showNotification('Category JSON copied to clipboard', 'success');
  } catch (err) {
    showNotification('Failed to copy to clipboard', 'error');
  }
};

/**
 * Load category data
 */
const loadCategory = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log(`[CategoryEditViewer] Loading category: ${categoryId.value} from ${source.value}`);

    // Load categories based on source
    const result = await categoryManager.loadAllCategories();

    // Find the category in the appropriate collection
    let foundCategory = null;
    switch (source.value) {
      case 'system':
        foundCategory = result.systemcategories.find((cat) => cat.id === categoryId.value);
        break;
      case 'firm':
        foundCategory = result.firmCategories.find((cat) => cat.id === categoryId.value);
        break;
      case 'matter':
        foundCategory = result.matterCategories.find((cat) => cat.id === categoryId.value);
        break;
      default:
        // Search all collections
        foundCategory =
          result.systemcategories.find((cat) => cat.id === categoryId.value) ||
          result.firmCategories.find((cat) => cat.id === categoryId.value) ||
          result.matterCategories.find((cat) => cat.id === categoryId.value);
    }

    if (foundCategory) {
      category.value = foundCategory;
      console.log('[CategoryEditViewer] Category loaded:', category.value);
    } else {
      error.value = `Category not found: ${categoryId.value}`;
      console.error('[CategoryEditViewer] Category not found');
    }
  } catch (err) {
    console.error('[CategoryEditViewer] Failed to load category:', err);
    error.value = 'Failed to load category: ' + err.message;
  } finally {
    loading.value = false;
  }
};

/**
 * Show notification
 */
const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

onMounted(() => {
  loadCategory();
});
</script>

<style scoped>
.info-item {
  padding: 8px 0;
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  min-width: 120px;
}

.info-value {
  color: rgba(0, 0, 0, 0.87);
}

.json-display {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}

code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 13px;
}
</style>
