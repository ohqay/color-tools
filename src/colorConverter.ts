import { RGB, RGBA, HSL, HSLA, HSB, CMYK, ColorFormat, ConversionResult } from './types.js';
import { NAMED_COLORS } from './namedColors.js';

export class ColorConverter {
  // Detect color format from input string
  static detectFormat(input: string): ColorFormat | null {
    const trimmed = input.trim().toLowerCase();
    
    // Check for named colors first
    if (NAMED_COLORS[trimmed]) {
      return 'hex';
    }
    
    // Hex format: #RGB, #RRGGBB
    if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(trimmed)) {
      return 'hex';
    }
    
    // RGBA format: rgba(r,g,b,a)
    if (/^rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/i.test(trimmed)) {
      return 'rgba';
    }
    
    // RGB format: rgb(r,g,b) or r,g,b
    if (/^rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/i.test(trimmed) || 
        /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(trimmed)) {
      return 'rgb';
    }
    
    // HSLA format: hsla(h,s%,l%,a)
    if (/^hsla\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*[\d.]+\s*\)$/i.test(trimmed)) {
      return 'hsla';
    }
    
    // HSL format: hsl(h,s%,l%)
    if (/^hsl\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i.test(trimmed)) {
      return 'hsl';
    }
    
    // HSB/HSV format: hsb(h,s%,b%) or hsv(h,s%,v%)
    if (/^(hsb|hsv)\s*\(\s*\d+\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i.test(trimmed)) {
      return 'hsb';
    }
    
    // CMYK format: cmyk(c%,m%,y%,k%)
    if (/^cmyk\s*\(\s*\d+%?\s*,\s*\d+%?\s*,\s*\d+%?\s*,\s*\d+%?\s*\)$/i.test(trimmed)) {
      return 'cmyk';
    }
    
    return null;
  }

  // Parse input string to RGB (with optional alpha)
  static parseToRGB(input: string, format?: ColorFormat): RGB | RGBA | null {
    const detectedFormat = format || this.detectFormat(input);
    if (!detectedFormat) return null;

    const trimmed = input.trim();
    const trimmedLower = trimmed.toLowerCase();

    // Handle named colors
    if (NAMED_COLORS[trimmedLower] && detectedFormat === 'hex') {
      const namedColorHex = NAMED_COLORS[trimmedLower];
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
      case 'hsl':
        return this.hslToRGB(this.parseHSLString(trimmed)!);
      case 'hsla':
        const hsla = this.parseHSLAString(trimmed)!;
        const rgb = this.hslToRGB(hsla);
        return { ...rgb, a: hsla.a } as RGBA;
      case 'hsb':
      case 'hsv':
        return this.hsbToRGB(this.parseHSBString(trimmed)!);
      case 'cmyk':
        return this.cmykToRGB(this.parseCMYKString(trimmed)!);
      default:
        return null;
    }
  }

  // Hex to RGB
  static hexToRGB(hex: string): RGB | null {
    const cleaned = hex.replace('#', '');
    let r: number, g: number, b: number;

    if (cleaned.length === 3) {
      r = parseInt(cleaned[0] + cleaned[0], 16);
      g = parseInt(cleaned[1] + cleaned[1], 16);
      b = parseInt(cleaned[2] + cleaned[2], 16);
    } else if (cleaned.length === 6) {
      r = parseInt(cleaned.substr(0, 2), 16);
      g = parseInt(cleaned.substr(2, 2), 16);
      b = parseInt(cleaned.substr(4, 2), 16);
    } else {
      return null;
    }

    return { r, g, b };
  }

  // RGB to Hex
  static rgbToHex(rgb: RGB): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
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
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
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

  // Parse RGB string
  static parseRGBString(input: string): RGB | null {
    const match = input.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!match) return null;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0) {
      throw new Error(`RGB values must be between 0 and 255. Got: r=${r}, g=${g}, b=${b}`);
    }

    return { r, g, b };
  }

  // Parse RGBA string
  static parseRGBAString(input: string): RGBA | null {
    const match = input.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/i);
    if (!match) return null;

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = parseFloat(match[4]);

    if (r > 255 || g > 255 || b > 255 || r < 0 || g < 0 || b < 0) {
      throw new Error(`RGB values must be between 0 and 255. Got: r=${r}, g=${g}, b=${b}`);
    }
    
    if (a > 1 || a < 0) {
      throw new Error(`Alpha value must be between 0 and 1. Got: ${a}`);
    }

    return { r, g, b, a };
  }

  // Parse HSL string
  static parseHSLString(input: string): HSL | null {
    const match = input.match(/(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!match) return null;

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
    if (!match) return null;

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
    if (!match) return null;

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
    const match = input.match(/(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
    if (!match) return null;

    const c = parseInt(match[1]);
    const m = parseInt(match[2]);
    const y = parseInt(match[3]);
    const k = parseInt(match[4]);

    if (c > 100 || c < 0 || m > 100 || m < 0 || y > 100 || y < 0 || k > 100 || k < 0) {
      throw new Error(`CMYK values must be between 0 and 100. Got: c=${c}, m=${m}, y=${y}, k=${k}`);
    }

    return { c, m, y, k };
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

  // Main conversion method
  static convert(input: string, from?: ColorFormat, to?: ColorFormat[]): ConversionResult {
    // Parse input to RGB/RGBA
    const rgbOrRgba = this.parseToRGB(input, from);
    if (!rgbOrRgba) {
      throw new Error('Invalid color format or value');
    }

    // Check if we have alpha channel
    const hasAlpha = 'a' in rgbOrRgba;
    const rgb: RGB = { r: rgbOrRgba.r, g: rgbOrRgba.g, b: rgbOrRgba.b };
    const alpha = hasAlpha ? (rgbOrRgba as RGBA).a : undefined;

    // If no target formats specified, return all
    const targetFormats = to || ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'cmyk'];
    const result: ConversionResult = { rawValues: { rgb } };

    for (const format of targetFormats) {
      switch (format) {
        case 'hex':
          result.hex = this.rgbToHex(rgb);
          break;
        case 'rgb':
          result.rgb = this.formatRGB(rgb);
          break;
        case 'rgba':
          if (alpha !== undefined) {
            const rgba: RGBA = { ...rgb, a: alpha };
            result.rgba = this.formatRGBA(rgba);
            result.rawValues!.rgba = rgba;
          }
          break;
        case 'hsl':
          const hsl = this.rgbToHSL(rgb);
          result.hsl = this.formatHSL(hsl);
          result.rawValues!.hsl = hsl;
          break;
        case 'hsla':
          if (alpha !== undefined) {
            const hsl = this.rgbToHSL(rgb);
            const hsla: HSLA = { ...hsl, a: alpha };
            result.hsla = this.formatHSLA(hsla);
            result.rawValues!.hsla = hsla;
          }
          break;
        case 'hsb':
        case 'hsv':
          const hsb = this.rgbToHSB(rgb);
          result.hsb = this.formatHSB(hsb);
          result.hsv = result.hsb; // HSB and HSV are the same
          result.rawValues!.hsb = hsb;
          break;
        case 'cmyk':
          const cmyk = this.rgbToCMYK(rgb);
          result.cmyk = this.formatCMYK(cmyk);
          result.rawValues!.cmyk = cmyk;
          break;
      }
    }

    return result;
  }
}