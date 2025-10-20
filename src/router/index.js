import { createRouter, createWebHashHistory } from 'vue-router';
import { createAuthGuard } from './guards/auth'; // Import the auth guard
import { createMatterGuard } from './guards/matter'; // Import the matter guard
import { registerDemoRoutes } from '../dev-demos/utils/demoRoutes'; // Import demo routes

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true, title: 'Home' },
    },
    {
      path: '/home',
      name: 'home-explicit',
      component: () => import('../views/Home.vue'),
      meta: { requiresAuth: true, title: 'Home' },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/About.vue'),
      meta: { requiresAuth: true, title: 'About' },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/Profile.vue'),
      meta: { requiresAuth: true, title: 'Profile' },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: { requiresAuth: true, title: 'Settings' },
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('../features/upload/FileUpload.vue'),
      meta: { requiresAuth: true, requiresActiveMatter: true, title: 'File Upload Center' },
    },
    {
      path: '/analyze',
      name: 'analyze',
      component: () => import('../views/Analyze.vue'),
      meta: { requiresAuth: true, title: 'Analyze' },
    },
    {
      path: '/list',
      name: 'list',
      component: () => import('../views/ListDocuments.vue'),
      meta: { requiresAuth: true, title: 'List' },
    },
    {
      path: '/documents',
      name: 'documents',
      component: () => import('../features/organizer/views/Organizer.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Documents' },
    },
    {
      path: '/documents/view/:fileHash',
      name: 'view-document',
      component: () => import('../features/organizer/views/ViewDocument.vue'),
      meta: { requiresAuth: true, requiresMatter: true, titleFn: true },
    },
    {
      path: '/documents/categories',
      name: 'category-manager',
      component: () => import('../features/organizer/views/CategoryManager.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Documents >> Categories' },
    },
    {
      path: '/documents/categories/new',
      name: 'category-creation-wizard',
      component: () => import('../features/organizer/views/CategoryCreationWizard.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Documents >> Categories >> New' },
    },
    {
      path: '/documents/categories/edit/:id',
      name: 'category-edit',
      component: () => import('../features/organizer/views/CategoryEditWizard.vue'),
      meta: { requiresAuth: true, requiresMatter: true, title: 'Documents >> Categories >> Edit' },
    },
    {
      path: '/matters',
      name: 'matters',
      component: () => import('../views/Matters.vue'),
      meta: { requiresAuth: true, title: 'Matters' },
    },
    {
      path: '/matters/new',
      name: 'new-matter',
      component: () => import('../views/NewMatter.vue'),
      meta: { requiresAuth: true, title: 'New Matter' },
    },
    {
      path: '/matters/import',
      name: 'import-matters',
      component: () => import('../views/MatterImport.vue'),
      meta: { requiresAuth: true, title: 'Import Matters' },
    },
    {
      path: '/matters/:id',
      name: 'matter-detail',
      component: () => import('../views/MatterDetail.vue'),
      meta: { requiresAuth: true, title: 'Matter Details' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/features/auth/LoginForm.vue'),
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
