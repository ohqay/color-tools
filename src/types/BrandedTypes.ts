/**
 * Branded types for better type safety and runtime validation
 */

// Branded type helper
type Brand<T, U> = T & { readonly __brand: U };

// Color value brands for compile-time safety
export type HexString = Brand<string, 'HexString'>;
export type RGBValue = Brand<number, 'RGBValue'>; // 0-255
export type HueValue = Brand<number, 'HueValue'>; // 0-360
export type PercentValue = Brand<number, 'PercentValue'>; // 0-100
export type AlphaValue = Brand<number, 'AlphaValue'>; // 0-1
export type LabLightness = Brand<number, 'LabLightness'>; // 0-100
export type LabColorValue = Brand<number, 'LabColorValue'>; // typically -128 to 127

// Branded color interfaces
export interface BrandedRGB {
  r: RGBValue;
  g: RGBValue;
  b: RGBValue;
}

export interface BrandedRGBA extends BrandedRGB {
  a: AlphaValue;
}

export interface BrandedHSL {
  h: HueValue;
  s: PercentValue;
  l: PercentValue;
}

export interface BrandedHSLA extends BrandedHSL {
  a: AlphaValue;
}

export interface BrandedHSB {
  h: HueValue;
  s: PercentValue;
  b: PercentValue;
}

export interface BrandedCMYK {
  c: PercentValue;
  m: PercentValue;
  y: PercentValue;
  k: PercentValue;
}

export interface BrandedLAB {
  l: LabLightness;
  a: LabColorValue;
  b: LabColorValue;
}

export interface BrandedXYZ {
  x: number; // No specific bounds, depends on illuminant
  y: number;
  z: number;
}

// Validation functions to create branded types safely
export function createRGBValue(value: number): RGBValue {
  if (!Number.isInteger(value) || value < 0 || value > 255) {
    throw new Error(`Invalid RGB value: ${value}. Must be an integer between 0 and 255.`);
  }
  return value as RGBValue;
}

export function createHueValue(value: number): HueValue {
  if (typeof value !== 'number' || value < 0 || value > 360) {
    throw new Error(`Invalid hue value: ${value}. Must be a number between 0 and 360.`);
  }
  return value as HueValue;
}

export function createPercentValue(value: number): PercentValue {
  if (typeof value !== 'number' || value < 0 || value > 100) {
    throw new Error(`Invalid percent value: ${value}. Must be a number between 0 and 100.`);
  }
  return value as PercentValue;
}

export function createAlphaValue(value: number): AlphaValue {
  if (typeof value !== 'number' || value < 0 || value > 1) {
    throw new Error(`Invalid alpha value: ${value}. Must be a number between 0 and 1.`);
  }
  return value as AlphaValue;
}

export function createLabLightness(value: number): LabLightness {
  if (typeof value !== 'number' || value < 0 || value > 100) {
    throw new Error(`Invalid LAB lightness: ${value}. Must be a number between 0 and 100.`);
  }
  return value as LabLightness;
}

export function createLabColorValue(value: number): LabColorValue {
  if (typeof value !== 'number') {
    throw new Error(`Invalid LAB color value: ${value}. Must be a number.`);
  }
  return value as LabColorValue;
}

export function createHexString(value: string): HexString {
  const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  if (!hexPattern.test(value)) {
    throw new Error(`Invalid hex string: ${value}. Must match pattern #RGB, #RGBA, #RRGGBB, or #RRGGBBAA.`);
  }
  return value.toLowerCase() as HexString;
}

// Safe constructors for branded color objects
export function createBrandedRGB(r: number, g: number, b: number): BrandedRGB {
  return {
    r: createRGBValue(r),
    g: createRGBValue(g),
    b: createRGBValue(b)
  };
}

export function createBrandedRGBA(r: number, g: number, b: number, a: number): BrandedRGBA {
  return {
    r: createRGBValue(r),
    g: createRGBValue(g),
    b: createRGBValue(b),
    a: createAlphaValue(a)
  };
}

export function createBrandedHSL(h: number, s: number, l: number): BrandedHSL {
  return {
    h: createHueValue(h),
    s: createPercentValue(s),
    l: createPercentValue(l)
  };
}

export function createBrandedHSLA(h: number, s: number, l: number, a: number): BrandedHSLA {
  return {
    h: createHueValue(h),
    s: createPercentValue(s),
    l: createPercentValue(l),
    a: createAlphaValue(a)
  };
}

export function createBrandedHSB(h: number, s: number, b: number): BrandedHSB {
  return {
    h: createHueValue(h),
    s: createPercentValue(s),
    b: createPercentValue(b)
  };
}

export function createBrandedCMYK(c: number, m: number, y: number, k: number): BrandedCMYK {
  return {
    c: createPercentValue(c),
    m: createPercentValue(m),
    y: createPercentValue(y),
    k: createPercentValue(k)
  };
}

