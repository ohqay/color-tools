#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ColorConverter } from './colorConverter.js';
import type { ColorFormat } from './types.js';
import type { HarmonyType, HarmonyOptions } from './colorHarmony.js';
import type { ColorBlindnessType } from './colorBlindness.js';
import { performanceMonitor, measureTime } from './core/monitoring/PerformanceMonitor.js';
import { 
  ColorError, 
  ColorErrorFactory,
  ColorErrorCode,
  errorHandler,
  safeExecute,
  safeExecuteAsync,
  validateColorInput as validateColor
} from './core/errors/ColorError.js';

// Type definitions for better type safety
interface ColorBlindnessSimulationData {
  info: {
    name: string;
    description: string;
    prevalence: string;
    severity: string;
  };
  simulated: {
    r: number;
    g: number;
    b: number;
  };
  hex: string;
}

interface TailwindResponseBase {
  success: boolean;
  input: string;
  operation: string;
  result?: Record<string, unknown>;
}

// Lazy imports - only load when needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ColorHarmony: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let checkContrast: any, findAccessibleColor: any, suggestAccessiblePairs: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let simulateColorBlindness: any, simulateAllColorBlindness: any, colorBlindnessInfo: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let getAllPalettes: any, getPalette: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let webSafeColorsResource: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let namedColorsResource: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let tailwindV4Palette: any, getTailwindV4Color: any, findTailwindV4ColorByHex: any, searchTailwindV4Colors: any, findTailwindV4ColorByHexWithSimilar: any;

// Pre-computed constants for performance
const VERSION = '1.0.0'; // Static version to avoid file system read
const JSON_INDENT = 2;

// Cached values
const harmonyDescriptions: Record<HarmonyType, string> = {
  'complementary': 'Two colors opposite each other on the color wheel, creating high contrast',
  'analogous': 'Colors adjacent to each other on the color wheel, creating harmonious and serene combinations',
  'triadic': 'Three colors evenly spaced around the color wheel (120° apart), offering vibrant yet balanced schemes',
  'tetradic': 'Four colors evenly spaced around the color wheel (90° apart), also known as square color scheme',
  'square': 'Four colors evenly spaced around the color wheel (90° apart), also known as tetradic',
  'split-complementary': 'Base color plus two colors adjacent to its complement, offering contrast with more nuance',
  'double-complementary': 'Two complementary color pairs forming a rectangle on the color wheel, providing rich color schemes',
};

const blendModeDescriptions: Record<string, string> = {
  normal: 'Mixed in LAB color space for perceptually uniform blending',
  multiply: 'Darkens by multiplying color values',
  screen: 'Lightens by inverting, multiplying, and inverting again',
  overlay: 'Combines multiply and screen based on base color',
};

// Optimized helper functions
const getHarmonyDescription = (harmonyType: HarmonyType): string => harmonyDescriptions[harmonyType] ?? '';

const formatJSON = (obj: unknown): string => JSON.stringify(obj, null, JSON_INDENT);

const createErrorResponse = (error: unknown, hint: string) => {
  // Handle ColorError instances specially
  if (error instanceof ColorError) {
    errorHandler.handle(error);
    
    // Format suggestions properly with bullet points and line breaks
    let formattedHint = hint;
    if (error.context.suggestions && error.context.suggestions.length > 0) {
      formattedHint = error.context.suggestions.length === 1 
        ? (error.context.suggestions[0] ?? hint)
        : `Try one of these options:\n${error.context.suggestions.map(s => `• ${s}`).join('\n')}`;
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: formatJSON({
          success: false,
          error: error.message,
          errorCode: error.code,
          context: error.context,
          suggestions: error.context.suggestions ?? [],
          hint: formattedHint,
          recoverable: error.recoverable
        }),
      }],
    };
  }
  
  // Handle regular errors
  return {
    content: [{
      type: 'text' as const,
      text: formatJSON({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        hint,
      }),
    }],
  };
};

const createSuccessResponse = (data: unknown) => ({
  content: [{
    type: 'text' as const,
    text: formatJSON(data),
  }],
});

// Validation helper is imported above

// Wrapper for MCP-specific validation
const validateColorInput = (color: string | undefined, fieldName: string): void => {
  if (!color || typeof color !== 'string') {
    throw ColorErrorFactory.missingParameter(fieldName, 'color-operation');
  }
  validateColor(color, fieldName);
};

// Lazy loaders
const loadColorHarmony = async () => {
  if (!ColorHarmony) {
    const module = await import('./colorHarmony.js');
    ColorHarmony = module.ColorHarmony;
  }
  return ColorHarmony;
};

const loadAccessibilityFunctions = async () => {
  if (!checkContrast) {
    const module = await import('./colorAccessibility.js');
    checkContrast = module.checkContrast;
    findAccessibleColor = module.findAccessibleColor;
    suggestAccessiblePairs = module.suggestAccessiblePairs;
  }
  return { checkContrast, findAccessibleColor, suggestAccessiblePairs };
};

