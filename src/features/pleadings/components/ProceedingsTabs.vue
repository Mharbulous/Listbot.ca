<template>
  <div class="proceedings-tabs-sticky px-6">
    <div class="tabs-container">
      <!-- Proceeding tabs (left-aligned) - wrapped in containers that shrink -->
      <div
        v-for="(proceeding, index) in proceedings"
        :key="proceeding.id"
        class="tab-wrapper"
        :class="{ 'last-tab-wrapper': index === proceedings.length - 1 }"
        :style="getTabWrapperStyle(proceeding.id)"
      >
        <button
          @click="selectTab(proceeding.id)"
          @mouseenter="setHoveredTab(proceeding.id)"
          @mouseleave="clearHoveredTab"
          class="folder-tab proceeding-tab"
          :class="getTabStateClass(proceeding.id)"
        >
          <div class="tab-content">
            <div class="tab-title">{{ proceeding.styleCause }}</div>
            <div class="tab-subtitle">
              {{ proceeding.venue }} • {{ proceeding.registry }} • {{ proceeding.courtFileNo }}
            </div>
          </div>
        </button>
      </div>

      <!-- Super spacer to absorb extra space and push ALL tab to the right -->
      <div class="super-spacer"></div>

      <!-- ALL tab (right-aligned, never shrinks) -->
      <div class="all-tab-wrapper" :style="getTabWrapperStyle(null)">
        <button
          @click="selectTab(null)"
          @mouseenter="setHoveredTab(ALL_TAB_ID)"
          @mouseleave="clearHoveredTab"
          class="folder-tab all-tab"
          :class="getTabStateClass(null)"
        >
          ALL
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
const ALL_TAB_ID = 'all';

// ============================================================================
// PROPS & EMITS
// ============================================================================

const props = defineProps({
  proceedings: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

// ============================================================================
// STATE
// ============================================================================

const hoveredTabId = ref(null);

// ============================================================================
// COMPUTED
// ============================================================================

const proceedingCount = computed(() => props.proceedings.length);

// ============================================================================
// TAB SELECTION
// ============================================================================

const selectTab = (proceedingId) => {
  emit('update:modelValue', proceedingId);
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
    const proceedingIndex = props.proceedings.findIndex((p) => p.id === tabId);
    if (proceedingIndex !== -1) {
      zIndex = proceedingIndex + 1;
    } else if (tabId === null) {
      // ALL tab gets a base z-index
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

.proceedings-tabs-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
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

/* Last proceeding tab wrapper has a minimum width floor to prevent complete collapse */
.last-tab-wrapper {
  min-width: 140px;
}

/* Hover and focus bring tab wrapper to front */
.tab-wrapper:hover,
.tab-wrapper:has(:focus-visible) {
  z-index: 100 !important;
}

/* ALL tab wrapper - never shrinks */
.all-tab-wrapper {
  position: relative;
  flex-shrink: 0;
}

.all-tab-wrapper:hover,
.all-tab-wrapper:has(:focus-visible) {
  z-index: 100 !important;
}

/* ========================================================================== */
/* SUPER SPACER - Absorbs extra space and pushes ALL tab to the right        */
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
  padding: 0 20px;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
}

/* ========================================================================== */
/* PROCEEDING TAB - FIXED WIDTH (doesn't shrink, creates overlap)            */
/* ========================================================================== */

.proceeding-tab {
  height: 64px;
  width: 220px; /* FIXED width - does NOT shrink! */
}

/* ========================================================================== */
/* ALL TAB - FIXED WIDTH                                                      */
/* ========================================================================== */

.all-tab {
  height: 60px;
  font-weight: 500;
  width: 80px; /* FIXED width */
  /* Left shadow helps visualize the stacking order */
  box-shadow:
    -4px 0 8px -2px rgba(0, 0, 0, 0.1),
    0 -2px 4px rgba(0, 0, 0, 0.05);
}

/* ========================================================================== */
/* TAB CONTENT                                                                */
/* ========================================================================== */

.tab-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  overflow: hidden;
  width: 100%;
  text-align: left;
}

.tab-title {
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.tab-subtitle {
  font-size: 0.75rem;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

/* ========================================================================== */
/* ACTIVE TAB STATE                                                           */
/* ========================================================================== */

.folder-tab-active {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0f172a;
  transform: translateY(1px);
  border-color: #cbd5e1;
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}

.proceeding-tab.folder-tab-active {
  transform: translateY(5px);
}

/* ========================================================================== */
/* INACTIVE TAB STATE                                                         */
/* ========================================================================== */

.folder-tab-inactive {
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  transform: translateY(4px);
  border-color: #cbd5e1;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.proceeding-tab.folder-tab-inactive {
  transform: translateY(8px);
}

/* ========================================================================== */
/* HOVER STATE                                                                */
/* ========================================================================== */

.folder-tab-inactive:hover {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  transform: translateY(2px);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.07);
}

.proceeding-tab.folder-tab-inactive:hover {
  transform: translateY(6px);
}

/* ========================================================================== */
/* ADJACENT ACTIVE TABS                                                       */
/* ========================================================================== */

.folder-tab-active + .folder-tab-active {
  margin-left: -1px;
}
</style>
