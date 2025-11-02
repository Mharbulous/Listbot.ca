<template>
  <div class="document-nav-panel">
    <v-card class="document-nav-card">
      <!-- Left controls -->
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="currentDocumentIndex === 1"
        title="First document"
        @click="$emit('navigate-first')"
      >
        <v-icon>mdi-page-first</v-icon>
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="currentDocumentIndex === 1"
        title="Previous document"
        @click="$emit('navigate-previous')"
      >
        <v-icon>mdi-chevron-left</v-icon>
      </v-btn>

      <!-- Center document indicator -->
      <span class="document-indicator"
        >Document {{ currentDocumentIndex }} of {{ totalDocuments }}</span
      >

      <!-- Page jump input (for PDFs) -->
      <div v-if="isPdfFile && totalPages > 1" class="page-jump-control">
        <input
          v-model.number="pageJumpInput"
          type="number"
          :min="1"
          :max="totalPages"
          class="page-jump-input"
          placeholder="Page"
          @keypress.enter="handleJumpToPage"
        />
        <span class="page-jump-label">/ {{ totalPages }}</span>
        <v-btn
          icon
          variant="text"
          size="small"
          title="Go to page"
          @click="handleJumpToPage"
        >
          <v-icon>mdi-arrow-right-circle</v-icon>
        </v-btn>
      </div>

      <!-- Right controls -->
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="currentDocumentIndex === totalDocuments"
        title="Next document"
        @click="$emit('navigate-next')"
      >
        <v-icon>mdi-chevron-right</v-icon>
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        :disabled="currentDocumentIndex === totalDocuments"
        title="Last document"
        @click="$emit('navigate-last')"
      >
        <v-icon>mdi-page-last</v-icon>
      </v-btn>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Props
const props = defineProps({
  currentDocumentIndex: {
    type: Number,
    required: true,
  },
  totalDocuments: {
    type: Number,
    required: true,
  },
  isPdfFile: {
    type: Boolean,
    required: true,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
});

// Events
const emit = defineEmits([
  'navigate-first',
  'navigate-previous',
  'navigate-next',
  'navigate-last',
  'jump-to-page',
]);

// Page jump input state
const pageJumpInput = ref(null);

// Jump to specific page number
const handleJumpToPage = () => {
  const pageNum = parseInt(pageJumpInput.value);
  if (pageNum >= 1 && pageNum <= props.totalPages) {
    emit('jump-to-page', pageNum);
    pageJumpInput.value = null; // Clear input
  }
};
</script>

<style scoped>
.document-nav-panel {
  width: 100%;
  flex-shrink: 0;
}

.document-nav-card {
  background-color: #475569; /* Dark slate gray */
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  gap: 8px;
  border-radius: 4px;
}

.document-nav-card .v-btn {
  color: white;
  border-radius: 6px;
}

.document-nav-card .v-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.document-nav-card .v-btn:disabled {
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.document-indicator {
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0 12px;
  flex-grow: 1;
  text-align: center;
  transition: opacity 0.15s ease-in-out;
}

.page-jump-control {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 16px;
  padding-left: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
}

.page-jump-input {
  width: 50px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 0.875rem;
  text-align: center;
}

.page-jump-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  background-color: rgba(255, 255, 255, 0.15);
}

/* Remove number input spinners */
.page-jump-input::-webkit-inner-spin-button,
.page-jump-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.page-jump-input[type='number'] {
  -moz-appearance: textfield;
}

.page-jump-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}
</style>
