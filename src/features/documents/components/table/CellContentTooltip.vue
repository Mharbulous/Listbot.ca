<template>
  <Transition name="fade">
    <div
      v-if="isVisible"
      ref="tooltipElement"
      class="cell-content-tooltip"
      :style="{
        top: position.top,
        left: position.left,
        opacity: opacity,
        backgroundColor: backgroundColor,
      }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click.stop="handleClick"
    >
      {{ content }}
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue';

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
  backgroundColor: {
    type: String,
    default: 'white',
  },
});

const emit = defineEmits(['mouseenter', 'mouseleave', 'click']);

const tooltipElement = ref(null);

const handleMouseEnter = () => {
  emit('mouseenter');
};

const handleMouseLeave = () => {
  emit('mouseleave');
};

const handleClick = (event) => {
  // Allow text selection - don't close tooltip when clicking on it
  event.stopPropagation();
  emit('click', event);
};
</script>

<style scoped>
.cell-content-tooltip {
  position: fixed;
  z-index: 100; /* Above table content but below popups */

  /* Match cell text styling exactly */
  color: #374151;
  font-size: 13px;
  line-height: 1.4;

  /* Match cell padding to align text */
  padding: 12px 16px;

  /* Allow content to wrap and extend beyond cell width */
  max-width: 600px;
  word-wrap: break-word;
  white-space: normal;

  /* Subtle shadow to distinguish from background */
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(0, 0, 0, 0.05);

  /* Allow interaction for text selection */
  pointer-events: auto;
  user-select: text;
  cursor: text;

  /* Slight border radius to soften edges */
  border-radius: 4px;
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
