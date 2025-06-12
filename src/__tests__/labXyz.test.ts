import { describe, it, expect } from 'bun:test';
import { ColorConverter } from '../colorConverter.js';

describe('LAB and XYZ Color Space Support', () => {
  describe('Format Detection', () => {
    it('should detect LAB format', () => {
      expect(ColorConverter.detectFormat('lab(50%, 25, -50)')).toBe('lab');
      expect(ColorConverter.detectFormat('LAB(75%, -20.5, 30.2)')).toBe('lab');
      expect(ColorConverter.detectFormat('lab(100, 0, 0)')).toBe('lab');
    });

    it('should detect XYZ format', () => {
      expect(ColorConverter.detectFormat('xyz(41.24, 21.26, 1.93)')).toBe('xyz');
      expect(ColorConverter.detectFormat('XYZ(50.5, 60.3, 70.1)')).toBe('xyz');
      expect(ColorConverter.detectFormat('xyz(0, 0, 0)')).toBe('xyz');
    });

    it('should return null for invalid formats', () => {
      expect(ColorConverter.detectFormat('lab(50)')).toBe(null);
      expect(ColorConverter.detectFormat('xyz(a, b, c)')).toBe(null);
      expect(ColorConverter.detectFormat('lab 50 25 -50')).toBe(null);
    });
  });

  describe('RGB to XYZ Conversion', () => {
    it('should convert pure colors correctly', () => {
      // Red
      const redXyz = ColorConverter.rgbToXYZ({ r: 255, g: 0, b: 0 });
      expect(redXyz.x).toBeCloseTo(41.246, 1);
      expect(redXyz.y).toBeCloseTo(21.267, 1);
      expect(redXyz.z).toBeCloseTo(1.933, 1);

      // Green
      const greenXyz = ColorConverter.rgbToXYZ({ r: 0, g: 255, b: 0 });
      expect(greenXyz.x).toBeCloseTo(35.758, 1);
      expect(greenXyz.y).toBeCloseTo(71.515, 1);
      expect(greenXyz.z).toBeCloseTo(11.919, 1);

      // Blue
      const blueXyz = ColorConverter.rgbToXYZ({ r: 0, g: 0, b: 255 });
      expect(blueXyz.x).toBeCloseTo(18.045, 1);
      expect(blueXyz.y).toBeCloseTo(7.218, 1);
      expect(blueXyz.z).toBeCloseTo(95.03, 1);

      // White
      const whiteXyz = ColorConverter.rgbToXYZ({ r: 255, g: 255, b: 255 });
      expect(whiteXyz.x).toBeCloseTo(95.047, 1);
      expect(whiteXyz.y).toBeCloseTo(100.0, 1);
      expect(whiteXyz.z).toBeCloseTo(108.883, 1);

      // Black
      const blackXyz = ColorConverter.rgbToXYZ({ r: 0, g: 0, b: 0 });
      expect(blackXyz.x).toBe(0);
      expect(blackXyz.y).toBe(0);
      expect(blackXyz.z).toBe(0);
    });

    it('should convert mid-range colors correctly', () => {
      const grayXyz = ColorConverter.rgbToXYZ({ r: 128, g: 128, b: 128 });
      expect(grayXyz.x).toBeCloseTo(20.518, 1);
      expect(grayXyz.y).toBeCloseTo(21.586, 1);
      expect(grayXyz.z).toBeCloseTo(23.507, 1);
    });
  });

  describe('XYZ to RGB Conversion', () => {
    it('should convert back to RGB correctly', () => {
      // Test round-trip conversion
      const colors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 255, g: 255, b: 255 },
        { r: 0, g: 0, b: 0 },
        { r: 128, g: 128, b: 128 },
        { r: 255, g: 128, b: 64 }
      ];

      for (const color of colors) {
        const xyz = ColorConverter.rgbToXYZ(color);
        const rgb = ColorConverter.xyzToRGB(xyz);
        expect(rgb.r).toBeCloseTo(color.r, 0);
        expect(rgb.g).toBeCloseTo(color.g, 0);
        expect(rgb.b).toBeCloseTo(color.b, 0);
      }
    });

    it('should clamp out-of-gamut values', () => {
      // Test with values that might produce out-of-gamut RGB
      const xyz = { x: 100, y: 100, z: 100 };
      const rgb = ColorConverter.xyzToRGB(xyz);
      
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    });
  });

  describe('XYZ to LAB Conversion', () => {
    it('should convert XYZ to LAB correctly', () => {
      // White
      const whiteLab = ColorConverter.xyzToLAB({ x: 95.047, y: 100.0, z: 108.883 });
      expect(whiteLab.l).toBeCloseTo(100, 1);
      expect(whiteLab.a).toBeCloseTo(0, 1);
      expect(whiteLab.b).toBeCloseTo(0, 1);

      // Black
      const blackLab = ColorConverter.xyzToLAB({ x: 0, y: 0, z: 0 });
      expect(blackLab.l).toBeCloseTo(0, 1);
      expect(blackLab.a).toBeCloseTo(0, 1);
      expect(blackLab.b).toBeCloseTo(0, 1);

      // Red
      const redXyz = ColorConverter.rgbToXYZ({ r: 255, g: 0, b: 0 });
      const redLab = ColorConverter.xyzToLAB(redXyz);
      expect(redLab.l).toBeCloseTo(53.24, 1);
      expect(redLab.a).toBeCloseTo(80.09, 1);
      expect(redLab.b).toBeCloseTo(67.2, 1);
    });
  });

  describe('LAB to XYZ Conversion', () => {
    it('should convert LAB to XYZ correctly', () => {
      // Test round-trip conversion
      const labs = [
        { l: 100, a: 0, b: 0 },      // White
        { l: 0, a: 0, b: 0 },        // Black
        { l: 53.24, a: 80.09, b: 67.2 },  // Red
        { l: 87.74, a: -86.18, b: 83.18 }, // Green
        { l: 32.3, a: 79.2, b: -107.86 }   // Blue
      ];

      for (const lab of labs) {
        const xyz = ColorConverter.labToXYZ(lab);
        const labBack = ColorConverter.xyzToLAB(xyz);
        expect(labBack.l).toBeCloseTo(lab.l, 1);
        expect(labBack.a).toBeCloseTo(lab.a, 1);
        expect(labBack.b).toBeCloseTo(lab.b, 1);
      }
    });
  });

  describe('RGB to LAB Conversion', () => {
    it('should convert RGB to LAB correctly', () => {
      // Test known color values
      const redLab = ColorConverter.rgbToLAB({ r: 255, g: 0, b: 0 });
      expect(redLab.l).toBeCloseTo(53.24, 1);
      expect(redLab.a).toBeCloseTo(80.09, 1);
      expect(redLab.b).toBeCloseTo(67.2, 1);

      const greenLab = ColorConverter.rgbToLAB({ r: 0, g: 255, b: 0 });
      expect(greenLab.l).toBeCloseTo(87.74, 1);
      expect(greenLab.a).toBeCloseTo(-86.18, 1);
      expect(greenLab.b).toBeCloseTo(83.18, 1);

      const blueLab = ColorConverter.rgbToLAB({ r: 0, g: 0, b: 255 });
      expect(blueLab.l).toBeCloseTo(32.3, 1);
      expect(blueLab.a).toBeCloseTo(79.2, 1);
      expect(blueLab.b).toBeCloseTo(-107.86, 1);
    });
  });

  describe('LAB to RGB Conversion', () => {
    it('should convert LAB to RGB correctly', () => {
      // Test round-trip conversion
      const colors = [
        { r: 255, g: 0, b: 0 },
        { r: 0, g: 255, b: 0 },
        { r: 0, g: 0, b: 255 },
        { r: 255, g: 255, b: 255 },
        { r: 0, g: 0, b: 0 },
        { r: 128, g: 128, b: 128 }
      ];

      for (const color of colors) {
        const lab = ColorConverter.rgbToLAB(color);
        const rgb = ColorConverter.labToRGB(lab);
        expect(rgb.r).toBeCloseTo(color.r, 0);
        expect(rgb.g).toBeCloseTo(color.g, 0);
        expect(rgb.b).toBeCloseTo(color.b, 0);
      }
    });
  });

  describe('Parse LAB String', () => {
    it('should parse valid LAB strings', () => {
      const lab1 = ColorConverter.parseLABString('lab(50%, 25, -50)');
      expect(lab1).toEqual({ l: 50, a: 25, b: -50 });

      const lab2 = ColorConverter.parseLABString('LAB(75.5%, -20.3, 30.7)');
      expect(lab2).toEqual({ l: 75.5, a: -20.3, b: 30.7 });

      const lab3 = ColorConverter.parseLABString('lab(100, 0, 0)');
      expect(lab3).toEqual({ l: 100, a: 0, b: 0 });
    });

    it('should throw error for invalid LAB values', () => {
      expect(() => ColorConverter.parseLABString('lab(150%, 0, 0)')).toThrow('LAB L* must be between 0 and 100');
      expect(() => ColorConverter.parseLABString('lab(-10%, 0, 0)')).toThrow('LAB L* must be between 0 and 100');
      expect(() => ColorConverter.parseLABString('lab(50%, 200, 0)')).toThrow('LAB a* must be between -128 and 128');
    });

    it('should return null for invalid format', () => {
      expect(ColorConverter.parseLABString('lab(50)')).toBe(null);
      expect(ColorConverter.parseLABString('50%, 25, -50')).toBe(null);
    });
  });

  describe('Parse XYZ String', () => {
    it('should parse valid XYZ strings', () => {
      const xyz1 = ColorConverter.parseXYZString('xyz(41.24, 21.26, 1.93)');
      expect(xyz1).toEqual({ x: 41.24, y: 21.26, z: 1.93 });

      const xyz2 = ColorConverter.parseXYZString('XYZ(95.047, 100.0, 108.883)');
      expect(xyz2).toEqual({ x: 95.047, y: 100.0, z: 108.883 });

      const xyz3 = ColorConverter.parseXYZString('xyz(0, 0, 0)');
      expect(xyz3).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should throw error for negative XYZ values', () => {
      expect(() => ColorConverter.parseXYZString('xyz(-10, 50, 50)')).toThrow('XYZ values must be non-negative');
      expect(() => ColorConverter.parseXYZString('xyz(50, -10, 50)')).toThrow('XYZ values must be non-negative');
      expect(() => ColorConverter.parseXYZString('xyz(50, 50, -10)')).toThrow('XYZ values must be non-negative');
    });

    it('should return null for invalid format', () => {
      expect(ColorConverter.parseXYZString('xyz(41.24, 21.26)')).toBe(null);
      expect(ColorConverter.parseXYZString('41.24, 21.26, 1.93')).toBe(null);
    });
  });

  describe('Format LAB and XYZ', () => {
    it('should format LAB correctly', () => {
      expect(ColorConverter.formatLAB({ l: 50, a: 25, b: -50 })).toBe('lab(50%, 25, -50)');
      expect(ColorConverter.formatLAB({ l: 75.5, a: -20.3, b: 30.7 })).toBe('lab(75.5%, -20.3, 30.7)');
      expect(ColorConverter.formatLAB({ l: 100, a: 0, b: 0 })).toBe('lab(100%, 0, 0)');
    });

    it('should format XYZ correctly', () => {
      expect(ColorConverter.formatXYZ({ x: 41.24, y: 21.26, z: 1.93 })).toBe('xyz(41.24, 21.26, 1.93)');
      expect(ColorConverter.formatXYZ({ x: 95.047, y: 100, z: 108.883 })).toBe('xyz(95.047, 100, 108.883)');
      expect(ColorConverter.formatXYZ({ x: 0, y: 0, z: 0 })).toBe('xyz(0, 0, 0)');
    });
  });

  describe('Convert Method with LAB and XYZ', () => {
    it('should convert from LAB format', () => {
      const result = ColorConverter.convert('lab(53.24%, 80.09, 67.2)');
      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
      expect(result.lab).toBe('lab(53.24%, 80.09, 67.21)');
    });

    it('should convert from XYZ format', () => {
      const result = ColorConverter.convert('xyz(41.246, 21.267, 1.933)');
      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
    });

    it('should include LAB and XYZ in output when requested', () => {
      const result = ColorConverter.convert('#ff0000', undefined, ['lab', 'xyz']);
      expect(result.lab).toBeDefined();
      expect(result.xyz).toBeDefined();
      expect(result.rawValues?.lab).toBeDefined();
      expect(result.rawValues?.xyz).toBeDefined();
    });

    it('should include LAB and XYZ in default output', () => {
      const result = ColorConverter.convert('#ff0000');
      expect(result.lab).toBeDefined();
      expect(result.xyz).toBeDefined();
    });
  });

  describe('parseToRGB with LAB and XYZ', () => {
    it('should parse LAB input to RGB', () => {
      const rgb = ColorConverter.parseToRGB('lab(53.24%, 80.09, 67.2)');
      expect(rgb).toBeDefined();
      expect((rgb as any).r).toBeCloseTo(255, 0);
      expect((rgb as any).g).toBeCloseTo(0, 0);
      expect((rgb as any).b).toBeCloseTo(0, 0);
    });

    it('should parse XYZ input to RGB', () => {
      const rgb = ColorConverter.parseToRGB('xyz(41.246, 21.267, 1.933)');
      expect(rgb).toBeDefined();
      expect((rgb as any).r).toBeCloseTo(255, 0);
      expect((rgb as any).g).toBeCloseTo(0, 0);
      expect((rgb as any).b).toBeCloseTo(0, 0);
    });
  });
});