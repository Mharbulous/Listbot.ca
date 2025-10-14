<template>
  <v-btn
    :color="buttonColor"
    :variant="variant"
    :disabled="disabled"
    class="hold-to-confirm-button"
    :class="{ 'is-holding': isHolding }"
    @mousedown="startHold"
    @mouseup="endHold"
    @mouseleave="cancelHold"
    @touchstart.prevent="startHold"
    @touchend.prevent="endHold"
    @touchcancel.prevent="cancelHold"
  >
    <div class="button-content">
      <v-icon v-if="icon" :start="!!text">{{ icon }}</v-icon>
      <span>{{ displayText }}</span>
    </div>
    <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
  </v-btn>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

const props = defineProps({
  duration: {
    type: Number,
    default: 2000, // 2 seconds
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: 'error',
  },
  variant: {
    type: String,
    default: 'outlined',
  },
  icon: {
    type: String,
    default: 'mdi-delete',
  },
  text: {
    type: String,
    default: 'DELETE',
  },
  confirmingText: {
    type: String,
    default: 'Hold to Confirm...',
  },
});

const emit = defineEmits(['confirmed']);

const isHolding = ref(false);
const progress = ref(0);
const startTime = ref(null);
const animationFrameId = ref(null);
const timeoutId = ref(null);

const displayText = computed(() => {
  return isHolding.value ? props.confirmingText : props.text;
});

const buttonColor = computed(() => {
  if (props.disabled) return 'grey';
  return props.color;
});

const startHold = () => {
  if (props.disabled) return;

  isHolding.value = true;
  startTime.value = Date.now();
  progress.value = 0;

  // Animate progress
  const animate = () => {
    const elapsed = Date.now() - startTime.value;
    progress.value = Math.min((elapsed / props.duration) * 100, 100);

    if (progress.value < 100) {
      animationFrameId.value = requestAnimationFrame(animate);
    }
  };

  animationFrameId.value = requestAnimationFrame(animate);

  // Set timeout for completion
  timeoutId.value = setTimeout(() => {
    completeHold();
  }, props.duration);
};

const endHold = () => {
  if (!isHolding.value) return;

  const elapsed = Date.now() - startTime.value;

  if (elapsed >= props.duration) {
    completeHold();
  } else {
    cancelHold();
  }
};

const completeHold = () => {
  cleanup();
  emit('confirmed');
};

const cancelHold = () => {
  cleanup();
};

const cleanup = () => {
  isHolding.value = false;
  progress.value = 0;
  startTime.value = null;

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }

  if (timeoutId.value) {
    clearTimeout(timeoutId.value);
    timeoutId.value = null;
  }
};

onUnmounted(() => {
  cleanup();
});
</script>

<style scoped>
.hold-to-confirm-button {
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  cursor: pointer;
  transition: transform 0.1s ease;
}

.hold-to-confirm-button:active {
  transform: scale(0.98);
}

.hold-to-confirm-button.is-holding {
  cursor: progress;
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: rgba(244, 67, 54, 0.3);
  transition: width 0.05s linear;
  z-index: 1;
  pointer-events: none;
}

.hold-to-confirm-button.is-holding .progress-bar {
  background-color: rgba(244, 67, 54, 0.5);
}
</style>
