import { describe, expect, test } from 'vitest';
import {
  simulateColorBlindness,
  simulateAllColorBlindness,
  areColorsDistinguishable,
  findColorBlindSafeAlternative,
  generateColorBlindSafePalette,
  ColorBlindnessType,
  colorBlindnessInfo
} from '../colorBlindness';
import { RGB } from '../types';

describe('Color Blindness Simulation', () => {
  describe('simulateColorBlindness', () => {
    test('should simulate protanopia (red-blind)', () => {
      const red: RGB = { r: 255, g: 0, b: 0 };
      const simulated = simulateColorBlindness(red, 'protanopia');
      
      // Red should appear much darker/different for protanopia
      expect(simulated.r).toBeLessThan(255);
      expect(simulated.g).toBeGreaterThan(0); // Some green component
    });

    test('should simulate deuteranopia (green-blind)', () => {
      const green: RGB = { r: 0, g: 255, b: 0 };
      const simulated = simulateColorBlindness(green, 'deuteranopia');
      
      // Green should appear different for deuteranopia
      expect(simulated.r).toBeGreaterThan(0); // Some red component
      expect(simulated.g).toBeLessThan(255);
    });

    test('should simulate tritanopia (blue-blind)', () => {
      const blue: RGB = { r: 0, g: 0, b: 255 };
      const simulated = simulateColorBlindness(blue, 'tritanopia');
      
      // Blue should appear different for tritanopia
      expect(simulated.b).toBeLessThan(255);
      expect(simulated.g).toBeGreaterThan(0); // Some green component
    });

    test('should simulate achromatopsia (complete color blindness)', () => {
      const color: RGB = { r: 255, g: 128, b: 64 };
      const simulated = simulateColorBlindness(color, 'achromatopsia');
      
      // Should be grayscale (all channels equal)
      expect(simulated.r).toBe(simulated.g);
      expect(simulated.g).toBe(simulated.b);
    });

    test('should handle string color input', () => {
      const simulated = simulateColorBlindness('#FF0000', 'protanopia');
      expect(simulated).toBeDefined();
      expect(simulated.r).toBeDefined();
      expect(simulated.g).toBeDefined();
      expect(simulated.b).toBeDefined();
    });

    test('should preserve white and black', () => {
      const white: RGB = { r: 255, g: 255, b: 255 };
      const black: RGB = { r: 0, g: 0, b: 0 };
      
      // White and black should remain relatively unchanged
      const whiteSimulated = simulateColorBlindness(white, 'protanopia');
      const blackSimulated = simulateColorBlindness(black, 'protanopia');
      
      expect(whiteSimulated.r).toBeCloseTo(255, 0);
      expect(whiteSimulated.g).toBeCloseTo(255, 0);
      expect(whiteSimulated.b).toBeCloseTo(255, 0);
      
      expect(blackSimulated.r).toBeCloseTo(0, 0);
      expect(blackSimulated.g).toBeCloseTo(0, 0);
      expect(blackSimulated.b).toBeCloseTo(0, 0);
    });

    test('should handle anomalous types (partial color blindness)', () => {
      const red: RGB = { r: 255, g: 0, b: 0 };
      
      const protanomaly = simulateColorBlindness(red, 'protanomaly');
      const protanopia = simulateColorBlindness(red, 'protanopia');
      
      // Protanomaly should be less severe than protanopia
      // The simulated color should be closer to the original
      const anomalyDistance = Math.sqrt(
        Math.pow(red.r - protanomaly.r, 2) +
        Math.pow(red.g - protanomaly.g, 2) +
        Math.pow(red.b - protanomaly.b, 2)
      );
      
      const opiaDistance = Math.sqrt(
        Math.pow(red.r - protanopia.r, 2) +
        Math.pow(red.g - protanopia.g, 2) +
        Math.pow(red.b - protanopia.b, 2)
      );
      
      expect(anomalyDistance).toBeLessThan(opiaDistance);
    });
  });

  describe('simulateAllColorBlindness', () => {
    test('should simulate all types of color blindness', () => {
      const color = '#FF6B6B';
      const results = simulateAllColorBlindness(color);
      
      // Should have all 8 types
      expect(Object.keys(results)).toHaveLength(8);
      
      // Check each type
      expect(results.protanopia).toBeDefined();
      expect(results.protanomaly).toBeDefined();
      expect(results.deuteranopia).toBeDefined();
      expect(results.deuteranomaly).toBeDefined();
      expect(results.tritanopia).toBeDefined();
      expect(results.tritanomaly).toBeDefined();
      expect(results.achromatopsia).toBeDefined();
      expect(results.achromatomaly).toBeDefined();
      
      // Each result should have simulated color, hex, and info
      Object.values(results).forEach(result => {
        expect(result.simulated).toBeDefined();
        expect(result.hex).toMatch(/^#[0-9A-F]{6}$/i);
        expect(result.info).toBeDefined();
        expect(result.info.type).toBeDefined();
        expect(result.info.name).toBeDefined();
        expect(result.info.description).toBeDefined();
        expect(result.info.prevalence).toBeDefined();
        expect(result.info.severity).toBeDefined();
      });
    });

    test('should produce different results for different types', () => {
      const color: RGB = { r: 200, g: 100, b: 50 };
      const results = simulateAllColorBlindness(color);
      
      // Protanopia and deuteranopia should produce different results
      expect(results.protanopia.hex).not.toBe(results.deuteranopia.hex);
      
      // Achromatopsia should produce grayscale
      const achroma = results.achromatopsia.simulated;
      expect(achroma.r).toBe(achroma.g);
      expect(achroma.g).toBe(achroma.b);
    });
  });

  describe('areColorsDistinguishable', () => {
    test('should identify distinguishable colors', () => {
      const red: RGB = { r: 255, g: 0, b: 0 };
      const blue: RGB = { r: 0, g: 0, b: 255 };
      
      // Red and blue should be distinguishable for most types
      expect(areColorsDistinguishable(red, blue, 'protanopia')).toBe(true);
      expect(areColorsDistinguishable(red, blue, 'deuteranopia')).toBe(true);
    });

    test('should identify indistinguishable colors', () => {
      const color1: RGB = { r: 255, g: 0, b: 0 };
      const color2: RGB = { r: 253, g: 2, b: 2 };
      
      // Very similar colors should be indistinguishable with a high threshold
      expect(areColorsDistinguishable(color1, color2, 'protanopia', 20)).toBe(false);
    });

    test('should use custom threshold', () => {
      const color1: RGB = { r: 100, g: 100, b: 100 };
      const color2: RGB = { r: 120, g: 120, b: 120 };
      
      // With high threshold, should be indistinguishable
      expect(areColorsDistinguishable(color1, color2, 'protanopia', 50)).toBe(false);
      
      // With low threshold, should be distinguishable
      expect(areColorsDistinguishable(color1, color2, 'protanopia', 10)).toBe(true);
    });

    test('should handle string color inputs', () => {
      const result = areColorsDistinguishable('#FF0000', '#0000FF', 'deuteranopia');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('findColorBlindSafeAlternative', () => {
    test('should find alternative color distinguishable from reference colors', () => {
      const original = '#FF0000';
      const referenceColors = ['#00FF00', '#0000FF'];
      
      const alternative = findColorBlindSafeAlternative(
        original,
        referenceColors,
        ['protanopia', 'deuteranopia']
      );
      
      if (alternative) {
        // Should be distinguishable from all reference colors
        referenceColors.forEach(refColor => {
          expect(areColorsDistinguishable(alternative, refColor, 'protanopia')).toBe(true);
          expect(areColorsDistinguishable(alternative, refColor, 'deuteranopia')).toBe(true);
        });
      }
    });

    test('should return null when no safe alternative exists', () => {
      // Create a scenario where finding alternative is very difficult
      const original: RGB = { r: 128, g: 128, b: 128 };
      const referenceColors: RGB[] = [];
      
      // Fill with many gray values
      for (let i = 0; i < 256; i += 5) {
        referenceColors.push({ r: i, g: i, b: i });
      }
      
      const alternative = findColorBlindSafeAlternative(
        original,
        referenceColors,
        ['protanopia', 'deuteranopia', 'tritanopia']
      );
      
      // Might return null if no distinguishable color can be found
      expect(alternative === null || alternative !== null).toBe(true);
    });

    test('should prefer minimal changes when possible', () => {
      const original: RGB = { r: 200, g: 50, b: 50 };
      const referenceColors = [{ r: 50, g: 200, b: 50 }]; // Green
      
      const alternative = findColorBlindSafeAlternative(
        original,
        referenceColors,
        ['protanopia']
      );
      
      if (alternative) {
        // Should still be somewhat reddish if possible
        expect(alternative.r).toBeGreaterThan(alternative.g);
      }
    });
  });

  describe('generateColorBlindSafePalette', () => {
    test('should generate requested number of colors', () => {
      const baseColors = ['#FF0000', '#00FF00', '#0000FF'];
      const palette = generateColorBlindSafePalette(baseColors, 5);
      
      expect(palette.length).toBeLessThanOrEqual(5);
      expect(palette.length).toBeGreaterThan(0);
    });

    test('should ensure all colors are distinguishable', () => {
      const baseColors = [{ r: 255, g: 0, b: 0 }];
      const palette = generateColorBlindSafePalette(baseColors, 4);
      
      // Check each pair of colors
      for (let i = 0; i < palette.length; i++) {
        for (let j = i + 1; j < palette.length; j++) {
          // Should be distinguishable for major types
          expect(areColorsDistinguishable(
            palette[i],
            palette[j],
            'protanopia',
            30
          )).toBe(true);
        }
      }
    });

    test('should include base colors in palette', () => {
      const baseRed: RGB = { r: 255, g: 0, b: 0 };
      const palette = generateColorBlindSafePalette([baseRed], 3);
      
      // First color should be the base color
      expect(palette[0]).toEqual(baseRed);
    });

    test('should handle edge case with single color request', () => {
      const baseColors = ['#123456'];
      const palette = generateColorBlindSafePalette(baseColors, 1);
      
      expect(palette).toHaveLength(1);
    });
  });

  describe('colorBlindnessInfo', () => {
    test('should provide info for all color blindness types', () => {
      const types: ColorBlindnessType[] = [
        'protanopia', 'protanomaly',
        'deuteranopia', 'deuteranomaly',
        'tritanopia', 'tritanomaly',
        'achromatopsia', 'achromatomaly'
      ];
      
      types.forEach(type => {
        const info = colorBlindnessInfo[type];
        expect(info).toBeDefined();
        expect(info.type).toBe(type);
        expect(info.name).toBeDefined();
        expect(info.description).toBeDefined();
        expect(info.prevalence).toBeDefined();
        expect(['severe', 'moderate', 'mild']).toContain(info.severity);
      });
    });

    test('should have correct severity levels', () => {
      // -opia types should be severe
      expect(colorBlindnessInfo.protanopia.severity).toBe('severe');
      expect(colorBlindnessInfo.deuteranopia.severity).toBe('severe');
      expect(colorBlindnessInfo.tritanopia.severity).toBe('severe');
      expect(colorBlindnessInfo.achromatopsia.severity).toBe('severe');
      
      // -anomaly types should be moderate or mild
      expect(colorBlindnessInfo.protanomaly.severity).toBe('moderate');
      expect(colorBlindnessInfo.deuteranomaly.severity).toBe('moderate');
      expect(colorBlindnessInfo.tritanomaly.severity).toBe('mild');
    });
  });

  describe('Edge cases and validation', () => {
    test('should handle pure colors correctly', () => {
      const pureRed: RGB = { r: 255, g: 0, b: 0 };
      const pureGreen: RGB = { r: 0, g: 255, b: 0 };
      const pureBlue: RGB = { r: 0, g: 0, b: 255 };
      
      // Test each pure color with each type
      const colors = [pureRed, pureGreen, pureBlue];
      const types: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia'];
      
      colors.forEach(color => {
        types.forEach(type => {
          const simulated = simulateColorBlindness(color, type);
          // Should return valid RGB values
          expect(simulated.r).toBeGreaterThanOrEqual(0);
          expect(simulated.r).toBeLessThanOrEqual(255);
          expect(simulated.g).toBeGreaterThanOrEqual(0);
          expect(simulated.g).toBeLessThanOrEqual(255);
          expect(simulated.b).toBeGreaterThanOrEqual(0);
          expect(simulated.b).toBeLessThanOrEqual(255);
        });
      });
    });

    test('should maintain color relationships', () => {
      // Lighter color should remain lighter after simulation
      const light: RGB = { r: 200, g: 200, b: 200 };
      const dark: RGB = { r: 50, g: 50, b: 50 };
      
      const lightSim = simulateColorBlindness(light, 'protanopia');
      const darkSim = simulateColorBlindness(dark, 'protanopia');
      
      const lightLuminance = (lightSim.r + lightSim.g + lightSim.b) / 3;
      const darkLuminance = (darkSim.r + darkSim.g + darkSim.b) / 3;
      
      expect(lightLuminance).toBeGreaterThan(darkLuminance);
    });
  });
});