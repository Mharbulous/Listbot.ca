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
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
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

const emit = defineEmits(['mouseenter', 'mouseleave', 'click', 'close']);

const tooltipElement = ref(null);

// Click detection state
const mouseDownTime = ref(0);
const mouseDownPosition = ref({ x: 0, y: 0 });

const handleMouseEnter = () => {
  emit('mouseenter');
};

const handleMouseLeave = () => {
  emit('mouseleave');
};

const handleMouseDown = (event) => {
  // Record time and position for click detection
  mouseDownTime.value = Date.now();
  mouseDownPosition.value = { x: event.clientX, y: event.clientY };
};

const handleMouseUp = (event) => {
  // Calculate time and distance delta
  const timeDelta = Date.now() - mouseDownTime.value;
  const distanceDelta = Math.sqrt(
    Math.pow(event.clientX - mouseDownPosition.value.x, 2) +
    Math.pow(event.clientY - mouseDownPosition.value.y, 2)
  );

  // Consider it a click if:
  // - Time delta < 300ms (quick press-and-release)
  // - Distance delta < 5px (no significant movement)
  const isClick = timeDelta < 300 && distanceDelta < 5;

  if (isClick) {
    // Close the tooltip
    emit('close');
  }
};

const handleClick = (event) => {
  // Stop propagation to prevent closing from outside click handler
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
