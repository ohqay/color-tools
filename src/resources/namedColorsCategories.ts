// CSS Named Colors organized by category
import { NAMED_COLORS } from '../namedColors.js';

export interface ColorCategory {
  name: string;
  description: string;
  colors: {
    name: string;
    hex: string;
  }[];
}

// Helper function to get color entries
function getColorEntries(colorNames: string[]): { name: string; hex: string }[] {
  return colorNames.map(name => ({
    name,
    hex: NAMED_COLORS[name] || '#000000'
  })).filter(c => c.hex !== '#000000');
}

export const namedColorCategories: ColorCategory[] = [
  {
    name: 'Basic Colors',
    description: 'Fundamental color names',
    colors: getColorEntries([
      'black', 'white', 'red', 'green', 'blue', 'yellow', 
      'cyan', 'magenta', 'gray', 'grey'
    ])
  },
  {
    name: 'Extended Basics',
    description: 'Common web colors',
    colors: getColorEntries([
      'orange', 'purple', 'brown', 'pink', 'lime', 'navy', 
      'teal', 'olive', 'maroon', 'aqua', 'fuchsia', 'silver'
    ])
  },
  {
    name: 'Reds & Pinks',
    description: 'Shades of red and pink',
    colors: getColorEntries([
      'darkred', 'crimson', 'firebrick', 'indianred', 'lightcoral',
      'salmon', 'darksalmon', 'lightsalmon', 'orangered', 'tomato',
      'coral', 'hotpink', 'deeppink', 'pink', 'lightpink', 'palevioletred',
      'mediumvioletred'
    ])
  },
  {
    name: 'Oranges & Browns',
    description: 'Shades of orange and brown',
    colors: getColorEntries([
      'darkorange', 'orange', 'gold', 'goldenrod', 'darkgoldenrod',
      'peru', 'chocolate', 'saddlebrown', 'sienna', 'brown', 'maroon',
      'rosybrown', 'tan', 'burlywood', 'wheat', 'sandybrown'
    ])
  },
  {
    name: 'Yellows & Golds',
    description: 'Shades of yellow and gold',
    colors: getColorEntries([
      'yellow', 'lightyellow', 'lemonchiffon', 'lightgoldenrodyellow',
      'papayawhip', 'moccasin', 'peachpuff', 'palegoldenrod', 'khaki',
      'darkkhaki', 'gold', 'cornsilk', 'blanchedalmond', 'bisque',
      'navajowhite', 'antiquewhite'
    ])
  },
  {
    name: 'Greens',
    description: 'Shades of green',
    colors: getColorEntries([
      'darkgreen', 'green', 'darkolivegreen', 'forestgreen', 'seagreen',
      'olive', 'olivedrab', 'mediumseagreen', 'limegreen', 'lime',
      'springgreen', 'mediumspringgreen', 'darkseagreen', 'mediumaquamarine',
      'yellowgreen', 'lawngreen', 'chartreuse', 'lightgreen', 'greenyellow',
      'palegreen'
    ])
  },
  {
    name: 'Cyans & Aquas',
    description: 'Shades of cyan and aqua',
    colors: getColorEntries([
      'teal', 'darkcyan', 'lightseagreen', 'cadetblue', 'darkturquoise',
      'mediumturquoise', 'turquoise', 'aqua', 'cyan', 'lightcyan',
      'paleturquoise', 'aquamarine'
    ])
  },
  {
    name: 'Blues',
    description: 'Shades of blue',
    colors: getColorEntries([
      'navy', 'darkblue', 'mediumblue', 'blue', 'midnightblue',
      'royalblue', 'steelblue', 'dodgerblue', 'deepskyblue', 'cornflowerblue',
      'skyblue', 'lightskyblue', 'lightsteelblue', 'lightblue', 'powderblue'
    ])
  },
  {
    name: 'Purples & Violets',
    description: 'Shades of purple and violet',
    colors: getColorEntries([
      'indigo', 'purple', 'darkmagenta', 'darkviolet', 'darkslateblue',
      'blueviolet', 'darkorchid', 'fuchsia', 'magenta', 'slateblue',
      'mediumslateblue', 'mediumorchid', 'mediumpurple', 'orchid', 'violet',
      'plum', 'thistle', 'lavender'
    ])
  },
  {
    name: 'Whites & Off-Whites',
    description: 'Shades of white and near-white colors',
    colors: getColorEntries([
      'white', 'snow', 'honeydew', 'mintcream', 'azure', 'aliceblue',
      'ghostwhite', 'whitesmoke', 'seashell', 'beige', 'oldlace',
      'floralwhite', 'ivory', 'antiquewhite', 'linen', 'lavenderblush',
      'mistyrose'
    ])
  },
  {
    name: 'Grays & Blacks',
    description: 'Shades of gray and black',
    colors: getColorEntries([
      'black', 'darkslategray', 'darkslategrey', 'dimgray', 'dimgrey',
      'slategray', 'slategrey', 'gray', 'grey', 'lightslategray',
      'lightslategrey', 'darkgray', 'darkgrey', 'silver', 'lightgray',
      'lightgrey', 'gainsboro'
    ])
  }
];

// Create a resource object for the named colors
export interface NamedColorsResource {
  name: string;
  description: string;
  totalColors: number;
  categories: ColorCategory[];
  allColors: { name: string; hex: string }[];
}

export const namedColorsResource: NamedColorsResource = {
  name: 'CSS Named Colors',
  description: 'All CSS named colors organized by category',
  totalColors: Object.keys(NAMED_COLORS).filter(key => !['transparent', 'currentcolor'].includes(key)).length,
  categories: namedColorCategories,
  allColors: Object.entries(NAMED_COLORS)
    .filter(([key]) => !['transparent', 'currentcolor'].includes(key))
    .map(([name, hex]) => ({ name, hex }))
    .sort((a, b) => a.name.localeCompare(b.name))
};