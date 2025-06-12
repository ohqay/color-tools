import type { RGB } from './types.js';
import { ColorConverter } from './colorConverter.js';

/**
 * Color Blindness Types and Transformation Matrices
 * 
 * Based on research from:
 * - Brettel, Viénot, and Mollon (1997) - "Computerized simulation of color appearance for dichromats"
 * - Machado, Oliveira, and Fernandes (2009) - "A Physiologically-based Model for Simulation of Color Vision Deficiency"
 * 
 * The matrices transform RGB values to simulate how people with different types
 * of color blindness perceive colors.
 */

export type ColorBlindnessType = 
  | 'protanopia'    // Red-blind (missing L cones)
  | 'protanomaly'   // Red-weak (anomalous L cones)
  | 'deuteranopia'  // Green-blind (missing M cones)
  | 'deuteranomaly' // Green-weak (anomalous M cones)
  | 'tritanopia'    // Blue-blind (missing S cones)
  | 'tritanomaly'   // Blue-weak (anomalous S cones)
  | 'achromatopsia' // Complete color blindness (monochromacy)
  | 'achromatomaly'; // Partial color blindness

export interface ColorBlindnessInfo {
  type: ColorBlindnessType;
  name: string;
  description: string;
  prevalence: string;
  severity: 'severe' | 'moderate' | 'mild';
}

/**
 * Information about each type of color blindness
 */
export const colorBlindnessInfo: Record<ColorBlindnessType, ColorBlindnessInfo> = {
  protanopia: {
    type: 'protanopia',
    name: 'Protanopia',
    description: 'Complete absence of red photoreceptors (L-cones)',
    prevalence: '1.3% of males, 0.02% of females',
    severity: 'severe'
  },
  protanomaly: {
    type: 'protanomaly',
    name: 'Protanomaly',
    description: 'Shifted spectral sensitivity of red photoreceptors',
    prevalence: '1.3% of males, 0.02% of females',
    severity: 'moderate'
  },
  deuteranopia: {
    type: 'deuteranopia',
    name: 'Deuteranopia',
    description: 'Complete absence of green photoreceptors (M-cones)',
    prevalence: '1.2% of males, 0.01% of females',
    severity: 'severe'
  },
  deuteranomaly: {
    type: 'deuteranomaly',
    name: 'Deuteranomaly',
    description: 'Shifted spectral sensitivity of green photoreceptors',
    prevalence: '5% of males, 0.4% of females',
    severity: 'moderate'
  },
  tritanopia: {
    type: 'tritanopia',
    name: 'Tritanopia',
    description: 'Complete absence of blue photoreceptors (S-cones)',
    prevalence: '0.001% (very rare)',
    severity: 'severe'
  },
  tritanomaly: {
    type: 'tritanomaly',
    name: 'Tritanomaly',
    description: 'Shifted spectral sensitivity of blue photoreceptors',
    prevalence: '0.01% (rare)',
    severity: 'mild'
  },
  achromatopsia: {
    type: 'achromatopsia',
    name: 'Achromatopsia',
    description: 'Complete color blindness, seeing only in grayscale',
    prevalence: '0.003% (extremely rare)',
    severity: 'severe'
  },
  achromatomaly: {
    type: 'achromatomaly',
    name: 'Achromatomaly',
    description: 'Partial color blindness with severely reduced color discrimination',
    prevalence: 'Very rare',
    severity: 'moderate'
  }
};

/**
 * Transformation matrices for color blindness simulation
 * These matrices are applied to linear RGB values
 */
