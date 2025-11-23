<template>
  <div class="bg-blue-50 border border-slate-700 rounded-lg shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-5 relative">
      <div class="flex items-center gap-3 mb-2">
        <h1 class="text-3xl font-bold text-white">
          {{ matter.matterNumber }}
        </h1>
        <button
          v-if="matter.archived"
          @click="$emit('archived-badge-click')"
          class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-200 text-slate-800 shadow-sm cursor-pointer hover:bg-amber-300 transition-colors"
        >
          Archived
        </button>
      </div>
      <p class="text-base text-slate-300 leading-relaxed">{{ matter.description }}</p>

      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="absolute top-5 right-6 flex-shrink-0 w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        title="Clear selected matter"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Two-Column Grid: Parties (2fr) and Firm (1fr) -->
    <div class="p-6">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column: Parties (2fr) -->
        <div class="lg:col-span-2">
          <MatterPartiesSection
            :clients="matter.clients"
            :adverse-parties="matter.adverseParties"
          />
        </div>

        <!-- Right Column: Firm (1fr) -->
        <div class="lg:col-span-1">
          <MatterFirmSection
            :responsible-lawyer-name="responsibleLawyerName"
            :team-members="teamMembers"
          />
        </div>
      </div>
    </div>

    <!-- Back and Edit Buttons -->
    <div class="border-t border-slate-200 px-6 py-4 flex justify-between items-center">
      <button
        @click="$emit('back')"
        class="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back
      </button>

      <button
        v-if="!matter.archived"
        @click="$emit('edit')"
        class="inline-flex items-center gap-2 px-4 py-2 border border-amber-300 rounded text-sm font-medium text-slate-800 bg-amber-200 hover:bg-amber-300 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
        Edit
      </button>
    </div>

    <!-- History Footer -->
    <div class="bg-slate-800 border-t border-slate-700 px-6 py-3">
      <div class="flex flex-wrap items-center gap-x-8 gap-y-2 text-xs text-slate-400">
        <!-- Created -->
        <div
          class="cursor-help"
          :title="
            matter.createdBy
              ? `Created by ${userDisplayNames.get(matter.createdBy) || 'Unknown User'}`
              : undefined
          "
        >
          <span class="font-medium">Created:</span>
          <span class="ml-1.5">{{ formatDate(matter.createdAt) }}</span>
        </div>

        <!-- Last Updated -->
        <div
          v-if="matter.updatedAt"
          class="cursor-help"
          :title="
            matter.updatedBy
              ? `Updated by ${userDisplayNames.get(matter.updatedBy) || 'Unknown User'}`
              : undefined
          "
        >
          <span class="font-medium">Last Updated:</span>
          <span class="ml-1.5">{{ formatDate(matter.updatedAt) }}</span>
        </div>

        <!-- Last Accessed -->
        <div>
          <span class="font-medium">Last Accessed:</span>
          <span class="ml-1.5">{{ formatDate(matter.lastAccessed) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * MatterInfoCard - Displays matter information card
 *
 * Responsibilities:
 * - Matter information card container
 * - Header with matter number, description, archived badge, close button
 * - Two-column grid orchestration (Parties + Firm sections)
 * - Back and Edit buttons
 * - History footer (created, updated, last accessed dates)
 */

import { computed } from 'vue';
import MatterPartiesSection from './MatterPartiesSection.vue';
import MatterFirmSection from './MatterFirmSection.vue';
import { formatDate } from '../composables/useMatterDetail.js';

defineOptions({
  name: 'MatterInfoCard',
});

const props = defineProps({
  matter: {
    type: Object,
    required: true,
  },
  userDisplayNames: {
    type: Map,
    required: true,
  },
});

defineEmits(['close', 'back', 'edit', 'archived-badge-click']);

// Computed properties for Firm section
const responsibleLawyerName = computed(() => {
  if (!props.matter.responsibleLawyer) return null;
  return props.userDisplayNames.get(props.matter.responsibleLawyer) || 'Unknown User';
});

const teamMembers = computed(() => {
  if (!Array.isArray(props.matter.assignedTo)) return [];

  return props.matter.assignedTo
    .filter(id => id !== props.matter.responsibleLawyer)
    .map(userId => props.userDisplayNames.get(userId) || 'Unknown User');
});
</script>
