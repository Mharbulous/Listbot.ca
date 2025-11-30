<template>
  <div
    v-if="modelValue"
    :class="[
      'mx-6 mt-4 mb-2 px-4 py-3 rounded-lg shadow-md flex items-start gap-3',
      type === 'warning'
        ? 'bg-amber-50 border border-amber-200'
        : 'bg-blue-50 border border-blue-200',
    ]"
  >
    <svg
      class="w-5 h-5 mt-0.5 flex-shrink-0"
      :class="type === 'warning' ? 'text-amber-600' : 'text-blue-600'"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        v-if="type === 'warning'"
        fill-rule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clip-rule="evenodd"
      />
      <path
        v-else
        fill-rule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clip-rule="evenodd"
      />
    </svg>
    <div class="flex-1">
      <p :class="['text-sm font-medium', type === 'warning' ? 'text-amber-900' : 'text-blue-900']">
        {{ message }}
      </p>
    </div>
    <button
      @click="$emit('update:modelValue', false)"
      :class="[
        'text-sm font-medium hover:underline',
        type === 'warning' ? 'text-amber-700' : 'text-blue-700',
      ]"
    >
      Dismiss
    </button>
  </div>
</template>

<script setup>
defineOptions({
  name: 'MattersNotification',
});

defineProps({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['info', 'warning'].includes(value),
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['update:modelValue']);
</script>
