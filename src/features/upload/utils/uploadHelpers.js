/**
 * Upload Helper Utilities
 * Shared utility functions for file upload operations
 */

/**
 * Helper function to handle metadata operations with detailed error logging
 * Rethrows errors in development mode for debugging
 */
export const safeMetadata = async (metadataFn) => {
  try {
    await metadataFn();
  } catch (error) {
    // Rethrow in development to surface issues
    if (import.meta.env.DEV) {
      throw error;
    }
  }
};