const loadColorBlindnessFunctions = async () => {
  if (!simulateColorBlindness) {
    const module = await import('./colorBlindness.js');
    simulateColorBlindness = module.simulateColorBlindness;
    simulateAllColorBlindness = module.simulateAllColorBlindness;
    colorBlindnessInfo = module.colorBlindnessInfo;
  }
  return { simulateColorBlindness, simulateAllColorBlindness, colorBlindnessInfo };
};

const loadPaletteFunctions = async () => {
  if (!getAllPalettes) {
    const module = await import('./resources/palettes.js');
    getAllPalettes = module.getAllPalettes;
    getPalette = module.getPalette;
  }
  return { getAllPalettes, getPalette };
};

const loadResourceData = async () => {
  if (!webSafeColorsResource) {
    const [webSafe, namedColors] = await Promise.all([
      import('./resources/webSafeColors.js'),
      import('./resources/namedColorsCategories.js')
    ]);
    webSafeColorsResource = webSafe.webSafeColorsResource;
    namedColorsResource = namedColors.namedColorsResource;
  }
  return { webSafeColorsResource, namedColorsResource };
};

const loadTailwindV4Functions = async () => {
  if (!tailwindV4Palette) {
    const module = await import('./resources/tailwindV4Colors.js');
    tailwindV4Palette = module.tailwindV4Palette;
    getTailwindV4Color = module.getTailwindV4Color;
    findTailwindV4ColorByHex = module.findTailwindV4ColorByHex;
    searchTailwindV4Colors = module.searchTailwindV4Colors;
    findTailwindV4ColorByHexWithSimilar = module.findTailwindV4ColorByHexWithSimilar;
  }
  return { tailwindV4Palette, getTailwindV4Color, findTailwindV4ColorByHex, searchTailwindV4Colors, findTailwindV4ColorByHexWithSimilar };
};

// Create server instance
const server = new Server(
  {
    name: 'color-tools',
    version: VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Define the tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'convert-color',
        description: `Convert colors between different formats (hex, RGB, HSL, HSB/HSV, CMYK, LAB, XYZ) - v${VERSION}`,
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The color value to convert (e.g., "#D4C7BA", "rgb(212, 199, 186)", "hsl(30, 24%, 78%)")',
            },
            from: {
              type: 'string',
              enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk', 'lab', 'xyz'],
              description: 'Source format (optional - will auto-detect if not specified)',
            },
            to: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk', 'lab', 'xyz'],
              },
              description: 'Target format(s) to convert to. If not specified, returns common formats (hex, rgb, hsl).',
            },
          },
          required: ['input'],
        },
      },
      {
        name: 'color-info',
        description: 'Get information about the color converter server, supported formats, and examples',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'generate-harmony',
        description: 'Generate harmonious color schemes based on color theory principles',
        inputSchema: {
          type: 'object',
          properties: {
            baseColor: {
              type: 'string',
              description: 'The base color to generate harmonies from (any supported format)',
            },
            harmonyType: {
              type: 'string',
              enum: ['complementary', 'analogous', 'triadic', 'tetradic', 'square', 'split-complementary', 'double-complementary'],
              description: 'Type of color harmony to generate',
            },
            outputFormat: {
              type: 'string',
              enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk'],
              description: 'Output format for the generated colors (default: hex)',
            },
            options: {
              type: 'object',
              properties: {
                angleAdjustment: {
                  type: 'number',
                  description: 'Custom angle adjustment for fine-tuning harmony colors',
                },
                analogousCount: {
                  type: 'number',
                  description: 'Number of colors to generate for analogous harmony (default: 3)',
                },
                analogousAngle: {
                  type: 'number',
                  description: 'Angle between analogous colors (default: 30)',
                },
              },
              description: 'Additional options for harmony generation',
            },
          },
          required: ['baseColor', 'harmonyType'],
        },
      },
      {
        name: 'check-contrast',
        description: 'Calculate WCAG contrast ratio between two colors and check accessibility compliance',
        inputSchema: {
          type: 'object',
          properties: {
            foreground: {
              type: 'string',
              description: 'The foreground/text color (any supported format)',
            },
            background: {
              type: 'string',
              description: 'The background color (any supported format)',
            },
          },
          required: ['foreground', 'background'],
        },
      },
      {
        name: 'simulate-colorblind',
        description: 'Simulate how a color appears to people with different types of color blindness',
        inputSchema: {
          type: 'object',
          properties: {
            color: {
              type: 'string',
              description: 'The color to simulate (any supported format)',
            },
            type: {
              type: 'string',
              enum: ['protanopia', 'protanomaly', 'deuteranopia', 'deuteranomaly', 'tritanopia', 'tritanomaly', 'achromatopsia', 'achromatomaly'],
              description: 'Type of color blindness to simulate. If not specified, simulates all types.',
            },
          },
          required: ['color'],
        },
      },
      {
        name: 'find-accessible-color',
        description: 'Find an accessible alternative to a given color that meets WCAG contrast requirements',
        inputSchema: {
          type: 'object',
          properties: {
            targetColor: {
              type: 'string',
              description: 'The color to find an alternative for (any supported format)',
            },
            backgroundColor: {
              type: 'string',
              description: 'The background color to ensure contrast against (any supported format)',
            },
            options: {
              type: 'object',
              properties: {
                targetContrast: {
                  type: 'number',
                  description: 'Target contrast ratio (default: 4.5 for WCAG AA)',
                },
                maintainHue: {
                  type: 'boolean',
                  description: 'Try to maintain the original hue (default: true)',
                },
                preferDarker: {
                  type: 'boolean',
                  description: 'Prefer darker alternatives (default: auto-determined based on background)',
                },
              },
              description: 'Additional options for finding accessible alternatives',
            },
          },
          required: ['targetColor', 'backgroundColor'],
        },
      },
      {
        name: 'mix-colors',
        description: 'Mix two colors using different blend modes. Normal mode mixes in LAB space for perceptually uniform results.',
        inputSchema: {
          type: 'object',
          properties: {
            color1: {
              type: 'string',
              description: 'First color to mix (any supported format)',
            },
            color2: {
              type: 'string',
              description: 'Second color to mix (any supported format)',
            },
            ratio: {
              type: 'number',
              description: 'Mix ratio (0-1). 0 = 100% color1, 1 = 100% color2, 0.5 = 50/50 mix. Default: 0.5',
              minimum: 0,
              maximum: 1,
            },
            mode: {
              type: 'string',
              enum: ['normal', 'multiply', 'screen', 'overlay'],
              description: 'Blend mode. Normal uses LAB space for perceptual uniformity. Default: normal',
            },
            outputFormat: {
              type: 'string',
              enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk', 'lab', 'xyz'],
              description: 'Output format for the mixed color. If not specified, returns common formats (hex, rgb, hsl).',
            },
          },
          required: ['color1', 'color2'],
        },
      },
      {
        name: 'convert-tailwind-color',
        description: 'Convert between Tailwind CSS V4 color names and other color formats. Find Tailwind colors by hex value or search by name.',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The input to convert. Can be a Tailwind color name (e.g., "blue-500"), hex value (e.g., "#3b82f6"), or search query',
            },
            operation: {
              type: 'string',
              enum: ['to-hex', 'from-hex', 'search', 'get-color', 'get-all-shades', 'find-similar'],
              description: 'Operation to perform: to-hex (convert Tailwind name to hex), from-hex (find exact Tailwind name by hex), search (search colors), get-color (get specific color), get-all-shades (get all shades of a color), find-similar (find closest matching colors for any hex value)',
            },
            outputFormat: {
              type: 'string',
              enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk'],
              description: 'Output format for color values (default: hex)',
            },
          },
          required: ['input', 'operation'],
        },
      },
    ],
  };
});

