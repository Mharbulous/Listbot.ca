<template>
  <div
    :class="[
      'bg-white rounded-lg p-6',
      borderClass,
    ]"
  >
    <div class="flex items-start gap-3 mb-3">
      <div class="text-2xl">{{ icon }}</div>
      <div>
        <h4 class="text-lg font-semibold text-slate-900">{{ title }}</h4>
        <p v-if="badge" :class="['text-sm font-medium', badgeColorClass]">{{ badge }}</p>
      </div>
    </div>
    <p class="text-slate-600 mb-3">
      <slot>
        {{ description }}
      </slot>
    </p>
    <slot name="extra-content" />
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
  badge: {
    type: String,
    default: '',
  },
  priority: {
    type: String,
    default: 'normal',
    validator: (value) => ['high', 'medium', 'normal'].includes(value),
  },
  color: {
    type: String,
    default: 'blue',
  },
});

const borderClass = computed(() => {
  if (props.priority === 'high') {
    const colorMap = {
      blue: 'border-2 border-blue-200',
      purple: 'border-2 border-purple-200',
      emerald: 'border-2 border-emerald-200',
      teal: 'border-2 border-teal-200',
      indigo: 'border-2 border-indigo-200',
      amber: 'border-2 border-amber-200',
    };
    return colorMap[props.color] || 'border-2 border-blue-200';
  }
  return 'border border-slate-200';
});

const badgeColorClass = computed(() => {
  const colorMap = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    emerald: 'text-emerald-600',
    teal: 'text-teal-600',
    indigo: 'text-indigo-600',
    amber: 'text-amber-600',
  };
  return colorMap[props.color] || 'text-blue-600';
});
</script>
