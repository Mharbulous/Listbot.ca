<template>
  <div class="max-w-6xl mx-auto p-8">
    <slot name="header" />
    <slot name="key-impact" />
    <slot name="content" />
    <slot name="footer" />
  </div>
</template>

<script setup></script>

<style scoped>
/* Fade-in animation */
div {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
