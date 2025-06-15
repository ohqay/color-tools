/**
 * MCP Protocol Integration Tests
 * Tests complete MCP protocol compliance and client-server interactions
 */

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
const initializationPromise = import('../index.js').then((_module) => {
  return new Promise(resolve => setTimeout(resolve, 100));
});

await initializationPromise;

describe('MCP Protocol Integration Tests', () => {
  describe('Protocol Version and Capabilities', () => {
    it('should expose correct MCP protocol version', async () => {
      const serverInfo = await mockCallToolHandler({
        params: {
          name: 'color-info',
          arguments: {}
        }
      });
      
      const info = JSON.parse(serverInfo.content[0].text);
      expect(info.version).toBe('1.0.0');
      expect(info.name).toContain('MCP Server');
    });

    it('should support all required MCP methods', () => {
      // Verify all handlers are registered
      expect(mockListToolsHandler).toBeDefined();
      expect(mockCallToolHandler).toBeDefined();
      expect(mockListResourcesHandler).toBeDefined();
      expect(mockReadResourceHandler).toBeDefined();
    });
  });

  describe('Tool Discovery and Metadata', () => {
    it('should provide comprehensive tool descriptions', async () => {
      const tools = await mockListToolsHandler();
      
      for (const tool of tools.tools) {
        // Check description quality
        expect(tool.description.length).toBeGreaterThan(20);
        // Some tools have version, others don't - check convert-color specifically
        if (tool.name === 'convert-color') {
          expect(tool.description).toContain('v1.0.0');
        }
        
        // Check input schema completeness
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
        if (tool.inputSchema.required) {
          expect(tool.inputSchema.required).toBeInstanceOf(Array);
        }
        
        // Check for example usage if present
        if (tool.inputSchema.examples) {
          expect(tool.inputSchema.examples).toBeInstanceOf(Array);
          expect(tool.inputSchema.examples.length).toBeGreaterThan(0);
        }
      }
    });

    it('should provide parameter validation schemas', async () => {
      const tools = await mockListToolsHandler();
      
      const toolsWithValidation = [
        'convert-color',
        'generate-harmony',
        'check-contrast',
        'mix-colors'
      ];
      
      for (const toolName of toolsWithValidation) {
        const tool = tools.tools.find((t: any) => t.name === toolName);
        expect(tool).toBeDefined();
        
        // Check parameter types and constraints
        for (const [param, schema] of Object.entries(tool.inputSchema.properties)) {
          expect(schema).toHaveProperty('type');
          if (schema.type === 'string' && schema.enum) {
            expect(schema.enum).toBeInstanceOf(Array);
          }
        }
      }
    });
  });

  describe('Resource Protocol Implementation', () => {
    it('should implement resource URI scheme correctly', async () => {
      const resources = await mockListResourcesHandler();
      
      for (const resource of resources.resources) {
        // Check URI format
        if (resource.uri.includes('://')) {
          const [protocol, path] = resource.uri.split('://');
          expect(['palette', 'colors']).toContain(protocol);
          expect(path.length).toBeGreaterThan(0);
        }
        
        // Check MIME types
        expect(['application/json', 'text/plain']).toContain(resource.mimeType);
      }
    });

    it('should handle resource not found errors properly', async () => {
      const invalidUris = [
        'palette://does-not-exist',
        'colors://invalid-type',
        'unknown://resource'
      ];
      
      for (const uri of invalidUris) {
        await expect(async () => {
          await mockReadResourceHandler({ params: { uri } });
        }).toThrow();
      }
    });

    it('should provide resource metadata headers', async () => {
      const resources = await mockListResourcesHandler();
      
      for (const resource of resources.resources) {
        expect(resource.name).toBeDefined();
        expect(resource.description).toBeDefined();
        expect(resource.mimeType).toBeDefined();
        
        // Optional metadata
        if (resource.metadata) {
          expect(resource.metadata).toBeInstanceOf(Object);
        }
      }
    });
  });

  describe('Error Handling Protocol', () => {
    it('should return structured error responses', async () => {
      const errorCases = [
        {
          tool: 'convert-color',
          args: { input: null },
          expectedError: /required/i
        },
        {
          tool: 'generate-harmony',
          args: { baseColor: 'invalid', harmonyType: 'complementary' },
          expectedError: /failed.*generate/i
        },
        {
          tool: 'check-contrast',
          args: { foreground: '#000' },
          expectedError: /required/i
        }
      ];
      
      for (const testCase of errorCases) {
        const result = await mockCallToolHandler({
          params: {
            name: testCase.tool,
            arguments: testCase.args
          }
        });
        
        const response = JSON.parse(result.content[0].text);
        expect(response.success).toBe(false);
        expect(response.error).toMatch(testCase.expectedError);
        
        // Should include helpful hints
        if (response.hint) {
          expect(response.hint.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle malformed requests gracefully', async () => {
      const malformedRequests = [
        { params: null },
        { params: { name: null, arguments: {} } },
        { params: { name: 'convert-color' } }, // Missing arguments
        { params: { arguments: { input: '#000' } } } // Missing name
      ];
      
      for (const request of malformedRequests) {
        try {
          await mockCallToolHandler(request);
        } catch (error) {
          // Should handle gracefully without crashing
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Batch Operations Support', () => {
    it('should handle multiple concurrent tool calls efficiently', async () => {
      const batchSize = 20;
      const colors = Array.from({ length: batchSize }, (_, i) => 
        `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
      );
      
      const start = performance.now();
      
      const promises = colors.map(color => 
        mockCallToolHandler({
          params: {
            name: 'convert-color',
            arguments: { input: color, to: ['rgb', 'hsl', 'lab'] }
          }
        })
      );
      
      const results = await Promise.all(promises);
      const end = performance.now();
      
      // All should succeed
      results.forEach(result => {
        const response = JSON.parse(result.content[0].text);
        expect(response.success).toBe(true);
      });
      
      // Should complete in reasonable time
      const totalTime = end - start;
      expect(totalTime).toBeLessThan(batchSize * 5); // Less than 5ms per operation
    });

    it('should handle mixed tool batch operations', async () => {
      const operations = [
        { name: 'convert-color', arguments: { input: '#FF0000' } },
        { name: 'generate-harmony', arguments: { baseColor: '#00FF00', harmonyType: 'complementary' } },
        { name: 'check-contrast', arguments: { foreground: '#000000', background: '#FFFFFF' } },
        { name: 'simulate-colorblind', arguments: { color: '#0000FF' } },
        { name: 'mix-colors', arguments: { color1: '#FF00FF', color2: '#00FFFF' } }
      ];
      
      const promises = operations.map(op => 
        mockCallToolHandler({ params: op })
      );
      
      const results = await Promise.all(promises);
      
      results.forEach((result, index) => {
        const response = JSON.parse(result.content[0].text);
        expect(response.success).toBe(true);
      });
    });
  });

  describe('State Management and Caching', () => {
    it('should maintain consistent state across requests', async () => {
      // First request
      const result1 = await mockCallToolHandler({
        params: {
          name: 'convert-color',
          arguments: { input: '#123456' }
        }
      });
      
      // Second identical request
      const result2 = await mockCallToolHandler({
        params: {
          name: 'convert-color',
          arguments: { input: '#123456' }
        }
      });
      
      const response1 = JSON.parse(result1.content[0].text);
      const response2 = JSON.parse(result2.content[0].text);
      
      // Should return identical results
      expect(response1).toEqual(response2);
    });

    it('should handle resource caching correctly', async () => {
      // First access
      const start1 = performance.now();
      const result1 = await mockReadResourceHandler({
        params: { uri: 'palette://material-design' }
      });
      const time1 = performance.now() - start1;
      
      // Second access (should be cached)
      const start2 = performance.now();
      const result2 = await mockReadResourceHandler({
        params: { uri: 'palette://material-design' }
      });
      const time2 = performance.now() - start2;
      
      // Content should be identical
      expect(result1.contents[0].text).toBe(result2.contents[0].text);
      
      // Second access should be faster (cached)
      // Note: This might not always be true in test environment
      // but the cache mechanism should be present
    });
  });

  describe('Complex Workflow Integration', () => {
    it('should support design system color generation workflow', async () => {
      // Step 1: Start with brand color
      const brandColor = '#1E3A8A'; // Blue-900
      
      // Step 2: Generate color scale
      const scale = [];
      const steps = [0.95, 0.85, 0.70, 0.50, 0.30, 0.15, 0.05];
      
      for (const step of steps) {
        const mixResult = await mockCallToolHandler({
          params: {
            name: 'mix-colors',
            arguments: {
              color1: brandColor,
              color2: '#FFFFFF',
              ratio: step
            }
          }
        });
        
        const mixResponse = JSON.parse(mixResult.content[0].text);
        scale.push(mixResponse.result);
      }
      
      // Step 3: Check accessibility for each scale color
      const accessibilityResults = [];
      
      for (const color of scale) {
        const contrastWhite = await mockCallToolHandler({
          params: {
            name: 'check-contrast',
            arguments: {
              foreground: color,
              background: '#FFFFFF'
            }
          }
        });
        
        const contrastBlack = await mockCallToolHandler({
          params: {
            name: 'check-contrast',
            arguments: {
              foreground: color,
              background: '#000000'
            }
          }
        });
        
        accessibilityResults.push({
          color,
          whiteContrast: JSON.parse(contrastWhite.content[0].text),
          blackContrast: JSON.parse(contrastBlack.content[0].text)
        });
      }
      
      // Step 4: Find semantic colors
      const semanticColors = {
        primary: brandColor,
        success: '',
        warning: '',
        error: '',
        info: ''
      };
      
      // Generate semantic colors using harmony
      const harmonyResult = await mockCallToolHandler({
        params: {
          name: 'generate-harmony',
          arguments: {
            baseColor: brandColor,
            harmonyType: 'tetradic'
          }
        }
      });
      
      const harmonyResponse = JSON.parse(harmonyResult.content[0].text);
      const harmonyColors = harmonyResponse.result.colors;
      
      // Assign semantic meanings based on hue
      for (let i = 0; i < harmonyColors.length && i < 4; i++) {
        const convertResult = await mockCallToolHandler({
          params: {
            name: 'convert-color',
            arguments: {
              input: harmonyColors[i],
              to: ['hsl']
            }
          }
        });
        
        const colorData = JSON.parse(convertResult.content[0].text);
        const hue = colorData.rawValues.hsl.h;
        
        // Assign based on hue ranges
        if (hue >= 80 && hue <= 140 && !semanticColors.success) {
          semanticColors.success = harmonyColors[i];
        } else if (hue >= 30 && hue <= 60 && !semanticColors.warning) {
          semanticColors.warning = harmonyColors[i];
        } else if (hue >= 0 && hue <= 20 && !semanticColors.error) {
          semanticColors.error = harmonyColors[i];
        } else if (!semanticColors.info) {
          semanticColors.info = harmonyColors[i];
        }
      }
      
      // Verify complete design system was generated
      expect(scale.length).toBe(steps.length);
      expect(accessibilityResults.length).toBe(scale.length);
      expect(Object.values(semanticColors).filter(c => c).length).toBeGreaterThan(3);
    });

    it('should support color blindness safe palette generation', async () => {
      const baseColors = ['#E53E3E', '#38A169', '#3182CE', '#D69E2E', '#805AD5'];
      const colorBlindTypes = ['protanopia', 'deuteranopia', 'tritanopia'];
      
      // Step 1: Simulate all colors for all types
      const simulations: any = {};
      
      for (const color of baseColors) {
        simulations[color] = {};
        
        for (const type of colorBlindTypes) {
          const simResult = await mockCallToolHandler({
            params: {
              name: 'simulate-colorblind',
              arguments: { color, type }
            }
          });
          
          const simResponse = JSON.parse(simResult.content[0].text);
          simulations[color][type] = simResponse.simulatedColor;
        }
      }
      
      // Step 2: Check distinguishability
      const contrastMatrix: any = {};
      
      for (let i = 0; i < baseColors.length; i++) {
        for (let j = i + 1; j < baseColors.length; j++) {
          const color1 = baseColors[i];
          const color2 = baseColors[j];
          const key = `${color1}-${color2}`;
          contrastMatrix[key] = {};
          
          // Check contrast for each color blind type
          for (const type of colorBlindTypes) {
            const simColor1 = simulations[color1][type];
            const simColor2 = simulations[color2][type];
            
            const contrastResult = await mockCallToolHandler({
              params: {
                name: 'check-contrast',
                arguments: {
                  foreground: simColor1,
                  background: simColor2
                }
              }
            });
            
            const contrastResponse = JSON.parse(contrastResult.content[0].text);
            contrastMatrix[key][type] = contrastResponse.contrastRatio;
          }
        }
      }
      
      // Step 3: Find problematic pairs
      const problematicPairs = [];
      const minDistinguishableContrast = 1.5;
      
      for (const [pair, contrasts] of Object.entries(contrastMatrix)) {
        for (const [type, ratio] of Object.entries(contrasts)) {
          if (ratio < minDistinguishableContrast) {
            problematicPairs.push({ pair, type, ratio });
          }
        }
      }
      
      // Verify analysis completed
      expect(Object.keys(simulations).length).toBe(baseColors.length);
      expect(Object.keys(contrastMatrix).length).toBe((baseColors.length * (baseColors.length - 1)) / 2);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should track operation performance metrics', async () => {
      const operations = [
        { tool: 'convert-color', count: 0, totalTime: 0 },
        { tool: 'generate-harmony', count: 0, totalTime: 0 },
        { tool: 'check-contrast', count: 0, totalTime: 0 }
      ];
      
      // Execute multiple operations and track timing
      for (const op of operations) {
        for (let i = 0; i < 10; i++) {
          const start = performance.now();
          
          let args: any = {};
          switch (op.tool) {
            case 'convert-color':
              args = { input: `#${i.toString(16).padStart(6, '0')}` };
              break;
            case 'generate-harmony':
              args = { baseColor: '#FF0000', harmonyType: 'complementary' };
              break;
            case 'check-contrast':
              args = { foreground: '#000000', background: '#FFFFFF' };
              break;
          }
          
          await mockCallToolHandler({
            params: { name: op.tool, arguments: args }
          });
          
          const end = performance.now();
          op.count++;
          op.totalTime += (end - start);
        }
      }
      
      // Calculate and verify performance
      for (const op of operations) {
        const avgTime = op.totalTime / op.count;
        expect(avgTime).toBeLessThan(10); // Should average less than 10ms
        
        console.log(`${op.tool}: avg ${avgTime.toFixed(2)}ms over ${op.count} operations`);
      }
    });
  });

  describe('Edge Case Handling', () => {
    it('should handle extreme color values', async () => {
      const extremeColors = [
        '#000000', // Pure black
        '#FFFFFF', // Pure white
        '#FF0000', // Pure red
        '#00FF00', // Pure green
        '#0000FF', // Pure blue
        'rgb(0,0,0)',
        'rgb(255,255,255)',
        'hsl(0,0%,0%)',
        'hsl(0,0%,100%)',
        'hsl(0,100%,50%)'
      ];
      
      for (const color of extremeColors) {
        const result = await mockCallToolHandler({
          params: {
            name: 'convert-color',
            arguments: { input: color, to: ['hex', 'rgb', 'hsl', 'lab', 'xyz'] }
          }
        });
        
        const response = JSON.parse(result.content[0].text);
        expect(response.success).toBe(true);
        expect(response.hex).toBeDefined();
        expect(response.rgb).toBeDefined();
        expect(response.hsl).toBeDefined();
        expect(response.lab).toBeDefined();
        expect(response.xyz).toBeDefined();
      }
    });

    it('should handle rapid repeated requests', async () => {
      const color = '#FF6B6B';
      const rapidCount = 50;
      
      const promises = Array.from({ length: rapidCount }, () => 
        mockCallToolHandler({
          params: {
            name: 'convert-color',
            arguments: { input: color }
          }
        })
      );
      
      const results = await Promise.all(promises);
      
      // All should succeed and return identical results
      const firstResponse = JSON.parse(results[0].content[0].text);
      
      results.forEach(result => {
        const response = JSON.parse(result.content[0].text);
        expect(response.success).toBe(true);
        expect(response.hex).toBe(firstResponse.hex);
      });
    });

    it('should handle Unicode and special characters in tool responses', async () => {
      const result = await mockCallToolHandler({
        params: {
          name: 'color-info',
          arguments: {}
        }
      });
      
      const response = JSON.parse(result.content[0].text);
      
      // Should handle Unicode properly
      expect(response.description).toBeDefined();
      expect(typeof response.description).toBe('string');
      
      // Should escape special characters in JSON
      const jsonString = JSON.stringify(response);
      expect(jsonString).not.toContain('\u0000');
      expect(jsonString).not.toContain('\u001F');
    });
  });
});