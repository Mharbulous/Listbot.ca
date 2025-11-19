/**
 * Analyze PDF page complexity to correlate with rendering performance
 *
 * Tracks page characteristics that may impact rendering speed:
 * - Text complexity (number of text items)
 * - Image count
 * - Annotations
 * - Page dimensions
 */

/**
 * Count images in a PDF page by analyzing page operators
 *
 * @param {PDFPageProxy} page - PDF.js page proxy
 * @returns {Promise<number>} Number of images on the page
 */
async function countImages(page) {
  try {
    const ops = await page.getOperatorList();
    let imageCount = 0;

    // PDF operator codes for images:
    // - OPS.paintImageXObject
    // - OPS.paintInlineImageXObject
    // - OPS.paintImageMaskXObject
    for (let i = 0; i < ops.fnArray.length; i++) {
      const op = ops.fnArray[i];
      // PDF.js OPS constants for image operations
      if (op === 85 || op === 86 || op === 87) {
        // 85 = paintImageXObject
        // 86 = paintInlineImageXObject
        // 87 = paintImageMaskXObject
        imageCount++;
      }
    }

    return imageCount;
  } catch (err) {
    console.warn('[PageComplexity] Failed to count images:', err);
    return 0;
  }
}

/**
 * Analyze page complexity metrics
 *
 * @param {PDFPageProxy} page - PDF.js page proxy
 * @returns {Promise<Object>} Page complexity metrics
 */
export async function analyzePageComplexity(page) {
  try {
    // Get text content
    const textContent = await page.getTextContent();

    // Get annotations
    const annotations = await page.getAnnotations();

    // Get page dimensions
    const viewport = page.getViewport({ scale: 1.0 });

    // Count images
    const imageCount = await countImages(page);

    return {
      textItems: textContent.items.length,
      images: imageCount,
      annotations: annotations.length,
      dimensions: `${Math.round(viewport.width)}x${Math.round(viewport.height)}`,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
    };
  } catch (err) {
    console.warn('[PageComplexity] Failed to analyze page:', err);
    return {
      textItems: 0,
      images: 0,
      annotations: 0,
      dimensions: 'unknown',
      width: 0,
      height: 0,
    };
  }
}

/**
 * Get a simplified complexity description
 *
 * @param {Object} complexity - Complexity object from analyzePageComplexity
 * @returns {string} Human-readable complexity description
 */
export function getComplexityDescription(complexity) {
  const { textItems, images } = complexity;

  if (textItems > 5000 || images > 10) {
    return 'Very Complex';
  } else if (textItems > 2000 || images > 5) {
    return 'Complex';
  } else if (textItems > 500 || images > 2) {
    return 'Moderate';
  } else {
    return 'Simple';
  }
}

/**
 * Format complexity for console logging
 *
 * @param {Object} complexity - Complexity object from analyzePageComplexity
 * @returns {string} Compact string representation
 */
export function formatComplexityForLog(complexity) {
  const { textItems, images, annotations } = complexity;
  const parts = [`${textItems} text`];

  if (images > 0) {
    parts.push(`${images} img`);
  }

  if (annotations > 0) {
    parts.push(`${annotations} annot`);
  }

  return parts.join(', ');
}
