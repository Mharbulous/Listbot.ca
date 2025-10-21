<template>
  <div class="date-cell">
    {{ formattedDate }}
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: [Date, String, Number],
    default: null,
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

const formattedDate = computed(() => {
  if (!props.value) return '—';

  try {
    const date = new Date(props.value);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }

    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
});
</script>

<style scoped>
.date-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #6b7280;
}
</style>
