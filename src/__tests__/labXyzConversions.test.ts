import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../colorConverter.js';

describe('LAB and XYZ Color Conversions', () => {
  describe('detectFormat', () => {
    it('should detect LAB format', () => {
      expect(ColorConverter.detectFormat('lab(50%, 25, -50)')).toBe('lab');
      expect(ColorConverter.detectFormat('LAB(75%, -10, 30)')).toBe('lab');
      expect(ColorConverter.detectFormat('lab(100, 0, 0)')).toBe('lab');
    });

    it('should detect XYZ format', () => {
      expect(ColorConverter.detectFormat('xyz(41.24, 21.26, 1.93)')).toBe('xyz');
      expect(ColorConverter.detectFormat('XYZ(50, 50, 50)')).toBe('xyz');
      expect(ColorConverter.detectFormat('xyz(95.047, 100, 108.883)')).toBe('xyz');
    });
  });

  describe('RGB to XYZ conversion', () => {
    it('should convert black to XYZ', () => {
      const xyz = ColorConverter.rgbToXYZ({ r: 0, g: 0, b: 0 });
      expect(xyz.x).toBe(0);
      expect(xyz.y).toBe(0);
      expect(xyz.z).toBe(0);
    });

    it('should convert white to XYZ (D65 illuminant)', () => {
      const xyz = ColorConverter.rgbToXYZ({ r: 255, g: 255, b: 255 });
      expect(xyz.x).toBeCloseTo(95.047, 0);
      expect(xyz.y).toBeCloseTo(100, 0);
      expect(xyz.z).toBeCloseTo(108.883, 0);
    });

    it('should convert red to XYZ', () => {
      const xyz = ColorConverter.rgbToXYZ({ r: 255, g: 0, b: 0 });
      expect(xyz.x).toBeCloseTo(41.246, 0);
      expect(xyz.y).toBeCloseTo(21.267, 0);
      expect(xyz.z).toBeCloseTo(1.933, 0);
    });

    it('should convert green to XYZ', () => {
      const xyz = ColorConverter.rgbToXYZ({ r: 0, g: 255, b: 0 });
      expect(xyz.x).toBeCloseTo(35.758, 0);
      expect(xyz.y).toBeCloseTo(71.515, 0);
      expect(xyz.z).toBeCloseTo(11.919, 0);
    });

    it('should convert blue to XYZ', () => {
      const xyz = ColorConverter.rgbToXYZ({ r: 0, g: 0, b: 255 });
      expect(xyz.x).toBeCloseTo(18.044, 0);
      expect(xyz.y).toBeCloseTo(7.217, 0);
      expect(xyz.z).toBeCloseTo(95.030, 0);
    });

    it('should handle mid-range RGB values', () => {
      const xyz = ColorConverter.rgbToXYZ({ r: 128, g: 128, b: 128 });
      expect(xyz.x).toBeGreaterThan(0);
      expect(xyz.y).toBeGreaterThan(0);
      expect(xyz.z).toBeGreaterThan(0);
    });
  });

  describe('XYZ to RGB conversion', () => {
    it('should convert XYZ black to RGB', () => {
      const rgb = ColorConverter.xyzToRGB({ x: 0, y: 0, z: 0 });
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should convert XYZ white to RGB', () => {
      const rgb = ColorConverter.xyzToRGB({ x: 95.047, y: 100, z: 108.883 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });

    it('should handle out-of-gamut values by clamping', () => {
      const rgb = ColorConverter.xyzToRGB({ x: 200, y: 200, z: 200 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });

    it('should handle negative XYZ values', () => {
      const rgb = ColorConverter.xyzToRGB({ x: -10, y: -10, z: -10 });
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });
  });

  describe('XYZ to LAB conversion', () => {
    it('should convert XYZ black to LAB', () => {
      const lab = ColorConverter.xyzToLAB({ x: 0, y: 0, z: 0 });
      expect(lab.l).toBe(0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('should convert XYZ white to LAB', () => {
      const lab = ColorConverter.xyzToLAB({ x: 95.047, y: 100, z: 108.883 });
      expect(lab.l).toBe(100);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('should convert XYZ mid-gray to LAB', () => {
      const lab = ColorConverter.xyzToLAB({ x: 20.517, y: 21.586, z: 23.507 });
      expect(lab.l).toBeGreaterThan(0);
      expect(lab.l).toBeLessThan(100);
    });
  });

  describe('LAB to XYZ conversion', () => {
    it('should convert LAB black to XYZ', () => {
      const xyz = ColorConverter.labToXYZ({ l: 0, a: 0, b: 0 });
      expect(xyz.x).toBeCloseTo(0, 0);
      expect(xyz.y).toBeCloseTo(0, 0);
      expect(xyz.z).toBeCloseTo(0, 0);
    });

    it('should convert LAB white to XYZ', () => {
      const xyz = ColorConverter.labToXYZ({ l: 100, a: 0, b: 0 });
      expect(xyz.x).toBeCloseTo(95.047, 0);
      expect(xyz.y).toBeCloseTo(100, 0);
      expect(xyz.z).toBeCloseTo(108.883, 0);
    });

    it('should handle LAB values with positive a and b', () => {
      const xyz = ColorConverter.labToXYZ({ l: 50, a: 50, b: 50 });
      expect(xyz.x).toBeGreaterThan(0);
      expect(xyz.y).toBeGreaterThan(0);
      expect(xyz.z).toBeGreaterThan(0);
    });

    it('should handle LAB values with negative a and b', () => {
      const xyz = ColorConverter.labToXYZ({ l: 50, a: -50, b: -50 });
      expect(xyz.x).toBeGreaterThan(0);
      expect(xyz.y).toBeGreaterThan(0);
      expect(xyz.z).toBeGreaterThan(0);
    });
  });

  describe('RGB to LAB conversion', () => {
    it('should convert RGB black to LAB', () => {
      const lab = ColorConverter.rgbToLAB({ r: 0, g: 0, b: 0 });
      expect(lab.l).toBe(0);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('should convert RGB white to LAB', () => {
      const lab = ColorConverter.rgbToLAB({ r: 255, g: 255, b: 255 });
      expect(lab.l).toBe(100);
      expect(lab.a).toBeCloseTo(0, 0);
      expect(lab.b).toBeCloseTo(0, 0);
    });

    it('should convert RGB red to LAB', () => {
      const lab = ColorConverter.rgbToLAB({ r: 255, g: 0, b: 0 });
      expect(lab.l).toBeCloseTo(53.24, 0);
      expect(lab.a).toBeCloseTo(80.09, 0);
      expect(lab.b).toBeCloseTo(67.20, 0);
    });

    it('should convert RGB green to LAB', () => {
      const lab = ColorConverter.rgbToLAB({ r: 0, g: 255, b: 0 });
      expect(lab.l).toBeCloseTo(87.73, 0);
      expect(lab.a).toBeCloseTo(-86.18, 0);
      expect(lab.b).toBeCloseTo(83.18, 0);
    });

    it('should convert RGB blue to LAB', () => {
      const lab = ColorConverter.rgbToLAB({ r: 0, g: 0, b: 255 });
      expect(lab.l).toBeCloseTo(32.30, 0);
      expect(lab.a).toBeCloseTo(79.19, 0);
      expect(lab.b).toBeCloseTo(-107.86, 0);
    });
  });

  describe('LAB to RGB conversion', () => {
    it('should convert LAB black to RGB', () => {
      const rgb = ColorConverter.labToRGB({ l: 0, a: 0, b: 0 });
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should convert LAB white to RGB', () => {
      const rgb = ColorConverter.labToRGB({ l: 100, a: 0, b: 0 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(255);
      expect(rgb.b).toBe(255);
    });

    it('should handle LAB values that are out of RGB gamut', () => {
      const rgb = ColorConverter.labToRGB({ l: 50, a: 100, b: 100 });
      // Values should be clamped to 0-255
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    });
  });

  describe('parseLABString', () => {
    it('should parse LAB strings correctly', () => {
      expect(ColorConverter.parseLABString('lab(50%, 25, -50)')).toEqual({ l: 50, a: 25, b: -50 });
      expect(ColorConverter.parseLABString('LAB(75%, -10.5, 30.2)')).toEqual({ l: 75, a: -10.5, b: 30.2 });
      expect(ColorConverter.parseLABString('lab(100, 0, 0)')).toEqual({ l: 100, a: 0, b: 0 });
    });

    it('should throw error for L value out of range', () => {
      expect(() => ColorConverter.parseLABString('lab(101%, 0, 0)')).toThrow('LAB L* value must be between 0 and 100');
      expect(() => ColorConverter.parseLABString('lab(-1%, 0, 0)')).toThrow('LAB L* value must be between 0 and 100');
    });

    it('should throw error for extreme a/b values', () => {
      expect(() => ColorConverter.parseLABString('lab(50%, 129, 0)')).toThrow('LAB a* and b* values typically range from -128 to 127');
      expect(() => ColorConverter.parseLABString('lab(50%, 0, -129)')).toThrow('LAB a* and b* values typically range from -128 to 127');
    });

    it('should return null for invalid format', () => {
      expect(ColorConverter.parseLABString('invalid')).toBe(null);
      expect(ColorConverter.parseLABString('lab(50)')).toBe(null);
    });
  });

  describe('parseXYZString', () => {
    it('should parse XYZ strings correctly', () => {
      expect(ColorConverter.parseXYZString('xyz(41.24, 21.26, 1.93)')).toEqual({ x: 41.24, y: 21.26, z: 1.93 });
      expect(ColorConverter.parseXYZString('XYZ(95.047, 100, 108.883)')).toEqual({ x: 95.047, y: 100, z: 108.883 });
      expect(ColorConverter.parseXYZString('xyz(0, 0, 0)')).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should throw error for negative XYZ values', () => {
      expect(() => ColorConverter.parseXYZString('xyz(-1, 0, 0)')).toThrow('XYZ values must be non-negative');
      expect(() => ColorConverter.parseXYZString('xyz(0, -1, 0)')).toThrow('XYZ values must be non-negative');
      expect(() => ColorConverter.parseXYZString('xyz(0, 0, -1)')).toThrow('XYZ values must be non-negative');
    });

    it('should return null for invalid format', () => {
      expect(ColorConverter.parseXYZString('invalid')).toBe(null);
      expect(ColorConverter.parseXYZString('xyz(50)')).toBe(null);
    });
  });

  describe('formatLAB', () => {
    it('should format LAB values correctly', () => {
      expect(ColorConverter.formatLAB({ l: 50, a: 25, b: -50 })).toBe('lab(50%, 25, -50)');
      expect(ColorConverter.formatLAB({ l: 0, a: 0, b: 0 })).toBe('lab(0%, 0, 0)');
      expect(ColorConverter.formatLAB({ l: 100, a: -10.5, b: 30.2 })).toBe('lab(100%, -10.5, 30.2)');
    });
  });

  describe('formatXYZ', () => {
    it('should format XYZ values correctly', () => {
      expect(ColorConverter.formatXYZ({ x: 41.24, y: 21.26, z: 1.93 })).toBe('xyz(41.24, 21.26, 1.93)');
      expect(ColorConverter.formatXYZ({ x: 0, y: 0, z: 0 })).toBe('xyz(0, 0, 0)');
      expect(ColorConverter.formatXYZ({ x: 95.047, y: 100, z: 108.883 })).toBe('xyz(95.047, 100, 108.883)');
    });
  });

  describe('parseToRGB with LAB/XYZ', () => {
    it('should parse LAB string to RGB', () => {
      const rgb = ColorConverter.parseToRGB('lab(50%, 0, 0)');
      expect(rgb).toBeDefined();
      expect(rgb?.r).toBeGreaterThanOrEqual(0);
      expect(rgb?.r).toBeLessThanOrEqual(255);
    });

    it('should parse XYZ string to RGB', () => {
      const rgb = ColorConverter.parseToRGB('xyz(50, 50, 50)');
      expect(rgb).toBeDefined();
      expect(rgb?.r).toBeGreaterThanOrEqual(0);
      expect(rgb?.r).toBeLessThanOrEqual(255);
    });
  });

  describe('Round-trip conversions', () => {
    it('should maintain color accuracy through RGB -> XYZ -> LAB -> XYZ -> RGB', () => {
      const originalRGB = { r: 128, g: 64, b: 192 };
      
      // Forward conversion
      const xyz1 = ColorConverter.rgbToXYZ(originalRGB);
      const lab = ColorConverter.xyzToLAB(xyz1);
      
      // Reverse conversion
      const xyz2 = ColorConverter.labToXYZ(lab);
      const finalRGB = ColorConverter.xyzToRGB(xyz2);
      
      // Allow small rounding errors
      expect(finalRGB.r).toBeCloseTo(originalRGB.r, -1);
      expect(finalRGB.g).toBeCloseTo(originalRGB.g, -1);
      expect(finalRGB.b).toBeCloseTo(originalRGB.b, -1);
    });

    it('should maintain color accuracy through RGB -> LAB -> RGB', () => {
      const originalRGB = { r: 200, g: 100, b: 50 };
      
      const lab = ColorConverter.rgbToLAB(originalRGB);
      const finalRGB = ColorConverter.labToRGB(lab);
      
      // Allow small rounding errors
      expect(finalRGB.r).toBeCloseTo(originalRGB.r, -1);
      expect(finalRGB.g).toBeCloseTo(originalRGB.g, -1);
      expect(finalRGB.b).toBeCloseTo(originalRGB.b, -1);
    });
  });
});