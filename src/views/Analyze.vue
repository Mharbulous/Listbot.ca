<template>
  <div class="analyze-mockup-page" style="min-width: 0">
    <!-- Scrollable container fills viewport -->
    <div ref="scrollContainer" class="scroll-container">
      <!-- Sticky Table Header -->
      <div class="table-mockup-header">
        <div class="header-cell" style="width: 80px">
          <span class="header-label">File Type</span>
          <div class="dimension-label">80px</div>
        </div>
        <div class="header-cell" style="width: 300px">
          <span class="header-label">File Name</span>
          <div class="dimension-label">minmax(200px, 2fr)</div>
        </div>
        <div class="header-cell" style="width: 100px">
          <span class="header-label">Size</span>
          <div class="dimension-label">100px</div>
        </div>
        <div class="header-cell" style="width: 120px">
          <span class="header-label">Date</span>
          <div class="dimension-label">120px</div>
        </div>
        <div class="header-cell" style="width: 140px">
          <span class="header-label">Privilege</span>
          <div class="dimension-label">140px</div>
        </div>
        <div class="header-cell" style="width: 250px">
          <span class="header-label">Description</span>
          <div class="dimension-label">minmax(150px, 2fr)</div>
        </div>
        <div class="header-cell" style="width: 200px">
          <span class="header-label">Document Type</span>
          <div class="dimension-label">minmax(120px, 1.5fr)</div>
        </div>
        <div class="header-cell" style="width: 180px">
          <span class="header-label">Author</span>
          <div class="dimension-label">minmax(120px, 1.5fr)</div>
        </div>
        <div class="header-cell" style="width: 180px">
          <span class="header-label">Custodian</span>
          <div class="dimension-label">minmax(120px, 1.5fr)</div>
        </div>
        <div class="header-cell" style="width: 150px">
          <span class="header-label">Created Date</span>
          <div class="dimension-label">120px</div>
        </div>
        <div class="header-cell" style="width: 150px">
          <span class="header-label">Modified Date</span>
          <div class="dimension-label">120px</div>
        </div>
        <div class="header-cell" style="width: 120px">
          <span class="header-label">Status</span>
          <div class="dimension-label">120px</div>
        </div>
        <div class="header-cell column-selector-cell">
          <button class="column-selector-btn" @click="showColumnSelector = !showColumnSelector">
            <span>Cols</span>
            <span class="dropdown-icon">▼</span>
          </button>
          <div class="annotation">Column Selector</div>
        </div>

        <!-- Column Selector Popover (Mockup) -->
        <div v-if="showColumnSelector" class="column-selector-popover">
          <div class="popover-header">Column Visibility</div>
          <label class="column-option">
            <input type="checkbox" checked /> File Type
          </label>
          <label class="column-option required">
            <input type="checkbox" checked disabled /> File Name
            <span class="required-badge">required</span>
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> File Size
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> Document Date
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> Privilege
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> Description
          </label>
          <label class="column-option">
            <input type="checkbox" /> Document Type
          </label>
          <label class="column-option">
            <input type="checkbox" /> Author
          </label>
          <label class="column-option">
            <input type="checkbox" /> Custodian
          </label>
          <div class="popover-footer">
            <button class="reset-btn">Reset to Defaults</button>
          </div>
        </div>
      </div>

      <!-- Scrollable Table Body -->
      <div class="table-mockup-body">
        <!-- Sample Rows (50+ to ensure vertical scrolling) -->
        <div v-for="i in 50" :key="i" class="table-mockup-row" :class="{ even: i % 2 === 0 }">
          <div class="row-cell" style="width: 80px">
            <span class="badge badge-pdf">PDF</span>
          </div>
          <div class="row-cell" style="width: 300px">contract_{{ i }}_2024.pdf</div>
          <div class="row-cell" style="width: 100px">{{ (Math.random() * 5).toFixed(1) }}MB</div>
          <div class="row-cell" style="width: 120px">2024-10-{{ String(i).padStart(2, '0') }}</div>
          <div class="row-cell" style="width: 140px">
            <span class="badge badge-privilege">Privileged</span>
          </div>
          <div class="row-cell" style="width: 250px">Sample document description text...</div>
          <div class="row-cell" style="width: 200px">
            <span class="badge badge-doctype">Contract</span>
          </div>
          <div class="row-cell" style="width: 180px">John Smith</div>
          <div class="row-cell" style="width: 180px">Legal Dept.</div>
          <div class="row-cell" style="width: 150px">2024-09-{{ String(i).padStart(2, '0') }}</div>
          <div class="row-cell" style="width: 150px">2024-10-{{ String(i).padStart(2, '0') }}</div>
          <div class="row-cell" style="width: 120px">
            <span class="badge badge-status">Active</span>
          </div>
        </div>

        <!-- Virtualization Note -->
        <div class="virtualization-note">
          <div class="note-icon">⚡</div>
          <div class="note-content">
            <strong>Virtual Scrolling Active</strong>
            <p>Only ~20 rows rendered at once (10,000+ row support)</p>
            <p>Columns can also be virtualized if needed</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';

