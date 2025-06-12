/**
 * Optimized ColorConverter with improved performance and modular architecture
 */

import type { RGB, RGBA, HSL, HSLA, HSB, CMYK, LAB, XYZ, ColorFormat, ConversionResult, BlendMode, MixResult } from '../../types.js';
import { NAMED_COLORS_MAP_INTERNAL } from '../../namedColors.js';
import { conversionCache } from '../cache/AdvancedCache.js';
import { performanceMonitor, measureTime } from '../monitoring/PerformanceMonitor.js';
import { ColorErrorFactory, safeExecute } from '../errors/ColorError.js';
import { OptimizedMath, COLOR_MATRICES, D65_WHITE, COMMON_COLORS } from '../math/OptimizedMath.js';

// Input parsing and validation
class InputParser {
  private static readonly FORMAT_PATTERNS = {
    hex: /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
    rgba: /^rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i,
    rgb: /^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/,
    rgbSimple: /^\d+\s*,\s*\d+\s*,\s*\d+$/,
    hsla: /^hsla\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*[\d.]+\s*\)$/i,
    hsl: /^hsl\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i,
    hsb: /^(hsb|hsv)\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i,
    cmyk: /^cmyk\s*\(\s*\d+%?\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i,
    lab: /^lab\s*\(\s*[\d.]+%?\s*,\s*-?[\d.]+\s*,\s*-?[\d.]+\s*\)$/i,
    xyz: /^xyz\s*\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*\)$/i
  };

  static detectFormat(input: string): ColorFormat | null {
    const trimmed = input.trim().toLowerCase();
    
    // Check named colors first (fast Map lookup)
    if (NAMED_COLORS_MAP_INTERNAL.has(trimmed)) {
      return 'hex'; // Named colors are converted to hex
    }

    // Check common colors cache
    if (COMMON_COLORS.has(trimmed)) {
      return 'hex';
    }

    // Pattern matching for other formats
    for (const [format, pattern] of Object.entries(this.FORMAT_PATTERNS)) {
      if (pattern.test(trimmed)) {
        return format as ColorFormat;
      }
    }

    return null;
  }

  static parseToRGB(input: string, hint?: ColorFormat): RGB | RGBA | null {
    const trimmed = input.trim();
    const detectedFormat = hint ?? this.detectFormat(trimmed);

    if (!detectedFormat) {
      return null;
    }

    const result = safeExecute(() => {
      switch (detectedFormat) {
        case 'hex':
          return this.parseHex(trimmed);
        case 'rgb':
          return this.parseRGB(trimmed);
        case 'rgba':
          return this.parseRGBA(trimmed);
        case 'hsl':
          return ColorSpaceConverter.hslToRGB(this.parseHSL(trimmed));
        case 'hsla':
          return ColorSpaceConverter.hslaToRGBA(this.parseHSLA(trimmed));
        case 'hsb':
        case 'hsv':
          return ColorSpaceConverter.hsbToRGB(this.parseHSB(trimmed));
        case 'cmyk':
          return ColorSpaceConverter.cmykToRGB(this.parseCMYK(trimmed));
        case 'lab':
          return ColorSpaceConverter.labToRGB(this.parseLAB(trimmed));
        case 'xyz':
          return ColorSpaceConverter.xyzToRGB(this.parseXYZ(trimmed));
        default:
          throw ColorErrorFactory.unsupportedFormat(detectedFormat, ['hex', 'rgb', 'hsl', 'hsb', 'cmyk']);
      }
    });
    
    return result ?? null;
  }

  private static parseHex(hex: string): RGB | RGBA {
    const normalizedHex = hex.replace('#', '').toLowerCase();
    
    // Check common colors cache first
    const common = COMMON_COLORS.get('#' + normalizedHex);
    if (common) {
      return common;
    }

    // Check named colors
    const namedColor = NAMED_COLORS_MAP_INTERNAL.get(hex.toLowerCase());
    if (namedColor) {
      return this.parseHex(namedColor);
    }

    let r: number, g: number, b: number, a = 1;

    switch (normalizedHex.length) {
      case 3: // #RGB
        r = parseInt(normalizedHex[0] + normalizedHex[0], 16);
        g = parseInt(normalizedHex[1] + normalizedHex[1], 16);
        b = parseInt(normalizedHex[2] + normalizedHex[2], 16);
        break;
      case 4: // #RGBA
        r = parseInt(normalizedHex[0] + normalizedHex[0], 16);
        g = parseInt(normalizedHex[1] + normalizedHex[1], 16);
        b = parseInt(normalizedHex[2] + normalizedHex[2], 16);
        a = parseInt(normalizedHex[3] + normalizedHex[3], 16) / 255;
        break;
      case 6: // #RRGGBB
        r = parseInt(normalizedHex.substr(0, 2), 16);
        g = parseInt(normalizedHex.substr(2, 2), 16);
        b = parseInt(normalizedHex.substr(4, 2), 16);
        break;
      case 8: // #RRGGBBAA
        r = parseInt(normalizedHex.substr(0, 2), 16);
        g = parseInt(normalizedHex.substr(2, 2), 16);
        b = parseInt(normalizedHex.substr(4, 2), 16);
        a = parseInt(normalizedHex.substr(6, 2), 16) / 255;
        break;
      default:
        throw ColorErrorFactory.invalidColorValue(hex, 'hex', 'Invalid length');
    }

    this.validateRGBValues(r, g, b);
    return a < 1 ? { r, g, b, a } : { r, g, b };
  }

  private static parseRGB(rgb: string): RGB {
    const match = rgb.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i) ??
                  rgb.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(rgb, 'rgb');
    }

    const [, r, g, b] = match;
    const values = [parseInt(r), parseInt(g), parseInt(b)];
    
    this.validateRGBValues(values[0], values[1], values[2]);
    return { r: values[0], g: values[1], b: values[2] };
  }

  private static parseRGBA(rgba: string): RGBA {
    const match = rgba.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(rgba, 'rgba');
    }

    const [, r, g, b, a] = match;
    const rgbValues = [parseInt(r), parseInt(g), parseInt(b)];
    const alphaValue = parseFloat(a);
    
    this.validateRGBValues(rgbValues[0], rgbValues[1], rgbValues[2]);
    this.validateAlpha(alphaValue);
    
    return { r: rgbValues[0], g: rgbValues[1], b: rgbValues[2], a: alphaValue };
  }

  private static parseHSL(hsl: string): HSL {
    const match = hsl.match(/hsl\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(hsl, 'hsl');
    }

    const [, h, s, l] = match;
    const values = [parseInt(h), parseInt(s), parseInt(l)];
    
    this.validateHSLValues(values[0], values[1], values[2]);
    return { h: values[0], s: values[1], l: values[2] };
  }

  private static parseHSLA(hsla: string): HSLA {
    const match = hsla.match(/hsla\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*([\d.]+)\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(hsla, 'hsla');
    }

    const [, h, s, l, a] = match;
    const hslValues = [parseInt(h), parseInt(s), parseInt(l)];
    const alphaValue = parseFloat(a);
    
    this.validateHSLValues(hslValues[0], hslValues[1], hslValues[2]);
    this.validateAlpha(alphaValue);
    
    return { h: hslValues[0], s: hslValues[1], l: hslValues[2], a: alphaValue };
  }

  private static parseHSB(hsb: string): HSB {
    const match = hsb.match(/(hsb|hsv)\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(hsb, 'hsb');
    }

    const [, , h, s, b] = match;
    const values = [parseInt(h), parseInt(s), parseInt(b)];
    
    this.validateHSBValues(values[0], values[1], values[2]);
    return { h: values[0], s: values[1], b: values[2] };
  }

  private static parseCMYK(cmyk: string): CMYK {
    const match = cmyk.match(/cmyk\s*\(\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(cmyk, 'cmyk');
    }

    const [, c, m, y, k] = match;
    const values = [parseInt(c), parseInt(m), parseInt(y), parseInt(k)];
    
    this.validateCMYKValues(values[0], values[1], values[2], values[3]);
    return { c: values[0], m: values[1], y: values[2], k: values[3] };
  }

  private static parseLAB(lab: string): LAB {
    const match = lab.match(/lab\s*\(\s*([\d.]+)%?\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(lab, 'lab');
    }

    const [, l, a, b] = match;
    const values = [parseFloat(l), parseFloat(a), parseFloat(b)];
    
    return { l: values[0], a: values[1], b: values[2] };
  }

  private static parseXYZ(xyz: string): XYZ {
    const match = xyz.match(/xyz\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*\)/i);
    
    if (!match) {
      throw ColorErrorFactory.invalidColorValue(xyz, 'xyz');
    }

    const [, x, y, z] = match;
    const values = [parseFloat(x), parseFloat(y), parseFloat(z)];
    
    return { x: values[0], y: values[1], z: values[2] };
  }

  // Validation methods
  private static validateRGBValues(r: number, g: number, b: number): void {
    if (r < 0 || r > 255) {throw ColorErrorFactory.outOfRange(r, 0, 255, 'red');}
    if (g < 0 || g > 255) {throw ColorErrorFactory.outOfRange(g, 0, 255, 'green');}
    if (b < 0 || b > 255) {throw ColorErrorFactory.outOfRange(b, 0, 255, 'blue');}
  }

  private static validateHSLValues(h: number, s: number, l: number): void {
    if (h < 0 || h > 360) {throw ColorErrorFactory.outOfRange(h, 0, 360, 'hue');}
    if (s < 0 || s > 100) {throw ColorErrorFactory.outOfRange(s, 0, 100, 'saturation');}
    if (l < 0 || l > 100) {throw ColorErrorFactory.outOfRange(l, 0, 100, 'lightness');}
  }

  private static validateHSBValues(h: number, s: number, b: number): void {
    if (h < 0 || h > 360) {throw ColorErrorFactory.outOfRange(h, 0, 360, 'hue');}
    if (s < 0 || s > 100) {throw ColorErrorFactory.outOfRange(s, 0, 100, 'saturation');}
    if (b < 0 || b > 100) {throw ColorErrorFactory.outOfRange(b, 0, 100, 'brightness');}
  }

  private static validateCMYKValues(c: number, m: number, y: number, k: number): void {
    if (c < 0 || c > 100) {throw ColorErrorFactory.outOfRange(c, 0, 100, 'cyan');}
    if (m < 0 || m > 100) {throw ColorErrorFactory.outOfRange(m, 0, 100, 'magenta');}
    if (y < 0 || y > 100) {throw ColorErrorFactory.outOfRange(y, 0, 100, 'yellow');}
    if (k < 0 || k > 100) {throw ColorErrorFactory.outOfRange(k, 0, 100, 'black');}
  }

  private static validateAlpha(alpha: number): void {
    if (alpha < 0 || alpha > 1) {throw ColorErrorFactory.outOfRange(alpha, 0, 1, 'alpha');}
  }
}

