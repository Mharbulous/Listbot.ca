import { db } from '../../../services/firebase.js';
import { doc, setDoc, getDoc, Timestamp, updateDoc, increment } from 'firebase/firestore';
import { useAuthStore } from '../../../core/auth/stores/index.js';
import { useMatterViewStore } from '../../../features/matters/stores/matterView.js';
import { updateFolderPaths } from '../../upload/utils/folderPathUtils.js';
import { EvidenceService } from '../../documents/services/evidenceService.js';
import { generateMetadataHashInput } from '../utils/deduplicationLogic.js';
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
   * Uses concatenated string: sourceFileName|lastModified|fileHash|folderPath
   *
   * CRITICAL: Includes folderPath to distinguish copies in different folders.
   * Without folderPath, files with identical content in different folders would be
   * incorrectly marked as duplicates instead of copies.
   *
   * @param {string} sourceFileName - Original filename
   * @param {number} lastModified - File's last modified timestamp
   * @param {string} fileHash - Content hash of the file
   * @param {string} folderPath - Source folder path (without filename)
   * @returns {Promise<string>} - xxHash 64-bit hash of metadata string (16 hex chars)
   */
  const generateMetadataHash = async (sourceFileName, lastModified, fileHash, folderPath = '') => {
    try {
      // Use shared deduplication logic to ensure consistency with Phase 1
      const metadataString = generateMetadataHashInput(
        sourceFileName,
        lastModified,
        fileHash,
        folderPath
      );

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
   * @param {string} [fileData.sourceFileType] - MIME type of the file (passed to Evidence document)
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

      // Extract folder path from original path if available
      let currentFolderPath = '';
      if (originalPath) {
        const pathParts = originalPath.split('/');
        if (pathParts.length > 1) {
          currentFolderPath = pathParts.slice(0, -1).join('/');
        }
      }

      // Generate metadata hash for document ID (includes folderPath for copy detection)
      const metadataHash = await generateMetadataHash(
        sourceFileName,
        lastModified,
        fileHash,
        currentFolderPath
      );

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

      // STEP 1A: Create Uploads document for email extraction tracking
      // All files get an uploads document, email files trigger Cloud Function processing
      const uploadsRef = doc(db, 'uploads', fileHash);

      // Check if uploads document already exists (e.g., from a previous upload of same file)
      const existingUploadsDoc = await getDoc(uploadsRef);

      if (!existingUploadsDoc.exists()) {
        // Detect if file is an email file (.msg or .eml)
        const isEmailFile = ['msg', 'eml'].includes(
          sourceFileName.toLowerCase().split('.').pop()
        );

        // Detect file type for uploads collection
        const detectFileType = (fileName) => {
          const ext = fileName.toLowerCase().split('.').pop();
          const typeMap = {
            pdf: 'pdf',
            jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
            doc: 'word', docx: 'word',
            xls: 'excel', xlsx: 'excel',
            msg: 'email', eml: 'email',
          };
          return typeMap[ext] || 'other';
        };

        const userId = authStore.user?.uid;

        // Create uploads document (all files, email and non-email)
        await setDoc(uploadsRef, {
          id: fileHash,
          firmId: firmId,
          userId: userId,
          matterId: matterId,

          // File info
          sourceFileName: sourceFileName,
          fileType: isEmailFile ? 'email' : detectFileType(sourceFileName),
          fileSize: size || 0,
          storagePath: `firms/${firmId}/matters/${matterId}/uploads/${fileHash}`,
          uploadedAt: Timestamp.now(),

          // Email extraction (null for non-emails)
          hasEmailAttachments: isEmailFile ? true : null,
          parseStatus: isEmailFile ? 'pending' : null,
          parseError: null,
          parsedAt: null,

          // Retry tracking
          retryCount: 0,

          // Results (populated after extraction)
          extractedMessageId: null,
          extractedAttachmentHashes: [],

          // Attachment tracking (for files extracted FROM emails)
          isEmailAttachment: false,
          extractedFromEmails: [],

          // Nesting (for recursive .msg/.eml)
          nestingDepth: 0,
        });
      }

      // STEP 1B: Create Evidence document (parent document must exist before subcollections)
      const evidenceService = new EvidenceService(firmId, matterId);

      const uploadMetadata = {
        hash: fileHash,
        sourceFileName: sourceFileName,
        size: size || 0,
        folderPath: currentFolderPath || '/',
        metadataHash: metadataHash,
        storageCreatedTimestamp: storageCreatedTimestamp,
        fileType: sourceFileType || '', // MIME type from source file
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

      // STEP 3: Update evidence document with embedded source metadata
      // This enables single-query table rendering by eliminating subcollection queries
      const evidenceRef = doc(
        db,
        'firms',
        firmId,
        'matters',
        matterId,
        'evidence',
        fileHash
      );

      await updateDoc(evidenceRef, {
        // Primary source metadata (for fast table rendering)
        sourceFileName: sourceFileName,
        sourceLastModified: Timestamp.fromMillis(lastModified),
        sourceFolderPath: pathUpdate.folderPaths,

        // Add to sourceMetadataVariants map (for deduplication tracking)
        [`sourceMetadataVariants.${metadataHash}`]: {
          sourceFileName: sourceFileName,
          sourceLastModified: Timestamp.fromMillis(lastModified),
          sourceFolderPath: pathUpdate.folderPaths,
          uploadDate: Timestamp.now()
        },

        // Increment variant count
        sourceMetadataCount: increment(1)
      });

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
   * OPTIMIZED: Checks embedded sourceMetadataVariants map instead of querying subcollection
   * @param {string} sourceFileName - Original filename
   * @param {number} lastModified - File's last modified timestamp
   * @param {string} fileHash - Content hash of the file
   * @param {string} folderPath - Source folder path (without filename)
   * @returns {Promise<boolean>} - Whether the metadata record exists
   */
  const metadataRecordExists = async (sourceFileName, lastModified, fileHash, folderPath = '') => {
    try {
      const metadataHash = await generateMetadataHash(
        sourceFileName,
        lastModified,
        fileHash,
        folderPath
      );
      const firmId = authStore.currentFirm;

      if (!firmId) {
        throw new Error('No firm ID available');
      }

      // Validate matter is selected
      const matterId = matterStore.currentMatterId;
      if (!matterId) {
        throw new Error('No matter selected. Please select a matter before checking metadata.');
      }

      // Check embedded sourceMetadataVariants map in evidence document
      // This is MUCH faster than querying the subcollection
      const evidenceRef = doc(
        db,
        'firms',
        firmId,
        'matters',
        matterId,
        'evidence',
        fileHash
      );
      const evidenceDoc = await getDoc(evidenceRef);

      if (!evidenceDoc.exists()) {
        return false;
      }

      const data = evidenceDoc.data();
      return data.sourceMetadataVariants && data.sourceMetadataVariants[metadataHash] !== undefined;
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
