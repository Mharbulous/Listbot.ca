import { createRouter, createWebHashHistory } from 'vue-router';
import { createAuthGuard } from '../features/authentication/guards/authGuard'; // Import the auth guard
import { createMatterGuard } from '../features/matters/guards/matterGuard'; // Import the matter guard
import { registerDemoRoutes } from '../dev-demos/utils/demoRoutes'; // Import demo routes

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
      meta: { requiresAuth: true, title: 'Home' },
    },
    {
      path: '/home',
      name: 'home-explicit',
      component: () => import('../views/sso.vue'),
      meta: { requiresAuth: true, title: 'Home' },
    },
    {
      path: '/sso',
      name: 'sso',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true, title: 'SSO' },
    },
    {
      path: '/about',
      redirect: '/sso',
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../features/profile/views/Profile.vue'),
      meta: { requiresAuth: true, title: 'Profile' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../features/profile/views/Settings.vue'),
      meta: { requiresAuth: true, title: 'Settings' },
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('../views/Upload.vue'),
      meta: { requiresAuth: true, requiresActiveMatter: true, title: 'Upload' },
    },
    {
      path: '/upload/stub',
      name: 'preserve',
      component: () => import('../views/Preserve.vue'),
      meta: { requiresAuth: true, title: 'Preserve' },
    },
    {
      path: '/process/stub',
      name: 'process',
      component: () => import('../views/Process.vue'),
      meta: { requiresAuth: true, title: 'Process' },
    },
    {
      path: '/analysis/stub',
      name: 'analysis',
      component: () => import('../views/Analysis.vue'),
      meta: { requiresAuth: true, title: 'Analysis' },
    },
    {
      path: '/analyze',
      redirect: '/analysis/stub',
    },
    {
      path: '/produce',
      redirect: '/list/stub',
    },
    {
      path: '/list/stub',
      name: 'list',
      component: () => import('../views/Produce.vue'),
      meta: { requiresAuth: true, title: 'Produce' },
    },
    {
      path: '/pleadings/stub',
      name: 'pleadings',
      component: () => import('../views/Pleadings.vue'),
      meta: { requiresAuth: true, title: 'Pleadings' },
    },
    {
      path: '/pleadings',
      redirect: '/pleadings/stub',
    },
    {
      path: '/law',
      name: 'law',
      component: () => import('../views/defaults/UnderConstruction.vue'),
      meta: { requiresAuth: true, title: 'Legal Memos' },
    },
    {
      path: '/facts',
      name: 'facts',
      component: () => import('../views/defaults/UnderConstruction.vue'),
      meta: { requiresAuth: true, title: 'Facts' },
    },
    {
      path: '/cast',
      name: 'cast',
      component: () => import('../views/defaults/UnderConstruction.vue'),
      meta: { requiresAuth: true, title: 'Characters' },
    },
    {
      path: '/identify/stub',
      name: 'identify',
      component: () => import('../views/Identify.vue'),
      meta: { requiresAuth: true, title: 'Identify' },
    },
    {
      path: '/present/stub',
      name: 'present',
      component: () => import('../views/Present.vue'),
      meta: { requiresAuth: true, title: 'Present' },
    },
    {
      path: '/matters/:matterId/documents',
      name: 'documents',
      component: () => import('../features/documents/views/Documents.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Collect' },
    },
    {
      path: '/review/stub',
      name: 'review',
      beforeEnter: (to, from, next) => {
        // Intelligent redirect for /review shortcut
        const { useMatterViewStore } = require('../features/matters/stores/matterView');
        const { useOrganizerStore } = require('../features/documents/stores/organizer');

        const matterViewStore = useMatterViewStore();
        const organizerStore = useOrganizerStore();

        const matterId = matterViewStore.currentMatterId;

        // If no matter selected, redirect to analyze page
        if (!matterId) {
          next('/analysis/stub');
          return;
        }

        // Try to get last viewed document from local storage
        const lastViewedDoc = localStorage.getItem('lastViewedDocument');
        if (lastViewedDoc) {
          next({
            name: 'view-document',
            params: {
              matterId: matterId,
              fileHash: lastViewedDoc
            }
          });
          return;
        }

        // Otherwise, get first document from organizer store
        const firstDoc = organizerStore.sortedEvidenceList?.[0];
        if (firstDoc) {
          next({
            name: 'view-document',
            params: {
              matterId: matterId,
              fileHash: firstDoc.id
            }
          });
          return;
        }

        // Fallback to analyze page if no documents
        next('/analysis/stub');
      },
      meta: { requiresAuth: true, title: 'Review' },
    },
    {
      path: '/matters/:matterId/review/:fileHash',
      name: 'view-document',
      component: () => import('../features/documents/views/ViewDocument.vue'),
      meta: { requiresAuth: true, requiresMatter: true, titleFn: true },
    },
    {
      path: '/matters/:matterId/categories',
      name: 'category-manager',
      component: () => import('../features/documents/views/CategoryManager.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Categories' },
    },
    {
      path: '/matters/:matterId/categories/new',
      name: 'category-creation-wizard',
      component: () => import('../features/documents/views/CategoryCreationWizard.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Categories >> New' },
    },
    {
      path: '/matters/:matterId/categories/edit/:id',
      name: 'category-edit',
      component: () => import('../features/documents/views/CategoryEditWizard.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Categories >> Edit' },
    },
    {
      path: '/matters',
      name: 'matters',
      component: () => import('../features/matters/views/Matters.vue'),
      meta: { requiresAuth: true, title: 'Matters' },
    },
    {
      path: '/matters/new',
      name: 'new-matter',
      component: () => import('../features/matters/views/NewMatter.vue'),
      meta: { requiresAuth: true, title: 'New Matter' },
    },
    {
      path: '/matters/import',
      name: 'import-matters',
      component: () => import('../features/matters/views/MatterImport.vue'),
      meta: { requiresAuth: true, title: 'Import Matters' },
    },
    {
      path: '/matters/edit/:matterId',
      name: 'edit-matter',
      component: () => import('../features/matters/views/EditMatter.vue'),
      meta: { requiresAuth: true, title: 'Edit Matter' },
    },
    {
      path: '/matters/:id',
      name: 'matter-detail',
      component: () => import('../features/matters/views/MatterDetail.vue'),
      meta: { requiresAuth: true, title: 'Matter Details' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../features/authentication/components/LoginForm.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/under-construction',
      name: 'under-construction',
      component: () => import('../views/defaults/UnderConstruction.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/404',
      name: 'page-not-found',
      component: () => import('../views/defaults/PageNotFound.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'catch-all',
      redirect: '/404',
    },
  ],
});

// Register demo routes (development only)
registerDemoRoutes(router);

// Apply the global beforeEach guards
router.beforeEach(createAuthGuard());
router.beforeEach(createMatterGuard());

export default router;
