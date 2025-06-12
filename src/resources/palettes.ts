// Material Design and Tailwind CSS color palettes

export interface ColorShade {
  name: string;
  value: string;
}

export interface ColorPalette {
  name: string;
  shades: ColorShade[];
}

export interface PaletteCollection {
  name: string;
  description: string;
  version?: string;
  colors: ColorPalette[];
}

// Material Design Colors (Material Design 3)
export const materialDesignPalette: PaletteCollection = {
  name: 'Material Design',
  description: 'Material Design color palette with primary colors and their shades',
  version: '3.0',
  colors: [
    {
      name: 'red',
      shades: [
        { name: '50', value: '#ffebee' },
        { name: '100', value: '#ffcdd2' },
        { name: '200', value: '#ef9a9a' },
        { name: '300', value: '#e57373' },
        { name: '400', value: '#ef5350' },
        { name: '500', value: '#f44336' },
        { name: '600', value: '#e53935' },
        { name: '700', value: '#d32f2f' },
        { name: '800', value: '#c62828' },
        { name: '900', value: '#b71c1c' },
      ],
    },
    {
      name: 'pink',
      shades: [
        { name: '50', value: '#fce4ec' },
        { name: '100', value: '#f8bbd0' },
        { name: '200', value: '#f48fb1' },
        { name: '300', value: '#f06292' },
        { name: '400', value: '#ec407a' },
        { name: '500', value: '#e91e63' },
        { name: '600', value: '#d81b60' },
        { name: '700', value: '#c2185b' },
        { name: '800', value: '#ad1457' },
        { name: '900', value: '#880e4f' },
      ],
    },
    {
      name: 'purple',
      shades: [
        { name: '50', value: '#f3e5f5' },
        { name: '100', value: '#e1bee7' },
        { name: '200', value: '#ce93d8' },
        { name: '300', value: '#ba68c8' },
        { name: '400', value: '#ab47bc' },
        { name: '500', value: '#9c27b0' },
        { name: '600', value: '#8e24aa' },
        { name: '700', value: '#7b1fa2' },
        { name: '800', value: '#6a1b9a' },
        { name: '900', value: '#4a148c' },
      ],
    },
    {
      name: 'deep-purple',
      shades: [
        { name: '50', value: '#ede7f6' },
        { name: '100', value: '#d1c4e9' },
        { name: '200', value: '#b39ddb' },
        { name: '300', value: '#9575cd' },
        { name: '400', value: '#7e57c2' },
        { name: '500', value: '#673ab7' },
        { name: '600', value: '#5e35b1' },
        { name: '700', value: '#512da8' },
        { name: '800', value: '#4527a0' },
        { name: '900', value: '#311b92' },
      ],
    },
    {
      name: 'indigo',
      shades: [
        { name: '50', value: '#e8eaf6' },
        { name: '100', value: '#c5cae9' },
        { name: '200', value: '#9fa8da' },
        { name: '300', value: '#7986cb' },
        { name: '400', value: '#5c6bc0' },
        { name: '500', value: '#3f51b5' },
        { name: '600', value: '#3949ab' },
        { name: '700', value: '#303f9f' },
        { name: '800', value: '#283593' },
        { name: '900', value: '#1a237e' },
      ],
    },
    {
      name: 'blue',
      shades: [
        { name: '50', value: '#e3f2fd' },
        { name: '100', value: '#bbdefb' },
        { name: '200', value: '#90caf9' },
        { name: '300', value: '#64b5f6' },
        { name: '400', value: '#42a5f5' },
        { name: '500', value: '#2196f3' },
        { name: '600', value: '#1e88e5' },
        { name: '700', value: '#1976d2' },
        { name: '800', value: '#1565c0' },
        { name: '900', value: '#0d47a1' },
      ],
    },
    {
      name: 'light-blue',
      shades: [
        { name: '50', value: '#e1f5fe' },
        { name: '100', value: '#b3e5fc' },
        { name: '200', value: '#81d4fa' },
        { name: '300', value: '#4fc3f7' },
        { name: '400', value: '#29b6f6' },
        { name: '500', value: '#03a9f4' },
        { name: '600', value: '#039be5' },
        { name: '700', value: '#0288d1' },
        { name: '800', value: '#0277bd' },
        { name: '900', value: '#01579b' },
      ],
    },
    {
      name: 'cyan',
      shades: [
        { name: '50', value: '#e0f7fa' },
        { name: '100', value: '#b2ebf2' },
        { name: '200', value: '#80deea' },
        { name: '300', value: '#4dd0e1' },
        { name: '400', value: '#26c6da' },
        { name: '500', value: '#00bcd4' },
        { name: '600', value: '#00acc1' },
        { name: '700', value: '#0097a7' },
        { name: '800', value: '#00838f' },
        { name: '900', value: '#006064' },
      ],
    },
    {
      name: 'teal',
      shades: [
        { name: '50', value: '#e0f2f1' },
        { name: '100', value: '#b2dfdb' },
        { name: '200', value: '#80cbc4' },
        { name: '300', value: '#4db6ac' },
        { name: '400', value: '#26a69a' },
        { name: '500', value: '#009688' },
        { name: '600', value: '#00897b' },
        { name: '700', value: '#00796b' },
        { name: '800', value: '#00695c' },
        { name: '900', value: '#004d40' },
      ],
    },
    {
      name: 'green',
      shades: [
        { name: '50', value: '#e8f5e9' },
        { name: '100', value: '#c8e6c9' },
        { name: '200', value: '#a5d6a7' },
        { name: '300', value: '#81c784' },
        { name: '400', value: '#66bb6a' },
        { name: '500', value: '#4caf50' },
        { name: '600', value: '#43a047' },
        { name: '700', value: '#388e3c' },
        { name: '800', value: '#2e7d32' },
        { name: '900', value: '#1b5e20' },
      ],
    },
    {
      name: 'light-green',
      shades: [
        { name: '50', value: '#f1f8e9' },
        { name: '100', value: '#dcedc8' },
        { name: '200', value: '#c5e1a5' },
        { name: '300', value: '#aed581' },
        { name: '400', value: '#9ccc65' },
        { name: '500', value: '#8bc34a' },
        { name: '600', value: '#7cb342' },
        { name: '700', value: '#689f38' },
        { name: '800', value: '#558b2f' },
        { name: '900', value: '#33691e' },
      ],
    },
    {
      name: 'lime',
      shades: [
        { name: '50', value: '#f9fbe7' },
        { name: '100', value: '#f0f4c3' },
        { name: '200', value: '#e6ee9c' },
        { name: '300', value: '#dce775' },
        { name: '400', value: '#d4e157' },
        { name: '500', value: '#cddc39' },
        { name: '600', value: '#c0ca33' },
        { name: '700', value: '#afb42b' },
        { name: '800', value: '#9e9d24' },
        { name: '900', value: '#827717' },
      ],
    },
    {
      name: 'yellow',
      shades: [
        { name: '50', value: '#fffde7' },
        { name: '100', value: '#fff9c4' },
        { name: '200', value: '#fff59d' },
        { name: '300', value: '#fff176' },
        { name: '400', value: '#ffee58' },
        { name: '500', value: '#ffeb3b' },
        { name: '600', value: '#fdd835' },
        { name: '700', value: '#fbc02d' },
        { name: '800', value: '#f9a825' },
        { name: '900', value: '#f57f17' },
      ],
    },
    {
      name: 'amber',
      shades: [
        { name: '50', value: '#fff8e1' },
        { name: '100', value: '#ffecb3' },
        { name: '200', value: '#ffe082' },
        { name: '300', value: '#ffd54f' },
        { name: '400', value: '#ffca28' },
        { name: '500', value: '#ffc107' },
        { name: '600', value: '#ffb300' },
        { name: '700', value: '#ffa000' },
        { name: '800', value: '#ff8f00' },
        { name: '900', value: '#ff6f00' },
      ],
    },
    {
      name: 'orange',
      shades: [
        { name: '50', value: '#fff3e0' },
        { name: '100', value: '#ffe0b2' },
        { name: '200', value: '#ffcc80' },
        { name: '300', value: '#ffb74d' },
        { name: '400', value: '#ffa726' },
        { name: '500', value: '#ff9800' },
        { name: '600', value: '#fb8c00' },
        { name: '700', value: '#f57c00' },
        { name: '800', value: '#ef6c00' },
        { name: '900', value: '#e65100' },
      ],
    },
    {
      name: 'deep-orange',
      shades: [
        { name: '50', value: '#fbe9e7' },
        { name: '100', value: '#ffccbc' },
        { name: '200', value: '#ffab91' },
        { name: '300', value: '#ff8a65' },
        { name: '400', value: '#ff7043' },
        { name: '500', value: '#ff5722' },
        { name: '600', value: '#f4511e' },
        { name: '700', value: '#e64a19' },
        { name: '800', value: '#d84315' },
        { name: '900', value: '#bf360c' },
      ],
    },
    {
      name: 'brown',
      shades: [
        { name: '50', value: '#efebe9' },
        { name: '100', value: '#d7ccc8' },
        { name: '200', value: '#bcaaa4' },
        { name: '300', value: '#a1887f' },
        { name: '400', value: '#8d6e63' },
        { name: '500', value: '#795548' },
        { name: '600', value: '#6d4c41' },
        { name: '700', value: '#5d4037' },
        { name: '800', value: '#4e342e' },
        { name: '900', value: '#3e2723' },
      ],
    },
    {
      name: 'grey',
      shades: [
        { name: '50', value: '#fafafa' },
        { name: '100', value: '#f5f5f5' },
        { name: '200', value: '#eeeeee' },
        { name: '300', value: '#e0e0e0' },
        { name: '400', value: '#bdbdbd' },
        { name: '500', value: '#9e9e9e' },
        { name: '600', value: '#757575' },
        { name: '700', value: '#616161' },
        { name: '800', value: '#424242' },
        { name: '900', value: '#212121' },
      ],
    },
    {
      name: 'blue-grey',
      shades: [
        { name: '50', value: '#eceff1' },
        { name: '100', value: '#cfd8dc' },
        { name: '200', value: '#b0bec5' },
        { name: '300', value: '#90a4ae' },
        { name: '400', value: '#78909c' },
        { name: '500', value: '#607d8b' },
        { name: '600', value: '#546e7a' },
        { name: '700', value: '#455a64' },
        { name: '800', value: '#37474f' },
        { name: '900', value: '#263238' },
      ],
    },
  ],
};

