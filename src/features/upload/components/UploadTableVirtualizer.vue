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
  <!-- Simple Scrollable Body (NO VIRTUALIZATION - Phase 1.0) -->
  <!-- Phase 1.5 will replace this with TanStack Virtual scrolling -->
  <div ref="scrollContainerRef" class="scroll-container">
    <!-- Sticky Header INSIDE scroll container - ensures perfect alignment -->
    <UploadTableHeader
      :all-selected="props.allSelected"
      :some-selected="props.someSelected"
      @select-all="handleSelectAll"
      @deselect-all="handleDeselectAll"
    />

    <div class="table-body">
      <!-- Standard rendering: Render ALL rows -->
      <UploadTableRow
        v-for="file in props.files"
        :key="file.id"
        :file="file"
        :scrollbar-width="0"
        @cancel="handleCancel"
        @undo="handleUndo"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UploadTableHeader from './UploadTableHeader.vue';
import UploadTableRow from './UploadTableRow.vue';

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
});

// Emits
const emit = defineEmits(['cancel', 'undo', 'select-all', 'deselect-all']);

// Scroll container ref (will be used by TanStack Virtual in Phase 1.5)
const scrollContainerRef = ref(null);

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

// Expose scroll container ref (kept for compatibility, but no longer used for scrollbar width)
defineExpose({
  scrollContainerRef,
});

// ============================================================================
// PHASE 1.5 PREVIEW: Virtual Scrolling Integration
// ============================================================================
// When Phase 1.5 begins, this file will be modified to add:
//
// 1. Import TanStack Virtual:
//    import { useVirtualizer } from '@tanstack/vue-virtual';
//
// 2. Create virtualizer instance:
//    const rowVirtualizer = useVirtualizer({
//      count: computed(() => props.files.length),
//      getScrollElement: () => scrollContainerRef.value,
//      estimateSize: () => ROW_HEIGHT,
//      overscan: 5,
//    });
//
// 3. Replace v-for with virtual items loop:
//    <div
//      v-for="virtualRow in rowVirtualizer.getVirtualItems()"
//      :key="virtualRow.key"
//      :style="{
//        position: 'absolute',
//        transform: `translateY(${virtualRow.start}px)`,
//        height: `${virtualRow.size}px`
//      }"
//    >
//      <UploadTableRow :file="props.files[virtualRow.index]" />
//    </div>
//
// Expected file size after Phase 1.5: ~300-400 lines
// ============================================================================
</script>

<style scoped>
.scroll-container {
  flex: 1;
  position: relative;
  overflow-y: auto;
  min-height: 0; /* Allow flex shrinking and enable scrolling */
}

.table-body {
  display: flex;
  flex-direction: column;
  /* Phase 1.5 will add: position: relative; for absolute positioned rows */
}

/* Phase 1.5 will add styles for virtual scrolling:
.virtual-container {
  position: relative;
  width: 100%;
}

.virtual-row {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}
*/
</style>
