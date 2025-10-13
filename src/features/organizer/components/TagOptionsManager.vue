<template>
  <div class="tag-options-manager">
    <!-- Input field for adding new tag options -->
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="newTagInput"
          :label="placeholder"
          variant="outlined"
          density="comfortable"
          :disabled="disabled"
          :error-messages="inputError"
          :counter="maxLength"
          :maxlength="maxLength"
          @keydown.enter.prevent="addTag"
          @keydown.escape="clearInput"
          @input="clearError"
        >
          <template #append>
            <v-btn
              color="primary"
              variant="text"
              :disabled="!canAddTag || disabled"
              @click="addTag"
            >
              Add
            </v-btn>
          </template>
        </v-text-field>
      </v-col>
    </v-row>

    <!-- Display existing tags as chips -->
    <div v-if="localTags.length > 0" class="tags-container mt-2">
      <v-chip
        v-for="tag in localTags"
        :key="tag.id"
        class="ma-1"
        closable
        :disabled="disabled"
        @click:close="removeTag(tag.id)"
      >
        {{ tag.name }}
      </v-chip>
    </div>

    <!-- Empty state message -->
    <div v-else class="text-caption text-medium-emphasis mt-2">
      No tag options added yet. Enter a tag option above and click "Add".
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
  maxLength: {
    type: Number,
    default: 32,
  },
  label: {
    type: String,
    default: 'Tag Options',
  },
  placeholder: {
    type: String,
    default: 'Add tag option...',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

// Local state
const newTagInput = ref('');
const inputError = ref('');
const localTags = ref([...props.modelValue]);

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    localTags.value = [...newValue];
  },
  { deep: true }
);

// Computed property to check if tag can be added
const canAddTag = computed(() => {
  const trimmed = newTagInput.value.trim();
  return trimmed.length > 0 && trimmed.length <= props.maxLength && !inputError.value;
});

/**
 * Check if tag name already exists (case-insensitive)
 */
const isDuplicate = (tagName) => {
  const lowerName = tagName.toLowerCase();
  return localTags.value.some((tag) => tag.name.toLowerCase() === lowerName);
};

/**
 * Validate tag input
 */
const validateTag = (tagName) => {
  const trimmed = tagName.trim();

  if (trimmed.length === 0) {
    return 'Tag option cannot be empty';
  }

  if (trimmed.length > props.maxLength) {
    return `Tag option must be ${props.maxLength} characters or less`;
  }

  if (isDuplicate(trimmed)) {
    return 'This tag option already exists (case-insensitive)';
  }

  return null;
};

/**
 * Add new tag option
 */
const addTag = () => {
  const trimmed = newTagInput.value.trim();

  // Validate
  const error = validateTag(trimmed);
  if (error) {
    inputError.value = error;
    return;
  }

  // Create new tag object
  const newTag = {
    id: crypto.randomUUID(),
    name: trimmed,
  };

  // Add to local array
  localTags.value.push(newTag);

  // Emit update
  emit('update:modelValue', localTags.value);

  // Clear input
  clearInput();
};

/**
 * Remove tag option by ID
 */
const removeTag = (tagId) => {
  localTags.value = localTags.value.filter((tag) => tag.id !== tagId);
  emit('update:modelValue', localTags.value);
};

/**
 * Clear input field and error
 */
const clearInput = () => {
  newTagInput.value = '';
  inputError.value = '';
};

/**
 * Clear error when user types
 */
const clearError = () => {
  if (inputError.value) {
    inputError.value = '';
  }
};
</script>

<style scoped>
.tag-options-manager {
  padding: 12px 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
