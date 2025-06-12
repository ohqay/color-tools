#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ColorConverter } from './colorConverter.js';
import { ColorFormat } from './types.js';

// Create server instance
const server = new Server(
  {
    name: 'color-converter-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the convert-colour tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'convert-colour',
        description: 'Convert colors between different formats (hex, RGB, HSL, HSB/HSV, CMYK)',
        inputSchema: {
          type: 'object',
          properties: {
            input: {
              type: 'string',
              description: 'The color value to convert (e.g., "#D4C7BA", "rgb(212, 199, 186)", "hsl(30, 24%, 78%)")',
            },
            from: {
              type: 'string',
              enum: ['hex', 'rgb', 'hsl', 'hsb', 'hsv', 'cmyk'],
              description: 'Source format (optional - will auto-detect if not specified)',
            },
            to: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['hex', 'rgb', 'hsl', 'hsb', 'hsv', 'cmyk'],
              },
              description: 'Target format(s) to convert to. If not specified, converts to all formats.',
            },
          },
          required: ['input'],
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
      if (result.hsl) response.hsl = result.hsl;
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
                hint: 'Please provide a valid color in one of these formats: #RRGGBB, rgb(r,g,b), hsl(h,s%,l%), hsb(h,s%,b%), cmyk(c%,m%,y%,k%)',
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Color Converter MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});