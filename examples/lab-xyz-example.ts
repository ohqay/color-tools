import { ColorConverter } from '../src/colorConverter.js';

console.log('LAB and XYZ Color Space Examples\n');

// Example 1: Convert RGB to LAB and XYZ
console.log('1. Converting RGB to LAB and XYZ:');
const redResult = ColorConverter.convert('#FF0000');
console.log('Red (#FF0000):');
console.log(`  LAB: ${redResult.lab}`);
console.log(`  XYZ: ${redResult.xyz}`);

const greenResult = ColorConverter.convert('#00FF00');
console.log('\nGreen (#00FF00):');
console.log(`  LAB: ${greenResult.lab}`);
console.log(`  XYZ: ${greenResult.xyz}`);

// Example 2: Convert from LAB format
console.log('\n2. Converting from LAB format:');
const labColor = ColorConverter.convert('lab(50%, 25, -50)');
console.log('lab(50%, 25, -50) converts to:');
console.log(`  Hex: ${labColor.hex}`);
console.log(`  RGB: ${labColor.rgb}`);

// Example 3: Convert from XYZ format
console.log('\n3. Converting from XYZ format:');
const xyzColor = ColorConverter.convert('xyz(41.24, 21.26, 1.93)');
console.log('xyz(41.24, 21.26, 1.93) converts to:');
console.log(`  Hex: ${xyzColor.hex}`);
console.log(`  RGB: ${xyzColor.rgb}`);

// Example 4: Color mixing in LAB space
console.log('\n4. Color Mixing Examples:');

// Mix red and blue in LAB space (perceptually uniform)
const mixedNormal = ColorConverter.mixColors('#FF0000', '#0000FF', 0.5, 'normal');
console.log('\nMixing red and blue (50% in LAB space):');
console.log(`  Result: ${mixedNormal.hex}`);
console.log(`  RGB: ${mixedNormal.rgb}`);
console.log(`  LAB: ${mixedNormal.lab}`);

// Mix with different ratios
const mixed25 = ColorConverter.mixColors('#FFFFFF', '#000000', 0.25, 'normal');
console.log('\nMixing white and black (25% black):');
console.log(`  Result: ${mixed25.hex}`);
console.log(`  LAB: ${mixed25.lab}`);

// Example 5: Different blend modes
console.log('\n5. Different Blend Modes:');

const multiply = ColorConverter.mixColors('#FF8080', '#80FF80', 0.5, 'multiply');
console.log('\nMultiply blend:');
console.log(`  Result: ${multiply.hex}`);

const screen = ColorConverter.mixColors('#800000', '#008000', 0.5, 'screen');
console.log('\nScreen blend:');
console.log(`  Result: ${screen.hex}`);

const overlay = ColorConverter.mixColors('#808080', '#FF0000', 0.5, 'overlay');
console.log('\nOverlay blend:');
console.log(`  Result: ${overlay.hex}`);

// Example 6: Mixing with alpha channels
console.log('\n6. Mixing Colors with Alpha:');
const mixedAlpha = ColorConverter.mixColors('rgba(255, 0, 0, 0.5)', 'rgba(0, 0, 255, 0.8)', 0.5);
console.log('\nMixing rgba(255, 0, 0, 0.5) and rgba(0, 0, 255, 0.8):');
console.log(`  Result: ${mixedAlpha.hex}`);
console.log(`  RGBA: ${mixedAlpha.rgba}`);

// Example 7: Perceptual color differences
console.log('\n7. Perceptual Color Differences in LAB:');
const color1 = ColorConverter.convert('#FF0000');
const color2 = ColorConverter.convert('#FF3333');
const color3 = ColorConverter.convert('#0000FF');

console.log('\nColors in LAB space show perceptual differences:');
console.log(`  Red (#FF0000): ${color1.lab}`);
console.log(`  Light Red (#FF3333): ${color2.lab}`);
console.log(`  Blue (#0000FF): ${color3.lab}`);
console.log('\nNotice how LAB values reflect perceived differences better than RGB.');