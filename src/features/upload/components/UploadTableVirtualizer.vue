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
║    ❌ Upload orchestration logic (belongs in Upload.vue/composable)          ║
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
  <!-- Virtual Scrolling with TanStack Virtual (Phase 1.5) -->
  <!-- Merged table-wrapper and scroll-container into single container -->
  <div class="virtualizer-wrapper">
    <PageLayout ref="pageLayoutRef" class="upload-layout">
      <!-- Title Drawer -->
      <TitleDrawer title="Upload Queue">
          <!-- Add to Queue button -->
          <div class="flex items-center">
            <v-menu location="bottom">
              <template v-slot:activator="{ props: menuProps }">
                <v-btn
                  color="primary"
                  size="default"
                  variant="elevated"
                  prepend-icon="mdi-plus"
                  append-icon="mdi-chevron-down"
                  v-bind="menuProps"
                >
                  Add to Queue
                </v-btn>
              </template>

              <v-list density="compact">
                <v-list-item
                  prepend-icon="mdi-file-multiple"
                  title="Files"
                  @click="triggerFileSelect"
                />
                <v-list-item
                  prepend-icon="mdi-folder-multiple"
                  title="Folder"
                  @click="triggerFolderRecursiveSelect"
                />
              </v-list>
            </v-menu>
          </div>
      </TitleDrawer>

      <!-- Sticky Header INSIDE scroll container - ensures perfect alignment -->
      <UploadTableHeader
        :all-selected="props.allSelected"
        :some-selected="props.someSelected"
        :is-uploading="props.isUploading"
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
              :background-color="props.getGroupBackground?.(props.files[virtualRow.index], props.files)"
              :is-first-in-group="props.isFirstInGroup?.(props.files[virtualRow.index], virtualRow.index, props.files)"
              :is-last-in-group="props.isLastInGroup?.(props.files[virtualRow.index], virtualRow.index, props.files)"
              :disabled="props.isUploading"
              @cancel="handleCancel"
              @undo="handleUndo"
              @remove="handleRemove"
              @swap="handleSwap"
            />
          </div>
        </div>
      </div>

      <!-- Visual Dropzone Indicator (no drag handlers - purely visual) -->
      <!-- Drag-drop functionality is handled by parent UploadTable.vue -->
      <div class="dropzone-cell">
        <UploadTableDropzone />
      </div>
    </PageLayout>

    <!-- Sticky Footer OUTSIDE scroll container - sticks to viewport bottom -->
    <UploadTableFooter
      :stats="props.footerStats"
      :is-uploading="props.isUploading"
      :is-paused="props.isPaused"
      :duplicates-hidden="props.duplicatesHidden"
      :verification-state="props.verificationState"
      @upload="handleUpload"
      @clear-queue="handleClearQueue"
      @clear-duplicates="handleClearDuplicates"
      @clear-skipped="handleClearSkipped"
      @toggle-duplicates="handleToggleDuplicates"
      @pause="handlePause"
      @resume="handleResume"
      @cancel="handleCancel"
      @retry-failed="handleRetryFailed"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useVirtualizer } from '@tanstack/vue-virtual';
import UploadTableHeader from './UploadTableHeader.vue';
import UploadTableRow from './UploadTableRow.vue';
import UploadTableFooter from './UploadTableFooter.vue';
import PageLayout from '@/shared/components/layout/PageLayout.vue';
import TitleDrawer from '@/shared/components/layout/TitleDrawer.vue';
import UploadTableDropzone from './UploadTableDropzone.vue';
import { useQueueState } from '../composables/useQueueState.js';

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
  isUploading: {
    type: Boolean,
    default: false,
  },
  isPaused: {
    type: Boolean,
    default: false,
  },
  duplicatesHidden: {
    type: Boolean,
    default: false,
  },
  verificationState: {
    type: Object,
    default: () => ({
      isVerifying: false,
      processed: 0,
      total: 0,
    }),
  },
  // Group styling functions (PASS-THROUGH ONLY - business logic in composable)
  getGroupBackground: {
    type: Function,
    default: null,
  },
  isFirstInGroup: {
    type: Function,
    default: null,
  },
  isLastInGroup: {
    type: Function,
    default: null,
  },
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'remove', 'swap', 'select-all', 'deselect-all', 'upload', 'clear-queue', 'clear-duplicates', 'clear-skipped', 'toggle-duplicates', 'pause', 'resume', 'cancel-upload', 'retry-failed']);

// Get shared queue state for resetting completion flag
const { queueAdditionComplete } = useQueueState();

// PageLayout component ref (contains the scroll container)
const pageLayoutRef = ref(null);

// ============================================================================
// PERFORMANCE METRICS TRACKING
// ============================================================================
// NOTE: queueT0 is stored in window.queueT0 (set in Upload.vue when user selects files)

// Row height configuration (48px matches UploadTableRow height)
const ROW_HEIGHT = 48;

