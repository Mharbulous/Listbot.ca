<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║                     UploadTableVirtualizer.vue                                ║
║                                                                               ║
║  PURPOSE: Isolate virtualization complexity from business logic              ║
║                                                                               ║
║  WHY THIS FILE EXISTS:                                                       ║
║  Virtual scrolling requires TIGHT COUPLING between:                          ║
║    - Scroll position calculations                                            ║
║    - Visible item detection                                                  ║
║    - DOM element positioning (CSS transforms)                                ║
║    - Row recycling during scroll                                             ║
║                                                                               ║
║  This coupling CANNOT be decomposed further without breaking virtualization. ║
║  Therefore, this file is ALLOWED to exceed 300 lines when Phase 1.5 adds    ║
║  TanStack Virtual integration.                                               ║
║                                                                               ║
║  SCOPE DEFENSE (What MUST NOT be in this file):                             ║
║    ❌ Empty state rendering (belongs in UploadTable.vue)                     ║
║    ❌ Selection state management (belongs in UploadTable.vue)                ║
║    ❌ Footer stats computation (belongs in UploadTable.vue)                  ║
║    ❌ Drag-and-drop file traversal (belongs in UploadTable.vue)              ║
║    ❌ Upload orchestration logic (belongs in Testing.vue/composable)         ║
║                                                                               ║
║  RESPONSIBILITIES (What MUST be in this file):                               ║
║    ✅ Scroll container management                                            ║
║    ✅ Row rendering (standard in Phase 1.0, virtual in Phase 1.5)            ║
║    ✅ TanStack Virtual integration (Phase 1.5)                               ║
║    ✅ Visible item calculation (Phase 1.5)                                   ║
║    ✅ Row positioning with CSS transforms (Phase 1.5)                        ║
║    ✅ Overscan configuration (Phase 1.5)                                     ║
║                                                                               ║
║  PHASE EVOLUTION:                                                            ║
║    Phase 1.0 (Current): Standard rendering with v-for (~100 lines)          ║
║    Phase 1.5 (Next):    Virtual scrolling with TanStack (~300-400 lines)    ║
║                                                                               ║
║  ARCHITECTURAL NOTE:                                                         ║
║  By creating this boundary NOW (before virtualization), we prevent scope     ║
║  creep and ensure the virtualizer stays focused ONLY on performance.         ║
║                                                                               ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->

<template>
  <!-- Wrapper for table (no drag-drop - that's handled by parent UploadTable.vue) -->
  <div class="table-wrapper">
    <!-- Virtual Scrolling with TanStack Virtual (Phase 1.5) -->
    <div ref="scrollContainerRef" class="scroll-container">
      <!-- Sticky Header INSIDE scroll container - ensures perfect alignment -->
      <UploadTableHeader
        :all-selected="props.allSelected"
        :some-selected="props.someSelected"
        @select-all="handleSelectAll"
        @deselect-all="handleDeselectAll"
      />

      <!-- Content wrapper for rows (no flex properties) -->
      <div class="content-wrapper">
        <!-- Virtual container with dynamic height based on total content size -->
        <div class="virtual-container" :style="{ height: totalSize + 'px' }">
          <!-- Only render visible rows + overscan buffer -->
          <div
            v-for="virtualRow in virtualItems"
            :key="virtualRow.key"
            class="virtual-row"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size + 'px',
              transform: `translateY(${virtualRow.start}px)`,
            }"
          >
            <UploadTableRow
              :file="props.files[virtualRow.index]"
              :scrollbar-width="0"
              @cancel="handleCancel"
              @undo="handleUndo"
            />
          </div>
        </div>
      </div>

      <!-- Sticky Footer INSIDE scroll container - ensures perfect alignment -->
      <UploadTableFooter
        :stats="props.footerStats"
        @upload="handleUpload"
        @clear-queue="handleClearQueue"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import UploadTableHeader from './UploadTableHeader.vue';
import UploadTableRow from './UploadTableRow.vue';
import UploadTableFooter from './UploadTableFooter.vue';

// Component configuration
defineOptions({
  name: 'UploadTableVirtualizer',
});

// Props
const props = defineProps({
  files: {
    type: Array,
    required: true,
    default: () => [],
  },
  allSelected: {
    type: Boolean,
    default: false,
  },
  someSelected: {
    type: Boolean,
    default: false,
  },
  footerStats: {
    type: Object,
    required: true,
    default: () => ({}),
  },
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'select-all', 'deselect-all', 'upload', 'clear-queue']);

// Scroll container ref for virtual scrolling
const scrollContainerRef = ref(null);

// ============================================================================
// PERFORMANCE METRICS TRACKING
// ============================================================================
// NOTE: queueT0 is stored in window.queueT0 (set in Testing.vue when user selects files)
let scrollT0 = null; // T=0 for scroll events
let isScrolling = false;
let scrollTimeout = null;
const SCROLL_STOP_DELAY = 150; // ms to wait before considering scroll stopped

// Row height configuration (48px matches UploadTableRow height)
const ROW_HEIGHT = 48;