// Optimized tool handlers
const handleConvertcolor = async (args: unknown) => {
  const { input, from, to } = args as { input: string; from?: ColorFormat; to?: ColorFormat[] };
  
  validateColorInput(input, 'Input color value');
  
  // Implement intelligent defaults at the MCP tool level
  const intelligentDefaults: ColorFormat[] = ['hex', 'rgb', 'hsl'];
  const targetFormats = to ?? intelligentDefaults;
  
  const { result, duration } = measureTime(() => {
    try {
      return ColorConverter.convert(input, from, targetFormats);
    } catch (error) {
      // Re-throw ColorError instances to preserve context
      if (error instanceof ColorError) {throw error;}
      throw ColorErrorFactory.conversionFailed(
        from ?? 'auto-detected',
        targetFormats.join(', '),
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  });
  
  // Record performance metrics
  performanceMonitor.recordOperation('convert-color', duration, {
    inputFormat: from ?? undefined,
    outputFormats: to ?? undefined,
    cacheHit: false // Basic assumption, could be enhanced with actual cache hit detection
  });
  
  const response: Record<string, unknown> = { success: true, input };
  
  // Add detected format if not specified
  if (!from) {
    const detectedFormat = ColorConverter.detectFormat(input);
    if (detectedFormat) {response['detectedFormat'] = detectedFormat;}
  }
  
  // Efficiently copy results without multiple property checks
  Object.assign(response, result);
  
  return createSuccessResponse(response);
};

const handleGenerateHarmony = async (args: unknown) => {
  const { baseColor, harmonyType, outputFormat, options } = args as {
    baseColor: string;
    harmonyType: HarmonyType;
    outputFormat?: ColorFormat;
    options?: HarmonyOptions;
  };
  
  validateColorInput(baseColor, 'Base color');
  if (!harmonyType) {
    throw ColorErrorFactory.missingParameter('harmonyType', 'generate-harmony');
  }
  
  const ColorHarmonyClass = await loadColorHarmony();
  const result = await safeExecuteAsync(
    async () => ColorHarmonyClass.generateHarmony(
      baseColor,
      harmonyType,
      outputFormat ?? 'hex',
      options ?? {}
    ),
    undefined,
    { operation: 'generateHarmony', input: baseColor, format: harmonyType }
  );
  
  if (!result) {
    throw ColorErrorFactory.harmonyGenerationFailed(baseColor, harmonyType, 'Failed to generate harmony');
  }
  
  const response = {
    success: true,
    input: baseColor,
    harmonyType,
    outputFormat: outputFormat ?? 'hex',
    result: {
      baseColor: result.baseColor,
      colors: result.colors,
      colorCount: result.colors.length,
      description: getHarmonyDescription(harmonyType),
      ...(result.rawValues && {
        rawHSLValues: result.rawValues.map((hsl: { h: number; s: number; l: number }) => ({
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
        }))
      })
    },
  };
  
  return createSuccessResponse(response);
};

const handleCheckContrast = async (args: unknown) => {
  const { foreground, background } = args as { foreground: string; background: string };
  
  validateColorInput(foreground, 'Foreground color');
  validateColorInput(background, 'Background color');
  
  const { checkContrast: checkContrastFn } = await loadAccessibilityFunctions();
  const result = await safeExecuteAsync(
    async () => checkContrastFn(foreground, background),
    undefined,
    { operation: 'checkContrast', input: `${foreground} vs ${background}` }
  );
  
  if (!result) {
    throw new ColorError(
      ColorErrorCode.CONTRAST_CALCULATION_FAILED,
      'Failed to calculate contrast ratio',
      { operation: 'checkContrast', metadata: { foreground, background } }
    );
  }
  
  const response = {
    success: true,
    foreground,
    background,
    contrastRatio: result.ratio,
    wcagCompliance: {
      AA: {
        normalText: result.passes.aa.normal,
        largeText: result.passes.aa.large,
      },
      AAA: {
        normalText: result.passes.aaa.normal,
        largeText: result.passes.aaa.large,
      },
    },
    recommendation: result.recommendation,
    guidelines: {
      AA: {
        normalText: '4.5:1 minimum',
        largeText: '3:1 minimum (18pt or 14pt bold)',
      },
      AAA: {
        normalText: '7:1 minimum',
        largeText: '4.5:1 minimum',
      },
    },
  };
  
  return createSuccessResponse(response);
};

const handleSimulateColorblind = async (args: unknown) => {
  const { color, type } = args as { color: string; type?: ColorBlindnessType };
  
  validateColorInput(color, 'Color');
  
  const { simulateColorBlindness: simulateFn, simulateAllColorBlindness: simulateAllFn, colorBlindnessInfo: infoMap } = await loadColorBlindnessFunctions();
  
  const executeSimulation = async <T>(fn: () => T): Promise<T> => {
    const result = await safeExecuteAsync(
      async () => fn(),
      undefined,
      { operation: 'simulateColorBlindness', input: color }
    );
    if (!result) {
      throw new ColorError(
        ColorErrorCode.CONVERSION_FAILED,
        'Failed to simulate color blindness',
        { operation: 'simulateColorBlindness', input: color, metadata: { type } }
      );
    }
    return result;
  };
  
  if (type) {
    const simulated = await executeSimulation(() => simulateFn(color, type));
    const info = infoMap[type];
    
    const response = {
      success: true,
      originalColor: color,
      type,
      simulatedColor: {
        rgb: `rgb(${simulated.r}, ${simulated.g}, ${simulated.b})`,
        hex: ColorConverter.rgbToHex(simulated),
        raw: simulated,
      },
      info: {
        name: info.name,
        description: info.description,
        prevalence: info.prevalence,
        severity: info.severity,
      },
    };
    
    return createSuccessResponse(response);
  } else {
    const allSimulations = await executeSimulation(() => simulateAllFn(color));
    
    const response = {
      success: true,
      originalColor: color,
      simulations: (Object.entries(allSimulations) as [string, ColorBlindnessSimulationData][]).map(([type, data]) => ({
        type,
        name: data.info.name,
        simulatedColor: {
          rgb: `rgb(${data.simulated.r}, ${data.simulated.g}, ${data.simulated.b})`,
          hex: data.hex,
        },
        info: {
          description: data.info.description,
          prevalence: data.info.prevalence,
          severity: data.info.severity,
        },
      })),
    };
    
    return createSuccessResponse(response);
  }
};

const handleFindAccessibleColor = async (args: unknown) => {
  const { targetColor, backgroundColor, options } = args as {
    targetColor: string;
    backgroundColor: string;
    options?: {
      targetContrast?: number;
      maintainHue?: boolean;
      preferDarker?: boolean;
    };
  };
  
  validateColorInput(targetColor, 'Target color');
  validateColorInput(backgroundColor, 'Background color');
  
  // Validate targetContrast if provided
  if (options?.targetContrast !== undefined) {
    if (options.targetContrast < 1 || options.targetContrast > 21) {
      throw ColorErrorFactory.outOfRange(options.targetContrast, 1, 21, 'targetContrast');
    }
  }
  
  const { findAccessibleColor: findFn, suggestAccessiblePairs: suggestFn } = await loadAccessibilityFunctions();
  const result = await safeExecuteAsync(
    async () => findFn(targetColor, backgroundColor, options),
    undefined,
    { operation: 'findAccessibleColor', input: targetColor }
  );
  
  if (!result) {
    throw new ColorError(
      ColorErrorCode.COLOR_NOT_FOUND,
      'Could not find an accessible color alternative',
      { 
        operation: 'findAccessibleColor',
        input: targetColor,
        metadata: { backgroundColor, options }
      }
    );
  }
  
  const suggestions = await safeExecuteAsync(
    async () => suggestFn(targetColor, 3),
    [],
    { operation: 'suggestAccessiblePairs', input: targetColor }
  ) ?? [];
  
  const response = {
    success: true,
    originalColor: targetColor,
    backgroundColor,
    accessibleAlternative: {
      color: `rgb(${result.color.r}, ${result.color.g}, ${result.color.b})`,
      hex: result.hex,
      contrastRatio: Math.round(result.contrast * 100) / 100,
    },
    options: {
      targetContrast: options?.targetContrast ?? 4.5,
      maintainHue: options?.maintainHue !== false,
      preferDarker: options?.preferDarker,
    },
    additionalSuggestions: suggestions.map((s: { foreground: { hex: string }; background: { hex: string }; contrast: number; passes: { aa: { normal: boolean; large: boolean }; aaa: { normal: boolean; large: boolean } } }) => ({
      foreground: s.foreground.hex,
      background: s.background.hex,
      contrastRatio: s.contrast,
      passes: {
        AA: {
          normalText: s.passes.aa.normal,
          largeText: s.passes.aa.large,
        },
        AAA: {
          normalText: s.passes.aaa.normal,
          largeText: s.passes.aaa.large,
        },
      },
    })),
  };
  
  return createSuccessResponse(response);
};

const handleMixColors = async (args: unknown) => {
  const { color1, color2, ratio, mode, outputFormat } = args as {
    color1: string;
    color2: string;
    ratio?: number;
    mode?: 'normal' | 'multiply' | 'screen' | 'overlay';
    outputFormat?: ColorFormat;
  };
  
  validateColorInput(color1, 'First color');
  validateColorInput(color2, 'Second color');
  
  // Validate ratio parameter if provided
  if (ratio !== undefined && (ratio < 0 || ratio > 1)) {
    throw ColorErrorFactory.outOfRange(ratio, 0, 1, 'ratio');
  }
  
  const result = safeExecute(
    () => ColorConverter.mixColors(
      color1,
      color2,
      ratio ?? 0.5,
      mode ?? 'normal'
    ),
    undefined,
    { operation: 'mixColors', input: `${color1} + ${color2}` }
  );
  
  if (!result) {
    throw ColorErrorFactory.conversionFailed(
      'color mixing',
      'mixed result',
      'Failed to mix colors'
    );
  }
  
  const response: Record<string, unknown> = {
    success: true,
    color1,
    color2,
    mixRatio: result.mixRatio,
    blendMode: result.mode,
    blendModeDescription: blendModeDescriptions[mode ?? 'normal'],
  };
  
  // Add specific format or common formats (consistent with convert-color behavior)
  if (outputFormat) {
    response['result'] = result[outputFormat];
  } else {
    // Return common formats only (intelligent defaults)
    response['result'] = {
      hex: result.hex,
      rgb: result.rgb,
      hsl: result.hsl
    };
  }
  
  return createSuccessResponse(response);
};

const handleConvertTailwindColor = async (args: unknown) => {
  const { input, operation, outputFormat } = args as {
    input: string;
    operation: 'to-hex' | 'from-hex' | 'search' | 'get-color' | 'get-all-shades' | 'find-similar';
    outputFormat?: ColorFormat;
  };
  
  validateColorInput(input, 'Input');
  if (!operation) {
    throw ColorErrorFactory.missingParameter('operation', 'convert-tailwind-color');
  }
  
  const { getTailwindV4Color: getColorFn, findTailwindV4ColorByHex: findByHexFn, searchTailwindV4Colors: searchFn, findTailwindV4ColorByHexWithSimilar: findSimilarFn } = await loadTailwindV4Functions();
  
  const response: TailwindResponseBase = {
    success: true,
    input,
    operation,
  };
  
  switch (operation) {
    case 'to-hex':
    case 'get-color': {
      // Parse Tailwind color name like "blue-500" or just "blue"
      const parts = input.toLowerCase().split('-');
      const colorName = parts[0];
      if (!colorName) {
        throw new Error('Invalid Tailwind color format');
      }
      const shade = parts[1] ?? '500'; // Default to 500 if no shade specified
      
      const color = getColorFn(colorName);
      if (!color) {
        throw ColorErrorFactory.colorNotFound(colorName, 'Tailwind V4');
      }
      
      const colorShade = color.shades.find((s: { name: string; value: string }) => s.name === shade);
      if (!colorShade) {
        throw new ColorError(
          ColorErrorCode.COLOR_NOT_FOUND,
          `Shade ${shade} not found for color ${colorName}`,
          {
            operation: 'convert-tailwind-color',
            input: `${colorName}-${shade}`,
            suggestions: color.shades.map((s: { name: string }) => `Try ${colorName}-${s.name}`)
          }
        );
      }
      
      response['result'] = {
        tailwindName: `${colorName}-${shade}`,
        colorName,
        shade,
        value: colorShade.value,
      };
      
      // Convert to other formats if requested
      if (outputFormat && outputFormat !== 'hex') {
        const converted = ColorConverter.convert(colorShade.value, 'hex', [outputFormat]);
        response['result']['convertedValue'] = converted[outputFormat];
      }
      break;
    }
    
    case 'get-all-shades': {
      const colorName = input.toLowerCase();
      const color = getColorFn(colorName);
      if (!color) {
        throw ColorErrorFactory.colorNotFound(colorName, 'Tailwind V4');
      }
      
      response['result'] = {
        colorName,
        shades: color.shades.map((shade: { name: string; value: string }) => ({
          name: shade.name,
          tailwindName: `${colorName}-${shade.name}`,
          value: shade.value,
          ...(outputFormat && outputFormat !== 'hex' ? {
            convertedValue: ColorConverter.convert(shade.value, 'hex', [outputFormat])[outputFormat]
          } : {})
        }))
      };
      break;
    }
    
    case 'from-hex': {
      // Find exact Tailwind color by hex value
      const result = findByHexFn(input);
      if (!result) {
        // If no exact match, provide helpful message with suggestion to use find-similar
        throw new ColorError(
          ColorErrorCode.COLOR_NOT_FOUND,
          `No exact Tailwind color match found for hex value: ${input}`,
          {
            operation: 'convert-tailwind-color',
            input,
            suggestions: ['Use "find-similar" operation to find closest matches']
          }
        );
      }
      
      response['result'] = {
        hexValue: input,
        tailwindName: `${result.color}-${result.shade}`,
        colorName: result.color,
        shade: result.shade,
        exactMatch: true,
      };
      break;
    }
    
    case 'find-similar': {
      // Find closest matching Tailwind colors for any hex value
      const searchResult = findSimilarFn(input, 5); // Get top 5 matches
      
      if (searchResult.exactMatch && searchResult.result) {
        response['result'] = {
          hexValue: input,
          exactMatch: true,
          tailwindName: `${searchResult.result.color}-${searchResult.result.shade}`,
          colorName: searchResult.result.color,
          shade: searchResult.result.shade,
        };
      } else {
        response['result'] = {
          hexValue: input,
          exactMatch: false,
          closestMatches: searchResult.closestMatches?.map((match: { color: string; shade: string; value: string; distance: number }) => ({
            tailwindName: `${match.color}-${match.shade}`,
            colorName: match.color,
            shade: match.shade,
            value: match.value,
            distance: Math.round(match.distance * 100) / 100, // Round to 2 decimal places
            ...(outputFormat && outputFormat !== 'hex' ? {
              convertedValue: ColorConverter.convert(match.value, 'hex', [outputFormat])[outputFormat]
            } : {})
          })),
        };
      }
      break;
    }
    
    case 'search': {
      // Search for colors by name
      const results = searchFn(input);
      if (results.length === 0) {
        throw ColorErrorFactory.colorNotFound(input, 'Tailwind V4 search results');
      }
      
      response['result'] = {
        query: input,
        matches: results.slice(0, 20).map((result: { color: string; shade: string; value: string }) => ({ // Limit to 20 results
          tailwindName: `${result.color}-${result.shade}`,
          colorName: result.color,
          shade: result.shade,
          value: result.value,
          ...(outputFormat && outputFormat !== 'hex' ? {
            convertedValue: ColorConverter.convert(result.value, 'hex', [outputFormat])[outputFormat]
          } : {})
        })),
        totalMatches: results.length,
      };
      break;
    }
    
    default:
      throw new ColorError(
        ColorErrorCode.UNSUPPORTED_FORMAT,
        `Unknown operation: ${operation}`,
        {
          operation: 'convert-tailwind-color',
          format: operation,
          suggestions: ['Use one of: to-hex, from-hex, search, get-color, get-all-shades, find-similar']
        }
      );
  }
  
  return createSuccessResponse(response);
};


// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'convert-color':
        return await handleConvertcolor(args);
      case 'generate-harmony':
        return await handleGenerateHarmony(args);
      case 'check-contrast':
        return await handleCheckContrast(args);
      case 'simulate-colorblind':
        return await handleSimulateColorblind(args);
      case 'find-accessible-color':
        return await handleFindAccessibleColor(args);
      case 'mix-colors':
        return await handleMixColors(args);
      case 'convert-tailwind-color':
        return await handleConvertTailwindColor(args);
      case 'color-info':
        return handleColorInfo();
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorHints: Record<string, string> = {
      'convert-color': 'Provide a valid color in any supported format (hex, RGB, HSL, HSB, CMYK, LAB, XYZ, or CSS named colors)',
      'generate-harmony': 'Provide a valid base color and harmony type (complementary, analogous, triadic, tetradic, split-complementary, double-complementary)',
      'check-contrast': 'Provide valid foreground and background colors in any supported format',
      'simulate-colorblind': 'Provide a valid color in any supported format',
      'find-accessible-color': 'Provide valid target and background colors in any supported format',
      'mix-colors': 'Provide two valid colors in any supported format',
      'convert-tailwind-color': 'Refer to the operation-specific requirements in the tool description',
    };
    
    return createErrorResponse(error, errorHints[name] ?? 'Please check your input parameters');
  }
});

