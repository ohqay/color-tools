import { describe, it, expect } from 'bun:test';
import { ColorConverter } from '../colorConverter.js';

describe('ColorConverter', () => {
  describe('detectFormat', () => {
    it('should detect hex format', () => {
      expect(ColorConverter.detectFormat('#FFF')).toBe('hex');
      expect(ColorConverter.detectFormat('#FFFFFF')).toBe('hex');
      expect(ColorConverter.detectFormat('#123abc')).toBe('hex');
      expect(ColorConverter.detectFormat('#FFFF')).toBe('hex'); // 4-digit with alpha
      expect(ColorConverter.detectFormat('#FFFFFFFF')).toBe('hex'); // 8-digit with alpha
    });

    it('should detect named colors as hex format', () => {
      expect(ColorConverter.detectFormat('red')).toBe('hex');
      expect(ColorConverter.detectFormat('blue')).toBe('hex');
      expect(ColorConverter.detectFormat('darkslategray')).toBe('hex');
    });

    it('should detect RGB format', () => {
      expect(ColorConverter.detectFormat('rgb(255, 0, 0)')).toBe('rgb');
      expect(ColorConverter.detectFormat('RGB(0, 128, 255)')).toBe('rgb');
      expect(ColorConverter.detectFormat('255, 0, 0')).toBe('rgb');
    });

    it('should detect RGBA format', () => {
      expect(ColorConverter.detectFormat('rgba(255, 0, 0, 0.5)')).toBe('rgba');
      expect(ColorConverter.detectFormat('RGBA(0, 128, 255, 1)')).toBe('rgba');
    });

    it('should detect HSL format', () => {
      expect(ColorConverter.detectFormat('hsl(360, 100%, 50%)')).toBe('hsl');
      expect(ColorConverter.detectFormat('HSL(180, 50%, 75%)')).toBe('hsl');
      expect(ColorConverter.detectFormat('hsl(120, 50, 50)')).toBe('hsl');
    });

    it('should detect HSLA format', () => {
      expect(ColorConverter.detectFormat('hsla(360, 100%, 50%, 0.5)')).toBe('hsla');
      expect(ColorConverter.detectFormat('HSLA(180, 50%, 75%, 1)')).toBe('hsla');
    });

    it('should detect HSB/HSV format', () => {
      expect(ColorConverter.detectFormat('hsb(360, 100%, 100%)')).toBe('hsb');
      expect(ColorConverter.detectFormat('hsv(180, 50%, 75%)')).toBe('hsb');
      expect(ColorConverter.detectFormat('HSB(120, 50, 50)')).toBe('hsb');
    });

    it('should detect CMYK format', () => {
      expect(ColorConverter.detectFormat('cmyk(0%, 100%, 100%, 0%)')).toBe('cmyk');
      expect(ColorConverter.detectFormat('CMYK(50%, 25%, 0%, 10%)')).toBe('cmyk');
      expect(ColorConverter.detectFormat('cmyk(50, 25, 0, 10)')).toBe('cmyk');
    });

    it('should return null for invalid formats', () => {
      expect(ColorConverter.detectFormat('invalid')).toBe(null);
      expect(ColorConverter.detectFormat('123')).toBe(null);
      expect(ColorConverter.detectFormat('#GGGGGG')).toBe(null);
    });
  });

  describe('hexToRGB', () => {
    it('should convert 3-digit hex to RGB', () => {
      expect(ColorConverter.hexToRGB('#FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(ColorConverter.hexToRGB('#000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(ColorConverter.hexToRGB('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert 6-digit hex to RGB', () => {
      expect(ColorConverter.hexToRGB('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(ColorConverter.hexToRGB('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(ColorConverter.hexToRGB('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.hexToRGB('#D4C7BA')).toEqual({ r: 212, g: 199, b: 186 });
    });

    it('should handle hex without #', () => {
      expect(ColorConverter.hexToRGB('FFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(ColorConverter.hexToRGB('FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should convert 4-digit hex with alpha to RGBA', () => {
      expect(ColorConverter.hexToRGB('#F00F')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(ColorConverter.hexToRGB('#0F08')).toEqual({ r: 0, g: 255, b: 0, a: 0.5333333333333333 });
      expect(ColorConverter.hexToRGB('#00F0')).toEqual({ r: 0, g: 0, b: 255, a: 0 });
    });

    it('should convert 8-digit hex with alpha to RGBA', () => {
      expect(ColorConverter.hexToRGB('#FF0000FF')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
      expect(ColorConverter.hexToRGB('#00FF0080')).toEqual({ r: 0, g: 255, b: 0, a: 0.5019607843137255 });
      expect(ColorConverter.hexToRGB('#0000FF00')).toEqual({ r: 0, g: 0, b: 255, a: 0 });
      expect(ColorConverter.hexToRGB('#D4C7BABF')).toEqual({ r: 212, g: 199, b: 186, a: 0.7490196078431373 });
    });

    it('should return null for invalid hex', () => {
      expect(ColorConverter.hexToRGB('#GGGGGG')).toBe(null);
      expect(ColorConverter.hexToRGB('#12')).toBe(null);
      expect(ColorConverter.hexToRGB('#12345')).toBe(null);
      expect(ColorConverter.hexToRGB('#1234567')).toBe(null);
      expect(ColorConverter.hexToRGB('#123456789')).toBe(null);
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(ColorConverter.rgbToHex({ r: 255, g: 255, b: 255 })).toBe('#ffffff');
      expect(ColorConverter.rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
      expect(ColorConverter.rgbToHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
      expect(ColorConverter.rgbToHex({ r: 212, g: 199, b: 186 })).toBe('#d4c7ba');
    });

    it('should clamp values outside 0-255 range', () => {
      expect(ColorConverter.rgbToHex({ r: 300, g: -50, b: 128 })).toBe('#ff0080');
    });

    it('should convert RGBA to 8-digit hex', () => {
      expect(ColorConverter.rgbToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe('#ff0000ff');
      expect(ColorConverter.rgbToHex({ r: 0, g: 255, b: 0, a: 0.5 })).toBe('#00ff0080');
      expect(ColorConverter.rgbToHex({ r: 0, g: 0, b: 255, a: 0 })).toBe('#0000ff00');
      expect(ColorConverter.rgbToHex({ r: 212, g: 199, b: 186, a: 0.75 })).toBe('#d4c7babf');
    });

    it('should clamp alpha values outside 0-1 range', () => {
      expect(ColorConverter.rgbToHex({ r: 255, g: 0, b: 0, a: 1.5 })).toBe('#ff0000ff');
      expect(ColorConverter.rgbToHex({ r: 0, g: 255, b: 0, a: -0.5 })).toBe('#00ff0000');
    });
  });

  describe('rgbToHSL and hslToRGB', () => {
    it('should convert RGB to HSL', () => {
      const hsl = ColorConverter.rgbToHSL({ r: 255, g: 0, b: 0 });
      expect(hsl).toEqual({ h: 0, s: 100, l: 50 });

      const hsl2 = ColorConverter.rgbToHSL({ r: 0, g: 255, b: 0 });
      expect(hsl2).toEqual({ h: 120, s: 100, l: 50 });

      const hsl3 = ColorConverter.rgbToHSL({ r: 128, g: 128, b: 128 });
      expect(hsl3).toEqual({ h: 0, s: 0, l: 50 });
    });

    it('should convert HSL to RGB', () => {
      expect(ColorConverter.hslToRGB({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.hslToRGB({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorConverter.hslToRGB({ h: 240, s: 100, l: 50 })).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle grayscale conversions', () => {
      const gray = { r: 128, g: 128, b: 128 };
      const hsl = ColorConverter.rgbToHSL(gray);
      const rgb = ColorConverter.hslToRGB(hsl);
      expect(rgb).toEqual(gray);
    });
  });

  describe('rgbToHSB and hsbToRGB', () => {
    it('should convert RGB to HSB', () => {
      const hsb = ColorConverter.rgbToHSB({ r: 255, g: 0, b: 0 });
      expect(hsb).toEqual({ h: 0, s: 100, b: 100 });

      const hsb2 = ColorConverter.rgbToHSB({ r: 128, g: 128, b: 128 });
      expect(hsb2).toEqual({ h: 0, s: 0, b: 50 });
    });

    it('should convert HSB to RGB', () => {
      expect(ColorConverter.hsbToRGB({ h: 0, s: 100, b: 100 })).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.hsbToRGB({ h: 120, s: 100, b: 100 })).toEqual({ r: 0, g: 255, b: 0 });
      expect(ColorConverter.hsbToRGB({ h: 240, s: 100, b: 100 })).toEqual({ r: 0, g: 0, b: 255 });
    });

    it('should handle HSB with zero saturation (grayscale)', () => {
      // This tests the s === 0 branch in hsbToRGB (line 283)
      expect(ColorConverter.hsbToRGB({ h: 180, s: 0, b: 50 })).toEqual({ r: 128, g: 128, b: 128 });
      expect(ColorConverter.hsbToRGB({ h: 0, s: 0, b: 100 })).toEqual({ r: 255, g: 255, b: 255 });
      expect(ColorConverter.hsbToRGB({ h: 360, s: 0, b: 0 })).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('rgbToCMYK and cmykToRGB', () => {
    it('should convert RGB to CMYK', () => {
      const cmyk = ColorConverter.rgbToCMYK({ r: 255, g: 0, b: 0 });
      expect(cmyk).toEqual({ c: 0, m: 100, y: 100, k: 0 });

      const cmyk2 = ColorConverter.rgbToCMYK({ r: 0, g: 0, b: 0 });
      expect(cmyk2).toEqual({ c: 0, m: 0, y: 0, k: 100 });
    });

    it('should convert CMYK to RGB', () => {
      expect(ColorConverter.cmykToRGB({ c: 0, m: 100, y: 100, k: 0 })).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.cmykToRGB({ c: 0, m: 0, y: 0, k: 100 })).toEqual({ r: 0, g: 0, b: 0 });
    });
  });

  describe('parseRGBString', () => {
    it('should parse RGB strings', () => {
      expect(ColorConverter.parseRGBString('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.parseRGBString('RGB(128, 64, 32)')).toEqual({ r: 128, g: 64, b: 32 });
      expect(ColorConverter.parseRGBString('255, 0, 0')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should throw error for invalid RGB values', () => {
      expect(() => ColorConverter.parseRGBString('rgb(256, 0, 0)')).toThrow('RGB values must be between 0 and 255');
    });

    it('should throw error for negative RGB values', () => {
      expect(() => ColorConverter.parseRGBString('rgb(-1, 0, 0)')).toThrow('RGB values must be between 0 and 255');
    });

    it('should return null for invalid format', () => {
      expect(ColorConverter.parseRGBString('invalid')).toBe(null);
    });
  });

  describe('parseRGBAString', () => {
    it('should parse RGBA strings', () => {
      expect(ColorConverter.parseRGBAString('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(ColorConverter.parseRGBAString('RGBA(128, 64, 32, 1)')).toEqual({ r: 128, g: 64, b: 32, a: 1 });
    });

    it('should throw error for invalid alpha values', () => {
      expect(() => ColorConverter.parseRGBAString('rgba(255, 0, 0, 1.5)')).toThrow('Alpha channel must be between 0 and 1');
    });

    it('should throw error for negative alpha values', () => {
      expect(() => ColorConverter.parseRGBAString('rgba(255, 0, 0, -0.1)')).toThrow('Alpha channel must be between 0 and 1');
    });

    it('should throw error for invalid RGB values in RGBA', () => {
      expect(() => ColorConverter.parseRGBAString('rgba(256, 0, 0, 0.5)')).toThrow('Red channel must be between 0 and 255');
      expect(() => ColorConverter.parseRGBAString('rgba(0, -1, 0, 0.5)')).toThrow('Green channel must be between 0 and 255');
    });
  });

  describe('parseHSLString', () => {
    it('should parse HSL strings', () => {
      expect(ColorConverter.parseHSLString('hsl(360, 100%, 50%)')).toEqual({ h: 360, s: 100, l: 50 });
      expect(ColorConverter.parseHSLString('HSL(180, 50%, 75%)')).toEqual({ h: 180, s: 50, l: 75 });
      expect(ColorConverter.parseHSLString('120, 50, 50')).toEqual({ h: 120, s: 50, l: 50 });
    });

    it('should throw error for invalid HSL values', () => {
      expect(() => ColorConverter.parseHSLString('hsl(361, 50%, 50%)')).toThrow('Hue must be between 0 and 360');
      expect(() => ColorConverter.parseHSLString('hsl(180, 101%, 50%)')).toThrow('Saturation and Lightness must be between 0 and 100');
    });
  });

  describe('parseHSLAString', () => {
    it('should parse HSLA strings', () => {
      expect(ColorConverter.parseHSLAString('hsla(360, 100%, 50%, 0.5)')).toEqual({ h: 360, s: 100, l: 50, a: 0.5 });
      expect(ColorConverter.parseHSLAString('HSLA(180, 50%, 75%, 1)')).toEqual({ h: 180, s: 50, l: 75, a: 1 });
    });

    it('should throw error for invalid HSLA saturation/lightness values', () => {
      expect(() => ColorConverter.parseHSLAString('hsla(180, 101%, 50%, 0.5)')).toThrow('Saturation and Lightness must be between 0 and 100');
    });

    it('should throw error for invalid HSLA alpha values', () => {
      expect(() => ColorConverter.parseHSLAString('hsla(180, 50%, 50%, 1.5)')).toThrow('Alpha value must be between 0 and 1');
    });

    it('should throw error for invalid hue values in HSLA', () => {
      expect(() => ColorConverter.parseHSLAString('hsla(361, 50%, 50%, 0.5)')).toThrow('Hue must be between 0 and 360');
    });

    it('should return null for negative values in HSLA', () => {
      expect(ColorConverter.parseHSLAString('hsla(-1, 50%, 50%, 0.5)')).toBe(null);
    });
  });

  describe('parseHSBString', () => {
    it('should parse HSB/HSV strings', () => {
      expect(ColorConverter.parseHSBString('hsb(360, 100%, 100%)')).toEqual({ h: 360, s: 100, b: 100 });
      expect(ColorConverter.parseHSBString('hsv(180, 50%, 75%)')).toEqual({ h: 180, s: 50, b: 75 });
      expect(ColorConverter.parseHSBString('120, 50, 50')).toEqual({ h: 120, s: 50, b: 50 });
    });

    it('should throw error for invalid HSB values', () => {
      expect(() => ColorConverter.parseHSBString('hsb(361, 50%, 50%)')).toThrow('Hue must be between 0 and 360');
      expect(() => ColorConverter.parseHSBString('hsb(180, 101%, 50%)')).toThrow('Saturation must be between 0 and 100');
    });
  });

  describe('parseCMYKString', () => {
    it('should parse CMYK strings', () => {
      expect(ColorConverter.parseCMYKString('cmyk(0%, 100%, 100%, 0%)')).toEqual({ c: 0, m: 100, y: 100, k: 0 });
      expect(ColorConverter.parseCMYKString('CMYK(50%, 25%, 0%, 10%)')).toEqual({ c: 50, m: 25, y: 0, k: 10 });
      expect(ColorConverter.parseCMYKString('50, 25, 0, 10')).toEqual({ c: 50, m: 25, y: 0, k: 10 });
    });

    it('should throw error for invalid CMYK values', () => {
      expect(() => ColorConverter.parseCMYKString('cmyk(101%, 0%, 0%, 0%)')).toThrow('Cyan must be between 0 and 100');
    });

    it('should throw error for negative CMYK values', () => {
      expect(() => ColorConverter.parseCMYKString('cmyk(-1%, 0%, 0%, 0%)')).toThrow('Cyan must be between 0 and 100');
    });
  });

  describe('format methods', () => {
    it('should format RGB correctly', () => {
      expect(ColorConverter.formatRGB({ r: 255, g: 0, b: 0 })).toBe('rgb(255, 0, 0)');
    });

    it('should format RGBA correctly', () => {
      expect(ColorConverter.formatRGBA({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should format HSL correctly', () => {
      expect(ColorConverter.formatHSL({ h: 360, s: 100, l: 50 })).toBe('hsl(360, 100%, 50%)');
    });

    it('should format HSLA correctly', () => {
      expect(ColorConverter.formatHSLA({ h: 360, s: 100, l: 50, a: 0.5 })).toBe('hsla(360, 100%, 50%, 0.5)');
    });

    it('should format HSB correctly', () => {
      expect(ColorConverter.formatHSB({ h: 360, s: 100, b: 100 })).toBe('hsb(360, 100%, 100%)');
    });

    it('should format CMYK correctly', () => {
      expect(ColorConverter.formatCMYK({ c: 0, m: 100, y: 100, k: 0 })).toBe('cmyk(0%, 100%, 100%, 0%)');
    });
  });

  describe('parseToRGB', () => {
    it('should parse named colors', () => {
      expect(ColorConverter.parseToRGB('red')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.parseToRGB('blue')).toEqual({ r: 0, g: 0, b: 255 });
      expect(ColorConverter.parseToRGB('green')).toEqual({ r: 0, g: 128, b: 0 });
    });

    it('should handle transparent color', () => {
      expect(ColorConverter.parseToRGB('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    });

    it('should throw error for currentcolor', () => {
      expect(() => ColorConverter.parseToRGB('currentcolor')).toThrow('currentcolor is context-dependent');
    });

    it('should parse all formats correctly', () => {
      expect(ColorConverter.parseToRGB('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.parseToRGB('rgb(255, 0, 0)')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.parseToRGB('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should throw error for unsupported format in parseToRGB', () => {
      // Force a format that doesn't match to trigger the default case
      // Use an invalid format that won't be detected
      expect(() => ColorConverter.parseToRGB('#FF0000', 'unknown' as any)).toThrow('Unsupported color format');
    });
  });

  describe('convert', () => {
    it('should convert between all formats', () => {
      const result = ColorConverter.convert('#FF0000');
      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
      expect(result.hsl).toBe('hsl(0, 100%, 50%)');
      expect(result.hsb).toBe('hsb(0, 100%, 100%)');
      expect(result.cmyk).toBe('cmyk(0%, 100%, 100%, 0%)');
    });

    it('should convert to specific formats only', () => {
      const result = ColorConverter.convert('#FF0000', undefined, ['hex', 'rgb']);
      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
      expect(result.hsl).toBeUndefined();
      expect(result.hsb).toBeUndefined();
      expect(result.cmyk).toBeUndefined();
    });

    it('should handle RGBA conversions', () => {
      const result = ColorConverter.convert('rgba(255, 0, 0, 0.5)');
      expect(result.rgba).toBe('rgba(255, 0, 0, 0.5)');
      expect(result.hsla).toBe('hsla(0, 100%, 50%, 0.5)');
      expect(result.hex).toBe('#ff000080'); // Alpha included in hex as 8-digit hex
    });

    it('should include raw values', () => {
      const result = ColorConverter.convert('#FF0000');
      expect(result.rawValues?.rgb).toEqual({ r: 255, g: 0, b: 0 });
      expect(result.rawValues?.hsl).toEqual({ h: 0, s: 100, l: 50 });
      expect(result.rawValues?.hsb).toEqual({ h: 0, s: 100, b: 100 });
      expect(result.rawValues?.cmyk).toEqual({ c: 0, m: 100, y: 100, k: 0 });
    });

    it('should throw error for invalid input', () => {
      expect(() => ColorConverter.convert('invalid')).toThrow('Invalid color format');
    });

    it('should set hsv same as hsb', () => {
      const result = ColorConverter.convert('#FF0000', undefined, ['hsb', 'hsv']);
      expect(result.hsb).toBe('hsb(0, 100%, 100%)');
      expect(result.hsv).toBe('hsb(0, 100%, 100%)');
      expect(result.hsb).toBe(result.hsv);
    });
  });

  describe('edge cases and special values', () => {
    it('should handle pure white', () => {
      const white = ColorConverter.convert('#FFFFFF');
      expect(white.rgb).toBe('rgb(255, 255, 255)');
      expect(white.hsl).toBe('hsl(0, 0%, 100%)');
      expect(white.cmyk).toBe('cmyk(0%, 0%, 0%, 0%)');
    });

    it('should handle pure black', () => {
      const black = ColorConverter.convert('#000000');
      expect(black.rgb).toBe('rgb(0, 0, 0)');
      expect(black.hsl).toBe('hsl(0, 0%, 0%)');
      expect(black.cmyk).toBe('cmyk(0%, 0%, 0%, 100%)');
    });

    it('should handle mid-gray', () => {
      const gray = ColorConverter.convert('rgb(128, 128, 128)');
      expect(gray.hex).toBe('#808080');
      expect(gray.hsl).toBe('hsl(0, 0%, 50%)');
      expect(gray.hsb).toBe('hsb(0, 0%, 50%)');
    });

    it('should handle case insensitive named colors', () => {
      expect(ColorConverter.parseToRGB('RED')).toEqual({ r: 255, g: 0, b: 0 });
      expect(ColorConverter.parseToRGB('DarkSlateGray')).toEqual({ r: 47, g: 79, b: 79 });
    });
  });

  describe('LAB and XYZ in convert method', () => {
    it('should convert to LAB and XYZ formats', () => {
      const result = ColorConverter.convert('#FF0000', undefined, ['lab', 'xyz']);
      expect(result.lab).toBeDefined();
      expect(result.xyz).toBeDefined();
      expect(result.lab).toMatch(/^lab\(/);
      expect(result.xyz).toMatch(/^xyz\(/);
    });

    it('should include LAB and XYZ raw values', () => {
      const result = ColorConverter.convert('#00FF00', undefined, ['lab', 'xyz']);
      expect(result.rawValues?.lab).toBeDefined();
      expect(result.rawValues?.xyz).toBeDefined();
      expect(result.rawValues?.lab).toHaveProperty('l');
      expect(result.rawValues?.lab).toHaveProperty('a');
      expect(result.rawValues?.lab).toHaveProperty('b');
      expect(result.rawValues?.xyz).toHaveProperty('x');
      expect(result.rawValues?.xyz).toHaveProperty('y');
      expect(result.rawValues?.xyz).toHaveProperty('z');
    });

    it('should convert LAB input to other formats', () => {
      const result = ColorConverter.convert('lab(50%, 0, 0)', 'lab', ['hex', 'rgb']);
      expect(result.hex).toBeDefined();
      expect(result.rgb).toBeDefined();
    });

    it('should convert XYZ input to other formats', () => {
      const result = ColorConverter.convert('xyz(50, 50, 50)', 'xyz', ['hex', 'rgb']);
      expect(result.hex).toBeDefined();
      expect(result.rgb).toBeDefined();
    });
  });
});