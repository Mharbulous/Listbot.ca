<template>
  <v-menu location="top">
    <template v-slot:activator="{ props: menuProps }">
      <v-btn
        color="white"
        variant="elevated"
        size="large"
        class="clear-files-btn text-black"
        :disabled="isDisabled"
        v-bind="menuProps"
      >
        <v-icon start>mdi-broom</v-icon>
        Clear Files
        <v-icon end>mdi-chevron-up</v-icon>
      </v-btn>
    </template>

    <v-list density="compact">
      <v-list-item :disabled="duplicates === 0" @click="handleClearDuplicates">
        <template v-slot:prepend>
          <span class="status-dot status-duplicate"></span>
        </template>
        <v-list-item-title>
          Clear {{ duplicates }} {{ duplicates === 1 ? 'duplicate' : 'duplicates' }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item :disabled="skipOnlyCount === 0" @click="handleClearSkipped">
        <template v-slot:prepend>
          <span class="status-dot status-skip"></span>
        </template>
        <v-list-item-title>
          Clear {{ skipOnlyCount }} skipped {{ skipOnlyCount === 1 ? 'file' : 'files' }}
        </v-list-item-title>
      </v-list-item>

      <v-list-item :disabled="copyCount === 0" @click="handleToggleDuplicates">
        <template v-slot:prepend>
          <span class="status-dot status-copy"></span>
        </template>
        <v-list-item-title>
          {{ duplicatesHidden ? 'Show' : 'Hide' }} {{ copyCount }}
          {{ copyCount === 1 ? 'copy' : 'copies' }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'ClearFilesMenu',
});

const props = defineProps({
  duplicates: {
    type: Number,
    required: true,
  },
  skipOnlyCount: {
    type: Number,
    required: true,
  },
  copyCount: {
    type: Number,
    required: true,
  },
  duplicatesHidden: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['clear-duplicates', 'clear-skipped', 'toggle-duplicates']);

const isDisabled = computed(() => {
  return props.duplicates === 0 && props.skipOnlyCount === 0 && props.copyCount === 0;
});

const handleClearDuplicates = () => {
  emit('clear-duplicates');
};

const handleClearSkipped = () => {
  emit('clear-skipped');
};

const handleToggleDuplicates = () => {
  emit('toggle-duplicates');
};
</script>

<style scoped>
.clear-files-btn {
  font-size: 1rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.025em !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  width: 200px !important;
}

.clear-files-btn:disabled {
  opacity: 1 !important;
  box-shadow: none !important;
  transform: translateY(3px) !important;
  color: #d1d5db !important;
}

.clear-files-btn:disabled :deep(.v-icon) {
  color: #d1d5db !important;
}

.status-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: 8px;
}

.status-duplicate {
  background-color: #ffffff;
  border: 1px solid #000000;
}

.status-skip {
  background-color: #ffffff;
  border: 1px solid #9e9e9e;
}

.status-copy {
  background-color: #9c27b0;
}
</style>
