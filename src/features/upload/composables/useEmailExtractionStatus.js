import { ref, watch, onUnmounted } from 'vue';
import { doc, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '@/services/firebase';

/**
 * Email Extraction Status Composable
 * Monitors email extraction status for uploaded .msg/.eml files
 * Provides real-time status updates and retry functionality
 *
 * @param {Ref<string>} fileHashRef - Reactive reference to file hash
 * @returns {Object} Status monitoring and retry functions
 */
export function useEmailExtractionStatus(fileHashRef) {
  const status = ref(null);
  const error = ref(null);
  const canRetry = ref(false);

  let unsubscribe = null;

  watch(fileHashRef, (hash) => {
    if (unsubscribe) unsubscribe();
    if (!hash) return;

    unsubscribe = onSnapshot(doc(db, 'uploads', hash), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();

      status.value = data.parseStatus;
      error.value = data.parseError;
      canRetry.value = data.parseStatus === 'failed' && data.retryCount < 3;
    });
  }, { immediate: true });

  async function retry() {
    if (!fileHashRef.value || !canRetry.value) return;
    const fn = httpsCallable(functions, 'retryEmailExtraction');
    await fn({ fileHash: fileHashRef.value });
  }

  onUnmounted(() => unsubscribe?.());

  return { status, error, canRetry, retry };
}
