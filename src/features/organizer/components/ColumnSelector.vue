<template>
  <v-menu offset-y>
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
          Reset
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
              <v-chip
                v-if="isColumnRequired(column.key)"
                size="x-small"
                color="grey"
                variant="text"
                class="ml-1"
              >
                Required
              </v-chip>
            </v-list-item-title>

            <template v-slot:append>
              <v-tooltip location="left">
                <template v-slot:activator="{ props: tooltipProps }">
                  <v-icon v-bind="tooltipProps" size="small" color="grey-lighten-1">
                    mdi-information-outline
                  </v-icon>
                </template>
                <span>{{ column.description }}</span>
              </v-tooltip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="text-caption text-grey-darken-1 px-4 py-2">
        <span>{{ visibleCount }} of {{ totalCount }} columns visible</span>
      </v-card-actions>
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
