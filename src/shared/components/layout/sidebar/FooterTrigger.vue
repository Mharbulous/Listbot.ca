<template>
  <button
    ref="triggerButton"
    @click="emit('toggle')"
    @keydown="emit('keydown', $event)"
    @blur="emit('blur')"
    :aria-expanded="isOpen"
    aria-haspopup="true"
    :aria-controls="menuId"
    class="footer-trigger"
  >
    <!-- Avatar -->
    <div
      ref="avatarEl"
      class="footer-avatar"
      @mouseenter="handleAvatarMouseEnter"
      @mouseleave="handleAvatarMouseLeave"
    >
      <div v-if="authStore.userInitials === 'loading'" class="loading-spinner"></div>
      <span v-else>{{ authStore.userInitials }}</span>
    </div>

    <!-- User Role (only when expanded) -->
    <span v-if="!isCollapsed" class="footer-username">
      {{ userRoleDisplay }}
    </span>

    <!-- Chevron (only when expanded) -->
    <div v-if="!isCollapsed" class="footer-chevron" :class="{ 'rotate-180': isOpen }">
      ▲
    </div>
  </button>

  <!-- Avatar Tooltip -->
  <SidebarTooltip
    :show="showTooltip"
    :text="authStore.userDisplayName || 'User'"
    :style="tooltipStyle"
  />
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '@/core/auth/stores';
import SidebarTooltip from './SidebarTooltip.vue';

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  menuId: {
    type: String,
    required: true,
  },
});

// Emits
const emit = defineEmits(['toggle', 'keydown', 'blur']);

// Setup
const authStore = useAuthStore();

// Template refs
const triggerButton = ref(null);
const avatarEl = ref(null);

// Tooltip state
const showTooltip = ref(false);
const tooltipStyle = ref({});

// Computed property to format the user role
const userRoleDisplay = computed(() => {
  if (!authStore.userRole) return 'Member';

  // Capitalize first letter of each word
  return authStore.userRole
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
});

/**
 * Show tooltip on avatar hover
 */
const handleAvatarMouseEnter = (event) => {
  const target = event.currentTarget;
  const rect = target.getBoundingClientRect();

  tooltipStyle.value = {
    left: `${rect.right + 12}px`,
    top: `${rect.top + rect.height / 2}px`,
  };

  showTooltip.value = true;
};

/**
 * Hide tooltip
 */
const handleAvatarMouseLeave = () => {
  showTooltip.value = false;
};

// Expose triggerButton ref to parent
defineExpose({
  triggerButton,
});
</script>

<style scoped>
/* Trigger Button */
.footer-trigger {
  @apply w-full flex items-center gap-3 px-3 py-3.5 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer bg-transparent border-none outline-none;
}

/* Avatar */
.footer-avatar {
  @apply w-9 h-9 bg-gradient-to-br from-brand-blue to-brand-blue-dark text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0;
}

/* User Role */
.footer-username {
  @apply flex-1 text-sm font-medium text-slate-200 truncate text-left;
}

/* Chevron */
.footer-chevron {
  @apply text-slate-400 transition-transform duration-200 text-xs flex-shrink-0;
}

.footer-chevron.rotate-180 {
  transform: rotate(180deg);
}

/* Loading Spinner */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
