<template>
  <div class="import-tabs-sticky px-6">
    <div class="tabs-container">
      <!-- Import tabs (left-aligned) - wrapped in containers that shrink -->
      <div
        v-for="(tab, index) in leftImportTabs"
        :key="tab.value"
        class="tab-wrapper"
        :class="{ 'last-tab-wrapper': index === leftImportTabs.length - 1 }"
        :style="getTabWrapperStyle(tab.value)"
      >
        <button
          @click="selectTab(tab.value)"
          @mouseenter="setHoveredTab(tab.value)"
          @mouseleave="clearHoveredTab"
          class="folder-tab import-tab"
          :class="getTabStateClass(tab.value)"
        >
          <div class="tab-content">
            <div class="tab-icon">{{ tab.icon }}</div>
            <div class="tab-title">{{ tab.label }}</div>
          </div>
        </button>
      </div>

      <!-- Super spacer to absorb extra space and push Confirm Import tab to the right -->
      <div class="super-spacer"></div>

      <!-- Confirm Import tab (right-aligned, never shrinks) -->
      <div class="confirm-tab-wrapper" :style="getTabWrapperStyle('confirm-import')">
        <button
          @click="selectTab('confirm-import')"
          @mouseenter="setHoveredTab('confirm-import')"
          @mouseleave="clearHoveredTab"
          class="folder-tab import-tab"
          :class="getTabStateClass('confirm-import')"
        >
          <div class="tab-content">
            <div class="tab-icon">✅</div>
            <div class="tab-title">Confirm Import</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// ============================================================================
// CONSTANTS
// ============================================================================

const Z_INDEX_ACTIVE = 100;
const Z_INDEX_HOVERED = 99;
const CONFIRM_IMPORT_TAB_ID = 'confirm-import';

const leftImportTabs = [
  {
    value: 'folder',
    label: 'Import from Folders',
    icon: '📁',
  },
  {
    value: 'document',
    label: 'Import from Matter List',
    icon: '📄',
  },
  {
    value: 'map-fields',
    label: 'Map Fields with AI',
    icon: '🤖',
  },
  {
    value: 'review-mappings',
    label: 'Review Field Mappings',
    icon: '🔍',
  },
];

// ============================================================================
// PROPS & EMITS
// ============================================================================

const props = defineProps({
  modelValue: {
    type: String,
    default: 'folder',
  },
});

const emit = defineEmits(['update:modelValue']);

// ============================================================================
// STATE
// ============================================================================

const hoveredTabId = ref(null);

// ============================================================================
// TAB SELECTION
// ============================================================================

const selectTab = (tabValue) => {
  emit('update:modelValue', tabValue);
};

// ============================================================================
// HOVER STATE
// ============================================================================

const setHoveredTab = (tabId) => {
  hoveredTabId.value = tabId;
};

const clearHoveredTab = () => {
  hoveredTabId.value = null;
};

// ============================================================================
// TAB STATE HELPERS
// ============================================================================

const isActive = (tabId) => props.modelValue === tabId;

const isHovered = (tabId) => hoveredTabId.value === tabId;

const getTabStateClass = (tabId) => {
  return isActive(tabId) ? 'folder-tab-active' : 'folder-tab-inactive';
};

// ============================================================================
// TAB STYLING (CSS-only adaptive approach)
// ============================================================================

const getTabWrapperStyle = (tabId) => {
  // Calculate z-index for the wrapper - this controls stacking order
  let zIndex = 1;
  if (isActive(tabId)) {
    zIndex = Z_INDEX_ACTIVE;
  } else if (isHovered(tabId)) {
    zIndex = Z_INDEX_HOVERED;
  } else {
    // Find the index for non-active, non-hovered tabs
    const tabIndex = leftImportTabs.findIndex((t) => t.value === tabId);
    if (tabIndex !== -1) {
      zIndex = tabIndex + 1;
    } else if (tabId === CONFIRM_IMPORT_TAB_ID) {
      // Confirm Import tab gets a base z-index
      zIndex = 50;
    }
  }

  return { zIndex };
};
</script>

<style scoped>
/* ========================================================================== */
/* CONTAINER                                                                  */
/* ========================================================================== */

.import-tabs-sticky {
  position: sticky;
  top: 0;
  z-index: 50; /* Higher than content-container (25) so active tab appears in front */
  background: transparent;
  padding-bottom: 0;
}

.tabs-container {
  height: 80px;
  overflow: visible;
  display: flex;
  align-items: flex-end;
  width: 100%;
  position: relative;
}

/* ========================================================================== */
/* TAB WRAPPERS - These shrink while buttons stay fixed, creating overlap    */
/* ========================================================================== */

.tab-wrapper {
  position: relative;
  flex-shrink: 1;
  flex-basis: 220px;
  min-width: 0; /* Allows shrinking below content size - KEY for overlap! */
  margin-right: 8px;
}

/* Last tab wrapper has a minimum width floor to prevent complete collapse */
.last-tab-wrapper {
  min-width: 140px;
}

/* Hover and focus bring tab wrapper to front */
.tab-wrapper:hover,
.tab-wrapper:has(:focus-visible) {
  z-index: 100 !important;
}

/* Confirm Import tab wrapper - never shrinks */
.confirm-tab-wrapper {
  position: relative;
  flex-shrink: 0;
}

.confirm-tab-wrapper:hover,
.confirm-tab-wrapper:has(:focus-visible) {
  z-index: 100 !important;
}

/* ========================================================================== */
/* SUPER SPACER - Absorbs extra space and pushes Confirm Import to the right */
/* ========================================================================== */

.super-spacer {
  flex-grow: 1;
  flex-shrink: 10000;
  min-width: 0;
}

/* ========================================================================== */
/* BASE FOLDER TAB STYLES                                                     */
/* ========================================================================== */

.folder-tab {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border: 1px solid #cbd5e1;
  border-bottom: none;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
}

/* ========================================================================== */
/* IMPORT TAB - FIXED WIDTH (doesn't shrink, creates overlap)                */
/* ========================================================================== */

.import-tab {
  height: 64px;
  width: 220px; /* FIXED width - does NOT shrink! */
}

/* ========================================================================== */
/* TAB CONTENT                                                                */
/* ========================================================================== */

.tab-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  width: 100%;
}

.tab-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tab-title {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

/* ========================================================================== */
/* ACTIVE TAB STATE                                                           */
/* ========================================================================== */

.folder-tab-active {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 90%, #e0f2fe 100%);
  color: #0f172a;
  transform: translateY(5px);
  border-color: #cbd5e1;
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}

/* ========================================================================== */
/* INACTIVE TAB STATE                                                         */
/* ========================================================================== */

.folder-tab-inactive {
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  transform: translateY(8px);
  border-color: #cbd5e1;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

/* ========================================================================== */
/* HOVER STATE                                                                */
/* ========================================================================== */

.folder-tab-inactive:hover {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  transform: translateY(6px);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.07);
}

/* ========================================================================== */
/* ADJACENT ACTIVE TABS                                                       */
/* ========================================================================== */

.folder-tab-active + .folder-tab-active {
  margin-left: -1px;
}
</style>
