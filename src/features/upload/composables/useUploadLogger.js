import { db } from '../../../services/firebase.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../core/stores/auth.js';

export function useUploadLogger() {
  const authStore = useAuthStore();

  /**
   * Log a simple upload event with minimal essential information
   * @param {Object} event - Upload event details
   * @param {string} event.eventType - Type of event ('upload_interrupted', 'upload_success', 'upload_failed', 'upload_skipped_metadata_recorded')
   * @param {string} event.fileName - Original file name
   * @param {string} event.fileHash - SHA-256 hash of file content
   * @param {string} event.metadataHash - SHA-256 hash of metadata
   */
  const logUploadEvent = async (event) => {
    try {
      const teamId = authStore.currentTeam;
      if (!teamId) {
        throw new Error('No team ID available for logging');
      }

      // Create minimal upload event with only essential fields
      const eventData = {
        eventType: event.eventType,
        timestamp: serverTimestamp(),
        fileName: event.fileName,
        fileHash: event.fileHash,
        metadataHash: event.metadataHash,
        teamId: teamId,
        userId: authStore.user.uid,
      };

      const eventsCollection = collection(
        db,
        'teams',
        teamId,
        'matters',
        'general',
        'uploadEvents'
      );
      const docRef = await addDoc(eventsCollection, eventData);

      console.log(`Upload event logged: ${event.eventType} - ${event.fileName}`, {
        eventId: docRef.id,
        fileHash: event.fileHash,
      });

      return docRef.id;
    } catch (error) {
      console.error('Failed to log upload event:', error);
      throw error;
    }
  };

  /**
   * Update an existing upload event document
   * @param {string} eventId - Document ID of the event to update
   * @param {Object} updates - Fields to update (e.g., { eventType: 'upload_success' })
   */
  const updateUploadEvent = async (eventId, updates) => {
    try {
      const teamId = authStore.currentTeam;
      if (!teamId) {
        throw new Error('No team ID available for updating event');
      }

      if (!eventId) {
        throw new Error('Event ID is required for updating upload event');
      }

      const eventDocRef = doc(
        db,
        'teams',
        teamId,
        'matters',
        'general',
        'uploadEvents',
        eventId
      );

      await updateDoc(eventDocRef, updates);

      console.log(`Upload event updated: ${eventId}`, updates);
      return eventId;
    } catch (error) {
      console.error('Failed to update upload event:', error);
      throw error;
    }
  };

  return {
    logUploadEvent,
    updateUploadEvent,
  };
}
