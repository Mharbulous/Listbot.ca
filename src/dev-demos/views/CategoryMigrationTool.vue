<template>
  <v-container fluid class="pa-6">
    <div class="max-w-7xl mx-auto">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon icon="mdi-swap-horizontal" class="me-2" />
          Category Migration Tool
        </v-card-title>
        <v-card-subtitle>
          Move categories between System, Firm, and Matter collections using drag-and-drop
        </v-card-subtitle>

        <v-card-text>
          <v-alert color="warning" class="mb-4" variant="tonal">
            <v-icon icon="mdi-alert" class="me-2" />
            <strong>Development Tool:</strong> This page moves categories between Firestore
            collections. Changes are permanent and affect the database immediately.
          </v-alert>

          <!-- Loading State -->
          <div v-if="loading" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="mt-4 text-h6">Loading categories...</p>
          </div>

          <!-- Category Columns -->
          <div v-else>
            <v-row>
              <!-- System Categories Column -->
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="bg-blue-lighten-5 d-flex align-center">
                    <v-icon icon="mdi-shield-star" class="me-2" color="blue" />
                    System Categories
                    <v-spacer />
                    <v-chip size="small" color="blue">{{ systemCategories.length }}</v-chip>
                  </v-card-title>
                  <v-card-text
                    class="drop-zone"
                    :class="{ 'drop-zone-active': dragOverZone === 'system' }"
                    @dragover.prevent="handleDragOver('system')"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop('system')"
                  >
                    <div v-if="systemCategories.length === 0" class="text-center py-8 text-grey">
                      <v-icon icon="mdi-package-variant" size="48" />
                      <p class="mt-2">No system categories</p>
                    </div>
                    <div v-else class="d-flex flex-column gap-2">
                      <v-chip
                        v-for="category in systemCategories"
                        :key="category.id"
                        draggable="true"
                        class="category-chip"
                        color="blue"
                        variant="outlined"
                        @dragstart="handleDragStart(category, 'system')"
                        @dragend="handleDragEnd"
                      >
                        <v-icon start>{{ getCategoryIcon(category) }}</v-icon>
                        {{ category.name }}
                        <v-icon end>mdi-drag</v-icon>
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Firm Categories Column -->
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="bg-green-lighten-5 d-flex align-center">
                    <v-icon icon="mdi-office-building" class="me-2" color="green" />
                    Firm Categories
                    <v-spacer />
                    <v-chip size="small" color="green">{{ firmCategories.length }}</v-chip>
                  </v-card-title>
                  <v-card-text
                    class="drop-zone"
                    :class="{ 'drop-zone-active': dragOverZone === 'firm' }"
                    @dragover.prevent="handleDragOver('firm')"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop('firm')"
                  >
                    <div v-if="firmCategories.length === 0" class="text-center py-8 text-grey">
                      <v-icon icon="mdi-package-variant" size="48" />
                      <p class="mt-2">No firm categories</p>
                    </div>
                    <div v-else class="d-flex flex-column gap-2">
                      <v-chip
                        v-for="category in firmCategories"
                        :key="category.id"
                        draggable="true"
                        class="category-chip"
                        color="green"
                        variant="outlined"
                        @dragstart="handleDragStart(category, 'firm')"
                        @dragend="handleDragEnd"
                      >
                        <v-icon start>{{ getCategoryIcon(category) }}</v-icon>
                        {{ category.name }}
                        <v-icon end>mdi-drag</v-icon>
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Matter Categories Column -->
              <v-col cols="12" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="bg-orange-lighten-5 d-flex align-center">
                    <v-icon icon="mdi-folder" class="me-2" color="orange" />
                    Matter Categories
                    <v-spacer />
                    <v-chip size="small" color="orange">{{ matterCategories.length }}</v-chip>
                  </v-card-title>
                  <v-card-text
                    class="drop-zone"
                    :class="{ 'drop-zone-active': dragOverZone === 'matter' }"
                    @dragover.prevent="handleDragOver('matter')"
                    @dragleave="handleDragLeave"
                    @drop="handleDrop('matter')"
                  >
                    <div v-if="matterCategories.length === 0" class="text-center py-8 text-grey">
                      <v-icon icon="mdi-package-variant" size="48" />
                      <p class="mt-2">No matter categories</p>
                    </div>
                    <div v-else class="d-flex flex-column gap-2">
                      <v-chip
                        v-for="category in matterCategories"
                        :key="category.id"
                        draggable="true"
                        class="category-chip"
                        color="orange"
                        variant="outlined"
                        @dragstart="handleDragStart(category, 'matter')"
                        @dragend="handleDragEnd"
                      >
                        <v-icon start>{{ getCategoryIcon(category) }}</v-icon>
                        {{ category.name }}
                        <v-icon end>mdi-drag</v-icon>
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Instructions -->
            <v-alert color="info" class="mt-4" variant="tonal">
              <v-icon icon="mdi-information" class="me-2" />
              <strong>How to use:</strong> Drag a category badge from one column and drop it on
              another column to move it. A confirmation dialog will appear before the move.
            </v-alert>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn variant="outlined" :to="{ name: 'DevDemoIndex' }">
            <v-icon start>mdi-arrow-left</v-icon>
            Back to Demos
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="loadAllCategories">
            <v-icon start>mdi-refresh</v-icon>
            Refresh
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon color="warning" class="me-2">mdi-alert</v-icon>
          Confirm Category Move
        </v-card-title>
        <v-card-text>
          <p class="mb-4">
            Are you sure you want to move <strong>{{ draggedCategory?.name }}</strong> from
            <strong>{{ sourceLabel }}</strong> to <strong>{{ targetLabel }}</strong>?
          </p>
          <v-alert color="warning" variant="tonal" density="compact">
            This will delete the category from {{ sourceLabel }} and create it in
            {{ targetLabel }}.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="cancelMove">Cancel</v-btn>
          <v-btn color="warning" variant="elevated" :loading="moving" @click="confirmMove">
            Move Category
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { useAuthStore } from '../../core/stores/auth.js';
import { useMatterViewStore } from '../../stores/matterView.js';
import { useCategoryManager } from '../../features/organizer/composables/useCategoryManager.js';
import { getCategoryTypeInfo } from '../../features/organizer/utils/categoryTypes.js';

