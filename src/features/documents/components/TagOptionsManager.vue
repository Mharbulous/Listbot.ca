<template>
  <div class="tag-options-manager">
    <v-row dense align="center" class="mb-2">
      <v-col cols="auto">
        <v-btn
          color="primary"
          variant="elevated"
          height="56"
          class="px-6"
          :disabled="!canAddTag || disabled"
          @click="addTag"
        >
          ADD TAG
        </v-btn>
      </v-col>
      <v-col>
        <v-text-field
          v-model="newTagInput"
          :label="placeholder"
          variant="outlined"
          density="default"
          hide-details
          :disabled="disabled"
          :maxlength="maxLength"
          @keydown.enter.prevent="addTag"
          @keydown.escape="clearInput"
          @input="handleInput"
        />
      </v-col>
    </v-row>

    <div v-if="inputError" class="text-error text-caption mb-2">
      {{ inputError }}
    </div>

    <div v-if="localTags.length" class="d-flex flex-wrap ga-2">
      <v-chip
        v-for="tag in localTags"
        :key="tag.name"
        closable
        :disabled="disabled"
        @click:close="removeTag(tag.name)"
      >
        {{ tag.name }}
      </v-chip>
    </div>

    <div v-else class="text-caption text-medium-emphasis">
      No tag options added yet. Enter a tag option above and click "Add Tag".
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { capitalizeFirstLetter } from '../utils/categoryFormHelpers.js';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxLength: { type: Number, default: 32 },
  label: { type: String, default: 'Tag Options' },
  placeholder: { type: String, default: 'Add tag option...' },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const newTagInput = ref('');
const inputError = ref('');
const localTags = ref([...props.modelValue]);

watch(
  () => props.modelValue,
  (val) => (localTags.value = [...val]),
  { deep: true }
);

const canAddTag = computed(() => {
  const trimmed = newTagInput.value.trim();
  return trimmed.length > 0 && trimmed.length <= props.maxLength && !inputError.value;
});

const addTag = () => {
  const name = capitalizeFirstLetter(newTagInput.value.trim());

  if (!name) {
    inputError.value = 'Tag option cannot be empty';
    return;
  }

  if (name.length > props.maxLength) {
    inputError.value = `Tag option must be ${props.maxLength} characters or less`;
    return;
  }

  if (localTags.value.some((tag) => tag.name.toLowerCase() === name.toLowerCase())) {
    inputError.value = 'This tag option already exists';
    return;
  }

  localTags.value.push({ name });
  emit('update:modelValue', localTags.value);
  clearInput();
};

const removeTag = (tagName) => {
  localTags.value = localTags.value.filter((tag) => tag.name !== tagName);
  emit('update:modelValue', localTags.value);
};

const handleInput = () => {
  const capitalized = capitalizeFirstLetter(newTagInput.value);
  if (capitalized !== newTagInput.value) {
    newTagInput.value = capitalized;
  }
  inputError.value = '';
};

const clearInput = () => {
  newTagInput.value = '';
  inputError.value = '';
};
</script>

<style scoped>
.tag-options-manager {
  padding: 12px 0;
}
</style>
<!-- Streamlined from 185 lines to 91 lines on 2025-01-27 -->
