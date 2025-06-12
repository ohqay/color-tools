/**
 * Centralized error handling system for color operations
 */

export enum ColorErrorCode {
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

export interface ColorErrorContext {
  operation?: string;
  input?: string;
  format?: string;
  expectedRange?: { min: number; max: number };
  suggestions?: string[];
  metadata?: Record<string, unknown>;
}

export class ColorError extends Error {
  public readonly code: ColorErrorCode;
  public readonly context: ColorErrorContext;
  public readonly timestamp: number;
  public readonly recoverable: boolean;

  constructor(
    code: ColorErrorCode,
    message: string,
    context: ColorErrorContext = {},
    recoverable = true
  ) {
    super(message);
    this.name = 'ColorError';
    this.code = code;
    this.context = context;
    this.timestamp = Date.now();
    this.recoverable = recoverable;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ColorError);
    }
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      stack: this.stack
    };
  }

  toString(): string {
    const contextStr = Object.keys(this.context).length > 0 
      ? ` (Context: ${JSON.stringify(this.context)})`
      : '';
    return `${this.name}[${this.code}]: ${this.message}${contextStr}`;
  }
}

// Error factory functions for common error scenarios
export class ColorErrorFactory {
  static invalidColorFormat(input: string, expectedFormats: string[]): ColorError {
    return new ColorError(
      ColorErrorCode.INVALID_COLOR_FORMAT,
      `Invalid color format: "${input}"`,
      {
        input,
        suggestions: expectedFormats.map(f => `Use ${f} format`),
        metadata: { expectedFormats }
      }
    );
  }

  static invalidColorValue(input: string, format: string, reason?: string): ColorError {
    const message = reason 
      ? `Invalid ${format} color value: "${input}" - ${reason}`
      : `Invalid ${format} color value: "${input}"`;
    
    return new ColorError(
      ColorErrorCode.INVALID_COLOR_VALUE,
      message,
      { input, format, metadata: { reason } }
    );
  }

  static missingParameter(parameterName: string, operation: string): ColorError {
    return new ColorError(
      ColorErrorCode.MISSING_REQUIRED_PARAMETER,
      `Missing required parameter: ${parameterName}`,
      {
        operation,
        suggestions: [`Please provide the ${parameterName} parameter`]
      }
    );
  }

  static conversionFailed(from: string, to: string, reason?: string): ColorError {
    const message = reason
      ? `Failed to convert from ${from} to ${to}: ${reason}`
      : `Failed to convert from ${from} to ${to}`;
    
    return new ColorError(
      ColorErrorCode.CONVERSION_FAILED,
      message,
      {
        operation: 'conversion',
        format: `${from} -> ${to}`,
        metadata: { from, to, reason }
      }
    );
  }

  static unsupportedFormat(format: string, supportedFormats: string[]): ColorError {
    return new ColorError(
      ColorErrorCode.UNSUPPORTED_FORMAT,
      `Unsupported color format: ${format}`,
      {
        format,
        suggestions: [`Use one of: ${supportedFormats.join(', ')}`],
        metadata: { supportedFormats }
      }
    );
  }

  static outOfRange(value: number, min: number, max: number, parameter: string): ColorError {
    return new ColorError(
      ColorErrorCode.OUT_OF_RANGE_VALUE,
      `Value ${value} is out of range for ${parameter}`,
      {
        expectedRange: { min, max },
        suggestions: [`${parameter} must be between ${min} and ${max}`],
        metadata: { value, parameter }
      }
    );
  }

  static paletteNotFound(paletteName: string, availablePalettes: string[]): ColorError {
    return new ColorError(
      ColorErrorCode.PALETTE_NOT_FOUND,
      `Palette not found: ${paletteName}`,
      {
        input: paletteName,
        suggestions: availablePalettes.map(p => `Try "${p}"`),
        metadata: { availablePalettes }
      }
    );
  }