// CRITICAL: Use computed options wrapper pattern for TanStack Virtual
// This ensures count is a plain number, not a ComputedRef
// See: docs/TanStackAndVue3.md - "The Critical Pattern"
const virtualizerOptions = computed(() => ({
  count: props.files?.length || 0, // Plain number, NOT computed()!
  getScrollElement: () => pageLayoutRef.value?.scrollContainerRef || null,
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

// Computed gradient height - extends to cover all content including dropzone
// Accounts for: title drawer (~80px), header (~48px), virtual content, dropzone (~200px min)
const gradientHeight = computed(() => {
  const minDropzoneHeight = 200; // Minimum space for dropzone visibility
  const headerAndTitleHeight = 128; // Approximate combined height
  return Math.max(totalSize.value + headerAndTitleHeight + minDropzoneHeight, 800);
});

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
      if (window.queueT0 && queueAdditionComplete.value && !finalRenderLogged) {
        const elapsed = performance.now() - window.queueT0;
        console.log(`📊 [QUEUE METRICS] T=${elapsed.toFixed(2)}ms - All files rendered (${props.files.length} files)`, {
          renderedRows: virtualItems.value.length,
          firstVisible: virtualItems.value[0]?.index ?? 'none',
          lastVisible: virtualItems.value[virtualItems.value.length - 1]?.index ?? 'none',
        });
        finalRenderLogged = true; // Mark as logged

        // Clear queue metrics flags after final render is complete
        window.queueT0 = null;
        queueAdditionComplete.value = false;
        window.queueAdditionComplete = false; // Keep for backward compatibility with metrics logging
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

const handleRemove = (fileId) => {
  emit('remove', fileId);
};

const handleSwap = (fileId) => {
  emit('swap', fileId);
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

const handleClearDuplicates = () => {
  emit('clear-duplicates');
};

const handleClearSkipped = () => {
  emit('clear-skipped');
};

const handleToggleDuplicates = () => {
  emit('toggle-duplicates');
};

const handlePause = () => {
  emit('pause');
};

const handleResume = () => {
  emit('resume');
};

const handleCancelUpload = () => {
  emit('cancel-upload');
};

const handleRetryFailed = () => {
  emit('retry-failed');
};

// File selection triggers for Add to Queue button
const triggerFileSelect = () => {
  window.dispatchEvent(new CustomEvent('upload-trigger-file-select'));
};

const triggerFolderRecursiveSelect = () => {
  window.dispatchEvent(new CustomEvent('upload-trigger-folder-recursive-select'));
};

// Expose scroll container ref for parent component
// This provides access to the actual scrolling DOM element through PageLayout
defineExpose({
  scrollContainerRef: computed(() => pageLayoutRef.value?.scrollContainerRef || null),
});

// Watch gradient height and update the gradient element dynamically
watch(gradientHeight, (newHeight) => {
  nextTick(() => {
    const scrollContainer = pageLayoutRef.value?.scrollContainerRef;
    const gradientBg = scrollContainer?.querySelector('.gradient-background');
    if (gradientBg) {
      gradientBg.style.height = `${newHeight}px`;
    }
  });
}, { immediate: true });

// Diagnostic logging for height measurements
onMounted(() => {
  nextTick(() => {
    const scrollContainer = pageLayoutRef.value?.scrollContainerRef;
    const virtualizerWrapper = scrollContainer?.closest('.virtualizer-wrapper');
    const gradientBg = scrollContainer?.querySelector('.gradient-background');

    console.log('🔍 [HEIGHT DIAGNOSTICS] UploadTableVirtualizer:');
    console.log('  - virtualizerWrapper height:', virtualizerWrapper?.offsetHeight, 'px');
    console.log('  - scrollContainer height:', scrollContainer?.offsetHeight, 'px');
    console.log('  - scrollContainer scrollHeight:', scrollContainer?.scrollHeight, 'px');
    console.log('  - gradientBg height:', gradientBg?.offsetHeight, 'px');
    console.log('  - gradientBg computed height:', gradientHeight.value, 'px');
    console.log('  - totalSize (virtual content):', totalSize.value, 'px');
    console.log('  - viewport height:', window.innerHeight, 'px');
    console.log('  - Expected scrollContainer (vh - header):', window.innerHeight - 64, 'px');
  });
});
</script>

<style scoped>
/* Wrapper for entire virtualizer component including footer */
.virtualizer-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* Custom layout styling for Upload table */
.upload-layout {
  flex: 1; /* Take up remaining space, allowing footer to stay at bottom */
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

/* Dropzone cell wrapper - adds padding around the dropzone */
/* This is a VISUAL ONLY indicator - drag-drop is handled by parent UploadTable.vue */
.dropzone-cell {
  flex: 1; /* Fill remaining space to push footer to bottom */
  display: flex; /* Allow dropzone to flex and fill space */
  padding: 1rem; /* Equal padding on all sides for visual consistency */
}
</style>
