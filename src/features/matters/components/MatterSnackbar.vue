<template>
  <div v-if="modelValue" class="fixed bottom-6 right-6 z-50 animate-slide-up">
    <div
      :class="[
        'rounded-lg shadow-lg px-6 py-4 flex items-center gap-3 min-w-[300px]',
        color === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
      ]"
    >
      <svg
        v-if="color === 'success'"
        class="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      <span class="flex-1">{{ message }}</span>
      <button @click="$emit('update:modelValue', false)" class="text-white hover:text-gray-200 transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * MatterSnackbar - Reusable snackbar notification component
 *
 * Responsibilities:
 * - Display success/error messages
 * - Icon display based on type
 * - Close button
 * - Slide-up animation
 */

defineOptions({
  name: 'MatterSnackbar',
});

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error'].includes(value),
  },
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
