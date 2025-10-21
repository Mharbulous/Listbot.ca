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
import { ref, nextTick, watch } from 'vue';
import { useColumnResize } from '@/composables/useColumnResize';
import { getDescription } from '@/utils/analyzeMockData';

// Column selector and refs
const showColumnSelector = ref(false);
const scrollContainer = ref(null);
const columnSelectorPopover = ref(null);

// Use column resize composable
const { columnWidths, totalTableWidth, startResize } = useColumnResize();

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
</script>

<style scoped src="./Analyze.css"></style>
