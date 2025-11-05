import { ref, onUnmounted } from 'vue';

/**
 * Composable for managing tooltip visibility and fade timing
 *
 * Implements sophisticated timing behavior:
 * - Tooltip displays at full opacity
 * - After mouse leaves, waits 3 seconds
 * - Then fades to transparent over 3 seconds
 * - Re-hovering cancels timers and restores full opacity
 *
 * @returns {Object} Tooltip timing state and methods
 */
export function useTooltipTiming() {
  // State
  const isVisible = ref(false); // Whether tooltip is shown
  const opacity = ref(1); // Opacity value (0 to 1)
  const hideTimer = ref(null); // setTimeout reference for 3s delay
  const fadeTimer = ref(null); // setTimeout reference for fade completion
  const fadeStartTime = ref(null); // Timestamp when fade started

  // Constants
  const DISPLAY_DURATION = 3000; // 3 seconds at full opacity
  const FADE_DURATION = 3000; // 3 seconds to fade out
  const FADE_FPS = 60; // Target 60fps for smooth fade

  /**
   * Start the hide timer sequence
   * Waits DISPLAY_DURATION, then fades over FADE_DURATION
   */
  const startHideTimer = () => {
    // Clear any existing timers
    cancelHideTimer();

    // Set full opacity
    opacity.value = 1;

    // Wait 3 seconds before starting fade
    hideTimer.value = setTimeout(() => {
      startFade();
    }, DISPLAY_DURATION);
  };

  /**
   * Start the fade animation
   * Smoothly transitions opacity from 1 to 0 over FADE_DURATION
   */
  const startFade = () => {
    fadeStartTime.value = performance.now();

    const fade = () => {
      const elapsed = performance.now() - fadeStartTime.value;
      const progress = Math.min(elapsed / FADE_DURATION, 1);

      // Ease-out cubic for smooth fade
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      opacity.value = 1 - easedProgress;

      if (progress < 1) {
        // Continue fading - STORE the animation frame ID
        fadeTimer.value = requestAnimationFrame(fade);
      } else {
        // Fade complete, hide tooltip
        opacity.value = 0;
        isVisible.value = false;
        fadeTimer.value = null;
      }
    };

    // Start the animation - STORE the animation frame ID
    fadeTimer.value = requestAnimationFrame(fade);
  };

  /**
   * Cancel hide timer and restore full opacity
   * Called when user hovers over button or tooltip
   */
  const cancelHideTimer = () => {
    if (hideTimer.value) {
      clearTimeout(hideTimer.value);
      hideTimer.value = null;
    }

    if (fadeTimer.value) {
      // Stop the fade animation - ACTUALLY CANCEL IT
      cancelAnimationFrame(fadeTimer.value);
      fadeTimer.value = null;
      fadeStartTime.value = null;
    }

    // Restore full opacity
    opacity.value = 1;
  };

  /**
   * Show tooltip immediately at full opacity
   */
  const showTooltip = () => {
    isVisible.value = true;
    opacity.value = 1;
    cancelHideTimer();
  };

  /**
   * Close tooltip immediately
   * No fade animation, instant hide
   */
  const closeImmediate = () => {
    cancelHideTimer();
    opacity.value = 0;
    isVisible.value = false;
  };

  /**
   * Handle mouse enter event
   * Shows tooltip and cancels any hide timers
   */
  const handleMouseEnter = () => {
    showTooltip();
  };

  /**
   * Handle mouse leave event
   * Starts the hide timer sequence
   */
  const handleMouseLeave = () => {
    if (isVisible.value) {
      startHideTimer();
    }
  };

  /**
   * Cleanup timers on unmount
   */
  onUnmounted(() => {
    cancelHideTimer();
  });

  return {
    // State
    isVisible,
    opacity,

    // Methods
    showTooltip,
    closeImmediate,
    startHideTimer,
    cancelHideTimer,
    handleMouseEnter,
    handleMouseLeave,
  };
}
