import { describe, it, expect } from 'vitest';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { ColorHarmony } from '../colorHarmony.js';

// Mock the MCP server handler
const mockGenerateHarmony = (params: any) => {
  const { baseColor, harmonyType, outputFormat, options } = params;
  
  // Validate required parameters
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
    outputFormat ?? 'hex',
    options ?? {}
  );
  
  return {
    success: true,
    input: baseColor,
    harmonyType: harmonyType,
    outputFormat: outputFormat ?? 'hex',
    result: {
      baseColor: result.baseColor,
      colors: result.colors,
      colorCount: result.colors.length,
      description: getHarmonyDescription(harmonyType),
      rawHSLValues: result.rawValues?.map(hsl => ({
        h: hsl.h,
        s: hsl.s,
        l: hsl.l,
      })),
    },
  };
};

function getHarmonyDescription(harmonyType: string): string {
  const descriptions: Record<string, string> = {
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

describe('Color Harmony MCP Integration', () => {
  it('should generate complementary harmony through MCP', () => {
    const result = mockGenerateHarmony({
      baseColor: '#FF0000',
      harmonyType: 'complementary',
    });

    expect(result.success).toBe(true);
    expect(result.input).toBe('#FF0000');
    expect(result.harmonyType).toBe('complementary');
    expect(result.outputFormat).toBe('hex');
    expect(result.result.colors).toHaveLength(2);
    expect(result.result.colors[0]).toBe('#ff0000');
    expect(result.result.colors[1]).toBe('#00ffff');
  });

  it('should generate triadic harmony with RGB output', () => {
    const result = mockGenerateHarmony({
      baseColor: '#0000FF',
      harmonyType: 'triadic',
      outputFormat: 'rgb',
    });

    expect(result.success).toBe(true);
    expect(result.outputFormat).toBe('rgb');
    expect(result.result.colors).toHaveLength(3);
    expect(result.result.colors[0]).toBe('rgb(0, 0, 255)');
    expect(result.result.colors[1]).toBe('rgb(255, 0, 0)');
    expect(result.result.colors[2]).toBe('rgb(0, 255, 0)');
  });

  it('should generate analogous harmony with custom options', () => {
    const result = mockGenerateHarmony({
      baseColor: '#00FF00',
      harmonyType: 'analogous',
      outputFormat: 'hex',
      options: {
        analogousCount: 5,
        analogousAngle: 15,
      },
    });

    expect(result.success).toBe(true);
    expect(result.result.colors).toHaveLength(5);
    expect(result.result.rawHSLValues).toHaveLength(5);
  });

  it('should include raw HSL values', () => {
    const result = mockGenerateHarmony({
      baseColor: '#FF0000',
      harmonyType: 'complementary',
    });

    expect(result.result?.rawHSLValues).toBeDefined();
    expect(result.result?.rawHSLValues).toHaveLength(2);
    expect(result.result?.rawHSLValues?.[0]).toEqual({ h: 0, s: 100, l: 50 });
    expect(result.result?.rawHSLValues?.[1]).toEqual({ h: 180, s: 100, l: 50 });
  });

  it('should handle error cases', () => {
    // Missing base color
    expect(() => mockGenerateHarmony({ harmonyType: 'complementary' }))
      .toThrow('Base color is required');

    // Missing harmony type
    expect(() => mockGenerateHarmony({ baseColor: '#FF0000' }))
      .toThrow('Harmony type is required');

    // Invalid color
    expect(() => mockGenerateHarmony({ 
      baseColor: 'invalid-color', 
      harmonyType: 'complementary' 
    })).toThrow();
  });

  it('should include harmony description', () => {
    const result = mockGenerateHarmony({
      baseColor: '#FF0000',
      harmonyType: 'triadic',
    });

    expect(result.result.description).toBe(
      'Three colors evenly spaced around the color wheel (120° apart), offering vibrant yet balanced schemes'
    );
  });
});