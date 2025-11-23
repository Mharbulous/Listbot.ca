<!--
  PageLayout.vue

  Shared page layout component that provides:
  - Scrollable container with proper positioning
  - Gradient background (cyan to cream)
  - Slot for page content

  Usage:
    PageLayout wraps TitleDrawer and other page content
    Place TitleDrawer with title prop as first child
    Add remaining page content as siblings
-->
<template>
  <div class="scroll-container">
    <div class="gradient-background"></div>
    <slot />
  </div>
</template>

<style scoped>
.scroll-container {
  flex: 1;
  overflow: auto;
  position: relative;
  min-width: 0;
}

.gradient-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 800px;
  background: linear-gradient(179deg, #B2EBF2 0%, #FCFCF5 30%, #FCFCF5 100%);
  z-index: 0;
  pointer-events: none;
}
</style>