const showColumnSelector = ref(false);
const scrollContainer = ref(null);
</script>

<style scoped>
/* Page Container - Full viewport height minus header */
.analyze-mockup-page {
  height: calc(100vh - 80px); /* Full viewport height minus AppHeader (pt-20 = 80px) */
  width: 100%; /* Full width of parent */
  background: white;
  overflow: hidden; /* Prevent page-level scrolling */
  display: flex;
  flex-direction: column;
}

/* Scroll Container - Fills available space, provides scrolling */
.scroll-container {
  flex: 1; /* Fill available vertical space */
  overflow: auto; /* Browser's native scrollbars for both directions */
  position: relative;
  /* Remove width constraint to allow horizontal scrolling */
  min-width: 0; /* Allow flex child to shrink below content size */
}

/* Sticky Header - Sticks within scroll container */
.table-mockup-header {
  position: sticky;
  top: 0; /* Stick to top of scroll container */
  z-index: 10;
  display: flex;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
  width: max-content; /* Expand to table width */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-cell {
  padding: 12px 16px;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  position: relative;
  flex-shrink: 0;
}

.header-label {
  font-weight: 600;
  font-size: 12px;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dimension-label {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 4px;
  font-family: monospace;
}

.column-selector-cell {
  width: 100px;
  background: #fef3c7;
  border: 2px dashed #f59e0b;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.column-selector-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
}

.column-selector-btn:hover {
  background: #f9fafb;
  border-color: #667eea;
}

.dropdown-icon {
  font-size: 10px;
}

.annotation {
  position: absolute;
  bottom: 2px;
  font-size: 9px;
  color: #f59e0b;
  font-weight: 600;
}

/* Column Selector Popover */
.column-selector-popover {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 2px solid #667eea;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 12px;
  min-width: 220px;
  z-index: 1000;
  margin-top: 8px;
}

.popover-header {
  font-weight: 600;
  font-size: 13px;
  color: #374151;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.column-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: #374151;
}

.column-option:hover {
  background: #f3f4f6;
}

.column-option.required {
  background: #fef3c7;
}

.required-badge {
  margin-left: auto;
  font-size: 10px;
  color: #f59e0b;
  font-weight: 600;
}

.popover-footer {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.reset-btn {
  width: 100%;
  padding: 6px 12px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.reset-btn:hover {
  background: #e5e7eb;
}

/* Scroll Annotations */
.scroll-annotation {
  position: fixed;
  background: #667eea;
  color: white;
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  z-index: 20;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.header-annotation {
  top: 90px;
  right: 80px;
}

/* Table Body - Expands to content width */
.table-mockup-body {
  background: white;
  width: max-content; /* Match header width exactly */
}

.table-mockup-row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  min-height: 48px;
  align-items: center;
  width: max-content; /* Ensure rows expand to full width */
}

.table-mockup-row.even {
  background: #f9fafb;
}

.table-mockup-row:hover {
  background: #f3f4f6;
}

.row-cell {
  padding: 12px 16px;
  border-right: 1px solid #e5e7eb;
  font-size: 13px;
  color: #374151;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.badge-pdf {
  background: #fee2e2;
  color: #991b1b;
}

.badge-privilege {
  background: #dbeafe;
  color: #1e40af;
}

.badge-doctype {
  background: #ddd6fe;
  color: #5b21b6;
}

.badge-status {
  background: #d1fae5;
  color: #065f46;
}

/* Virtualization Note */
.virtualization-note {
  margin: 40px 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
  border: 2px dashed #667eea;
  border-radius: 8px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  max-width: 800px;
}

.note-icon {
  font-size: 32px;
}

.note-content {
  flex: 1;
}

.note-content strong {
  display: block;
  color: #667eea;
  font-size: 16px;
  margin-bottom: 8px;
}

.note-content p {
  margin: 4px 0;
  font-size: 13px;
  color: #6b7280;
}

/* Custom scrollbar styling for scroll container */
.scroll-container::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.scroll-container::-webkit-scrollbar-track {
  background: #f3f4f6;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 6px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.scroll-container::-webkit-scrollbar-corner {
  background: #f3f4f6;
}
</style>
