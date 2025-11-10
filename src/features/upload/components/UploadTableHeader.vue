<template>
  <div class="upload-table-header">
    <!-- Actions Column (100px) -->
    <div class="header-cell" style="width: 100px">Actions</div>

    <!-- File Name Column (300px) -->
    <div class="header-cell" style="width: 300px">File Name</div>

    <!-- Size Column (100px) -->
    <div class="header-cell" style="width: 100px">Size</div>

    <!-- Status Column (100px) -->
    <div class="header-cell" style="width: 100px">Status</div>

    <!-- Folder Path Column (300px) -->
    <div class="header-cell" style="width: 300px">Folder Path</div>

    <!-- Cancel Column (100px) - Clear Queue Button -->
    <div class="header-cell clear-queue-cell" style="width: 100px">
      <v-btn color="error" variant="outlined" size="x-small" @click="handleClearQueue"> Clear Queue </v-btn>
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

// Handle clear queue
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
  flex-shrink: 0;
}

.header-cell:last-child {
  border-right: none;
}

.clear-queue-cell {
  justify-content: center;
}
</style>
