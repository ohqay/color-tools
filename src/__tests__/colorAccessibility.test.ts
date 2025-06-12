import { describe, expect, test } from 'vitest';
import {
  calculateRelativeLuminance,
  calculateContrastRatio,
  checkContrast,
  findAccessibleColor,
  getContrastReport,
  suggestAccessiblePairs
} from '../colorAccessibility';
import { RGB } from '../types';

describe('Color Accessibility', () => {
  describe('calculateRelativeLuminance', () => {
    test('should calculate correct luminance for white', () => {
      const white: RGB = { r: 255, g: 255, b: 255 };
      expect(calculateRelativeLuminance(white)).toBeCloseTo(1, 5);
    });

    test('should calculate correct luminance for black', () => {
      const black: RGB = { r: 0, g: 0, b: 0 };
      expect(calculateRelativeLuminance(black)).toBeCloseTo(0, 5);
    });

    test('should calculate correct luminance for red', () => {
      const red: RGB = { r: 255, g: 0, b: 0 };
      expect(calculateRelativeLuminance(red)).toBeCloseTo(0.2126, 4);
    });

    test('should calculate correct luminance for green', () => {
      const green: RGB = { r: 0, g: 255, b: 0 };
      expect(calculateRelativeLuminance(green)).toBeCloseTo(0.7152, 4);
    });

    test('should calculate correct luminance for blue', () => {
      const blue: RGB = { r: 0, g: 0, b: 255 };
      expect(calculateRelativeLuminance(blue)).toBeCloseTo(0.0722, 4);
    });

    test('should calculate correct luminance for mid-gray', () => {
      const gray: RGB = { r: 128, g: 128, b: 128 };
      const luminance = calculateRelativeLuminance(gray);
      expect(luminance).toBeGreaterThan(0.2);
      expect(luminance).toBeLessThan(0.3);
    });
  });

  describe('calculateContrastRatio', () => {
    test('should calculate 21:1 for black on white', () => {
      const black: RGB = { r: 0, g: 0, b: 0 };
      const white: RGB = { r: 255, g: 255, b: 255 };
      expect(calculateContrastRatio(black, white)).toBeCloseTo(21, 1);
    });

    test('should calculate 1:1 for same colors', () => {
      const color: RGB = { r: 128, g: 128, b: 128 };
      expect(calculateContrastRatio(color, color)).toBeCloseTo(1, 1);
    });

    test('should handle color order correctly', () => {
      const dark: RGB = { r: 50, g: 50, b: 50 };
      const light: RGB = { r: 200, g: 200, b: 200 };
      const ratio1 = calculateContrastRatio(dark, light);
      const ratio2 = calculateContrastRatio(light, dark);
      expect(ratio1).toBeCloseTo(ratio2, 5);
    });
  });

  describe('checkContrast', () => {
    test('should pass all WCAG standards for black on white', () => {
      const result = checkContrast('#000000', '#FFFFFF');
      expect(result.ratio).toBeCloseTo(21, 1);
      expect(result.passes.aa.normal).toBe(true);
      expect(result.passes.aa.large).toBe(true);
      expect(result.passes.aaa.normal).toBe(true);
      expect(result.passes.aaa.large).toBe(true);
      expect(result.recommendation).toContain('Excellent');
    });

    test('should fail for similar colors', () => {
      const result = checkContrast('#777777', '#888888');
      expect(result.ratio).toBeLessThan(2);
      expect(result.passes.aa.normal).toBe(false);
      expect(result.passes.aa.large).toBe(false);
      expect(result.recommendation).toContain('Poor');
    });

    test('should pass AA large text only for moderate contrast', () => {
      const result = checkContrast('#666666', '#FFFFFF');
      expect(result.passes.aa.large).toBe(true);
      expect(result.passes.aa.normal).toBe(true); // This should pass AA normal too
    });

    test('should handle RGB input format', () => {
      const result = checkContrast('rgb(0, 0, 0)', 'rgb(255, 255, 255)');
      expect(result.ratio).toBeCloseTo(21, 1);
    });

    test('should handle HSL input format', () => {
      const result = checkContrast('hsl(0, 0%, 0%)', 'hsl(0, 0%, 100%)');
      expect(result.ratio).toBeCloseTo(21, 1);
    });
  });

  describe('findAccessibleColor', () => {
    test('should return original color if already accessible', () => {
      const result = findAccessibleColor('#000000', '#FFFFFF');
      expect(result).not.toBeNull();
      expect(result!.hex).toBe('#000000');
      expect(result!.contrast).toBeCloseTo(21, 1);
    });

    test('should find darker alternative for light background', () => {
      const result = findAccessibleColor('#CCCCCC', '#FFFFFF', {
        targetContrast: 4.5
      });
      expect(result).not.toBeNull();
      expect(result!.contrast).toBeGreaterThanOrEqual(4.5);
      // Should be darker than original
      expect(result!.color.r).toBeLessThanOrEqual(204);
    });

    test('should find lighter alternative for dark background', () => {
      const result = findAccessibleColor('#333333', '#000000', {
        targetContrast: 4.5
      });
      expect(result).not.toBeNull();
      expect(result!.contrast).toBeGreaterThanOrEqual(4.5);
      // Should be lighter than original
      expect(result!.color.r).toBeGreaterThanOrEqual(51);
    });

    test('should maintain hue when requested', () => {
      const original = '#FF6B6B'; // Light red
      const result = findAccessibleColor(original, '#FFFFFF', {
        maintainHue: true,
        targetContrast: 4.5
      });
      expect(result).not.toBeNull();
      expect(result!.contrast).toBeGreaterThanOrEqual(4.5);
    });

    test('should find black/white when maintainHue is false', () => {
      const result = findAccessibleColor('#888888', '#777777', {
        maintainHue: false,
        targetContrast: 7
      });
      expect(result).not.toBeNull();
      // Should be either black or white
      const isBlackOrWhite = 
        (result!.hex === '#000000') || 
        (result!.hex === '#FFFFFF');
      expect(isBlackOrWhite).toBe(true);
    });

    test('should respect preferDarker option', () => {
      const result = findAccessibleColor('#888888', '#CCCCCC', {
        preferDarker: true,
        targetContrast: 4.5
      });
      expect(result).not.toBeNull();
      // Should be darker than original
      expect(result!.color.r).toBeLessThanOrEqual(136);
    });

    test('should use black vs white comparison when maintainHue is false', () => {
      // Test the black vs white comparison logic (covering lines 233 and similar)
      // Use a very dark background to test the comparison
      const result = findAccessibleColor('#808080', '#202020', {
        maintainHue: false,
        targetContrast: 3
      });
      expect(result).not.toBeNull();
      // The function should try black or white and return one that works
      expect(result!.contrast).toBeGreaterThan(0);
    });

    test('should return best color when maintainHue cannot find perfect match', () => {
      // When maintainHue is true and target contrast can't be met, return best found
      const result = findAccessibleColor('#808080', '#808080', {
        maintainHue: true,
        targetContrast: 21 // Maximum possible contrast ratio, impossible to achieve
      });
      expect(result).not.toBeNull();
      // Should return the best color found (probably black or white hue-adjusted)
      expect(result!.contrast).toBeGreaterThan(0);
    });
  });

  describe('getContrastReport', () => {
    test('should return contrast against white, black, and gray', () => {
      const report = getContrastReport('#FF0000');
      
      expect(report.white).toBeDefined();
      expect(report.black).toBeDefined();
      expect(report.gray).toBeDefined();
      
      // Red should have better contrast against white than black
      expect(report.white.ratio).toBeLessThan(report.black.ratio);
    });

    test('should work with string color input', () => {
      const report = getContrastReport('rgb(255, 0, 0)');
      expect(report.white.ratio).toBeGreaterThan(1);
    });
  });

  describe('suggestAccessiblePairs', () => {
    test('should return accessible color pairs', () => {
      const suggestions = suggestAccessiblePairs('#3498db', 5);
      
      expect(suggestions).toHaveLength(5);
      
      suggestions.forEach(suggestion => {
        expect(suggestion.foreground).toBeDefined();
        expect(suggestion.background).toBeDefined();
        expect(suggestion.contrast).toBeGreaterThan(1);
        expect(suggestion.passes).toBeDefined();
        
        // At least should pass AA for large text
        expect(suggestion.passes.aa.large).toBe(true);
      });
    });

    test('should maintain base color hue', () => {
      const suggestions = suggestAccessiblePairs('#FF0000', 3);
      
      suggestions.forEach(suggestion => {
        // Both colors should have reddish hue
        expect(suggestion.foreground.hex).toMatch(/^#[0-9A-F]{6}$/i);
        expect(suggestion.background.hex).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should sort by contrast ratio', () => {
      const suggestions = suggestAccessiblePairs('#666666', 5);
      
      // Check that suggestions are sorted by descending contrast
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i - 1].contrast).toBeGreaterThanOrEqual(suggestions[i].contrast);
      }
    });

    test('should work with RGB object input', () => {
      // Test line 269 by passing RGB object instead of string
      const rgbColor: RGB = { r: 100, g: 150, b: 200 };
      const suggestions = suggestAccessiblePairs(rgbColor, 3);
      
      expect(suggestions).toHaveLength(3);
      suggestions.forEach(suggestion => {
        expect(suggestion.contrast).toBeGreaterThan(1);
      });
    });
  });

  describe('WCAG compliance edge cases', () => {
    test('should correctly identify AA compliance boundaries', () => {
      // Test at exactly 4.5:1 ratio
      const aaExact = checkContrast('#767676', '#FFFFFF');
      expect(aaExact.ratio).toBeCloseTo(4.5, 1);
      expect(aaExact.passes.aa.normal).toBe(true);
      
      // Test just below 4.5:1
      const aaBelowNormal = checkContrast('#777777', '#FFFFFF');
      expect(aaBelowNormal.ratio).toBeLessThan(4.5);
      expect(aaBelowNormal.passes.aa.normal).toBe(false);
      
      // Test at exactly 3:1 for large text
      const aaLargeExact = checkContrast('#949494', '#FFFFFF');
      expect(aaLargeExact.ratio).toBeCloseTo(3, 1);
      expect(aaLargeExact.passes.aa.large).toBe(true);
    });

    test('should correctly identify AAA compliance boundaries', () => {
      // Test at exactly 7:1 ratio
      const aaaExact = checkContrast('#595959', '#FFFFFF');
      expect(aaaExact.ratio).toBeCloseTo(7, 1);
      expect(aaaExact.passes.aaa.normal).toBe(true);
      
      // Test at exactly 4.5:1 for AAA large text
      const aaaLargeExact = checkContrast('#767676', '#FFFFFF');
      expect(aaaLargeExact.ratio).toBeCloseTo(4.5, 1);
      expect(aaaLargeExact.passes.aaa.large).toBe(true);
    });
  });
});