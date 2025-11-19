<template>
  <div class="badge-cell">
    <span v-if="displayValue" class="badge" :class="badgeClass">
      {{ displayValue }}
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: {
    type: [String, Number],
    default: '',
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

const variant = computed(() => props.column.rendererProps?.variant || 'default');

const displayValue = computed(() => {
  if (!props.value) return null;
  return String(props.value);
});

const badgeClass = computed(() => {
  if (variant.value === 'fileType') {
    return getFileTypeBadgeClass(props.value);
  } else if (variant.value === 'privilege') {
    return getPrivilegeBadgeClass(props.value);
  }
  return 'badge--default';
});

function getFileTypeBadgeClass(fileType) {
  if (!fileType) return 'badge--other';

  const type = fileType.toLowerCase();
  if (['pdf'].includes(type)) return 'badge--pdf';
  if (['doc', 'docx'].includes(type)) return 'badge--doc';
  if (['xls', 'xlsx'].includes(type)) return 'badge--excel';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'badge--image';
  return 'badge--other';
}

function getPrivilegeBadgeClass(privilege) {
  if (!privilege) return '';

  if (privilege === 'Attorney-Client') return 'badge--attorney-client';
  if (privilege === 'Work Product') return 'badge--work-product';
  return 'badge--not-privileged';
}
</script>

<style scoped>
.badge-cell {
  display: flex;
  align-items: center;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* File Type Badges */
.badge--pdf {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge--doc {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge--excel {
  background-color: #d1fae5;
  color: #065f46;
}

.badge--image {
  background-color: #fce7f3;
  color: #9f1239;
}

.badge--other {
  background-color: #e5e7eb;
  color: #374151;
}

/* Privilege Badges */
.badge--attorney-client {
  background-color: #fef3c7;
  color: #92400e;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: none;
  font-weight: 500;
}

.badge--work-product {
  background-color: #dbeafe;
  color: #1e40af;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: none;
  font-weight: 500;
}

.badge--not-privileged {
  background-color: #f3f4f6;
  color: #6b7280;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  text-transform: none;
  font-weight: 500;
}

.badge--default {
  background-color: #f3f4f6;
  color: #374151;
}
</style>
