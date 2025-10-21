<template>
  <div class="file-size-cell">
    {{ formattedSize }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: Number,
    default: 0,
  },
  column: {
    type: Object,
    required: true,
  },
  file: {
    type: Object,
    required: true,
  },
});

const formattedSize = computed(() => {
  const bytes = props.value;

  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
});
</script>

<style scoped>
.file-size-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #6b7280;
}
</style>
