/**
 * Constants for Email Extraction
 */

module.exports = {
  // Size limits
  MAX_FILE_SIZE: 100 * 1024 * 1024,    // 100MB
  MAX_BODY_SIZE: 1024 * 1024,          // 1MB
  MAX_BODY_PREVIEW: 500,               // characters
  
  // Processing limits
  MAX_DEPTH: 10,                       // Maximum nesting depth for recursive emails
  MAX_RETRY: 3,                        // Maximum retry attempts

  // Status values
  PARSE_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
};
