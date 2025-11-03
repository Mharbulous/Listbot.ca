/**
 * WebGL Detection Utility
 *
 * Verifies whether hardware acceleration (WebGL/WebGL2) is being used
 * for PDF rendering vs falling back to Canvas 2D.
 *
 * This helps evaluate whether PDF.js's `enableHWA` option is actually
 * activating GPU rendering or falling back to CPU rendering.
 */

/**
 * Verify WebGL context availability and type
 *
 * @param {HTMLCanvasElement} canvas - Canvas element to check
 * @returns {Object} WebGL context information
 */
export function verifyWebGLContext(canvas) {
  if (!canvas) {
    return {
      hwaEnabled: false,
      contextType: 'Unknown',
      gpuActive: false,
      error: 'No canvas provided',
    };
  }

  try {
    // Try to get WebGL2 context first (preferred)
    const webgl2 = canvas.getContext('webgl2');
    if (webgl2) {
      return {
        hwaEnabled: true,
        contextType: 'WebGL2',
        gpuActive: true,
        vendor: webgl2.getParameter(webgl2.VENDOR),
        renderer: webgl2.getParameter(webgl2.RENDERER),
      };
    }

    // Fall back to WebGL 1.0
    const webgl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (webgl) {
      return {
        hwaEnabled: true,
        contextType: 'WebGL',
        gpuActive: true,
        vendor: webgl.getParameter(webgl.VENDOR),
        renderer: webgl.getParameter(webgl.RENDERER),
      };
    }

    // No WebGL support - using Canvas 2D
    return {
      hwaEnabled: false,
      contextType: 'Canvas2D',
      gpuActive: false,
      fallbackReason: 'WebGL not available',
    };
  } catch (err) {
    return {
      hwaEnabled: false,
      contextType: 'Canvas2D',
      gpuActive: false,
      error: err.message,
    };
  }
}

/**
 * Check if WebGL is supported by the browser
 *
 * @returns {boolean} True if WebGL is supported
 */
export function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (err) {
    return false;
  }
}

/**
 * Check if WebGL2 is supported by the browser
 *
 * @returns {boolean} True if WebGL2 is supported
 */
export function isWebGL2Supported() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return !!gl;
  } catch (err) {
    return false;
  }
}

/**
 * Get detailed WebGL capabilities
 *
 * @returns {Object} WebGL capabilities and system info
 */
export function getWebGLCapabilities() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    return {
      supported: false,
      webgl2: false,
    };
  }

  return {
    supported: true,
    webgl2: !!canvas.getContext('webgl2'),
    vendor: gl.getParameter(gl.VENDOR),
    renderer: gl.getParameter(gl.RENDERER),
    version: gl.getParameter(gl.VERSION),
    shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
  };
}

/**
 * Format WebGL info for console logging
 *
 * @param {Object} webglInfo - WebGL information object
 * @returns {string} Compact string representation
 */
export function formatWebGLForLog(webglInfo) {
  if (!webglInfo.hwaEnabled) {
    return `${webglInfo.contextType} (CPU)`;
  }

  return `${webglInfo.contextType} (GPU)`;
}