const colorBlindnessMatrices: Record<ColorBlindnessType, number[][]> = {
  // Protanopia (red-blind)
  protanopia: [
    [0.567, 0.433, 0.000],
    [0.558, 0.442, 0.000],
    [0.000, 0.242, 0.758]
  ],
  
  // Protanomaly (red-weak)
  protanomaly: [
    [0.817, 0.183, 0.000],
    [0.333, 0.667, 0.000],
    [0.000, 0.125, 0.875]
  ],
  
  // Deuteranopia (green-blind)
  deuteranopia: [
    [0.625, 0.375, 0.000],
    [0.700, 0.300, 0.000],
    [0.000, 0.300, 0.700]
  ],
  
  // Deuteranomaly (green-weak)
  deuteranomaly: [
    [0.800, 0.200, 0.000],
    [0.258, 0.742, 0.000],
    [0.000, 0.142, 0.858]
  ],
  
  // Tritanopia (blue-blind)
  tritanopia: [
    [0.950, 0.050, 0.000],
    [0.000, 0.433, 0.567],
    [0.000, 0.475, 0.525]
  ],
  
  // Tritanomaly (blue-weak)
  tritanomaly: [
    [0.967, 0.033, 0.000],
    [0.000, 0.733, 0.267],
    [0.000, 0.183, 0.817]
  ],
  
  // Achromatopsia (complete color blindness)
  achromatopsia: [
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114],
    [0.299, 0.587, 0.114]
  ],
  
  // Achromatomaly (partial color blindness)
  achromatomaly: [
    [0.618, 0.320, 0.062],
    [0.163, 0.775, 0.062],
    [0.163, 0.320, 0.516]
  ]
};

/**
 * Apply gamma correction (linearize RGB values)
 */
