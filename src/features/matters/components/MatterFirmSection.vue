<template>
  <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
    <h2 class="text-lg font-semibold text-slate-900 mb-4">Firm</h2>

    <!-- Responsible Lawyer -->
    <div class="mb-4">
      <h3
        class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 512 512"
          class="flex-shrink-0"
        >
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M288 117.333c0-41.237-33.429-74.666-74.667-74.666l-4.096.11c-39.332 2.127-70.57 34.694-70.57 74.556c0 41.238 33.429 74.667 74.666 74.667l4.097-.111c39.332-2.126 70.57-34.693 70.57-74.556m-32 256c0 19.205 4.614 37.332 12.794 53.334H64v-76.8c0-62.033 47.668-112.614 107.383-115.104l4.617-.096h74.667c29.474 0 56.29 11.711 76.288 30.855C285.219 283.501 256 325.005 256 373.333m117.333-96c-53.019 0-96 42.981-96 96s42.981 96 96 96c53.02 0 96-42.981 96-96s-42.98-96-96-96m62.763 62.763l-84.095 84.094l-41.428-41.428l18.856-18.856l22.572 22.572l65.239-65.238z"
            clip-rule="evenodd"
          />
        </svg>
        Responsible Lawyer
      </h3>
      <div v-if="responsibleLawyerName" class="text-slate-900">
        {{ responsibleLawyerName }}
      </div>
      <p v-else class="text-slate-500 italic text-sm">Not assigned</p>
    </div>

    <!-- Team Members -->
    <div>
      <h3
        class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 512 512"
          class="flex-shrink-0"
        >
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M200.876 277.332c-5.588 12.789-8.74 26.884-8.872 41.7L192 320v128H64v-85.333c0-46.676 37.427-84.569 83.922-85.322l1.411-.012zm161.79-42.665c47.13 0 85.334 38.205 85.334 85.333v128H213.333V320c0-47.128 38.205-85.333 85.334-85.333zM170.667 128c35.286 0 64 28.715 64 64s-28.714 64-64 64c-35.285 0-64-28.715-64-64s28.715-64 64-64m160-64c41.174 0 74.667 33.493 74.667 74.667s-33.493 74.666-74.666 74.666c-41.174 0-74.667-33.493-74.667-74.666C256 97.493 289.493 64 330.667 64"
          />
        </svg>
        Team Members
      </h3>
      <div v-if="teamMembers.length > 0" class="space-y-1.5">
        <div
          v-for="memberName in teamMembers"
          :key="memberName"
          class="text-slate-900"
        >
          {{ memberName }}
        </div>
      </div>
      <p v-else class="text-slate-500 italic text-sm">No team members assigned</p>
    </div>
  </div>
</template>

<script setup>
/**
 * MatterFirmSection - Displays firm information
 *
 * Responsibilities:
 * - Responsible lawyer section with icon
 * - Team members section with icon
 * - Empty states for each
 * - Section styling
 */

defineOptions({
  name: 'MatterFirmSection',
});

defineProps({
  responsibleLawyerName: {
    type: String,
    default: null,
  },
  teamMembers: {
    type: Array,
    default: () => [],
  },
});
</script>
