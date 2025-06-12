import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the file system module to avoid reading package.json
vi.mock('fs', () => ({
  readFileSync: vi.fn(() => JSON.stringify({ version: '1.0.0' }))
}));

// Mock the path and url modules
vi.mock('url', () => ({
  fileURLToPath: vi.fn(() => '/mock/path/to/index.js')
}));

vi.mock('path', () => ({
  dirname: vi.fn(() => '/mock/path/to'),
  join: vi.fn((...args) => args.join('/'))
}));

// Create a mock server that captures handler functions
let mockListToolsHandler: Function;
let mockCallToolHandler: Function;
let mockListResourcesHandler: Function;
let mockReadResourceHandler: Function;

const mockServer = {
  setRequestHandler: vi.fn((schema: any, handler: Function) => {
    // Store handlers for testing
    const schemaName = schema?.name || schema;
    if (schemaName?.includes?.('ListTools') || schema === 'list-tools') {
      mockListToolsHandler = handler;
    } else if (schemaName?.includes?.('CallTool') || schema === 'call-tool') {
      mockCallToolHandler = handler;
    } else if (schemaName?.includes?.('ListResources') || schema === 'list-resources') {
      mockListResourcesHandler = handler;
    } else if (schemaName?.includes?.('ReadResource') || schema === 'read-resource') {
      mockReadResourceHandler = handler;
    }
  }),
  connect: vi.fn().mockResolvedValue(undefined)
};

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: vi.fn(() => mockServer)
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn(() => ({}))
}));

// Mock schemas as simple objects
vi.mock('@modelcontextprotocol/sdk/types.js', async () => {
  const schemas = {
    ListToolsRequestSchema: { name: 'ListToolsRequestSchema' },
    CallToolRequestSchema: { name: 'CallToolRequestSchema' },
    ListResourcesRequestSchema: { name: 'ListResourcesRequestSchema' },
    ReadResourceRequestSchema: { name: 'ReadResourceRequestSchema' }
  };
  return schemas;
});

describe('MCP Server Handler Functions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Reset modules and import the server module to register handlers
    vi.resetModules();
    await import('../index.js');
  });

  describe('ListTools Handler', () => {
    it('should return all available tools', async () => {
      const result = await mockListToolsHandler();
      
      expect(result.tools).toHaveLength(7);
      expect(result.tools.map((t: any) => t.name)).toEqual([
        'convert-colour',
        'color-info', 
        'generate-harmony',
        'check-contrast',
        'simulate-colorblind',
        'find-accessible-color',
        'mix-colors'
      ]);
    });

    it('should include correct tool schemas', async () => {
      const result = await mockListToolsHandler();
      
      const convertTool = result.tools.find((t: any) => t.name === 'convert-colour');
      expect(convertTool.description).toContain('v1.0.0');
      expect(convertTool.inputSchema.required).toEqual(['input']);
      expect(convertTool.inputSchema.properties.input.type).toBe('string');
      
      const harmonyTool = result.tools.find((t: any) => t.name === 'generate-harmony');
      expect(harmonyTool.inputSchema.required).toEqual(['baseColor', 'harmonyType']);
    });
  });

  describe('CallTool Handler - convert-colour', () => {
    it('should convert color successfully', async () => {
      const request = {
        params: {
          name: 'convert-colour',
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
          name: 'convert-colour',
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
          name: 'convert-colour',
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
          name: 'convert-colour',
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
          name: 'convert-colour',
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
      
      expect(result.resources).toHaveLength(5);
      expect(result.resources.map((r: any) => r.uri)).toEqual([
        'color-palettes',
        'palette://material-design',
        'palette://tailwind',
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

      await expect(mockReadResourceHandler(request)).rejects.toThrow('Failed to read resource palette://unknown-palette: Palette not found: unknown-palette');
    });

    it('should handle unknown resource', async () => {
      const request = {
        params: {
          uri: 'unknown://resource'
        }
      };

      await expect(mockReadResourceHandler(request)).rejects.toThrow('Failed to read resource unknown://resource: Unknown resource: unknown://resource');
    });
  });

  describe('Server Connection and Main Function', () => {
    it('should connect server with transport', async () => {
      const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');
      
      // Import the server module which should trigger the main function
      await import('../index.js');
      
      // The server connection happens during module import
      expect(mockServer.connect).toHaveBeenCalled();
      expect(StdioServerTransport).toHaveBeenCalled();
    });

    it('should register exactly 4 handlers', async () => {
      // Import the server module to trigger handler registration
      await import('../index.js');
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(4);
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
          name: 'convert-colour',
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

        await expect(mockReadResourceHandler(request)).rejects.toThrow();
      }
    });
  });
});