import { ColorConverter } from '../src/colorConverter.js';

console.log('Extended Hex Format Examples with Alpha Channel\n');
console.log('='.repeat(50));

// Example 1: 4-digit hex to other formats
console.log('\n1. Converting 4-digit hex (#RGBA):');
console.log('   Input: #F00C (red with 80% opacity)');
const result1 = ColorConverter.convert('#F00C');
console.log('   Output:');
console.log('   - Hex (8-digit):', result1.hex);
console.log('   - RGBA:', result1.rgba);
console.log('   - HSLA:', result1.hsla);

// Example 2: 8-digit hex to other formats
console.log('\n2. Converting 8-digit hex (#RRGGBBAA):');
console.log('   Input: #0080FFBF (blue with 75% opacity)');
const result2 = ColorConverter.convert('#0080FFBF');
console.log('   Output:');
console.log('   - RGBA:', result2.rgba);
console.log('   - HSLA:', result2.hsla);

// Example 3: RGBA to hex with alpha
console.log('\n3. Converting RGBA to hex:');
console.log('   Input: rgba(255, 128, 0, 0.5)');
const result3 = ColorConverter.convert('rgba(255, 128, 0, 0.5)');
console.log('   Output:');
console.log('   - Hex (8-digit):', result3.hex);

// Example 4: Transparent colors
console.log('\n4. Working with transparency:');
console.log('   Fully transparent red: #FF000000');
const result4 = ColorConverter.convert('#FF000000');
console.log('   - RGBA:', result4.rgba);
console.log('   Semi-transparent black: #00000080');
const result5 = ColorConverter.convert('#00000080');
console.log('   - RGBA:', result5.rgba);

// Example 5: Backward compatibility
console.log('\n5. Backward compatibility (no alpha):');
console.log('   3-digit hex: #F00');
const result6 = ColorConverter.convert('#F00');
console.log('   - Hex:', result6.hex, '(remains 6-digit)');
console.log('   - RGB:', result6.rgb);
console.log('   - RGBA:', result6.rgba || 'undefined (no alpha)');

console.log('\n' + '='.repeat(50));