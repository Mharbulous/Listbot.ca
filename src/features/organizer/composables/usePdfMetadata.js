import { ref, computed } from 'vue';

/**
 * Composable for extracting and managing PDF embedded metadata
 *
 * Extracts both Document Information Dictionary and XMP metadata from PDF files
 * stored in Firebase Storage. Only processes PDF files and handles errors gracefully.
 *
 * @returns {Object} Metadata extraction state and functions
 */
export function usePdfMetadata() {
  // State
  const metadataLoading = ref(false);
  const metadataError = ref(null);
  const pdfMetadata = ref(null);

  /**
   * Format date from PDF metadata
   * PDF dates are in format: D:YYYYMMDDHHmmSSOHH'mm'
   * Example: D:20230815143022-07'00'
   */
  const formatPdfDate = (pdfDateString) => {
    if (!pdfDateString) return null;

    try {
      // Remove 'D:' prefix if present
      let dateStr = pdfDateString.replace(/^D:/, '');

      // Extract components
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      const hour = dateStr.substring(8, 10) || '00';
      const minute = dateStr.substring(10, 12) || '00';
      const second = dateStr.substring(12, 14) || '00';

      // Extract timezone if present
      let timezone = '';
      if (dateStr.length > 14) {
        const tzMatch = dateStr.match(/([+-])(\d{2})'(\d{2})'?/);
        if (tzMatch) {
          timezone = `${tzMatch[1]}${tzMatch[2]}:${tzMatch[3]}`;
        } else if (dateStr.includes('Z')) {
          timezone = 'Z';
        }
      }

      // Create ISO date string
      const isoDate = `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone || 'Z'}`;
      const date = new Date(isoDate);

      if (isNaN(date.getTime())) {
        return pdfDateString; // Return original if parsing fails
      }

      return {
        formatted: date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        }),
        iso: isoDate,
        timezone: timezone || 'Unknown',
      };
    } catch (e) {
      console.warn('[usePdfMetadata] Failed to parse PDF date:', pdfDateString, e);
      return pdfDateString;
    }
  };

  /**
   * Parse XMP metadata from PDF
   * XMP is XML-based metadata that may contain additional forensic information
   */
  const parseXmpMetadata = (metadata) => {
    if (!metadata || !metadata._metadataMap) return null;

    try {
      const xmpData = {};
      const metadataMap = metadata._metadataMap;

      // Extract common XMP fields
      if (metadataMap.has('dc:title')) xmpData.title = metadataMap.get('dc:title');
      if (metadataMap.has('dc:creator')) xmpData.creator = metadataMap.get('dc:creator');
      if (metadataMap.has('dc:description'))
        xmpData.description = metadataMap.get('dc:description');
      if (metadataMap.has('xmp:CreateDate')) xmpData.createDate = metadataMap.get('xmp:CreateDate');
      if (metadataMap.has('xmp:ModifyDate')) xmpData.modifyDate = metadataMap.get('xmp:ModifyDate');
      if (metadataMap.has('xmp:CreatorTool'))
        xmpData.creatorTool = metadataMap.get('xmp:CreatorTool');
      if (metadataMap.has('pdf:Producer')) xmpData.producer = metadataMap.get('pdf:Producer');

      // Forensically valuable fields
      if (metadataMap.has('xmpMM:DocumentID')) {
        xmpData.documentId = metadataMap.get('xmpMM:DocumentID');
      }
      if (metadataMap.has('xmpMM:InstanceID')) {
        xmpData.instanceId = metadataMap.get('xmpMM:InstanceID');
      }

      // Revision history - provides complete audit trail of document editing
      if (metadataMap.has('xmpMM:History')) {
        const history = metadataMap.get('xmpMM:History');
        xmpData.history = history;
      }

      return Object.keys(xmpData).length > 0 ? xmpData : null;
    } catch (e) {
      console.warn('[usePdfMetadata] Failed to parse XMP metadata:', e);
      return null;
    }
  };

  /**
   * Extract metadata from PDF document
   *
   * @param {string} fileHash - File hash (document ID) - used for logging
   * @param {string} displayName - File display name - used for PDF file check
   * @param {PDFDocumentProxy} pdfDocument - Already-loaded PDF document from cache
   */
  const extractMetadata = async (fileHash, displayName, pdfDocument) => {
    // Only process PDF files
    if (!displayName?.toLowerCase().endsWith('.pdf')) {
      return;
    }

    // Require a valid PDF document
    if (!pdfDocument) {
      console.warn('[usePdfMetadata] No PDF document provided for metadata extraction');
      return;
    }

    try {
      console.log(`[PDFMetadata] 🔵 START extraction - File: ${fileHash}, Loading: ${metadataLoading.value} → true`);
      metadataLoading.value = true;
      metadataError.value = null;
      pdfMetadata.value = null;

      // Extract metadata from the provided PDF document
      const metadata = await pdfDocument.getMetadata();

      // Process Document Information Dictionary (info)
      const info = metadata.info || {};
      const processedInfo = {
        title: info.Title || null,
        author: info.Author || null,
        subject: info.Subject || null,
        keywords: info.Keywords || null,
        creator: info.Creator || null,
        producer: info.Producer || null,
        creationDate: info.CreationDate ? formatPdfDate(info.CreationDate) : null,
        modDate: info.ModDate ? formatPdfDate(info.ModDate) : null,
      };

      // Process XMP metadata if available
      const xmpData = parseXmpMetadata(metadata.metadata);

      // Combine processed metadata
      pdfMetadata.value = {
        info: processedInfo,
        xmp: xmpData,
        hasMetadata: Object.values(processedInfo).some((v) => v !== null) || xmpData !== null,
      };
    } catch (err) {
      console.error('[usePdfMetadata] Failed to extract PDF metadata:', err);
      metadataError.value = err.message || 'Failed to extract PDF metadata';
    } finally {
      console.log(`[PDFMetadata] ✅ END extraction - File: ${fileHash}, Loading: true → false, Has Metadata: ${pdfMetadata.value?.hasMetadata}`);
      metadataLoading.value = false;
    }
  };

  // Computed property to check if metadata is available
  const hasMetadata = computed(() => pdfMetadata.value?.hasMetadata === true);

  return {
    // State
    metadataLoading,
    metadataError,
    pdfMetadata,
    hasMetadata,

    // Methods
    extractMetadata,
  };
}
