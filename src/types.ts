export type ColorFormat = 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsv' | 'cmyk';

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

export interface ConversionResult {
  hex?: string;
  rgb?: string;
  rgba?: string;
  hsl?: string;
  hsla?: string;
  hsb?: string;
  hsv?: string;
  cmyk?: string;
  rawValues?: {
    rgb?: RGB;
    rgba?: RGBA;
    hsl?: HSL;
    hsla?: HSLA;
    hsb?: HSB;
    cmyk?: CMYK;
  };
}

export type HSV = HSB; // HSV and HSB are the same