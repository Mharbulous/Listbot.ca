import { computed } from 'vue';
import { useMatterViewStore } from '@/features/matters/stores/matterView';
import { useOrganizerStore } from '@/features/documents/stores/organizer';

/**
 * Navigation items configuration for the sidebar
 * Defines all navigation routes, icons, and labels organized by section
 */
export function useNavItems() {
  const matterViewStore = useMatterViewStore();
  const organizerStore = useOrganizerStore();

  return [
    // Matters (Special - not part of EDRM workflow)
    { key: 'matters', path: '/matters', icon: '🗄️', label: 'Matters' },

    // Pleadings and Issues (not part of EDRM workflow)
    { key: 'pleadings', path: '/pleadings', icon: '📜', label: 'Pleadings' },
    { key: 'law', path: '/law', icon: '📚', label: 'Legal memos' },
    { key: 'facts', path: '/facts', icon: '⚖️', label: 'Facts' },
    { key: 'cast', path: '/cast', icon: '🎭', label: 'Characters' },

    // EDRM Workflow Section Header
    { key: 'edrm-header', type: 'header', label: 'Discovery Workflow' },

    // EDRM Stage 1: Identify
    { key: 'identify', path: '/identify', icon: '🕵️', label: 'Identify' },

    // EDRM Stage 2: Preserve
    { key: 'preserve', path: '/upload', icon: '☁️', label: 'Preserve' },

    // EDRM Stage 3: Collect
    {
      key: 'collect',
      path: computed(() =>
        matterViewStore.currentMatterId
          ? `/matters/${matterViewStore.currentMatterId}/documents`
          : '/documents'
      ),
      icon: '🗃️',
      label: 'Collect',
    },

    // EDRM Stage 4: Process
    { key: 'process', path: '/process', icon: '🤖', label: 'Process' },

    // EDRM Stage 5: Review
    {
      key: 'review',
      path: computed(() => {
        const matterId = matterViewStore.currentMatterId;
        if (!matterId) return '/analyze';

        // Try to get last viewed document from local storage
        const lastViewedDoc = localStorage.getItem('lastViewedDocument');
        if (lastViewedDoc) {
          return `/matters/${matterId}/review/${lastViewedDoc}`;
        }

        // Otherwise, get first document from organizer store
        const firstDoc = organizerStore.sortedEvidenceList?.[0];
        if (firstDoc) {
          return `/matters/${matterId}/review/${firstDoc.id}`;
        }

        // Fallback to analyze page if no documents
        return '/analyze';
      }),
      icon: '🧑‍💻',
      label: 'Review',
    },

    // EDRM Stage 6: Analysis
    { key: 'analysis', path: '/analysis', icon: '🧠', label: 'Analysis' },

    // EDRM Stage 7: Produce
    { key: 'produce', path: '/list', icon: '📃', label: 'Produce' },

    // EDRM Stage 8: Present
    { key: 'present', path: '/present', icon: '🏛️', label: 'Present' },

    // End of Workflow Section Header
    { key: 'workflow-end', type: 'header', label: 'Resources' },

    // SSO (Special - not part of EDRM workflow)
    { key: 'sso', path: '/sso', icon: '↔️', label: 'SSO' },
  ];
}

/**
 * Get the icon for a navigation item
 * Handles special cases like the Collect folder icon that changes on hover/active
 *
 * @param {Object} item - Navigation item
 * @param {boolean} isHovered - Whether the item is currently hovered
 * @param {boolean} isActive - Whether the item is currently active
 * @returns {string} The icon emoji to display
 */
export function getItemIcon(item, isHovered = false, isActive = false) {
  // Special handling for Collect (Documents) item - show open folder when hovered or active
  if (item.key === 'collect') {
    return isHovered || isActive ? '📂' : '📁';
  }
  return item.icon;
}
