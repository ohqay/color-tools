/**
 * Advanced caching system with smart sizing, TTL, and performance monitoring
 */

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictionCount: number;
  memoryUsage: number;
}

export interface CacheConfig {
  maxSize?: number;
  ttlMs?: number;
  smartSizing?: boolean;
  preWarmEntries?: { key: string; value: any }[];
  enableMetrics?: boolean;
}

export class AdvancedCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttlMs: number;
  private smartSizing: boolean;
  private enableMetrics: boolean;

  // Performance tracking
  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;

  // Smart sizing parameters
  private readonly initialMaxSize: number;
  private readonly maxGrowthFactor = 3;
  private readonly shrinkThreshold = 0.7; // Shrink when hit rate falls below this

  constructor(config: CacheConfig = {}) {
    this.maxSize = config.maxSize ?? 100;
    this.initialMaxSize = this.maxSize;
    this.ttlMs = config.ttlMs ?? 5 * 60 * 1000; // 5 minutes default
    this.smartSizing = config.smartSizing ?? true;
    this.enableMetrics = config.enableMetrics ?? true;

    // Pre-warm cache if entries provided
    if (config.preWarmEntries) {
      this.preWarmCache(config.preWarmEntries);
    }

    // Set up periodic cleanup
    this.startPeriodicCleanup();
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.enableMetrics) {this.missCount++;}
      return undefined;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      if (this.enableMetrics) {this.missCount++;}
      return undefined;
    }

    // Update access metrics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    if (this.enableMetrics) {this.hitCount++;}
    return entry.value;
  }

  set(key: string, value: T): void {
    const now = Date.now();
    
    // Check if key already exists
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.timestamp = now;
      entry.lastAccessed = now;
      entry.accessCount++;
      
      // Move to end
      this.cache.delete(key);
      this.cache.set(key, entry);
      return;
    }

    // Ensure we have space
    this.ensureCapacity();

    // Create new entry
    const entry: CacheEntry<T> = {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);

    // Trigger smart sizing check if enabled
    if (this.smartSizing) {
      this.checkSmartSizing();
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  clear(): void {
    this.cache.clear();
    this.resetMetrics();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  getStats(): CacheStats {
    const totalAccesses = this.hitCount + this.missCount;
    const hitRate = totalAccesses > 0 ? this.hitCount / totalAccesses : 0;
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      evictionCount: this.evictionCount,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  // Pre-warm cache with common entries
  private preWarmCache(entries: { key: string; value: any }[]): void {
    for (const { key, value } of entries) {
      this.set(key, value);
    }
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  private ensureCapacity(): void {
    while (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
  }

  private evictLeastRecentlyUsed(): void {
    // Find least recently used entry
    let oldestEntry: { key: string; entry: CacheEntry<T> } | null = null;
    
    for (const [key, entry] of this.cache.entries()) {
      if (!oldestEntry || entry.lastAccessed < oldestEntry.entry.lastAccessed) {
        oldestEntry = { key, entry };
      }
    }

    if (oldestEntry) {
      this.cache.delete(oldestEntry.key);
      if (this.enableMetrics) {this.evictionCount++;}
    }
  }

  private checkSmartSizing(): void {
    const stats = this.getStats();
    
    // Grow cache if hit rate is high and we're near capacity
    if (stats.hitRate > 0.8 && stats.size > stats.maxSize * 0.9) {
      const newSize = Math.min(
        this.initialMaxSize * this.maxGrowthFactor,
        this.maxSize * 1.5
      );
      this.maxSize = Math.floor(newSize);
    }
    
    // Shrink cache if hit rate is low and we have many evictions
    else if (stats.hitRate < this.shrinkThreshold && this.evictionCount > 50) {
      const newSize = Math.max(
        this.initialMaxSize,
        this.maxSize * 0.8
      );
      this.maxSize = Math.floor(newSize);
      this.evictionCount = 0; // Reset eviction count after shrinking
    }
  }

  private estimateMemoryUsage(): number {
    // Rough estimate: each entry ~200 bytes + JSON size of value
    let totalSize = 0;
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry.value).length * 2;
      totalSize += 200; // Overhead for object structure
    }
    return totalSize;
  }

  private resetMetrics(): void {
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
  }

  private startPeriodicCleanup(): void {
    // Clean up expired entries every minute
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > this.ttlMs) {
          keysToDelete.push(key);
        }
      }
      
      for (const key of keysToDelete) {
        this.cache.delete(key);
      }
    }, 60000);
  }

  // Debug methods
  getTopEntries(count = 10): { key: string; accessCount: number; age: number }[] {
    const now = Date.now();
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: now - entry.timestamp
      }))
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, count);
    
    return entries;
  }

  // Export cache state for analysis
  exportState(): any {
    return {
      config: {
        maxSize: this.maxSize,
        ttlMs: this.ttlMs,
        smartSizing: this.smartSizing
      },
      stats: this.getStats(),
      topEntries: this.getTopEntries()
    };
  }
}

// Default cache instances for different use cases
export const conversionCache = new AdvancedCache({
  maxSize: 200,
  ttlMs: 10 * 60 * 1000, // 10 minutes for conversions
  smartSizing: true,
  enableMetrics: true
});

export const paletteCache = new AdvancedCache({
  maxSize: 50,
  ttlMs: 30 * 60 * 1000, // 30 minutes for palettes
  smartSizing: false, // Palettes are larger objects, fixed size is better
  enableMetrics: true
});

export const resourceCache = new AdvancedCache({
  maxSize: 20,
  ttlMs: 60 * 60 * 1000, // 1 hour for resources
  smartSizing: false,
  enableMetrics: true
});