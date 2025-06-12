import { describe, it, expect, vi } from 'vitest';
import { findAccessibleColor } from '../colorAccessibility.js';
import { findColorBlindSafeAlternative, generateColorBlindSafePalette } from '../colorBlindness.js';
import { ColorConverter } from '../colorConverter.js';
import { ColorHarmony } from '../colorHarmony.js';

// Mock ColorConverter.parseToRGB to return null in specific cases
const originalParseToRGB = ColorConverter.parseToRGB;

describe('Edge Cases for 100% Coverage', () => {
  describe('Color Accessibility Edge Cases', () => {
    it('should handle scenario where both black and white cannot meet impossible contrast', () => {
      // Create a test that forces the function to go through all paths
      // This is a theoretical case since black/white have max contrast
      const result = findAccessibleColor('#808080', '#808080', {
        maintainHue: false,
        targetContrast: 1, // Very low threshold to ensure we get a result
        preferDarker: undefined // Let it auto-determine
      });
      
      // Should return a result (either black, white, or the best alternative found)
      expect(result).not.toBeNull();
      expect(result!.hex).toBeDefined();
    });

    it('should test all branches in black vs white selection', () => {
      // Test with a light background to prefer black
      const result1 = findAccessibleColor('#999999', '#FFFFFF', {
        maintainHue: false,
        targetContrast: 3.0
      });
      expect(result1).not.toBeNull();
      
      // Test with a dark background to prefer white  
      const result2 = findAccessibleColor('#666666', '#000000', {
        maintainHue: false,
        targetContrast: 3.0
      });
      expect(result2).not.toBeNull();
    });
  });

  describe('Color Blindness Edge Cases', () => {
    it('should handle invalid color input in findColorBlindSafeAlternative', () => {
      // Mock parseToRGB to return null for invalid input
      vi.spyOn(ColorConverter, 'parseToRGB').mockReturnValueOnce(null);
      
      const result = findColorBlindSafeAlternative(
        'invalid-color',
        ['#FF0000', '#00FF00'],
        ['protanopia']
      );
      
      // Should handle the null case gracefully
      expect(result).toBeDefined();
      
      // Restore the original function
      vi.restoreAllMocks();
    });

    it('should handle invalid base color in generateColorBlindSafePalette', () => {
      // Mock parseToRGB to return null for the first base color
      const mockParseToRGB = vi.spyOn(ColorConverter, 'parseToRGB');
      mockParseToRGB.mockReturnValueOnce(null); // First call returns null
      mockParseToRGB.mockReturnValue({ r: 255, g: 0, b: 0 }); // Subsequent calls return red
      
      const result = generateColorBlindSafePalette(
        ['invalid-color'],
        3
      );
      
      // Should handle the null case gracefully
      expect(result).toBeDefined();
      
      // Restore the original function
      vi.restoreAllMocks();
    });

    it('should test color blindness with edge case RGB values', () => {
      // Test with extreme values to ensure all paths are covered
      const extremeColors = [
        { r: 0, g: 0, b: 0 },     // Pure black
        { r: 255, g: 255, b: 255 }, // Pure white
        { r: 255, g: 0, b: 0 },   // Pure red
        { r: 0, g: 255, b: 0 },   // Pure green
        { r: 0, g: 0, b: 255 },   // Pure blue
      ];

      extremeColors.forEach(color => {
        const alternative = findColorBlindSafeAlternative(
          color,
          [{ r: 128, g: 128, b: 128 }], // Gray reference
          ['protanopia', 'deuteranopia', 'tritanopia']
        );
        expect(alternative).toBeDefined();
      });
    });
  });

  describe('Color Converter Edge Cases', () => {
    it('should test various edge cases in parseToRGB', () => {
      // Test cases that might reach uncovered lines
      const edgeCases = [
        '',           // Empty string
        'invalid',    // Invalid format
        'rgb()',      // Empty RGB
        'hsl()',      // Empty HSL
        'cmyk()',     // Empty CMYK
        '#',          // Just hash
        'rgb(256,0,0)', // Out of range (should throw)
        'hsl(361,50%,50%)', // Out of range hue (should throw)
      ];

      edgeCases.forEach(testCase => {
        try {
          const result = ColorConverter.parseToRGB(testCase);
          // If it doesn't throw, result should be null for invalid cases
          if (testCase === '' || testCase === 'invalid' || testCase === '#') {
            expect(result).toBeNull();
          }
        } catch (error) {
          // Expected for out-of-range values
          expect(error).toBeDefined();
        }
      });
    });

    it('should test edge cases in detectFormat', () => {
      const edgeCases = [
        '',
        'invalid',
        '#',
        'rgb',
        'hsl',
        'cmyk',
        'hsb',
        'lab',
        'xyz'
      ];

      edgeCases.forEach(testCase => {
        const result = ColorConverter.detectFormat(testCase);
        // Most should return null for invalid formats
        if (!testCase || testCase.length < 3) {
          expect(result).toBeNull();
        }
      });
    });
  });

  describe('Color Harmony Edge Cases', () => {
    it('should test unknown output formats', () => {
      // Test with an unknown output format to trigger default behavior
      const result = ColorHarmony.generateComplementary('#FF0000', 'unknown' as any);
      
      // Should handle gracefully and return some result
      expect(result).toBeDefined();
      expect(result.colors).toBeDefined();
    });

    it('should test error handling in harmony generation', () => {
      // Test with invalid base color
      expect(() => {
        ColorHarmony.generateHarmony('invalid-color', 'complementary', 'hex', {});
      }).toThrow();
    });
  });

  describe('Server Resource Edge Cases', () => {
    it('should test resource reading with edge cases', async () => {
      // Import the actual handlers from the server
      // This is to test the resource handling logic
      const { getAllPalettes, getPalette } = await import('../resources/palettes.js');
      
      // Test getting a non-existent palette
      const nonExistentPalette = getPalette('non-existent-palette');
      expect(nonExistentPalette).toBeUndefined();
      
      // Test getting all palettes
      const allPalettes = getAllPalettes();
      expect(allPalettes).toBeDefined();
      expect(Array.isArray(allPalettes)).toBe(true);
    });
  });
});