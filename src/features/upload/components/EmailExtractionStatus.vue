<template>
  <div v-if="fileType === 'email'" class="flex items-center gap-2 text-sm">
    <template v-if="status === 'processing'">
      <v-progress-circular indeterminate size="14" width="2" />
      <span class="text-gray-600">Processing...</span>
    </template>

    <template v-else-if="status === 'completed'">
      <v-icon size="small" color="success">mdi-check-circle</v-icon>
      <span class="text-gray-600">Extracted</span>
    </template>

    <template v-else-if="status === 'failed'">
      <v-icon size="small" color="error">mdi-alert-circle</v-icon>
      <span class="text-red-600">{{ error || 'Failed' }}</span>
      <v-btn v-if="canRetry" size="x-small" variant="text" @click="retry">
        Retry
      </v-btn>
    </template>

    <template v-else>
      <v-icon size="small" color="gray">mdi-clock-outline</v-icon>
      <span class="text-gray-500">Pending</span>
    </template>
  </div>
</template>

<script setup>
import { toRef } from 'vue';
import { useEmailExtractionStatus } from '../composables/useEmailExtractionStatus';

const props = defineProps({
  fileHash: { type: String, required: true },
  fileType: { type: String, required: true }
});

const { status, error, canRetry, retry } = useEmailExtractionStatus(toRef(props, 'fileHash'));
</script>
