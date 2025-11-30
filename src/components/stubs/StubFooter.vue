<template>
  <!-- Coming Soon Banner -->
  <div
    v-if="variant === 'coming-soon'"
    :class="[
      'rounded-lg shadow-lg p-8 text-white text-center',
      comingSoonGradientClass,
    ]"
  >
    <h2 class="text-3xl font-bold mb-4">{{ comingSoonTitle }}</h2>
    <p class="text-xl mb-2">{{ comingSoonText }}</p>
    <p v-if="comingSoonSubtext" class="text-lg opacity-90">{{ comingSoonSubtext }}</p>
  </div>

  <!-- Back Button -->
  <div v-else class="text-center pt-6 border-t border-slate-200">
    <p v-if="message" class="text-slate-600 mb-4">{{ message }}</p>
    <button
      @click="handleBack"
      class="inline-flex items-center gap-2 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
    >
      ← {{ backButtonText }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStubPage } from '@/composables/useStubPage';

const props = defineProps({
  variant: {
    type: String,
    default: 'back-button',
    validator: (value) => ['back-button', 'coming-soon'].includes(value),
  },
  message: {
    type: String,
    default: '',
  },
  backButtonText: {
    type: String,
    default: 'Back',
  },
  comingSoonTitle: {
    type: String,
    default: 'Coming Soon',
  },
  comingSoonText: {
    type: String,
    default: '',
  },
  comingSoonSubtext: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: 'blue',
  },
});

const { goBack } = useStubPage();

const handleBack = () => {
  goBack();
};

const comingSoonGradientClass = computed(() => {
  const colorMap = {
    blue: 'bg-gradient-to-r from-blue-500 to-purple-600',
    purple: 'bg-gradient-to-r from-purple-500 to-indigo-600',
    emerald: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    indigo: 'bg-gradient-to-r from-indigo-500 to-violet-600',
    violet: 'bg-gradient-to-r from-purple-500 to-pink-600',
  };
  return colorMap[props.color] || colorMap.blue;
});
</script>
