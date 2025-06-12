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
import { ColorFormat } from './types.js';
import { HarmonyType, HarmonyOptions } from './colorHarmony.js';
import { ColorBlindnessType } from './colorBlindness.js';

// Lazy imports - only load when needed
let ColorHarmony: any;
let checkContrast: any, findAccessibleColor: any, suggestAccessiblePairs: any;
let simulateColorBlindness: any, simulateAllColorBlindness: any, colorBlindnessInfo: any;
let getAllPalettes: any, getPalette: any;
let webSafeColorsResource: any;
let namedColorsResource: any;

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
const getHarmonyDescription = (harmonyType: HarmonyType): string => harmonyDescriptions[harmonyType] || '';

const formatJSON = (obj: any): string => JSON.stringify(obj, null, JSON_INDENT);

const createErrorResponse = (error: unknown, hint: string) => ({
  content: [{
    type: 'text' as const,
    text: formatJSON({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      hint,
    }),
  }],
});

const createSuccessResponse = (data: any) => ({
  content: [{
    type: 'text' as const,
    text: formatJSON(data),
  }],
});

// Validation helpers
const validateColorInput = (color: string | undefined, fieldName: string): void => {
  if (!color || typeof color !== 'string') {
    throw new Error(`${fieldName} is required`);
  }
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
              description: 'Target format(s) to convert to. If not specified, converts to all formats.',
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
              description: 'Output format for the mixed color. If not specified, returns all formats.',
            },
          },
          required: ['color1', 'color2'],
        },
      },
    ],
  };
});

// Optimized tool handlers
const handleConvertcolor = async (args: any) => {
  const { input, from, to } = args as { input: string; from?: ColorFormat; to?: ColorFormat[] };
  
  validateColorInput(input, 'Input color value');
  
  const result = ColorConverter.convert(input, from, to);
  const response: Record<string, any> = { success: true, input };
  
  // Add detected format if not specified
  if (!from) {
    const detectedFormat = ColorConverter.detectFormat(input);
    if (detectedFormat) response.detectedFormat = detectedFormat;
  }
  
  // Efficiently copy results without multiple property checks
  Object.assign(response, result);
  
  return createSuccessResponse(response);
};

const handleGenerateHarmony = async (args: any) => {
  const { baseColor, harmonyType, outputFormat, options } = args as {
    baseColor: string;
    harmonyType: HarmonyType;
    outputFormat?: ColorFormat;
    options?: HarmonyOptions;
  };
  
  validateColorInput(baseColor, 'Base color');
  if (!harmonyType) throw new Error('Harmony type is required');
  
  const ColorHarmonyClass = await loadColorHarmony();
  const result = ColorHarmonyClass.generateHarmony(
    baseColor,
    harmonyType,
    outputFormat || 'hex',
    options || {}
  );
  
  const response = {
    success: true,
    input: baseColor,
    harmonyType,
    outputFormat: outputFormat || 'hex',
    result: {
      baseColor: result.baseColor,
      colors: result.colors,
      colorCount: result.colors.length,
      description: getHarmonyDescription(harmonyType),
      ...(result.rawValues && {
        rawHSLValues: result.rawValues.map((hsl: any) => ({
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
        }))
      })
    },
  };
  
  return createSuccessResponse(response);
};

