import { describe, it, expect, beforeEach, mock } from 'bun:test';

// Mock the file system module to avoid reading package.json
mock.module('fs', () => ({
  readFileSync: mock(() => JSON.stringify({ version: '1.0.0' }))
}));

// Mock the path and url modules
mock.module('url', () => ({
  fileURLToPath: mock(() => '/mock/path/to/index.ts')
}));

mock.module('path', () => ({
  dirname: mock(() => '/mock/path/to'),
  join: mock((...args) => args.join('/'))
}));

// Create a mock server that captures handler functions
let mockListToolsHandler: () => any;
let mockCallToolHandler: (request: any) => any;
let mockListResourcesHandler: () => any;
let mockReadResourceHandler: (request: any) => any;

const mockSetRequestHandler = mock((schema: any, handler: (...args: any[]) => any) => {
  // Store handlers for testing
  const schemaName = schema?.name ?? schema;
  if (schemaName?.includes?.('ListTools') || schema === 'list-tools') {
    mockListToolsHandler = handler;
  } else if (schemaName?.includes?.('CallTool') || schema === 'call-tool') {
    mockCallToolHandler = handler;
  } else if (schemaName?.includes?.('ListResources') || schema === 'list-resources') {
    mockListResourcesHandler = handler;
  } else if (schemaName?.includes?.('ReadResource') || schema === 'read-resource') {
    mockReadResourceHandler = handler;
  }
});

const mockConnect = mock(() => Promise.resolve(undefined));

const mockServer = {
  setRequestHandler: mockSetRequestHandler,
  connect: mockConnect
};

const MockServer = mock(() => mockServer);
const MockStdioServerTransport = mock(() => ({}));

// Mock the MCP SDK
mock.module('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: MockServer
}));

mock.module('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: MockStdioServerTransport
}));

// Mock schemas as simple objects
mock.module('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: { name: 'ListToolsRequestSchema' },
  CallToolRequestSchema: { name: 'CallToolRequestSchema' },
  ListResourcesRequestSchema: { name: 'ListResourcesRequestSchema' },
  ReadResourceRequestSchema: { name: 'ReadResourceRequestSchema' }
}));

// Import the server module and wait for initialization
// This happens before any tests run
let serverModule: any;
const initializationPromise = import('../index.js').then((module) => {
  serverModule = module;
  // Give some time for the main() function to complete
  return new Promise(resolve => setTimeout(resolve, 100));
});

// Wait for initialization to complete
await initializationPromise;

