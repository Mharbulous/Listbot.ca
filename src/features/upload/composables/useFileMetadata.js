import { db } from '../../../services/firebase.js';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { updateFolderPaths } from '../../upload/utils/folderPathUtils.js';
import { EvidenceService } from '../../organizer/services/evidenceService.js';
import xxhash from 'xxhash-wasm';

// Initialize xxHash hasher (singleton pattern for performance)
let xxhashInstance = null;
const getXxHash = async () => {
  if (!xxhashInstance) {
    xxhashInstance = await xxhash();
  }
  return xxhashInstance;
};

export function useFileMetadata() {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

  /**
   * Generate metadata hash from file metadata
   * Uses concatenated string: sourceFileName|lastModified|fileHash
   * @param {string} sourceFileName - Original filename
   * @param {number} lastModified - File's last modified timestamp
   * @param {string} fileHash - Content hash of the file
   * @returns {Promise<string>} - xxHash 64-bit hash of metadata string (16 hex chars)
   */
  const generateMetadataHash = async (sourceFileName, lastModified, fileHash) => {
    try {
      // Create deterministic concatenated string with pipe delimiters
      const metadataString = `${sourceFileName}|${lastModified}|${fileHash}`;

      // Generate xxHash 64-bit hash of the metadata string
      const hasher = await getXxHash();
      const hashValue = hasher.h64(metadataString); // Returns BigInt (64-bit hash)
      const metadataHash = hashValue.toString(16).padStart(16, '0'); // Convert to 16-char hex string

      return metadataHash;
    } catch (error) {
      throw new Error(`Failed to generate metadata hash: ${error.message}`);
    }
  };

  /**
   * Create a file metadata record in Firestore
   * @param {Object} fileData - File metadata information
   * @param {string} fileData.sourceFileName - Original filename
   * @param {number} fileData.lastModified - File's last modified timestamp
   * @param {string} fileData.fileHash - Content hash of the file
   * @param {number} fileData.size - File size in bytes (used for Evidence document creation)
   * @param {string} [fileData.originalPath] - Full relative path from folder upload (used to extract folderPath)
   * @param {string} [fileData.sourceFileType] - MIME type of the file
   * @param {string} [fileData.storageCreatedTimestamp] - Firebase Storage timeCreated timestamp (ISO 8601 string)
   * @returns {Promise<string>} - The metadata hash used as document ID
   */
  const createMetadataRecord = async (fileData) => {
    try {
      const { sourceFileName, lastModified, fileHash, size, originalPath, sourceFileType, storageCreatedTimestamp } =
        fileData;

      if (!sourceFileName || !lastModified || !fileHash) {
        throw new Error(
          'Missing required metadata fields: sourceFileName, lastModified, or fileHash'
        );
      }

      const firmId = authStore.currentFirm;
      if (!firmId) {
        throw new Error('No firm ID available for metadata record');
      }

      // Validate matter is selected
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter before uploading files.');
      }

      // Generate metadata hash for document ID
      const metadataHash = await generateMetadataHash(sourceFileName, lastModified, fileHash);

      // Extract folder path from original path if available
      let currentFolderPath = '';
      if (originalPath) {
        const pathParts = originalPath.split('/');
        if (pathParts.length > 1) {
          currentFolderPath = pathParts.slice(0, -1).join('/');
        }
      }

      // Get existing metadata to check for existing sourceFolderPath
      let existingFolderPaths = '';
      try {
        const docRef = doc(
          db,
          'firms',
          firmId,
          'matters',
          matterId,
          'evidence',
          fileHash,
          'sourceMetadata',
          metadataHash
        );
        const existingDoc = await getDoc(docRef);
        if (existingDoc.exists()) {
          existingFolderPaths = existingDoc.data().sourceFolderPath || '';
        }
      } catch (error) {
        // Silently catch errors when retrieving existing folder paths
      }

      // Update folder paths using pattern recognition
      const pathUpdate = updateFolderPaths(currentFolderPath, existingFolderPaths);

      // STEP 1: Create Evidence document FIRST (parent document must exist before subcollections)
      const evidenceService = new EvidenceService(firmId, matterId);

      const uploadMetadata = {
        hash: fileHash,
        sourceFileName: sourceFileName,
        size: size || 0,
        folderPath: currentFolderPath || '/',
        metadataHash: metadataHash,
        storageCreatedTimestamp: storageCreatedTimestamp,
      };

      const evidenceId = await evidenceService.createEvidenceFromUpload(uploadMetadata);

      // STEP 2: Create sourceMetadata subcollection document (now that parent exists)
      const metadataRecord = {
        // Core file metadata (only what varies between identical files)
        sourceFileName: sourceFileName,
        sourceLastModified: Timestamp.fromMillis(lastModified),
        fileHash: fileHash,

        // File path information
        sourceFolderPath: pathUpdate.folderPaths,

        // MIME type information
        sourceFileType: sourceFileType || '',
      };

      // Save to Firestore: /firms/{firmId}/matters/{matterId}/evidence/{fileHash}/sourceMetadata/{metadataHash}
      const docRef = doc(
        db,
        'firms',
        firmId,
        'matters',
        matterId,
        'evidence',
        fileHash,
        'sourceMetadata',
        metadataHash
      );
      await setDoc(docRef, metadataRecord);

      return metadataHash;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Create metadata records for multiple files
   * @param {Array} filesData - Array of file metadata objects
   * @returns {Promise<Array>} - Array of metadata hashes
   */
  const createMultipleMetadataRecords = async (filesData) => {
    try {
      const results = [];

      for (const fileData of filesData) {
        const metadataHash = await createMetadataRecord(fileData);
        results.push(metadataHash);
      }

      return results;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Check if a metadata record already exists
   * @param {string} sourceFileName - Original filename
   * @param {number} lastModified - File's last modified timestamp
   * @param {string} fileHash - Content hash of the file
   * @returns {Promise<boolean>} - Whether the metadata record exists
   */
  const metadataRecordExists = async (sourceFileName, lastModified, fileHash) => {
    try {
      const metadataHash = await generateMetadataHash(sourceFileName, lastModified, fileHash);
      const firmId = authStore.currentFirm;

      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Validate matter is selected
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter before checking metadata.');
      }

      // Try to get the document from subcollection
      const docRef = doc(
        db,
        'firms',
        firmId,
        'matters',
        matterId,
        'evidence',
        fileHash,
        'sourceMetadata',
        metadataHash
      );
      const docSnapshot = await getDoc(docRef);

      return docSnapshot.exists();
    } catch (error) {
      return false;
    }
  };

  return {
    // Core functions
    generateMetadataHash,
    createMetadataRecord,
    createMultipleMetadataRecords,
    metadataRecordExists,
  };
}