// Cached color info for better performance
const colorInfo = {
  name: 'Color Converter MCP Server',
  version: VERSION,
  description: 'Convert colors between different formats',
  supportedFormats: {
    hex: {
      name: 'Hexadecimal',
      examples: ['#RGB', '#RRGGBB', '#D4C7BA', '#FFF'],
      description: '3 or 6 digit hexadecimal color code'
    },
    rgb: {
      name: 'RGB',
      examples: ['rgb(255, 0, 0)', '255, 0, 0', 'rgb(212, 199, 186)'],
      description: 'Red, Green, Blue values (0-255)'
    },
    rgba: {
      name: 'RGBA',
      examples: ['rgba(255, 0, 0, 0.5)', 'rgba(212, 199, 186, 1)'],
      description: 'RGB with Alpha transparency (0-1)'
    },
    hsl: {
      name: 'HSL',
      examples: ['hsl(0, 100%, 50%)', 'hsl(30, 24%, 78%)'],
      description: 'Hue (0-360), Saturation (0-100%), Lightness (0-100%)'
    },
    hsla: {
      name: 'HSLA',
      examples: ['hsla(0, 100%, 50%, 0.5)', 'hsla(30, 24%, 78%, 1)'],
      description: 'HSL with Alpha transparency (0-1)'
    },
    hsb: {
      name: 'HSB/HSV',
      examples: ['hsb(240, 100%, 100%)', 'hsv(30, 12%, 83%)'],
      description: 'Hue (0-360), Saturation (0-100%), Brightness/Value (0-100%)'
    },
    cmyk: {
      name: 'CMYK',
      examples: ['cmyk(0%, 100%, 100%, 0%)', 'cmyk(0%, 6%, 12%, 17%)'],
      description: 'Cyan, Magenta, Yellow, Key/Black (0-100%)'
    },
    lab: {
      name: 'LAB',
      examples: ['lab(50%, 25, -50)', 'lab(53.24%, 80.09, 67.2)'],
      description: 'CIE LAB color space - L* (lightness 0-100%), a* (green-red), b* (blue-yellow)'
    },
    xyz: {
      name: 'XYZ',
      examples: ['xyz(41.24, 21.26, 1.93)', 'xyz(95.047, 100, 108.883)'],
      description: 'CIE XYZ tristimulus values based on D65 illuminant'
    }
  },
  features: [
    'Auto-detection of input color format',
    'Batch conversion to multiple formats',
    'Comprehensive error handling',
    'Support for common color format variations',
    'Support for CSS named colors (140+ colors)',
    'Alpha/transparency support (RGBA, HSLA)',
    'Detailed validation with helpful error messages',
    'Color harmony generation (complementary, analogous, triadic, etc.)',
    'Custom angle adjustments for fine-tuning harmonies',
    'LAB and XYZ color space support for scientific color representation',
    'Perceptually uniform color mixing in LAB space',
    'Multiple blend modes (normal, multiply, screen, overlay)'
  ],
  colorHarmonies: {
    complementary: 'Two colors opposite on the color wheel',
    analogous: 'Adjacent colors on the color wheel',
    triadic: 'Three colors evenly spaced (120° apart)',
    tetradic: 'Four colors evenly spaced (90° apart)',
    'split-complementary': 'Base color + two adjacent to complement',
    'double-complementary': 'Two complementary pairs'
  },
  usage: {
    example1: {
      description: 'Convert hex to common formats',
      input: { input: '#D4C7BA' },
      output: 'Returns hex, rgb, and hsl values (default behavior)'
    },
    example2: {
      description: 'Convert RGB to specific formats',
      input: { input: 'rgb(255, 0, 0)', to: ['hex', 'hsl'] },
      output: 'Returns only hex and hsl values'
    },
    example3: {
      description: 'Generate complementary harmony',
      input: { baseColor: '#FF6B6B', harmonyType: 'complementary' },
      output: 'Returns base color and its complement'
    },
    example4: {
      description: 'Generate triadic harmony with RGB output',
      input: { baseColor: '#4ECDC4', harmonyType: 'triadic', outputFormat: 'rgb' },
      output: 'Returns three evenly spaced colors in RGB format'
    },
    example5: {
      description: 'Convert to all available formats',
      input: { input: '#FF0000', to: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'cmyk', 'lab', 'xyz'] },
      output: 'Returns color in all 9 supported formats'
    }
  }
};

