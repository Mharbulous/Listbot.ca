<template>
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="12" viewBox="0 0 36 12">
    <!-- Top row - 6 dots -->
    <circle v-for="x in DOT_POSITIONS" :key="`top-${x}`" :cx="x" cy="4" r="1" />

    <!-- Bottom row - 6 dots -->
    <circle v-for="x in DOT_POSITIONS" :key="`bot-${x}`" :cx="x" cy="8" r="1" />
  </svg>
</template>

<script setup>
// Horizontal positions for the 6 dots
const DOT_POSITIONS = [3, 9, 15, 21, 27, 33];
</script>