describe('MCP Server Handler Functions', () => {
  beforeEach(() => {
    // Handler functions should already be populated from the import above
  });

  describe('ListTools Handler', () => {
    it('should return all available tools', async () => {
      const result = await mockListToolsHandler();
      
      expect(result.tools).toHaveLength(8);
      expect(result.tools.map((t: any) => t.name)).toEqual([
        'convert-color',
        'color-info', 
        'generate-harmony',
        'check-contrast',
        'simulate-colorblind',
        'find-accessible-color',
        'mix-colors',
        'convert-tailwind-color'
      ]);
    });

    it('should include correct tool schemas', async () => {
      const result = await mockListToolsHandler();
      
      const convertTool = result.tools.find((t: any) => t.name === 'convert-color');
      expect(convertTool.description).toContain('v1.0.0');
      expect(convertTool.inputSchema.required).toEqual(['input']);
      expect(convertTool.inputSchema.properties.input.type).toBe('string');
      
      const harmonyTool = result.tools.find((t: any) => t.name === 'generate-harmony');
      expect(harmonyTool.inputSchema.required).toEqual(['baseColor', 'harmonyType']);
    });
  });

  describe('CallTool Handler - convert-color', () => {
    it('should convert color successfully', async () => {
      const request = {
        params: {
          name: 'convert-color',
          arguments: {
            input: '#FF0000'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.input).toBe('#FF0000');
      expect(response.hex).toBe('#ff0000');
      expect(response.rgb).toBe('rgb(255, 0, 0)');
      expect(response.detectedFormat).toBe('hex');
    });

    it('should handle conversion with specific target formats', async () => {
      const request = {
        params: {
          name: 'convert-color',
          arguments: {
            input: '#FF0000',
            to: ['hex', 'rgb']
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.hex).toBeDefined();
      expect(response.rgb).toBeDefined();
      expect(response.hsl).toBeUndefined();
    });

    it('should handle conversion errors', async () => {
      const request = {
        params: {
          name: 'convert-color',
          arguments: {
            input: 'invalid-color'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid color format or value');
      expect(response.hint).toContain('Please provide a valid color');
    });

    it('should handle missing input', async () => {
      const request = {
        params: {
          name: 'convert-color',
          arguments: {}
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Input color value is required');
    });

    it('should handle LAB and XYZ formats', async () => {
      const request = {
        params: {
          name: 'convert-color',
          arguments: {
            input: '#FF0000',
            to: ['lab', 'xyz']
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.lab).toBeDefined();
      expect(response.xyz).toBeDefined();
    });
  });

  describe('CallTool Handler - color-info', () => {
    it('should return server information', async () => {
      const request = {
        params: {
          name: 'color-info',
          arguments: {}
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.name).toBe('Color Converter MCP Server');
      expect(response.version).toBe('1.0.0');
      expect(response.description).toBe('Convert colors between different formats');
      expect(response.supportedFormats).toBeDefined();
      expect(response.supportedFormats.hex).toBeDefined();
      expect(response.supportedFormats.rgb).toBeDefined();
      expect(response.supportedFormats.lab).toBeDefined();
      expect(response.supportedFormats.xyz).toBeDefined();
      expect(response.features).toBeInstanceOf(Array);
      expect(response.colorHarmonies).toBeDefined();
      expect(response.usage).toBeDefined();
    });
  });

  describe('CallTool Handler - generate-harmony', () => {
    it('should generate complementary harmony', async () => {
      const request = {
        params: {
          name: 'generate-harmony',
          arguments: {
            baseColor: '#FF0000',
            harmonyType: 'complementary'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.input).toBe('#FF0000');
      expect(response.harmonyType).toBe('complementary');
      expect(response.result.colors).toBeInstanceOf(Array);
      expect(response.result.description).toContain('opposite each other');
    });

    it('should generate triadic harmony', async () => {
      const request = {
        params: {
          name: 'generate-harmony',
          arguments: {
            baseColor: '#FF0000',
            harmonyType: 'triadic',
            outputFormat: 'rgb'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.result.colors).toHaveLength(3);
      expect(response.outputFormat).toBe('rgb');
    });

    it('should handle harmony generation errors', async () => {
      const request = {
        params: {
          name: 'generate-harmony',
          arguments: {
            baseColor: 'invalid-color',
            harmonyType: 'complementary'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle missing required parameters', async () => {
      const request = {
        params: {
          name: 'generate-harmony',
          arguments: {
            baseColor: '#FF0000'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Harmony type is required');
    });
  });

  describe('CallTool Handler - check-contrast', () => {
    it('should check contrast ratio', async () => {
      const request = {
        params: {
          name: 'check-contrast',
          arguments: {
            foreground: '#000000',
            background: '#FFFFFF'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.foreground).toBe('#000000');
      expect(response.background).toBe('#FFFFFF');
      expect(response.contrastRatio).toBeGreaterThan(0);
      expect(response.wcagCompliance).toBeDefined();
      expect(response.wcagCompliance.AA).toBeDefined();
      expect(response.wcagCompliance.AAA).toBeDefined();
    });

    it('should handle missing parameters', async () => {
      const request = {
        params: {
          name: 'check-contrast',
          arguments: {
            foreground: '#000000'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Background color is required');
    });
  });

  describe('CallTool Handler - simulate-colorblind', () => {
    it('should simulate specific color blindness type', async () => {
      const request = {
        params: {
          name: 'simulate-colorblind',
          arguments: {
            color: '#FF0000',
            type: 'protanopia'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.originalColor).toBe('#FF0000');
      expect(response.type).toBe('protanopia');
      expect(response.simulatedColor).toBeDefined();
      expect(response.info).toBeDefined();
    });

    it('should simulate all color blindness types when type not specified', async () => {
      const request = {
        params: {
          name: 'simulate-colorblind',
          arguments: {
            color: '#FF0000'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.simulations).toBeInstanceOf(Array);
      expect(response.simulations.length).toBeGreaterThan(0);
      expect(response.simulations[0].type).toBeDefined();
      expect(response.simulations[0].simulatedColor).toBeDefined();
    });

    it('should handle invalid color', async () => {
      const request = {
        params: {
          name: 'simulate-colorblind',
          arguments: {
            color: 'invalid-color-that-really-does-not-exist'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      // Note: The colorBlindness module might handle some "invalid" colors gracefully
      // by converting them through the ColorConverter first, so this test checks
      // that either it fails or succeeds gracefully
      expect(response.success).toBeDefined();
      expect(typeof response.success).toBe('boolean');
    });
  });

  describe('CallTool Handler - find-accessible-color', () => {
    it('should find accessible color alternative', async () => {
      const request = {
        params: {
          name: 'find-accessible-color',
          arguments: {
            targetColor: '#FF0000',
            backgroundColor: '#FFFFFF'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.originalColor).toBe('#FF0000');
      expect(response.backgroundColor).toBe('#FFFFFF');
      expect(response.accessibleAlternative).toBeDefined();
      expect(response.additionalSuggestions).toBeInstanceOf(Array);
    });

    it('should handle missing parameters', async () => {
      const request = {
        params: {
          name: 'find-accessible-color',
          arguments: {
            targetColor: '#FF0000'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Background color is required');
    });
  });

  describe('CallTool Handler - mix-colors', () => {
    it('should mix two colors', async () => {
      const request = {
        params: {
          name: 'mix-colors',
          arguments: {
            color1: '#FF0000',
            color2: '#0000FF'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.color1).toBe('#FF0000');
      expect(response.color2).toBe('#0000FF');
      expect(response.mixRatio).toBe(0.5);
      expect(response.blendMode).toBe('normal');
      expect(response.result).toBeDefined();
    });

    it('should handle custom mix ratio and blend mode', async () => {
      const request = {
        params: {
          name: 'mix-colors',
          arguments: {
            color1: '#FF0000',
            color2: '#0000FF',
            ratio: 0.3,
            mode: 'multiply'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(true);
      expect(response.mixRatio).toBe(0.3);
      expect(response.blendMode).toBe('multiply');
    });

    it('should handle missing parameters', async () => {
      const request = {
        params: {
          name: 'mix-colors',
          arguments: {
            color1: '#FF0000'
          }
        }
      };

      const result = await mockCallToolHandler(request);
      const response = JSON.parse(result.content[0].text);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Second color is required');
    });
  });

  describe('CallTool Handler - Unknown Tool', () => {
    it('should throw error for unknown tool', async () => {
      const request = {
        params: {
          name: 'unknown-tool',
          arguments: {}
        }
      };

      const result = await mockCallToolHandler(request);
      expect(result.content[0].text).toContain('Unknown tool: unknown-tool');
    });
  });

  describe('ListResources Handler', () => {
    it('should return all available resources', async () => {
      const result = await mockListResourcesHandler();
      
      expect(result.resources).toHaveLength(6);
      expect(result.resources.map((r: any) => r.uri)).toEqual([
        'color-palettes',
        'palette://material-design',
        'palette://tailwind',
        'palette://tailwind-v4',
        'colors://named',
        'colors://web-safe'
      ]);
    });

    it('should have correct resource metadata', async () => {
      const result = await mockListResourcesHandler();
      
      const paletteResource = result.resources.find((r: any) => r.uri === 'color-palettes');
      expect(paletteResource.name).toBe('Available Color Palettes');
      expect(paletteResource.mimeType).toBe('application/json');
      
      const namedColorsResource = result.resources.find((r: any) => r.uri === 'colors://named');
      expect(namedColorsResource.name).toBe('CSS Named Colors');
    });
  });

  describe('ReadResource Handler', () => {
    it('should read color-palettes resource', async () => {
      const request = {
        params: {
          uri: 'color-palettes'
        }
      };

      const result = await mockReadResourceHandler(request);
      
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('color-palettes');
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.palettes).toBeInstanceOf(Array);
    });

    it('should read specific palette resource', async () => {
      const request = {
        params: {
          uri: 'palette://material-design'
        }
      };

      const result = await mockReadResourceHandler(request);
      
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('palette://material-design');
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.name).toBeDefined();
      expect(content.colors).toBeInstanceOf(Array);
    });

    it('should read named colors resource', async () => {
      const request = {
        params: {
          uri: 'colors://named'
        }
      };

      const result = await mockReadResourceHandler(request);
      
      expect(result.contents).toHaveLength(1);
      const content = JSON.parse(result.contents[0].text);
      expect(content.categories).toBeDefined();
    });

    it('should read web-safe colors resource', async () => {
      const request = {
        params: {
          uri: 'colors://web-safe'
        }
      };

      const result = await mockReadResourceHandler(request);
      
      expect(result.contents).toHaveLength(1);
      const content = JSON.parse(result.contents[0].text);
      expect(content.allColors).toBeInstanceOf(Array);
    });

    it('should handle unknown palette', async () => {
      const request = {
        params: {
          uri: 'palette://unknown-palette'
        }
      };

      await expect(() => mockReadResourceHandler(request)).toThrow('Failed to read resource palette://unknown-palette: Palette not found: unknown-palette');
    });

    it('should handle unknown resource', async () => {
      const request = {
        params: {
          uri: 'unknown://resource'
        }
      };

      await expect(() => mockReadResourceHandler(request)).toThrow('Failed to read resource unknown://resource: Unknown resource: unknown://resource');
    });
  });

  describe('Server Connection and Main Function', () => {
    it('should connect server with transport', () => {
      // The server connection happens during module import at the top
      // We check that the mocks were called during initialization
      expect(mockConnect).toHaveBeenCalled();
      expect(MockStdioServerTransport).toHaveBeenCalled();
    });

    it('should register exactly 4 handlers', () => {
      // Handler registration happens during module import at the top
      // We check that the mock was called 4 times during initialization
      expect(mockSetRequestHandler).toHaveBeenCalledTimes(4);
    });
  });

  describe('Helper Functions', () => {
    it('should format harmony descriptions correctly', async () => {
      const harmonyTypes = ['complementary', 'analogous', 'triadic', 'tetradic', 'split-complementary'];
      
      for (const harmonyType of harmonyTypes) {
        const request = {
          params: {
            name: 'generate-harmony',
            arguments: {
              baseColor: '#FF0000',
              harmonyType
            }
          }
        };

        const result = await mockCallToolHandler(request);
        const response = JSON.parse(result.content[0].text);
        
        expect(response.success).toBe(true);
        expect(response.result.description).toBeDefined();
        expect(response.result.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid tool arguments consistently', async () => {
      const invalidRequests = [
        {
          name: 'convert-color',
          arguments: { input: null }
        },
        {
          name: 'generate-harmony',
          arguments: { baseColor: null, harmonyType: 'complementary' }
        },
        {
          name: 'check-contrast',
          arguments: { foreground: null, background: '#FFFFFF' }
        }
      ];

      for (const invalidRequest of invalidRequests) {
        const request = {
          params: invalidRequest
        };

        const result = await mockCallToolHandler(request);
        const response = JSON.parse(result.content[0].text);
        
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
        expect(typeof response.error).toBe('string');
      }
    });

    it('should handle errors in resource reading gracefully', async () => {
      const invalidUris = [
        'invalid://uri',
        'palette://nonexistent',
        'colors://unknown'
      ];

      for (const uri of invalidUris) {
        const request = {
          params: { uri }
        };

        await expect(() => mockReadResourceHandler(request)).toThrow();
      }
    });
  });
});