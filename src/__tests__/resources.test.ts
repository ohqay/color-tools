import { describe, it, expect } from 'vitest';
import { getAllPalettes, getPalette, materialDesignPalette, tailwindPalette } from '../resources/palettes';
import { webSafeColors, webSafeColorsResource, webSafeColorGroups } from '../resources/webSafeColors';
import { namedColorsResource, namedColorCategories } from '../resources/namedColorsCategories';

describe('Color Palettes', () => {
  describe('getAllPalettes', () => {
    it('should return all available palettes', () => {
      const palettes = getAllPalettes();
      expect(palettes).toHaveLength(2);
      expect(palettes[0].name).toBe('Material Design');
      expect(palettes[1].name).toBe('Tailwind CSS');
    });
  });

  describe('getPalette', () => {
    it('should return Material Design palette', () => {
      const palette = getPalette('material-design');
      expect(palette).toBeDefined();
      expect(palette?.name).toBe('Material Design');
      expect(palette?.colors).toBeDefined();
      expect(palette?.colors.length).toBeGreaterThan(0);
    });

    it('should return Tailwind palette', () => {
      const palette = getPalette('tailwind');
      expect(palette).toBeDefined();
      expect(palette?.name).toBe('Tailwind CSS');
      expect(palette?.colors).toBeDefined();
      expect(palette?.colors.length).toBeGreaterThan(0);
    });

    it('should return undefined for unknown palette', () => {
      const palette = getPalette('unknown-palette');
      expect(palette).toBeUndefined();
    });
  });

  describe('Material Design Palette', () => {
    it('should have correct structure', () => {
      expect(materialDesignPalette.name).toBe('Material Design');
      expect(materialDesignPalette.description).toBeDefined();
      expect(materialDesignPalette.version).toBe('3.0');
      expect(materialDesignPalette.colors).toBeDefined();
      expect(materialDesignPalette.colors.length).toBe(19);
    });

    it('should have correct color structure', () => {
      const redColor = materialDesignPalette.colors.find(c => c.name === 'red');
      expect(redColor).toBeDefined();
      expect(redColor?.shades).toHaveLength(10);
      expect(redColor?.shades[0]).toHaveProperty('name');
      expect(redColor?.shades[0]).toHaveProperty('value');
      expect(redColor?.shades[0].value).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('Tailwind Palette', () => {
    it('should have correct structure', () => {
      expect(tailwindPalette.name).toBe('Tailwind CSS');
      expect(tailwindPalette.description).toBeDefined();
      expect(tailwindPalette.version).toBe('3.0');
      expect(tailwindPalette.colors).toBeDefined();
      expect(tailwindPalette.colors.length).toBe(22);
    });

    it('should have 11 shades per color', () => {
      const slateColor = tailwindPalette.colors.find(c => c.name === 'slate');
      expect(slateColor).toBeDefined();
      expect(slateColor?.shades).toHaveLength(11);
      // Check for 950 shade (unique to Tailwind)
      const shade950 = slateColor?.shades.find(s => s.name === '950');
      expect(shade950).toBeDefined();
    });
  });
});

describe('Web Safe Colors', () => {
  it('should have 216 colors', () => {
    expect(webSafeColors).toHaveLength(216);
  });

  it('should have correct color structure', () => {
    const firstColor = webSafeColors[0];
    expect(firstColor).toHaveProperty('hex');
    expect(firstColor).toHaveProperty('rgb');
    expect(firstColor.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(firstColor.rgb).toHaveProperty('r');
    expect(firstColor.rgb).toHaveProperty('g');
    expect(firstColor.rgb).toHaveProperty('b');
  });

  it('should only use web-safe values', () => {
    const webSafeValues = [0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF];
    webSafeColors.forEach(color => {
      expect(webSafeValues).toContain(color.rgb.r);
      expect(webSafeValues).toContain(color.rgb.g);
      expect(webSafeValues).toContain(color.rgb.b);
    });
  });

  describe('Web Safe Color Groups', () => {
    it('should have correct groups', () => {
      const groupNames = webSafeColorGroups.map(g => g.name);
      expect(groupNames).toContain('Grayscale');
      expect(groupNames).toContain('Reds');
      expect(groupNames).toContain('Greens');
      expect(groupNames).toContain('Blues');
      expect(groupNames).toContain('Cyans');
      expect(groupNames).toContain('Magentas');
      expect(groupNames).toContain('Yellows');
    });

    it('should have all colors categorized', () => {
      const totalColors = webSafeColorGroups.reduce((sum, group) => sum + group.colors.length, 0);
      expect(totalColors).toBe(216);
    });
  });

  describe('Web Safe Colors Resource', () => {
    it('should have correct structure', () => {
      expect(webSafeColorsResource.name).toBe('Web Safe Colors');
      expect(webSafeColorsResource.description).toBeDefined();
      expect(webSafeColorsResource.totalColors).toBe(216);
      expect(webSafeColorsResource.groups).toBe(webSafeColorGroups);
      expect(webSafeColorsResource.allColors).toBe(webSafeColors);
    });
  });
});

describe('Named Colors Categories', () => {
  it('should have correct categories', () => {
    const categoryNames = namedColorCategories.map(c => c.name);
    expect(categoryNames).toContain('Basic Colors');
    expect(categoryNames).toContain('Reds & Pinks');
    expect(categoryNames).toContain('Blues');
    expect(categoryNames).toContain('Greens');
    expect(categoryNames).toContain('Grays & Blacks');
  });

  it('should have valid color structure', () => {
    namedColorCategories.forEach(category => {
      expect(category.name).toBeDefined();
      expect(category.description).toBeDefined();
      expect(category.colors).toBeDefined();
      expect(Array.isArray(category.colors)).toBe(true);
      
      category.colors.forEach(color => {
        expect(color.name).toBeDefined();
        expect(color.hex).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe('Named Colors Resource', () => {
    it('should have correct structure', () => {
      expect(namedColorsResource.name).toBe('CSS Named Colors');
      expect(namedColorsResource.description).toBeDefined();
      expect(namedColorsResource.totalColors).toBeGreaterThan(100);
      expect(namedColorsResource.categories).toBe(namedColorCategories);
      expect(namedColorsResource.allColors).toBeDefined();
      expect(Array.isArray(namedColorsResource.allColors)).toBe(true);
    });

    it('should have sorted colors', () => {
      const names = namedColorsResource.allColors.map(c => c.name);
      const sortedNames = [...names].sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(sortedNames);
    });
  });
});