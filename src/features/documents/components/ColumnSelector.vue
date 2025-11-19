<template>
  <v-menu offset-y :close-on-content-click="false">
    <template v-slot:activator="{ props: menuProps }">
      <v-btn v-bind="menuProps" variant="outlined" size="small" prepend-icon="mdi-view-column">
        Columns
        <v-chip size="x-small" class="ml-2" color="primary">
          {{ visibleCount }}/{{ totalCount }}
        </v-chip>
      </v-btn>
    </template>

    <v-card class="column-selector-menu" min-width="280">
      <v-card-title class="text-subtitle-2 d-flex align-center justify-space-between">
        <span>Show/Hide Columns</span>
        <v-btn size="x-small" variant="text" color="primary" @click="handleResetToDefaults">
          Show All
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-2">
        <v-list density="compact">
          <v-list-item v-for="column in allColumns" :key="column.key" class="column-item">
            <template v-slot:prepend>
              <v-checkbox
                :model-value="isColumnVisible(column.key)"
                :disabled="isColumnRequired(column.key)"
                hide-details
                density="compact"
                @update:model-value="() => handleToggle(column.key)"
              ></v-checkbox>
            </template>

            <v-list-item-title class="text-body-2">
              {{ column.title }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  allColumns: {
    type: Array,
    required: true,
  },
  visibleColumnKeys: {
    type: Array,
    required: true,
  },
  isColumnVisible: {
    type: Function,
    required: true,
  },
  isColumnRequired: {
    type: Function,
    required: true,
  },
  toggleColumn: {
    type: Function,
    required: true,
  },
  resetToDefaults: {
    type: Function,
    required: true,
  },
});

const visibleCount = computed(() => props.visibleColumnKeys.length);
const totalCount = computed(() => props.allColumns.length);

function handleToggle(columnKey) {
  props.toggleColumn(columnKey);
}

function handleResetToDefaults() {
  props.resetToDefaults();
}
</script>

<style scoped>
.column-selector-menu {
  max-height: 500px;
  overflow-y: auto;
}

.column-item {
  padding: 4px 8px;
}

.column-item:hover {
  background-color: #f9fafb;
}
</style>
