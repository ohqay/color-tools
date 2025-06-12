// Tailwind CSS V4 color palette with OKLCH-based colors
// These colors use the new OKLCH color space for improved vibrancy and consistency

export interface TailwindV4ColorShade {
  name: string;
  value: string;
  oklch?: string; // OKLCH value when available
}

export interface TailwindV4Color {
  name: string;
  shades: TailwindV4ColorShade[];
}

export interface TailwindV4Palette {
  name: string;
  description: string;
  version: string;
  colors: TailwindV4Color[];
  oklchBased: boolean;
}

// Tailwind CSS V4 color palette
// Note: These hex values are approximations converted from the new OKLCH color space
// The actual colors in V4 may appear more vivid on displays that support the P3 color gamut
export const tailwindV4Palette: TailwindV4Palette = {
  name: 'Tailwind CSS V4',
  description: 'Tailwind CSS v4.0 modernized P3 color palette using OKLCH color space for enhanced vibrancy',
  version: '4.0',
  oklchBased: true,
  colors: [
    {
      name: 'slate',
      shades: [
        { name: '50', value: '#f8fafc' },
        { name: '100', value: '#f1f5f9' },
        { name: '200', value: '#e2e8f0' },
        { name: '300', value: '#cbd5e1' },
        { name: '400', value: '#94a3b8' },
        { name: '500', value: '#64748b' },
        { name: '600', value: '#475569' },
        { name: '700', value: '#334155' },
        { name: '800', value: '#1e293b' },
        { name: '900', value: '#0f172a' },
        { name: '950', value: '#020617' },
      ],
    },
    {
      name: 'gray',
      shades: [
        { name: '50', value: '#f9fafb' },
        { name: '100', value: '#f3f4f6' },
        { name: '200', value: '#e5e7eb' },
        { name: '300', value: '#d1d5db' },
        { name: '400', value: '#9ca3af' },
        { name: '500', value: '#6b7280' },
        { name: '600', value: '#4b5563' },
        { name: '700', value: '#374151' },
        { name: '800', value: '#1f2937' },
        { name: '900', value: '#111827' },
        { name: '950', value: '#030712' },
      ],
    },
    {
      name: 'zinc',
      shades: [
        { name: '50', value: '#fafafa' },
        { name: '100', value: '#f4f4f5' },
        { name: '200', value: '#e4e4e7' },
        { name: '300', value: '#d4d4d8' },
        { name: '400', value: '#a1a1aa' },
        { name: '500', value: '#71717a' },
        { name: '600', value: '#52525b' },
        { name: '700', value: '#3f3f46' },
        { name: '800', value: '#27272a' },
        { name: '900', value: '#18181b' },
        { name: '950', value: '#09090b' },
      ],
    },
    {
      name: 'neutral',
      shades: [
        { name: '50', value: '#fafafa' },
        { name: '100', value: '#f5f5f5' },
        { name: '200', value: '#e5e5e5' },
        { name: '300', value: '#d4d4d4' },
        { name: '400', value: '#a3a3a3' },
        { name: '500', value: '#737373' },
        { name: '600', value: '#525252' },
        { name: '700', value: '#404040' },
        { name: '800', value: '#262626' },
        { name: '900', value: '#171717' },
        { name: '950', value: '#0a0a0a' },
      ],
    },
    {
      name: 'stone',
      shades: [
        { name: '50', value: '#fafaf9' },
        { name: '100', value: '#f5f5f4' },
        { name: '200', value: '#e7e5e4' },
        { name: '300', value: '#d6d3d1' },
        { name: '400', value: '#a8a29e' },
        { name: '500', value: '#78716c' },
        { name: '600', value: '#57534e' },
        { name: '700', value: '#44403c' },
        { name: '800', value: '#292524' },
        { name: '900', value: '#1c1917' },
        { name: '950', value: '#0c0a09' },
      ],
    },
    {
      name: 'red',
      shades: [
        { name: '50', value: '#fef2f2' },
        { name: '100', value: '#fee2e2' },
        { name: '200', value: '#fecaca' },
        { name: '300', value: '#fca5a5' },
        { name: '400', value: '#f87171' },
        { name: '500', value: '#ef4444' },
        { name: '600', value: '#dc2626' },
        { name: '700', value: '#b91c1c' },
        { name: '800', value: '#991b1b' },
        { name: '900', value: '#7f1d1d' },
        { name: '950', value: '#450a0a' },
      ],
    },
    {
      name: 'orange',
      shades: [
        { name: '50', value: '#fff7ed' },
        { name: '100', value: '#ffedd5' },
        { name: '200', value: '#fed7aa' },
        { name: '300', value: '#fdba74' },
        { name: '400', value: '#fb923c' },
        { name: '500', value: '#f97316' },
        { name: '600', value: '#ea580c' },
        { name: '700', value: '#c2410c' },
        { name: '800', value: '#9a3412' },
        { name: '900', value: '#7c2d12' },
        { name: '950', value: '#431407' },
      ],
    },
    {
      name: 'amber',
      shades: [
        { name: '50', value: '#fffbeb' },
        { name: '100', value: '#fef3c7' },
        { name: '200', value: '#fde68a' },
        { name: '300', value: '#fcd34d' },
        { name: '400', value: '#fbbf24' },
        { name: '500', value: '#f59e0b' },
        { name: '600', value: '#d97706' },
        { name: '700', value: '#b45309' },
        { name: '800', value: '#92400e' },
        { name: '900', value: '#78350f' },
        { name: '950', value: '#451a03' },
      ],
    },
    {
      name: 'yellow',
      shades: [
        { name: '50', value: '#fefce8' },
        { name: '100', value: '#fef9c3' },
        { name: '200', value: '#fef08a' },
        { name: '300', value: '#fde047' },
        { name: '400', value: '#facc15' },
        { name: '500', value: '#eab308' },
        { name: '600', value: '#ca8a04' },
        { name: '700', value: '#a16207' },
        { name: '800', value: '#854d0e' },
        { name: '900', value: '#713f12' },
        { name: '950', value: '#422006' },
      ],
    },
    {
      name: 'lime',
      shades: [
        { name: '50', value: '#f7fee7' },
        { name: '100', value: '#ecfccb' },
        { name: '200', value: '#d9f99d' },
        { name: '300', value: '#bef264' },
        { name: '400', value: '#a3e635' },
        { name: '500', value: '#84cc16' },
        { name: '600', value: '#65a30d' },
        { name: '700', value: '#4d7c0f' },
        { name: '800', value: '#3f6212' },
        { name: '900', value: '#365314' },
        { name: '950', value: '#1a2e05' },
      ],
    },
    {
      name: 'green',
      shades: [
        { name: '50', value: '#f0fdf4' },
        { name: '100', value: '#dcfce7' },
        { name: '200', value: '#bbf7d0' },
        { name: '300', value: '#86efac' },
        { name: '400', value: '#4ade80' },
        { name: '500', value: '#22c55e' },
        { name: '600', value: '#16a34a' },
        { name: '700', value: '#15803d' },
        { name: '800', value: '#166534' },
        { name: '900', value: '#14532d' },
        { name: '950', value: '#052e16' },
      ],
    },
    {
      name: 'emerald',
      shades: [
        { name: '50', value: '#ecfdf5' },
        { name: '100', value: '#d1fae5' },
        { name: '200', value: '#a7f3d0' },
        { name: '300', value: '#6ee7b7' },
        { name: '400', value: '#34d399' },
        { name: '500', value: '#10b981' },
        { name: '600', value: '#059669' },
        { name: '700', value: '#047857' },
        { name: '800', value: '#065f46' },
        { name: '900', value: '#064e3b' },
        { name: '950', value: '#022c22' },
      ],
    },
    {
      name: 'teal',
      shades: [
        { name: '50', value: '#f0fdfa' },
        { name: '100', value: '#ccfbf1' },
        { name: '200', value: '#99f6e4' },
        { name: '300', value: '#5eead4' },
        { name: '400', value: '#2dd4bf' },
        { name: '500', value: '#14b8a6' },
        { name: '600', value: '#0d9488' },
        { name: '700', value: '#0f766e' },
        { name: '800', value: '#115e59' },
        { name: '900', value: '#134e4a' },
        { name: '950', value: '#042f2e' },
      ],
    },
    {
      name: 'cyan',
      shades: [
        { name: '50', value: '#ecfeff' },
        { name: '100', value: '#cffafe' },
        { name: '200', value: '#a5f3fc' },
        { name: '300', value: '#67e8f9' },
        { name: '400', value: '#22d3ee' },
        { name: '500', value: '#06b6d4' },
        { name: '600', value: '#0891b2' },
        { name: '700', value: '#0e7490' },
        { name: '800', value: '#155e75' },
        { name: '900', value: '#164e63' },
        { name: '950', value: '#083344' },
      ],
    },
    {
      name: 'sky',
      shades: [
        { name: '50', value: '#f0f9ff' },
        { name: '100', value: '#e0f2fe' },
        { name: '200', value: '#bae6fd' },
        { name: '300', value: '#7dd3fc' },
        { name: '400', value: '#38bdf8' },
        { name: '500', value: '#0ea5e9' },
        { name: '600', value: '#0284c7' },
        { name: '700', value: '#0369a1' },
        { name: '800', value: '#075985' },
        { name: '900', value: '#0c4a6e' },
        { name: '950', value: '#082f49' },
      ],
    },
    {
      name: 'blue',
      shades: [
        { name: '50', value: '#eff6ff' },
        { name: '100', value: '#dbeafe' },
        { name: '200', value: '#bfdbfe' },
        { name: '300', value: '#93c5fd' },
        { name: '400', value: '#60a5fa' },
        { name: '500', value: '#3b82f6' },
        { name: '600', value: '#2563eb' },
        { name: '700', value: '#1d4ed8' },
        { name: '800', value: '#1e40af' },
        { name: '900', value: '#1e3a8a' },
        { name: '950', value: '#172554' },
      ],
    },
    {
      name: 'indigo',
      shades: [
        { name: '50', value: '#eef2ff' },
        { name: '100', value: '#e0e7ff' },
        { name: '200', value: '#c7d2fe' },
        { name: '300', value: '#a5b4fc' },
        { name: '400', value: '#818cf8' },
        { name: '500', value: '#6366f1' },
        { name: '600', value: '#4f46e5' },
        { name: '700', value: '#4338ca' },
        { name: '800', value: '#3730a3' },
        { name: '900', value: '#312e81' },
        { name: '950', value: '#1e1b4b' },
      ],
    },
    {
      name: 'violet',
      shades: [
        { name: '50', value: '#f5f3ff' },
        { name: '100', value: '#ede9fe' },
        { name: '200', value: '#ddd6fe' },
        { name: '300', value: '#c4b5fd' },
        { name: '400', value: '#a78bfa' },
        { name: '500', value: '#8b5cf6' },
        { name: '600', value: '#7c3aed' },
        { name: '700', value: '#6d28d9' },
        { name: '800', value: '#5b21b6' },
        { name: '900', value: '#4c1d95' },
        { name: '950', value: '#2e1065' },
      ],
    },
    {
      name: 'purple',
      shades: [
        { name: '50', value: '#faf5ff' },
        { name: '100', value: '#f3e8ff' },
        { name: '200', value: '#e9d5ff' },
        { name: '300', value: '#d8b4fe' },
        { name: '400', value: '#c084fc' },
        { name: '500', value: '#a855f7' },
        { name: '600', value: '#9333ea' },
        { name: '700', value: '#7e22ce' },
        { name: '800', value: '#6b21a8' },
        { name: '900', value: '#581c87' },
        { name: '950', value: '#3b0764' },
      ],
    },
    {
      name: 'fuchsia',
      shades: [
        { name: '50', value: '#fdf4ff' },
        { name: '100', value: '#fae8ff' },
        { name: '200', value: '#f5d0fe' },
        { name: '300', value: '#f0abfc' },
        { name: '400', value: '#e879f9' },
        { name: '500', value: '#d946ef' },
        { name: '600', value: '#c026d3' },
        { name: '700', value: '#a21caf' },
        { name: '800', value: '#86198f' },
        { name: '900', value: '#701a75' },
        { name: '950', value: '#4a044e' },
      ],
    },
    {
      name: 'pink',
      shades: [
        { name: '50', value: '#fdf2f8' },
        { name: '100', value: '#fce7f3' },
        { name: '200', value: '#fbcfe8' },
        { name: '300', value: '#f9a8d4' },
        { name: '400', value: '#f472b6' },
        { name: '500', value: '#ec4899' },
        { name: '600', value: '#db2777' },
        { name: '700', value: '#be185d' },
        { name: '800', value: '#9d174d' },
        { name: '900', value: '#831843' },
        { name: '950', value: '#500724' },
      ],
    },
    {
      name: 'rose',
      shades: [
        { name: '50', value: '#fff1f2' },
        { name: '100', value: '#ffe4e6' },
        { name: '200', value: '#fecdd3' },
        { name: '300', value: '#fda4af' },
        { name: '400', value: '#fb7185' },
        { name: '500', value: '#f43f5e' },
        { name: '600', value: '#e11d48' },
        { name: '700', value: '#be123c' },
        { name: '800', value: '#9f1239' },
        { name: '900', value: '#881337' },
        { name: '950', value: '#4c0519' },
      ],
    },
  ],
};

