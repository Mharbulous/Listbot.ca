<template>
  <div class="thumbnail-panel">
    <v-card variant="outlined" class="thumbnail-card">
      <!-- Card header with toggle button -->
      <div class="thumbnail-card-header">
        <h3 class="thumbnail-title">Thumbnails</h3>
        <v-btn
          icon
          variant="text"
          size="small"
          :title="visible ? 'Hide thumbnails' : 'Show thumbnails'"
          class="toggle-btn"
          @click="$emit('toggle-visibility')"
        >
          <v-icon>{{ visible ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
        </v-btn>
      </div>

      <!-- Expanded content -->
      <div v-if="visible" class="thumbnail-content">

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
}

.thumbnail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.thumbnail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  min-height: 56px;
}



.toggle-btn {
  flex-shrink: 0;
}

.toggle-btn:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.thumbnail-content {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.thumbnail-title {
  font-size: 1rem;
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
}
</style>
