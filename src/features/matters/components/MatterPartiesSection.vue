<template>
  <div class="bg-slate-50 rounded-lg p-5 border border-slate-200">
    <h2 class="text-lg font-semibold text-slate-900 mb-4">Parties</h2>

    <!-- Clients -->
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
            d="M309.334 117.333c0-41.237-33.43-74.666-74.667-74.666l-4.097.11C191.238 44.904 160 77.471 160 117.333C160 158.571 193.43 192 234.667 192l4.097-.111c39.332-2.126 70.57-34.693 70.57-74.556M256 362.667c0 23.314 6.233 45.173 17.124 64H85.334v-76.8c0-62.033 47.668-112.614 107.383-115.104l4.616-.096H272c19.434 0 37.712 5.091 53.642 14.047C284.293 269.933 256 312.996 256 362.667m65.303 86.295L384 410.667l62.697 38.295l-17.046-71.463l55.795-47.794l-73.232-5.871L384 256l-28.214 67.834l-73.232 5.871l55.795 47.794z"
            clip-rule="evenodd"
          />
        </svg>
        {{
          Array.isArray(clients) && clients.length === 1
            ? 'Client'
            : 'Clients'
        }}
      </h3>
      <div v-if="Array.isArray(clients) && clients.length > 0" class="space-y-1.5">
        <div
          v-for="(client, index) in clients"
          :key="index"
          class="flex items-center gap-2 text-slate-900"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          {{ client }}
        </div>
      </div>
      <p v-else class="text-slate-500 italic text-sm">No clients listed</p>
    </div>

    <!-- Adverse Parties -->
    <div>
      <h3
        class="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          class="flex-shrink-0"
        >
          <path
            fill="currentColor"
            d="m18.839 20.696l-3.06-3.054l-1.923 1.924q-.102.101-.277.101t-.277-.102q-.46-.46-.46-1.136q0-.677.46-1.137l4.09-4.09q.46-.46 1.137-.46t1.137.46q.101.102.101.277t-.101.277l-1.924 1.923l3.054 3.06q.243.242.243.565t-.243.565l-.827.827q-.242.242-.565.242t-.565-.242M20.758 5.72l-10.8 10.82l.74.734q.46.46.46 1.137t-.46 1.136q-.102.102-.277.102t-.277-.102l-1.923-1.923l-3.06 3.054q-.242.242-.565.242t-.565-.242l-.827-.827q-.242-.242-.242-.565t.242-.566l3.054-3.06l-1.923-1.922q-.102-.102-.102-.277t.102-.277q.46-.46 1.136-.46q.677 0 1.137.46l.754.76L17.944 3.378q.218-.217.522-.348t.628-.131h1.098q.348 0 .578.23t.23.578v1.44q0 .162-.056.301t-.186.27M7.09 9.586l-3.63-3.63q-.218-.218-.339-.522T3 4.806V3.708q0-.349.23-.578t.578-.23h1.098q.323 0 .628.13q.305.131.522.349l3.611 3.63q.224.224.224.53t-.224.53L8.19 9.586q-.223.224-.55.224t-.548-.223"
          />
        </svg>
        Adverse Parties
      </h3>
      <div
        v-if="Array.isArray(adverseParties) && adverseParties.length > 0"
        class="space-y-1.5"
      >
        <div
          v-for="(party, index) in adverseParties"
          :key="index"
          class="flex items-center gap-2 text-slate-900"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {{ party }}
        </div>
      </div>
      <p v-else class="text-slate-500 italic text-sm">No adverse parties listed</p>
    </div>
  </div>
</template>

<script setup>
/**
 * MatterPartiesSection - Displays clients and adverse parties
 *
 * Responsibilities:
 * - Clients section with icon and list
 * - Adverse parties section with icon and list
 * - Empty states for each
 * - Section styling
 */

defineOptions({
  name: 'MatterPartiesSection',
});

defineProps({
  clients: {
    type: Array,
    default: () => [],
  },
  adverseParties: {
    type: Array,
    default: () => [],
  },
});
</script>
