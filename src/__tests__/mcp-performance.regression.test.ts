/**
 * MCP Server Performance Regression Tests
 * Ensures performance doesn't degrade across releases
 */

import { describe, it, expect, beforeEach, afterAll } from 'bun:test';
import { ColorConverter } from '../colorConverter.js';
import { ColorHarmony } from '../colorHarmony.js';
import { checkContrast, findAccessibleColor } from '../colorAccessibility.js';
import { simulateColorBlindness, simulateAllColorBlindness } from '../colorBlindness.js';
import { getPalette, getAllPalettes, clearPaletteCache } from '../resources/palettes.js';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  colorConversion: {
    single: 0.5,      // Single color conversion
    batch: 1.0,       // Batch of 10 conversions
    complex: 2.0      // Complex conversion chain
  },
  harmonyGeneration: {
    simple: 1.0,      // Single harmony type
    all: 5.0          // All harmony types
  },
  accessibilityCheck: {
    contrast: 0.5,    // Single contrast check
    findColor: 5.0    // Find accessible color
  },
  colorBlindness: {
    single: 1.0,      // Single type simulation
    all: 5.0          // All types simulation
  },
  resourceAccess: {
    palette: 0.5,     // Single palette access
    allPalettes: 2.0  // All palettes
  },
  caching: {
    miss: 1.0,        // Cache miss
    hit: 0.1          // Cache hit
  }
};

// Track performance metrics
const performanceMetrics: any = {
  colorConversion: [],
  harmonyGeneration: [],
  accessibilityCheck: [],
  colorBlindness: [],
  resourceAccess: [],
  caching: []
};

