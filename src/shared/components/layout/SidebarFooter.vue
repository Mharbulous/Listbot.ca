<template>
  <div class="sidebar-footer" :class="{ 'sidebar-footer-collapsed': props.isCollapsed }">
    <!-- Trigger Button -->
    <FooterTrigger
      ref="footerTriggerRef"
      :is-collapsed="props.isCollapsed"
      :is-open="isOpen"
      :menu-id="menuId"
      @toggle="toggleMenu"
      @keydown="handleTriggerKeydown"
      @blur="handleBlur"
    />

    <!-- Menu Popover -->
    <FooterMenu
      :is-open="isOpen"
      :menu-id="menuId"
      :menu-items="menuItems"
      @close="closeMenu"
      @item-keydown="handleItemKeydown"
    />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import FooterTrigger from './sidebar/FooterTrigger.vue';
import FooterMenu from './sidebar/FooterMenu.vue';
import { useFooterMenu } from './sidebar/useFooterMenu';
import { useKeyboardNav } from './sidebar/useKeyboardNav';

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Template refs
const footerTriggerRef = ref(null);

// Helper function to get trigger button ref
const getTriggerButton = () => footerTriggerRef.value?.triggerButton;

// Footer menu composable
const { isOpen, menuId, toggleMenu, closeMenu, handleBlur } = useFooterMenu(
  props,
  getTriggerButton
);

// Keyboard navigation composable
const { menuItems, handleTriggerKeydown, handleItemKeydown, resetFocusIndex } = useKeyboardNav(
  isOpen,
  toggleMenu,
  closeMenu
);

// Watch isOpen to reset focus index
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      resetFocusIndex();
    });
  } else {
    resetFocusIndex();
  }
});
</script>

<style scoped>
/* Footer Container */
.sidebar-footer {
  @apply border-t border-slate-600 bg-slate-800;
  position: relative;
}

.sidebar-footer-collapsed {
  @apply border-t border-slate-600;
}
</style>
