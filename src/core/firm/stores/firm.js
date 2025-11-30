import { defineStore } from 'pinia';
import { FirmService } from '../../../services/firmService';

export const useFirmStore = defineStore('firm', {
  state: () => ({
    currentFirm: null,
    userFirms: [],
    loading: false,
    error: null,
  }),

  getters: {
    hasFirm: (state) => !!state.currentFirm,
    firmName: (state) => state.currentFirm?.name || null,
    userRole: (state) => {
      if (!state.currentFirm || !state.userFirms.length) return null;
      const userFirm = state.userFirms.find((firm) => firm.id === state.currentFirm.id);
      return userFirm?.userRole || null;
    },
    isFirmAdmin: (state) => {
      if (!state.currentFirm || !state.userFirms.length) return false;
      const userFirm = state.userFirms.find((firm) => firm.id === state.currentFirm.id);
      return userFirm?.userRole === 'admin';
    },
  },

  actions: {
    /**
     * Load firm data for a specific firm ID
     */
    async loadFirm(firmId) {
      if (!firmId) {
        this.currentFirm = null;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const firm = await FirmService.getFirm(firmId);
        this.currentFirm = firm;
        console.log('[Firm] Firm loaded', firm?.name);
      } catch (error) {
        console.error('[Firm] Error loading firm', error, { firmId });
        this.error = error.message;
        this.currentFirm = null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Load all firms for current user
     */
    async loadUserFirms(userId) {
      if (!userId) {
        this.userFirms = [];
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const firms = await FirmService.getUserFirms(userId);
        this.userFirms = firms;
        console.log(`[Firm] Loaded ${firms.length} firms for user`);
      } catch (error) {
        console.error('[Firm] Error loading user firms', error, { userId });
        this.error = error.message;
        this.userFirms = [];
      } finally {
        this.loading = false;
      }
    },

    /**
     * Create a new firm
     */
    async createFirm(firmId, firmData) {
      this.loading = true;
      this.error = null;

      try {
        await FirmService.createFirm(firmId, firmData);

        // Reload user firms to include the new firm
        const authStore = await import('../../auth/stores/authStore').then((m) => m.useAuthStore());
        if (authStore.user?.uid) {
          await this.loadUserFirms(authStore.user.uid);
        }

        console.log('[Firm] Firm created successfully');
      } catch (error) {
        console.error('[Firm] Error creating firm', error, { firmId });
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Add member to current firm
     */
    async addMember(userId, memberData) {
      if (!this.currentFirm) {
        throw new Error('No firm selected');
      }

      this.loading = true;
      this.error = null;

      try {
        await FirmService.addFirmMember(this.currentFirm.id, userId, memberData);

        // Reload firm data to get updated member list
        await this.loadFirm(this.currentFirm.id);

        console.log('[Firm] Member added successfully');
      } catch (error) {
        console.error('[Firm] Error adding member', error, { firmId: this.currentFirm?.id, userId });
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Remove member from current firm
     */
    async removeMember(userId) {
      if (!this.currentFirm) {
        throw new Error('No firm selected');
      }

      this.loading = true;
      this.error = null;

      try {
        await FirmService.removeFirmMember(this.currentFirm.id, userId);

        // Reload firm data to get updated member list
        await this.loadFirm(this.currentFirm.id);

        console.log('[Firm] Member removed successfully');
      } catch (error) {
        console.error('[Firm] Error removing member', error, { firmId: this.currentFirm?.id, userId });
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Update member role in current firm
     */
    async updateMemberRole(userId, newRole) {
      if (!this.currentFirm) {
        throw new Error('No firm selected');
      }

      this.loading = true;
      this.error = null;

      try {
        await FirmService.updateMemberRole(this.currentFirm.id, userId, newRole);

        // Reload firm data to get updated roles
        await this.loadFirm(this.currentFirm.id);

        console.log('[Firm] Member role updated successfully');
      } catch (error) {
        console.error('[Firm] Error updating member role', error, { firmId: this.currentFirm?.id, userId, newRole });
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Clear firm data (useful for logout)
     */
    clearFirmData() {
      this.currentFirm = null;
      this.userFirms = [];
      this.loading = false;
      this.error = null;
      console.log('[Firm] Firm data cleared');
    },
  },
});
