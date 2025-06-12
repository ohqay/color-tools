/**
 * Optimized mathematical operations with pre-computed lookup tables
 */

// Pre-computed gamma correction lookup tables for performance
class GammaLookupTable {
  private forwardTable: Float32Array;
  private inverseTable: Float32Array;
  private readonly tableSize = 4096; // Higher resolution for better accuracy

  constructor() {
    this.forwardTable = new Float32Array(this.tableSize);
    this.inverseTable = new Float32Array(this.tableSize);
    this.generateTables();
  }

  private generateTables(): void {
    // Pre-compute gamma correction values
    for (let i = 0; i < this.tableSize; i++) {
      const value = i / (this.tableSize - 1);
      
      // Forward gamma correction (linear to sRGB)
      this.forwardTable[i] = value > 0.0031308
        ? 1.055 * Math.pow(value, 1/2.4) - 0.055
        : 12.92 * value;
      
      // Inverse gamma correction (sRGB to linear)
      this.inverseTable[i] = value > 0.04045
        ? Math.pow((value + 0.055) / 1.055, 2.4)
        : value / 12.92;
    }
  }

  applyGammaCorrection(value: number): number {
    const clampedValue = Math.max(0, Math.min(1, value));
    const index = Math.floor(clampedValue * (this.tableSize - 1));
    return this.forwardTable[index];
  }

  removeGammaCorrection(value: number): number {
    const clampedValue = Math.max(0, Math.min(1, value));
    const index = Math.floor(clampedValue * (this.tableSize - 1));
    return this.inverseTable[index];
  }
}

// Pre-computed LAB conversion lookup tables
class LabLookupTable {
  private forwardTable: Float32Array;
  private inverseTable: Float32Array;
  private readonly tableSize = 2048;

  constructor() {
    this.forwardTable = new Float32Array(this.tableSize);
    this.inverseTable = new Float32Array(this.tableSize);
    this.generateTables();
  }

  private generateTables(): void {
    for (let i = 0; i < this.tableSize; i++) {
      const t = i / (this.tableSize - 1);
      
      // Forward LAB function
      this.forwardTable[i] = t > 0.008856
        ? Math.pow(t, 1/3)
        : (7.787 * t + 16/116);
      
      // Inverse LAB function
      const cubed = t * t * t;
      this.inverseTable[i] = cubed > 0.008856
        ? cubed
        : (t - 16/116) / 7.787;
    }
  }

  labFunction(t: number): number {
    const clampedValue = Math.max(0, Math.min(1, t));
    const index = Math.floor(clampedValue * (this.tableSize - 1));
    return this.forwardTable[index];
  }

  inverseLabFunction(t: number): number {
    const clampedValue = Math.max(0, Math.min(1, t));
    const index = Math.floor(clampedValue * (this.tableSize - 1));
    return this.inverseTable[index];
  }
}

// Trigonometric lookup tables for HSL/HSB conversions
class TrigLookupTable {
  private sinTable: Float32Array;
  private cosTable: Float32Array;
  private readonly degreesPerStep = 0.1; // 0.1 degree precision
  private readonly tableSize = Math.ceil(360 / this.degreesPerStep);

  constructor() {
    this.sinTable = new Float32Array(this.tableSize);
    this.cosTable = new Float32Array(this.tableSize);
    this.generateTables();
  }

  private generateTables(): void {
    for (let i = 0; i < this.tableSize; i++) {
      const angle = (i * this.degreesPerStep) * Math.PI / 180;
      this.sinTable[i] = Math.sin(angle);
      this.cosTable[i] = Math.cos(angle);
    }
  }

  sin(degrees: number): number {
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.floor(normalizedDegrees / this.degreesPerStep);
    return this.sinTable[Math.min(index, this.tableSize - 1)];
  }

  cos(degrees: number): number {
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const index = Math.floor(normalizedDegrees / this.degreesPerStep);
    return this.cosTable[Math.min(index, this.tableSize - 1)];
  }
}

// Optimized color space transformation matrices (pre-computed)
export const COLOR_MATRICES = {
  // sRGB to XYZ (D65 illuminant)
  SRGB_TO_XYZ: new Float32Array([
    0.4124564, 0.3575761, 0.1804375,
    0.2126729, 0.7151522, 0.0721750,
    0.0193339, 0.1191920, 0.9503041
  ]),
  
  // XYZ to sRGB
  XYZ_TO_SRGB: new Float32Array([
    3.2404542, -1.5371385, -0.4985314,
    -0.9692660, 1.8760108, 0.0415560,
    0.0556434, -0.2040259, 1.0572252
  ])
};

// D65 reference white point
export const D65_WHITE = {
  x: 95.047,
  y: 100.000,
  z: 108.883
};

// Initialize lookup tables
const gammaTable = new GammaLookupTable();
const labTable = new LabLookupTable();
const trigTable = new TrigLookupTable();

