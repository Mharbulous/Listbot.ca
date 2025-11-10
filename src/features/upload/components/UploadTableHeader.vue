<template>
  <div class="upload-table-header">
    <!-- Actions Column (100px - matches CLEAR column) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Actions</div>

    <!-- Size Column (100px) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Size</div>

    <!-- File Name Column (flexible - expands to fill remaining space) -->
    <div class="header-cell" style="flex: 1; min-width: 150px">File Name</div>

    <!-- Folder Path Column (min-width to fit text without wrapping) -->
    <div class="header-cell" style="min-width: 130px; width: 130px; flex-shrink: 0">Folder Path</div>

    <!-- Status Column (100px) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Status</div>

    <!-- Cancel Column (100px - CLEAR button) -->
    <div class="header-cell clear-queue-cell" style="width: 100px; flex-shrink: 0">
      <v-btn
        color="error"
        variant="outlined"
        size="small"
        class="clear-btn"
        @click="handleClearQueue"
      >
        CLEAR
      </v-btn>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'UploadTableHeader',
});

// Emits
const emit = defineEmits(['clear-queue']);

// Handle CLEAR
const handleClearQueue = () => {
  emit('clear-queue');
};
</script>

<style scoped>
.upload-table-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-cell {
  padding: 12px 16px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-cell:last-child {
  border-right: none;
}

.clear-queue-cell {
  justify-content: center;
}

.clear-btn {
  padding-left: 0 !important;
  padding-right: 0 !important;
  font-size: 0.875rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.05em !important;
}
</style>
