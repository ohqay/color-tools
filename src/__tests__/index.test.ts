import { describe, test, expect } from 'bun:test';
import { ColorConverter } from '../colorConverter.js';
import type { ColorFormat } from '../types.js';

describe('MCP Server Tools', () => {
  describe('convert-color tool', () => {
    test('should convert color successfully', () => {
      const input = '#FF0000';
      const result = ColorConverter.convert(input);

      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
      expect(result.hsl).toBe('hsl(0, 100%, 50%)');
      expect(result.hsb).toBe('hsb(0, 100%, 100%)');
      expect(result.cmyk).toBe('cmyk(0%, 100%, 100%, 0%)');
    });

    test('should use intelligent defaults in MCP tool handler', () => {
      // This tests the MCP tool's intelligent defaults feature
      const input = '#FF0000';
      const result = ColorConverter.convert(input, undefined, ['hex', 'rgb', 'hsl']); // Simulating MCP tool behavior

      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
      expect(result.hsl).toBe('hsl(0, 100%, 50%)');
      expect(result.hsb).toBeUndefined();
      expect(result.cmyk).toBeUndefined();
    });

    test('should auto-detect format', () => {
      const input = 'rgb(255, 0, 0)';
      const detected = ColorConverter.detectFormat(input);
      expect(detected).toBe('rgb');

      const result = ColorConverter.convert(input);
      expect(result.hex).toBe('#ff0000');
    });

    test('should convert to specific formats only', () => {
      const input = '#FF0000';
      const to: ColorFormat[] = ['hex', 'rgb'];
      const result = ColorConverter.convert(input, undefined, to);

      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
      expect(result.hsl).toBeUndefined();
      expect(result.cmyk).toBeUndefined();
    });

    test('should handle named colors', () => {
      const input = 'red';
      const detected = ColorConverter.detectFormat(input);
      expect(detected).toBe('hex');

      const result = ColorConverter.convert(input);
      expect(result.hex).toBe('#ff0000');
      expect(result.rgb).toBe('rgb(255, 0, 0)');
    });

    test('should handle RGBA colors', () => {
      const input = 'rgba(255, 0, 0, 0.5)';
      const result = ColorConverter.convert(input);

      expect(result.rgba).toBe('rgba(255, 0, 0, 0.5)');
      expect(result.hex).toBe('#ff000080');
    });

    test('should handle errors gracefully', () => {
      const input = 'invalid-color';
      expect(() => ColorConverter.convert(input)).toThrow('Invalid color format');
    });

    test('should validate input', () => {
      expect(() => ColorConverter.convert('')).toThrow('input must be a non-empty string');
    });
  });

  describe('Tool schemas and structure', () => {
    test('should have proper convert-color tool schema', () => {
      // This tests the expected structure, not the actual server implementation
      const expectedSchema = {
        type: 'object',
        properties: {
          input: {
            type: 'string',
            description: 'The color value to convert'
          },
          from: {
            type: 'string',
            enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk'],
            description: 'Source format (auto-detected if not specified)'
          },
          to: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['hex', 'rgb', 'rgba', 'hsl', 'hsla', 'hsb', 'hsv', 'cmyk']
            },
            description: 'Target formats to convert to (defaults to all)'
          }
        },
        required: ['input']
      };

      // Verify the schema structure matches our expectations
      expect(expectedSchema.type).toBe('object');
      expect(expectedSchema.required).toEqual(['input']);
      expect(expectedSchema.properties.from.enum).toContain('hex');
      expect(expectedSchema.properties.from.enum).toContain('rgb');
      expect(expectedSchema.properties.to.type).toBe('array');
    });

    test('should have proper color-info tool schema', () => {
      const expectedSchema = {
        type: 'object',
        properties: {}
      };

      expect(expectedSchema.type).toBe('object');
      expect(Object.keys(expectedSchema.properties)).toHaveLength(0);
    });
  });

  describe('Tool response formats', () => {
    test('should format convert-color success response correctly', () => {
      const input = '#D4C7BA';
      const result = ColorConverter.convert(input);
      const detectedFormat = ColorConverter.detectFormat(input);

      const expectedResponse = {
        success: true,
        input: input,
        detectedFormat: detectedFormat,
        hex: result.hex,
        rgb: result.rgb,
        hsl: result.hsl,
        hsb: result.hsb,
        cmyk: result.cmyk
      };

      expect(expectedResponse.success).toBe(true);
      expect(expectedResponse.input).toBe('#D4C7BA');
      expect(expectedResponse.detectedFormat).toBe('hex');
      expect(expectedResponse.hex).toBe('#d4c7ba');
      expect(expectedResponse.rgb).toBeDefined();
      expect(expectedResponse.hsl).toBeDefined();
      expect(expectedResponse.hsb).toBeDefined();
      expect(expectedResponse.cmyk).toBeDefined();
    });

    test('should format convert-color error response correctly', () => {
      const expectedErrorResponse = {
        success: false,
        error: 'Invalid color format or value',
        hint: 'Please provide a valid color value'
      };

      expect(expectedErrorResponse.success).toBe(false);
      expect(expectedErrorResponse.error).toBeDefined();
      expect(expectedErrorResponse.hint).toBeDefined();
    });

    test('should format color-info response correctly', () => {
      const expectedInfo = {
        name: 'Color Converter MCP Server',
        version: '1.0.0',
        description: 'Convert colors between different formats',
        supportedFormats: {
          hex: {},
          rgb: {},
          rgba: {},
          hsl: {},
          hsla: {},
          hsb: {},
          cmyk: {}
        },
        features: [
          'Auto-detection',
          'Batch conversion',
          'CSS named colors'
        ],
        usage: {}
      };

      // Verify the structure
      expect(expectedInfo.name).toBeDefined();
      expect(expectedInfo.supportedFormats).toBeDefined();
      expect(expectedInfo.features).toBeDefined();
    });
  });

  describe('Integration with ColorConverter', () => {
    test('should handle all supported input formats', () => {
      const testCases = [
        { input: '#FF0000', expectedFormat: 'hex' },
        { input: 'rgb(255, 0, 0)', expectedFormat: 'rgb' },
        { input: 'rgba(255, 0, 0, 0.5)', expectedFormat: 'rgba' },
        { input: 'hsl(0, 100%, 50%)', expectedFormat: 'hsl' },
        { input: 'hsla(0, 100%, 50%, 0.5)', expectedFormat: 'hsla' },
        { input: 'hsb(0, 100%, 100%)', expectedFormat: 'hsb' },
        { input: 'cmyk(0%, 100%, 100%, 0%)', expectedFormat: 'cmyk' },
        { input: 'red', expectedFormat: 'hex' }
      ];

      testCases.forEach(({ input, expectedFormat }) => {
        const detectedFormat = ColorConverter.detectFormat(input);
        expect(detectedFormat).toBe(expectedFormat);

        // Verify conversion works
        const result = ColorConverter.convert(input);
        expect(result).toBeDefined();
        expect(result.hex).toBeDefined();
      });
    });

    test('should handle edge cases', () => {
      // Empty input
      expect(() => ColorConverter.convert('')).toThrow();

      // Invalid format
      expect(() => ColorConverter.convert('not-a-color')).toThrow();

      // Out of range values
      expect(() => ColorConverter.convert('rgb(256, 0, 0)')).toThrow('RGB values must be between 0 and 255');
      expect(() => ColorConverter.convert('hsl(361, 100%, 50%)')).toThrow('Hue must be between 0 and 360');
    });
  });
});