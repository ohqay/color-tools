import { describe, it, expect } from 'vitest';
import { NAMED_COLORS } from '../namedColors.js';

describe('NAMED_COLORS', () => {
  describe('Basic color definitions', () => {
    it('should define all basic colors correctly', () => {
      expect(NAMED_COLORS.black).toBe('#000000');
      expect(NAMED_COLORS.white).toBe('#ffffff');
      expect(NAMED_COLORS.red).toBe('#ff0000');
      expect(NAMED_COLORS.green).toBe('#008000');
      expect(NAMED_COLORS.blue).toBe('#0000ff');
      expect(NAMED_COLORS.yellow).toBe('#ffff00');
      expect(NAMED_COLORS.cyan).toBe('#00ffff');
      expect(NAMED_COLORS.magenta).toBe('#ff00ff');
    });
  });

  describe('Gray color variations', () => {
    it('should define gray shades correctly', () => {
      expect(NAMED_COLORS.gray).toBe('#808080');
      expect(NAMED_COLORS.grey).toBe('#808080');
      expect(NAMED_COLORS.darkgray).toBe('#a9a9a9');
      expect(NAMED_COLORS.darkgrey).toBe('#a9a9a9');
      expect(NAMED_COLORS.lightgray).toBe('#d3d3d3');
      expect(NAMED_COLORS.lightgrey).toBe('#d3d3d3');
      expect(NAMED_COLORS.dimgray).toBe('#696969');
      expect(NAMED_COLORS.dimgrey).toBe('#696969');
    });

    it('should have consistent spelling variations', () => {
      expect(NAMED_COLORS.gray).toBe(NAMED_COLORS.grey);
      expect(NAMED_COLORS.darkgray).toBe(NAMED_COLORS.darkgrey);
      expect(NAMED_COLORS.lightgray).toBe(NAMED_COLORS.lightgrey);
      expect(NAMED_COLORS.dimgray).toBe(NAMED_COLORS.dimgrey);
      expect(NAMED_COLORS.slategray).toBe(NAMED_COLORS.slategrey);
      expect(NAMED_COLORS.darkslategray).toBe(NAMED_COLORS.darkslategrey);
      expect(NAMED_COLORS.lightslategray).toBe(NAMED_COLORS.lightslategrey);
    });
  });

  describe('Common web colors', () => {
    it('should define common web colors correctly', () => {
      expect(NAMED_COLORS.orange).toBe('#ffa500');
      expect(NAMED_COLORS.purple).toBe('#800080');
      expect(NAMED_COLORS.brown).toBe('#a52a2a');
      expect(NAMED_COLORS.pink).toBe('#ffc0cb');
      expect(NAMED_COLORS.lime).toBe('#00ff00');
      expect(NAMED_COLORS.navy).toBe('#000080');
      expect(NAMED_COLORS.teal).toBe('#008080');
      expect(NAMED_COLORS.olive).toBe('#808000');
      expect(NAMED_COLORS.maroon).toBe('#800000');
      expect(NAMED_COLORS.aqua).toBe('#00ffff');
      expect(NAMED_COLORS.fuchsia).toBe('#ff00ff');
      expect(NAMED_COLORS.silver).toBe('#c0c0c0');
    });
  });

  describe('Extended color palette', () => {
    it('should define extended colors correctly', () => {
      // Test a sample of extended colors
      expect(NAMED_COLORS.aliceblue).toBe('#f0f8ff');
      expect(NAMED_COLORS.antiquewhite).toBe('#faebd7');
      expect(NAMED_COLORS.aquamarine).toBe('#7fffd4');
      expect(NAMED_COLORS.azure).toBe('#f0ffff');
      expect(NAMED_COLORS.beige).toBe('#f5f5dc');
      expect(NAMED_COLORS.bisque).toBe('#ffe4c4');
      expect(NAMED_COLORS.blanchedalmond).toBe('#ffebcd');
      expect(NAMED_COLORS.blueviolet).toBe('#8a2be2');
      expect(NAMED_COLORS.burlywood).toBe('#deb887');
      expect(NAMED_COLORS.cadetblue).toBe('#5f9ea0');
    });

    it('should define all red-based colors', () => {
      expect(NAMED_COLORS.crimson).toBe('#dc143c');
      expect(NAMED_COLORS.darkred).toBe('#8b0000');
      expect(NAMED_COLORS.darksalmon).toBe('#e9967a');
      expect(NAMED_COLORS.indianred).toBe('#cd5c5c');
      expect(NAMED_COLORS.lightcoral).toBe('#f08080');
      expect(NAMED_COLORS.lightsalmon).toBe('#ffa07a');
      expect(NAMED_COLORS.salmon).toBe('#fa8072');
      expect(NAMED_COLORS.firebrick).toBe('#b22222');
      expect(NAMED_COLORS.tomato).toBe('#ff6347');
    });

    it('should define all green-based colors', () => {
      expect(NAMED_COLORS.chartreuse).toBe('#7fff00');
      expect(NAMED_COLORS.darkgreen).toBe('#006400');
      expect(NAMED_COLORS.darkolivegreen).toBe('#556b2f');
      expect(NAMED_COLORS.darkseagreen).toBe('#8fbc8f');
      expect(NAMED_COLORS.forestgreen).toBe('#228b22');
      expect(NAMED_COLORS.greenyellow).toBe('#adff2f');
      expect(NAMED_COLORS.lawngreen).toBe('#7cfc00');
      expect(NAMED_COLORS.lightgreen).toBe('#90ee90');
      expect(NAMED_COLORS.lightseagreen).toBe('#20b2aa');
      expect(NAMED_COLORS.limegreen).toBe('#32cd32');
      expect(NAMED_COLORS.mediumaquamarine).toBe('#66cdaa');
      expect(NAMED_COLORS.mediumseagreen).toBe('#3cb371');
      expect(NAMED_COLORS.mediumspringgreen).toBe('#00fa9a');
      expect(NAMED_COLORS.olivedrab).toBe('#6b8e23');
      expect(NAMED_COLORS.palegreen).toBe('#98fb98');
      expect(NAMED_COLORS.seagreen).toBe('#2e8b57');
      expect(NAMED_COLORS.springgreen).toBe('#00ff7f');
      expect(NAMED_COLORS.yellowgreen).toBe('#9acd32');
    });

    it('should define all blue-based colors', () => {
      expect(NAMED_COLORS.darkblue).toBe('#00008b');
      expect(NAMED_COLORS.darkslateblue).toBe('#483d8b');
      expect(NAMED_COLORS.darkturquoise).toBe('#00ced1');
      expect(NAMED_COLORS.deepskyblue).toBe('#00bfff');
      expect(NAMED_COLORS.dodgerblue).toBe('#1e90ff');
      expect(NAMED_COLORS.lightblue).toBe('#add8e6');
      expect(NAMED_COLORS.lightskyblue).toBe('#87cefa');
      expect(NAMED_COLORS.lightsteelblue).toBe('#b0c4de');
      expect(NAMED_COLORS.mediumblue).toBe('#0000cd');
      expect(NAMED_COLORS.mediumslateblue).toBe('#7b68ee');
      expect(NAMED_COLORS.mediumturquoise).toBe('#48d1cc');
      expect(NAMED_COLORS.midnightblue).toBe('#191970');
      expect(NAMED_COLORS.powderblue).toBe('#b0e0e6');
      expect(NAMED_COLORS.royalblue).toBe('#4169e1');
      expect(NAMED_COLORS.skyblue).toBe('#87ceeb');
      expect(NAMED_COLORS.slateblue).toBe('#6a5acd');
      expect(NAMED_COLORS.steelblue).toBe('#4682b4');
      expect(NAMED_COLORS.turquoise).toBe('#40e0d0');
    });
  });

  describe('Special keywords', () => {
    it('should define special CSS keywords', () => {
      expect(NAMED_COLORS.transparent).toBe('transparent');
      expect(NAMED_COLORS.currentcolor).toBe('currentcolor');
    });

    it('should not have special keywords that are hex colors', () => {
      expect(NAMED_COLORS.transparent).not.toMatch(/^#[0-9a-f]{6}$/i);
      expect(NAMED_COLORS.currentcolor).not.toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe('Color format validation', () => {
    it('should have all regular colors in valid hex format', () => {
      Object.entries(NAMED_COLORS).forEach(([_name, value]) => {
        if (value !== 'transparent' && value !== 'currentcolor') {
          expect(value).toMatch(/^#[0-9a-f]{6}$/i);
        }
      });
    });

    it('should have lowercase hex values', () => {
      Object.entries(NAMED_COLORS).forEach(([_name, value]) => {
        if (value !== 'transparent' && value !== 'currentcolor') {
          expect(value).toBe(value.toLowerCase());
        }
      });
    });
  });

  describe('Color relationships', () => {
    it('should have aqua equal to cyan', () => {
      expect(NAMED_COLORS.aqua).toBe(NAMED_COLORS.cyan);
    });

    it('should have fuchsia equal to magenta', () => {
      expect(NAMED_COLORS.fuchsia).toBe(NAMED_COLORS.magenta);
    });

    it('should have different values for lime and green', () => {
      expect(NAMED_COLORS.lime).not.toBe(NAMED_COLORS.green);
      expect(NAMED_COLORS.lime).toBe('#00ff00'); // Full green
      expect(NAMED_COLORS.green).toBe('#008000'); // Dark green
    });
  });

  describe('Color count and completeness', () => {
    it('should have at least 140 named colors', () => {
      const colorCount = Object.keys(NAMED_COLORS).length;
      expect(colorCount).toBeGreaterThanOrEqual(140);
    });

    it('should contain all CSS3 standard colors', () => {
      // Test for presence of some standard CSS3 colors
      const css3Colors = [
        'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure',
        'beige', 'bisque', 'black', 'blanchedalmond', 'blue',
        'blueviolet', 'brown', 'burlywood', 'cadetblue', 'chartreuse',
        'chocolate', 'coral', 'cornflowerblue', 'cornsilk', 'crimson',
        'cyan', 'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray',
        'darkgreen', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange',
        'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
        'darkslategray', 'darkturquoise', 'darkviolet', 'deeppink', 'deepskyblue',
        'dimgray', 'dodgerblue', 'firebrick', 'floralwhite', 'forestgreen',
        'fuchsia', 'gainsboro', 'ghostwhite', 'gold', 'goldenrod',
        'gray', 'green', 'greenyellow', 'honeydew', 'hotpink',
        'indianred', 'indigo', 'ivory', 'khaki', 'lavender',
        'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue', 'lightcoral',
        'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightpink',
        'lightsalmon', 'lightseagreen', 'lightskyblue', 'lightslategray', 'lightsteelblue',
        'lightyellow', 'lime', 'limegreen', 'linen', 'magenta',
        'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid', 'mediumpurple',
        'mediumseagreen', 'mediumslateblue', 'mediumspringgreen', 'mediumturquoise', 'mediumvioletred',
        'midnightblue', 'mintcream', 'mistyrose', 'moccasin', 'navajowhite',
        'navy', 'oldlace', 'olive', 'olivedrab', 'orange',
        'orangered', 'orchid', 'palegoldenrod', 'palegreen', 'paleturquoise',
        'palevioletred', 'papayawhip', 'peachpuff', 'peru', 'pink',
        'plum', 'powderblue', 'purple', 'red', 'rosybrown',
        'royalblue', 'saddlebrown', 'salmon', 'sandybrown', 'seagreen',
        'seashell', 'sienna', 'silver', 'skyblue', 'slateblue',
        'slategray', 'snow', 'springgreen', 'steelblue', 'tan',
        'teal', 'thistle', 'tomato', 'turquoise', 'violet',
        'wheat', 'white', 'whitesmoke', 'yellow', 'yellowgreen'
      ];

      css3Colors.forEach(color => {
        expect(NAMED_COLORS).toHaveProperty(color);
      });
    });
  });

  describe('Specific color values', () => {
    it('should have correct values for commonly used colors', () => {
      // Test some specific colors that are commonly used
      expect(NAMED_COLORS.gold).toBe('#ffd700');
      expect(NAMED_COLORS.silver).toBe('#c0c0c0');
      expect(NAMED_COLORS.bronze).toBeUndefined(); // Bronze is not a CSS color
      expect(NAMED_COLORS.indigo).toBe('#4b0082');
      expect(NAMED_COLORS.violet).toBe('#ee82ee');
      expect(NAMED_COLORS.turquoise).toBe('#40e0d0');
      expect(NAMED_COLORS.coral).toBe('#ff7f50');
      expect(NAMED_COLORS.salmon).toBe('#fa8072');
      expect(NAMED_COLORS.khaki).toBe('#f0e68c');
      expect(NAMED_COLORS.lavender).toBe('#e6e6fa');
      expect(NAMED_COLORS.ivory).toBe('#fffff0');
      expect(NAMED_COLORS.beige).toBe('#f5f5dc');
      expect(NAMED_COLORS.tan).toBe('#d2b48c');
      expect(NAMED_COLORS.chocolate).toBe('#d2691e');
      expect(NAMED_COLORS.peru).toBe('#cd853f');
      expect(NAMED_COLORS.sienna).toBe('#a0522d');
    });
  });
});