<template>
  <!--
    FIX: Wrapper creates a SINGLE stacking context for both tabs AND content.
    This allows tab z-index values to properly compete with the content container below.
  -->
  <div class="proceedings-tabs-wrapper">
    <div class="proceedings-tabs-row px-6">
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

    <!--
      FIX: Content slot is NOW INSIDE the same stacking context as tabs.
      This allows tab z-index values to properly compete with content-container.
    -->
    <slot name="content"></slot>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

// ============================================================================
// CONSTANTS
// ============================================================================

const Z_INDEX_ACTIVE = 100;
const Z_INDEX_HOVERED = 20; // Hovered inactive tabs stay BEHIND content (25) but in front of other inactive tabs
const Z_INDEX_CONTENT = 25; // Content container z-index for reference
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
// TAB STYLING - Z-index values now compete in same stacking context as content
// ============================================================================

const getTabWrapperStyle = (tabId) => {
  let zIndex = 1;
  if (isActive(tabId)) {
    // Active tab: z-index 100 > content container's 25 = APPEARS IN FRONT
    zIndex = Z_INDEX_ACTIVE;
  } else if (isHovered(tabId)) {
    zIndex = Z_INDEX_HOVERED;
  } else {
    // Inactive tabs: z-index 1-10 < content container's 25 = APPEARS BEHIND
    const proceedingIndex = props.proceedings.findIndex((p) => p.id === tabId);
    if (proceedingIndex !== -1) {
      zIndex = proceedingIndex + 1;
    } else if (tabId === null) {
      // ALL tab gets a base z-index
      zIndex = 10;
    }
  }

  return { zIndex };
};
</script>

<style scoped>
/* ========================================================================== */
/* FIX: OUTER WRAPPER - Creates single stacking context for tabs + content    */
/* ========================================================================== */

.proceedings-tabs-wrapper {
  position: relative;
  /* This wrapper contains both tabs and content, so they share stacking context */
}

/* ========================================================================== */
/* TABS ROW - No longer sticky (wrapper handles positioning if needed)        */
/* ========================================================================== */

.proceedings-tabs-row {
  position: relative;
  /* NO position: sticky here - that was creating the isolated stacking context */
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

/* ALL tab wrapper - never shrinks */
.all-tab-wrapper {
  position: relative;
  flex-shrink: 0;
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
  background: #e0f2fe;
  color: #0f172a;
  transform: translateY(1px);
  border-color: #cbd5e1;
}

.proceeding-tab.folder-tab-active {
  transform: translateY(5px);
}

/* ========================================================================== */
/* INACTIVE TAB STATE                                                         */
/* ========================================================================== */

.folder-tab-inactive {
  background: #e2e8f0;
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
  background: #cbd5e1;
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