// Exported optimized functions
export const OptimizedMath = {
  // Gamma correction functions using lookup tables
  applyGammaCorrection: (value: number): number => gammaTable.applyGammaCorrection(value),
  removeGammaCorrection: (value: number): number => gammaTable.removeGammaCorrection(value),
  
  // LAB conversion functions using lookup tables
  labFunction: (t: number): number => labTable.labFunction(t),
  inverseLabFunction: (t: number): number => labTable.inverseLabFunction(t),
  
  // Trigonometric functions using lookup tables
  sinDegrees: (degrees: number): number => trigTable.sin(degrees),
  cosDegrees: (degrees: number): number => trigTable.cos(degrees),
  
  // Fast matrix multiplication for 3x3 * 3x1
  matrixTransform3x3: (matrix: Float32Array, vector: [number, number, number]): [number, number, number] => {
    return [
      (matrix[0] ?? 0) * vector[0] + (matrix[1] ?? 0) * vector[1] + (matrix[2] ?? 0) * vector[2],
      (matrix[3] ?? 0) * vector[0] + (matrix[4] ?? 0) * vector[1] + (matrix[5] ?? 0) * vector[2],
      (matrix[6] ?? 0) * vector[0] + (matrix[7] ?? 0) * vector[1] + (matrix[8] ?? 0) * vector[2]
    ];
  },
  
  // Fast clamping functions
  clamp: (value: number, min: number, max: number): number => {
    return value < min ? min : value > max ? max : value;
  },
  
  clamp01: (value: number): number => {
    return value < 0 ? 0 : value > 1 ? 1 : value;
  },
  
  clamp255: (value: number): number => {
    return Math.round(value < 0 ? 0 : value > 255 ? 255 : value);
  },
  
  // Fast modulo for positive numbers
  fastMod360: (degrees: number): number => {
    while (degrees < 0) {degrees += 360;}
    while (degrees >= 360) {degrees -= 360;}
    return degrees;
  },
  
  // Optimized linear interpolation
  lerp: (a: number, b: number, t: number): number => {
    return a + (b - a) * t;
  },
  
  // Fast distance calculation without sqrt for relative comparisons
  distanceSquared: (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number): number => {
    const dr = r1 - r2;
    const dg = g1 - g2;
    const db = b1 - b2;
    return dr * dr + dg * dg + db * db;
  },
  
  // Delta E calculation (simplified)
  deltaE: (lab1: [number, number, number], lab2: [number, number, number]): number => {
    const dl = lab1[0] - lab2[0];
    const da = lab1[1] - lab2[1];
    const db = lab1[2] - lab2[2];
    return Math.sqrt(dl * dl + da * da + db * db);
  },
  
  // Optimized hue calculations
  calculateHue: (r: number, g: number, b: number): number => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    if (delta === 0) {return 0;}
    
    let hue: number;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    
    hue *= 60;
    if (hue < 0) {hue += 360;}
    
    return hue;
  },
  
  // Optimized saturation and lightness calculations
  calculateSaturation: (max: number, min: number, lightness: number): number => {
    const delta = max - min;
    if (delta === 0) {return 0;}
    
    return lightness > 0.5
      ? delta / (2 - max - min)
      : delta / (max + min);
  },
  
  calculateLightness: (max: number, min: number): number => {
    return (max + min) / 2;
  }
};

// Pre-computed common color values for ultra-fast lookups
export const COMMON_COLORS = new Map([
  ['#000000', { r: 0, g: 0, b: 0 }],
  ['#ffffff', { r: 255, g: 255, b: 255 }],
  ['#ff0000', { r: 255, g: 0, b: 0 }],
  ['#00ff00', { r: 0, g: 255, b: 0 }],
  ['#0000ff', { r: 0, g: 0, b: 255 }],
  ['#ffff00', { r: 255, g: 255, b: 0 }],
  ['#ff00ff', { r: 255, g: 0, b: 255 }],
  ['#00ffff', { r: 0, g: 255, b: 255 }],
  ['#808080', { r: 128, g: 128, b: 128 }],
  ['#800000', { r: 128, g: 0, b: 0 }],
  ['#008000', { r: 0, g: 128, b: 0 }],
  ['#000080', { r: 0, g: 0, b: 128 }]
]);

// Export for testing and analysis
export const getTableSizes = () => ({
  gamma: gammaTable['tableSize'],
  lab: labTable['tableSize'],
  trig: trigTable['tableSize']
});

// Memory usage estimation
export const getMemoryUsage = () => {
  const gammaSize = gammaTable['forwardTable'].byteLength + gammaTable['inverseTable'].byteLength;
  const labSize = labTable['forwardTable'].byteLength + labTable['inverseTable'].byteLength;
  const trigSize = trigTable['sinTable'].byteLength + trigTable['cosTable'].byteLength;
  const matrixSize = COLOR_MATRICES.SRGB_TO_XYZ.byteLength + COLOR_MATRICES.XYZ_TO_SRGB.byteLength;
  
  return {
    gamma: gammaSize,
    lab: labSize,
    trig: trigSize,
    matrices: matrixSize,
    total: gammaSize + labSize + trigSize + matrixSize
  };
};