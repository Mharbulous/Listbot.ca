/**
 * File Service - Firestore integration for evidence data with source file metadata
 * Queries the evidence collection and maps to Cloud table format
 */

import { collection, query, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

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
    const q = query(evidenceRef, orderBy('fileCreated', 'desc'), limit(maxResults));

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

        // Map evidence document to table row format
        return {
          id: fileHash, // fileHash (BLAKE3)
          fileHash: fileHash,

          // File properties that exist in evidence documents
          size: data.fileSize ? formatUploadSize(data.fileSize) : 'ERROR: Missing file size',
          date: formatDate(data.fileCreated),

          // Processing status
          status: getStatusLabel(data.processingStage),

          // Tag information
          tagCount: data.tagCount || 0,

          // Source filename from sourceMetadata subcollection
          fileName: sourceFileName,

          // Placeholder fields (to be enhanced later)
          fileType: 'ERROR: File type not available', // Will need sourceMetadata lookup
          privilege: 'ERROR: Privilege not available',
          description:
            data.tagCount !== undefined
              ? `${data.tagCount} tags`
              : 'ERROR: Tag count not available',
          documentType: getDocumentTypeFromStage(data.processingStage),
          author: 'ERROR: Author not available',
          custodian: 'ERROR: Custodian not available',
          modifiedDate: formatDate(data.fileCreated),
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
