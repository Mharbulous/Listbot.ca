import { ref } from 'vue';

/**
 * Composable for handling file and folder drag-and-drop operations.
 *
 * Implements the two-phase DataTransfer API pattern:
 * - Phase 1: Synchronous extraction (must happen in same tick)
 * - Phase 2: Asynchronous processing (safe to use await)
 *
 * @returns {Object} Drag-drop state and handlers
 */
export function useFileDropHandler() {
  // Reactive state
  const isDragOver = ref(false);
  const showMultiDropError = ref(false);

  /**
   * Normalizes a DataTransferItem to a unified entry interface.
   * Creates a consistent structure for both FileSystemEntry and fallback File objects.
   *
   * @param {DataTransferItem} item - The DataTransferItem to normalize
   * @returns {Object|null} Normalized entry with isFile, isDirectory, name, and getFile() method
   */
  const normalizeEntry = (item) => {
    if (item.kind !== 'file') return null;

    // Try to get FileSystemEntry first (modern browsers)
    const entry = item.webkitGetAsEntry?.();

    if (entry) {
      // Wrap FileSystemEntry with consistent interface
      return {
        isFile: entry.isFile,
        isDirectory: entry.isDirectory,
        name: entry.name,
        fullPath: entry.fullPath,
        getFile: () => new Promise((resolve, reject) => {
          if (entry.isFile) {
            entry.file(resolve, reject);
          } else {
            reject(new Error('Cannot get file from directory entry'));
          }
        }),
        // Keep original entry for directory traversal
        _originalEntry: entry,
      };
    }

    // Fallback for browsers without webkitGetAsEntry
    const file = item.getAsFile();
    if (file) {
      return {
        isFile: true,
        isDirectory: false,
        name: file.name,
        fullPath: file.name,
        getFile: () => Promise.resolve(file),
        _originalEntry: null,
      };
    }

    return null;
  };

  /**
   * Recursively traverses a directory entry and extracts all files.
   * Handles Chrome's 100-entry limitation by calling readEntries() until empty.
   *
   * @param {Object} normalizedEntry - Normalized entry with _originalEntry
   * @param {Array<File>} filesList - Accumulator array for collected files
   */
  const traverseDirectory = async (normalizedEntry, filesList) => {
    const dirEntry = normalizedEntry._originalEntry;

    if (!dirEntry || !dirEntry.isDirectory) {
      console.error('[useFileDropHandler] Invalid directory entry');
      return;
    }

    const dirReader = dirEntry.createReader();

    // Read all entries (loop handles 100-entry limitation)
    const readAllEntries = async () => {
      const entries = await new Promise((resolve) => {
        dirReader.readEntries(resolve);
      });

      if (entries.length > 0) {
        // Process this batch
        for (const childEntry of entries) {
          const normalized = {
            isFile: childEntry.isFile,
            isDirectory: childEntry.isDirectory,
            name: childEntry.name,
            fullPath: childEntry.fullPath,
            getFile: () => new Promise((resolve, reject) => {
              if (childEntry.isFile) {
                childEntry.file(resolve, reject);
              } else {
                reject(new Error('Cannot get file from directory entry'));
              }
            }),
            _originalEntry: childEntry,
          };

          await traverseEntry(normalized, filesList);
        }

        // Continue reading (recursive call until empty)
        await readAllEntries();
      }
    };

    await readAllEntries();
  };

  /**
   * Processes a single normalized entry (file or directory).
   * Dispatches to appropriate handler based on entry type.
   *
   * @param {Object} entry - Normalized entry
   * @param {Array<File>} filesList - Accumulator array for collected files
   */
  const traverseEntry = async (entry, filesList) => {
    if (entry.isFile) {
      const file = await entry.getFile();

      // Preserve folder structure by setting path information on the File object
      // The centralized path extractor will read this information later
      // Remove leading slash from fullPath to match webkitRelativePath format
      const relativePath = entry.fullPath.startsWith('/') ? entry.fullPath.slice(1) : entry.fullPath;

      // Try to set webkitRelativePath (standard property for folder structure)
      // If this fails, set _dropPath as fallback
      if (!file.webkitRelativePath) {
        try {
          Object.defineProperty(file, 'webkitRelativePath', {
            value: relativePath,
            writable: false,
            enumerable: true,
            configurable: true,
          });
        } catch (e) {
          // If defineProperty fails, store in _dropPath as fallback
          // The centralized path extractor will check this property
          file._dropPath = relativePath;
        }
      }

      filesList.push(file);
    } else if (entry.isDirectory) {
      await traverseDirectory(entry, filesList);
    }
  };

  /**
   * Phase 1: Synchronous extraction handler.
   * CRITICAL: Must extract all entries in the same tick as the drop event.
   *
   * @param {DragEvent} event - The drop event
   * @returns {Object} Extracted entries and metadata
   */
  const extractDroppedItems = (event) => {
    const items = Array.from(event.dataTransfer.items);
    const entries = [];
    const directories = [];

    // SYNCHRONOUS extraction - must complete before any await
    for (const item of items) {
      const normalized = normalizeEntry(item);
      if (normalized) {
        entries.push(normalized);
        if (normalized.isDirectory) {
          directories.push(normalized);
        }
      }
    }

    return { entries, directories };
  };

  /**
   * Phase 2: Asynchronous processing.
   * Processes all normalized entries and collects files.
   *
   * @param {Array<Object>} entries - Normalized entries to process
   * @returns {Promise<Array<File>>} Collected File objects
   */
  const processEntries = async (entries) => {
    const allFiles = [];

    for (const entry of entries) {
      await traverseEntry(entry, allFiles);
    }

    return allFiles;
  };

  /**
   * Drag over handler - activates dropzone visual state.
   */
  const handleDragOver = () => {
    isDragOver.value = true;
  };

  /**
   * Drag leave handler - deactivates dropzone only when leaving entirely.
   */
  const handleDragLeave = (event) => {
    const dropzone = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    if (!dropzone.contains(relatedTarget)) {
      isDragOver.value = false;
    }
  };

  /**
   * Drop handler - coordinates synchronous extraction and asynchronous processing.
   * Validates multiple folder drops and emits files-dropped event.
   *
   * @param {DragEvent} event - The drop event
   * @param {Function} onFilesDropped - Callback to handle extracted files
   */
  const handleDrop = async (event, onFilesDropped) => {
    isDragOver.value = false;

    // PHASE 1: SYNCHRONOUS EXTRACTION
    const { entries, directories } = extractDroppedItems(event);

    // Validate: prevent multiple folder drops
    if (directories.length > 1) {
      showMultiDropError.value = true;
      return;
    }

    // PHASE 2: ASYNCHRONOUS PROCESSING
    try {
      const files = await processEntries(entries);

      if (files.length > 0 && onFilesDropped) {
        onFilesDropped(files);
      }
    } catch (error) {
      console.error('[useFileDropHandler] Error processing dropped files:', error);
    }
  };

  return {
    // State
    isDragOver,
    showMultiDropError,

    // Handlers
    handleDragOver,
    handleDragLeave,
    handleDrop,

    // Utilities (exposed for testing)
    normalizeEntry,
    extractDroppedItems,
    processEntries,
  };
}
