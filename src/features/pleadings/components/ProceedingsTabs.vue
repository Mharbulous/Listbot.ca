<template>
  <div class="proceedings-tabs-sticky px-6">
    <div ref="tabsContainerRef" class="tabs-container">
      <!-- Proceeding tabs (left-aligned) -->
      <button
        v-for="(proceeding, index) in proceedings"
        :key="proceeding.id"
        @click="selectTab(proceeding.id)"
        @mouseenter="setHoveredTab(proceeding.id)"
        @mouseleave="clearHoveredTab"
        class="folder-tab proceeding-tab"
        :class="getTabStateClass(proceeding.id)"
        :style="getTabStyle(index, proceeding.id)"
      >
        <div class="tab-content">
          <div class="tab-title">{{ proceeding.styleCause }}</div>
          <div class="tab-subtitle">
            {{ proceeding.venue }} • {{ proceeding.registry }} • {{ proceeding.courtFileNo }}
          </div>
        </div>
      </button>

      <!-- Spacer to push ALL tab to the right -->
      <div class="flex-grow"></div>

      <!-- ALL tab (right-aligned) -->
      <button
        @click="selectTab(null)"
        @mouseenter="setHoveredTab(ALL_TAB_ID)"
        @mouseleave="clearHoveredTab"
        class="folder-tab all-tab"
        :class="getTabStateClass(null)"
        :style="getTabStyle(proceedingCount, null)"
      >
        ALL
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

// ============================================================================
// CONSTANTS
// ============================================================================

const OVERLAP_AMOUNT = 40;
const NORMAL_GAP = 8;
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

const tabsContainerRef = ref(null);
const shouldOverlapTabs = ref(false);
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
// TAB STYLING
// ============================================================================

const calculateZIndex = (baseIndex, tabId) => {
  if (isActive(tabId)) return Z_INDEX_ACTIVE;
  if (isHovered(tabId)) return Z_INDEX_HOVERED;
  return baseIndex + 1;
};

const getTabStyle = (index, tabId) => {
  const zIndex = calculateZIndex(index, tabId);

  if (!shouldOverlapTabs.value) {
    // Normal mode: tabs have spacing between them
    return {
      marginRight: index < proceedingCount.value ? `${NORMAL_GAP}px` : '0',
      zIndex,
    };
  }

  // Overlap mode: tabs overlap to fit in container
  return {
    marginLeft: index === 0 ? '0' : `-${OVERLAP_AMOUNT}px`,
    zIndex,
  };
};

// ============================================================================
// RESPONSIVE OVERLAP DETECTION
// ============================================================================

const checkOverlapNeeded = () => {
  if (!tabsContainerRef.value) return;

  const containerWidth = tabsContainerRef.value.offsetWidth;
  const scrollWidth = tabsContainerRef.value.scrollWidth;

  shouldOverlapTabs.value = scrollWidth > containerWidth;
};

// ============================================================================
// LIFECYCLE
// ============================================================================

let resizeObserver = null;

onMounted(() => {
  checkOverlapNeeded();

  if (tabsContainerRef.value) {
    resizeObserver = new ResizeObserver(checkOverlapNeeded);
    resizeObserver.observe(tabsContainerRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
});
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
  position: relative;
  padding: 0 20px;
  font-size: 0.875rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.proceeding-tab {
  height: 64px;
}

.all-tab {
  height: 60px;
  font-weight: 500;
}

/* ========================================================================== */
/* TAB CONTENT                                                                */
/* ========================================================================== */

.tab-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.tab-title {
  font-weight: 700;
}

.tab-subtitle {
  font-size: 0.75rem;
  color: #64748b;
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
