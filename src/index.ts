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
import { ColorHarmony, HarmonyType, HarmonyOptions } from './colorHarmony.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAllPalettes, getPalette } from './resources/palettes.js';
import { webSafeColorsResource } from './resources/webSafeColors.js';
import { namedColorsResource } from './resources/namedColorsCategories.js';
import { checkContrast, findAccessibleColor, suggestAccessiblePairs } from './colorAccessibility.js';
import { simulateColorBlindness, simulateAllColorBlindness, ColorBlindnessType, colorBlindnessInfo } from './colorBlindness.js';

// Get package version dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

// Helper function to get harmony description
function getHarmonyDescription(harmonyType: HarmonyType): string {
  const descriptions: Record<HarmonyType, string> = {
    'complementary': 'Two colors opposite each other on the color wheel, creating high contrast',
    'analogous': 'Colors adjacent to each other on the color wheel, creating harmonious and serene combinations',
    'triadic': 'Three colors evenly spaced around the color wheel (120° apart), offering vibrant yet balanced schemes',
    'tetradic': 'Four colors evenly spaced around the color wheel (90° apart), also known as square color scheme',
    'square': 'Four colors evenly spaced around the color wheel (90° apart), also known as tetradic',
    'split-complementary': 'Base color plus two colors adjacent to its complement, offering contrast with more nuance',
    'double-complementary': 'Two complementary color pairs forming a rectangle on the color wheel, providing rich color schemes',
  };
  return descriptions[harmonyType] || '';
}

