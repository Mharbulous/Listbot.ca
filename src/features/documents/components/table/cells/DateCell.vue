<template>
  <div class="date-cell">
    {{ formattedDate }}
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserPreferencesStore } from '@/features/profile/stores/userPreferences';
import { formatDate as formatDateUtil } from '@/utils/dateFormatter';

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

// Get user preferences store
const preferencesStore = useUserPreferencesStore();
const { dateFormat } = storeToRefs(preferencesStore);

const formattedDate = computed(() => {
  if (!props.value) return '—';

  try {
    // Handle different input types (Date, String, Number)
    let date;
    if (props.value instanceof Date) {
      date = props.value;
    } else if (typeof props.value === 'string') {
      date = new Date(props.value);
    } else if (typeof props.value === 'number') {
      date = new Date(props.value);
    } else if (props.value.toDate) {
      // Firestore timestamp
      date = props.value.toDate();
    } else {
      return '—';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }

    // Format using user's preference
    return formatDateUtil(date, dateFormat.value);
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
