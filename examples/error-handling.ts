#!/usr/bin/env node

/**
 * Error Handling Examples for Color Tools MCP Server
 * 
 * This file demonstrates comprehensive error handling patterns
 * using the custom error types and error handling utilities.
 */

import { ColorConverter } from '../src/colorConverter.js';
import { ColorHarmony } from '../src/colorHarmony.js';
import { checkContrast } from '../src/colorAccessibility.js';
import { simulateColorBlindness } from '../src/colorBlindness.js';
import { 
  ColorError, 
  ColorErrorFactory,
  errorHandler,
  safeExecute,
  safeExecuteAsync,
  ValidationError,
  ConversionError,
  FormatError
} from '../src/core/errors/ColorError.js';

// Example 1: Basic error handling with ColorConverter
console.log('=== Example 1: Basic Color Conversion Error Handling ===');
try {
  // This will throw a validation error
  const result = ColorConverter.convert('', 'hex', ['rgb']);
  console.log('Unexpected success:', result);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Validation Error:', error.message);
    console.log('Context:', error.context);
    console.log('Suggestions:', error.context.suggestions);
  }
}

// Example 2: Handling invalid color formats
console.log('\n=== Example 2: Invalid Color Format ===');
try {
  const result = ColorConverter.convert('not-a-color', undefined, ['rgb']);
  console.log('Unexpected success:', result);
} catch (error) {
  if (error instanceof FormatError || error instanceof ConversionError) {
    console.log('Format/Conversion Error:', error.message);
    console.log('Error Code:', error.code);
    console.log('Recoverable:', error.recoverable);
  }
}

// Example 3: Range validation errors
console.log('\n=== Example 3: Range Validation ===');
try {
  // RGB values out of range
  const result = ColorConverter.parseRGBString('rgb(300, -10, 256)');
  console.log('Unexpected success:', result);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Range Error:', error.message);
    console.log('Metadata:', error.context.metadata);
  }
}

// Example 4: Using safeExecute for graceful degradation
console.log('\n=== Example 4: Safe Execution ===');
const safeConversion = safeExecute(
  () => ColorConverter.convert('#invalid', 'hex', ['rgb']),
  { hex: '#000000', rgb: 'rgb(0, 0, 0)' }, // Fallback value
  { operation: 'convert', input: '#invalid' }
);
console.log('Safe conversion result:', safeConversion);

// Example 5: Harmony generation with error handling
console.log('\n=== Example 5: Harmony Generation Errors ===');
try {
  // Invalid harmony type
  const harmony = ColorHarmony.generateHarmony('#FF0000', 'invalid-harmony' as any);
  console.log('Unexpected success:', harmony);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Harmony Error:', error.message);
    console.log('Suggestions:', error.context.suggestions);
  }
}

// Example 6: Accessibility error handling
console.log('\n=== Example 6: Accessibility Errors ===');
async function accessibilityExample() {
  try {
    const result = await safeExecuteAsync(
      async () => checkContrast('invalid-color', '#FFFFFF'),
      { ratio: 1, passes: { aa: { normal: false, large: false }, aaa: { normal: false, large: false } }, recommendation: 'Error occurred' },
      { operation: 'checkContrast' }
    );
    console.log('Contrast check with fallback:', result);
  } catch (error) {
    console.log('Should not reach here with safeExecuteAsync', error);
  }
}

// Example 7: Color blindness simulation errors
console.log('\n=== Example 7: Color Blindness Simulation ===');
try {
  // Invalid color blindness type
  const simulated = simulateColorBlindness('#FF0000', 'invalid-type' as any);
  console.log('Unexpected success:', simulated);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Simulation Error:', error.message);
    console.log('Valid types suggested:', error.context.suggestions);
  }
}

// Example 8: Error handler statistics
console.log('\n=== Example 8: Error Handler Statistics ===');
// Generate some errors for statistics
['invalid1', 'invalid2', 'invalid3'].forEach(color => {
  try {
    ColorConverter.convert(color);
  } catch (error) {
    // Errors are automatically logged by error handler
    if (error instanceof Error) {
      console.log(`Processing error for ${color}: ${error.message}`);
    }
  }
});

const stats = errorHandler.getErrorStats();
console.log('Error Statistics:', stats);
console.log('Recent Errors:', errorHandler.getRecentErrors(2).map(e => ({
  code: e.code,
  message: e.message,
  timestamp: new Date(e.timestamp).toISOString()
})));

// Example 9: Custom error creation
console.log('\n=== Example 9: Custom Error Creation ===');
const customError = ColorErrorFactory.outOfRange(256, 0, 255, 'Red channel');
console.log('Custom Error:', customError.toJSON());

// Example 10: Error context and recovery
console.log('\n=== Example 10: Error Context and Recovery ===');
async function robustColorOperation(input: string) {
  try {
    // Try to convert the color
    return ColorConverter.convert(input);
  } catch (error) {
    if (error instanceof ColorError) {
      console.log('Color operation failed:', error.toString());
      
      // Check if error is recoverable
      if (error.recoverable) {
        console.log('Attempting recovery...');
        
        // Try different strategies based on error code
        switch (error.code) {
          case 'INVALID_COLOR_FORMAT':
            // Try to parse as a named color
            return safeExecute(
              () => ColorConverter.convert('black'), // Default to black
              undefined,
              { operation: 'recovery', input }
            );
            
          case 'OUT_OF_RANGE_VALUE':
            // Clamp values and retry
            console.log('Clamping values and retrying...');
            break;
            
          default:
            console.log('No recovery strategy for:', error.code);
        }
      }
    }
    throw error;
  }
}

// Run examples
console.log('\n=== Running Async Examples ===');
Promise.all([
  accessibilityExample(),
  robustColorOperation('maybe-a-color')
    .then(result => console.log('Robust operation succeeded:', result?.hex))
    .catch(error => console.log('Robust operation failed:', error.message))
]).then(() => {
  console.log('\n=== Error Handling Examples Complete ===');
  
  // Clear error log for next run
  errorHandler.clearErrorLog();
});