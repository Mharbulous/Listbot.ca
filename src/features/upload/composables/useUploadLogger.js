import { db } from '../../../services/firebase.js';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';

export function useUploadLogger() {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

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
      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available for logging');
      }

      // Validate matter is selected
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter before uploading files.');
      }

      // Create minimal upload event with only essential fields
      const eventData = {
        eventType: event.eventType,
        timestamp: serverTimestamp(),
        fileName: event.fileName,
        fileHash: event.fileHash,
        metadataHash: event.metadataHash,
        firmId: firmId,
        userId: authStore.user.uid,
      };

      const eventsCollection = collection(
        db,
        'firms',
        firmId,
        'matters',
        matterId,
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
      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available for updating event');
      }

      if (!eventId) {
        throw new Error('Event ID is required for updating upload event');
      }

      // Validate matter is selected
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter before updating events.');
      }

      const eventDocRef = doc(db, 'firms', firmId, 'matters', matterId, 'uploadEvents', eventId);

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