// Color space conversion algorithms
class ColorSpaceConverter {
  // RGB ↔ HSL conversions
  static rgbToHSL(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = OptimizedMath.calculateLightness(max, min);
    
    if (max === min) {
      return { h: 0, s: 0, l: Math.round(l * 100) };
    }

    const h = OptimizedMath.calculateHue(r, g, b);
    const s = OptimizedMath.calculateSaturation(max, min, l);

    return {
      h: Math.round(h),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  static hslToRGB(hsl: HSL): RGB {
    const h = hsl.h;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    if (s === 0) {
      const gray = OptimizedMath.clamp255(l * 255);
      return { r: gray, g: gray, b: gray };
    }

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r: number, g: number, b: number;

    if (h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    return {
      r: OptimizedMath.clamp255((r + m) * 255),
      g: OptimizedMath.clamp255((g + m) * 255),
      b: OptimizedMath.clamp255((b + m) * 255)
    };
  }

  static hslaToRGBA(hsla: HSLA): RGBA {
    const rgb = this.hslToRGB(hsla);
    return { ...rgb, a: hsla.a };
  }

  // RGB ↔ HSB conversions
  static rgbToHSB(rgb: RGB): HSB {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    const h = delta === 0 ? 0 : OptimizedMath.calculateHue(r, g, b);
    const s = max === 0 ? 0 : (delta / max) * 100;
    const brightness = max * 100;

    return {
      h: Math.round(h),
      s: Math.round(s),
      b: Math.round(brightness)
    };
  }

  static hsbToRGB(hsb: HSB): RGB {
    const h = hsb.h;
    const s = hsb.s / 100;
    const v = hsb.b / 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;

    let r: number, g: number, b: number;

    if (h < 60) {
      [r, g, b] = [c, x, 0];
    } else if (h < 120) {
      [r, g, b] = [x, c, 0];
    } else if (h < 180) {
      [r, g, b] = [0, c, x];
    } else if (h < 240) {
      [r, g, b] = [0, x, c];
    } else if (h < 300) {
      [r, g, b] = [x, 0, c];
    } else {
      [r, g, b] = [c, 0, x];
    }

    return {
      r: OptimizedMath.clamp255((r + m) * 255),
      g: OptimizedMath.clamp255((g + m) * 255),
      b: OptimizedMath.clamp255((b + m) * 255)
    };
  }

  // RGB ↔ CMYK conversions
  static rgbToCMYK(rgb: RGB): CMYK {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);
    
    if (k === 1) {
      return { c: 0, m: 0, y: 0, k: 100 };
    }

    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  static cmykToRGB(cmyk: CMYK): RGB {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;

    const r = 1 - Math.min(1, c * (1 - k) + k);
    const g = 1 - Math.min(1, m * (1 - k) + k);
    const b = 1 - Math.min(1, y * (1 - k) + k);

    return {
      r: OptimizedMath.clamp255(r * 255),
      g: OptimizedMath.clamp255(g * 255),
      b: OptimizedMath.clamp255(b * 255)
    };
  }

  // RGB ↔ XYZ conversions
  static rgbToXYZ(rgb: RGB): XYZ {
    // Convert to linear RGB
    const r = OptimizedMath.removeGammaCorrection(rgb.r / 255);
    const g = OptimizedMath.removeGammaCorrection(rgb.g / 255);
    const b = OptimizedMath.removeGammaCorrection(rgb.b / 255);

    // Apply transformation matrix
    const [x, y, z] = OptimizedMath.matrixTransform3x3(COLOR_MATRICES.SRGB_TO_XYZ, [r, g, b]);

    return {
      x: x * 100,
      y: y * 100,
      z: z * 100
    };
  }

  static xyzToRGB(xyz: XYZ): RGB {
    // Normalize to 0-1 range
    const x = xyz.x / 100;
    const y = xyz.y / 100;
    const z = xyz.z / 100;

    // Apply transformation matrix
    const [r, g, b] = OptimizedMath.matrixTransform3x3(COLOR_MATRICES.XYZ_TO_SRGB, [x, y, z]);

    // Apply gamma correction
    const rSRGB = OptimizedMath.applyGammaCorrection(r);
    const gSRGB = OptimizedMath.applyGammaCorrection(g);
    const bSRGB = OptimizedMath.applyGammaCorrection(b);

    return {
      r: OptimizedMath.clamp255(rSRGB * 255),
      g: OptimizedMath.clamp255(gSRGB * 255),
      b: OptimizedMath.clamp255(bSRGB * 255)
    };
  }

  // XYZ ↔ LAB conversions
  static xyzToLAB(xyz: XYZ): LAB {
    const xn = xyz.x / D65_WHITE.x;
    const yn = xyz.y / D65_WHITE.y;
    const zn = xyz.z / D65_WHITE.z;

    const fx = OptimizedMath.labFunction(xn);
    const fy = OptimizedMath.labFunction(yn);
    const fz = OptimizedMath.labFunction(zn);

    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);

    return { l, a, b };
  }

  static labToXYZ(lab: LAB): XYZ {
    const fy = (lab.l + 16) / 116;
    const fx = lab.a / 500 + fy;
    const fz = fy - lab.b / 200;

    const xn = OptimizedMath.inverseLabFunction(fx);
    const yn = OptimizedMath.inverseLabFunction(fy);
    const zn = OptimizedMath.inverseLabFunction(fz);

    return {
      x: xn * D65_WHITE.x,
      y: yn * D65_WHITE.y,
      z: zn * D65_WHITE.z
    };
  }

  // Combined RGB ↔ LAB conversions
  static rgbToLAB(rgb: RGB): LAB {
    const xyz = this.rgbToXYZ(rgb);
    return this.xyzToLAB(xyz);
  }

  static labToRGB(lab: LAB): RGB {
    const xyz = this.labToXYZ(lab);
    return this.xyzToRGB(xyz);
  }
}

// Output formatting
class OutputFormatter {
  static formatRGB(rgb: RGB): string {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  static formatRGBA(rgba: RGBA): string {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
  }

  static formatHSL(hsl: HSL): string {
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  }

  static formatHSLA(hsla: HSLA): string {
    return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`;
  }

  static formatHSB(hsb: HSB): string {
    return `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)`;
  }

  static formatCMYK(cmyk: CMYK): string {
    return `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
  }

  static formatLAB(lab: LAB): string {
    return `lab(${lab.l.toFixed(2)}%, ${lab.a.toFixed(2)}, ${lab.b.toFixed(2)})`;
  }

  static formatXYZ(xyz: XYZ): string {
    return `xyz(${xyz.x.toFixed(3)}, ${xyz.y.toFixed(3)}, ${xyz.z.toFixed(3)})`;
  }

  static formatHex(rgb: RGB | RGBA): string {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    
    if ('a' in rgb && rgb.a < 1) {
      const alpha = Math.round(rgb.a * 255);
      return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}${toHex(alpha)}`;
    }
    
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
}

// Main optimized converter class
export class OptimizedColorConverter {
  static convert(input: string, from?: ColorFormat, to?: ColorFormat[]): ConversionResult {
    const { result, duration } = measureTime(() => {
      return this.performConversion(input, from, to);
    });

    // Record performance metrics
    performanceMonitor.recordOperation('convert', duration, {
      inputFormat: from,
      outputFormats: to,
      cacheHit: false // Will be updated by cache logic
    });

    return result;
  }

  private static performConversion(input: string, from?: ColorFormat, to?: ColorFormat[]): ConversionResult {
    // Create cache key
    const targetFormatsKey = to === undefined ? 'all' : to.join(',');
    const cacheKey = `${input}|${from ?? 'auto'}|${targetFormatsKey}`;
    
    // Check cache first
    const cached = conversionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Parse input to RGB/RGBA
    const rgbOrRgba = InputParser.parseToRGB(input, from);
    if (!rgbOrRgba) {
      throw ColorErrorFactory.invalidColorFormat(input, ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'cmyk', 'lab', 'xyz']);
    }

    // Extract RGB and alpha
    const hasAlpha = 'a' in rgbOrRgba;
    const rgb: RGB = { r: rgbOrRgba.r, g: rgbOrRgba.g, b: rgbOrRgba.b };
    const alpha = hasAlpha ? (rgbOrRgba as RGBA).a : undefined;

    // Determine target formats
    const targetFormats = to ?? ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'cmyk', 'lab', 'xyz'] as ColorFormat[];

    // Perform conversions
    const result = this.convertToFormats(rgb, alpha, targetFormats);

    // Cache the result
    conversionCache.set(cacheKey, result);
    return result;
  }

  private static convertToFormats(rgb: RGB, alpha: number | undefined, formats: ColorFormat[]): ConversionResult {
    const result: ConversionResult = { rawValues: { rgb } };

    for (const format of formats) {
      switch (format) {
        case 'hex':
          if (alpha !== undefined) {
            const rgba: RGBA = { ...rgb, a: alpha };
            result.hex = OutputFormatter.formatHex(rgba);
          } else {
            result.hex = OutputFormatter.formatHex(rgb);
          }
          break;

        case 'rgb':
          result.rgb = OutputFormatter.formatRGB(rgb);
          break;

        case 'rgba':
          if (alpha !== undefined) {
            const rgba: RGBA = { ...rgb, a: alpha };
            result.rgba = OutputFormatter.formatRGBA(rgba);
            if (result.rawValues) {result.rawValues.rgba = rgba;}
          }
          break;

        case 'hsl': {
          const hsl = ColorSpaceConverter.rgbToHSL(rgb);
          result.hsl = OutputFormatter.formatHSL(hsl);
          if (result.rawValues) {result.rawValues.hsl = hsl;}
          break;
        }

        case 'hsla':
          if (alpha !== undefined) {
            const hsl = ColorSpaceConverter.rgbToHSL(rgb);
            const hsla: HSLA = { ...hsl, a: alpha };
            result.hsla = OutputFormatter.formatHSLA(hsla);
            if (result.rawValues) {result.rawValues.hsla = hsla;}
          }
          break;

        case 'hsb':
        case 'hsv': {
          const hsb = ColorSpaceConverter.rgbToHSB(rgb);
          result.hsb = OutputFormatter.formatHSB(hsb);
          result.hsv = result.hsb;
          if (result.rawValues) {result.rawValues.hsb = hsb;}
          break;
        }

        case 'cmyk': {
          const cmyk = ColorSpaceConverter.rgbToCMYK(rgb);
          result.cmyk = OutputFormatter.formatCMYK(cmyk);
          if (result.rawValues) {result.rawValues.cmyk = cmyk;}
          break;
        }

        case 'lab': {
          const lab = ColorSpaceConverter.rgbToLAB(rgb);
          result.lab = OutputFormatter.formatLAB(lab);
          if (result.rawValues) {result.rawValues.lab = lab;}
          break;
        }

        case 'xyz': {
          const xyz = ColorSpaceConverter.rgbToXYZ(rgb);
          result.xyz = OutputFormatter.formatXYZ(xyz);
          if (result.rawValues) {result.rawValues.xyz = xyz;}
          break;
        }
      }
    }

    return result;
  }

  // Batch processing for multiple colors
  static convertBatch(inputs: {input: string, from?: ColorFormat, to?: ColorFormat[]}[]): ConversionResult[] {
    const { result, duration } = measureTime(() => {
      return inputs.map(({ input, from, to }) => this.performConversion(input, from, to));
    });

    performanceMonitor.recordOperation('convertBatch', duration, {
      inputFormat: 'batch',
      outputFormats: ['mixed']
    });

    return result;
  }

  // Direct conversion methods for performance-critical paths
  static rgbToHex = OutputFormatter.formatHex;
  static parseToRGB = InputParser.parseToRGB;
  static detectFormat = InputParser.detectFormat;
  static rgbToHSL = ColorSpaceConverter.rgbToHSL;
  static hslToRGB = ColorSpaceConverter.hslToRGB;
  static rgbToHSB = ColorSpaceConverter.rgbToHSB;
  static hsbToRGB = ColorSpaceConverter.hsbToRGB;
  static rgbToCMYK = ColorSpaceConverter.rgbToCMYK;
  static cmykToRGB = ColorSpaceConverter.cmykToRGB;
  static rgbToXYZ = ColorSpaceConverter.rgbToXYZ;
  static xyzToRGB = ColorSpaceConverter.xyzToRGB;
  static xyzToLAB = ColorSpaceConverter.xyzToLAB;
  static labToXYZ = ColorSpaceConverter.labToXYZ;
  static rgbToLAB = ColorSpaceConverter.rgbToLAB;
  static labToRGB = ColorSpaceConverter.labToRGB;

  // Cache management
  static clearCache(): void {
    conversionCache.clear();
  }

  static getCacheStats() {
    return conversionCache.getStats();
  }

  // Color mixing (simplified for now, can be expanded)
  static mixColors(color1: string, color2: string, ratio = 0.5, mode: BlendMode = 'normal'): MixResult {
    const rgb1 = this.parseToRGB(color1);
    const rgb2 = this.parseToRGB(color2);
    
    if (!rgb1 || !rgb2) {
      throw ColorErrorFactory.conversionFailed('mix', 'mix', 'Invalid input colors');
    }

    let mixedRGB: RGB;
    
    switch (mode) {
      case 'normal':
        mixedRGB = {
          r: Math.round(OptimizedMath.lerp(rgb1.r, rgb2.r, ratio)),
          g: Math.round(OptimizedMath.lerp(rgb1.g, rgb2.g, ratio)),
          b: Math.round(OptimizedMath.lerp(rgb1.b, rgb2.b, ratio))
        };
        break;
      case 'multiply':
        mixedRGB = {
          r: Math.round((rgb1.r / 255) * (rgb2.r / 255) * 255),
          g: Math.round((rgb1.g / 255) * (rgb2.g / 255) * 255),
          b: Math.round((rgb1.b / 255) * (rgb2.b / 255) * 255)
        };
        break;
      case 'screen':
        mixedRGB = {
          r: Math.round(255 - (255 - rgb1.r) * (255 - rgb2.r) / 255),
          g: Math.round(255 - (255 - rgb1.g) * (255 - rgb2.g) / 255),
          b: Math.round(255 - (255 - rgb1.b) * (255 - rgb2.b) / 255)
        };
        break;
      case 'overlay':
        mixedRGB = {
          r: rgb1.r < 128 ? Math.round(2 * rgb1.r * rgb2.r / 255) : Math.round(255 - 2 * (255 - rgb1.r) * (255 - rgb2.r) / 255),
          g: rgb1.g < 128 ? Math.round(2 * rgb1.g * rgb2.g / 255) : Math.round(255 - 2 * (255 - rgb1.g) * (255 - rgb2.g) / 255),
          b: rgb1.b < 128 ? Math.round(2 * rgb1.b * rgb2.b / 255) : Math.round(255 - 2 * (255 - rgb1.b) * (255 - rgb2.b) / 255)
        };
        break;
      default:
        throw ColorErrorFactory.unsupportedFormat(mode, ['normal', 'multiply', 'screen', 'overlay']);
    }

    const result = this.convertToFormats(mixedRGB, undefined, ['hex', 'rgb', 'hsl', 'hsb', 'cmyk']);
    return { ...result, mixRatio: ratio, mode };
  }
}