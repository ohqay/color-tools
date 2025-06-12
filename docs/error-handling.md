# Error Handling System

The Color Tools MCP Server includes a comprehensive error handling system designed to provide clear, actionable feedback and graceful degradation.

## Error Types

### Base Error Class: `ColorError`

All custom errors extend from `ColorError`, which provides:
- Error code enumeration
- Contextual information
- Timestamp tracking
- Recoverability flag
- Structured JSON output

### Error Code Enumeration

```typescript
enum ColorErrorCode {
  // Input validation errors
  INVALID_COLOR_FORMAT = 'INVALID_COLOR_FORMAT',
  INVALID_COLOR_VALUE = 'INVALID_COLOR_VALUE',
  MISSING_REQUIRED_PARAMETER = 'MISSING_REQUIRED_PARAMETER',
  
  // Conversion errors
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  OUT_OF_RANGE_VALUE = 'OUT_OF_RANGE_VALUE',
  
  // Palette and resource errors
  PALETTE_NOT_FOUND = 'PALETTE_NOT_FOUND',
  COLOR_NOT_FOUND = 'COLOR_NOT_FOUND',
  RESOURCE_LOAD_FAILED = 'RESOURCE_LOAD_FAILED',
  
  // Harmony and calculation errors
  HARMONY_GENERATION_FAILED = 'HARMONY_GENERATION_FAILED',
  CONTRAST_CALCULATION_FAILED = 'CONTRAST_CALCULATION_FAILED',
  
  // System errors
  CACHE_ERROR = 'CACHE_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION'
}
```

### Specialized Error Types

1. **ValidationError**: Input validation failures
2. **ConversionError**: Color format conversion failures
3. **FormatError**: Invalid format specifications
4. **RangeError**: Numeric values out of acceptable range
5. **ResourceError**: Resource loading failures
6. **AccessibilityError**: Accessibility calculation failures
7. **HarmonyError**: Color harmony generation failures

## Error Context

Each error includes contextual information:

```typescript
interface ColorErrorContext {
  operation?: string;      // What operation was being performed
  input?: string;         // The input that caused the error
  format?: string;        // The format involved
  expectedRange?: {       // For range errors
    min: number;
    max: number;
  };
  suggestions?: string[]; // Helpful suggestions for resolution
  metadata?: Record<string, unknown>; // Additional context
}
```

## Error Factory

The `ColorErrorFactory` provides convenient methods for creating common errors:

```typescript
// Invalid format with suggestions
ColorErrorFactory.invalidColorFormat(input, ['hex', 'rgb', 'hsl']);

// Missing parameter
ColorErrorFactory.missingParameter('baseColor', 'harmony-generation');

// Out of range value
ColorErrorFactory.outOfRange(256, 0, 255, 'Red channel');

// Conversion failure
ColorErrorFactory.conversionFailed('rgb', 'hsl', 'Invalid RGB values');
```

## Safe Execution Utilities

### safeExecute

Synchronous error handling with fallback:

```typescript
const result = safeExecute(
  () => ColorConverter.convert(input),
  { hex: '#000000' }, // Fallback value
  { operation: 'convert', input } // Context
);
```

### safeExecuteAsync

Asynchronous error handling with fallback:

```typescript
const result = await safeExecuteAsync(
  async () => checkContrast(fg, bg),
  { ratio: 1 }, // Fallback value
  { operation: 'contrast-check' } // Context
);
```

## Error Handler

The global `errorHandler` instance tracks errors and provides statistics:

```typescript
// Get recent errors
const recentErrors = errorHandler.getRecentErrors(10);

// Get error statistics
const stats = errorHandler.getErrorStats();
// Returns: {
//   totalErrors: number;
//   errorsByCode: Record<string, number>;
//   recoverableErrors: number;
//   criticalErrors: number;
// }

// Clear error log
errorHandler.clearErrorLog();
```

## MCP Server Error Responses

The MCP server formats errors appropriately for client consumption:

```typescript
{
  success: false,
  error: "Error message",
  errorCode: "ERROR_CODE",
  context: { /* error context */ },
  hint: "Helpful suggestion",
  recoverable: true
}
```

## Best Practices

1. **Use specific error types**: Choose the most appropriate error class
2. **Provide context**: Include relevant information in error context
3. **Add suggestions**: Help users resolve the issue
4. **Mark recoverability**: Indicate if the error can be recovered from
5. **Use safe execution**: For non-critical operations that can fallback
6. **Log for debugging**: Errors are automatically logged by the handler

## Example Usage

```typescript
// Input validation
validateColorInput(input, 'baseColor');

// Range validation
validateNumberInRange(value, 0, 100, 'Percentage');

// Format validation
validateFormat(format, ['hex', 'rgb', 'hsl']);

// Safe color conversion
const result = safeExecute(
  () => ColorConverter.convert('#FF0000'),
  undefined,
  { operation: 'convert' }
);

// Error creation with context
throw new ValidationError(
  'Invalid color format',
  {
    input: userInput,
    format: detectedFormat,
    suggestions: ['Try using hex format: #RRGGBB']
  }
);
```

## Error Recovery Strategies

1. **Fallback values**: Use `safeExecute` with appropriate defaults
2. **Value clamping**: Automatically adjust out-of-range values
3. **Format detection**: Try alternative format parsing
4. **Partial success**: Return what succeeded, log what failed
5. **Graceful degradation**: Provide reduced functionality

## Performance Considerations

- Error creation is lightweight
- Context objects are kept minimal
- Error log has a maximum size (100 entries)
- Statistics calculation is O(n) where n ≤ 100

## Testing Error Handling

See `examples/error-handling.ts` for comprehensive examples of:
- Basic error handling patterns
- Using safe execution utilities
- Error recovery strategies
- Error statistics and monitoring
- Custom error creation

Run the examples:
```bash
bun run examples/error-handling.ts
```