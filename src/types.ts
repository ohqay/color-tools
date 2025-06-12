export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsv' | 'cmyk' | 'lab' | 'xyz';

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface RGBA extends RGB {
  a: number; // 0-1
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

export interface HSLA extends HSL {
  a: number; // 0-1
}

export interface HSB {
  h: number; // 0-360
  s: number; // 0-100
  b: number; // 0-100
}

export interface CMYK {
  c: number; // 0-100
  m: number; // 0-100
  y: number; // 0-100
  k: number; // 0-100
}

export interface LAB {
  l: number; // L* (lightness) 0-100
  a: number; // a* (green-red) typically -128 to 127
  b: number; // b* (blue-yellow) typically -128 to 127
}

export interface XYZ {
  x: number; // X tristimulus value (0-95.047 for D65)
  y: number; // Y tristimulus value (0-100 for D65)
  z: number; // Z tristimulus value (0-108.883 for D65)
}

export interface ConversionResult {
  hex?: string;
  rgb?: string;
  rgba?: string;
  hsl?: string;
  hsla?: string;
  hsb?: string;
  hsv?: string;
  cmyk?: string;
  lab?: string;
  xyz?: string;
  rawValues?: {
    rgb?: RGB;
    rgba?: RGBA;
    hsl?: HSL;
    hsla?: HSLA;
    hsb?: HSB;
    cmyk?: CMYK;
    lab?: LAB;
    xyz?: XYZ;
  };
}

export type HSV = HSB; // HSV and HSB are the same

// Color harmony types
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

// Blend modes for color mixing
export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay';

// Color mixing result
export interface MixResult extends ConversionResult {
  mixRatio?: number;
  mode?: BlendMode;
}