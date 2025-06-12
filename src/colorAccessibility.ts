import { RGB } from './types.js';
import { ColorConverter } from './colorConverter.js';

/**
 * WCAG 2.1 Contrast Ratio Standards
 * 
 * AA Standards:
 * - Normal text: 4.5:1 minimum
 * - Large text (18pt or 14pt bold): 3:1 minimum
 * 
 * AAA Standards:
 * - Normal text: 7:1 minimum
 * - Large text: 4.5:1 minimum
 */

export interface ContrastResult {
  ratio: number;
  passes: {
    aa: {
      normal: boolean;
      large: boolean;
    };
    aaa: {
      normal: boolean;
      large: boolean;
    };
  };
  recommendation: string;
}

export interface AccessibilityOptions {
  targetContrast?: number;
  maintainHue?: boolean;
  preferDarker?: boolean;
}

/**
 * Calculate relative luminance according to WCAG 2.1
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, and B are linearized color channel values
 */
export function calculateRelativeLuminance(rgb: RGB): number {
  // Convert 0-255 to 0-1
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  // Linearize the values
  const linearR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const linearG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const linearB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
}

/**
 * Calculate contrast ratio between two colors
 * Formula: (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the relative luminance of the lighter color
 * and L2 is the relative luminance of the darker color
 */
export function calculateContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = calculateRelativeLuminance(color1);
  const lum2 = calculateRelativeLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if two colors meet WCAG accessibility standards
 */
export function checkContrast(foreground: string | RGB, background: string | RGB): ContrastResult {
  // Convert colors to RGB if needed
  const fgRgb = typeof foreground === 'string' 
    ? ColorConverter.parseToRGB(foreground) || { r: 0, g: 0, b: 0 }
    : foreground;
  
  const bgRgb = typeof background === 'string'
    ? ColorConverter.parseToRGB(background) || { r: 0, g: 0, b: 0 }
    : background;

  const ratio = calculateContrastRatio(fgRgb, bgRgb);

  // Round to 2 decimal places for display
  const roundedRatio = Math.round(ratio * 100) / 100;

  const result: ContrastResult = {
    ratio: roundedRatio,
    passes: {
      aa: {
        normal: ratio >= 4.5,
        large: ratio >= 3
      },
      aaa: {
        normal: ratio >= 7,
        large: ratio >= 4.5
      }
    },
    recommendation: ''
  };

  // Generate recommendation
  if (result.passes.aaa.normal) {
    result.recommendation = 'Excellent contrast! Passes all WCAG standards.';
  } else if (result.passes.aa.normal) {
    result.recommendation = 'Good contrast. Passes WCAG AA for all text sizes.';
  } else if (result.passes.aa.large) {
    result.recommendation = 'Adequate contrast for large text only (18pt+ or 14pt+ bold).';
  } else if (result.passes.aaa.large) {
    result.recommendation = 'Passes AAA for large text, but fails AA for normal text.';
  } else {
    result.recommendation = 'Poor contrast. Does not meet WCAG standards.';
  }

  return result;
}

/**
 * Find an accessible alternative to a given color
 * This function adjusts the lightness to meet the target contrast ratio
 */