const handleColorInfo = () => createSuccessResponse(colorInfo);

// Cached resource list for performance
const resourceList = {
  resources: [
    {
      uri: 'color-palettes',
      name: 'Available Color Palettes',
      description: 'List of all available color palettes with their metadata',
      mimeType: 'application/json',
    },
    {
      uri: 'palette://material-design',
      name: 'Material Design Colors',
      description: 'Material Design color palette with all colors and shades',
      mimeType: 'application/json',
    },
    {
      uri: 'palette://tailwind',
      name: 'Tailwind CSS Colors',
      description: 'Tailwind CSS default color palette with extensive shades',
      mimeType: 'application/json',
    },
    {
      uri: 'palette://tailwind-v4',
      name: 'Tailwind CSS V4 Colors',
      description: 'Tailwind CSS v4.0 modernized P3 color palette using OKLCH color space',
      mimeType: 'application/json',
    },
    {
      uri: 'colors://named',
      name: 'CSS Named Colors',
      description: 'All CSS named colors organized by category',
      mimeType: 'application/json',
    },
    {
      uri: 'colors://web-safe',
      name: 'Web Safe Colors',
      description: '216 web-safe colors that display consistently across browsers',
      mimeType: 'application/json',
    },
  ],
};

// Define the resources with cached response
server.setRequestHandler(ListResourcesRequestSchema, async () => resourceList);

