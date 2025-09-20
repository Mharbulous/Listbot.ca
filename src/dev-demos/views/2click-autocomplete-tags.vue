<template>
  <DemoContainer
    title="Tag System Demonstration"
    subtitle="Two Tag Implementation Approaches"
    description="Test functional tag components with real Firestore integration. Compare Locked Categories (fixed options) vs Open Categories (user can create new options)."
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
      <v-alert v-else-if="devTags.categories.value.length === 0 || devTags.testTags.value.length === 0" type="info" class="mb-4">
        <v-icon size="16">mdi-information</v-icon>
        Setting up development environment with original four categories and eight test tags...
      </v-alert>

      <v-row v-else-if="authStore.isAuthenticated">
        <!-- Locked Category Example -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="orange" size="16" class="me-2">mdi-lock</v-icon>
              Locked Category Tags
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-file-document" size="16" class="me-2" />
                <strong class="text-body-2">quarterly-report.pdf</strong>
              </div>

              <div class="tags-container mb-3">
                <EditableTag
                  v-for="tag in lockedCategoryTags"
                  :key="tag.id"
                  :tag="tag"
                  :categoryOptions="getCategoryOptions(tag.categoryId)"
                  :isOpenCategory="false"
                  :tagColor="getTagColor(tag)"
                  @tag-updated="handleTagUpdate"
                  @tag-created="handleTagCreated"
                />
              </div>

              <v-alert color="warning" variant="tonal" density="compact">
                <v-icon size="14">mdi-lock</v-icon>
                Locked Category: Users can only select from existing options
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Open Category Example -->
        <v-col cols="12" md="6">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center">
              <v-icon color="green" size="16" class="me-2">mdi-lock-open-variant</v-icon>
              Open Category Tags
            </v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-3">
                <v-icon icon="mdi-file-document" size="16" class="me-2" />
                <strong class="text-body-2">client-proposal.pdf</strong>
              </div>

              <div class="tags-container mb-3">
                <EditableTag
                  v-for="tag in openCategoryTags"
                  :key="tag.id"
                  :tag="tag"
                  :categoryOptions="getCategoryOptions(tag.categoryId)"
                  :isOpenCategory="true"
                  :tagColor="getTagColor(tag)"
                  @tag-updated="handleTagUpdate"
                  @tag-created="handleTagCreated"
                />
              </div>

              <v-alert color="success" variant="tonal" density="compact">
                <v-icon size="14">mdi-pencil-plus</v-icon>
                Open Category: Type new options and press Enter to add them to Firestore
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
              {{ devTags.categoryCount.value }} categories • {{ devTags.testTagCount.value }} test tags
            </div>
          </div>
          <div class="text-caption text-medium-emphasis">
            <strong>Collections:</strong>
            <code class="text-success">devTesting</code> •
            <code class="text-success">devTestTags</code>
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            Original four categories: Document Type, Priority, Status, Year (with all original options)
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

// Initialize development environment
onMounted(async () => {
  if (authStore.isAuthenticated) {
    cleanup = await devTags.initializeDevEnvironment();
  }
});

// Watch for auth changes and reload development environment
watch(() => authStore.isAuthenticated, async (isAuth) => {
  if (isAuth) {
    cleanup = await devTags.initializeDevEnvironment();
  } else {
    if (cleanup) cleanup();
    devTags.reset();
  }
});

// Cleanup on unmount
onUnmounted(() => {
  if (cleanup) cleanup();
});

// Use reactive test tags from development collections
const lockedCategoryTags = devTags.lockedTestTags;
const openCategoryTags = devTags.openTestTags;


// Helper functions
const getCategoryOptions = devTags.getCategoryOptions;

const getTagColor = (tag) => {
  const categoryIndex = devTags.categories.value.findIndex((cat) => cat.id === tag.categoryId);
  return getAutomaticTagColor(categoryIndex >= 0 ? categoryIndex : 0);
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