/**
 * File Service - Firestore integration for file/evidence data
 * Queries the evidence collection and maps to Cloud table format
 */

import { collection, query, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Fetch files (evidence documents) from Firestore
 * @param {string} firmId - The firm ID to query
 * @param {string} matterId - The matter ID (default: 'general')
 * @param {number} maxResults - Maximum number of results to fetch (default: 10000)
 * @returns {Promise<Array>} Array of file records formatted for Cloud table
 */
export async function fetchFiles(firmId, matterId = 'general', maxResults = 10000) {
  try {
    // Build the Firestore query
    const evidenceRef = collection(db, 'firms', firmId, 'matters', matterId, 'evidence');
    const q = query(
      evidenceRef,
      orderBy('updatedAt', 'desc'),
      limit(maxResults)
    );

    // Execute the query
    const querySnapshot = await getDocs(q);

    // Collect all documents and their metadata promises
    const filePromises = [];

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const fileHash = docSnapshot.id;
      const displayCopyId = data.displayCopy;

      // Create a promise to fetch the sourceMetadata
      const filePromise = (async () => {
        let sourceFileName = 'ERROR: Missing metadata';

        // Try to fetch the original filename from sourceMetadata
        if (displayCopyId) {
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
              displayCopyId
            );
            const sourceMetadataDoc = await getDoc(sourceMetadataRef);

            if (sourceMetadataDoc.exists()) {
              const sourceMetadata = sourceMetadataDoc.data();
              sourceFileName = sourceMetadata.sourceFileName || 'ERROR: Missing sourceFileName';
            } else {
              console.error(`[Cloud Table] sourceMetadata not found for ${fileHash}, displayCopy: ${displayCopyId}`);
              sourceFileName = 'ERROR: Metadata not found';
            }
          } catch (error) {
            console.error(`[Cloud Table] Failed to fetch sourceMetadata for ${fileHash}:`, error);
            sourceFileName = 'ERROR: Fetch failed';
          }
        } else {
          console.error(`[Cloud Table] No displayCopy ID for evidence document: ${fileHash}`);
          sourceFileName = 'ERROR: No displayCopy ID';
        }

        // Map evidence document to table row format
        return {
          id: fileHash, // fileHash (BLAKE3)
          fileHash: fileHash,

          // File properties that exist in evidence documents
          size: formatFileSize(data.fileSize || 0),
          date: formatDate(data.updatedAt),

          // Processing status
          status: getStatusLabel(data.processingStage || 'uploaded'),

          // Tag information
          tagCount: data.tagCount || 0,

          // Original filename from sourceMetadata
          fileName: sourceFileName,

          // Placeholder fields (to be enhanced later)
          fileType: 'Unknown', // Will need sourceMetadata lookup
          privilege: 'Unclassified',
          description: `${data.tagCount || 0} tags`,
          documentType: getDocumentTypeFromStage(data.processingStage),
          author: 'Unknown',
          custodian: 'System',
          createdDate: formatDate(data.updatedAt),
          modifiedDate: formatDate(data.updatedAt)
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
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "1.5MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0B';
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

/**
 * Format Firestore timestamp to date string
 * @param {Object} timestamp - Firestore timestamp
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';

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

  return 'Unknown';
}

/**
 * Get user-friendly status label from processing stage
 * @param {string} stage - Processing stage enum value
 * @returns {string} Display label
 */
function getStatusLabel(stage) {
  const stageMap = {
    'uploaded': 'Active',
    'splitting': 'Processing',
    'merging': 'Processing',
    'complete': 'Final'
  };
  return stageMap[stage] || 'Active';
}

/**
 * Get document type from processing stage
 * @param {string} stage - Processing stage
 * @returns {string} Document type label
 */
function getDocumentTypeFromStage(stage) {
  if (stage === 'complete') return 'Document';
  if (stage === 'splitting' || stage === 'merging') return 'Processing';
  return 'Evidence';
}
