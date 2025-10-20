import { db } from '../../../services/firebase.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '../../../core/stores/auth.js';
import { useMatterViewStore } from '../../../stores/matterView.js';
import { updateFolderPaths } from '../../upload/utils/folderPathUtils.js';
import { EvidenceService } from '../../organizer/services/evidenceService.js';

export function useFileMetadata() {
  const authStore = useAuthStore();
  const matterStore = useMatterViewStore();

  /**
   * Generate metadata hash from file metadata
   * Uses concatenated string: sourceFileName|lastModified|fileHash
   * @param {string} sourceFileName - Original filename
   * @param {number} lastModified - File's last modified timestamp
   * @param {string} fileHash - Content hash of the file
   * @returns {Promise<string>} - SHA-256 hash of metadata string
   */
  const generateMetadataHash = async (sourceFileName, lastModified, fileHash) => {
    try {
      // Create deterministic concatenated string with pipe delimiters
      const metadataString = `${sourceFileName}|${lastModified}|${fileHash}`;

      // Generate SHA-256 hash of the metadata string
      const buffer = new TextEncoder().encode(metadataString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const metadataHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      return metadataHash;
    } catch (error) {
      console.error('Failed to generate metadata hash:', error);
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
   * @returns {Promise<string>} - The metadata hash used as document ID
   */
  const createMetadataRecord = async (fileData) => {
    try {
      const { sourceFileName, lastModified, fileHash, size, originalPath, sourceFileType } =
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
        console.warn(
          'Could not retrieve existing sourceFolderPath, proceeding with new path only:',
          error
        );
      }

      // Update folder paths using pattern recognition
      const pathUpdate = updateFolderPaths(currentFolderPath, existingFolderPaths);

      // STEP 1: Create Evidence document FIRST (parent document must exist before subcollections)
      const evidenceService = new EvidenceService(firmId, matterId);

      const uploadMetadata = {
        hash: fileHash,
        originalName: sourceFileName,
        size: size || 0,
        folderPath: currentFolderPath || '/',
        metadataHash: metadataHash,
      };

      const evidenceId = await evidenceService.createEvidenceFromUpload(uploadMetadata);
      console.log(`[DEBUG] Evidence document created: ${evidenceId} for metadata: ${metadataHash}`);

      // STEP 2: Create sourceMetadata subcollection document (now that parent exists)
      const metadataRecord = {
        // Core file metadata (only what varies between identical files)
        sourceFileName: sourceFileName,
        lastModified: lastModified,
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

      console.log(`[DEBUG] Metadata record created: ${metadataHash}`, {
        sourceFileName,
        sourceFolderPath: pathUpdate.folderPaths || '(root level)',
        sourceFileType: sourceFileType || '(unknown)',
        pathPattern: pathUpdate.pattern.type,
        pathChanged: pathUpdate.hasChanged,
        fileHash: fileHash.substring(0, 8) + '...',
      });

      return metadataHash;
    } catch (error) {
      console.error('Failed to create metadata record:', error);
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

      console.log(`Created ${results.length} metadata records`);
      return results;
    } catch (error) {
      console.error('Failed to create multiple metadata records:', error);
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
      console.error('Failed to check metadata record existence:', error);
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
