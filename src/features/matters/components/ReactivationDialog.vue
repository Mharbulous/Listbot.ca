<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click.self="handleCancel"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
      <!-- Dialog Header -->
      <div class="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
        <h2 class="text-xl font-semibold text-white">
          {{ isLawyer ? 'Reactivate Matter' : 'Cannot Reactivate Matter' }}
        </h2>
      </div>

      <!-- Dialog Content -->
      <div class="px-6 py-5">
        <!-- Non-Lawyer Message -->
        <p v-if="!isLawyer" class="text-slate-700">
          Only lawyers can reactivate archived matters.
        </p>

        <!-- Responsible Lawyer Message -->
        <p v-else-if="isResponsibleLawyer" class="text-slate-700">
          Are you sure you want to reactivate this matter?
        </p>

        <!-- Non-Responsible Lawyer Message -->
        <div v-else>
          <p v-if="!hasAssumedResponsibility" class="text-slate-700">
            To reactivate this archived matter, you must assume responsibility for it. Do you want
            to become the responsible lawyer for this matter?
          </p>
          <p v-else class="text-slate-700">
            You will become the responsible lawyer for this matter. Click "Reactivate Matter" to
            continue.
          </p>
        </div>
      </div>

      <!-- Dialog Actions -->
      <div class="bg-slate-50 px-6 py-4 flex justify-end gap-3">
        <!-- Non-Lawyer Actions -->
        <button
          v-if="!isLawyer"
          @click="handleCancel"
          class="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
        >
          Close
        </button>

        <!-- Lawyer Actions -->
        <template v-else>
          <button
            @click="handleCancel"
            class="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <!-- Responsible Lawyer or Already Assumed Responsibility -->
          <button
            v-if="isResponsibleLawyer || hasAssumedResponsibility"
            @click="handleReactivate"
            class="px-4 py-2 border border-blue-600 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Reactivate Matter
          </button>

          <!-- Non-Responsible Lawyer - First Step -->
          <button
            v-else
            @click="handleAssumeResponsibility"
            class="px-4 py-2 border border-amber-500 rounded text-sm font-medium text-slate-800 bg-amber-500 hover:bg-amber-600 transition-colors"
          >
            Assume Responsibility
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ReactivationDialog - Modal for reactivating archived matters
 *
 * Responsibilities:
 * - Modal dialog structure
 * - Role-based UI (lawyer/non-lawyer)
 * - Assume responsibility flow (two-step process)
 * - Dialog actions and handlers
 * - Emits events to parent
 */

import { ref } from 'vue';

defineOptions({
  name: 'ReactivationDialog',
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  isLawyer: {
    type: Boolean,
    required: true,
  },
  isResponsibleLawyer: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue', 'reactivate']);

// Local state for two-step flow
const hasAssumedResponsibility = ref(false);

// Handle cancel button
function handleCancel() {
  hasAssumedResponsibility.value = false;
  emit('update:modelValue', false);
}

// Handle assume responsibility button
function handleAssumeResponsibility() {
  hasAssumedResponsibility.value = true;
}

// Handle reactivate button
function handleReactivate() {
  const shouldUpdateResponsibleLawyer = !props.isResponsibleLawyer && hasAssumedResponsibility.value;
  hasAssumedResponsibility.value = false;
  emit('reactivate', shouldUpdateResponsibleLawyer);
  emit('update:modelValue', false);
}
</script>
