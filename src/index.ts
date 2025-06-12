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
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getAllPalettes, getPalette } from './resources/palettes.js';
import { webSafeColorsResource } from './resources/webSafeColors.js';
import { namedColorsResource } from './resources/namedColorsCategories.js';

// Get package version dynamically
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION = packageJson.version;

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
        'Detailed validation with helpful error messages'
      ],
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