// Create server instance
const server = new Server(
  {
    name: 'color-converter-mcp',
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
        name: 'convert-colour',
        description: `Convert colors between different formats (hex, RGB, HSL, HSB/HSV, CMYK) - v${VERSION}`,
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The color value to convert (e.g., "#D4C7BA", "rgb(212, 199, 186)", "hsl(30, 24%, 78%)")',
            },
            from: {
              type: 'string',
              enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk'],
              description: 'Source format (optional - will auto-detect if not specified)',
            },
            to: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk'],
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
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === 'convert-colour') {
    try {
      const { input, from, to } = request.params.arguments as {
        input: string;
        from?: ColorFormat;
        to?: ColorFormat[];
      };

      // Validate input
      if (!input || typeof input !== 'string') {
        throw new Error('Input color value is required');
      }

      // Perform conversion
      const result = ColorConverter.convert(input, from, to);

      // Format response
      const response: Record<string, any> = {
        success: true,
        input: input,
      };

      // Add detected format if not specified
      if (!from) {
        const detectedFormat = ColorConverter.detectFormat(input);
        if (detectedFormat) {
          response.detectedFormat = detectedFormat;
        }
      }

      // Add all conversion results
      if (result.hex) response.hex = result.hex;
      if (result.rgb) response.rgb = result.rgb;
      if (result.rgba) response.rgba = result.rgba;
      if (result.hsl) response.hsl = result.hsl;
      if (result.hsla) response.hsla = result.hsla;
      if (result.hsb) response.hsb = result.hsb;
      if (result.hsv) response.hsv = result.hsv;
      if (result.cmyk) response.cmyk = result.cmyk;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                hint: 'Please provide a valid color in one of these formats: #RRGGBB, rgb(r,g,b), rgba(r,g,b,a), hsl(h,s%,l%), hsla(h,s%,l%,a), hsb(h,s%,b%), cmyk(c%,m%,y%,k%), or CSS color names (e.g., "red", "blue")',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  if (request.params.name === 'generate-harmony') {
    try {
      const { baseColor, harmonyType, outputFormat, options } = request.params.arguments as {
        baseColor: string;
        harmonyType: HarmonyType;
        outputFormat?: ColorFormat;
        options?: HarmonyOptions;
      };

      // Validate input
      if (!baseColor || typeof baseColor !== 'string') {
        throw new Error('Base color is required');
      }

      if (!harmonyType) {
        throw new Error('Harmony type is required');
      }

      // Generate harmony
      const result = ColorHarmony.generateHarmony(
        baseColor,
        harmonyType,
        outputFormat || 'hex',
        options || {}
      );

      // Format response
      const response: any = {
        success: true,
        input: baseColor,
        harmonyType: harmonyType,
        outputFormat: outputFormat || 'hex',
        result: {
          baseColor: result.baseColor,
          colors: result.colors,
          colorCount: result.colors.length,
          description: getHarmonyDescription(harmonyType),
        },
      };

      // Add raw HSL values if available
      if (result.rawValues) {
        response.result.rawHSLValues = result.rawValues.map(hsl => ({
          h: hsl.h,
          s: hsl.s,
          l: hsl.l,
        }));
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                hint: 'Please provide a valid base color and harmony type. Supported harmony types: complementary, analogous, triadic, tetradic, split-complementary, double-complementary',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  if (request.params.name === 'color-info') {
    const info = {
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
        'Custom angle adjustments for fine-tuning harmonies'
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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }

  if (request.params.name === 'check-contrast') {
    try {
      const { foreground, background } = request.params.arguments as {
        foreground: string;
        background: string;
      };

      // Validate inputs
      if (!foreground || typeof foreground !== 'string') {
        throw new Error('Foreground color is required');
      }
      if (!background || typeof background !== 'string') {
        throw new Error('Background color is required');
      }

      // Check contrast
      const result = checkContrast(foreground, background);

      // Format response
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                hint: 'Please provide valid foreground and background colors in any supported format',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  if (request.params.name === 'simulate-colorblind') {
    try {
      const { color, type } = request.params.arguments as {
        color: string;
        type?: ColorBlindnessType;
      };

      // Validate input
      if (!color || typeof color !== 'string') {
        throw new Error('Color is required');
      }

      // Perform simulation
      if (type) {
        // Simulate specific type
        const simulated = simulateColorBlindness(color, type);
        const info = colorBlindnessInfo[type];

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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } else {
        // Simulate all types
        const allSimulations = simulateAllColorBlindness(color);
        
        const response = {
          success: true,
          originalColor: color,
          simulations: Object.entries(allSimulations).map(([type, data]) => ({
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

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                hint: 'Please provide a valid color in any supported format',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  if (request.params.name === 'find-accessible-color') {
    try {
      const { targetColor, backgroundColor, options } = request.params.arguments as {
        targetColor: string;
        backgroundColor: string;
        options?: {
          targetContrast?: number;
          maintainHue?: boolean;
          preferDarker?: boolean;
        };
      };

      // Validate inputs
      if (!targetColor || typeof targetColor !== 'string') {
        throw new Error('Target color is required');
      }
      if (!backgroundColor || typeof backgroundColor !== 'string') {
        throw new Error('Background color is required');
      }

      // Find accessible alternative
      const result = findAccessibleColor(targetColor, backgroundColor, options);

      if (!result) {
        throw new Error('Could not find an accessible color alternative');
      }

      // Also provide some alternative suggestions
      const suggestions = suggestAccessiblePairs(targetColor, 3);

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
        additionalSuggestions: suggestions.map(s => ({
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                hint: 'Please provide valid target and background colors in any supported format',
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Define the resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
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
});

// Handle resource reading
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  try {
    // Handle color-palettes resource
    if (uri === 'color-palettes') {
      const palettes = getAllPalettes();
      const paletteInfo = {
        palettes: palettes.map(p => ({
          id: p.name.toLowerCase().replace(/\s+/g, '-'),
          name: p.name,
          description: p.description,
          version: p.version,
          colorCount: p.colors.length,
          uri: `palette://${p.name.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      };

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(paletteInfo, null, 2),
          },
        ],
      };
    }

    // Handle specific palette resources
    if (uri.startsWith('palette://')) {
      const paletteName = uri.replace('palette://', '');
      const palette = getPalette(paletteName);
      
      if (!palette) {
        throw new Error(`Palette not found: ${paletteName}`);
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(palette, null, 2),
          },
        ],
      };
    }

    // Handle named colors resource
    if (uri === 'colors://named') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(namedColorsResource, null, 2),
          },
        ],
      };
    }

    // Handle web-safe colors resource
    if (uri === 'colors://web-safe') {
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(webSafeColorsResource, null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown resource: ${uri}`);
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