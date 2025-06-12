import type { RGB, RGBA, HSL, HSLA, HSB, CMYK, LAB, XYZ, ColorFormat, ConversionResult, BlendMode, MixResult } from './types.js';
import { NAMED_COLORS_MAP_INTERNAL } from './namedColors.js';

// Pre-computed constants for performance optimization
const GAMMA_THRESHOLD = 0.04045;
const GAMMA_FACTOR = 1.055;
const GAMMA_OFFSET = 0.055;
const GAMMA_EXPONENT = 2.4;
const GAMMA_LINEAR_FACTOR = 12.92;
const INVERSE_GAMMA_THRESHOLD = 0.0031308;
const INVERSE_GAMMA_EXPONENT = 1 / 2.4;

// sRGB to XYZ transformation matrix (D65 illuminant) - pre-computed for performance
const SRGB_TO_XYZ_MATRIX = {
  r: { x: 0.4124564, y: 0.2126729, z: 0.0193339 },
  g: { x: 0.3575761, y: 0.7151522, z: 0.1191920 },
  b: { x: 0.1804375, y: 0.0721750, z: 0.9503041 }
};

// XYZ to sRGB transformation matrix - pre-computed for performance
const XYZ_TO_SRGB_MATRIX = {
  x: { r: 3.2404542, g: -0.9692660, b: 0.0556434 },
  y: { r: -1.5371385, g: 1.8760108, b: -0.2040259 },
  z: { r: -0.4985314, g: 0.0415560, b: 1.0572252 }
};

// D65 reference white constants for LAB conversion
const D65_WHITE = { x: 95.047, y: 100.000, z: 108.883 };
const LAB_THRESHOLD = 0.008856;
const LAB_FACTOR = 7.787;
const LAB_OFFSET = 16 / 116;
const LAB_CUBE_ROOT_THRESHOLD = LAB_THRESHOLD;