describe('MCP Performance Regression Tests', () => {
  beforeEach(() => {
    // Clear all caches for consistent testing
    ColorConverter.clearCache();
    clearPaletteCache();
  });

  afterAll(() => {
    // Generate performance report
    console.log('\n=== MCP PERFORMANCE REGRESSION REPORT ===\n');
    
    for (const [category, metrics] of Object.entries(performanceMetrics)) {
      if (metrics.length === 0) {continue;}
      
      console.log(`${category}:`);
      metrics.forEach((metric: any) => {
        const status = metric.passed ? '✅' : '❌';
        console.log(`  ${status} ${metric.test}: ${metric.time.toFixed(2)}ms (threshold: ${metric.threshold}ms)`);
      });
      console.log('');
    }
  });

  describe('Color Conversion Performance', () => {
    it('should meet performance threshold for single color conversion', () => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
      const times: number[] = [];
      
      for (const color of colors) {
        const start = performance.now();
        ColorConverter.convert(color);
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      performanceMetrics.colorConversion.push({
        test: 'Single color conversion',
        time: avgTime,
        threshold: PERFORMANCE_THRESHOLDS.colorConversion.single,
        passed: avgTime < PERFORMANCE_THRESHOLDS.colorConversion.single
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.single);
    });

    it('should meet performance threshold for batch conversions', () => {
      const colors = Array.from({ length: 10 }, (_, i) => `#${i.toString(16).padStart(6, '0')}`);
      
      const start = performance.now();
      colors.forEach(color => ColorConverter.convert(color));
      const end = performance.now();
      
      const totalTime = end - start;
      
      performanceMetrics.colorConversion.push({
        test: 'Batch color conversion (10 colors)',
        time: totalTime,
        threshold: PERFORMANCE_THRESHOLDS.colorConversion.batch,
        passed: totalTime < PERFORMANCE_THRESHOLDS.colorConversion.batch
      });
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.batch);
    });

    it('should meet performance threshold for complex conversion chains', () => {
      const testColor = '#FF6B6B';
      
      const start = performance.now();
      
      // Complex chain: HEX -> RGB -> XYZ -> LAB -> XYZ -> RGB -> HSL -> RGB -> HEX
      const rgb = ColorConverter.hexToRGB(testColor);
      const xyz = ColorConverter.rgbToXYZ(rgb);
      const lab = ColorConverter.xyzToLAB(xyz);
      const xyzBack = ColorConverter.labToXYZ(lab);
      const rgbBack = ColorConverter.xyzToRGB(xyzBack);
      const hsl = ColorConverter.rgbToHSL(rgbBack);
      const rgbFinal = ColorConverter.hslToRGB(hsl);
      const hexFinal = ColorConverter.rgbToHex(rgbFinal);
      
      const end = performance.now();
      const totalTime = end - start;
      
      performanceMetrics.colorConversion.push({
        test: 'Complex conversion chain',
        time: totalTime,
        threshold: PERFORMANCE_THRESHOLDS.colorConversion.complex,
        passed: totalTime < PERFORMANCE_THRESHOLDS.colorConversion.complex
      });
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.complex);
      expect(hexFinal).toBeDefined();
    });
  });

  describe('Harmony Generation Performance', () => {
    it('should meet performance threshold for single harmony generation', () => {
      const baseColor = '#FF6B6B';
      const harmonyTypes = ['complementary', 'analogous', 'triadic'];
      const times: number[] = [];
      
      for (const type of harmonyTypes) {
        const start = performance.now();
        ColorHarmony.generateHarmony(baseColor, type);
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      performanceMetrics.harmonyGeneration.push({
        test: 'Single harmony generation',
        time: avgTime,
        threshold: PERFORMANCE_THRESHOLDS.harmonyGeneration.simple,
        passed: avgTime < PERFORMANCE_THRESHOLDS.harmonyGeneration.simple
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.harmonyGeneration.simple);
    });

    it('should meet performance threshold for all harmony types', () => {
      const baseColor = '#FF6B6B';
      const allTypes = ['complementary', 'analogous', 'triadic', 'tetradic', 'split-complementary'];
      
      const start = performance.now();
      allTypes.forEach(type => ColorHarmony.generateHarmony(baseColor, type));
      const end = performance.now();
      
      const totalTime = end - start;
      
      performanceMetrics.harmonyGeneration.push({
        test: 'All harmony types generation',
        time: totalTime,
        threshold: PERFORMANCE_THRESHOLDS.harmonyGeneration.all,
        passed: totalTime < PERFORMANCE_THRESHOLDS.harmonyGeneration.all
      });
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.harmonyGeneration.all);
    });
  });

  describe('Accessibility Check Performance', () => {
    it('should meet performance threshold for contrast checks', () => {
      const colorPairs = [
        { fg: '#000000', bg: '#FFFFFF' },
        { fg: '#FF0000', bg: '#00FF00' },
        { fg: '#0000FF', bg: '#FFFF00' },
        { fg: '#FF00FF', bg: '#00FFFF' },
        { fg: '#808080', bg: '#C0C0C0' }
      ];
      
      const times: number[] = [];
      
      for (const { fg, bg } of colorPairs) {
        const start = performance.now();
        checkContrast(fg, bg);
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      performanceMetrics.accessibilityCheck.push({
        test: 'Contrast check',
        time: avgTime,
        threshold: PERFORMANCE_THRESHOLDS.accessibilityCheck.contrast,
        passed: avgTime < PERFORMANCE_THRESHOLDS.accessibilityCheck.contrast
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.accessibilityCheck.contrast);
    });

    it('should meet performance threshold for finding accessible colors', () => {
      const testCases = [
        { target: '#FFFF00', bg: '#FFFFFF' },
        { target: '#00FF00', bg: '#F0F0F0' },
        { target: '#FF69B4', bg: '#FFC0CB' }
      ];
      
      const times: number[] = [];
      
      for (const { target, bg } of testCases) {
        const start = performance.now();
        findAccessibleColor(target, bg);
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      performanceMetrics.accessibilityCheck.push({
        test: 'Find accessible color',
        time: avgTime,
        threshold: PERFORMANCE_THRESHOLDS.accessibilityCheck.findColor,
        passed: avgTime < PERFORMANCE_THRESHOLDS.accessibilityCheck.findColor
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.accessibilityCheck.findColor);
    });
  });

  describe('Color Blindness Simulation Performance', () => {
    it('should meet performance threshold for single type simulation', () => {
      const testColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
      const simulationType = 'protanopia';
      const times: number[] = [];
      
      for (const color of testColors) {
        const start = performance.now();
        simulateColorBlindness(color, simulationType);
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      performanceMetrics.colorBlindness.push({
        test: 'Single type simulation',
        time: avgTime,
        threshold: PERFORMANCE_THRESHOLDS.colorBlindness.single,
        passed: avgTime < PERFORMANCE_THRESHOLDS.colorBlindness.single
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorBlindness.single);
    });

    it('should meet performance threshold for all types simulation', () => {
      const testColor = '#FF6B6B';
      
      const start = performance.now();
      simulateAllColorBlindness(testColor);
      const end = performance.now();
      
      const totalTime = end - start;
      
      performanceMetrics.colorBlindness.push({
        test: 'All types simulation',
        time: totalTime,
        threshold: PERFORMANCE_THRESHOLDS.colorBlindness.all,
        passed: totalTime < PERFORMANCE_THRESHOLDS.colorBlindness.all
      });
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorBlindness.all);
    });
  });

  describe('Resource Access Performance', () => {
    it('should meet performance threshold for single palette access', () => {
      const paletteNames = ['material-design', 'tailwind', 'tailwind-css'];
      const times: number[] = [];
      
      for (const name of paletteNames) {
        const start = performance.now();
        getPalette(name);
        const end = performance.now();
        times.push(end - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      performanceMetrics.resourceAccess.push({
        test: 'Single palette access',
        time: avgTime,
        threshold: PERFORMANCE_THRESHOLDS.resourceAccess.palette,
        passed: avgTime < PERFORMANCE_THRESHOLDS.resourceAccess.palette
      });
      
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.resourceAccess.palette);
    });

    it('should meet performance threshold for all palettes access', () => {
      const start = performance.now();
      getAllPalettes();
      const end = performance.now();
      
      const totalTime = end - start;
      
      performanceMetrics.resourceAccess.push({
        test: 'All palettes access',
        time: totalTime,
        threshold: PERFORMANCE_THRESHOLDS.resourceAccess.allPalettes,
        passed: totalTime < PERFORMANCE_THRESHOLDS.resourceAccess.allPalettes
      });
      
      expect(totalTime).toBeLessThan(PERFORMANCE_THRESHOLDS.resourceAccess.allPalettes);
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate cache effectiveness', () => {
      const testColor = '#FF6B6B';
      const iterations = 100;
      
      // Clear cache for fresh start
      ColorConverter.clearCache();
      
      // First access (cache miss)
      const missStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        ColorConverter.clearCache(); // Force cache miss each time
        ColorConverter.convert(testColor);
      }
      const missEnd = performance.now();
      const avgMissTime = (missEnd - missStart) / iterations;
      
      // Prepare cache hit test
      ColorConverter.clearCache();
      ColorConverter.convert(testColor); // Populate cache
      
      // Second access (cache hit)
      const hitStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        ColorConverter.convert(testColor); // Should hit cache
      }
      const hitEnd = performance.now();
      const avgHitTime = (hitEnd - hitStart) / iterations;
      
      performanceMetrics.caching.push({
        test: 'Cache miss',
        time: avgMissTime,
        threshold: PERFORMANCE_THRESHOLDS.caching.miss,
        passed: avgMissTime < PERFORMANCE_THRESHOLDS.caching.miss
      });
      
      performanceMetrics.caching.push({
        test: 'Cache hit',
        time: avgHitTime,
        threshold: PERFORMANCE_THRESHOLDS.caching.hit,
        passed: avgHitTime < PERFORMANCE_THRESHOLDS.caching.hit
      });
      
      // Cache hits should be significantly faster
      expect(avgHitTime).toBeLessThan(avgMissTime);
      expect(avgHitTime).toBeLessThan(PERFORMANCE_THRESHOLDS.caching.hit);
    });

    it('should handle cache overflow efficiently', () => {
      // Generate more colors than cache capacity
      const colors = Array.from({ length: 150 }, (_, i) => 
        `#${i.toString(16).padStart(6, '0')}`
      );
      
      const start = performance.now();
      colors.forEach(color => ColorConverter.convert(color));
      const end = performance.now();
      
      const totalTime = end - start;
      const avgTime = totalTime / colors.length;
      
      // Even with cache overflow, performance should remain good
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.single);
      
      // Verify cache didn't grow unbounded
      const cacheStats = ColorConverter.getCacheStats();
      expect(cacheStats.size).toBeLessThanOrEqual(cacheStats.maxSize);
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-volume concurrent operations', async () => {
      const operations = [
        () => ColorConverter.convert('#FF6B6B'),
        () => ColorHarmony.generateHarmony('#4ECDC4', 'complementary'),
        () => checkContrast('#000000', '#FFFFFF'),
        () => simulateColorBlindness('#45B7D1', 'deuteranopia')
      ];
      
      const concurrentCount = 50;
      const start = performance.now();
      
      // Run many operations concurrently
      const promises = Array.from({ length: concurrentCount }, (_, i) => {
        const operation = operations[i % operations.length];
        return Promise.resolve(operation());
      });
      
      await Promise.all(promises);
      const end = performance.now();
      
      const totalTime = end - start;
      const avgTime = totalTime / concurrentCount;
      
      console.log(`Stress test: ${concurrentCount} operations in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms)`);
      
      // Should handle concurrent operations efficiently
      expect(avgTime).toBeLessThan(5); // 5ms per operation under load
    });

    it('should maintain performance with memory pressure', () => {
      // Create memory pressure by processing many unique colors
      const iterations = 1000;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        
        const start = performance.now();
        ColorConverter.convert(color);
        const end = performance.now();
        
        times.push(end - start);
      }
      
      // Calculate statistics
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      
      console.log(`Memory pressure test: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`);
      
      // Performance should remain consistent
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.single);
      expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.single * 10); // Allow some variance
    });
  });

  describe('Performance Comparison', () => {
    it('should compare performance across different color formats', () => {
      const formats = [
        { name: 'HEX', colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'] },
        { name: 'RGB', colors: ['rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)', 'rgb(255,255,0)', 'rgb(255,0,255)'] },
        { name: 'HSL', colors: ['hsl(0,100%,50%)', 'hsl(120,100%,50%)', 'hsl(240,100%,50%)', 'hsl(60,100%,50%)', 'hsl(300,100%,50%)'] },
        { name: 'Named', colors: ['red', 'lime', 'blue', 'yellow', 'magenta'] }
      ];
      
      const results: any = {};
      
      for (const format of formats) {
        const times: number[] = [];
        
        for (const color of format.colors) {
          const start = performance.now();
          ColorConverter.convert(color);
          const end = performance.now();
          times.push(end - start);
        }
        
        results[format.name] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times)
        };
      }
      
      console.log('\nFormat Performance Comparison:');
      for (const [format, stats] of Object.entries(results)) {
        console.log(`  ${format}: avg=${stats.avg.toFixed(3)}ms, min=${stats.min.toFixed(3)}ms, max=${stats.max.toFixed(3)}ms`);
      }
      
      // All formats should perform similarly well
      for (const stats of Object.values(results)) {
        expect(stats.avg).toBeLessThan(PERFORMANCE_THRESHOLDS.colorConversion.single);
      }
    });
  });
});