/**
 * Performance monitoring and metrics collection system
 */

export interface ConversionMetrics {
  operation: string;
  duration: number;
  inputFormat?: string | undefined;
  outputFormats?: string[] | undefined;
  cacheHit: boolean;
  timestamp: number;
}

export interface PerformanceStats {
  totalOperations: number;
  averageOperationTime: number;
  cacheHitRate: number;
  operationsPerSecond: number;
  slowestOperations: ConversionMetrics[];
  fastestOperations: ConversionMetrics[];
  operationBreakdown: Record<string, {
    count: number;
    totalTime: number;
    averageTime: number;
  }>;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  cacheMemoryUsage: number;
}

export class PerformanceMonitor {
  private metrics: ConversionMetrics[] = [];
  private readonly maxMetricsHistory = 1000;
  private startTime = Date.now();

  recordOperation(operation: string, duration: number, options: {
    inputFormat?: string | undefined;
    outputFormats?: string[] | undefined;
    cacheHit?: boolean;
  } = {}): void {
    const metric: ConversionMetrics = {
      operation,
      duration,
      inputFormat: options.inputFormat,
      outputFormats: options.outputFormats,
      cacheHit: options.cacheHit ?? false,
      timestamp: Date.now()
    };

    this.metrics.push(metric);

    // Keep only recent metrics to prevent memory bloat
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalOperations: 0,
        averageOperationTime: 0,
        cacheHitRate: 0,
        operationsPerSecond: 0,
        slowestOperations: [],
        fastestOperations: [],
        operationBreakdown: {}
      };
    }

    const totalOperations = this.metrics.length;
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageOperationTime = totalTime / totalOperations;
    
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = cacheHits / totalOperations;

    const timeSpanMs = Date.now() - this.startTime;
    const operationsPerSecond = totalOperations / (timeSpanMs / 1000);

    // Sort for slowest and fastest operations
    const sortedByDuration = [...this.metrics].sort((a, b) => b.duration - a.duration);
    const slowestOperations = sortedByDuration.slice(0, 10);
    const fastestOperations = sortedByDuration.slice(-10).reverse();

    // Operation breakdown
    const operationBreakdown: Record<string, { count: number; totalTime: number; averageTime: number }> = {};
    
    for (const metric of this.metrics) {
      operationBreakdown[metric.operation] ??= {
        count: 0,
        totalTime: 0,
        averageTime: 0
      };
      
      const breakdown = operationBreakdown[metric.operation]!;
      breakdown.count++;
      breakdown.totalTime += metric.duration;
      breakdown.averageTime = breakdown.totalTime / breakdown.count;
    }

    return {
      totalOperations,
      averageOperationTime,
      cacheHitRate,
      operationsPerSecond,
      slowestOperations,
      fastestOperations,
      operationBreakdown
    };
  }

  getMemoryMetrics(cacheMemoryUsage = 0): MemoryMetrics {
    const memUsage = process.memoryUsage();
    return {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external,
      rss: memUsage.rss,
      cacheMemoryUsage
    };
  }

  // Get performance report for the last N minutes
  getRecentReport(minutesBack = 5): {
    stats: PerformanceStats;
    memory: MemoryMetrics;
    timeRange: { start: number; end: number };
  } {
    const cutoffTime = Date.now() - (minutesBack * 60 * 1000);
    const recentMetrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
    
    // Temporarily store original metrics and calculate stats for recent data
    const originalMetrics = this.metrics;
    this.metrics = recentMetrics;
    const stats = this.getStats();
    this.metrics = originalMetrics;

    return {
      stats,
      memory: this.getMemoryMetrics(),
      timeRange: {
        start: cutoffTime,
        end: Date.now()
      }
    };
  }

  // Clear old metrics to free memory
  clearOldMetrics(olderThanMinutes = 30): void {
    const cutoffTime = Date.now() - (olderThanMinutes * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoffTime);
  }

  // Reset all metrics
  reset(): void {
    this.metrics = [];
    this.startTime = Date.now();
  }

  // Get performance summary for logging
  getSummary(): string {
    const stats = this.getStats();
    const memory = this.getMemoryMetrics();
    
    return [
      `Performance Summary:`,
      `- Operations: ${stats.totalOperations}`,
      `- Avg Time: ${stats.averageOperationTime.toFixed(2)}ms`,
      `- Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`,
      `- Ops/sec: ${stats.operationsPerSecond.toFixed(1)}`,
      `- Memory: ${(memory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
      `- Top Operations: ${Object.keys(stats.operationBreakdown).slice(0, 3).join(', ')}`
    ].join('\n');
  }

  // Check if performance is degrading
  isPerformanceDegrading(): boolean {
    const recentStats = this.getRecentReport(5).stats;
    const overallStats = this.getStats();
    
    // Performance is degrading if recent average is 50% slower than overall
    return recentStats.averageOperationTime > overallStats.averageOperationTime * 1.5;
  }
}

// Utility function to measure execution time
export function measureTime<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Async version
export async function measureTimeAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();