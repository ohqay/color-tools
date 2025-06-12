import type { HSL, ColorFormat} from './types.js';
import { RGB, ConversionResult } from './types.js';
import { ColorConverter } from './colorConverter.js';

export type HarmonyType = 
  | 'complementary' 
  | 'analogous' 
  | 'triadic' 
  | 'tetradic' 
  | 'square'
  | 'split-complementary'
  | 'double-complementary';

export interface HarmonyOptions {
  /** Custom angle adjustment for fine-tuning harmony colors */
  angleAdjustment?: number;
  /** Number of colors to generate for analogous harmony (default: 3) */
  analogousCount?: number;
  /** Angle between analogous colors (default: 30) */
  analogousAngle?: number;
}

export interface HarmonyResult {
  type: HarmonyType;
  baseColor: string;
  colors: string[];
  /** Raw HSL values for each color */
  rawValues?: HSL[];
}

export class ColorHarmony {
  /**
   * Normalize hue value to be within 0-360 range
   */
  private static normalizeHue(hue: number): number {
    while (hue < 0) {hue += 360;}
    while (hue >= 360) {hue -= 360;}
    return hue;
  }

  /**
   * Convert a color to HSL for harmony calculations
   */
  private static toHSL(input: string): HSL {
    const rgb = ColorConverter.parseToRGB(input);
    if (!rgb) {
      throw new Error('Invalid color format');
    }
    return ColorConverter.rgbToHSL(rgb);
  }

  /**
   * Format HSL values to the desired output format
   */
  private static formatColor(hsl: HSL, format: ColorFormat): string {
    const rgb = ColorConverter.hslToRGB(hsl);
    const result = ColorConverter.convert(ColorConverter.formatRGB(rgb), 'rgb', [format]);
    
    switch (format) {
      case 'hex':
        return result.hex ?? '';
      case 'rgb':
        return result.rgb ?? '';
      case 'hsl':
        return result.hsl ?? '';
      case 'hsb':
      case 'hsv':
        return result.hsb ?? '';
      case 'cmyk':
        return result.cmyk ?? '';
      default:
        return result.hex ?? '';
    }
  }

  /**
   * Generate complementary color (opposite on color wheel)
   */
  static generateComplementary(
    baseColor: string, 
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    const hsl = this.toHSL(baseColor);
    const adjustment = options.angleAdjustment ?? 0;
    
    // Complementary is 180 degrees opposite
    const complementaryHue = this.normalizeHue(hsl.h + 180 + adjustment);
    const complementary: HSL = { ...hsl, h: complementaryHue };
    
    return {
      type: 'complementary',
      baseColor: this.formatColor(hsl, outputFormat),
      colors: [
        this.formatColor(hsl, outputFormat),
        this.formatColor(complementary, outputFormat)
      ],
      rawValues: [hsl, complementary]
    };
  }

  /**
   * Generate analogous colors (adjacent on color wheel)
   */
  static generateAnalogous(
    baseColor: string,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    const hsl = this.toHSL(baseColor);
    const count = options.analogousCount ?? 3;
    const angle = options.analogousAngle ?? 30;
    const adjustment = options.angleAdjustment ?? 0;
    
    const colors: HSL[] = [hsl];
    
    // Generate colors on both sides of the base color
    const sideCount = Math.floor((count - 1) / 2);
    
    // Colors on the positive side
    for (let i = 1; i <= sideCount; i++) {
      const hue = this.normalizeHue(hsl.h + (i * angle) + adjustment);
      colors.push({ ...hsl, h: hue });
    }
    
    // Colors on the negative side
    for (let i = 1; i <= count - 1 - sideCount; i++) {
      const hue = this.normalizeHue(hsl.h - (i * angle) + adjustment);
      colors.unshift({ ...hsl, h: hue });
    }
    
    return {
      type: 'analogous',
      baseColor: this.formatColor(hsl, outputFormat),
      colors: colors.map(c => this.formatColor(c, outputFormat)),
      rawValues: colors
    };
  }

  /**
   * Generate triadic colors (three colors evenly spaced)
   */
  static generateTriadic(
    baseColor: string,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    const hsl = this.toHSL(baseColor);
    const adjustment = options.angleAdjustment ?? 0;
    
    const colors: HSL[] = [
      hsl,
      { ...hsl, h: this.normalizeHue(hsl.h + 120 + adjustment) },
      { ...hsl, h: this.normalizeHue(hsl.h + 240 + adjustment) }
    ];
    
    return {
      type: 'triadic',
      baseColor: this.formatColor(hsl, outputFormat),
      colors: colors.map(c => this.formatColor(c, outputFormat)),
      rawValues: colors
    };
  }

