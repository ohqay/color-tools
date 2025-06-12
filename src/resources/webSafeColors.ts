// Web Safe Colors (216 colors)
// These are colors that display consistently across different browsers and systems

export interface WebSafeColor {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
  };
}

// Generate the 216 web-safe colors
// Web-safe colors use combinations of 00, 33, 66, 99, CC, FF for each RGB channel
function generateWebSafeColors(): WebSafeColor[] {
  const webSafeValues = [0x00, 0x33, 0x66, 0x99, 0xCC, 0xFF];
  const colors: WebSafeColor[] = [];

  for (const r of webSafeValues) {
    for (const g of webSafeValues) {
      for (const b of webSafeValues) {
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        colors.push({
          hex,
          rgb: { r, g, b }
        });
      }
    }
  }

  return colors;
}

export const webSafeColors: WebSafeColor[] = generateWebSafeColors();

// Group web-safe colors by hue for better organization
export interface WebSafeColorGroup {
  name: string;
  description: string;
  colors: WebSafeColor[];
}

function categorizeWebSafeColors(): WebSafeColorGroup[] {
  const groups: WebSafeColorGroup[] = [
    {
      name: 'Grayscale',
      description: 'Shades of gray from black to white',
      colors: webSafeColors.filter(c => c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
    },
    {
      name: 'Reds',
      description: 'Red-dominant colors',
      colors: webSafeColors.filter(c => 
        c.rgb.r > c.rgb.g && c.rgb.r > c.rgb.b && 
        !(c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
      )
    },
    {
      name: 'Greens',
      description: 'Green-dominant colors',
      colors: webSafeColors.filter(c => 
        c.rgb.g > c.rgb.r && c.rgb.g > c.rgb.b &&
        !(c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
      )
    },
    {
      name: 'Blues',
      description: 'Blue-dominant colors',
      colors: webSafeColors.filter(c => 
        c.rgb.b > c.rgb.r && c.rgb.b > c.rgb.g &&
        !(c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
      )
    },
    {
      name: 'Cyans',
      description: 'Cyan colors (green-blue combinations)',
      colors: webSafeColors.filter(c => 
        c.rgb.g === c.rgb.b && c.rgb.g > c.rgb.r &&
        !(c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
      )
    },
    {
      name: 'Magentas',
      description: 'Magenta colors (red-blue combinations)',
      colors: webSafeColors.filter(c => 
        c.rgb.r === c.rgb.b && c.rgb.r > c.rgb.g &&
        !(c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
      )
    },
    {
      name: 'Yellows',
      description: 'Yellow colors (red-green combinations)',
      colors: webSafeColors.filter(c => 
        c.rgb.r === c.rgb.g && c.rgb.r > c.rgb.b &&
        !(c.rgb.r === c.rgb.g && c.rgb.g === c.rgb.b)
      )
    }
  ];

  return groups;
}

export const webSafeColorGroups: WebSafeColorGroup[] = categorizeWebSafeColors();

// Export a formatted version for the resource
export interface WebSafeColorsResource {
  name: string;
  description: string;
  totalColors: number;
  groups: WebSafeColorGroup[];
  allColors: WebSafeColor[];
}

export const webSafeColorsResource: WebSafeColorsResource = {
  name: 'Web Safe Colors',
  description: 'The 216 web-safe colors that display consistently across different browsers and systems',
  totalColors: webSafeColors.length,
  groups: webSafeColorGroups,
  allColors: webSafeColors
};