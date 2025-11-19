/**
 * Auth Module Entry Point
 *
 * Re-exports the auth store for backward compatibility.
 * This allows existing imports to continue working:
 *
 * ```js
 * import { useAuthStore } from '@/core/auth/stores'
 * ```
 *
 * Internal modules:
 * - authStore.js - Core Pinia store, state, getters, actions
 * - authFirmSetup.js - Firm management (Solo Firm architecture)
 * - authStateHandlers.js - Auth lifecycle (state machine handlers)
 */

export { useAuthStore } from './authStore';
