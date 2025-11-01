import { ref, getDownloadURL, getBytes, getMetadata } from 'firebase/storage';
import { storage } from '../../../services/firebase.js';
import { LogService } from '@/services/logService.js';

/**
 * File Processing Service - Handles file content retrieval from Firebase Storage
 * Provides file access, content processing, and format validation
 */
export class FileProcessingService {
  constructor(firmId = null) {
    this.firmId = firmId;
  }

  /**
   * Retrieve file content from Firebase Storage for AI processing
   * @param {Object} evidence - Evidence document
   * @param {string} firmId - Firm ID
   * @param {string} matterId - Matter ID
   * @returns {Promise<string>} - Base64 encoded file content for AI processing
   */
  async getFileForProcessing(evidence, firmId, matterId) {
    try {
      if (!matterId) {
        throw new Error('Matter ID is required to get file for processing');
      }

      // Document ID is the fileHash
      const fileHash = evidence.id;
      if (!fileHash) {
        throw new Error('No file hash found in evidence document ID');
      }

      // Get file extension from displayName (preserve original case to match storage)
      const uploadFileName = evidence.displayName || '';
      const extension = uploadFileName.split('.').pop() || 'pdf';

      // Use the EXACT same path format as UploadService.generateStoragePath()
      const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension.toLowerCase()}`;
      const fileRef = ref(storage, storagePath);

      // Get file bytes directly from Firebase Storage
      const arrayBuffer = await getBytes(fileRef);

      // Convert ArrayBuffer to base64 efficiently (avoid stack overflow for large files)
      const base64Data = this.arrayBufferToBase64(arrayBuffer);

      LogService.debug('Retrieved file content', {
        service: 'FileProcessingService',
        storagePath,
      });
      return base64Data;
    } catch (error) {
      LogService.error('Failed to get file for processing', error, {
        service: 'FileProcessingService',
        storagePath,
      });
      throw error;
    }
  }

  /**
   * Convert ArrayBuffer to base64 efficiently
   * @param {ArrayBuffer} arrayBuffer - File data as ArrayBuffer
   * @returns {string} - Base64 encoded string
   */
  arrayBufferToBase64(arrayBuffer) {
    const uint8Array = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
  }

  /**
   * Get file download URL from Firebase Storage
   * @param {Object} evidence - Evidence document
   * @param {string} firmId - Firm ID
   * @param {string} matterId - Matter ID
   * @returns {Promise<string>} - Download URL
   */
  async getFileDownloadURL(evidence, firmId, matterId) {
    try {
      if (!matterId) {
        throw new Error('Matter ID is required to get download URL');
      }

      // Document ID is the fileHash
      const fileHash = evidence.id;
      if (!fileHash) {
        throw new Error('No file hash found in evidence document ID');
      }

      const uploadFileName = evidence.displayName || '';
      const extension = uploadFileName.split('.').pop() || 'pdf';

      // Use the EXACT same path format as UploadService.generateStoragePath()
      const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension.toLowerCase()}`;
      const fileRef = ref(storage, storagePath);

      const downloadURL = await getDownloadURL(fileRef);

      LogService.debug('Generated download URL', {
        service: 'FileProcessingService',
        storagePath,
      });
      return downloadURL;
    } catch (error) {
      LogService.error('Failed to get download URL', error, {
        service: 'FileProcessingService',
        storagePath,
      });
      throw error;
    }
  }

  /**
   * Get file extension from evidence document
   * @param {Object} evidence - Evidence document
   * @returns {string} - File extension
   */
  getUploadExtension(evidence) {
    const uploadFileName = evidence.displayName || '';
    return uploadFileName.split('.').pop()?.toLowerCase() || 'pdf';
  }

  /**
   * Build Firebase Storage path for file
   * @param {string} fileHash - File hash
   * @param {string} extension - File extension
   * @param {string} firmId - Firm ID
   * @param {string} matterId - Matter ID (required)
   * @returns {string} - Storage path
   */
  buildStoragePath(fileHash, extension, firmId, matterId) {
    if (!matterId) {
      throw new Error('Matter ID is required to build storage path');
    }
    return `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension}`;
  }

  /**
   * Validate file exists in storage
   * @param {Object} evidence - Evidence document
   * @param {string} firmId - Firm ID
   * @returns {Promise<boolean>} - True if file exists
   */
  async validateFileExists(evidence, firmId) {
    try {
      await this.getFileDownloadURL(evidence, firmId);
      return true;
    } catch (error) {
      LogService.warn('File does not exist', {
        service: 'FileProcessingService',
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Get file size from Firebase Storage metadata
   * Fallback method when evidence.fileSize is 0 or missing
   * @param {Object} evidence - Evidence document
   * @param {string} firmId - Firm ID
   * @param {string} matterId - Matter ID
   * @returns {Promise<number>} - File size in bytes, or 0 if unable to retrieve
   */
  async getFileSize(evidence, firmId, matterId) {
    try {
      if (!matterId) {
        throw new Error('Matter ID is required to get file size');
      }

      // Document ID is the fileHash
      const fileHash = evidence.id;
      if (!fileHash) {
        LogService.warn('No file hash found in evidence document ID', {
          service: 'FileProcessingService',
        });
        return 0;
      }

      // Get file extension from displayName
      const uploadFileName = evidence.displayName || '';
      const originalExtension = uploadFileName.split('.').pop() || 'pdf';

      // Use lowercase extension (UploadService standard)
      // Note: All files now use lowercase extensions after re-upload standardization
      const extensionVariations = [
        originalExtension.toLowerCase(), // UploadService standard
        originalExtension, // Original case fallback (if display name has different case)
      ];

      // Remove duplicates while preserving order
      const uniqueExtensions = [...new Set(extensionVariations)];

      // Try each extension variation until one works
      LogService.debug('Attempting to find file', {
        service: 'FileProcessingService',
        displayName: evidence.displayName,
        extensions: uniqueExtensions,
      });

      for (let i = 0; i < uniqueExtensions.length; i++) {
        const extension = uniqueExtensions[i];
        // Use the EXACT same path format as UploadService.generateStoragePath()
        const storagePath = `firms/${firmId}/matters/${matterId}/uploads/${fileHash}.${extension}`;
        const fileRef = ref(storage, storagePath);

        LogService.debug(`Trying path ${i + 1}/${uniqueExtensions.length}`, {
          service: 'FileProcessingService',
          storagePath,
        });

        try {
          // Get file metadata from Firebase Storage
          const metadata = await getMetadata(fileRef);

          if (i > 0) {
            LogService.debug(`Found file using case variation ${i + 1}`, {
              service: 'FileProcessingService',
              storagePath,
            });
          } else {
            LogService.debug('Found file on first try', {
              service: 'FileProcessingService',
              storagePath,
            });
          }
          LogService.debug('Retrieved file size from storage', {
            service: 'FileProcessingService',
            size: metadata.size,
          });
          return metadata.size || 0;
        } catch (extensionError) {
          LogService.debug(`Failed path ${i + 1}`, {
            service: 'FileProcessingService',
            error: extensionError.message,
          });
          // This extension variation didn't work, try the next one
          if (i === uniqueExtensions.length - 1) {
            // This was the last attempt, log the error
            throw extensionError;
          }
        }
      }

      return 0;
    } catch (error) {
      LogService.error('Failed to get file size from Firebase Storage', error, {
        service: 'FileProcessingService',
      });
      return 0;
    }
  }

  /**
   * Get file metadata from evidence document
   * @param {Object} evidence - Evidence document
   * @returns {Object} - File metadata
   */
  getFileMetadata(evidence) {
    return {
      displayName: evidence.displayName || 'Unknown',
      fileSize: evidence.fileSize || 0,
      fileSizeMB: ((evidence.fileSize || 0) / (1024 * 1024)).toFixed(1),
      fileSizeKB: ((evidence.fileSize || 0) / 1024).toFixed(1),
      extension: this.getFileExtension(evidence),
      fileHash: evidence.id || null,
      hasFileHash: Boolean(evidence.id),
    };
  }
}

export default FileProcessingService;
