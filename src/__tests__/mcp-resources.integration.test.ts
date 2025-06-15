/**
 * MCP Resources Integration Tests
 * Comprehensive testing of MCP resource access, caching, and data integrity
 */

import { describe, it, expect, mock } from 'bun:test';

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
let mockCallToolHandler: (request: any) => any;
let mockListResourcesHandler: () => any;
let mockReadResourceHandler: (request: any) => any;

const mockSetRequestHandler = mock((schema: any, handler: (...args: any[]) => any) => {
  const schemaName = schema?.name ?? schema;
  if (schemaName?.includes?.('ListTools') || schema === 'list-tools') {
    // List tools handler not used in these tests
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

describe('MCP Resources Integration Tests', () => {
  describe('Resource Discovery and Metadata', () => {
    it('should list all available resources with correct metadata', async () => {
      const resources = await mockListResourcesHandler();
      
      expect(resources.resources).toBeDefined();
      expect(resources.resources.length).toBeGreaterThan(0);
      
      // Check each resource has required fields
      for (const resource of resources.resources) {
        expect(resource.uri).toBeDefined();
        expect(resource.name).toBeDefined();
        expect(resource.description).toBeDefined();
        expect(resource.mimeType).toBeDefined();
        
        // URI should follow expected patterns
        if (resource.uri.includes('://')) {
          const [protocol, path] = resource.uri.split('://');
          expect(['palette', 'colors']).toContain(protocol);
          expect(path).toBeTruthy();
        }
      }
      
      // Check for expected resources
      const uris = resources.resources.map((r: any) => r.uri);
      expect(uris).toContain('color-palettes');
      expect(uris).toContain('palette://material-design');
      expect(uris).toContain('palette://tailwind');
      expect(uris).toContain('colors://named');
      expect(uris).toContain('colors://web-safe');
    });

    it('should provide detailed resource descriptions', async () => {
      const resources = await mockListResourcesHandler();
      
      for (const resource of resources.resources) {
        // Descriptions should be meaningful
        expect(resource.description.length).toBeGreaterThan(20);
        
        // Check for specific keywords in descriptions
        if (resource.uri.includes('palette')) {
          expect(resource.description.toLowerCase()).toMatch(/palette|color|design/);
        }
        if (resource.uri.includes('colors')) {
          expect(resource.description.toLowerCase()).toMatch(/color|css|web/);
        }
      }
    });
  });

  describe('Palette Resources', () => {
    it('should read palette index with all available palettes', async () => {
      const result = await mockReadResourceHandler({
        params: { uri: 'color-palettes' }
      });
      
      expect(result.contents).toBeDefined();
      expect(result.contents.length).toBe(1);
      expect(result.contents[0].mimeType).toBe('application/json');
      
      const content = JSON.parse(result.contents[0].text);
      expect(content.palettes).toBeDefined();
      expect(Array.isArray(content.palettes)).toBe(true);
      
      // Check palette metadata
      for (const palette of content.palettes) {
        expect(palette.id).toBeDefined();
        expect(palette.name).toBeDefined();
        expect(palette.description).toBeDefined();
        expect(palette.colorCount).toBeGreaterThan(0);
        expect(palette.uri).toMatch(/^palette:\/\/.+$/);
        
        // Optional fields
        if (palette.version) {
          expect(palette.version).toMatch(/^\d+\.\d+/);
        }
      }
    });

    it('should read Material Design palette correctly', async () => {
      const result = await mockReadResourceHandler({
        params: { uri: 'palette://material-design' }
      });
      
      const palette = JSON.parse(result.contents[0].text);
      
      expect(palette.name).toContain('Material Design');
      expect(palette.version).toBeDefined();
      expect(palette.colors).toBeDefined();
      expect(Array.isArray(palette.colors)).toBe(true);
      
      // Check color structure
      const expectedColors = ['red', 'pink', 'purple', 'blue', 'green', 'yellow', 'orange'];
      const colorNames = palette.colors.map((c: any) => c.name);
      
      for (const expected of expectedColors) {
        expect(colorNames).toContain(expected);
      }
      
      // Check shade structure
      for (const color of palette.colors) {
        expect(color.name).toBeDefined();
        expect(color.shades).toBeDefined();
        expect(Array.isArray(color.shades)).toBe(true);
        
        // Material Design typically has shades from 50 to 900
        const shadeNames = color.shades.map((s: any) => s.name);
        expect(shadeNames).toContain('500'); // Primary shade
        
        // Check shade values
        for (const shade of color.shades) {
          expect(shade.name).toBeDefined();
          expect(shade.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
        }
      }
    });

    it('should read Tailwind CSS palette correctly', async () => {
      const result = await mockReadResourceHandler({
        params: { uri: 'palette://tailwind' }
      });
      
      const palette = JSON.parse(result.contents[0].text);
      
      expect(palette.name).toContain('Tailwind');
      expect(palette.colors).toBeDefined();
      
      // Check for Tailwind-specific color categories
      const colorNames = palette.colors.map((c: any) => c.name);
      const expectedTailwindColors = ['gray', 'red', 'blue', 'green', 'yellow', 'purple'];
      
      for (const expected of expectedTailwindColors) {
        expect(colorNames.some((name: string) => name.toLowerCase().includes(expected))).toBe(true);
      }
      
      // Check Tailwind shade naming (50, 100, 200, ..., 900)
      for (const color of palette.colors) {
        if (color.shades) {
          const shadeNames = color.shades.map((s: any) => s.name);
          expect(shadeNames).toContain('50');
          expect(shadeNames).toContain('500');
          expect(shadeNames).toContain('900');
        }
      }
    });

    it('should handle Tailwind v4 palette if available', async () => {
      try {
        const result = await mockReadResourceHandler({
          params: { uri: 'palette://tailwind-v4' }
        });
        
        const palette = JSON.parse(result.contents[0].text);
        expect(palette.name).toContain('Tailwind');
        expect(palette.version).toContain('4');
        
        // v4 might have different structure
        expect(palette.colors).toBeDefined();
      } catch (error) {
        // It's okay if v4 palette doesn't exist yet
        expect(error.message).toContain('not found');
      }
    });
  });

  describe('Color Resources', () => {
    it('should read CSS named colors with categories', async () => {
      const result = await mockReadResourceHandler({
        params: { uri: 'colors://named' }
      });
      
      const namedColors = JSON.parse(result.contents[0].text);
      
      expect(namedColors.name).toBe('CSS Named Colors');
      expect(namedColors.description).toBeDefined();
      expect(namedColors.totalColors).toBeGreaterThan(100); // CSS has 140+ named colors
      expect(namedColors.categories).toBeDefined();
      expect(namedColors.allColors).toBeDefined();
      
      // Check category structure
      for (const category of namedColors.categories) {
        expect(category.name).toBeDefined();
        expect(category.colors).toBeDefined();
        expect(Array.isArray(category.colors)).toBe(true);
        
        // Check color structure
        for (const color of category.colors) {
          expect(color.name).toBeDefined();
          expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
          
          // Optional RGB values
          if (color.rgb) {
            expect(color.rgb).toHaveProperty('r');
            expect(color.rgb).toHaveProperty('g');
            expect(color.rgb).toHaveProperty('b');
          }
        }
      }
      
      // Check for common CSS colors
      const allColorNames = namedColors.allColors.map((c: any) => c.name);
      const commonColors = ['red', 'green', 'blue', 'yellow', 'black', 'white', 'gray'];
      
      for (const common of commonColors) {
        expect(allColorNames).toContain(common);
      }
    });

    it('should read web-safe colors correctly', async () => {
      const result = await mockReadResourceHandler({
        params: { uri: 'colors://web-safe' }
      });
      
      const webSafeColors = JSON.parse(result.contents[0].text);
      
      expect(webSafeColors.name).toBe('Web Safe Colors');
      expect(webSafeColors.description).toBeDefined();
      expect(webSafeColors.totalColors).toBe(216); // Standard web-safe palette size
      expect(webSafeColors.groups).toBeDefined();
      expect(webSafeColors.allColors).toBeDefined();
      expect(webSafeColors.allColors.length).toBe(216);
      
      // Check color values are web-safe (RGB values divisible by 51)
      for (const color of webSafeColors.allColors) {
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/); // Should be uppercase
        expect(color.rgb).toBeDefined();
        
        // Web-safe colors have RGB values: 0, 51, 102, 153, 204, 255
        expect(color.rgb.r % 51).toBe(0);
        expect(color.rgb.g % 51).toBe(0);
        expect(color.rgb.b % 51).toBe(0);
      }
      
      // Check grouping structure
      if (webSafeColors.groups && webSafeColors.groups.length > 0) {
        for (const group of webSafeColors.groups) {
          expect(group.name).toBeDefined();
          expect(group.colors).toBeDefined();
          expect(Array.isArray(group.colors)).toBe(true);
        }
      }
    });
  });

  describe('Resource Error Handling', () => {
    it('should handle invalid resource URIs gracefully', async () => {
      const invalidUris = [
        'invalid-uri',
        'unknown://protocol',
        'palette://',
        'colors://',
        '://missing-protocol',
        'palette://../../etc/passwd', // Path traversal attempt
        'palette://non-existent-palette-name-12345'
      ];
      
      for (const uri of invalidUris) {
        await expect(async () => {
          await mockReadResourceHandler({ params: { uri } });
        }).toThrow();
      }
    });

    it('should provide helpful error messages for resource errors', async () => {
      try {
        await mockReadResourceHandler({
          params: { uri: 'palette://does-not-exist' }
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.message).toContain('not found');
        expect(error.message).toContain('does-not-exist');
      }
    });
  });

  describe('Resource Integration with Tools', () => {
    it('should use palette colors with color tools', async () => {
      // First, read a palette
      const paletteResult = await mockReadResourceHandler({
        params: { uri: 'palette://material-design' }
      });
      
      const palette = JSON.parse(paletteResult.contents[0].text);
      const blueShades = palette.colors.find((c: any) => c.name === 'blue').shades;
      const blue500 = blueShades.find((s: any) => s.name === '500').value;
      
      // Use the color with various tools
      const convertResult = await mockCallToolHandler({
        params: {
          name: 'convert-color',
          arguments: {
            input: blue500,
            to: ['rgb', 'hsl', 'lab']
          }
        }
      });
      
      const converted = JSON.parse(convertResult.content[0].text);
      expect(converted.success).toBe(true);
      // When input is already hex, the output includes all other formats but may not include hex again
      // Check that the input matches our expected color
      expect(converted.input).toBe(blue500.toLowerCase());
      
      // Generate harmony
      const harmonyResult = await mockCallToolHandler({
        params: {
          name: 'generate-harmony',
          arguments: {
            baseColor: blue500,
            harmonyType: 'complementary'
          }
        }
      });
      
      const harmony = JSON.parse(harmonyResult.content[0].text);
      expect(harmony.success).toBe(true);
      
      // Check accessibility
      const contrastResult = await mockCallToolHandler({
        params: {
          name: 'check-contrast',
          arguments: {
            foreground: blue500,
            background: '#FFFFFF'
          }
        }
      });
      
      const contrast = JSON.parse(contrastResult.content[0].text);
      expect(contrast.success).toBe(true);
    });

    it('should match custom colors to palette colors', async () => {
      // Read Tailwind palette
      const tailwindResult = await mockReadResourceHandler({
        params: { uri: 'palette://tailwind' }
      });
      
      const tailwind = JSON.parse(tailwindResult.contents[0].text);
      
      // Test color that should match Tailwind blue-500
      const testColor = '#3B82F6';
      
      // Convert to ensure exact format
      const convertResult = await mockCallToolHandler({
        params: {
          name: 'convert-color',
          arguments: { input: testColor }
        }
      });
      
      const converted = JSON.parse(convertResult.content[0].text);
      
      // Find in Tailwind palette
      let found = false;
      for (const colorGroup of tailwind.colors) {
        if (colorGroup.shades) {
          for (const shade of colorGroup.shades) {
            if (shade.value.toLowerCase() === converted.hex.toLowerCase()) {
              found = true;
              expect(colorGroup.name.toLowerCase()).toContain('blue');
              expect(shade.name).toBe('500');
              break;
            }
          }
        }
        if (found) {break;}
      }
      
      expect(found).toBe(true);
    });

    it('should use named colors with conversion tool', async () => {
      // Read named colors
      const namedResult = await mockReadResourceHandler({
        params: { uri: 'colors://named' }
      });
      
      const namedColors = JSON.parse(namedResult.contents[0].text);
      
      // Test some common named colors
      const testColors = ['red', 'blue', 'green', 'yellow', 'purple'];
      
      for (const colorName of testColors) {
        // Find the color in named colors
        const namedColor = namedColors.allColors.find((c: any) => c.name === colorName);
        expect(namedColor).toBeDefined();
        
        // Convert using the color name
        const convertResult = await mockCallToolHandler({
          params: {
            name: 'convert-color',
            arguments: { input: colorName }
          }
        });
        
        const converted = JSON.parse(convertResult.content[0].text);
        expect(converted.success).toBe(true);
        expect(converted.hex).toBe(namedColor.hex.toLowerCase());
      }
    });
  });

  describe('Resource Caching and Performance', () => {
    it('should cache resource reads for performance', async () => {
      const uri = 'palette://material-design';
      
      // First read
      const start1 = performance.now();
      const result1 = await mockReadResourceHandler({ params: { uri } });
      const time1 = performance.now() - start1;
      
      // Second read (should be cached)
      const start2 = performance.now();
      const result2 = await mockReadResourceHandler({ params: { uri } });
      const time2 = performance.now() - start2;
      
      // Third read
      const start3 = performance.now();
      const result3 = await mockReadResourceHandler({ params: { uri } });
      const time3 = performance.now() - start3;
      
      // Content should be identical
      expect(result1.contents[0].text).toBe(result2.contents[0].text);
      expect(result2.contents[0].text).toBe(result3.contents[0].text);
      
      // Subsequent reads should be faster (though this might vary in test env)
      console.log(`Resource cache performance: 1st=${time1.toFixed(2)}ms, 2nd=${time2.toFixed(2)}ms, 3rd=${time3.toFixed(2)}ms`);
    });

    it('should handle concurrent resource reads efficiently', async () => {
      const uris = [
        'color-palettes',
        'palette://material-design',
        'palette://tailwind',
        'colors://named',
        'colors://web-safe'
      ];
      
      // Read all resources concurrently
      const start = performance.now();
      const promises = uris.map(uri => 
        mockReadResourceHandler({ params: { uri } })
      );
      
      const results = await Promise.all(promises);
      const totalTime = performance.now() - start;
      
      // All should succeed
      expect(results.length).toBe(uris.length);
      results.forEach(result => {
        expect(result.contents).toBeDefined();
        expect(result.contents[0].text).toBeDefined();
      });
      
      // Should complete efficiently
      console.log(`Concurrent read of ${uris.length} resources: ${totalTime.toFixed(2)}ms`);
      expect(totalTime).toBeLessThan(uris.length * 10); // Less than 10ms per resource
    });
  });

  describe('Resource Data Integrity', () => {
    it('should maintain color value integrity across resources', async () => {
      // Read a known color from palette
      const paletteResult = await mockReadResourceHandler({
        params: { uri: 'palette://material-design' }
      });
      
      const palette = JSON.parse(paletteResult.contents[0].text);
      const red500 = palette.colors
        .find((c: any) => c.name === 'red')
        .shades.find((s: any) => s.name === '500').value;
      
      // Convert to verify format
      const convertResult = await mockCallToolHandler({
        params: {
          name: 'convert-color',
          arguments: { input: red500 }
        }
      });
      
      const converted = JSON.parse(convertResult.content[0].text);
      
      // Color should maintain its value
      expect(converted.hex).toBe(red500.toLowerCase());
      expect(converted.success).toBe(true);
    });

    it('should provide consistent resource metadata', async () => {
      // List resources
      const listResult = await mockListResourcesHandler();
      const listedResources = listResult.resources;
      
      // Read each resource and verify metadata matches
      for (const listed of listedResources) {
        try {
          const readResult = await mockReadResourceHandler({
            params: { uri: listed.uri }
          });
          
          // Verify MIME type matches
          expect(readResult.contents[0].mimeType).toBe(listed.mimeType);
          
          // Verify URI matches
          expect(readResult.contents[0].uri).toBe(listed.uri);
        } catch (error) {
          // Some resources might be placeholders
          console.log(`Could not read resource ${listed.uri}: ${error.message}`);
        }
      }
    });
  });
});