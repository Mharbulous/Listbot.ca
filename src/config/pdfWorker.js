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

export { pdfjsLib };