// Pre-compiled regex patterns for format detection (performance optimization)
const FORMAT_PATTERNS = {
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

// Optimized gamma correction functions
function applyGammaCorrection(value: number): number {
  return value > GAMMA_THRESHOLD 
    ? Math.pow((value + GAMMA_OFFSET) / GAMMA_FACTOR, GAMMA_EXPONENT)
    : value / GAMMA_LINEAR_FACTOR;
}

function removeGammaCorrection(value: number): number {
  return value > INVERSE_GAMMA_THRESHOLD 
    ? GAMMA_FACTOR * Math.pow(value, INVERSE_GAMMA_EXPONENT) - GAMMA_OFFSET
    : GAMMA_LINEAR_FACTOR * value;
}

// Optimized LAB conversion functions
function labFunction(t: number): number {
  return t > LAB_CUBE_ROOT_THRESHOLD ? Math.pow(t, 1/3) : (LAB_FACTOR * t + LAB_OFFSET);
}

function inverseLabFunction(t: number): number {
  const cubed = t * t * t;
  return cubed > LAB_CUBE_ROOT_THRESHOLD ? cubed : (t - LAB_OFFSET) / LAB_FACTOR;
}

// Simple LRU cache for conversion results
class ConversionCache {
  private cache = new Map<string, unknown>();
  private maxSize = 100; // Reasonable cache size

  get(key: string): unknown {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: unknown): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest (first) entry
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const conversionCache = new ConversionCache();

export class ColorConverter {
  // Detect color format from input string
  static detectFormat(input: string): ColorFormat | null {
    const trimmed = input.trim().toLowerCase();
    
    // Check for named colors first
    if (NAMED_COLORS_MAP_INTERNAL.has(trimmed)) {
      return 'hex';
    }
    
    // Optimized format detection using pre-compiled patterns
    if (FORMAT_PATTERNS.hex.test(trimmed)) {return 'hex';}
    if (FORMAT_PATTERNS.rgba.test(trimmed)) {return 'rgba';}
    if (FORMAT_PATTERNS.rgb.test(trimmed) || FORMAT_PATTERNS.rgbSimple.test(trimmed)) {return 'rgb';}
    if (FORMAT_PATTERNS.hsla.test(trimmed)) {return 'hsla';}
    if (FORMAT_PATTERNS.hsl.test(trimmed)) {return 'hsl';}
    if (FORMAT_PATTERNS.hsb.test(trimmed)) {return 'hsb';}
    if (FORMAT_PATTERNS.cmyk.test(trimmed)) {return 'cmyk';}
    if (FORMAT_PATTERNS.lab.test(trimmed)) {return 'lab';}
    if (FORMAT_PATTERNS.xyz.test(trimmed)) {return 'xyz';}
    
    return null;
  }

  // Parse input string to RGB (with optional alpha)
  static parseToRGB(input: string, format?: ColorFormat): RGB | RGBA | null {
    const detectedFormat = format ?? this.detectFormat(input);
    if (!detectedFormat) {return null;}

    const trimmed = input.trim();
    const trimmedLower = trimmed.toLowerCase();

    // Handle named colors
    if (NAMED_COLORS_MAP_INTERNAL.has(trimmedLower) && detectedFormat === 'hex') {
      const namedColorHex = NAMED_COLORS_MAP_INTERNAL.get(trimmedLower) as string;
      if (namedColorHex === 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0 } as RGBA;
      }
      if (namedColorHex === 'currentcolor') {
        throw new Error('currentcolor is context-dependent and cannot be converted');
      }
      return this.hexToRGB(namedColorHex);
    }

    switch (detectedFormat) {
      case 'hex':
        return this.hexToRGB(trimmed);
      case 'rgb':
        return this.parseRGBString(trimmed);
      case 'rgba':
        return this.parseRGBAString(trimmed);
      case 'hsl': {
        const hsl = this.parseHSLString(trimmed);
        if (!hsl) {throw new Error('Invalid HSL format');}
        return this.hslToRGB(hsl);
      }
      case 'hsla': {
        const hsla = this.parseHSLAString(trimmed);
        if (!hsla) {throw new Error('Invalid HSLA format');}
        const rgb = this.hslToRGB(hsla);
        return { ...rgb, a: hsla.a } as RGBA;
      }
      case 'hsb':
      case 'hsv': {
        const hsb = this.parseHSBString(trimmed);
        if (!hsb) {throw new Error('Invalid HSB format');}
        return this.hsbToRGB(hsb);
      }
      case 'cmyk': {
        const cmyk = this.parseCMYKString(trimmed);
        if (!cmyk) {throw new Error('Invalid CMYK format');}
        return this.cmykToRGB(cmyk);
      }
      case 'lab': {
        const lab = this.parseLABString(trimmed);
        if (!lab) {throw new Error('Invalid LAB format');}
        return this.labToRGB(lab);
      }
      case 'xyz': {
        const xyz = this.parseXYZString(trimmed);
        if (!xyz) {throw new Error('Invalid XYZ format');}
        return this.xyzToRGB(xyz);
      }
      default:
        return null;
    }
  }

  // Hex to RGB (with optional alpha) - optimized
  static hexToRGB(hex: string): RGB | RGBA | null {
    const cleaned = hex.replace('#', '');
    const len = cleaned.length;
    let r: number, g: number, b: number, a: number | undefined;

    // Use switch for better performance than multiple if-else
    switch (len) {
      case 3: // #RGB
        r = parseInt(cleaned[0], 16) * 17; // Faster than cleaned[0] + cleaned[0]
        g = parseInt(cleaned[1], 16) * 17;
        b = parseInt(cleaned[2], 16) * 17;
        break;
      case 4: // #RGBA
        r = parseInt(cleaned[0], 16) * 17;
        g = parseInt(cleaned[1], 16) * 17;
        b = parseInt(cleaned[2], 16) * 17;
        a = parseInt(cleaned[3], 16) * 17 / 255; // Convert to 0-1 range
        break;
      case 6: // #RRGGBB
        r = parseInt(cleaned.slice(0, 2), 16);
        g = parseInt(cleaned.slice(2, 4), 16);
        b = parseInt(cleaned.slice(4, 6), 16);
        break;
      case 8: // #RRGGBBAA
        r = parseInt(cleaned.slice(0, 2), 16);
        g = parseInt(cleaned.slice(2, 4), 16);
        b = parseInt(cleaned.slice(4, 6), 16);
        a = parseInt(cleaned.slice(6, 8), 16) / 255; // Convert to 0-1 range
        break;
      default:
        return null;
    }

    // Check for NaN values (invalid hex characters)
    if (isNaN(r) || isNaN(g) || isNaN(b) || (a !== undefined && isNaN(a))) {
      return null;
    }

    return a !== undefined ? { r, g, b, a } : { r, g, b };
  }

  // RGB to Hex (with optional alpha)
  static rgbToHex(rgb: RGB | RGBA): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    const hexColor = `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
    
    // If alpha is present, convert from 0-1 to 00-FF and append
    if ('a' in rgb && rgb.a !== undefined) {
      const alphaHex = toHex(Math.round(rgb.a * 255));
      return hexColor + alphaHex;
    }
    
    return hexColor;
  }

  // RGB to HSL
  static rgbToHSL(rgb: RGB): HSL {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const add = max + min;
    const l = add * 0.5;

    let h = 0;
    let s = 0;

    if (diff !== 0) {
      s = l < 0.5 ? diff / add : diff / (2 - add);
      switch (max) {
        case r:
          h = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / diff + 2;
          break;
        case b:
          h = (r - g) / diff + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  // HSL to RGB
  static hslToRGB(hsl: HSL): RGB {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) {t += 1;}
        if (t > 1) {t -= 1;}
        if (t < 1/6) {return p + (q - p) * 6 * t;}
        if (t < 1/2) {return q;}
        if (t < 2/3) {return p + (q - p) * (2/3 - t) * 6;}
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  // RGB to HSB/HSV
  static rgbToHSB(rgb: RGB): HSB {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    const brightness = max;
    const saturation = max === 0 ? 0 : diff / max;

    let hue = 0;
    if (diff !== 0) {
      switch (max) {
        case r:
          hue = ((g - b) / diff) + (g < b ? 6 : 0);
          break;
        case g:
          hue = (b - r) / diff + 2;
          break;
        case b:
          hue = (r - g) / diff + 4;
          break;
      }
      hue /= 6;
    }

    return {
      h: Math.round(hue * 360),
      s: Math.round(saturation * 100),
      b: Math.round(brightness * 100)
    };
  }

  // HSB/HSV to RGB
  static hsbToRGB(hsb: HSB): RGB {
    const h = hsb.h / 360;
    const s = hsb.s / 100;
    const b = hsb.b / 100;

    let r: number, g: number, blue: number;

    if (s === 0) {
      r = g = blue = b;
    } else {
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = b * (1 - s);
      const q = b * (1 - s * f);
      const t = b * (1 - s * (1 - f));

      switch (i % 6) {
        case 0: r = b; g = t; blue = p; break;
        case 1: r = q; g = b; blue = p; break;
        case 2: r = p; g = b; blue = t; break;
        case 3: r = p; g = q; blue = b; break;
        case 4: r = t; g = p; blue = b; break;
        case 5: r = b; g = p; blue = q; break;
        default: r = g = blue = 0;
      }
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(blue * 255)
    };
  }

  // RGB to CMYK
  static rgbToCMYK(rgb: RGB): CMYK {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);

    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }

  // CMYK to RGB (simplified conversion - not color-profile accurate)
  static cmykToRGB(cmyk: CMYK): RGB {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;

    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);

    return {
      r: Math.round(r),
      g: Math.round(g),
      b: Math.round(b)
    };
  }

  // RGB to XYZ (using sRGB color space with D65 illuminant) - optimized
  static rgbToXYZ(rgb: RGB): XYZ {
    // Convert RGB to linear RGB (remove gamma correction)
    const r = applyGammaCorrection(rgb.r / 255) * 100;
    const g = applyGammaCorrection(rgb.g / 255) * 100;
    const b = applyGammaCorrection(rgb.b / 255) * 100;

    // Apply transformation matrix for D65 illuminant (optimized)
    const x = r * SRGB_TO_XYZ_MATRIX.r.x + g * SRGB_TO_XYZ_MATRIX.g.x + b * SRGB_TO_XYZ_MATRIX.b.x;
    const y = r * SRGB_TO_XYZ_MATRIX.r.y + g * SRGB_TO_XYZ_MATRIX.g.y + b * SRGB_TO_XYZ_MATRIX.b.y;
    const z = r * SRGB_TO_XYZ_MATRIX.r.z + g * SRGB_TO_XYZ_MATRIX.g.z + b * SRGB_TO_XYZ_MATRIX.b.z;

    return {
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      z: Math.round(z * 1000) / 1000
    };
  }

  // XYZ to RGB - optimized
  static xyzToRGB(xyz: XYZ): RGB {
    // Apply inverse transformation matrix (optimized)
    const r = removeGammaCorrection((xyz.x * XYZ_TO_SRGB_MATRIX.x.r + xyz.y * XYZ_TO_SRGB_MATRIX.y.r + xyz.z * XYZ_TO_SRGB_MATRIX.z.r) / 100);
    const g = removeGammaCorrection((xyz.x * XYZ_TO_SRGB_MATRIX.x.g + xyz.y * XYZ_TO_SRGB_MATRIX.y.g + xyz.z * XYZ_TO_SRGB_MATRIX.z.g) / 100);
    const b = removeGammaCorrection((xyz.x * XYZ_TO_SRGB_MATRIX.x.b + xyz.y * XYZ_TO_SRGB_MATRIX.y.b + xyz.z * XYZ_TO_SRGB_MATRIX.z.b) / 100);

    // Clamp and scale to 0-255
    return {
      r: Math.round(Math.max(0, Math.min(255, r * 255))),
      g: Math.round(Math.max(0, Math.min(255, g * 255))),
      b: Math.round(Math.max(0, Math.min(255, b * 255)))
    };
  }

  // XYZ to LAB (using D65 reference white) - optimized
  static xyzToLAB(xyz: XYZ): LAB {
    // Normalize using pre-computed D65 constants
    const x = xyz.x / D65_WHITE.x;
    const y = xyz.y / D65_WHITE.y;
    const z = xyz.z / D65_WHITE.z;

    // Apply optimized LAB function
    const fx = labFunction(x);
    const fy = labFunction(y);
    const fz = labFunction(z);

    const l = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);

    return {
      l: Math.round(l * 100) / 100,
      a: Math.round(a * 100) / 100,
      b: Math.round(b * 100) / 100
    };
  }

  // LAB to XYZ - optimized
  static labToXYZ(lab: LAB): XYZ {
    const fy = (lab.l + 16) / 116;
    const fx = lab.a / 500 + fy;
    const fz = fy - lab.b / 200;

    // Apply optimized inverse LAB function
    const x = inverseLabFunction(fx);
    const y = inverseLabFunction(fy);
    const z = inverseLabFunction(fz);

    return {
      x: Math.round(x * D65_WHITE.x * 1000) / 1000,
      y: Math.round(y * D65_WHITE.y * 1000) / 1000,
      z: Math.round(z * D65_WHITE.z * 1000) / 1000
    };
  }

  // RGB to LAB (convenience method)
  static rgbToLAB(rgb: RGB): LAB {
    const xyz = this.rgbToXYZ(rgb);
    return this.xyzToLAB(xyz);
  }

  // LAB to RGB (convenience method)
  static labToRGB(lab: LAB): RGB {
    const xyz = this.labToXYZ(lab);
    return this.xyzToRGB(xyz);
  }

  // Parse RGB string - optimized
  static parseRGBString(input: string): RGB | null {
    // Pre-compiled regex patterns for better performance
    const rgbMatch = input.match(/rgb\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/i) ??
                     input.match(/^(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)$/);
    
    if (!rgbMatch) {return null;}

    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);

    // Single validation check
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error(`RGB values must be between 0 and 255. Got: r=${r}, g=${g}, b=${b}`);
    }

    return { r, g, b };
  }

  // Parse RGBA string - optimized
  static parseRGBAString(input: string): RGBA | null {
    const match = input.match(/rgba\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?[\d.]+)\s*\)/i);
    if (!match) {return null;}

    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    const a = parseFloat(match[4]);

    // Combined validation checks
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      throw new Error(`RGB values must be between 0 and 255. Got: r=${r}, g=${g}, b=${b}`);
    }
    
    if (a < 0 || a > 1) {
      throw new Error(`Alpha value must be between 0 and 1. Got: ${a}`);
    }

    return { r, g, b, a };
  }

  // Parse HSL string
  static parseHSLString(input: string): HSL | null {
    const match = input.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!match) {return null;}

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);

    if (h > 360 || h < 0) {
      throw new Error(`Hue must be between 0 and 360. Got: ${h}`);
    }
    if (s > 100 || s < 0 || l > 100 || l < 0) {
      throw new Error(`Saturation and Lightness must be between 0 and 100. Got: s=${s}, l=${l}`);
    }

    return { h, s, l };
  }

  // Parse HSLA string
  static parseHSLAString(input: string): HSLA | null {
    const match = input.match(/hsla\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*([\d.]+)\s*\)/i);
    if (!match) {return null;}

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const l = parseInt(match[3]);
    const a = parseFloat(match[4]);

    if (h > 360 || h < 0) {
      throw new Error(`Hue must be between 0 and 360. Got: ${h}`);
    }
    if (s > 100 || s < 0 || l > 100 || l < 0) {
      throw new Error(`Saturation and Lightness must be between 0 and 100. Got: s=${s}, l=${l}`);
    }
    if (a > 1 || a < 0) {
      throw new Error(`Alpha value must be between 0 and 1. Got: ${a}`);
    }

    return { h, s, l, a };
  }

  // Parse HSB/HSV string
  static parseHSBString(input: string): HSB | null {
    const match = input.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!match) {return null;}

    const h = parseInt(match[1]);
    const s = parseInt(match[2]);
    const b = parseInt(match[3]);

    if (h > 360 || h < 0) {
      throw new Error(`Hue must be between 0 and 360. Got: ${h}`);
    }
    if (s > 100 || s < 0 || b > 100 || b < 0) {
      throw new Error(`Saturation and Brightness must be between 0 and 100. Got: s=${s}, b=${b}`);
    }

    return { h, s, b };
  }

  // Parse CMYK string
  static parseCMYKString(input: string): CMYK | null {
    const match = input.match(/(-?\d+)%?\s*,\s*(-?\d+)%?\s*,\s*(-?\d+)%?\s*,\s*(-?\d+)%?/);
    if (!match) {return null;}

    const c = parseInt(match[1]);
    const m = parseInt(match[2]);
    const y = parseInt(match[3]);
    const k = parseInt(match[4]);

    if (c > 100 || c < 0 || m > 100 || m < 0 || y > 100 || y < 0 || k > 100 || k < 0) {
      throw new Error(`CMYK values must be between 0 and 100. Got: c=${c}, m=${m}, y=${y}, k=${k}`);
    }

    return { c, m, y, k };
  }

  // Parse LAB string
  static parseLABString(input: string): LAB | null {
    const match = input.match(/lab\s*\(\s*(-?[\d.]+)%?\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i);
    if (!match) {return null;}

    const l = parseFloat(match[1]);
    const a = parseFloat(match[2]);
    const b = parseFloat(match[3]);

    if (l > 100 || l < 0) {
      throw new Error(`LAB L* value must be between 0 and 100. Got: ${l}`);
    }

    // a* and b* typically range from -128 to 127, but we'll be more permissive
    if (Math.abs(a) > 128 || Math.abs(b) > 128) {
      throw new Error(`LAB a* and b* values typically range from -128 to 127. Got: a=${a}, b=${b}`);
    }

    return { l, a, b };
  }

  // Parse XYZ string
  static parseXYZString(input: string): XYZ | null {
    const match = input.match(/xyz\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/i);
    if (!match) {return null;}

    const x = parseFloat(match[1]);
    const y = parseFloat(match[2]);
    const z = parseFloat(match[3]);

    // XYZ values for D65 illuminant typically range: X(0-95.047), Y(0-100), Z(0-108.883)
    if (x < 0 || y < 0 || z < 0) {
      throw new Error(`XYZ values must be non-negative. Got: x=${x}, y=${y}, z=${z}`);
    }

    return { x, y, z };
  }

  // Format output strings
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
    // Round to 2 decimal places to avoid floating point precision issues
    const l = Math.round(lab.l * 100) / 100;
    const a = Math.round(lab.a * 100) / 100;
    const b = Math.round(lab.b * 100) / 100;
    return `lab(${l}%, ${a}, ${b})`;
  }

  static formatXYZ(xyz: XYZ): string {
    return `xyz(${xyz.x}, ${xyz.y}, ${xyz.z})`;
  }

  // Main conversion method - with caching
  static convert(input: string, from?: ColorFormat, to?: ColorFormat[]): ConversionResult {
    // Create cache key (handle undefined vs empty array difference)
    const targetFormatsKey = to === undefined ? 'all' : to.join(',');
    const cacheKey = `${input}|${from ?? 'auto'}|${targetFormatsKey}`;
    
    // Check cache first
    const cached = conversionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Parse input to RGB/RGBA
    const rgbOrRgba = this.parseToRGB(input, from);
    if (!rgbOrRgba) {
      throw new Error('Invalid color format or value');
    }

    // Check if we have alpha channel
    const hasAlpha = 'a' in rgbOrRgba;
    const rgb: RGB = { r: rgbOrRgba.r, g: rgbOrRgba.g, b: rgbOrRgba.b };
    const alpha = hasAlpha ? (rgbOrRgba as RGBA).a : undefined;

    // If no target formats specified, return all. If empty array, return none (just raw values)
    const targetFormats = to ?? ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'cmyk', 'lab', 'xyz'];
    const result: ConversionResult = { rawValues: { rgb } };

    for (const format of targetFormats) {
      switch (format) {
        case 'hex':
          // If input has alpha, preserve it in hex output
          if (hasAlpha && alpha !== undefined) {
            const rgba: RGBA = { ...rgb, a: alpha };
            result.hex = this.rgbToHex(rgba);
          } else {
            result.hex = this.rgbToHex(rgb);
          }
          break;
        case 'rgb':
          result.rgb = this.formatRGB(rgb);
          break;
        case 'rgba':
          if (alpha !== undefined) {
            const rgba: RGBA = { ...rgb, a: alpha };
            result.rgba = this.formatRGBA(rgba);
            if (result.rawValues) {result.rawValues.rgba = rgba;}
          }
          break;
        case 'hsl': {
          const hsl = this.rgbToHSL(rgb);
          result.hsl = this.formatHSL(hsl);
          if (result.rawValues) {result.rawValues.hsl = hsl;}
          break;
        }
        case 'hsla':
          if (alpha !== undefined) {
            const hsl = this.rgbToHSL(rgb);
            const hsla: HSLA = { ...hsl, a: alpha };
            result.hsla = this.formatHSLA(hsla);
            if (result.rawValues) {result.rawValues.hsla = hsla;}
          }
          break;
        case 'hsb':
        case 'hsv': {
          const hsb = this.rgbToHSB(rgb);
          result.hsb = this.formatHSB(hsb);
          result.hsv = result.hsb; // HSB and HSV are the same
          if (result.rawValues) {result.rawValues.hsb = hsb;}
          break;
        }
        case 'cmyk': {
          const cmyk = this.rgbToCMYK(rgb);
          result.cmyk = this.formatCMYK(cmyk);
          if (result.rawValues) {result.rawValues.cmyk = cmyk;}
          break;
        }
        case 'lab': {
          const lab = this.rgbToLAB(rgb);
          result.lab = this.formatLAB(lab);
          if (result.rawValues) {result.rawValues.lab = lab;}
          break;
        }
        case 'xyz': {
          const xyz = this.rgbToXYZ(rgb);
          result.xyz = this.formatXYZ(xyz);
          if (result.rawValues) {result.rawValues.xyz = xyz;}
          break;
        }
      }
    }

    // Cache the result before returning
    conversionCache.set(cacheKey, result);
    return result;
  }

  // Clear cache method for testing/memory management
  static clearCache(): void {
    conversionCache.clear();
  }

  // Get cache stats for monitoring
  static getCacheStats(): { size: number; maxSize: number } {
    return {
      size: conversionCache['cache'].size,
      maxSize: conversionCache['maxSize']
    };
  }

  // Mix two colors in LAB space (perceptually uniform)
  static mixColors(color1: string, color2: string, ratio = 0.5, mode: BlendMode = 'normal'): MixResult {
    // Parse both colors to RGB
    const rgb1 = this.parseToRGB(color1);
    const rgb2 = this.parseToRGB(color2);
    
    if (!rgb1 || !rgb2) {
      throw new Error('Invalid color format');
    }

    // Handle blend modes
    let mixedRgb: RGB;
    
    switch (mode) {
      case 'normal': {
        // Mix in LAB space for perceptually uniform results
        const lab1 = this.rgbToLAB(rgb1);
        const lab2 = this.rgbToLAB(rgb2);
        
        const mixedLab: LAB = {
          l: lab1.l * (1 - ratio) + lab2.l * ratio,
          a: lab1.a * (1 - ratio) + lab2.a * ratio,
          b: lab1.b * (1 - ratio) + lab2.b * ratio
        };
        
        mixedRgb = this.labToRGB(mixedLab);
        break;
      }
        
      case 'multiply':
        mixedRgb = {
          r: Math.round((rgb1.r * rgb2.r) / 255),
          g: Math.round((rgb1.g * rgb2.g) / 255),
          b: Math.round((rgb1.b * rgb2.b) / 255)
        };
        break;
        
      case 'screen':
        mixedRgb = {
          r: Math.round(255 - ((255 - rgb1.r) * (255 - rgb2.r)) / 255),
          g: Math.round(255 - ((255 - rgb1.g) * (255 - rgb2.g)) / 255),
          b: Math.round(255 - ((255 - rgb1.b) * (255 - rgb2.b)) / 255)
        };
        break;
        
      case 'overlay': {
        const overlay = (base: number, blend: number) => {
          return base < 128
            ? (2 * base * blend) / 255
            : 255 - (2 * (255 - base) * (255 - blend)) / 255;
        };
        
        mixedRgb = {
          r: Math.round(overlay(rgb1.r, rgb2.r)),
          g: Math.round(overlay(rgb1.g, rgb2.g)),
          b: Math.round(overlay(rgb1.b, rgb2.b))
        };
        break;
      }
        
      default:
        throw new Error(`Unknown blend mode: ${mode}`);
    }

    // Handle alpha channel if present
    let mixedAlpha: number | undefined;
    if ('a' in rgb1 && 'a' in rgb2) {
      mixedAlpha = (rgb1 as RGBA).a * (1 - ratio) + (rgb2 as RGBA).a * ratio;
      // Round to avoid floating point precision issues
      mixedAlpha = Math.round(mixedAlpha * 10000) / 10000;
    } else if ('a' in rgb1) {
      mixedAlpha = (rgb1 as RGBA).a;
    } else if ('a' in rgb2) {
      mixedAlpha = (rgb2 as RGBA).a;
    }

    // Convert the mixed color to all formats
    const mixedColor = mixedAlpha !== undefined
      ? this.rgbToHex({ ...mixedRgb, a: mixedAlpha })
      : this.rgbToHex(mixedRgb);
    
    const result = this.convert(mixedColor) as MixResult;
    result.mixRatio = ratio;
    result.mode = mode;
    
    return result;
  }
}