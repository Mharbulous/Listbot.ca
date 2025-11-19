import { useMatterViewStore } from '../stores/matterView';

/**
 * Matter Guard
 *
 * Protects routes that require a matter to be selected.
 * Two levels of protection:
 * - requiresMatter: Any matter must be selected (active or archived)
 * - requiresActiveMatter: An active (non-archived) matter must be selected
 *
 * Redirects to /matters page if requirements not met.
 */
export function createMatterGuard() {
  return async (to, from, next) => {
    const matterStore = useMatterViewStore();

    // Check if route requires matter selection
    const requiresMatter = to.meta.requiresMatter || to.meta.requiresActiveMatter;

    if (!requiresMatter) {
      // Route doesn't need matter validation
      next();
      return;
    }

    // Level 1: Check if any matter is selected
    if (!matterStore.hasMatter) {
      next({
        path: '/matters',
        query: {
          redirect: encodeURIComponent(to.fullPath),
          reason: 'no_matter_selected',
        },
      });
      return;
    }

    // Level 2: Check if route requires ACTIVE (non-archived) matter
    if (to.meta.requiresActiveMatter && !matterStore.canUploadToMatter) {
      next({
        path: '/matters',
        query: {
          redirect: encodeURIComponent(to.fullPath),
          reason: 'archived_matter',
        },
      });
      return;
    }

    // All validations passed
    next();
  };
}
