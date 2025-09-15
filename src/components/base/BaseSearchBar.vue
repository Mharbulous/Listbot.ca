<template>
  <div class="search-field-container">
    <v-text-field
      :model-value="modelValue"
      :placeholder="disabled ? 'Search (coming soon)...' : 'Search files by name or tags...'"
      variant="outlined"
      density="compact"
      prepend-inner-icon="mdi-magnify"
      hide-details
      clearable
      :disabled="disabled"
      class="search-field"
      @update:model-value="$emit('update:modelValue', $event)"
      @keyup.enter="handleSearch"
    />
  </div>
</template>

<script>
export default {
  name: 'BaseSearchBar',
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Search...',
    },
  },
  emits: ['update:modelValue', 'search'],
  methods: {
    handleSearch() {
      if (!this.disabled) {
        this.$emit('search', this.modelValue);
      }
    },
  },
};
</script>

<style scoped>
.search-field-container {
  max-width: 400px;
  flex: 1;
  min-width: 200px;
}

.search-field {
  flex: 1;
}

@media (max-width: 768px) {
  .search-field-container {
    max-width: none;
    min-width: unset;
  }
}
</style>