  static colorNotFound(colorName: string, palette?: string): ColorError {
    const message = palette 
      ? `Color "${colorName}" not found in palette "${palette}"`
      : `Color "${colorName}" not found`;
    
    return new ColorError(
      ColorErrorCode.COLOR_NOT_FOUND,
      message,
      {
        input: colorName,
        metadata: { palette }
      }
    );
  }

  static harmonyGenerationFailed(baseColor: string, harmonyType: string, reason?: string): ColorError {
    const message = reason
      ? `Failed to generate ${harmonyType} harmony for ${baseColor}: ${reason}`
      : `Failed to generate ${harmonyType} harmony for ${baseColor}`;
    
    return new ColorError(
      ColorErrorCode.HARMONY_GENERATION_FAILED,
      message,
      {
        operation: 'harmony-generation',
        input: baseColor,
        metadata: { harmonyType, reason }
      }
    );
  }

  static cacheError(operation: string, reason: string): ColorError {
    return new ColorError(
      ColorErrorCode.CACHE_ERROR,
      `Cache error during ${operation}: ${reason}`,
      {
        operation,
        metadata: { reason }
      },
      true // Cache errors are usually recoverable
    );
  }

  static performanceDegradation(metric: string, threshold: number, current: number): ColorError {
    return new ColorError(
      ColorErrorCode.PERFORMANCE_DEGRADATION,
      `Performance degradation detected: ${metric} (${current}) exceeds threshold (${threshold})`,
      {
        operation: 'performance-monitoring',
        metadata: { metric, threshold, current }
      },
      true
    );
  }
}

// Error handler for graceful degradation
export class ErrorHandler {
  private errorLog: ColorError[] = [];
  private readonly maxErrorLog = 100;

  handle(error: ColorError | Error): ColorError {
    const colorError = error instanceof ColorError 
      ? error 
      : this.wrapGenericError(error);

    this.logError(colorError);
    return colorError;
  }

  private wrapGenericError(error: Error): ColorError {
    return new ColorError(
      ColorErrorCode.CONVERSION_FAILED,
      error.message,
      {
        metadata: {
          originalError: error.name,
          stack: error.stack
        }
      }
    );
  }

  private logError(error: ColorError): void {
    this.errorLog.push(error);
    
    // Keep only recent errors
    if (this.errorLog.length > this.maxErrorLog) {
      this.errorLog = this.errorLog.slice(-this.maxErrorLog);
    }
  }

  getRecentErrors(count = 10): ColorError[] {
    return this.errorLog.slice(-count);
  }

  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    recoverableErrors: number;
    criticalErrors: number;
  } {
    const errorsByCode: Record<string, number> = {};
    let recoverableErrors = 0;
    let criticalErrors = 0;

    for (const error of this.errorLog) {
      errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      
      if (error.recoverable) {
        recoverableErrors++;
      } else {
        criticalErrors++;
      }
    }

    return {
      totalErrors: this.errorLog.length,
      errorsByCode,
      recoverableErrors,
      criticalErrors
    };
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Utility function for safe operation execution
export function safeExecute<T>(
  operation: () => T,
  fallback?: T,
  errorContext?: Partial<ColorErrorContext>
): T | undefined {
  try {
    return operation();
  } catch (error) {
    const colorError = error instanceof ColorError 
      ? error 
      : new ColorError(
          ColorErrorCode.CONVERSION_FAILED,
          error instanceof Error ? error.message : 'Unknown error',
          errorContext
        );
    
    errorHandler.handle(colorError);
    return fallback;
  }
}

// Async version
export async function safeExecuteAsync<T>(
  operation: () => Promise<T>,
  fallback?: T,
  errorContext?: Partial<ColorErrorContext>
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    const colorError = error instanceof ColorError 
      ? error 
      : new ColorError(
          ColorErrorCode.CONVERSION_FAILED,
          error instanceof Error ? error.message : 'Unknown error',
          errorContext
        );
    
    errorHandler.handle(colorError);
    return fallback;
  }
}