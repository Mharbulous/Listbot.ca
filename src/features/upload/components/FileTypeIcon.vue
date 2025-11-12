<template>
  <div class="file-type-icon" :title="tooltip">
    <!-- SVG Icon -->
    <img v-if="iconPath" :src="iconPath" :alt="fileType" class="icon-svg" />
    <!-- Emoji Fallback -->
    <span v-else class="icon-emoji">{{ iconEmoji }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getFileTypeIcon } from '../composables/useFileTypeIcons.js';

// Component configuration
defineOptions({
  name: 'FileTypeIcon',
});

// Props
const props = defineProps({
  fileName: {
    type: String,
    required: true,
  },
});

// Get icon information from composable
const iconInfo = computed(() => getFileTypeIcon(props.fileName));

// Extract icon properties
const iconPath = computed(() => iconInfo.value.iconPath);
const iconEmoji = computed(() => iconInfo.value.iconEmoji);
const tooltip = computed(() => iconInfo.value.tooltip);

// Extract file type for alt text
const fileType = computed(() => {
  const ext = props.fileName.split('.').pop()?.toUpperCase();
  return ext ? `${ext} file` : 'File';
});
</script>

<style scoped>
.file-type-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.icon-svg {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 20px;
  line-height: 1;
  user-select: none;
}
</style>
