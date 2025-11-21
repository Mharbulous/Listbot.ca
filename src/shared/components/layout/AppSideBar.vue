<template>
  <nav class="sidebar" :class="{ 'sidebar-collapsed': props.isCollapsed }" id="app-sidebar">
    <!-- Top Section: Logo + Toggle Button -->
    <div class="sidebar-header">
      <!-- Logo (shown when expanded) -->
      <RouterLink v-if="!props.isCollapsed" to="/" class="sidebar-logo">
        <span class="logo-text">ListBot</span>
      </RouterLink>

      <!-- Toggle Button -->
      <button
        class="sidebar-toggle-btn"
        :class="{ 'sidebar-toggle-centered': props.isCollapsed }"
        @click="handleToggle"
        :title="props.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <span class="toggle-icon">{{ props.isCollapsed ? '☰' : '«' }}</span>
      </button>
    </div>

    <!-- Navigation Items (fills available space) -->
    <div class="sidebar-nav" :style="{ gap: navGap }">
      <template v-for="item in navItems" :key="item.key">
        <!-- Section Header -->
        <div v-if="item.type === 'header'" class="nav-section-header">
          <span v-if="!props.isCollapsed" class="section-label">{{ item.label }}</span>
          <span v-else class="section-divider"></span>
        </div>

        <!-- Navigation Link -->
        <RouterLink
          v-else
          :to="item.path"
          class="nav-item"
          :class="{ 'nav-item-active': route.path === item.path }"
          @mouseenter="handleMouseEnter($event, item.key)"
          @mouseleave="handleMouseLeave"
        >
          <span class="nav-icon">{{ getItemIcon(item) }}</span>
          <span v-if="!props.isCollapsed" class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </template>
    </div>

    <!-- Sidebar Footer (User + App Menu) -->
    <SidebarFooter :is-collapsed="props.isCollapsed" />

    <!-- Floating Tooltip (only shown when collapsed) -->
    <Teleport to="body">
      <div v-if="hoveredItem && props.isCollapsed" class="sidebar-tooltip" :style="tooltipStyle">
        {{ tooltipText }}
      </div>
    </Teleport>
  </nav>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useMatterViewStore } from '@/features/matters/stores/matterView';
import { useOrganizerStore } from '@/features/documents/stores/organizer';
import SidebarFooter from './SidebarFooter.vue';

// Props
const props = defineProps({
  isCollapsed: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['toggle'])

// Toggle handler
const handleToggle = () => {
  emit('toggle')
}

// Get current route for active state
const route = useRoute();
const matterViewStore = useMatterViewStore();
const organizerStore = useOrganizerStore();

// Navigation items configuration
const navItems = [
  // Matters (Special - not part of EDRM workflow)
  { key: 'matters', path: '/matters', icon: '🗄️', label: 'Matters' },

  // Pleadings and Issues (not part of EDRM workflow)   
  
  
  
  { key: 'pleadings', path: '/pleadings', icon: '📜', label: 'Pleadings' },  
  { key: 'law', path: '/law', icon: '📚', label: 'Legal memos' },   
  { key: 'facts', path: '/facts', icon: '⚖️', label: 'Disputed Facts' },
  { key: 'cast', path: '/cast', icon: '🎭', label: 'Cast of Characters' },

  // EDRM Workflow Section Header
  { key: 'edrm-header', type: 'header', label: 'E-Discovery Workflow' },

  // EDRM Stage 1: Identify
  { key: 'identify', path: '/identify', icon: '🔍', label: 'Identify' },

  // EDRM Stage 2: Preserve
  { key: 'preserve', path: '/upload', icon: '🔐', label: 'Preserve' },

  // EDRM Stage 3: Collect
  {
    key: 'collect',
    path: computed(() =>
      matterViewStore.currentMatterId
        ? `/matters/${matterViewStore.currentMatterId}/documents`
        : '/documents'
    ),
    icon: '🗃️',
    label: 'Collect',
  },

  // EDRM Stage 4: Process
  { key: 'process', path: '/process', icon: '🤖', label: 'Process' },

  // EDRM Stage 5: Review
  {
    key: 'review',
    path: computed(() => {
      const matterId = matterViewStore.currentMatterId;
      if (!matterId) return '/analyze';

      // Try to get last viewed document from local storage
      const lastViewedDoc = localStorage.getItem('lastViewedDocument');
      if (lastViewedDoc) {
        return `/matters/${matterId}/review/${lastViewedDoc}`;
      }

      // Otherwise, get first document from organizer store
      const firstDoc = organizerStore.sortedEvidenceList?.[0];
      if (firstDoc) {
        return `/matters/${matterId}/review/${firstDoc.id}`;
      }

      // Fallback to analyze page if no documents
      return '/analyze';
    }),
    icon: '🧑‍💻',
    label: 'Review',
  },

  // EDRM Stage 6: Analyze
  { key: 'analyze', path: '/analysis', icon: '🧠', label: 'Analyze' },

  // EDRM Stage 7: Produce
  { key: 'produce', path: '/list', icon: '📃', label: 'Produce' },

  // EDRM Stage 8: Present
  { key: 'present', path: '/present', icon: '🏛️', label: 'Present' },

  // End of Workflow Section Header
  { key: 'workflow-end', type: 'header', label: 'Resources' },

  // About (Special - not part of EDRM workflow)
  { key: 'about', path: '/about', icon: 'ℹ️', label: 'About' },
];

// Tooltip state
const hoveredItem = ref(null);
const tooltipPosition = ref({ top: 0, left: 68 });

// Computed: Get tooltip text for currently hovered item
const tooltipText = computed(() => {
  if (!hoveredItem.value) return '';
  const item = navItems.find((i) => i.key === hoveredItem.value);
  return item?.label || '';
});

// Computed: Tooltip positioning styles
const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
}));