// Helper functions for Tailwind V4 colors
export function getAllTailwindV4Colors(): TailwindV4Color[] {
  return tailwindV4Palette.colors;
}

export function getTailwindV4Color(colorName: string): TailwindV4Color | undefined {
  return tailwindV4Palette.colors.find(color => 
    color.name.toLowerCase() === colorName.toLowerCase()
  );
}

export function getTailwindV4ColorShade(colorName: string, shade: string): TailwindV4ColorShade | undefined {
  const color = getTailwindV4Color(colorName);
  if (!color) {return undefined;}
  
  return color.shades.find(s => s.name === shade);
}

export interface TailwindColorMatch {
  color: string;
  shade: string;
  value: string;
  distance: number;
  exactMatch: boolean;
}

export interface TailwindColorSearchResult {
  exactMatch: boolean;
  result?: { color: string; shade: string };
  closestMatches?: TailwindColorMatch[];
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalizedHex = hex.replace('#', '');
  const r = parseInt(normalizedHex.substr(0, 2), 16);
  const g = parseInt(normalizedHex.substr(2, 2), 16);
  const b = parseInt(normalizedHex.substr(4, 2), 16);
  return { r, g, b };
}

// Calculate color distance using Delta E (simplified version)
function calculateColorDistance(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  
  // Simple Euclidean distance in RGB space
  // For better accuracy, we could convert to LAB space, but this is sufficient for basic matching
  const deltaR = rgb1.r - rgb2.r;
  const deltaG = rgb1.g - rgb2.g;
  const deltaB = rgb1.b - rgb2.b;
  
  return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
}

