<template>
  <div class="cloud-page">
    <div class="initialization-message">
      <p>Cloud Table Initializing...</p>
      <p class="text-muted">Check browser console for initialization details</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';

// Log initialization messages as specified in Phase 0
onMounted(() => {
  console.log('[Cloud Table] Initializing virtual scrolling table...');

  // Log TanStack Virtual version
  try {
    // We'll import the package to get its version
    import('@tanstack/vue-virtual').then((module) => {
      // Try to get version from package.json if available
      console.log('[Cloud Table] TanStack Virtual loaded successfully');
    });
  } catch (error) {
    console.warn('[Cloud Table] Could not determine TanStack Virtual version');
  }

  // Log browser information
  console.log('[Cloud Table] Browser:', navigator.userAgent);

  // Log component mount time
  const mountTime = performance.now();
  console.log('[Cloud Table] Component mounted at:', mountTime.toFixed(2) + 'ms');
});
</script>

<style scoped>
.cloud-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.initialization-message {
  text-align: center;
}

.initialization-message p {
  font-size: 1.125rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.text-muted {
  font-size: 0.875rem;
  color: #64748b;
}
</style>