// Resource cache for better performance
const resourceCache = new Map<string, string>();

// Handle resource reading with optimized caching
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    // Check cache first
    if (resourceCache.has(uri)) {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: resourceCache.get(uri) as string,
          },
        ],
      };
    }

    let content: string;

    // Handle color-palettes resource
    if (uri === 'color-palettes') {
      const { getAllPalettes: getAllPalettesFn } = await loadPaletteFunctions();
      const { tailwindV4Palette: v4Palette } = await loadTailwindV4Functions();
      const palettes = getAllPalettesFn();
      
      const paletteInfo = {
        palettes: [
          ...palettes.map((p: { name: string; description: string; version: string; colors: unknown[] }) => ({
            id: p.name.toLowerCase().replace(/\s+/g, '-'),
            name: p.name,
            description: p.description,
            version: p.version,
            colorCount: p.colors.length,
            uri: `palette://${p.name.toLowerCase().replace(/\s+/g, '-')}`,
          })),
          {
            id: 'tailwind-v4',
            name: v4Palette.name,
            description: v4Palette.description,
            version: v4Palette.version,
            colorCount: v4Palette.colors.length,
            uri: 'palette://tailwind-v4',
            oklchBased: v4Palette.oklchBased,
          }
        ],
      };
      content = formatJSON(paletteInfo);
    }
    // Handle specific palette resources
    else if (uri.startsWith('palette://')) {
      const paletteName = uri.replace('palette://', '');
      
      if (paletteName === 'tailwind-v4') {
        const { tailwindV4Palette: v4Palette } = await loadTailwindV4Functions();
        content = formatJSON(v4Palette);
      } else {
        const { getPalette: getPaletteFn } = await loadPaletteFunctions();
        const palette = getPaletteFn(paletteName);
        
        if (!palette) {
          throw ColorErrorFactory.paletteNotFound(
            paletteName,
            await loadPaletteFunctions().then(({ getAllPalettes }) => 
              getAllPalettes().map((p: { name: string }) => p.name.toLowerCase().replace(/\s+/g, '-'))
            )
          );
        }
        content = formatJSON(palette);
      }
    }
    // Handle named colors resource
    else if (uri === 'colors://named') {
      const { namedColorsResource: namedColors } = await loadResourceData();
      content = formatJSON(namedColors);
    }
    // Handle web-safe colors resource
    else if (uri === 'colors://web-safe') {
      const { webSafeColorsResource: webSafeColors } = await loadResourceData();
      content = formatJSON(webSafeColors);
    }
    else {
      throw new ColorError(
        ColorErrorCode.RESOURCE_LOAD_FAILED,
        `Unknown resource: ${uri}`,
        {
          operation: 'readResource',
          input: uri,
          suggestions: [
            'Use one of the available resource URIs',
            'Check the resource list with ListResources'
          ]
        }
      );
    }

    // Cache the result
    resourceCache.set(uri, content);

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: content,
        },
      ],
    };
  } catch (error) {
    if (error instanceof ColorError) {throw error;}
    throw new ColorError(
      ColorErrorCode.RESOURCE_LOAD_FAILED,
      `Failed to read resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        operation: 'readResource',
        input: uri,
        metadata: { error: error instanceof Error ? error.message : String(error) }
      }
    );
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Remove console.error to avoid interfering with protocol
}

main().catch((_error) => {
  // Only log critical errors that prevent server startup
  // These will be captured by the host application
  process.exit(1);
});