// Tailwind CSS Colors (v3.0)
export const tailwindPalette: PaletteCollection = {
  name: 'Tailwind CSS',
  description: 'Tailwind CSS default color palette with extensive shades',
  version: '3.0',
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

// Optimized palette lookup using Map for O(1) access
const paletteMap = new Map<string, PaletteCollection>();

// Initialize palette map for fast lookups
function initializePaletteMap() {
  if (paletteMap.size === 0) {
    const palettes = [materialDesignPalette, tailwindPalette];
    for (const palette of palettes) {
      const normalizedName = palette.name.toLowerCase().replace(/\s+/g, '-');
      paletteMap.set(normalizedName, palette);
      
      // Add aliases for common variations
      if (normalizedName === 'tailwind-css') {
        paletteMap.set('tailwind', palette);
      }
      if (normalizedName === 'material-design') {
        paletteMap.set('material', palette);
        paletteMap.set('md', palette);
      }
    }
  }
}

// Helper function to get all palettes
export function getAllPalettes(): PaletteCollection[] {
  return [materialDesignPalette, tailwindPalette];
}

// Optimized helper function to get a specific palette
export function getPalette(name: string): PaletteCollection | undefined {
  initializePaletteMap();
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  return paletteMap.get(normalizedName);
}

// Helper function to get a specific color from a palette
export function getPaletteColor(paletteName: string, colorName: string, shade?: string): ColorShade | undefined {
  const palette = getPalette(paletteName);
  if (!palette) {return undefined;}
  
  const color = palette.colors.find(c => c.name.toLowerCase() === colorName.toLowerCase());
  if (!color) {return undefined;}
  
  if (shade) {
    return color.shades.find(s => s.name === shade);
  }
  
  // Return the middle shade (500) if no specific shade requested
  return color.shades.find(s => s.name === '500') ?? color.shades[Math.floor(color.shades.length / 2)];
}

// Clear palette cache (useful for testing)
export function clearPaletteCache(): void {
  paletteMap.clear();
}