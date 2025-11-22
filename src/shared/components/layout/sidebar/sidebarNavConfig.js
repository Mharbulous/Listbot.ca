import { computed } from 'vue';
import { useMatterViewStore } from '@/features/matters/stores/matterView';

/**
 * Navigation items configuration for the sidebar
 * Defines all navigation routes, icons, and labels organized by section
 */
export function useNavItems() {
  const matterViewStore = useMatterViewStore();

  return [
    // Matters (Special - not part of EDRM workflow)
    { key: 'matters', path: '/matters', icon: '🗄️', label: 'Matters' },

    // Pleadings and Issues (not part of EDRM workflow)
    { key: 'facts', path: '/facts', icon: '⚖️', label: 'Facts', stubPath: '/facts/stub', stubStatus: 'placeholder' },
    { key: 'cast', path: '/cast', icon: '🎭', label: 'Characters', stubPath: '/cast/stub', stubStatus: 'placeholder' },
    { key: 'law', path: '/law', icon: '📚', label: 'Law', stubPath: '/law/stub', stubStatus: 'placeholder' },
    { key: 'theory', path: '/theory', icon: '♙', label: 'Theory', stubPath: '/theory/stub', stubStatus: 'placeholder' },
    { key: 'pleadings', path: '/pleadings', icon: '📜', label: 'Pleadings', stubPath: '/pleadings/stub', stubStatus: 'placeholder' },

    // Spacer for visual separation
    { key: 'spacer-1', type: 'spacer' },

    // EDRM Workflow Section Header
    { key: 'edrm-header', type: 'header', label: 'Document Discovery' },

    // EDRM Stage 1: Identify
    { key: 'identify', path: '/identify', icon: '🕵️', label: 'Identify', stubPath: '/identify/stub', stubStatus: 'placeholder' },

    // EDRM Stage 2: Preserve
    { key: 'preserve', path: '/upload', icon: '☁️', label: 'Preserve', stubPath: '/upload/stub', stubStatus: 'building' },

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
      stubPath: '/collect/stub',
      stubStatus: 'building',
    },

    // EDRM Stage 4: Process
    { key: 'process', path: '/process', icon: '🤖', label: 'Process', stubPath: '/process/stub', stubStatus: 'placeholder' },

    // EDRM Stage 5: Review
    {
      key: 'review',
      path: computed(() => {
        const matterId = matterViewStore.currentMatterId;
        if (!matterId) return '/analysis/stub';

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
        return '/analysis/stub';
      }),
      icon: '🧑‍💻',
      label: 'Review',
      stubPath: '/review/stub',
      stubStatus: 'building',
    },

    // EDRM Stage 6: Analysis
    { key: 'analysis', path: '/analysis', icon: '🧠', label: 'Analysis', stubPath: '/analysis/stub', stubStatus: 'placeholder' },

    // EDRM Stage 7: Produce
    { key: 'produce', path: '/produce', icon: '📃', label: 'Produce', stubPath: '/list/stub', stubStatus: 'placeholder' },

    // EDRM Stage 8: Present
    { key: 'present', path: '/present', icon: '🏛️', label: 'Present', stubPath: '/present/stub', stubStatus: 'placeholder' },    
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

/**
 * Get the stub button icon based on implementation status
 *
 * @param {Object} item - Navigation item with stubStatus property
 * @returns {string} The icon emoji to display
 */
export function getStubIcon(item) {
  const statusIcons = {
    placeholder: '📐', // No functional page - only generic placeholder/redirect exists
    building: '🏗️',    // Partial implementation - functional page exists but incomplete
    complete: '🆕',    // Feature-complete - all stub features implemented
  };

  return statusIcons[item.stubStatus] || '🚧'; // Default to construction sign if status not recognized
}