export function findAccessibleColor(
  targetColor: string | RGB,
  backgroundColor: string | RGB,
  options: AccessibilityOptions = {}
): { color: RGB; hex: string; contrast: number } | null {
  const {
    targetContrast = 4.5, // Default to AA standard for normal text
    maintainHue = true,
    preferDarker = null
  } = options;

  // Convert to RGB
  const targetRgb = typeof targetColor === 'string'
    ? ColorConverter.parseToRGB(targetColor) || { r: 0, g: 0, b: 0 }
    : targetColor;
  
  const bgRgb = typeof backgroundColor === 'string'
    ? ColorConverter.parseToRGB(backgroundColor) || { r: 0, g: 0, b: 0 }
    : backgroundColor;

  // Check if current contrast is already sufficient
  const currentContrast = calculateContrastRatio(targetRgb, bgRgb);
  if (currentContrast >= targetContrast) {
    return {
      color: targetRgb,
      hex: ColorConverter.rgbToHex(targetRgb),
      contrast: currentContrast
    };
  }

  // Determine background luminance to decide direction
  const bgLuminance = calculateRelativeLuminance(bgRgb);
  const shouldDarken = preferDarker !== null ? preferDarker : bgLuminance > 0.5;

  if (maintainHue) {
    // Convert to HSL to maintain hue while adjusting lightness
    const targetHsl = ColorConverter.rgbToHSL(targetRgb);
    let bestColor: RGB | null = null;
    let bestContrast = 0;

    // Try different lightness values
    const step = shouldDarken ? -1 : 1;
    const start = shouldDarken ? targetHsl.l : targetHsl.l;
    const end = shouldDarken ? 0 : 100;

    for (let l = start; shouldDarken ? l >= end : l <= end; l += step) {
      const testHsl = { ...targetHsl, l };
      const testRgb = ColorConverter.hslToRGB(testHsl);
      const contrast = calculateContrastRatio(testRgb, bgRgb);

      if (contrast >= targetContrast) {
        return {
          color: testRgb,
          hex: ColorConverter.rgbToHex(testRgb),
          contrast
        };
      }

      if (contrast > bestContrast) {
        bestContrast = contrast;
        bestColor = testRgb;
      }
    }

    // If we couldn't find a color that meets the target, return the best we found
    if (bestColor) {
      return {
        color: bestColor,
        hex: ColorConverter.rgbToHex(bestColor),
        contrast: bestContrast
      };
    }
  } else {
    // Try pure black or white
    const black: RGB = { r: 0, g: 0, b: 0 };
    const white: RGB = { r: 255, g: 255, b: 255 };

    const blackContrast = calculateContrastRatio(black, bgRgb);
    const whiteContrast = calculateContrastRatio(white, bgRgb);

    if (shouldDarken && blackContrast >= targetContrast) {
      return {
        color: black,
        hex: '#000000',
        contrast: blackContrast
      };
    } else if (!shouldDarken && whiteContrast >= targetContrast) {
      return {
        color: white,
        hex: '#FFFFFF',
        contrast: whiteContrast
      };
    }

    // Return the better of the two
    if (blackContrast > whiteContrast) {
      return {
        color: black,
        hex: '#000000',
        contrast: blackContrast
      };
    } else {
      return {
        color: white,
        hex: '#FFFFFF',
        contrast: whiteContrast
      };
    }
  }

  return null;
}

/**
 * Get all contrast ratios for a color against common backgrounds
 */
export function getContrastReport(color: string | RGB): {
  white: ContrastResult;
  black: ContrastResult;
  gray: ContrastResult;
} {
  const white: RGB = { r: 255, g: 255, b: 255 };
  const black: RGB = { r: 0, g: 0, b: 0 };
  const gray: RGB = { r: 128, g: 128, b: 128 };

  return {
    white: checkContrast(color, white),
    black: checkContrast(color, black),
    gray: checkContrast(color, gray)
  };
}

/**
 * Suggest accessible color pairs for text and background
 */
export function suggestAccessiblePairs(baseColor: string | RGB, count: number = 5): Array<{
  foreground: { color: RGB; hex: string };
  background: { color: RGB; hex: string };
  contrast: number;
  passes: ContrastResult['passes'];
}> {
  const baseRgb = typeof baseColor === 'string'
    ? ColorConverter.parseToRGB(baseColor) || { r: 0, g: 0, b: 0 }
    : baseColor;

  const baseHsl = ColorConverter.rgbToHSL(baseRgb);
  const suggestions: Array<{
    foreground: { color: RGB; hex: string };
    background: { color: RGB; hex: string };
    contrast: number;
    passes: ContrastResult['passes'];
  }> = [];

  // Generate variations
  const lightnessVariations = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95];
  const baseLuminance = calculateRelativeLuminance(baseRgb);

  for (const l1 of lightnessVariations) {
    for (const l2 of lightnessVariations) {
      if (Math.abs(l1 - l2) < 30) continue; // Skip similar lightness values

      const color1 = ColorConverter.hslToRGB({ ...baseHsl, l: l1 });
      const color2 = ColorConverter.hslToRGB({ ...baseHsl, l: l2 });
      
      const result = checkContrast(color1, color2);
      
      // Only include pairs that meet at least AA for large text
      if (result.passes.aa.large) {
        const lum1 = calculateRelativeLuminance(color1);
        const lum2 = calculateRelativeLuminance(color2);
        
        suggestions.push({
          foreground: {
            color: lum1 < lum2 ? color1 : color2,
            hex: ColorConverter.rgbToHex(lum1 < lum2 ? color1 : color2)
          },
          background: {
            color: lum1 >= lum2 ? color1 : color2,
            hex: ColorConverter.rgbToHex(lum1 >= lum2 ? color1 : color2)
          },
          contrast: result.ratio,
          passes: result.passes
        });
      }
    }
  }

  // Sort by contrast ratio and return top suggestions
  return suggestions
    .sort((a, b) => b.contrast - a.contrast)
    .slice(0, count);
}