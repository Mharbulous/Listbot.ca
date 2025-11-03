<template>
  <div class="thumbnail-panel" :class="{ 'thumbnail-panel--collapsed': !visible }">
    <v-card variant="outlined" class="thumbnail-card">
      <!-- Toggle button -->
      <v-btn
        icon
        variant="text"
        size="small"
        :title="visible ? 'Hide thumbnails' : 'Show thumbnails'"
        class="thumbnail-toggle-btn"
        :class="{ 'thumbnail-toggle-btn--collapsed': !visible }"
        @click="$emit('toggle-visibility')"
      >
        <v-icon>{{ visible ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
      </v-btn>

      <!-- Expanded content -->
      <div v-if="visible" class="thumbnail-content">
        <h3 class="thumbnail-title">Pages</h3>

        <!-- PDF Thumbnails -->
        <PdfThumbnailList
          v-if="isPdfFile && pdfDocument"
          :pdf-document="pdfDocument"
          :total-pages="totalPages"
          :current-page="currentVisiblePage"
          :max-thumbnail-width="150"
          @page-selected="$emit('page-selected', $event)"
        />

        <!-- No PDF loaded -->
        <div v-else class="thumbnail-placeholder-content">
          <v-icon size="48" color="grey-lighten-1">mdi-image-multiple-outline</v-icon>
          <p class="mt-2 text-caption text-grey">
            {{ isPdfFile ? 'Loading thumbnails...' : 'No PDF loaded' }}
          </p>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import PdfThumbnailList from '@/features/organizer/components/PdfThumbnailList.vue';

// Props
defineProps({
  isPdfFile: {
    type: Boolean,
    required: true,
  },
  pdfDocument: {
    type: Object,
    default: null,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  currentVisiblePage: {
    type: Number,
    default: 1,
  },
  visible: {
    type: Boolean,
    default: true,
  },
});

// Events
defineEmits(['toggle-visibility', 'page-selected']);
</script>

<style scoped>
/* Left: Thumbnail panel */
.thumbnail-panel {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.thumbnail-panel--collapsed {
  width: 40px;
}

.thumbnail-panel--collapsed .thumbnail-card {
  overflow: visible;
  min-height: 60px; /* Ensure button has space */
}

.thumbnail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.thumbnail-toggle-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  transition: all 0.3s ease;
}

.thumbnail-toggle-btn--collapsed {
  /* Center the button in the 40px collapsed panel */
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.thumbnail-content {
  padding: 48px 0 16px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.thumbnail-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.thumbnail-placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

/* Responsive layout for tablets and mobile */
@media (max-width: 1150px) {
  .thumbnail-panel {
    width: 100%;
    max-width: 100%;
    order: 3; /* Move to bottom on mobile */
  }

  .thumbnail-panel--collapsed {
    width: 100%;
  }
}
</style>