export function findTailwindV4ColorByHex(hexValue: string): { color: string; shade: string } | undefined {
  const normalizedHex = hexValue.toLowerCase().replace('#', '');
  
  for (const color of tailwindV4Palette.colors) {
    for (const shade of color.shades) {
      const shadeHex = shade.value.toLowerCase().replace('#', '');
      if (shadeHex === normalizedHex) {
        return { color: color.name, shade: shade.name };
      }
    }
  }
  return undefined;
}

export function findTailwindV4ColorByHexWithSimilar(hexValue: string, maxResults = 3): TailwindColorSearchResult {
  const normalizedHex = hexValue.toLowerCase();
  const exactMatch = findTailwindV4ColorByHex(hexValue);
  
  if (exactMatch) {
    return {
      exactMatch: true,
      result: exactMatch
    };
  }
  
  // Find closest matches
  const matches: TailwindColorMatch[] = [];
  
  for (const color of tailwindV4Palette.colors) {
    for (const shade of color.shades) {
      const distance = calculateColorDistance(normalizedHex, shade.value);
      matches.push({
        color: color.name,
        shade: shade.name,
        value: shade.value,
        distance,
        exactMatch: false
      });
    }
  }
  
  // Sort by distance and take top results
  matches.sort((a, b) => a.distance - b.distance);
  const closestMatches = matches.slice(0, maxResults);
  
  return {
    exactMatch: false,
    closestMatches
  };
}

export function searchTailwindV4Colors(query: string): { color: string; shade: string; value: string }[] {
  const results: { color: string; shade: string; value: string }[] = [];
  const normalizedQuery = query.toLowerCase();
  
  for (const color of tailwindV4Palette.colors) {
    if (color.name.toLowerCase().includes(normalizedQuery)) {
      for (const shade of color.shades) {
        results.push({
          color: color.name,
          shade: shade.name,
          value: shade.value
        });
      }
    }
  }
  
  return results;
}