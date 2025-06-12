import { describe, it, expect } from 'vitest';
import { ColorHarmony } from '../colorHarmony';
import { ColorConverter } from '../colorConverter';

describe('ColorHarmony', () => {
  describe('Helper Methods', () => {
    it('should normalize hue values correctly', () => {
      // Access through the class methods that use normalizeHue internally
      const result1 = ColorHarmony.generateComplementary('#ff0000', 'hex');
      const result2 = ColorHarmony.generateComplementary('#00ff00', 'hex');
      
      // Red's complement should be cyan
      expect(result1.colors[1]).toBe('#00ffff');
      // Green's complement should be magenta
      expect(result2.colors[1]).toBe('#ff00ff');
    });

    it('should handle color format conversion', () => {
      const result = ColorHarmony.generateComplementary('rgb(255, 0, 0)', 'hsl');
      expect(result.colors[0]).toMatch(/^hsl\(/);
      expect(result.colors[1]).toMatch(/^hsl\(/);
    });

    it('should handle HSB/HSV output format', () => {
      // Test line 67 (hsb case) and hsv case in formatColor
      const resultHSB = ColorHarmony.generateComplementary('#ff0000', 'hsb');
      const resultHSV = ColorHarmony.generateComplementary('#ff0000', 'hsv');
      
      expect(resultHSB.colors[0]).toMatch(/^hsb\(/);
      expect(resultHSB.colors[1]).toMatch(/^hsb\(/);
      expect(resultHSV.colors[0]).toMatch(/^hsb\(/); // HSV should also use HSB format
      expect(resultHSV.colors[1]).toMatch(/^hsb\(/);
    });

    it('should handle CMYK output format', () => {
      // Test line 69 (cmyk case) in formatColor
      const result = ColorHarmony.generateComplementary('#ff0000', 'cmyk');
      
      expect(result.colors[0]).toMatch(/^cmyk\(/);
      expect(result.colors[1]).toMatch(/^cmyk\(/);
    });

    it('should handle unknown output format by returning empty string', () => {
      // Test line 71 (default case) in formatColor
      const result = ColorHarmony.generateComplementary('#ff0000', 'unknown' as any);
      
      // The default case returns result.hex || '', which is empty for unknown formats
      expect(result.colors[0]).toBe('');
      expect(result.colors[1]).toBe('');
    });
  });

  describe('Complementary Harmony', () => {
    it('should generate complementary colors', () => {
      const result = ColorHarmony.generateComplementary('#ff0000', 'hex');
      
      expect(result.type).toBe('complementary');
      expect(result.colors).toHaveLength(2);
      expect(result.colors[0]).toBe('#ff0000'); // Base color
      expect(result.colors[1]).toBe('#00ffff'); // Cyan (complement of red)
    });

    it('should apply angle adjustment', () => {
      const result = ColorHarmony.generateComplementary('#ff0000', 'hex', { angleAdjustment: 30 });
      
      expect(result.colors).toHaveLength(2);
      expect(result.colors[1]).not.toBe('#00ffff'); // Should be adjusted
    });

    it('should handle different output formats', () => {
      const resultRGB = ColorHarmony.generateComplementary('#ff0000', 'rgb');
      const resultHSL = ColorHarmony.generateComplementary('#ff0000', 'hsl');
      
      expect(resultRGB.colors[0]).toBe('rgb(255, 0, 0)');
      expect(resultRGB.colors[1]).toBe('rgb(0, 255, 255)');
      
      expect(resultHSL.colors[0]).toBe('hsl(0, 100%, 50%)');
      expect(resultHSL.colors[1]).toBe('hsl(180, 100%, 50%)');
    });
  });

  describe('Analogous Harmony', () => {
    it('should generate default 3 analogous colors', () => {
      const result = ColorHarmony.generateAnalogous('#ff0000', 'hex');
      
      expect(result.type).toBe('analogous');
      expect(result.colors).toHaveLength(3);
      expect(result.colors[1]).toBe('#ff0000'); // Base color in middle
    });

    it('should generate custom number of analogous colors', () => {
      const result = ColorHarmony.generateAnalogous('#ff0000', 'hex', { analogousCount: 5 });
      
      expect(result.colors).toHaveLength(5);
      expect(result.colors[2]).toBe('#ff0000'); // Base color in middle
    });

    it('should use custom angle between colors', () => {
      const result = ColorHarmony.generateAnalogous('#ff0000', 'hex', { analogousAngle: 15 });
      
      expect(result.colors).toHaveLength(3);
      // Colors should be closer together with smaller angle
      const hsl1 = ColorConverter.rgbToHSL(ColorConverter.hexToRGB(result.colors[0])!);
      const hsl2 = ColorConverter.rgbToHSL(ColorConverter.hexToRGB(result.colors[1])!);
      const hueDiff = Math.abs(hsl1.h - hsl2.h);
      // Account for wrapping around 360 degrees
      const adjustedDiff = hueDiff > 180 ? 360 - hueDiff : hueDiff;
      expect(adjustedDiff).toBeLessThanOrEqual(15);
    });
  });

  describe('Triadic Harmony', () => {
    it('should generate triadic colors', () => {
      const result = ColorHarmony.generateTriadic('#ff0000', 'hex');
      
      expect(result.type).toBe('triadic');
      expect(result.colors).toHaveLength(3);
      expect(result.colors[0]).toBe('#ff0000'); // Red
      expect(result.colors[1]).toBe('#00ff00'); // Green (120° from red)
      expect(result.colors[2]).toBe('#0000ff'); // Blue (240° from red)
    });

    it('should handle HSL output format', () => {
      const result = ColorHarmony.generateTriadic('#ff0000', 'hsl');
      
      expect(result.colors[0]).toBe('hsl(0, 100%, 50%)');
      expect(result.colors[1]).toBe('hsl(120, 100%, 50%)');
      expect(result.colors[2]).toBe('hsl(240, 100%, 50%)');
    });
  });

  describe('Tetradic/Square Harmony', () => {
    it('should generate tetradic colors', () => {
      const result = ColorHarmony.generateTetradic('#ff0000', 'hex');
      
      expect(result.type).toBe('square');
      expect(result.colors).toHaveLength(4);
      expect(result.colors[0]).toBe('#ff0000'); // Red
      expect(result.colors[1]).toBe('#80ff00'); // 90° from red
      expect(result.colors[2]).toBe('#00ffff'); // 180° from red
      expect(result.colors[3]).toBe('#7f00ff'); // 270° from red (rounding difference)
    });

    it('should handle angle adjustment', () => {
      const result = ColorHarmony.generateTetradic('#ff0000', 'hex', { angleAdjustment: 15 });
      
      expect(result.colors).toHaveLength(4);
      // Verify colors are adjusted
      expect(result.colors[1]).not.toBe('#80ff00');
    });
  });

  describe('Split-Complementary Harmony', () => {
    it('should generate split-complementary colors', () => {
      const result = ColorHarmony.generateSplitComplementary('#ff0000', 'hex');
      
      expect(result.type).toBe('split-complementary');
      expect(result.colors).toHaveLength(3);
      expect(result.colors[0]).toBe('#ff0000'); // Base color
      // The other two should be on either side of the complement
      expect(result.colors[1]).not.toBe('#00ffff'); // Not exact complement
      expect(result.colors[2]).not.toBe('#00ffff'); // Not exact complement
    });

    it('should generate correct split angles', () => {
      const result = ColorHarmony.generateSplitComplementary('#ff0000', 'hsl');
      
      // Base color is red (0°)
      expect(result.colors[0]).toBe('hsl(0, 100%, 50%)');
      // Split complements should be at 150° and 210° (180° ± 30°)
      expect(result.colors[1]).toBe('hsl(150, 100%, 50%)');
      expect(result.colors[2]).toBe('hsl(210, 100%, 50%)');
    });
  });

  describe('Double-Complementary Harmony', () => {
    it('should generate double-complementary colors', () => {
      const result = ColorHarmony.generateDoubleComplementary('#ff0000', 'hex');
      
      expect(result.type).toBe('double-complementary');
      expect(result.colors).toHaveLength(4);
      expect(result.colors[0]).toBe('#ff0000'); // Base color
    });

    it('should form a rectangle on color wheel', () => {
      const result = ColorHarmony.generateDoubleComplementary('#ff0000', 'hsl');
      
      expect(result.colors[0]).toBe('hsl(0, 100%, 50%)'); // Red
      expect(result.colors[1]).toBe('hsl(60, 100%, 50%)'); // Yellow (60° from red)
      expect(result.colors[2]).toBe('hsl(180, 100%, 50%)'); // Cyan (180° from red)
      expect(result.colors[3]).toBe('hsl(240, 100%, 50%)'); // Blue (240° from red)
    });
  });

  describe('General Harmony Generation', () => {
    it('should generate harmony by type', () => {
      const complementary = ColorHarmony.generateHarmony('#ff0000', 'complementary');
      const analogous = ColorHarmony.generateHarmony('#ff0000', 'analogous');
      const triadic = ColorHarmony.generateHarmony('#ff0000', 'triadic');
      
      expect(complementary.type).toBe('complementary');
      expect(analogous.type).toBe('analogous');
      expect(triadic.type).toBe('triadic');
    });

    it('should throw error for invalid harmony type', () => {
      expect(() => {
        ColorHarmony.generateHarmony('#ff0000', 'invalid' as any);
      }).toThrow('Unknown harmony type: invalid');
    });

    it('should handle square as alias for tetradic', () => {
      const square = ColorHarmony.generateHarmony('#ff0000', 'square');
      const tetradic = ColorHarmony.generateHarmony('#ff0000', 'tetradic');
      
      expect(square.colors).toEqual(tetradic.colors);
    });
  });

  describe('Generate All Harmonies', () => {
    it('should generate all harmony types', () => {
      const allHarmonies = ColorHarmony.generateAllHarmonies('#ff0000');
      
      expect(Object.keys(allHarmonies)).toHaveLength(6);
      expect(allHarmonies.complementary).toBeDefined();
      expect(allHarmonies.analogous).toBeDefined();
      expect(allHarmonies.triadic).toBeDefined();
      expect(allHarmonies.tetradic).toBeDefined();
      expect(allHarmonies['split-complementary']).toBeDefined();
      expect(allHarmonies['double-complementary']).toBeDefined();
    });

    it('should respect output format for all harmonies', () => {
      const allHarmonies = ColorHarmony.generateAllHarmonies('#ff0000', 'rgb');
      
      Object.values(allHarmonies).forEach(harmony => {
        harmony.colors.forEach(color => {
          expect(color).toMatch(/^rgb\(/);
        });
      });
    });
  });

  describe('Raw Values', () => {
    it('should include raw HSL values', () => {
      const result = ColorHarmony.generateComplementary('#ff0000');
      
      expect(result.rawValues).toBeDefined();
      expect(result.rawValues).toHaveLength(2);
      expect(result.rawValues![0]).toEqual({ h: 0, s: 100, l: 50 });
      expect(result.rawValues![1]).toEqual({ h: 180, s: 100, l: 50 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle grayscale colors', () => {
      const result = ColorHarmony.generateComplementary('#808080', 'hex');
      
      expect(result.colors[0]).toBe('#808080');
      expect(result.colors[1]).toBe('#808080'); // Complement of gray is gray
    });

    it('should handle named colors', () => {
      const result = ColorHarmony.generateComplementary('red', 'hex');
      
      expect(result.colors[0]).toBe('#ff0000');
      expect(result.colors[1]).toBe('#00ffff');
    });

    it('should handle invalid color input', () => {
      expect(() => {
        ColorHarmony.generateComplementary('invalid-color', 'hex');
      }).toThrow();
    });

    it('should handle very small analogous angles', () => {
      const result = ColorHarmony.generateAnalogous('#ff0000', 'hex', { 
        analogousAngle: 1,
        analogousCount: 5 
      });
      
      expect(result.colors).toHaveLength(5);
      // Colors should be very close together
    });

    it('should handle large angle adjustments', () => {
      const result = ColorHarmony.generateComplementary('#ff0000', 'hex', { 
        angleAdjustment: 360 
      });
      
      // 360° adjustment should bring us back to the same position
      expect(result.colors[1]).toBe('#00ffff'); // Same as no adjustment
    });
  });
});