  /**
   * Generate tetradic/square colors (four colors evenly spaced)
   */
  static generateTetradic(
    baseColor: string,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    const hsl = this.toHSL(baseColor);
    const adjustment = options.angleAdjustment ?? 0;
    
    const colors: HSL[] = [
      hsl,
      { ...hsl, h: this.normalizeHue(hsl.h + 90 + adjustment) },
      { ...hsl, h: this.normalizeHue(hsl.h + 180 + adjustment) },
      { ...hsl, h: this.normalizeHue(hsl.h + 270 + adjustment) }
    ];
    
    return {
      type: 'square',
      baseColor: this.formatColor(hsl, outputFormat),
      colors: colors.map(c => this.formatColor(c, outputFormat)),
      rawValues: colors
    };
  }

  /**
   * Generate split-complementary colors
   * Base color + two colors adjacent to its complement
   */
  static generateSplitComplementary(
    baseColor: string,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    const hsl = this.toHSL(baseColor);
    const adjustment = options.angleAdjustment ?? 0;
    const splitAngle = 30; // Standard split angle
    
    const complementaryHue = hsl.h + 180;
    
    const colors: HSL[] = [
      hsl,
      { ...hsl, h: this.normalizeHue(complementaryHue - splitAngle + adjustment) },
      { ...hsl, h: this.normalizeHue(complementaryHue + splitAngle + adjustment) }
    ];
    
    return {
      type: 'split-complementary',
      baseColor: this.formatColor(hsl, outputFormat),
      colors: colors.map(c => this.formatColor(c, outputFormat)),
      rawValues: colors
    };
  }

  /**
   * Generate double complementary colors (two complementary pairs)
   * Uses a rectangle on the color wheel
   */
  static generateDoubleComplementary(
    baseColor: string,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    const hsl = this.toHSL(baseColor);
    const adjustment = options.angleAdjustment ?? 0;
    const rectangleAngle = 60; // Creates a rectangle shape
    
    const colors: HSL[] = [
      hsl,
      { ...hsl, h: this.normalizeHue(hsl.h + rectangleAngle + adjustment) },
      { ...hsl, h: this.normalizeHue(hsl.h + 180 + adjustment) },
      { ...hsl, h: this.normalizeHue(hsl.h + 180 + rectangleAngle + adjustment) }
    ];
    
    return {
      type: 'double-complementary',
      baseColor: this.formatColor(hsl, outputFormat),
      colors: colors.map(c => this.formatColor(c, outputFormat)),
      rawValues: colors
    };
  }

  /**
   * Generate harmony based on type
   */
  static generateHarmony(
    baseColor: string,
    harmonyType: HarmonyType,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): HarmonyResult {
    switch (harmonyType) {
      case 'complementary':
        return this.generateComplementary(baseColor, outputFormat, options);
      case 'analogous':
        return this.generateAnalogous(baseColor, outputFormat, options);
      case 'triadic':
        return this.generateTriadic(baseColor, outputFormat, options);
      case 'tetradic':
      case 'square':
        return this.generateTetradic(baseColor, outputFormat, options);
      case 'split-complementary':
        return this.generateSplitComplementary(baseColor, outputFormat, options);
      case 'double-complementary':
        return this.generateDoubleComplementary(baseColor, outputFormat, options);
      default:
        throw new Error(`Unknown harmony type: ${harmonyType}`);
    }
  }

  /**
   * Generate multiple harmonies at once
   */
  static generateAllHarmonies(
    baseColor: string,
    outputFormat: ColorFormat = 'hex',
    options: HarmonyOptions = {}
  ): Record<HarmonyType, HarmonyResult> {
    const harmonyTypes: HarmonyType[] = [
      'complementary',
      'analogous',
      'triadic',
      'tetradic',
      'split-complementary',
      'double-complementary'
    ];

    const results: Record<string, HarmonyResult> = {};
    
    for (const type of harmonyTypes) {
      results[type] = this.generateHarmony(baseColor, type, outputFormat, options);
    }
    
    return results as Record<HarmonyType, HarmonyResult>;
  }
}