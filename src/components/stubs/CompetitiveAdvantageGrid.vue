<template>
  <div
    :class="[
      'border rounded-lg p-6 mb-8',
      gradientClass,
      borderClass,
    ]"
  >
    <h2 class="text-xl font-bold text-slate-900 mb-3">{{ title }}</h2>
    <p v-if="description" class="text-slate-700 mb-4">{{ description }}</p>
    <div class="grid gap-3 md:grid-cols-2">
      <div v-for="(advantage, index) in advantages" :key="index" class="flex items-start gap-2">
        <div :class="['mt-1', checkmarkClass]">✓</div>
        <div class="text-slate-700">
          <slot :name="`advantage-${index}`" :advantage="advantage">
            <span v-if="advantage.label" class="font-medium">{{ advantage.label }}</span>
            {{ advantage.text }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    default: 'Competitive Advantage',
  },
  description: {
    type: String,
    default: '',
  },
  advantages: {
    type: Array,
    required: true,
    // Each advantage should be: { label?: String, text: String }
  },
  color: {
    type: String,
    default: 'blue',
  },
});

const gradientClass = computed(() => {
  const colorMap = {
    blue: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    purple: 'bg-gradient-to-r from-purple-50 to-indigo-50',
    emerald: 'bg-gradient-to-r from-emerald-50 to-green-50',
    teal: 'bg-gradient-to-r from-teal-50 to-cyan-50',
    indigo: 'bg-gradient-to-r from-indigo-50 to-violet-50',
    amber: 'bg-gradient-to-r from-amber-50 to-yellow-50',
  };
  return colorMap[props.color] || colorMap.blue;
});

const borderClass = computed(() => {
  const colorMap = {
    blue: 'border-blue-200',
    purple: 'border-purple-200',
    emerald: 'border-emerald-200',
    teal: 'border-teal-200',
    indigo: 'border-indigo-200',
    amber: 'border-amber-200',
  };
  return colorMap[props.color] || colorMap.blue;
});

const checkmarkClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    teal: 'text-teal-600',
    indigo: 'text-indigo-600',
    amber: 'text-amber-600',
  };
  return colorMap[props.color] || colorMap.blue;
});
</script>
