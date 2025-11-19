<template>
  <div class="matter-import">
    <v-card variant="flat" class="mx-auto">
      <v-card-text class="pt-6">
        <div class="under-construction">
          <v-icon size="64" color="warning">mdi-hard-hat</v-icon>
          <h2 class="text-h5 mt-4">Under Construction</h2>
          <p class="text-body-1 mt-2 text-grey">
            The bulk matter import feature is coming soon.
          </p>
          <v-btn
            variant="outlined"
            color="primary"
            :to="{ name: 'matters' }"
            class="mt-6"
          >
            <v-icon start>mdi-arrow-left</v-icon>
            Back to Matters
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
defineOptions({
  name: 'MatterImportView',
});
</script>

<style scoped>
.matter-import {
  min-width: 50%;
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}

.under-construction {
  text-align: center;
  padding: 60px 20px;
}
</style>
