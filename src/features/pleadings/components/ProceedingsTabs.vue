<template>
  <div class="proceedings-tabs-sticky px-6">
    <div ref="tabsContainerRef" class="tabs-container flex items-end">
      <!-- Left-aligned proceeding tabs -->
      <button
        v-for="(proceeding, index) in proceedings"
        :key="proceeding.id"
        @click="handleTabClick(proceeding.id)"
        class="folder-tab proceeding-tab px-5 py-0 text-sm transition-all whitespace-nowrap relative"
        :class="modelValue === proceeding.id ? 'folder-tab-active' : 'folder-tab-inactive'"
        :style="getTabStyle(index, proceeding.id)"
      >
        <div class="flex flex-col items-start">
          <div class="font-bold">{{ proceeding.styleCause }}</div>
          <div class="text-xs text-slate-500">
            {{ proceeding.venue }} • {{ proceeding.registry }} • {{ proceeding.courtFileNo }}
          </div>
        </div>
      </button>

      <!-- Spacer to push ALL tab to the right -->
      <div class="flex-grow"></div>

      <!-- Right-aligned "ALL" tab -->
      <button
        @click="handleTabClick(null)"
        class="folder-tab all-tab px-5 py-0 text-sm font-medium transition-all whitespace-nowrap relative"
        :class="modelValue === null ? 'folder-tab-active' : 'folder-tab-inactive'"
        :style="getAllTabStyle()"
      >
        ALL
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  proceedings: {
    type: Array,
    required: true,
  },
  modelValue: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const tabsContainerRef = ref(null);
const containerWidth = ref(0);
const needsOverlap = ref(false);

function handleTabClick(proceedingId) {
  emit('update:modelValue', proceedingId);
}

function checkOverlapNeeded() {
  if (!tabsContainerRef.value) return;

  containerWidth.value = tabsContainerRef.value.offsetWidth;
  const scrollWidth = tabsContainerRef.value.scrollWidth;

  needsOverlap.value = scrollWidth > containerWidth.value;
}

function getTabStyle(index, proceedingId) {
  const isSelected = props.modelValue === proceedingId;
  const overlapAmount = 40;
  const normalGap = 8;

  const baseZIndex = index + 1;
  const zIndex = isSelected ? 100 : baseZIndex;

  if (!needsOverlap.value) {
    return {
      marginRight: `${normalGap}px`,
      zIndex: zIndex
    };
  }

  return {
    marginLeft: index === 0 ? '0' : `-${overlapAmount}px`,
    zIndex: zIndex
  };
}

function getAllTabStyle() {
  const isSelected = props.modelValue === null;
  const overlapAmount = 40;

  const baseZIndex = props.proceedings.length + 1;
  const zIndex = isSelected ? 100 : baseZIndex;

  if (!needsOverlap.value) {
    return {
      zIndex: zIndex
    };
  }

  return {
    marginLeft: props.proceedings.length > 0 ? `-${overlapAmount}px` : '0',
    zIndex: zIndex
  };
}

let resizeObserver = null;

onMounted(() => {
  checkOverlapNeeded();

  if (tabsContainerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      checkOverlapNeeded();
    });
    resizeObserver.observe(tabsContainerRef.value);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
.proceedings-tabs-sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  background: transparent;
  padding-bottom: 0px;
}

.tabs-container {
  height: 80px;
  overflow: visible;
}

.folder-tab {
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border: 1px solid #cbd5e1;
  border-bottom: none;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
  height: 60px;
  display: flex;
  align-items: center;
}

.proceeding-tab {
  height: 64px;
}

.all-tab {
  height: 60px;
}

.folder-tab-active {
  background: linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #0f172a;
  transform: translateY(1px);
  border-color: #cbd5e1;
  box-shadow:
    0 -3px 6px rgba(0, 0, 0, 0.08),
    -2px 0 4px rgba(0, 0, 0, 0.03),
    2px 0 4px rgba(0, 0, 0, 0.03);
}

.proceeding-tab.folder-tab-active {
  transform: translateY(5px);
}

.folder-tab-inactive {
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #64748b;
  transform: translateY(4px);
  border-color: #cbd5e1;
  box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
}

.proceeding-tab.folder-tab-inactive {
  transform: translateY(8px);
}

.folder-tab-inactive:hover {
  background: linear-gradient(180deg, #e2e8f0 0%, #cbd5e1 100%);
  color: #334155;
  transform: translateY(2px);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.07);
}

.proceeding-tab.folder-tab-inactive:hover {
  transform: translateY(6px);
}

.folder-tab-active + .folder-tab-active {
  margin-left: -1px;
}
</style>
