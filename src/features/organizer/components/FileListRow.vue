<template>
  <div
    class="file-list-row"
    :class="{ 'file-list-row--hover': isHovered, 'file-list-row--even': isEven }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleClick"
  >
    <!-- File Type -->
    <div class="file-list-cell file-list-cell--file-type">
      <span class="file-type-badge" :class="`file-type-badge--${fileTypeClass}`">
        {{ file.fileType }}
      </span>
    </div>

    <!-- File Name -->
    <div class="file-list-cell file-list-cell--file-name">
      <span class="file-name-text" :title="file.fileName">
        {{ file.fileName }}
      </span>
    </div>

    <!-- File Size -->
    <div class="file-list-cell file-list-cell--file-size">
      {{ formatFileSize(file.fileSize) }}
    </div>

    <!-- Document Date -->
    <div class="file-list-cell file-list-cell--date">
      {{ formatDate(file.documentDate) }}
    </div>

    <!-- Privilege -->
    <div class="file-list-cell file-list-cell--privilege">
      <span
        v-if="file.privilege"
        class="privilege-badge"
        :class="`privilege-badge--${privilegeClass}`"
      >
        {{ file.privilege }}
      </span>
    </div>

    <!-- Description -->
    <div class="file-list-cell file-list-cell--description">
      <span class="description-text" :title="file.description">
        {{ file.description || '—' }}
      </span>
    </div>

    <!-- Document Type -->
    <div class="file-list-cell file-list-cell--tags">
      <div class="tag-list">
        <span v-for="(type, index) in file.documentType" :key="index" class="tag-chip">
          {{ type }}
        </span>
        <span v-if="!file.documentType || file.documentType.length === 0" class="text-muted">
          —
        </span>
      </div>
    </div>

    <!-- Author -->
    <div class="file-list-cell file-list-cell--tags">
      <div class="tag-list">
        <span v-for="(author, index) in file.author" :key="index" class="tag-chip">
          {{ author }}
        </span>
        <span v-if="!file.author || file.author.length === 0" class="text-muted"> — </span>
      </div>
    </div>

    <!-- Custodian -->
    <div class="file-list-cell file-list-cell--tags">
      <div class="tag-list">
        <span v-for="(custodian, index) in file.custodian" :key="index" class="tag-chip">
          {{ custodian }}
        </span>
        <span v-if="!file.custodian || file.custodian.length === 0" class="text-muted"> — </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['click']);

const isHovered = ref(false);

const isEven = computed(() => props.index % 2 === 0);

const fileTypeClass = computed(() => {
  const type = props.file.fileType.toLowerCase();
  if (['pdf'].includes(type)) return 'pdf';
  if (['doc', 'docx'].includes(type)) return 'doc';
  if (['xls', 'xlsx'].includes(type)) return 'excel';
  if (['jpg', 'jpeg', 'png', 'gif'].includes(type)) return 'image';
  return 'other';
});

const privilegeClass = computed(() => {
  const privilege = props.file.privilege;
  if (privilege === 'Attorney-Client') return 'attorney-client';
  if (privilege === 'Work Product') return 'work-product';
  return 'not-privileged';
});

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function handleClick() {
  emit('click', props.file);
}
</script>

<style scoped>
.file-list-row {
  display: grid;
  grid-template-columns:
    80px /* File Type */
    minmax(200px, 2fr) /* File Name */
    100px /* File Size */
    120px /* Document Date */
    140px /* Privilege */
    minmax(150px, 2fr) /* Description */
    minmax(120px, 1.5fr) /* Document Type */
    minmax(120px, 1.5fr) /* Author */
    minmax(120px, 1.5fr); /* Custodian */
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
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: #374151;
}

.file-list-cell--file-type {
  display: flex;
  align-items: center;
}

.file-type-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.file-type-badge--pdf {
  background-color: #fee2e2;
  color: #991b1b;
}

.file-type-badge--doc {
  background-color: #dbeafe;
  color: #1e40af;
}

.file-type-badge--excel {
  background-color: #d1fae5;
  color: #065f46;
}

.file-type-badge--image {
  background-color: #fce7f3;
  color: #9f1239;
}

.file-type-badge--other {
  background-color: #e5e7eb;
  color: #374151;
}

.file-name-text {
  font-weight: 500;
  color: #111827;
}

.file-list-cell--file-size,
.file-list-cell--date {
  color: #6b7280;
}

.privilege-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.privilege-badge--attorney-client {
  background-color: #fef3c7;
  color: #92400e;
}

.privilege-badge--work-product {
  background-color: #dbeafe;
  color: #1e40af;
}

.privilege-badge--not-privileged {
  background-color: #f3f4f6;
  color: #6b7280;
}

.description-text {
  color: #6b7280;
  font-size: 13px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-chip {
  display: inline-block;
  padding: 2px 8px;
  background-color: #f3f4f6;
  border-radius: 10px;
  font-size: 11px;
  color: #374151;
  white-space: nowrap;
}

.text-muted {
  color: #9ca3af;
}

/* Ensure consistent height for rows */
.file-list-cell--tags {
  overflow: visible;
  white-space: normal;
}
</style>
