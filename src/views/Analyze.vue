<template>
  <div class="analyze-mockup-page" style="min-width: 0">
    <!-- Scrollable container fills viewport -->
    <div ref="scrollContainer" class="scroll-container">
      <!-- Sticky Table Header -->
      <div class="table-mockup-header">
        <div class="header-cell" :style="{ width: columnWidths.fileType + 'px' }">
          <span class="header-label">File Type</span>
          <div class="resize-handle" @mousedown="startResize('fileType', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.fileName + 'px' }">
          <span class="header-label">File Name</span>
          <div class="resize-handle" @mousedown="startResize('fileName', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.size + 'px' }">
          <span class="header-label">Size</span>
          <div class="resize-handle" @mousedown="startResize('size', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.date + 'px' }">
          <span class="header-label">Date</span>
          <div class="resize-handle" @mousedown="startResize('date', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.privilege + 'px' }">
          <span class="header-label">Privilege</span>
          <div class="resize-handle" @mousedown="startResize('privilege', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.description + 'px' }">
          <span class="header-label">Description</span>
          <div class="resize-handle" @mousedown="startResize('description', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.documentType + 'px' }">
          <span class="header-label">Document Type</span>
          <div class="resize-handle" @mousedown="startResize('documentType', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.author + 'px' }">
          <span class="header-label">Author</span>
          <div class="resize-handle" @mousedown="startResize('author', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.custodian + 'px' }">
          <span class="header-label">Custodian</span>
          <div class="resize-handle" @mousedown="startResize('custodian', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.createdDate + 'px' }">
          <span class="header-label">Created Date</span>
          <div class="resize-handle" @mousedown="startResize('createdDate', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.modifiedDate + 'px' }">
          <span class="header-label">Modified Date</span>
          <div class="resize-handle" @mousedown="startResize('modifiedDate', $event)"></div>
        </div>
        <div class="header-cell" :style="{ width: columnWidths.status + 'px' }">
          <span class="header-label">Status</span>
          <div class="resize-handle" @mousedown="startResize('status', $event)"></div>
        </div>
        <div class="header-cell column-selector-cell">
          <button class="column-selector-btn" @click="showColumnSelector = !showColumnSelector">
            <span>Cols</span>
            <span class="dropdown-icon">▼</span>
          </button>
        </div>

        <!-- Column Selector Popover (Mockup) -->
        <div
          v-if="showColumnSelector"
          ref="columnSelectorPopover"
          class="column-selector-popover"
          tabindex="0"
          @focusout="handleFocusOut"
        >
          <div class="popover-header">Show/Hide Columns</div>
          <label class="column-option">
            <input type="checkbox" checked /> File Type
          </label>
          <label class="column-option">
            <input type="checkbox" checked /> File Name
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
          <div class="row-cell" :style="{ width: columnWidths.fileType + 'px' }">
            <span class="badge badge-pdf">PDF</span>
          </div>
          <div class="row-cell" :style="{ width: columnWidths.fileName + 'px' }">contract_{{ i }}_2024.pdf</div>
          <div class="row-cell" :style="{ width: columnWidths.size + 'px' }">{{ (Math.random() * 5).toFixed(1) }}MB</div>
          <div class="row-cell" :style="{ width: columnWidths.date + 'px' }">2024-10-{{ String(i).padStart(2, '0') }}</div>
          <div class="row-cell" :style="{ width: columnWidths.privilege + 'px' }">
            <span class="badge badge-privilege">Privileged</span>
          </div>
          <div class="row-cell" :style="{ width: columnWidths.description + 'px' }">{{ getDescription(i) }}</div>
          <div class="row-cell" :style="{ width: columnWidths.documentType + 'px' }">
            <span class="badge badge-doctype">Contract</span>
          </div>
          <div class="row-cell" :style="{ width: columnWidths.author + 'px' }">John Smith</div>
          <div class="row-cell" :style="{ width: columnWidths.custodian + 'px' }">Legal Dept.</div>
          <div class="row-cell" :style="{ width: columnWidths.createdDate + 'px' }">2024-09-{{ String(i).padStart(2, '0') }}</div>
          <div class="row-cell" :style="{ width: columnWidths.modifiedDate + 'px' }">2024-10-{{ String(i).padStart(2, '0') }}</div>
          <div class="row-cell" :style="{ width: columnWidths.status + 'px' }">
            <span class="badge badge-status">Active</span>
          </div>
        </div>
      </div>

      <!-- Footer with document count -->
      <div class="table-footer" :style="{ minWidth: totalTableWidth + 'px' }">
        <span>Total Documents: 50</span>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);

