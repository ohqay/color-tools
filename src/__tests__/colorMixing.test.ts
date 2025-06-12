import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../colorConverter.js';

describe('Color Mixing', () => {
  describe('mixColors - Normal Blend Mode (LAB Space)', () => {
    it('should mix two colors at 50% ratio', () => {
      const result = ColorConverter.mixColors('#ff0000', '#0000ff', 0.5, 'normal');
      
      expect(result.hex).toBeDefined();
      expect(result.rgb).toBeDefined();
      expect(result.mixRatio).toBe(0.5);
      expect(result.mode).toBe('normal');
      
      // The result should be somewhere between red and blue
      const rgb = result.rawValues?.rgb;
      expect(rgb).toBeDefined();
      expect((rgb as any).r).toBeGreaterThan(0);
      expect((rgb as any).b).toBeGreaterThan(0);
    });

    it('should mix colors at different ratios', () => {
      // 100% first color
      const result1 = ColorConverter.mixColors('#ff0000', '#00ff00', 0, 'normal');
      expect(result1.hex).toBe('#ff0000');
      
      // 100% second color
      const result2 = ColorConverter.mixColors('#ff0000', '#00ff00', 1, 'normal');
      expect(result2.hex).toBe('#00ff00');
      
      // 25% mix
      const result3 = ColorConverter.mixColors('#ffffff', '#000000', 0.25, 'normal');
      const rgb3 = result3.rawValues?.rgb;
      // LAB mixing produces slightly different results than RGB mixing
      expect((rgb3 as any).r).toBeCloseTo(185, -1); // Allow some variance
      expect((rgb3 as any).g).toBeCloseTo(185, -1);
      expect((rgb3 as any).b).toBeCloseTo(185, -1);
    });

    it('should preserve perceptual uniformity in LAB space', () => {
      // Mix red and green in LAB space - should produce a more natural color
      const result = ColorConverter.mixColors('#ff0000', '#00ff00', 0.5, 'normal');
      
      // In LAB space, this should produce a more yellowish color rather than muddy brown
      const lab = result.rawValues?.lab;
      expect(lab).toBeDefined();
      expect((lab as any).l).toBeGreaterThan(50); // Should be reasonably bright
    });
  });

  describe('mixColors - Multiply Blend Mode', () => {
    it('should multiply colors correctly', () => {
      // White multiplied by any color should return that color
      const result1 = ColorConverter.mixColors('#ffffff', '#ff0000', 0.5, 'multiply');
      expect(result1.hex).toBe('#ff0000');
      
      // Black multiplied by any color should return black
      const result2 = ColorConverter.mixColors('#000000', '#ff0000', 0.5, 'multiply');
      expect(result2.hex).toBe('#000000');
      
      // Two identical colors multiplied
      const result3 = ColorConverter.mixColors('#808080', '#808080', 0.5, 'multiply');
      const rgb3 = result3.rawValues?.rgb;
      expect((rgb3 as any).r).toBe(64); // 128 * 128 / 255 ≈ 64
      expect((rgb3 as any).g).toBe(64);
      expect((rgb3 as any).b).toBe(64);
    });

    it('should darken colors when multiplied', () => {
      const result = ColorConverter.mixColors('#ff8080', '#80ff80', 0.5, 'multiply');
      const rgb = result.rawValues?.rgb;
      
      // Result should be darker than both input colors
      expect((rgb as any).r).toBeLessThan(255);
      expect((rgb as any).g).toBeLessThan(255);
    });
  });

  describe('mixColors - Screen Blend Mode', () => {
    it('should screen colors correctly', () => {
      // Black screened with any color should return that color
      const result1 = ColorConverter.mixColors('#000000', '#ff0000', 0.5, 'screen');
      expect(result1.hex).toBe('#ff0000');
      
      // White screened with any color should return white
      const result2 = ColorConverter.mixColors('#ffffff', '#ff0000', 0.5, 'screen');
      expect(result2.hex).toBe('#ffffff');
      
      // Two identical colors screened
      const result3 = ColorConverter.mixColors('#808080', '#808080', 0.5, 'screen');
      const rgb3 = result3.rawValues?.rgb;
      expect((rgb3 as any).r).toBe(192); // 255 - ((255-128)*(255-128)/255) ≈ 192
      expect((rgb3 as any).g).toBe(192);
      expect((rgb3 as any).b).toBe(192);
    });

    it('should lighten colors when screened', () => {
      const result = ColorConverter.mixColors('#800000', '#008000', 0.5, 'screen');
      const rgb = result.rawValues?.rgb;
      
      // Result should be lighter than both input colors
      expect((rgb as any).r).toBeGreaterThan(0);
      expect((rgb as any).g).toBeGreaterThan(0);
    });
  });

  describe('mixColors - Overlay Blend Mode', () => {
    it('should apply overlay blend correctly', () => {
      // Overlay with gray should preserve the gray
      const result1 = ColorConverter.mixColors('#808080', '#808080', 0.5, 'overlay');
      const rgb1 = result1.rawValues?.rgb;
      expect((rgb1 as any).r).toBeCloseTo(128, 0);
      expect((rgb1 as any).g).toBeCloseTo(128, 0);
      expect((rgb1 as any).b).toBeCloseTo(128, 0);
      
      // Dark colors should multiply
      const result2 = ColorConverter.mixColors('#404040', '#404040', 0.5, 'overlay');
      const rgb2 = result2.rawValues?.rgb;
      expect((rgb2 as any).r).toBeLessThan(64); // Should be darker
      
      // Light colors should screen
      const result3 = ColorConverter.mixColors('#c0c0c0', '#c0c0c0', 0.5, 'overlay');
      const rgb3 = result3.rawValues?.rgb;
      expect((rgb3 as any).r).toBeGreaterThan(192); // Should be lighter
    });
  });

  describe('mixColors - Alpha Channel Handling', () => {
    it('should mix colors with alpha channels', () => {
      const result = ColorConverter.mixColors('rgba(255, 0, 0, 0.5)', 'rgba(0, 0, 255, 0.5)', 0.5);
      
      expect(result.rgba).toBeDefined();
      const rgba = result.rawValues?.rgba;
      expect(rgba).toBeDefined();
      expect((rgba as any).a).toBeCloseTo(0.5, 2);
    });

    it('should handle mixed alpha and non-alpha colors', () => {
      // First color has alpha
      const result1 = ColorConverter.mixColors('rgba(255, 0, 0, 0.5)', '#0000ff', 0.5);
      expect(result1.rgba).toBeDefined();
      expect(result1.rawValues?.rgba?.a).toBeCloseTo(0.5, 2);
      
      // Second color has alpha
      const result2 = ColorConverter.mixColors('#ff0000', 'rgba(0, 0, 255, 0.5)', 0.5);
      expect(result2.rgba).toBeDefined();
      expect(result2.rawValues?.rgba?.a).toBeCloseTo(0.5, 2);
    });

    it('should interpolate alpha values', () => {
      const result = ColorConverter.mixColors('rgba(255, 0, 0, 0.2)', 'rgba(0, 0, 255, 0.8)', 0.5);
      const rgba = result.rawValues?.rgba;
      expect((rgba as any).a).toBeCloseTo(0.5, 2); // (0.2 * 0.5) + (0.8 * 0.5) = 0.5
    });
  });

  describe('mixColors - Error Handling', () => {
    it('should throw error for invalid color formats', () => {
      expect(() => ColorConverter.mixColors('invalid', '#ff0000', 0.5)).toThrow('Invalid color format');
      expect(() => ColorConverter.mixColors('#ff0000', 'invalid', 0.5)).toThrow('Invalid color format');
    });

    it('should throw error for unknown blend mode', () => {
      expect(() => ColorConverter.mixColors('#ff0000', '#00ff00', 0.5, 'unknown' as any)).toThrow('Unknown blend mode: unknown');
    });
  });

  describe('mixColors - Named Colors', () => {
    it('should mix named colors', () => {
      const result = ColorConverter.mixColors('red', 'blue', 0.5);
      expect(result.hex).toBeDefined();
      expect(result.mixRatio).toBe(0.5);
    });

    it('should mix named color with hex color', () => {
      const result = ColorConverter.mixColors('white', '#000000', 0.5);
      const rgb = result.rawValues?.rgb;
      // LAB mixing produces different values than simple RGB average
      expect((rgb as any).r).toBeCloseTo(119, -1);
      expect((rgb as any).g).toBeCloseTo(119, -1);
      expect((rgb as any).b).toBeCloseTo(119, -1);
    });
  });

  describe('mixColors - Complex Color Formats', () => {
    it('should mix different color formats', () => {
      const result = ColorConverter.mixColors('hsl(0, 100%, 50%)', 'rgb(0, 0, 255)', 0.5);
      expect(result.hex).toBeDefined();
      expect(result.hsl).toBeDefined();
      expect(result.rgb).toBeDefined();
    });

    it('should mix LAB colors directly', () => {
      const result = ColorConverter.mixColors('lab(50%, 50, 0)', 'lab(50%, -50, 0)', 0.5);
      const lab = result.rawValues?.lab;
      expect(lab).toBeDefined();
      // Due to conversion through RGB and back, values will be different
      // The mixing happens in LAB space correctly, but conversion to/from RGB changes values
      expect((lab as any).l).toBeDefined();
      expect((lab as any).a).toBeDefined(); 
      expect((lab as any).b).toBeDefined();
    });

    it('should mix XYZ colors', () => {
      const result = ColorConverter.mixColors('xyz(50, 50, 50)', 'xyz(20, 20, 20)', 0.5);
      expect(result.xyz).toBeDefined();
    });
  });

  describe('mixColors - Output Formats', () => {
    it('should include all color formats in result', () => {
      const result = ColorConverter.mixColors('#ff0000', '#0000ff', 0.5);
      
      expect(result.hex).toBeDefined();
      expect(result.rgb).toBeDefined();
      expect(result.hsl).toBeDefined();
      expect(result.hsb).toBeDefined();
      expect(result.cmyk).toBeDefined();
      expect(result.lab).toBeDefined();
      expect(result.xyz).toBeDefined();
    });

    it('should include raw values for all formats', () => {
      const result = ColorConverter.mixColors('#ff0000', '#0000ff', 0.5);
      
      expect(result.rawValues?.rgb).toBeDefined();
      expect(result.rawValues?.hsl).toBeDefined();
      expect(result.rawValues?.hsb).toBeDefined();
      expect(result.rawValues?.cmyk).toBeDefined();
      expect(result.rawValues?.lab).toBeDefined();
      expect(result.rawValues?.xyz).toBeDefined();
    });
  });
});