export function createBrandedLAB(l: number, a: number, b: number): BrandedLAB {
  return {
    l: createLabLightness(l),
    a: createLabColorValue(a),
    b: createLabColorValue(b)
  };
}

export function createBrandedXYZ(x: number, y: number, z: number): BrandedXYZ {
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    throw new Error('XYZ values must be numbers');
  }
  return { x, y, z };
}

// Type guards for runtime checking
export function isRGBValue(value: unknown): value is RGBValue {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 255;
}

export function isHueValue(value: unknown): value is HueValue {
  return typeof value === 'number' && value >= 0 && value <= 360;
}

export function isPercentValue(value: unknown): value is PercentValue {
  return typeof value === 'number' && value >= 0 && value <= 100;
}

export function isAlphaValue(value: unknown): value is AlphaValue {
  return typeof value === 'number' && value >= 0 && value <= 1;
}

export function isHexString(value: unknown): value is HexString {
  if (typeof value !== 'string') {return false;}
  const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
  return hexPattern.test(value);
}

export function isBrandedRGB(value: unknown): value is BrandedRGB {
  return (
    typeof value === 'object' &&
    value !== null &&
    'r' in value &&
    'g' in value &&
    'b' in value &&
    isRGBValue((value as Record<string, unknown>).r) &&
    isRGBValue((value as Record<string, unknown>).g) &&
    isRGBValue((value as Record<string, unknown>).b)
  );
}

export function isBrandedRGBA(value: unknown): value is BrandedRGBA {
  return (
    isBrandedRGB(value) &&
    'a' in value &&
    isAlphaValue((value as Record<string, unknown>).a)
  );
}

export function isBrandedHSL(value: unknown): value is BrandedHSL {
  return (
    typeof value === 'object' &&
    value !== null &&
    'h' in value &&
    's' in value &&
    'l' in value &&
    isHueValue((value as Record<string, unknown>).h) &&
    isPercentValue((value as Record<string, unknown>).s) &&
    isPercentValue((value as Record<string, unknown>).l)
  );
}

export function isBrandedHSLA(value: unknown): value is BrandedHSLA {
  return (
    isBrandedHSL(value) &&
    'a' in value &&
    isAlphaValue((value as Record<string, unknown>).a)
  );
}

// Conversion utilities between branded and regular types
// Convert from regular types to branded types (with validation)
export function fromRegularRGB(rgb: { r: number; g: number; b: number }): BrandedRGB {
  return createBrandedRGB(rgb.r, rgb.g, rgb.b);
}

export function fromRegularRGBA(rgba: { r: number; g: number; b: number; a: number }): BrandedRGBA {
  return createBrandedRGBA(rgba.r, rgba.g, rgba.b, rgba.a);
}

export function fromRegularHSL(hsl: { h: number; s: number; l: number }): BrandedHSL {
  return createBrandedHSL(hsl.h, hsl.s, hsl.l);
}

export function fromRegularHSLA(hsla: { h: number; s: number; l: number; a: number }): BrandedHSLA {
  return createBrandedHSLA(hsla.h, hsla.s, hsla.l, hsla.a);
}

// Convert from branded types to regular types (safe, no validation needed)
export function toRegularRGB(rgb: BrandedRGB): { r: number; g: number; b: number } {
  return { r: rgb.r as number, g: rgb.g as number, b: rgb.b as number };
}

export function toRegularRGBA(rgba: BrandedRGBA): { r: number; g: number; b: number; a: number } {
  return { 
    r: rgba.r as number, 
    g: rgba.g as number, 
    b: rgba.b as number, 
    a: rgba.a as number 
  };
}

export function toRegularHSL(hsl: BrandedHSL): { h: number; s: number; l: number } {
  return { h: hsl.h as number, s: hsl.s as number, l: hsl.l as number };
}

export function toRegularHSLA(hsla: BrandedHSLA): { h: number; s: number; l: number; a: number } {
  return { 
    h: hsla.h as number, 
    s: hsla.s as number, 
    l: hsla.l as number, 
    a: hsla.a as number 
  };
}

// Utility types for working with branded types
export type ColorValue = RGBValue | HueValue | PercentValue | AlphaValue | LabLightness | LabColorValue;
export type BrandedColor = BrandedRGB | BrandedRGBA | BrandedHSL | BrandedHSLA | BrandedHSB | BrandedCMYK | BrandedLAB | BrandedXYZ;

// Configuration type for enabling/disabling branded type validation
export interface TypeSafetyConfig {
  enableBrandedTypes: boolean;
  enableRuntimeValidation: boolean;
  strictMode: boolean;
}

export const DEFAULT_TYPE_SAFETY_CONFIG: TypeSafetyConfig = {
  enableBrandedTypes: true,
  enableRuntimeValidation: true,
  strictMode: false // Can be enabled for extra strict validation
};