const authStore = useAuthStore();
const matterStore = useMatterViewStore();
const categoryManager = useCategoryManager();

const loading = ref(false);
const moving = ref(false);
const showConfirmDialog = ref(false);
const dragOverZone = ref(null);
const draggedCategory = ref(null);
const draggedSource = ref(null);
const targetZone = ref(null);

const snackbar = ref({ show: false, message: '', color: 'success' });

// Category lists
const systemCategories = ref([]);
const firmCategories = ref([]);
const matterCategories = ref([]);

// Computed labels for dialog
const sourceLabel = computed(() => {
  const labels = { system: 'System', firm: 'Firm', matter: 'Matter' };
  return labels[draggedSource.value] || '';
});

const targetLabel = computed(() => {
  const labels = { system: 'System', firm: 'Firm', matter: 'Matter' };
  return labels[targetZone.value] || '';
});

/**
 * Get category type icon
 */
const getCategoryIcon = (category) => {
  const typeInfo = getCategoryTypeInfo(category.type);
  return typeInfo ? typeInfo.icon : 'mdi-folder';
};

/**
 * Load all categories from all three sources
 */
const loadAllCategories = async () => {
  loading.value = true;
  try {
    const result = await categoryManager.loadAllCategories();
    systemCategories.value = result.systemCategories;
    firmCategories.value = result.firmCategories;
    matterCategories.value = result.matterCategories;

    console.log('[CategoryMigration] Loaded categories:', {
      system: systemCategories.value.length,
      firm: firmCategories.value.length,
      matter: matterCategories.value.length,
    });
  } catch (error) {
    console.error('[CategoryMigration] Failed to load categories:', error);
    showNotification('Failed to load categories: ' + error.message, 'error');
  } finally {
    loading.value = false;
  }
};

/**
 * Handle drag start
 */
const handleDragStart = (category, source) => {
  draggedCategory.value = category;
  draggedSource.value = source;
  console.log('[CategoryMigration] Drag started:', category.name, 'from', source);
};

/**
 * Handle drag end
 */
const handleDragEnd = () => {
  dragOverZone.value = null;
};

/**
 * Handle drag over (allow drop)
 */
const handleDragOver = (zone) => {
  dragOverZone.value = zone;
};

/**
 * Handle drag leave
 */
const handleDragLeave = () => {
  dragOverZone.value = null;
};

/**
 * Handle drop
 */
const handleDrop = (target) => {
  dragOverZone.value = null;

  // Don't allow dropping on the same zone
  if (target === draggedSource.value) {
    showNotification('Category is already in this collection', 'info');
    return;
  }

  // Check for duplicate name in target
  const targetCategories = getTargetCategories(target);
  const duplicate = targetCategories.find(
    (cat) => cat.name.toLowerCase() === draggedCategory.value.name.toLowerCase()
  );

  if (duplicate) {
    showNotification(
      `A category named "${draggedCategory.value.name}" already exists in ${targetLabel.value} collection`,
      'error'
    );
    return;
  }

  // Show confirmation dialog
  targetZone.value = target;
  showConfirmDialog.value = true;
};

/**
 * Get target categories array by zone
 */
const getTargetCategories = (zone) => {
  switch (zone) {
    case 'system':
      return systemCategories.value;
    case 'firm':
      return firmCategories.value;
    case 'matter':
      return matterCategories.value;
    default:
      return [];
  }
};

/**
 * Cancel the move operation
 */
const cancelMove = () => {
  showConfirmDialog.value = false;
  draggedCategory.value = null;
  draggedSource.value = null;
  targetZone.value = null;
};

/**
 * Confirm and execute the move operation
 */
const confirmMove = async () => {
  moving.value = true;
  try {
    // Step 1: Create category in target collection
    await categoryManager.createCategory(draggedCategory.value);

    // Step 2: Delete category from source collection
    await categoryManager.deleteCategory(draggedCategory.value.id, draggedSource.value);

    showNotification(
      `Category "${draggedCategory.value.name}" moved from ${sourceLabel.value} to ${targetLabel.value}`,
      'success'
    );

    // Step 3: Reload all categories
    await loadAllCategories();

    // Close dialog and reset state
    showConfirmDialog.value = false;
    draggedCategory.value = null;
    draggedSource.value = null;
    targetZone.value = null;
  } catch (error) {
    console.error('[CategoryMigration] Failed to move category:', error);
    showNotification('Failed to move category: ' + error.message, 'error');
  } finally {
    moving.value = false;
  }
};

/**
 * Show notification
 */
const showNotification = (message, color = 'success') => {
  snackbar.value = { show: true, message, color };
};

onMounted(() => {
  loadAllCategories();
});
</script>

<style scoped>
.drop-zone {
  min-height: 300px;
  transition: all 0.2s ease;
}

.drop-zone-active {
  background-color: rgba(var(--v-theme-primary), 0.05);
  border: 2px dashed rgba(var(--v-theme-primary), 0.5) !important;
}

.category-chip {
  cursor: move;
  user-select: none;
  transition: all 0.2s ease;
}

.category-chip:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.category-chip:active {
  cursor: grabbing;
  opacity: 0.5;
}
</style>
