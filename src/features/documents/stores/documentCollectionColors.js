import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Document Collection Colors Store
 * Manages the text and background colors for the Document Collection title drawer
 */
export const useDocumentCollectionColorsStore = defineStore('documentCollectionColors', () => {
  // Default colors (purple gradient colors from original CSS)
  const textColor = ref('#FFFFFF');
  const backgroundColor = ref('#667eea');

  /**
   * Preset color combinations
   */
  const presets = [
    { text: '#006064', background: '#B2EBF2' },
    { text: '#E65100', background: '#FFECB3' },
    { text: '#C62828', background: '#FFCDD2' },
    { text: '#000000', background: '#4DD0E1' },
    { text: '#ECEFF1', background: '#455A64' },
  ];

  /**
   * Set colors to a specific preset
   * @param {number} presetIndex - Index of the preset (0-4)
   */
  function setPreset(presetIndex) {
    if (presetIndex >= 0 && presetIndex < presets.length) {
      const preset = presets[presetIndex];
      textColor.value = preset.text;
      backgroundColor.value = preset.background;
    }
  }

  /**
   * Generate a random hex color
   * @returns {string} Hex color code
   */
  function generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
  }

  /**
   * Calculate relative luminance of a color for contrast ratio calculations
   * @param {string} hex - Hex color code
   * @returns {number} Relative luminance (0-1)
   */
  function getLuminance(hex) {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    // Apply gamma correction
    const [rLinear, gLinear, bLinear] = [r, g, b].map(val =>
      val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
    );

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculate contrast ratio between two colors
   * @param {string} color1 - First hex color
   * @param {string} color2 - Second hex color
   * @returns {number} Contrast ratio
   */
  function getContrastRatio(color1, color2) {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Generate a complementary color based on color theory
   * @param {string} baseColor - Base hex color
   * @returns {string} Complementary hex color
   */
  function getComplementaryColor(baseColor) {
    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    // Calculate complementary by rotating hue 180 degrees
    // First convert to HSL
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rNorm) {
        h = ((gNorm - bNorm) / delta) % 6;
      } else if (max === gNorm) {
        h = (bNorm - rNorm) / delta + 2;
      } else {
        h = (rNorm - gNorm) / delta + 4;
      }
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    // Rotate hue by 180 degrees for complementary
    h = (h + 180) % 360;

    // Convert back to RGB
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let rPrime, gPrime, bPrime;
    if (h < 60) {
      [rPrime, gPrime, bPrime] = [c, x, 0];
    } else if (h < 120) {
      [rPrime, gPrime, bPrime] = [x, c, 0];
    } else if (h < 180) {
      [rPrime, gPrime, bPrime] = [0, c, x];
    } else if (h < 240) {
      [rPrime, gPrime, bPrime] = [0, x, c];
    } else if (h < 300) {
      [rPrime, gPrime, bPrime] = [x, 0, c];
    } else {
      [rPrime, gPrime, bPrime] = [c, 0, x];
    }

    const rFinal = Math.round((rPrime + m) * 255);
    const gFinal = Math.round((gPrime + m) * 255);
    const bFinal = Math.round((bPrime + m) * 255);

    return '#' + [rFinal, gFinal, bFinal].map(val => val.toString(16).padStart(2, '0')).join('').toUpperCase();
  }

  /**
   * Generate harmonious colors based on color theory
   * Uses the sidebar and header colors as reference:
   * - Sidebar: #0f172a (dark slate)
   * - Header: #f0f9ff to #e0f2fe (sky gradient)
   */
  function generateHarmoniousColors() {
    // Reference colors from the UI
    const sidebarColor = '#0f172a';
    const headerColor = '#e0f2fe';

    // Generate a background color that harmonizes with the UI
    // Use analogous color scheme (colors next to each other on color wheel)
    const bgOptions = [
      '#b2e0f2', // Light cyan (analogous to header sky blue)
      '#b2f2e0', // Light teal
      '#d4e0f2', // Light periwinkle
      '#e0d4f2', // Light lavender
      '#f2e0d4', // Light peach
    ];

    const bgColor = bgOptions[Math.floor(Math.random() * bgOptions.length)];

    // Generate text color with good contrast
    // Try darker colors for text (better readability)
    const darkOptions = [
      '#0f172a', // Dark slate (matches sidebar)
      '#1e293b', // Slate 800
      '#374151', // Gray 700
      '#1f2937', // Gray 800
      '#111827', // Gray 900
    ];

    let txtColor;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      txtColor = darkOptions[Math.floor(Math.random() * darkOptions.length)];
      attempts++;

      // Ensure we have at least 4.5:1 contrast ratio (WCAG AA standard)
    } while (getContrastRatio(txtColor, bgColor) < 4.5 && attempts < maxAttempts);

    // If we couldn't find a good dark color, use black or white based on background luminance
    if (getContrastRatio(txtColor, bgColor) < 4.5) {
      txtColor = getLuminance(bgColor) > 0.5 ? '#000000' : '#FFFFFF';
    }

    textColor.value = txtColor;
    backgroundColor.value = bgColor;
  }

  /**
   * Generate completely random colors
   * Ensures adequate contrast between text and background
   */
  function generateRandomColors() {
    let bgColor, txtColor;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      bgColor = generateRandomColor();
      txtColor = generateRandomColor();
      attempts++;

      // Ensure we have at least 4.5:1 contrast ratio (WCAG AA standard)
    } while (getContrastRatio(txtColor, bgColor) < 4.5 && attempts < maxAttempts);

    // If we couldn't find a good combination, use black or white text based on background
    if (getContrastRatio(txtColor, bgColor) < 4.5) {
      txtColor = getLuminance(bgColor) > 0.5 ? '#000000' : '#FFFFFF';
    }

    textColor.value = txtColor;
    backgroundColor.value = bgColor;
  }

  return {
    textColor,
    backgroundColor,
    setPreset,
    generateHarmoniousColors,
    generateRandomColors,
  };
});