const handleCheckContrast = async (args: any) => {
  const { foreground, background } = args as { foreground: string; background: string };
  
  validateColorInput(foreground, 'Foreground color');
  validateColorInput(background, 'Background color');
  
  const { checkContrast: checkContrastFn } = await loadAccessibilityFunctions();
  const result = checkContrastFn(foreground, background);
  
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

const handleSimulateColorblind = async (args: any) => {
  const { color, type } = args as { color: string; type?: ColorBlindnessType };
  
  validateColorInput(color, 'Color');
  
  const { simulateColorBlindness: simulateFn, simulateAllColorBlindness: simulateAllFn, colorBlindnessInfo: infoMap } = await loadColorBlindnessFunctions();
  
  if (type) {
    const simulated = simulateFn(color, type);
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
    const allSimulations = simulateAllFn(color);
    
    const response = {
      success: true,
      originalColor: color,
      simulations: Object.entries(allSimulations).map(([type, data]: [string, any]) => ({
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

const handleFindAccessibleColor = async (args: any) => {
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
  
  const { findAccessibleColor: findFn, suggestAccessiblePairs: suggestFn } = await loadAccessibilityFunctions();
  const result = findFn(targetColor, backgroundColor, options);
  
  if (!result) {
    throw new Error('Could not find an accessible color alternative');
  }
  
  const suggestions = suggestFn(targetColor, 3);
  
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
      targetContrast: options?.targetContrast || 4.5,
      maintainHue: options?.maintainHue !== false,
      preferDarker: options?.preferDarker,
    },
    additionalSuggestions: suggestions.map((s: any) => ({
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

const handleMixColors = async (args: any) => {
  const { color1, color2, ratio, mode, outputFormat } = args as {
    color1: string;
    color2: string;
    ratio?: number;
    mode?: 'normal' | 'multiply' | 'screen' | 'overlay';
    outputFormat?: ColorFormat;
  };
  
  validateColorInput(color1, 'First color');
  validateColorInput(color2, 'Second color');
  
  const result = ColorConverter.mixColors(
    color1,
    color2,
    ratio ?? 0.5,
    mode ?? 'normal'
  );
  
  const response: Record<string, any> = {
    success: true,
    color1,
    color2,
    mixRatio: result.mixRatio,
    blendMode: result.mode,
    blendModeDescription: blendModeDescriptions[mode ?? 'normal'],
  };
  
  // Add specific format or all formats
  response.result = outputFormat ? result[outputFormat] : { ...result };
  
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
      case 'color-info':
        return handleColorInfo();
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorHints: Record<string, string> = {
      'convert-color': 'Please provide a valid color in one of these formats: #RRGGBB, rgb(r,g,b), rgba(r,g,b,a), hsl(h,s%,l%), hsla(h,s%,l%,a), hsb(h,s%,b%), cmyk(c%,m%,y%,k%), or CSS color names (e.g., "red", "blue")',
      'generate-harmony': 'Please provide a valid base color and harmony type. Supported harmony types: complementary, analogous, triadic, tetradic, split-complementary, double-complementary',
      'check-contrast': 'Please provide valid foreground and background colors in any supported format',
      'simulate-colorblind': 'Please provide a valid color in any supported format',
      'find-accessible-color': 'Please provide valid target and background colors in any supported format',
      'mix-colors': 'Please provide two valid colors in any supported format',
    };
    
    return createErrorResponse(error, errorHints[name] || 'Please check your input parameters');
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
      description: 'Convert hex to all formats',
      input: { input: '#D4C7BA' },
      output: 'Returns hex, rgb, hsl, hsb, and cmyk values'
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
            text: resourceCache.get(uri)!,
          },
        ],
      };
    }

    let content: string;

    // Handle color-palettes resource
    if (uri === 'color-palettes') {
      const { getAllPalettes: getAllPalettesFn } = await loadPaletteFunctions();
      const palettes = getAllPalettesFn();
      const paletteInfo = {
        palettes: palettes.map((p: any) => ({
          id: p.name.toLowerCase().replace(/\s+/g, '-'),
          name: p.name,
          description: p.description,
          version: p.version,
          colorCount: p.colors.length,
          uri: `palette://${p.name.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      };
      content = formatJSON(paletteInfo);
    }
    // Handle specific palette resources
    else if (uri.startsWith('palette://')) {
      const paletteName = uri.replace('palette://', '');
      const { getPalette: getPaletteFn } = await loadPaletteFunctions();
      const palette = getPaletteFn(paletteName);
      
      if (!palette) {
        throw new Error(`Palette not found: ${paletteName}`);
      }
      content = formatJSON(palette);
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
      throw new Error(`Unknown resource: ${uri}`);
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
    throw new Error(`Failed to read resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Remove console.error to avoid interfering with protocol
}

main().catch((error) => {
  // Only log critical errors that prevent server startup
  // These will be captured by the host application
  process.exit(1);
});