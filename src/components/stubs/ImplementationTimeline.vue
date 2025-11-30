<template>
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-slate-900 mb-4">{{ title }}</h2>
    <div class="space-y-4">
      <div
        v-for="(phase, index) in phases"
        :key="index"
        :class="['border-l-4 pl-6 py-2', phaseColorClass(phase.color)]"
      >
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-semibold text-slate-900">{{ phase.title }}</h3>
          <span v-if="phase.timeframe" class="text-sm text-slate-600"
            >({{ phase.timeframe }})</span
          >
        </div>
        <ul class="list-disc list-inside text-slate-600 space-y-1 text-sm">
          <li v-for="(item, itemIndex) in phase.items" :key="itemIndex">{{ item }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Implementation Timeline',
  },
  phases: {
    type: Array,
    required: true,
    // Each phase should be: { title: String, timeframe?: String, items: String[], color?: String }
  },
});

const phaseColorClass = (color) => {
  const colorMap = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    indigo: 'border-indigo-500',
    purple: 'border-purple-500',
    violet: 'border-violet-500',
    amber: 'border-amber-500',
    teal: 'border-teal-500',
  };
  return colorMap[color] || 'border-blue-500';
};
</script>
