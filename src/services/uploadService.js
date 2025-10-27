/**
 * Upload Service - Firestore integration for evidence data with source file metadata
 * Queries the evidence collection and maps to Cloud table format
 */

import { collection, query, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Configuration for system category tags
 * Maps column keys to their Firestore tag document IDs and field names
 */
const SYSTEM_TAG_CONFIG = {
  description: { tagId: 'DocumentDescription', field: 'textArea' },
  author: { tagId: 'Author', field: 'text' },
  privilege: { tagId: 'Privilege', field: 'value' },
  fileType: { tagId: 'FileType', field: 'value' },
  custodian: { tagId: 'Custodian', field: 'text' },
};

/**
 * Fetch all system category tags for a given evidence document
 * @param {string} firmId - The firm ID
 * @param {string} matterId - The matter ID
 * @param {string} fileHash - The evidence document ID (BLAKE3 hash)
 * @returns {Promise<Object>} Object mapping column keys to tag values (string or 🤖 emoji)
 */
async function fetchSystemTags(firmId, matterId, fileHash) {
  // Create promises to fetch all system tags in parallel
  const tagPromises = Object.entries(SYSTEM_TAG_CONFIG).map(async ([columnKey, config]) => {
    try {
      const tagRef = doc(
        db,
        'firms',
        firmId,
        'matters',
        matterId,
        'evidence',
        fileHash,
        'tags',
        config.tagId
      );
      const tagDoc = await getDoc(tagRef);

      if (tagDoc.exists()) {
        const tagData = tagDoc.data();
        const value = tagData[config.field];
        return [columnKey, value || '🤖'];
      } else {
        return [columnKey, '🤖'];
      }
    } catch (error) {
      console.error(
        `[Cloud Table] Failed to fetch ${config.tagId} tag for ${fileHash}:`,
        error
      );
      return [columnKey, '🤖'];
    }
  });

  // Wait for all tag fetches to complete
  const tagResults = await Promise.all(tagPromises);

  // Convert array of [key, value] pairs to object
  return Object.fromEntries(tagResults);
}

/**
 * Fetch evidence documents from Firestore with source file metadata
 * @param {string} firmId - The firm ID to query
 * @param {string} matterId - The matter ID (default: 'general')
 * @param {number} maxResults - Maximum number of results to fetch (default: 10000)
 * @returns {Promise<Array>} Array of evidence records formatted for Cloud table
 */
export async function fetchFiles(firmId, matterId = 'general', maxResults = 10000) {
  try {
    // Build the Firestore query
    const evidenceRef = collection(db, 'firms', firmId, 'matters', matterId, 'evidence');
    const q = query(evidenceRef, orderBy('uploadDate', 'desc'), limit(maxResults));

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Collect all documents and their metadata promises
    const filePromises = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const fileHash = docSnapshot.id;
      const sourceIDId = data.sourceID;

      // Create a promise to fetch the sourceMetadata
      const filePromise = (async () => {
        let sourceFileName = 'ERROR: Missing metadata';

        // Try to fetch the source filename from sourceMetadata subcollection
        if (sourceIDId) {
          try {
            const sourceMetadataRef = doc(
              db,
              'firms',
              firmId,
              'matters',
              matterId,
              'evidence',
              fileHash,
              'sourceMetadata',
              sourceIDId
            );
            const sourceMetadataDoc = await getDoc(sourceMetadataRef);

            if (sourceMetadataDoc.exists()) {
              const sourceMetadata = sourceMetadataDoc.data();
              sourceFileName = sourceMetadata.sourceFileName || 'ERROR: Missing sourceFileName';
            } else {
              console.error(
                `[Cloud Table] sourceMetadata not found for ${fileHash}, sourceID: ${sourceIDId}`
              );
              sourceFileName = 'ERROR: Metadata not found';
            }
          } catch (error) {
            console.error(`[Cloud Table] Failed to fetch sourceMetadata for ${fileHash}:`, error);
            sourceFileName = 'ERROR: Fetch failed';
          }
        } else {
          console.error(`[Cloud Table] No sourceID ID for evidence document: ${fileHash}`);
          sourceFileName = 'ERROR: No sourceID ID';
        }

        // Fetch all system category tags for this evidence document
        const systemTags = await fetchSystemTags(firmId, matterId, fileHash);

        // Map evidence document to table row format
        return {
          id: fileHash, // fileHash (BLAKE3)
          fileHash: fileHash,

          // File properties that exist in evidence documents
          size: data.fileSize ? formatUploadSize(data.fileSize) : 'ERROR: Missing file size',
          date: data.uploadDate, // Preserve raw Firestore timestamp for display in Cloud.vue

          // Processing status
          status: getStatusLabel(data.processingStage),

          // Tag information
          tagCount: data.tagCount || 0,

          // Source filename from sourceMetadata subcollection
          fileName: sourceFileName,

          // System category tags from Firestore tags subcollection
          fileType: systemTags.fileType,
          privilege: systemTags.privilege,
          description: systemTags.description,
          author: systemTags.author,
          custodian: systemTags.custodian,

          // Other fields
          documentType: getDocumentTypeFromStage(data.processingStage),
          modifiedDate: formatDate(data.uploadDate),
        };
      })();

      filePromises.push(filePromise);
    });

    // Wait for all sourceMetadata queries to complete in parallel
    const files = await Promise.all(filePromises);

    return files;
  } catch (error) {
    console.error('[Cloud Table] Firestore query failed:', error);
    throw error;
  }
}

/**
 * Format size in bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "1.5MB")
 */
function formatUploadSize(bytes) {
  if (bytes === 0) return '0B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

/**
 * Format Firestore timestamp to date string
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date (YYYY-MM-DD) or error message
 */
function formatDate(timestamp) {
  if (!timestamp) return 'ERROR: Date not available';

  // Handle Firestore Timestamp object
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString().split('T')[0];
  }

  // Handle JavaScript Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString().split('T')[0];
  }

  // Handle timestamp as milliseconds
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  return 'ERROR: Invalid date format';
}

/**
 * Get user-friendly status label from processing stage
 * @param {string} stage - Processing stage enum value
 * @returns {string} Display label or error message
 */
function getStatusLabel(stage) {
  if (!stage) return 'ERROR: Status not available';

  const stageMap = {
    uploaded: 'Active',
    splitting: 'Processing',
    merging: 'Processing',
    complete: 'Final',
  };
  return stageMap[stage] || 'ERROR: Unknown status';
}

/**
 * Get document type from processing stage
 * @param {string} stage - Processing stage
 * @returns {string} Document type label or error message
 */
function getDocumentTypeFromStage(stage) {
  if (!stage) return 'ERROR: Document type not available';
  if (stage === 'complete') return 'Document';
  if (stage === 'splitting' || stage === 'merging') return 'Processing';
  if (stage === 'uploaded') return 'Evidence';
  return 'ERROR: Unknown document type';
}
