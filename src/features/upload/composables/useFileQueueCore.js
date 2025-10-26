import { ref, shallowRef } from 'vue';

/**
 * File Queue Core Management Composable
 *
 * TERMINOLOGY - Three-Tier File Lifecycle:
 * ==========================================
 * This composable provides core queue management for SOURCE FILES during upload preparation.
 *
 * 1. DOCUMENT - Original real-world artifact (not handled by this composable)
 *    - Physical or digital original (paper receipt, email PDF, etc.)
 *    - Has a "document date" (transaction date)
 *
 * 2. SOURCE - Digital file on user's device BEFORE upload (handled here)
 *    - Browser File object from user's file system
 *    - Has "source" properties: sourceName, sourceSize, sourceModifiedDate, sourcePath
 *    - This is what we're processing in the queue
 *
 * 3. FILE - Digital file AFTER upload to Firebase Storage (not handled here)
 *    - Stored with hash-based deduplication
 *    - Has upload metadata, storage path, etc.
 *
 * QUEUE STRUCTURE:
 * ================
 * Each queue item represents a SOURCE FILE being prepared for upload:
 * {
 *   id: string,                    // Unique queue item ID
 *   sourceFile: File,              // Browser File object (the actual source file from user's device)
 *   sourceName: string,            // Name of source file
 *   sourceSize: number,            // Size in bytes of source file
 *   sourceType: string,            // MIME type of source file
 *   sourceModifiedDate: number,    // Timestamp when source file was last modified
 *   sourcePath: string,            // Path of source file on user's filesystem
 *   status: string,                // Processing status: 'pending', 'ready', 'uploading', etc.
 *   isDuplicate: boolean,          // Whether this source file is a duplicate (by hash)
 *   metadata: object,              // Additional metadata about the source file
 *   hash?: string                  // BLAKE3 hash (only if calculated during deduplication)
 * }
 */
export function useFileQueueCore() {
  // Reactive data - Use shallowRef for better performance with large arrays of source files
  const uploadQueue = shallowRef([]);

  // Template refs for source file input elements
  const fileInput = ref(null);
  const folderInput = ref(null);

  // Helper function to get source file path from filesystem consistently
  const getFilePath = (fileRef) => {
    // Handle direct File objects (source files from user's device)
    if (fileRef instanceof File) {
      return fileRef.path || fileRef.webkitRelativePath || fileRef.name;
    }
    // Handle file reference objects containing source files
    return (
      fileRef.path ||
      fileRef.file?.webkitRelativePath ||
      fileRef.file?.path ||
      fileRef.file?.name ||
      fileRef.name
    );
  };

  // Source file input handlers
  const triggerFileSelect = () => {
    fileInput.value.click();
  };

  const triggerFolderSelect = () => {
    folderInput.value.click();
  };

  // Source file processing functions
  const processSingleFile = async (file, processFiles) => {
    // For single source files, add to queue for processing
    await addFilesToQueue([file], processFiles);
  };

  const addFilesToQueue = async (files, processFiles) => {
    if (files.length === 0) return;
    const startTime = Date.now();
    await processFiles(files); // Process source files from user's device
    // Note: Total time will be logged when UI update completes
    window.endToEndStartTime = startTime;
  };

  // Helper function to process source files into queue item format
  const processFileChunk = (files) => {
    return files.map((fileRef) => {
      const queueItem = {
        id: crypto.randomUUID(),
        sourceFile: fileRef.file,
        sourceName: fileRef.file.name,
        sourceSize: fileRef.file.size,
        sourceType: fileRef.file.type,
        sourceModifiedDate: fileRef.file.lastModified,
        sourcePath: fileRef.path || getFilePath(fileRef),
        metadata: fileRef.metadata,
        status: fileRef.status,
        isDuplicate: fileRef.status === 'uploadMetadataOnly',
      };

      // Only include hash if it was calculated during deduplication process
      if (fileRef.hash) {
        queueItem.hash = fileRef.hash;
      }

      return queueItem;
    });
  };

  // Queue management
  const removeFromQueue = (fileId) => {
    const index = uploadQueue.value.findIndex((f) => f.id === fileId);
    if (index > -1) {
      uploadQueue.value.splice(index, 1);
    }
  };

  const clearQueue = () => {
    uploadQueue.value = [];
  };

  const startUpload = () => {
    // Placeholder for actual upload implementation
    // TODO: Implement file upload logic
  };

  return {
    // Reactive data
    uploadQueue,
    fileInput,
    folderInput,

    // Core methods
    getFilePath,
    triggerFileSelect,
    triggerFolderSelect,
    processSingleFile,
    addFilesToQueue,
    processFileChunk,
    removeFromQueue,
    clearQueue,
    startUpload,
  };
}