// CRITICAL: Use computed options wrapper pattern for TanStack Virtual
// This ensures count is a plain number, not a ComputedRef
// See: docs/TanStackAndVue3.md - "The Critical Pattern"
const virtualizerOptions = computed(() => ({
  count: props.files?.length || 0, // Plain number, NOT computed()!
  getScrollElement: () => scrollContainerRef.value,
  estimateSize: () => ROW_HEIGHT,
  overscan: 5, // Render 5 extra rows above/below viewport for smooth scrolling
  enableSmoothScroll: true,
  scrollPaddingStart: 0,
  scrollPaddingEnd: 0,
}));

// Create virtualizer instance with computed options wrapper
const rowVirtualizer = useVirtualizer(virtualizerOptions);

// Computed properties for virtual items and total size
const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems());
const totalSize = computed(() => rowVirtualizer.value.getTotalSize());

// ============================================================================
// QUEUE METRICS: Track when files are ready for rendering
// Note: Initial paint timing is now tracked in useUploadTable.js using RAF
// ============================================================================
let finalRenderLogged = false; // Track if we've logged the final render

watch(
  () => props.files.length,
  (newLength, oldLength) => {
    // Only track when files are ADDED (not removed/cleared)
    if (newLength > (oldLength || 0)) {
      // Reset render flag when new files are added
      finalRenderLogged = false;
    }
  }
);

// ============================================================================
// RENDER METRICS: Track final rendering after all files are queued
// ============================================================================
watch(
  virtualItems,
  () => {
    // Track render completion relative to current active T=0
    nextTick(() => {
      // Track FINAL render after Phase 2 completes (all files added)
      if (window.queueT0 && window.queueAdditionComplete && !finalRenderLogged && !isScrolling) {
        const elapsed = performance.now() - window.queueT0;
        console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - All files rendered (${props.files.length} files)`, {
          renderedRows: virtualItems.value.length,
          firstVisible: virtualItems.value[0]?.index ?? 'none',
          lastVisible: virtualItems.value[virtualItems.value.length - 1]?.index ?? 'none',
        });
        finalRenderLogged = true; // Mark as logged

        // Clear queue metrics flags after final render is complete
        window.queueT0 = null;
        window.queueAdditionComplete = false;
      }
      // Track rendering during/after scroll
      else if (scrollT0 && isScrolling) {
        const elapsed = performance.now() - scrollT0;
        console.log(`📊 [SCROLL METRICS] T=${elapsed.toFixed(2)}ms - Table render finished`, {
          renderedRows: virtualItems.value.length,
          firstVisible: virtualItems.value[0]?.index ?? 'none',
          lastVisible: virtualItems.value[virtualItems.value.length - 1]?.index ?? 'none',
        });
      }
    });
  },
  { flush: 'post' } // Run after DOM updates
);

// Event handlers
const handleCancel = (fileId) => {
  emit('cancel', fileId);
};

const handleUndo = (fileId) => {
  emit('undo', fileId);
};

const handleSelectAll = () => {
  emit('select-all');
};

const handleDeselectAll = () => {
  emit('deselect-all');
};

const handleUpload = () => {
  emit('upload');
};

const handleClearQueue = () => {
  emit('clear-queue');
};

// ============================================================================
// SCROLL METRICS: Track scroll start, stop, and rendering
// ============================================================================
const handleScroll = () => {
  // First scroll event = T=0 for scroll
  if (!isScrolling) {
    scrollT0 = performance.now();
    isScrolling = true;
    console.log('📊 [SCROLL METRICS] T=0.00ms - Scroll started');
  }

  // Clear previous timeout and set new one to detect scroll stop
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }

  scrollTimeout = setTimeout(() => {
    if (isScrolling && scrollT0) {
      const elapsed = performance.now() - scrollT0;
      console.log(`📊 [SCROLL METRICS] T=${elapsed.toFixed(2)}ms - Scroll stopped`);
      isScrolling = false;
      scrollT0 = null;
    }
  }, SCROLL_STOP_DELAY);
};

// Setup scroll listener when component mounts
onMounted(() => {
  if (scrollContainerRef.value) {
    scrollContainerRef.value.addEventListener('scroll', handleScroll, { passive: true });
    console.log('📊 [METRICS] Performance tracking initialized');
  }
});

// Expose scroll container ref for parent component
defineExpose({
  scrollContainerRef,
});
</script>

<style scoped>
/* Wrapper for table + overlay - enables absolute positioning of overlay */
.table-wrapper {
  flex: 1;
  position: relative; /* Creates positioning context for absolute overlay */
  min-height: 0; /* Allow flex shrinking */
  display: flex;
  flex-direction: column;
}

.scroll-container {
  flex: 1;
  position: relative;
  overflow-y: auto;
  min-height: 0; /* Allow flex shrinking and enable scrolling */
  display: flex;
  flex-direction: column;
}

/* Content wrapper for virtual rows (no flex properties) */
.content-wrapper {
  width: 100%;
}

/* Virtual scrolling container - contains all virtualized rows */
.virtual-container {
  position: relative;
  width: 100%;
}

/* Virtual row wrapper - absolutely positioned using CSS transform */
.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  will-change: transform; /* Optimize for GPU-accelerated transforms */
}
</style>