// Mouse enter handler: Show tooltip and calculate position
const handleMouseEnter = (event, itemKey) => {
  hoveredItem.value = itemKey;

  // Calculate tooltip position relative to hovered element
  const rect = event.currentTarget.getBoundingClientRect();
  tooltipPosition.value = {
    top: rect.top + rect.height / 2, // Vertically center on icon
    left: 68, // 60px sidebar width + 8px spacing
  };
};

// Mouse leave handler: Hide tooltip
const handleMouseLeave = () => {
  hoveredItem.value = null;
};

// Get icon for item
const getItemIcon = (item) => {
  // Special handling for Collect (Documents) item - show open folder when hovered or active
  if (item.key === 'collect') {
    const isHovered = hoveredItem.value === 'collect';
    const isActive = route.path === item.path;
    return isHovered || isActive ? '📂' : '📁';
  }
  return item.icon;
};

// Responsive gap calculation for middle nav section
const navGap = ref('4px'); // Default minimum gap
const navContainerRef = ref(null);
let resizeObserver = null;

const calculateNavGap = () => {
  const navContainer = navContainerRef.value;
  if (!navContainer) return;

  // Get the sidebar element to calculate total available space
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;

  // Get the header and footer elements
  const header = sidebar.querySelector('.sidebar-header');
  const footer = sidebar.querySelector('.sidebar-footer');
  if (!header || !footer) return;

  // Calculate available height for navigation items
  // Total sidebar height minus header and footer
  const sidebarHeight = sidebar.clientHeight;
  const headerHeight = header.clientHeight;
  const footerHeight = footer.clientHeight;
  const availableNavHeight = sidebarHeight - headerHeight - footerHeight;

  // Count navigation items (exclude headers)
  const navItemCount = navItems.filter(item => item.type !== 'header').length;
  const headerCount = navItems.filter(item => item.type === 'header').length;

  // Minimum item heights (from CSS - no vertical padding, just min-height)
  const minNavItemHeight = 54; // min-height from CSS
  const minHeaderHeight = 32; // min-height from CSS

  // Calculate total minimum height needed for items
  const minTotalItemsHeight = (navItemCount * minNavItemHeight) + (headerCount * minHeaderHeight);

  // Available space for gaps within the nav container
  const availableSpace = availableNavHeight - minTotalItemsHeight;

  // Total number of gaps (between items)
  const gapCount = navItems.length + 1; // +1 for top padding

  // Calculate what the gap would be if we distributed space evenly
  const calculatedGap = Math.floor(availableSpace / gapCount);

  // ADAPTIVE BEHAVIOR: Switch between spacious and compact modes
  // Threshold: If gap would be less than 8px, we're in "cramped" territory
  // In cramped mode, use a fixed small gap and allow scrolling
  const COMPACT_THRESHOLD = 8; // px
  const COMPACT_GAP = 4; // px - fixed gap in compact mode

  if (calculatedGap < COMPACT_THRESHOLD) {
    // Compact mode: Not enough space, use fixed small gap and allow scrolling
    navGap.value = `${COMPACT_GAP}px`;
  } else {
    // Spacious mode: Enough space, distribute it evenly
    navGap.value = `${calculatedGap}px`;
  }
};

