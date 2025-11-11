<template>
  <div class="upload-table-header">
    <!-- File Name Column (flexible - expands to fill remaining space) -->
    <div class="header-cell" style="flex: 1; min-width: 150px">File Name</div>

    <!-- Size Column (100px) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Size</div>

    <!-- Folder Path Column (min-width to fit text without wrapping) -->
    <div class="header-cell" style="min-width: 130px; width: 130px; flex-shrink: 0">Folder Path</div>

    <!-- Status Column (100px) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Status</div>

    <!-- Actions Column (100px) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">Actions</div>

    <!-- Remove Column (100px) -->
    <div class="header-cell" style="width: 100px; flex-shrink: 0">
      <span class="sr-only">Remove</span>
    </div>
  </div>
</template>

<script setup>
// Component configuration
defineOptions({
  name: 'UploadTableHeader',
});
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

/* Screen reader only class for accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
