<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    @click="handleClose"
  >
    <div
      class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4"
      @click.stop
    >
      <div class="border-b border-slate-200 px-6 py-4">
        <h2 class="text-xl font-bold text-slate-900">Amendment History</h2>
      </div>
      <div class="p-6">
        <div class="space-y-4">
          <div
            v-for="(version, index) in versionHistory"
            :key="index"
            class="flex items-start gap-4 p-4 border border-slate-200 rounded-lg"
          >
            <div class="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <span class="text-purple-700 font-semibold">{{ version.version }}</span>
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-slate-900">{{ version.title }}</span>
                <span
                  v-if="version.isCurrent"
                  class="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                >
                  Current
                </span>
              </div>
              <div class="text-sm text-slate-600">Filed: {{ version.filedDate }}</div>
              <div class="text-sm text-slate-500 mt-1">{{ version.changes }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="border-t border-slate-200 px-6 py-4 flex justify-end">
        <button
          @click="handleClose"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  versionHistory: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

function handleClose() {
  emit('update:modelValue', false);
}
</script>

<style scoped>
</style>
