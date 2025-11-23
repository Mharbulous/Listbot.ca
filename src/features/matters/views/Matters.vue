<template>
  <div class="h-full flex flex-col" style="background-color: #faf8f3">
    <!-- Notification Banner for Redirects -->
    <MattersNotification
      v-model="showNotification"
      :message="notificationMessage"
      :type="notificationType"
    />

    <!-- Page Layout with Gradient and Title -->
    <PageLayout>
      <TitleDrawer title="Matters">
        <MattersFilterControls />
      </TitleDrawer>

      <!-- Table Container -->
      <MattersTable
        :matters="filteredMatters"
        :loading="loading"
        :error="error"
        :document-counts="documentCounts"
        :selected-matter-id="matterViewStore.selectedMatter?.id"
        :empty-state-message="emptyStateMessage"
        @select-matter="selectMatter"
        @retry-fetch="fetchMatters"
      />
    </PageLayout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMatters } from '../composables/useMatters.js';
import { useDocumentCounts } from '../composables/useDocumentCounts.js';
import { useAuthStore } from '@/core/auth/stores/index.js';
import { useMatterViewStore } from '../stores/matterView.js';
import { useMattersFilterStore } from '../stores/mattersFilter.js';
import PageLayout from '@/shared/components/layout/PageLayout.vue';
import TitleDrawer from '@/shared/components/layout/TitleDrawer.vue';
import MattersNotification from '../components/MattersNotification.vue';
import MattersFilterControls from '../components/MattersFilterControls.vue';
import MattersTable from '../components/MattersTable.vue';

defineOptions({
  name: 'MattersView',
});

// Router for navigation
const router = useRouter();
const route = useRoute();

// Stores
const authStore = useAuthStore();
const matterViewStore = useMatterViewStore();
const mattersFilterStore = useMattersFilterStore();

// Composables
const { matters, loading, error, fetchMatters, updateLastAccessed } = useMatters();
const { documentCounts, fetchDocumentCounts } = useDocumentCounts();

// Notification state for redirects
const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref('info');

/**
 * Close dropdown when clicking outside
 */
function handleClickOutside(event) {
  if (mattersFilterStore.statusDropdownOpen) {
    const dropdown = event.target.closest('[data-matters-dropdown]');
    if (!dropdown) {
      mattersFilterStore.closeStatusDropdown();
    }
  }
}

/**
 * Filter matters by user assignment and archived status
 */
const visibleMatters = computed(() => {
  return matters.value.filter((matter) => {
    // Filter by user assignment
    if (mattersFilterStore.showMyMattersOnly && !matter.assignedTo?.includes(authStore.user?.uid)) {
      return false;
    }

    // Filter by status
    if (mattersFilterStore.statusFilter === 'active' && matter.archived) {
      return false;
    }
    if (mattersFilterStore.statusFilter === 'archived' && !matter.archived) {
      return false;
    }

    return true;
  });
});

/**
 * Filter matters by search text
 */
const filteredMatters = computed(() => {
  if (!mattersFilterStore.searchText) {
    return visibleMatters.value;
  }

  const search = mattersFilterStore.caseSensitive
    ? mattersFilterStore.searchText
    : mattersFilterStore.searchText.toLowerCase();

  return visibleMatters.value.filter((matter) => {
    // Convert arrays to strings for searching
    const clientsStr = Array.isArray(matter.clients) ? matter.clients.join(' ') : matter.clients;
    const adversePartiesStr = Array.isArray(matter.adverseParties)
      ? matter.adverseParties.join(' ')
      : matter.adverseParties;

    const fields = [matter.matterNumber, clientsStr, matter.description, adversePartiesStr].join(
      ' '
    );

    const content = mattersFilterStore.caseSensitive ? fields : fields.toLowerCase();

    if (mattersFilterStore.wholeWord) {
      const regex = new RegExp(`\\b${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return regex.test(content);
    }

    return content.includes(search);
  });
});

/**
 * Empty state message based on search state
 */
const emptyStateMessage = computed(() => {
  return mattersFilterStore.searchText
    ? 'Try adjusting your search'
    : 'Create your first matter to get started';
});

/**
 * Handle matter selection
 */
async function selectMatter(matter) {
  // Set the matter in the store (persists to localStorage)
  matterViewStore.setMatter(matter);

  // Update last accessed timestamp
  await updateLastAccessed(matter.id);

  // Navigate to Documents view with matter ID in route
  router.push({ name: 'documents', params: { matterId: matter.id } });
}

/**
 * Handle redirect notifications from route guard
 */
function handleRedirectNotification() {
  const reason = route.query.reason;
  if (reason === 'no_matter_selected') {
    notificationMessage.value = 'Please select a matter to access that page.';
    notificationType.value = 'info';
    showNotification.value = true;
  } else if (reason === 'archived_matter') {
    notificationMessage.value = 'Cannot upload to archived matter. Please select an active matter.';
    notificationType.value = 'warning';
    showNotification.value = true;
  }

  // Auto-hide notification after 8 seconds
  if (showNotification.value) {
    setTimeout(() => {
      showNotification.value = false;
    }, 8000);
  }
}

// Fetch matters and setup on component mount
onMounted(async () => {
  await fetchMatters();
  await fetchDocumentCounts(matters.value, authStore.firmId);

  // Handle redirect notifications
  handleRedirectNotification();

  // Setup click-outside listener for dropdown
  document.addEventListener('click', handleClickOutside);
});

// Clean up event listener on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
