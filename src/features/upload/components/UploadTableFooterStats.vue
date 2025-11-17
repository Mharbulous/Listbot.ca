<template>
  <div class="footer-stats">
    <!-- Line 1: Ready + Copies = Total -->
    <div class="stats-line">
      <span class="stat-item">
        <strong>{{ stats.ready }}</strong> Ready
      </span>
      <span v-if="stats.copyCount > 0" class="stat-item">
        + <strong>{{ stats.copyCount }}</strong> Copies
      </span>
      <span class="stat-item">
        = <strong>{{ stats.total }}</strong> Total
      </span>
    </div>

    <!-- Line 2: Uploaded | Failed -->
    <div class="stats-line">
      <span class="stat-item">
        <strong>{{ stats.uploaded }}/{{ stats.ready }}</strong> Uploaded
      </span>
      <span class="stat-separator">|</span>
      <span class="stat-item">
        <strong>{{ stats.failed }}</strong> Failed
      </span>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'UploadTableFooterStats',
});

defineProps({
  stats: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        typeof value.total === 'number' &&
        typeof value.ready === 'number' &&
        typeof value.uploaded === 'number' &&
        typeof value.failed === 'number' &&
        typeof value.copyCount === 'number'
      );
    },
  },
});
</script>

<style scoped>
.footer-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stats-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-item strong {
  font-weight: 600;
  color: #1f2937;
}

.stat-separator {
  color: #9ca3af;
}

@media (max-width: 768px) {
  .stats-line {
    gap: 0.35rem;
  }
}
</style>
