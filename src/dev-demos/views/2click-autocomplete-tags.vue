<template>
  <DemoContainer
    title="Tag System Development"
    subtitle="Two Tag Implementation Approaches"
    description="Test functional tag components with real Firestore integration. Compare Fixed List Categories (fixed options) vs Open List Categories (user can create new options)."
    icon="mdi-tag-multiple"
    :tags="['Tag Demo', 'Vue 3', 'EditableTag Component']"
  >
    <div class="max-w-6xl mx-auto">
      <!-- Authentication Check -->
      <v-alert v-if="!authStore.isAuthenticated" type="warning" class="mb-4">
        <v-icon size="16">mdi-account-alert</v-icon>
        Please log in to test the development tag system with Firebase
      </v-alert>

      <!-- Loading State -->
      <v-alert v-else-if="devTags.loading.value" type="info" class="mb-4">
        <v-icon size="16">mdi-loading mdi-spin</v-icon>
        Loading development tag environment...
      </v-alert>

      <!-- Error State -->
      <v-alert v-else-if="devTags.error.value" type="error" class="mb-4">
        <v-icon size="16">mdi-alert-circle</v-icon>
        {{ devTags.error.value }}
      </v-alert>

      <!-- No Data -->
      <v-alert
        v-else-if="devTags.categories.value.length === 0 || devTags.testTags.value.length === 0"
        type="info"
        class="mb-4"
      >
        <v-icon size="16">mdi-information</v-icon>
        Setting up development environment with original four categories and eight test tags...
      </v-alert>

      <v-row v-else-if="authStore.isAuthenticated">
        <!-- Fixed List Example -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="orange" size="16" class="me-2">mdi-lock</v-icon>
              Fixed List Tags
            </v-card-title>
            <v-card-text>

              <div class="tags-container mb-3">
                <EditableTag
                  v-for="tag in fixedListTags"
                  :key="tag.id"
                  :tag="tag"
                  :categoryOptions="getCategoryOptions(tag.tagCategoryId)"
                  :isOpenCategory="getCategoryIsOpen(tag.tagCategoryId)"
                  :tagColor="getTagColor(tag)"
                  @tag-updated="handleTagUpdate"
                  @tag-created="handleTagCreated"
                />
              </div>

              <v-alert color="warning" variant="tonal" density="compact">
                <v-icon size="14">mdi-lock</v-icon>
                Fixed List Category: Users can only select from existing options
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Open List Example -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="green" size="16" class="me-2">mdi-lock-open-variant</v-icon>
              Open List Tags
            </v-card-title>
            <v-card-text>

              <div class="tags-container mb-3">
                <EditableTag
                  v-for="tag in openListTags"
                  :key="tag.id"
                  :tag="tag"
                  :categoryOptions="getCategoryOptions(tag.tagCategoryId)"
                  :isOpenCategory="getCategoryIsOpen(tag.tagCategoryId)"
                  :tagColor="getTagColor(tag)"
                  @tag-updated="handleTagUpdate"
                  @tag-created="handleTagCreated"
                />
              </div>

              <v-alert color="success" variant="tonal" density="compact">
                <v-icon size="14">mdi-pencil-plus</v-icon>
                Open List Category: Type new options and press Enter to add them to Firestore
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Development Environment Status -->
      <v-card v-if="authStore.isAuthenticated" class="mt-4" variant="outlined">
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <v-icon color="green" size="16" class="me-2">mdi-database-check</v-icon>
              <strong class="text-body-2">Development Tag Environment</strong>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ devTags.categoryCount.value }} categories • {{ devTags.testTagCount.value }} test
              tags
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">
            <strong>Collections:</strong>
            <code class="text-success">devTesting</code> •
            <code class="text-success">devTesting/config/TestTags</code>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Eight separate categories: Fixed List (locked options) and Open List (editable options) for Document Type, Priority, Status, Year
          </div>

          <!-- Force Recreate Button -->
          <div class="mt-3">
            <v-btn
              @click="handleForceRecreate"
              color="warning"
              variant="outlined"
              size="small"
              prepend-icon="mdi-refresh"
              :loading="recreating"
            >
              Force Recreate Demo Data
            </v-btn>
            <div class="text-caption text-medium-emphasis mt-1">
              Click to recreate demo with independent Fixed/Open categories
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </DemoContainer>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import DemoContainer from '../components/DemoContainer.vue';
import EditableTag from '@/components/features/tags/EditableTag.vue';
import { getAutomaticTagColor } from '@/features/organizer/utils/automaticTagColors.js';
import { useDevTags } from '../composables/useDevTags.js';
import { useAuthStore } from '../../core/stores/auth.js';

// Development tag integration
const devTags = useDevTags();
const authStore = useAuthStore();

// Cleanup function for listeners
let cleanup = null;

// State for recreate button
const recreating = ref(false);

// Initialize development environment on page load
// Uses smart detection to only recreate if data structure is incompatible
onMounted(async () => {
  if (authStore.isAuthenticated) {
    // Normal initialization - preserves existing compatible data
    cleanup = await devTags.initializeDevEnvironment(false);
  }
});

// Handle force recreate button
const handleForceRecreate = async () => {
  try {
    recreating.value = true;
    console.log('Force recreating demo data...');

    if (cleanup) cleanup();
    cleanup = await devTags.forceRecreateDemo();

    console.log('Demo data recreated successfully');
  } catch (error) {
    console.error('Failed to recreate demo data:', error);
  } finally {
    recreating.value = false;
  }
};

// Watch for auth changes and reload development environment
watch(
  () => authStore.isAuthenticated,
  async (isAuth) => {
    if (isAuth) {
      cleanup = await devTags.initializeDevEnvironment();
    } else {
      if (cleanup) cleanup();
      devTags.reset();
    }
  }
);

// Cleanup on unmount
onUnmounted(() => {
  if (cleanup) cleanup();
});

// Use reactive test tags from development collections
const fixedListTags = devTags.fixedListTestTags;
const openListTags = devTags.openListTestTags;

// Helper functions
const getCategoryOptions = devTags.getCategoryOptions;

const getTagColor = (tag) => {
  // First try to get color from category
  const category = devTags.categories.value.find((cat) => cat.id === tag.tagCategoryId);
  if (category?.color) {
    return category.color;
  }

  // Fallback to triadic pattern based on category index
  const categoryIndex = devTags.categories.value.findIndex((cat) => cat.id === tag.tagCategoryId);
  return getAutomaticTagColor(categoryIndex >= 0 ? categoryIndex : 0);
};

const getCategoryIsOpen = (categoryId) => {
  const category = devTags.categories.value.find((cat) => cat.id === categoryId);
  return category?.isOpen || false;
};

// Use event handlers from development composable
const handleTagUpdate = devTags.handleTagUpdate;
const handleTagCreated = devTags.handleTagCreated;
</script>

<style scoped>
.tags-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-height: 40px;
}
</style>
