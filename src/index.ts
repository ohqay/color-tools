#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ColorConverter } from './colorConverter.js';
import { ColorFormat } from './types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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