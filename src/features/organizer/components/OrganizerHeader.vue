<template>
  <div class="organizer-header">
    <!-- Search and filter controls -->
    <div class="search-controls">
      <v-text-field
        :model-value="searchText"
        placeholder="Search files by name or tags..."
        variant="outlined"
        density="compact"
        prepend-inner-icon="mdi-magnify"
        hide-details
        clearable
        class="search-field"
        @update:model-value="$emit('update:searchText', $event)"
        @input="$emit('search', $event.target.value)"
      />
      <div class="filter-stats">
        <v-chip
          v-if="filteredCount !== evidenceCount"
          size="small"
          variant="outlined"
          color="primary"
        >
          {{ filteredCount }} of {{ evidenceCount }} documents
        </v-chip>
        <v-chip v-else size="small" variant="text" color="medium-emphasis">
          {{ evidenceCount }} documents
        </v-chip>
      </div>
      <div class="header-controls">
        <v-btn color="primary" variant="outlined" size="small" @click="$emit('manage-categories')">
          <v-icon start>mdi-cog</v-icon>
          Manage Categories
        </v-btn>
        <ViewModeToggle :loading="false" @view-mode-changed="$emit('view-mode-changed', $event)" />
      </div>
    </div>
  </div>
</template>

<script setup>
import ViewModeToggle from './ViewModeToggle.vue';

// Props
defineProps({
  searchText: {
    type: String,
    default: '',
  },
  evidenceCount: {
    type: Number,
    default: 0,
  },
  filteredCount: {
    type: Number,
    default: 0,
  },
});

// Emits
defineEmits(['update:searchText', 'search', 'manage-categories', 'view-mode-changed']);
</script>

<style scoped>
.organizer-header {
  flex-shrink: 0;
  padding: 24px 32px;
  border-bottom: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgb(var(--v-theme-surface));
}

.search-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-field {
  flex: 1;
  max-width: 400px;
}

.filter-stats {
  flex-shrink: 0;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .organizer-header {
    padding: 16px 20px;
  }

  .search-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .search-field {
    max-width: none;
  }

  .header-controls {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
