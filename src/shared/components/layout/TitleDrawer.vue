<!--
  TitleDrawer.vue

  Shared title-drawer component that provides:
  - Page title with text shadow styling
  - Horizontal layout with title on left, controls on right
  - Configurable bottom padding
  - Consistent spacing and styling across pages

  Usage:
    <TitleDrawer title="Page Title" :bottomPadding="'10px'">
      <button>Control 1</button>
      <button>Control 2</button>
    </TitleDrawer>
-->
<template>
  <div class="title-drawer" :style="{ paddingBottom: bottomPadding }">
    <h1 class="title-drawer-text">{{ title }}</h1>
    <div class="flex gap-3">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  bottomPadding?: string
}>(), {
  bottomPadding: '10px'
})
</script>

<style scoped>
.title-drawer {
  padding: 20px 24px 10px 24px;
  min-width: max-content;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  position: relative;
  z-index: 1;
  background: transparent;
  color: #455A64;
}

.title-drawer-text {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: inherit;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
</style>
