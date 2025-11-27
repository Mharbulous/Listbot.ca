<template>
  <div class="flex items-center gap-3 flex-1 min-w-0">
    <!-- Segmented Control: My Matters / Firm Matters -->
    <div class="matters-switch inline-flex rounded-lg bg-white/50 p-0.5 flex-shrink-0 relative">
      <!-- Sliding background indicator with selected text -->
      <div
        class="switch-indicator"
        :class="{
          'switch-indicator-right': !mattersFilterStore.showMyMattersOnly,
          'switch-indicator-nudge-left':
            isHoveringMyMatters && !mattersFilterStore.showMyMattersOnly,
          'switch-indicator-nudge-right':
            isHoveringFirmMatters && mattersFilterStore.showMyMattersOnly,
        }"
      >
        <!-- Text that moves with the indicator -->
        <span class="switch-indicator-text">
          <Transition name="switch-text-fade" mode="out-in">
            <span :key="mattersFilterStore.showMyMattersOnly ? 'my' : 'firm'">
              {{ mattersFilterStore.showMyMattersOnly ? 'My Matters' : 'Firm Matters' }}
            </span>
          </Transition>
        </span>
      </div>

      <!-- Background buttons (clickable areas with static text) -->
      <button
        @click="mattersFilterStore.setShowMyMatters(true)"
        @mouseenter="isHoveringMyMatters = true"
        @mouseleave="isHoveringMyMatters = false"
        :class="[
          'px-3 py-1.5 rounded-md text-xl font-medium transition-all duration-300 relative',
          mattersFilterStore.showMyMattersOnly
            ? 'text-transparent'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/40',
        ]"
      >
        My Matters
      </button>
      <button
        @click="mattersFilterStore.setShowMyMatters(false)"
        @mouseenter="isHoveringFirmMatters = true"
        @mouseleave="isHoveringFirmMatters = false"
        :class="[
          'px-3 py-1.5 rounded-md text-xl font-medium transition-all duration-300 relative',
          !mattersFilterStore.showMyMattersOnly
            ? 'text-transparent'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/40',
        ]"
      >
        Firm Matters
      </button>
    </div>

    <!-- Dropdown: Status Filter -->
    <div class="relative flex-shrink-0" data-matters-dropdown>
      <button
        @click="mattersFilterStore.toggleStatusDropdown()"
        class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded-lg text-xl font-medium text-white transition-colors flex items-center gap-2"
      >
        <span>Status: {{ mattersFilterStore.statusFilterLabel }}</span>
        <svg
          class="w-4 h-4 transition-transform"
          :class="{ 'rotate-180': mattersFilterStore.statusDropdownOpen }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      <!-- Dropdown Menu -->
      <div
        v-if="mattersFilterStore.statusDropdownOpen"
        class="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]"
      >
        <button
          @click="mattersFilterStore.setStatusFilter('active')"
          class="w-full px-4 py-2 text-left text-xl hover:bg-slate-50 transition-colors"
          :class="
            mattersFilterStore.statusFilter === 'active'
              ? 'text-teal-600 font-medium'
              : 'text-slate-700'
          "
        >
          Active
        </button>
        <button
          @click="mattersFilterStore.setStatusFilter('archived')"
          class="w-full px-4 py-2 text-left text-xl hover:bg-slate-50 transition-colors"
          :class="
            mattersFilterStore.statusFilter === 'archived'
              ? 'text-teal-600 font-medium'
              : 'text-slate-700'
          "
        >
          Archived
        </button>
        <button
          @click="mattersFilterStore.setStatusFilter('all')"
          class="w-full px-4 py-2 text-left text-xl hover:bg-slate-50 transition-colors"
          :class="
            mattersFilterStore.statusFilter === 'all'
              ? 'text-teal-600 font-medium'
              : 'text-slate-700'
          "
        >
          All
        </button>
      </div>
    </div>

    <!-- Search Input with Integrated Actions -->
    <div class="flex-1 relative min-w-0">
      <input
        v-model="mattersFilterStore.searchText"
        type="text"
        placeholder="filter matters..."
        class="w-full pl-3 pr-24 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-xl transition-all placeholder:text-slate-400"
      />
      <!-- Integrated Search Actions -->
      <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <!-- Case Sensitive Toggle -->
        <button
          @click="mattersFilterStore.toggleCaseSensitive()"
          :class="[
            'p-1.5 rounded text-lg font-semibold transition-colors',
            mattersFilterStore.caseSensitive
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
          ]"
          :title="mattersFilterStore.caseSensitive ? 'Case sensitive' : 'Case insensitive'"
        >
          <span class="font-mono">{{ mattersFilterStore.caseSensitive ? 'Aa' : 'aA' }}</span>
        </button>
        <!-- Whole Word Toggle -->
        <button
          @click="mattersFilterStore.toggleWholeWord()"
          :class="[
            'px-1.5 py-1.5 rounded text-lg font-semibold transition-colors',
            mattersFilterStore.wholeWord
              ? 'bg-teal-600 text-white hover:bg-teal-700'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50',
          ]"
          :title="mattersFilterStore.wholeWord ? 'Match whole words only' : 'Match partial words'"
        >
          <span class="font-mono">{{ mattersFilterStore.wholeWord ? 'Word' : 'Wo__' }}</span>
        </button>
        <!-- Clear Button -->
        <button
          v-if="mattersFilterStore.searchText"
          @click="mattersFilterStore.clearSearchText()"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- New Matter Button -->
    <router-link
      to="/matters/new"
      class="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded text-xl font-medium transition-colors flex items-center gap-1.5 flex-shrink-0"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      New Matter
    </router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useMattersFilterStore } from '../stores/mattersFilter.js';

defineOptions({
  name: 'MattersFilterControls',
});

// Matters filter store for filter controls
const mattersFilterStore = useMattersFilterStore();

// Hover state for matters switch anticipatory nudge
const isHoveringMyMatters = ref(false);
const isHoveringFirmMatters = ref(false);
</script>

<style scoped>
/* Matters switch animations */
.matters-switch {
  position: relative;
}

.switch-indicator {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 6px;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px -1px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1;
}

.switch-indicator-right {
  transform: translateX(100%);
}

/* Anticipatory nudge when hovering inactive button */
.switch-indicator-nudge-left {
  transform: translateX(calc(100% - 5px)) !important;
}

.switch-indicator-nudge-right {
  transform: translateX(5px) !important;
}

/* Text inside the sliding indicator */
.switch-indicator-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 1.25rem;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}

/* Fade transition for text when switching */
.switch-text-fade-enter-active,
.switch-text-fade-leave-active {
  transition: opacity 0.15s ease;
}

.switch-text-fade-enter-from,
.switch-text-fade-leave-to {
  opacity: 0;
}

.switch-text-fade-enter-to,
.switch-text-fade-leave-from {
  opacity: 1;
}

.matters-switch button {
  cursor: pointer;
  border: none;
  background: transparent;
}
</style>
