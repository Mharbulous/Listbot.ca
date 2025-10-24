/**
 * File Service - Firestore integration for file/evidence data
 * Queries the evidence collection and maps to Cloud table format
 */

import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
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

    // Map Firestore documents to table format
    const files = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Map evidence document to table row format
      // Note: Some fields may not exist in evidence documents - we'll use placeholders
      files.push({
        id: doc.id, // fileHash (SHA-256)
        fileHash: doc.id,

        // File properties that exist in evidence documents
        size: formatFileSize(data.fileSize || 0),
        date: formatDate(data.updatedAt),

        // Processing status
        status: getStatusLabel(data.processingStage || 'uploaded'),

        // Tag information
        tagCount: data.tagCount || 0,

        // Placeholder fields (to be enhanced later with sourceMetadata)
        fileType: 'Unknown', // Will need sourceMetadata lookup
        fileName: doc.id, // Full file hash (SHA-256)
        privilege: 'Unclassified',
        description: `${data.tagCount || 0} tags`,
        documentType: getDocumentTypeFromStage(data.processingStage),
        author: 'Unknown',
        custodian: 'System',
        createdDate: formatDate(data.updatedAt),
        modifiedDate: formatDate(data.updatedAt)
      });
    });

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
