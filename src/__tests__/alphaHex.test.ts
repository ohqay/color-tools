import { describe, expect, it } from 'vitest';
import { ColorConverter } from '../colorConverter.js';

describe('Alpha Hex Format Support', () => {
  describe('4-digit hex format (#RGBA)', () => {
    it('should detect 4-digit hex format', () => {
      expect(ColorConverter.detectFormat('#F00F')).toBe('hex');
      expect(ColorConverter.detectFormat('#1234')).toBe('hex');
      expect(ColorConverter.detectFormat('#ABCD')).toBe('hex');
    });

    it('should parse 4-digit hex with full opacity', () => {
      const result = ColorConverter.hexToRGB('#F00F');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should parse 4-digit hex with zero opacity', () => {
      const result = ColorConverter.hexToRGB('#F000');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 0 });
    });

    it('should parse 4-digit hex with partial opacity', () => {
      const result = ColorConverter.hexToRGB('#F008');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 8/15 }); // 0x8 / 0xF
    });

    it('should convert 4-digit hex to other formats', () => {
      const result = ColorConverter.convert('#369C');
      expect(result.rgba).toBe('rgba(51, 102, 153, 0.8)');
      expect(result.hex).toBe('#336699cc');
      expect(result.rgb).toBe('rgb(51, 102, 153)');
    });
  });

  describe('8-digit hex format (#RRGGBBAA)', () => {
    it('should detect 8-digit hex format', () => {
      expect(ColorConverter.detectFormat('#FF0000FF')).toBe('hex');
      expect(ColorConverter.detectFormat('#12345678')).toBe('hex');
      expect(ColorConverter.detectFormat('#ABCDEFAB')).toBe('hex');
    });

    it('should parse 8-digit hex with full opacity', () => {
      const result = ColorConverter.hexToRGB('#FF0000FF');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    });

    it('should parse 8-digit hex with zero opacity', () => {
      const result = ColorConverter.hexToRGB('#FF000000');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 0 });
    });

    it('should parse 8-digit hex with 50% opacity', () => {
      const result = ColorConverter.hexToRGB('#FF000080');
      expect(result).toEqual({ r: 255, g: 0, b: 0, a: 128/255 });
    });

    it('should convert 8-digit hex to other formats', () => {
      const result = ColorConverter.convert('#336699CC');
      expect(result.rgba).toBe('rgba(51, 102, 153, 0.8)');
      expect(result.hex).toBe('#336699cc');
      expect(result.rgb).toBe('rgb(51, 102, 153)');
    });
  });

  describe('RGBA to Hex conversion', () => {
    it('should convert RGBA to 8-digit hex', () => {
      const result = ColorConverter.rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(result).toBe('#ff000080');
    });

    it('should convert RGBA with full opacity to 8-digit hex', () => {
      const result = ColorConverter.rgbToHex({ r: 255, g: 0, b: 0, a: 1 });
      expect(result).toBe('#ff0000ff');
    });

    it('should convert RGBA with zero opacity to 8-digit hex', () => {
      const result = ColorConverter.rgbToHex({ r: 255, g: 0, b: 0, a: 0 });
      expect(result).toBe('#ff000000');
    });

    it('should convert RGBA string to hex with alpha', () => {
      const result = ColorConverter.convert('rgba(255, 128, 64, 0.75)');
      expect(result.hex).toBe('#ff8040bf');
    });
  });

  describe('Backward compatibility', () => {
    it('should still parse 3-digit hex without alpha', () => {
      const result = ColorConverter.hexToRGB('#F00');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
      expect(result && 'a' in result).toBe(false);
    });

    it('should still parse 6-digit hex without alpha', () => {
      const result = ColorConverter.hexToRGB('#FF0000');
      expect(result).toEqual({ r: 255, g: 0, b: 0 });
      expect(result && 'a' in result).toBe(false);
    });

    it('should convert RGB without alpha to 6-digit hex', () => {
      const result = ColorConverter.rgbToHex({ r: 255, g: 0, b: 0 });
      expect(result).toBe('#ff0000');
    });

    it('should handle conversion from non-alpha format', () => {
      const result = ColorConverter.convert('#FF0000');
      expect(result.hex).toBe('#ff0000');
      expect(result.rgba).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle invalid hex lengths', () => {
      expect(ColorConverter.hexToRGB('#F')).toBeNull();
      expect(ColorConverter.hexToRGB('#FF')).toBeNull();
      expect(ColorConverter.hexToRGB('#FFFFF')).toBeNull();
      expect(ColorConverter.hexToRGB('#FFFFFFF')).toBeNull();
    });

    it('should handle invalid hex characters', () => {
      expect(ColorConverter.hexToRGB('#GGGG')).toBeNull();
      expect(ColorConverter.hexToRGB('#GGGGGGGG')).toBeNull();
    });

    it('should properly round alpha values', () => {
      // Test various alpha values to ensure proper conversion
      const testCases = [
        { hex: '#FF0000FF', expectedAlpha: 1 },
        { hex: '#FF000080', expectedAlpha: 0.5019607843137255 }, // 128/255
        { hex: '#FF000040', expectedAlpha: 0.25098039215686274 }, // 64/255
        { hex: '#FF0000BF', expectedAlpha: 0.7490196078431373 }, // 191/255
      ];

      for (const test of testCases) {
        const result = ColorConverter.hexToRGB(test.hex);
        expect(result).toBeDefined();
        expect('a' in result!).toBe(true);
        expect((result as any).a).toBeCloseTo(test.expectedAlpha, 5);
      }
    });
  });
});