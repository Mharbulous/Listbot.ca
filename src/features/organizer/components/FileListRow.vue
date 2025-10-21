<template>
  <div
    class="file-list-row"
    :class="{ 'file-list-row--hover': isHovered, 'file-list-row--even': isEven }"
    :style="{ gridTemplateColumns: gridTemplateColumns, minWidth: minWidth }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleClick"
  >
    <!-- Dynamic Cell Rendering -->
    <div
      v-for="column in columns"
      :key="column.key"
      class="file-list-cell"
      :class="`file-list-cell--${column.key}`"
    >
      <component
        :is="getCellComponent(column.renderer)"
        :value="file[column.key]"
        :column="column"
        :file="file"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { generateGridTemplate } from '@/features/organizer/config/fileListColumns';

// Import cell renderers
import BadgeCell from './cells/BadgeCell.vue';
import TextCell from './cells/TextCell.vue';
import DateCell from './cells/DateCell.vue';
import FileSizeCell from './cells/FileSizeCell.vue';
import TagListCell from './cells/TagListCell.vue';

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
  columns: {
    type: Array,
    required: true,
  },
  minWidth: {
    type: String,
    default: 'auto',
  },
});

const emit = defineEmits(['click']);

const isHovered = ref(false);

const isEven = computed(() => props.index % 2 === 0);

/**
 * Generate CSS grid template from column widths
 */
const gridTemplateColumns = computed(() => {
  return generateGridTemplate(props.columns);
});

/**
 * Map renderer type to component
 */
function getCellComponent(rendererType) {
  const componentMap = {
    badge: BadgeCell,
    text: TextCell,
    date: DateCell,
    fileSize: FileSizeCell,
    tagList: TagListCell,
  };

  return componentMap[rendererType] || TextCell;
}

function handleClick() {
  emit('click', props.file);
}
</script>

<style scoped>
.file-list-row {
  display: grid;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.15s ease;
  min-height: 48px;
  align-items: center;
}

.file-list-row--even {
  background-color: #f9fafb;
}

.file-list-row--hover {
  background-color: #f3f4f6;
}

.file-list-cell {
  overflow: hidden;
}

/* Allow tag lists to wrap */
.file-list-cell--documentType,
.file-list-cell--author,
.file-list-cell--custodian {
  overflow: visible;
}
</style>
