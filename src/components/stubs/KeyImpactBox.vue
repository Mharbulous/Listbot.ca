<template>
  <div
    :class="[
      'border-l-4 p-6 mb-8 rounded-lg',
      gradientClass,
      borderClass,
    ]"
  >
    <div class="flex items-start gap-4">
      <div class="text-3xl">{{ icon }}</div>
      <div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">{{ title }}</h3>
        <p class="text-slate-700">
          <slot>
            {{ description }}
          </slot>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'blue',
    validator: (value) =>
      ['blue', 'purple', 'emerald', 'teal', 'indigo', 'amber', 'green', 'pink', 'violet'].includes(
        value
      ),
  },
});

const gradientClass = computed(() => {
  const colorMap = {
    blue: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    purple: 'bg-gradient-to-r from-purple-50 to-pink-50',
    emerald: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    teal: 'bg-gradient-to-r from-teal-50 to-cyan-50',
    indigo: 'bg-gradient-to-r from-indigo-50 to-violet-50',
    amber: 'bg-gradient-to-r from-amber-50 to-yellow-50',
    green: 'bg-gradient-to-r from-emerald-50 to-green-50',
    pink: 'bg-gradient-to-r from-purple-50 to-pink-50',
    violet: 'bg-gradient-to-r from-indigo-50 to-violet-50',
  };
  return colorMap[props.color] || colorMap.blue;
});

const borderClass = computed(() => {
  const colorMap = {
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    emerald: 'border-emerald-500',
    teal: 'border-teal-500',
    indigo: 'border-indigo-500',
    amber: 'border-amber-500',
    green: 'border-emerald-500',
    pink: 'border-purple-500',
    violet: 'border-indigo-500',
  };
  return colorMap[props.color] || colorMap.blue;
});
</script>
