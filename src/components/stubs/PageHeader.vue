<template>
  <div class="mb-8">
    <div
      :class="[
        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4',
        badgeClass,
      ]"
    >
      {{ badgeText }}
    </div>
    <h1 class="text-4xl font-bold text-slate-900 mb-4">{{ title }}</h1>
    <p class="text-xl text-slate-600 max-w-4xl">
      {{ description }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  badgeText: {
    type: String,
    required: true,
  },
  badgeColor: {
    type: String,
    default: 'blue',
    validator: (value) =>
      ['blue', 'purple', 'emerald', 'teal', 'indigo', 'amber', 'green'].includes(value),
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const badgeClass = computed(() => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800',
    emerald: 'bg-emerald-100 text-emerald-800',
    teal: 'bg-teal-100 text-teal-800',
    indigo: 'bg-indigo-100 text-indigo-800',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-green-100 text-green-800',
  };
  return colorMap[props.badgeColor] || colorMap.blue;
});
</script>
