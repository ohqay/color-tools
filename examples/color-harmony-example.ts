#!/usr/bin/env node
import { ColorHarmony } from '../src/colorHarmony.js';

console.log('=== Color Harmony Examples ===\n');

// Example 1: Complementary Harmony
console.log('1. Complementary Harmony (Red base):');
const complementary = ColorHarmony.generateComplementary('#FF0000', 'hex');
console.log(`   Base: ${complementary.colors[0]}`);
console.log(`   Complement: ${complementary.colors[1]}`);
console.log(`   Description: Two colors opposite on the color wheel\n`);

// Example 2: Analogous Harmony
console.log('2. Analogous Harmony (Blue base):');
const analogous = ColorHarmony.generateAnalogous('#0066CC', 'hex', { analogousCount: 5 });
console.log(`   Colors: ${analogous.colors.join(', ')}`);
console.log(`   Description: Adjacent colors creating a harmonious palette\n`);

// Example 3: Triadic Harmony
console.log('3. Triadic Harmony (Green base):');
const triadic = ColorHarmony.generateTriadic('#00FF00', 'rgb');
console.log(`   Colors:`);
triadic.colors.forEach((color, i) => {
  console.log(`     ${i + 1}. ${color}`);
});
console.log(`   Description: Three colors evenly spaced (120° apart)\n`);

// Example 4: Split-Complementary
console.log('4. Split-Complementary (Purple base):');
const splitComp = ColorHarmony.generateSplitComplementary('#8B00FF', 'hsl');
console.log(`   Base: ${splitComp.colors[0]}`);
console.log(`   Split 1: ${splitComp.colors[1]}`);
console.log(`   Split 2: ${splitComp.colors[2]}`);
console.log(`   Description: Base color + two adjacent to its complement\n`);

// Example 5: Tetradic/Square Harmony
console.log('5. Tetradic/Square Harmony (Orange base):');
const tetradic = ColorHarmony.generateTetradic('#FF8C00', 'hex');
console.log(`   Colors: ${tetradic.colors.join(', ')}`);
console.log(`   Description: Four colors evenly spaced (90° apart)\n`);

// Example 6: Double Complementary
console.log('6. Double Complementary (Teal base):');
const doubleComp = ColorHarmony.generateDoubleComplementary('#008B8B', 'hex');
console.log(`   Pair 1: ${doubleComp.colors[0]}, ${doubleComp.colors[2]}`);
console.log(`   Pair 2: ${doubleComp.colors[1]}, ${doubleComp.colors[3]}`);
console.log(`   Description: Two complementary pairs\n`);

// Example 7: Custom Angle Adjustment
console.log('7. Complementary with Angle Adjustment:');
const adjusted = ColorHarmony.generateComplementary('#FF0000', 'hex', { angleAdjustment: 15 });
console.log(`   Base: ${adjusted.colors[0]}`);
console.log(`   Adjusted Complement: ${adjusted.colors[1]}`);
console.log(`   Description: Complement shifted by 15 degrees\n`);

// Example 8: Generate All Harmonies
console.log('8. All Harmonies for a Color (#4ECDC4):');
const allHarmonies = ColorHarmony.generateAllHarmonies('#4ECDC4', 'hex');
Object.entries(allHarmonies).forEach(([type, harmony]) => {
  console.log(`   ${type}: ${harmony.colors.length} colors`);
});

// Example 9: Using Raw HSL Values
console.log('\n9. Raw HSL Values:');
const withRaw = ColorHarmony.generateTriadic('#FF6B6B', 'hex');
console.log('   Raw HSL values:');
withRaw.rawValues?.forEach((hsl, i) => {
  console.log(`     Color ${i + 1}: H=${hsl.h}°, S=${hsl.s}%, L=${hsl.l}%`);
});

// Example 10: Real-world Use Case - Website Color Scheme
console.log('\n10. Website Color Scheme Example:');
const brandColor = '#2C3E50'; // Dark blue-gray
const websiteColors = ColorHarmony.generateSplitComplementary(brandColor, 'hex');
console.log(`   Primary (Brand): ${websiteColors.colors[0]}`);
console.log(`   Accent 1: ${websiteColors.colors[1]}`);
console.log(`   Accent 2: ${websiteColors.colors[2]}`);
console.log('   Use case: Primary for headers, accents for CTAs and highlights');

// Example 11: Analogous with Custom Settings
console.log('\n11. Custom Analogous Harmony:');
const customAnalogous = ColorHarmony.generateAnalogous('#E74C3C', 'hex', {
  analogousCount: 7,
  analogousAngle: 15
});
console.log(`   Base: ${customAnalogous.colors[3]} (center)`);
console.log(`   Full palette: ${customAnalogous.colors.join(', ')}`);
console.log('   Description: 7 colors with 15° spacing for subtle variations');