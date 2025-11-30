<template>
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-slate-900 mb-4">{{ title }}</h2>
    <div class="bg-white border border-slate-200 rounded-lg p-6">
      <div class="space-y-4">
        <div v-for="(step, index) in steps" :key="index" class="flex gap-4">
          <div
            :class="[
              'flex-shrink-0 w-10 h-10 rounded-full font-bold flex items-center justify-center',
              stepClass(step.status),
            ]"
          >
            {{ index + 1 }}
          </div>
          <div>
            <h4 class="font-semibold text-slate-900 mb-1">
              {{ step.title }}
              <span v-if="step.status" :class="statusBadgeClass(step.status)">
                ({{ step.status }})
              </span>
            </h4>
            <p class="text-slate-600">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    default: 'Workflow Overview',
  },
  steps: {
    type: Array,
    required: true,
    // Each step should be: { title: String, description: String, status?: String }
  },
  color: {
    type: String,
    default: 'blue',
  },
});

const stepClass = (status) => {
  if (status === 'Implemented') {
    return 'bg-emerald-100 text-emerald-700';
  }
  const colorMap = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    indigo: 'bg-indigo-100 text-indigo-700',
  };
  return colorMap[props.color] || colorMap.blue;
};

const statusBadgeClass = (status) => {
  if (status === 'Implemented') {
    return 'text-sm text-emerald-600';
  }
  return 'text-sm text-blue-600';
};
</script>
