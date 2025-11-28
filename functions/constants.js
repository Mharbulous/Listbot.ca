module.exports = {
  MAX_FILE_SIZE: 100 * 1024 * 1024,    // 100MB
  MAX_DEPTH: 10,
  MAX_RETRY: 3,
  MAX_BODY_PREVIEW: 500,
  MAX_BODY_SIZE: 1024 * 1024,          // 1MB

  PARSE_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed'
  }
};
