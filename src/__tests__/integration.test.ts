import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../colorConverter.js';

describe('Color Converter Integration Tests', () => {
  describe('Complete color conversion workflows', () => {
    it('should handle a complete workflow from hex to all formats', () => {
      const input = '#D4C7BA';
      const result = ColorConverter.convert(input);

      // Verify all conversions are present
      expect(result.hex).toBe('#d4c7ba');
      expect(result.rgb).toBe('rgb(212, 199, 186)');
      expect(result.hsl).toBeDefined();
      expect(result.hsb).toBeDefined();
      expect(result.cmyk).toBeDefined();

      // Verify raw values
      expect(result.rawValues?.rgb).toEqual({ r: 212, g: 199, b: 186 });
      expect(result.rawValues?.hsl).toBeDefined();
      expect(result.rawValues?.hsb).toBeDefined();
      expect(result.rawValues?.cmyk).toBeDefined();
    });

    it('should maintain color accuracy through multiple conversions', () => {
      // Start with RGB
      const originalRGB = { r: 128, g: 64, b: 192 };
      
      // Convert to all formats
      const hex = ColorConverter.rgbToHex(originalRGB);
      const hsl = ColorConverter.rgbToHSL(originalRGB);
      const hsb = ColorConverter.rgbToHSB(originalRGB);
      const cmyk = ColorConverter.rgbToCMYK(originalRGB);

      // Convert back to RGB from each format
      const fromHex = ColorConverter.hexToRGB(hex);
      const fromHSL = ColorConverter.hslToRGB(hsl);
      const fromHSB = ColorConverter.hsbToRGB(hsb);
      const fromCMYK = ColorConverter.cmykToRGB(cmyk);

      // Verify conversions maintain accuracy (allowing for rounding)
      expect(fromHex).toEqual(originalRGB);
      expect(Math.abs(fromHSL!.r - originalRGB.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromHSL!.g - originalRGB.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromHSL!.b - originalRGB.b)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromHSB!.r - originalRGB.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromHSB!.g - originalRGB.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromHSB!.b - originalRGB.b)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromCMYK!.r - originalRGB.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromCMYK!.g - originalRGB.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(fromCMYK!.b - originalRGB.b)).toBeLessThanOrEqual(1);
    });

    it('should handle alpha channel throughout conversion pipeline', () => {
      const input = 'rgba(255, 128, 64, 0.75)';
      const result = ColorConverter.convert(input);

      // Verify alpha is preserved in appropriate formats
      expect(result.rgba).toBe('rgba(255, 128, 64, 0.75)');
      expect(result.hsla).toContain('0.75');
      
      // Verify hex includes alpha as 8-digit hex
      expect(result.hex).toBe('#ff8040bf');
      expect(result.rgb).toBe('rgb(255, 128, 64)');
      expect(result.hsl).toBeDefined();
      expect(result.hsb).toBeDefined();
      expect(result.cmyk).toBeDefined();
    });
  });

  describe('Auto-detection scenarios', () => {
    const testCases = [
      { input: '#F0F', expected: 'hex', description: '3-digit hex' },
      { input: '#FF00FF', expected: 'hex', description: '6-digit hex' },
      { input: '#F0F8', expected: 'hex', description: '4-digit hex with alpha' },
      { input: '#FF00FF80', expected: 'hex', description: '8-digit hex with alpha' },
      { input: 'magenta', expected: 'hex', description: 'named color' },
      { input: 'rgb(255, 0, 255)', expected: 'rgb', description: 'RGB with parentheses' },
      { input: '255, 0, 255', expected: 'rgb', description: 'RGB without parentheses' },
      { input: 'rgba(255, 0, 255, 0.5)', expected: 'rgba', description: 'RGBA' },
      { input: 'hsl(300, 100%, 50%)', expected: 'hsl', description: 'HSL' },
      { input: 'hsla(300, 100%, 50%, 0.5)', expected: 'hsla', description: 'HSLA' },
      { input: 'hsb(300, 100%, 100%)', expected: 'hsb', description: 'HSB' },
      { input: 'hsv(300, 100%, 100%)', expected: 'hsb', description: 'HSV' },
      { input: 'cmyk(0%, 100%, 0%, 0%)', expected: 'cmyk', description: 'CMYK' },
    ];

    testCases.forEach(({ input, expected, description }) => {
      it(`should auto-detect ${description}`, () => {
        const detected = ColorConverter.detectFormat(input);
        expect(detected).toBe(expected);

        // Verify conversion works with auto-detection
        const result = ColorConverter.convert(input);
        expect(result.hex).toBeDefined();
        expect(result.rgb).toBeDefined();
      });
    });
  });

  describe('Named color conversions', () => {
    const namedColors = [
      { name: 'red', hex: '#ff0000', rgb: { r: 255, g: 0, b: 0 } },
      { name: 'lime', hex: '#00ff00', rgb: { r: 0, g: 255, b: 0 } },
      { name: 'blue', hex: '#0000ff', rgb: { r: 0, g: 0, b: 255 } },
      { name: 'yellow', hex: '#ffff00', rgb: { r: 255, g: 255, b: 0 } },
      { name: 'cyan', hex: '#00ffff', rgb: { r: 0, g: 255, b: 255 } },
      { name: 'magenta', hex: '#ff00ff', rgb: { r: 255, g: 0, b: 255 } },
      { name: 'black', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } },
      { name: 'white', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
      { name: 'gray', hex: '#808080', rgb: { r: 128, g: 128, b: 128 } },
      { name: 'darkslategray', hex: '#2f4f4f', rgb: { r: 47, g: 79, b: 79 } },
    ];

    namedColors.forEach(({ name, hex, rgb }) => {
      it(`should convert named color '${name}' correctly`, () => {
        const result = ColorConverter.convert(name);
        expect(result.hex).toBe(hex);
        expect(result.rawValues?.rgb).toEqual(rgb);
      });
    });

    it('should handle transparent color specially', () => {
      const result = ColorConverter.parseToRGB('transparent');
      expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });

    it('should throw error for currentcolor', () => {
      expect(() => ColorConverter.convert('currentcolor')).toThrow('currentcolor is context-dependent');
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle very small RGB values', () => {
      const result = ColorConverter.convert('rgb(1, 2, 3)');
      expect(result.hex).toBe('#010203');
      expect(result.rgb).toBe('rgb(1, 2, 3)');
    });

    it('should handle maximum values', () => {
      const result = ColorConverter.convert('rgb(255, 255, 255)');
      expect(result.hex).toBe('#ffffff');
      expect(result.hsl).toBe('hsl(0, 0%, 100%)');
      expect(result.hsb).toBe('hsb(0, 0%, 100%)');
      expect(result.cmyk).toBe('cmyk(0%, 0%, 0%, 0%)');
    });

    it('should handle pure colors', () => {
      // Pure red
      const red = ColorConverter.convert('#FF0000');
      expect(red.hsl).toBe('hsl(0, 100%, 50%)');
      expect(red.hsb).toBe('hsb(0, 100%, 100%)');
      expect(red.cmyk).toBe('cmyk(0%, 100%, 100%, 0%)');

      // Pure green
      const green = ColorConverter.convert('#00FF00');
      expect(green.hsl).toBe('hsl(120, 100%, 50%)');
      expect(green.hsb).toBe('hsb(120, 100%, 100%)');
      expect(green.cmyk).toBe('cmyk(100%, 0%, 100%, 0%)');

      // Pure blue
      const blue = ColorConverter.convert('#0000FF');
      expect(blue.hsl).toBe('hsl(240, 100%, 50%)');
      expect(blue.hsb).toBe('hsb(240, 100%, 100%)');
      expect(blue.cmyk).toBe('cmyk(100%, 100%, 0%, 0%)');
    });

    it('should handle invalid inputs gracefully', () => {
      expect(() => ColorConverter.convert('')).toThrow('Invalid color format or value');
      expect(() => ColorConverter.convert('notacolor')).toThrow('Invalid color format or value');
      expect(() => ColorConverter.convert('#GGGGGG')).toThrow('Invalid color format or value');
      expect(() => ColorConverter.convert('rgb(256, 0, 0)')).toThrow('RGB values must be between 0 and 255');
      expect(() => ColorConverter.convert('hsl(361, 100%, 50%)')).toThrow('Hue must be between 0 and 360');
    });
  });

  describe('Selective format conversion', () => {
    it('should convert only to requested formats', () => {
      const result = ColorConverter.convert('#FF0000', undefined, ['hex', 'hsl', 'cmyk']);
      
      // Requested formats should be present
      expect(result.hex).toBe('#ff0000');
      expect(result.hsl).toBe('hsl(0, 100%, 50%)');
      expect(result.cmyk).toBe('cmyk(0%, 100%, 100%, 0%)');
      
      // Non-requested formats should be undefined
      expect(result.rgb).toBeUndefined();
      expect(result.hsb).toBeUndefined();
    });

    it('should handle empty target formats array', () => {
      const result = ColorConverter.convert('#FF0000', undefined, []);
      
      // Should still have raw values but no formatted strings
      expect(result.rawValues?.rgb).toEqual({ r: 255, g: 0, b: 0 });
      expect(result.hex).toBeUndefined();
      expect(result.rgb).toBeUndefined();
      expect(result.hsl).toBeUndefined();
    });
  });

  describe('Format variations', () => {
    it('should handle RGB format variations', () => {
      const variations = [
        'rgb(128, 64, 192)',
        'RGB(128, 64, 192)',
        'rgb( 128 , 64 , 192 )',
        '128, 64, 192',
        '128,64,192',
      ];

      variations.forEach(input => {
        const result = ColorConverter.parseToRGB(input);
        expect(result).toEqual({ r: 128, g: 64, b: 192 });
      });
    });

    it('should handle HSL format variations', () => {
      const variations = [
        'hsl(270, 50%, 50%)',
        'HSL(270, 50%, 50%)',
        'hsl( 270 , 50% , 50% )',
        'hsl(270, 50, 50)',
      ];

      variations.forEach(input => {
        const format = ColorConverter.detectFormat(input);
        expect(format).toBe('hsl');
      });
    });

    it('should handle case-insensitive named colors', () => {
      const variations = ['RED', 'Red', 'red', 'rEd'];
      
      variations.forEach(input => {
        const result = ColorConverter.convert(input);
        expect(result.hex).toBe('#ff0000');
      });
    });
  });

  describe('Hex with alpha conversions', () => {
    it('should handle 4-digit hex with alpha correctly', () => {
      const result = ColorConverter.convert('#F0F8');
      expect(result.hex).toBe('#ff00ff88');
      expect(result.rgba).toBe('rgba(255, 0, 255, 0.5333333333333333)');
      expect(result.hsla).toContain('0.5333333333333333');
    });

    it('should handle 8-digit hex with alpha correctly', () => {
      const result = ColorConverter.convert('#FF00FF80');
      expect(result.hex).toBe('#ff00ff80');
      expect(result.rgba).toBe('rgba(255, 0, 255, 0.5019607843137255)');
      expect(result.hsla).toContain('0.5019607843137255');
    });

    it('should convert between hex with alpha and RGBA correctly', () => {
      // Start with 8-digit hex
      const hex8 = '#D4C7BABF';
      const result1 = ColorConverter.convert(hex8);
      
      // Convert the RGBA back to hex
      const result2 = ColorConverter.convert(result1.rgba!);
      
      // Should get back to the same hex (allowing for rounding)
      expect(result2.hex).toBe('#d4c7babf');
    });
  });

  describe('Performance considerations', () => {
    it('should handle batch conversions efficiently', () => {
      const colors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        'rgb(128, 128, 128)', 'hsl(180, 50%, 50%)', 'cmyk(50%, 25%, 0%, 10%)'
      ];

      const start = performance.now();
      colors.forEach(color => {
        ColorConverter.convert(color);
      });
      const duration = performance.now() - start;

      // Should complete reasonably fast (adjust threshold as needed)
      expect(duration).toBeLessThan(50); // 50ms for 9 conversions
    });
  });
});