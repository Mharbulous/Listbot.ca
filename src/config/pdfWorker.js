import * as pdfjsLib from 'pdfjs-dist';

/**
 * Configure PDF.js worker
 *
 * PDF.js requires a worker to process PDFs in the background without blocking the UI.
 * We use Vite's new URL() with import.meta.url for proper module resolution.
 * This approach:
 * - Works with Vite's build system
 * - Automatically uses the installed pdfjs-dist version from node_modules
 * - No external CDN dependency required
 * - Correctly bundles the worker for production
 */

// Set the worker source using Vite's URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

/**
 * Configure image decoders for advanced image formats
 *
 * PDF.js requires additional WASM modules to decode:
 * - JPEG2000 (JPX) images - Common in scanned documents and legal PDFs
 * - JXL (JPEG XL) images - Modern image format
 *
 * Without these decoders, PDFs with these image types will:
 * - Still display text and vector graphics
 * - Show warnings in console
 * - Have missing/invisible images
 *
 * IMPORTANT: PDF.js expects a DIRECTORY PATH with trailing slash, not individual file URLs.
 * It will automatically append filenames like 'openjpeg.wasm' and 'openjpeg_nowasm_fallback.js'.
 *
 * We copy WASM files to public/pdfjs-wasm/ so they're accessible at '/pdfjs-wasm/' in both
 * dev and production, and work correctly in the PDF.js worker thread context.
 */
export const wasmUrl = '/pdfjs-wasm/';

// Debug: Log the WASM URL to verify configuration
console.log('[PDF.js Config] WASM directory:', wasmUrl);

export { pdfjsLib };