// Column resize constants
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;
const STORAGE_KEY = 'analyze-column-widths';

// Default column widths
const defaultColumnWidths = {
  fileType: 80,
  fileName: 300,
  size: 100,
  date: 120,
  privilege: 140,
  description: 250,
  documentType: 200,
  author: 180,
  custodian: 180,
  createdDate: 150,
  modifiedDate: 150,
  status: 120
};

// Reactive column widths
const columnWidths = ref({ ...defaultColumnWidths });

// Resize state
const resizeState = ref({
  isResizing: false,
  columnKey: null,
  startX: 0,
  startWidth: 0
});

// Load column widths from localStorage
const loadColumnWidths = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      columnWidths.value = { ...defaultColumnWidths, ...parsed };
    }
  } catch (error) {
    console.error('Error loading column widths:', error);
  }
};

// Save column widths to localStorage
const saveColumnWidths = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnWidths.value));
  } catch (error) {
    console.error('Error saving column widths:', error);
  }
};

// Start column resize
const startResize = (columnKey, event) => {
  resizeState.value = {
    isResizing: true,
    columnKey,
    startX: event.pageX,
    startWidth: columnWidths.value[columnKey]
  };

  // Prevent text selection during drag
  event.preventDefault();
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'col-resize';
};

// Handle column resize
const handleResize = (event) => {
  if (!resizeState.value.isResizing) return;

  const delta = event.pageX - resizeState.value.startX;
  const newWidth = resizeState.value.startWidth + delta;

  // Apply min/max constraints
  const constrainedWidth = Math.max(
    MIN_COLUMN_WIDTH,
    Math.min(MAX_COLUMN_WIDTH, newWidth)
  );

  columnWidths.value[resizeState.value.columnKey] = constrainedWidth;
};

// End column resize
const endResize = () => {
  if (resizeState.value.isResizing) {
    saveColumnWidths();
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }

  resizeState.value = {
    isResizing: false,
    columnKey: null,
    startX: 0,
    startWidth: 0
  };
};

// Generate varied descriptions for testing
const getDescription = (index) => {
  const descriptions = [
    'Initial consultation agreement outlining scope of legal services and fee structure for corporate merger transaction',
    'Amendment to service agreement modifying payment terms and deliverable schedules',
    'Comprehensive quarterly financial report including income statements, balance sheets, and cash flow analysis',
    'Internal memorandum regarding compliance requirements for upcoming regulatory audit',
    'Client correspondence discussing strategy for pending litigation matter with multiple defendants',
    'Draft settlement agreement for intellectual property dispute involving patent infringement claims',
    'Meeting minutes from board of directors quarterly review session covering strategic initiatives',
    'Due diligence report analyzing potential risks and liabilities for proposed acquisition target',
    'Employment contract with non-compete and confidentiality provisions for senior executive position',
    'Research memorandum analyzing recent case law developments affecting securities regulations'
  ];
  return descriptions[index % descriptions.length];
};

// Calculate total table width dynamically
const totalTableWidth = computed(() => {
  return Object.values(columnWidths.value).reduce((sum, width) => sum + width, 0);
});

// Auto-focus popover when it opens
watch(showColumnSelector, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    columnSelectorPopover.value?.focus();
  }
});

// Handle focus leaving the popover
const handleFocusOut = (event) => {
  // Only close if focus is leaving the popover entirely (not moving to a child element)
  if (!event.relatedTarget || !columnSelectorPopover.value?.contains(event.relatedTarget)) {
    showColumnSelector.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  loadColumnWidths();
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', endResize);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', endResize);
});
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
  outline: none; /* Remove default focus outline since we have custom border */
}

.column-selector-popover:focus {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
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

/* Table Footer */
.table-footer {
  background: #1e293b; /* Dark blue slate */
  color: white;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 500;
  border-top: 2px solid #0f172a;
  /* min-width is set dynamically via inline style */
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

/* Column Resize Handle */
.resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 8px;
  cursor: col-resize;
  user-select: none;
  z-index: 1;
}

.resize-handle:hover {
  background: #667eea;
  opacity: 0.3;
}

.resize-handle:active {
  background: #667eea;
  opacity: 0.5;
}
</style>
