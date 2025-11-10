<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      class="cell-content-tooltip"
      :style="{
        top: position.top,
        left: position.left,
        opacity: opacity,
      }"
    >
      {{ content }}
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  isVisible: {
    type: Boolean,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  position: {
    type: Object,
    required: true,
    default: () => ({ top: '0px', left: '0px' }),
  },
  opacity: {
    type: Number,
    default: 1,
  },
});
</script>

<style scoped>
.cell-content-tooltip {
  position: fixed;
  z-index: 9999;
  background-color: #1f2937;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  max-width: 400px;
  word-wrap: break-word;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  pointer-events: none;
  white-space: pre-wrap;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