function linearizeRgbChannel(value: number): number {
  const normalized = value / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Apply inverse gamma correction (delinearize RGB values)
 */
function delinearizeRgbChannel(value: number): number {
  if (value <= 0.0031308) {
    return Math.round(value * 12.92 * 255);
  }
  return Math.round((1.055 * Math.pow(value, 1 / 2.4) - 0.055) * 255);
}

/**
 * Simulate how a color appears to someone with color blindness
 */
export function simulateColorBlindness(
  color: string | RGB,
  type: ColorBlindnessType
): RGB {
  // Convert to RGB if needed
  const rgb = typeof color === 'string'
    ? ColorConverter.parseToRGB(color) ?? { r: 0, g: 0, b: 0 }
    : color;

  // Get the transformation matrix
  const matrix = colorBlindnessMatrices[type];

  // Linearize RGB values (remove gamma correction)
  const linearR = linearizeRgbChannel(rgb.r);
  const linearG = linearizeRgbChannel(rgb.g);
  const linearB = linearizeRgbChannel(rgb.b);

  // Apply the transformation matrix
  const transformedR = matrix[0][0] * linearR + matrix[0][1] * linearG + matrix[0][2] * linearB;
  const transformedG = matrix[1][0] * linearR + matrix[1][1] * linearG + matrix[1][2] * linearB;
  const transformedB = matrix[2][0] * linearR + matrix[2][1] * linearG + matrix[2][2] * linearB;

  // Delinearize and clamp values
  return {
    r: Math.min(255, Math.max(0, delinearizeRgbChannel(transformedR))),
    g: Math.min(255, Math.max(0, delinearizeRgbChannel(transformedG))),
    b: Math.min(255, Math.max(0, delinearizeRgbChannel(transformedB)))
  };
}

/**
 * Simulate all types of color blindness for a given color
 */
export function simulateAllColorBlindness(color: string | RGB): Record<ColorBlindnessType, {
  simulated: RGB;
  hex: string;
  info: ColorBlindnessInfo;
}> {
  const result: Record<ColorBlindnessType, {
    simulated: RGB;
    hex: string;
    info: ColorBlindnessInfo;
  }> = {} as any;

  for (const type of Object.keys(colorBlindnessInfo) as ColorBlindnessType[]) {
    const simulated = simulateColorBlindness(color, type);
    result[type] = {
      simulated,
      hex: ColorConverter.rgbToHex(simulated),
      info: colorBlindnessInfo[type]
    };
  }

  return result;
}

/**
 * Check if two colors are distinguishable for a specific type of color blindness
 */
export function areColorsDistinguishable(
  color1: string | RGB,
  color2: string | RGB,
  type: ColorBlindnessType,
  threshold = 10 // Minimum difference in RGB space
): boolean {
  const simulated1 = simulateColorBlindness(color1, type);
  const simulated2 = simulateColorBlindness(color2, type);

  // Calculate Euclidean distance in RGB space
  const distance = Math.sqrt(
    Math.pow(simulated1.r - simulated2.r, 2) +
    Math.pow(simulated1.g - simulated2.g, 2) +
    Math.pow(simulated1.b - simulated2.b, 2)
  );

  return distance >= threshold;
}

/**
 * Find color blind safe alternatives for a color
 */
export function findColorBlindSafeAlternative(
  originalColor: string | RGB,
  referenceColors: (string | RGB)[],
  types: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia']
): RGB | null {
  const original = typeof originalColor === 'string'
    ? ColorConverter.parseToRGB(originalColor) ?? { r: 0, g: 0, b: 0 }
    : originalColor;

  // Convert to HSL for manipulation
  const originalHsl = ColorConverter.rgbToHSL(original);

  // Try different hue and lightness combinations
  const hueShifts = [0, 30, -30, 60, -60, 90, -90, 120, -120, 150, -150, 180];
  const lightnessShifts = [0, 10, -10, 20, -20];

  for (const hueShift of hueShifts) {
    for (const lightnessShift of lightnessShifts) {
      const testHsl = {
        h: (originalHsl.h + hueShift + 360) % 360,
        s: originalHsl.s,
        l: Math.max(0, Math.min(100, originalHsl.l + lightnessShift))
      };

      const testRgb = ColorConverter.hslToRGB(testHsl);
      let isDistinguishable = true;

      // Check if this color is distinguishable from all reference colors
      // for all specified color blindness types
      for (const refColor of referenceColors) {
        for (const type of types) {
          if (!areColorsDistinguishable(testRgb, refColor, type)) {
            isDistinguishable = false;
            break;
          }
        }
        if (!isDistinguishable) {break;}
      }

      if (isDistinguishable) {
        return testRgb;
      }
    }
  }

  return null;
}

/**
 * Generate a color palette that is safe for color blind users
 */
export function generateColorBlindSafePalette(
  baseColors: (string | RGB)[],
  count = 5
): RGB[] {
  const palette: RGB[] = [];
  const types: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia'];

  // Start with the first base color
  const firstColor = typeof baseColors[0] === 'string'
    ? ColorConverter.parseToRGB(baseColors[0]) ?? { r: 0, g: 0, b: 0 }
    : baseColors[0];
  palette.push(firstColor);

  // Generate additional colors
  while (palette.length < count) {
    let bestCandidate: RGB | null = null;
    let bestMinDistance = 0;

    // Try multiple candidates and pick the one with the best minimum distance
    for (let i = 0; i < 100; i++) {
      // Generate a random color
      const hue = Math.random() * 360;
      const saturation = 40 + Math.random() * 60; // 40-100%
      const lightness = 25 + Math.random() * 50; // 25-75%

      const candidateHsl = { h: hue, s: saturation, l: lightness };
      const candidateRgb = ColorConverter.hslToRGB(candidateHsl);

      // Calculate minimum distance to existing palette colors
      let minDistance = Infinity;
      let isDistinguishable = true;

      for (const existingColor of palette) {
        for (const type of types) {
          if (!areColorsDistinguishable(candidateRgb, existingColor, type, 30)) {
            isDistinguishable = false;
            break;
          }

          const sim1 = simulateColorBlindness(candidateRgb, type);
          const sim2 = simulateColorBlindness(existingColor, type);
          const distance = Math.sqrt(
            Math.pow(sim1.r - sim2.r, 2) +
            Math.pow(sim1.g - sim2.g, 2) +
            Math.pow(sim1.b - sim2.b, 2)
          );

          minDistance = Math.min(minDistance, distance);
        }

        if (!isDistinguishable) {break;}
      }

      if (isDistinguishable && minDistance > bestMinDistance) {
        bestMinDistance = minDistance;
        bestCandidate = candidateRgb;
      }
    }

    if (bestCandidate) {
      palette.push(bestCandidate);
    } else {
      // If we can't find a good candidate, break to avoid infinite loop
      break;
    }
  }

  return palette;
}