// Watch navItems array length to recalculate gap when items are added/removed
watch(
  () => navItems.length,
  async () => {
    // Wait for DOM to update with new items
    await nextTick();
    calculateNavGap();
  }
);

// Set up resize observer on sidebar
onMounted(async () => {
  // Wait for DOM to be fully rendered
  await nextTick();

  navContainerRef.value = document.querySelector('.sidebar-nav');
  const sidebar = document.getElementById('app-sidebar');

  if (navContainerRef.value && sidebar) {
    // Initial calculation
    calculateNavGap();

    // Use ResizeObserver to watch the entire sidebar height
    // This catches window resize events that affect available space
    resizeObserver = new ResizeObserver(() => {
      calculateNavGap();
    });

    resizeObserver.observe(sidebar);
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>

<style scoped>
/* Sidebar Container */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 240px;
  height: 100vh;
  z-index: 50;
  background: linear-gradient(to bottom, var(--sidebar-bg-primary), var(--sidebar-bg-secondary));
  color: var(--sidebar-text-primary);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease-in-out;
  overflow: hidden;
}

/* Sidebar Collapsed State */
.sidebar-collapsed {
  width: 64px;
}

/* Sidebar Header: Logo + Toggle */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 12px;
  border-bottom: 1px solid var(--sidebar-border, rgba(255, 255, 255, 0.1));
  min-height: 64px;
  flex-shrink: 0;
}

.sidebar-collapsed .sidebar-header {
  justify-content: center;
  padding: 16px 8px;
}

/* Logo */
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;
}

.sidebar-logo:hover {
  opacity: 0.8;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: var(--sidebar-text-primary);
  white-space: nowrap;
}

/* Toggle Button */
.sidebar-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--sidebar-text-secondary);
  border-radius: 6px;
  transition: all 200ms ease-in-out;
  flex-shrink: 0;
}

.sidebar-toggle-btn:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
}

.sidebar-toggle-centered {
  margin: 0 auto;
}

.toggle-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Navigation Container */
.sidebar-nav {
  position: relative;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1; /* Fill available space between header and footer */
  overflow-y: auto; /* Allow scrolling if content exceeds space */
  overflow-x: hidden;
  /* gap is set dynamically via inline style */
}

/* Section Header */
.nav-section-header {
  padding: 0 12px; /* Horizontal padding only - gap handles vertical spacing */
  min-height: 32px; /* Maintain consistent height */
  display: flex;
  align-items: center;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--sidebar-text-secondary);
  opacity: 0.7;
}

.section-divider {
  display: block;
  width: 32px;
  height: 1px;
  background: var(--sidebar-border, rgba(255, 255, 255, 0.2));
  margin: 0 auto;
}

/* Navigation Item */
.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px; /* Horizontal padding only - gap handles vertical spacing */
  min-height: 54px; /* Maintain clickable height (30px icon + 12px top + 12px bottom) */
  gap: 12px;
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  white-space: nowrap;
}

.sidebar-collapsed .nav-item {
  justify-content: center;
  gap: 0;
}

.nav-item:hover {
  background-color: var(--sidebar-hover-bg);
  color: var(--sidebar-hover-text);
}

.nav-item-active {
  background-color: var(--sidebar-active-bg);
  color: var(--sidebar-active-text);
  font-weight: 600;
}

/* Icon */
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 20px;
  flex-shrink: 0;
}

/* Text Label */
.nav-label {
  font-size: 14px;
  font-weight: 500;
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Floating Tooltip - Rendered to Body */
.sidebar-tooltip {
  position: fixed;
  background: var(--sidebar-bg-primary);
  color: var(--sidebar-text-primary);
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid var(--sidebar-border);
  white-space: nowrap;
  font-size: 14px;
  font-weight: 500;
  z-index: 10000;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  transform: translateY(-50%);
  animation: tooltipFadeIn 0.2s ease-out;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}
</style>
