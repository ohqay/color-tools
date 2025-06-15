/**
 * MCP Performance Benchmark Tests
 * Comprehensive performance testing and benchmarking for MCP server operations
 */

import { describe, it, expect, beforeEach, afterAll, mock } from 'bun:test';

// Mock the file system module to avoid reading package.json
mock.module('fs', () => ({
  readFileSync: mock(() => JSON.stringify({ version: '1.0.0' }))
}));

// Mock the path and url modules
mock.module('url', () => ({
  fileURLToPath: mock(() => '/mock/path/to/index.ts')
}));

mock.module('path', () => ({
  dirname: mock(() => '/mock/path/to'),
  join: mock((...args) => args.join('/'))
}));

// Create a mock server that captures handler functions
let mockListToolsHandler: () => any;
let mockCallToolHandler: (request: any) => any;
let mockListResourcesHandler: () => any;
let mockReadResourceHandler: (request: any) => any;

const mockSetRequestHandler = mock((schema: any, handler: (...args: any[]) => any) => {
  const schemaName = schema?.name ?? schema;
  if (schemaName?.includes?.('ListTools') || schema === 'list-tools') {
    mockListToolsHandler = handler;
  } else if (schemaName?.includes?.('CallTool') || schema === 'call-tool') {
    mockCallToolHandler = handler;
  } else if (schemaName?.includes?.('ListResources') || schema === 'list-resources') {
    mockListResourcesHandler = handler;
  } else if (schemaName?.includes?.('ReadResource') || schema === 'read-resource') {
    mockReadResourceHandler = handler;
  }
});

const mockConnect = mock(() => Promise.resolve(undefined));

const mockServer = {
  setRequestHandler: mockSetRequestHandler,
  connect: mockConnect
};

const MockServer = mock(() => mockServer);
const MockStdioServerTransport = mock(() => ({}));

// Mock the MCP SDK
mock.module('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: MockServer
}));

mock.module('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: MockStdioServerTransport
}));

// Mock schemas as simple objects
mock.module('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: { name: 'ListToolsRequestSchema' },
  CallToolRequestSchema: { name: 'CallToolRequestSchema' },
  ListResourcesRequestSchema: { name: 'ListResourcesRequestSchema' },
  ReadResourceRequestSchema: { name: 'ReadResourceRequestSchema' }
}));

// Import the server module and wait for initialization
const initializationPromise = import('../index.js').then((_module) => {
  return new Promise(resolve => setTimeout(resolve, 100));
});

await initializationPromise;

// Benchmark result storage
interface BenchmarkResult {
  operation: string;
  samples: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdDev: number;
  opsPerSecond: number;
}

const benchmarkResults: BenchmarkResult[] = [];

// Helper function to calculate statistics
function calculateStats(times: number[]): Omit<BenchmarkResult, 'operation' | 'samples'> {
  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;
  
  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = times.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 === 0 ? (sorted[n/2 - 1] + sorted[n/2]) / 2 : sorted[Math.floor(n/2)];
  const p95 = sorted[Math.floor(n * 0.95)];
  const p99 = sorted[Math.floor(n * 0.99)];
  
  const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  const opsPerSecond = 1000 / mean;
  
  return { min, max, mean, median, p95, p99, stdDev, opsPerSecond };
}

// Helper function to run benchmark
async function runBenchmark(
  name: string,
  operation: () => Promise<any>,
  samples: number = 100
): Promise<BenchmarkResult> {
  const times: number[] = [];
  
  // Warmup
  for (let i = 0; i < 10; i++) {
    await operation();
  }
  
  // Actual benchmark
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    await operation();
    const end = performance.now();
    times.push(end - start);
  }
  
  const stats = calculateStats(times);
  const result = { operation: name, samples, ...stats };
  benchmarkResults.push(result);
  
  return result;
}

describe('MCP Performance Benchmarks', () => {
  afterAll(() => {
    // Generate comprehensive performance report
    console.log('\n=== MCP PERFORMANCE BENCHMARK REPORT ===\n');
    console.log('All times in milliseconds (ms)\n');
    
    // Summary table
    console.log('Operation                           | Samples | Mean    | Median  | P95     | P99     | Ops/sec');
    console.log('-----------------------------------|---------|---------|---------|---------|---------|--------');
    
    for (const result of benchmarkResults) {
      console.log(
        `${result.operation.padEnd(35)} | ${result.samples.toString().padStart(7)} | ` +
        `${result.mean.toFixed(3).padStart(7)} | ${result.median.toFixed(3).padStart(7)} | ` +
        `${result.p95.toFixed(3).padStart(7)} | ${result.p99.toFixed(3).padStart(7)} | ` +
        `${result.opsPerSecond.toFixed(0).padStart(7)}`
      );
    }
    
    console.log('\nDetailed Statistics:');
    for (const result of benchmarkResults) {
      console.log(`\n${result.operation}:`);
      console.log(`  Min: ${result.min.toFixed(3)}ms, Max: ${result.max.toFixed(3)}ms`);
      console.log(`  Standard Deviation: ${result.stdDev.toFixed(3)}ms`);
      console.log(`  Performance: ${result.opsPerSecond.toFixed(0)} ops/sec`);
    }
  });

  describe('Tool Call Benchmarks', () => {
    it('should benchmark convert-color tool', async () => {
      const colors = [
        '#FF6B6B', 'rgb(76, 237, 196)', 'hsl(197, 71%, 73%)',
        'lab(53.23, 80.11, 67.22)', '#96CEB4', 'rgba(254, 202, 87, 0.8)'
      ];
      
      const result = await runBenchmark(
        'convert-color (mixed formats)',
        async () => {
          const color = colors[Math.floor(Math.random() * colors.length)];
          await mockCallToolHandler({
            params: {
              name: 'convert-color',
              arguments: { input: color, to: ['hex', 'rgb', 'hsl'] }
            }
          });
        },
        200
      );
      
      expect(result.mean).toBeLessThan(1);
      expect(result.p95).toBeLessThan(2);
    });

    it('should benchmark generate-harmony tool', async () => {
      const harmonyTypes = ['complementary', 'analogous', 'triadic', 'tetradic', 'split-complementary'];
      
      const result = await runBenchmark(
        'generate-harmony (all types)',
        async () => {
          const type = harmonyTypes[Math.floor(Math.random() * harmonyTypes.length)];
          await mockCallToolHandler({
            params: {
              name: 'generate-harmony',
              arguments: { baseColor: '#FF6B6B', harmonyType: type }
            }
          });
        },
        150
      );
      
      expect(result.mean).toBeLessThan(2);
      expect(result.p95).toBeLessThan(5);
    });

    it('should benchmark check-contrast tool', async () => {
      const colorPairs = [
        { fg: '#000000', bg: '#FFFFFF' },
        { fg: '#FF0000', bg: '#00FF00' },
        { fg: '#333333', bg: '#CCCCCC' },
        { fg: '#1A237E', bg: '#E3F2FD' }
      ];
      
      const result = await runBenchmark(
        'check-contrast',
        async () => {
          const pair = colorPairs[Math.floor(Math.random() * colorPairs.length)];
          await mockCallToolHandler({
            params: {
              name: 'check-contrast',
              arguments: { foreground: pair.fg, background: pair.bg }
            }
          });
        },
        200
      );
      
      expect(result.mean).toBeLessThan(0.5);
      expect(result.p95).toBeLessThan(1);
    });

    it('should benchmark simulate-colorblind tool', async () => {
      const types = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
      
      const result = await runBenchmark(
        'simulate-colorblind (single type)',
        async () => {
          const type = types[Math.floor(Math.random() * types.length)];
          await mockCallToolHandler({
            params: {
              name: 'simulate-colorblind',
              arguments: { 
                color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                type 
              }
            }
          });
        },
        150
      );
      
      expect(result.mean).toBeLessThan(1);
      expect(result.p95).toBeLessThan(2);
    });

    it('should benchmark find-accessible-color tool', async () => {
      const result = await runBenchmark(
        'find-accessible-color',
        async () => {
          await mockCallToolHandler({
            params: {
              name: 'find-accessible-color',
              arguments: {
                targetColor: '#FFFF00',
                backgroundColor: '#FFFFFF',
                targetRatio: 4.5
              }
            }
          });
        },
        100
      );
      
      expect(result.mean).toBeLessThan(5);
      expect(result.p95).toBeLessThan(10);
    });

    it('should benchmark mix-colors tool', async () => {
      const modes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten'];
      
      const result = await runBenchmark(
        'mix-colors (various modes)',
        async () => {
          const mode = modes[Math.floor(Math.random() * modes.length)];
          await mockCallToolHandler({
            params: {
              name: 'mix-colors',
              arguments: {
                color1: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                color2: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
                ratio: Math.random(),
                mode
              }
            }
          });
        },
        200
      );
      
      expect(result.mean).toBeLessThan(1);
      expect(result.p95).toBeLessThan(2);
    });
  });

  describe('Resource Access Benchmarks', () => {
    it('should benchmark palette resource access', async () => {
      const paletteIds = ['material-design', 'tailwind', 'tailwind-v4'];
      
      const result = await runBenchmark(
        'read-palette-resource',
        async () => {
          const id = paletteIds[Math.floor(Math.random() * paletteIds.length)];
          await mockReadResourceHandler({
            params: { uri: `palette://${id}` }
          });
        },
        150
      );
      
      expect(result.mean).toBeLessThan(0.5);
      expect(result.p95).toBeLessThan(1);
    });

    it('should benchmark named colors resource access', async () => {
      const result = await runBenchmark(
        'read-named-colors',
        async () => {
          await mockReadResourceHandler({
            params: { uri: 'colors://named' }
          });
        },
        100
      );
      
      expect(result.mean).toBeLessThan(1);
      expect(result.p95).toBeLessThan(2);
    });

    it('should benchmark list resources', async () => {
      const result = await runBenchmark(
        'list-resources',
        async () => {
          await mockListResourcesHandler();
        },
        200
      );
      
      expect(result.mean).toBeLessThan(0.1);
      expect(result.p95).toBeLessThan(0.5);
    });

    it('should benchmark list tools', async () => {
      const result = await runBenchmark(
        'list-tools',
        async () => {
          await mockListToolsHandler();
        },
        200
      );
      
      expect(result.mean).toBeLessThan(0.1);
      expect(result.p95).toBeLessThan(0.5);
    });
  });

  describe('Complex Operation Benchmarks', () => {
    it('should benchmark full color analysis workflow', async () => {
      const result = await runBenchmark(
        'full-color-analysis',
        async () => {
          const color = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
          
          // Convert to all formats
          await mockCallToolHandler({
            params: {
              name: 'convert-color',
              arguments: { input: color, to: ['hex', 'rgb', 'hsl', 'lab', 'xyz'] }
            }
          });
          
          // Generate harmony
          await mockCallToolHandler({
            params: {
              name: 'generate-harmony',
              arguments: { baseColor: color, harmonyType: 'complementary' }
            }
          });
          
          // Check contrast with white and black
          await mockCallToolHandler({
            params: {
              name: 'check-contrast',
              arguments: { foreground: color, background: '#FFFFFF' }
            }
          });
          
          await mockCallToolHandler({
            params: {
              name: 'check-contrast',
              arguments: { foreground: color, background: '#000000' }
            }
          });
          
          // Simulate color blindness
          await mockCallToolHandler({
            params: {
              name: 'simulate-colorblind',
              arguments: { color }
            }
          });
        },
        50
      );
      
      expect(result.mean).toBeLessThan(10);
      expect(result.p95).toBeLessThan(20);
    });

    it('should benchmark palette generation workflow', async () => {
      const result = await runBenchmark(
        'palette-generation',
        async () => {
          const baseColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
          const colors = [];
          
          // Generate 10 shades
          for (let i = 0; i < 10; i++) {
            const ratio = i / 9;
            const mixResult = await mockCallToolHandler({
              params: {
                name: 'mix-colors',
                arguments: {
                  color1: baseColor,
                  color2: ratio < 0.5 ? '#FFFFFF' : '#000000',
                  ratio: ratio < 0.5 ? ratio * 2 : (ratio - 0.5) * 2
                }
              }
            });
            colors.push(JSON.parse(mixResult.content[0].text).result);
          }
          
          return colors;
        },
        30
      );
      
      expect(result.mean).toBeLessThan(15);
      expect(result.p95).toBeLessThan(30);
    });
  });

  describe('Concurrent Operation Benchmarks', () => {
    it('should benchmark concurrent tool calls', async () => {
      const concurrencyLevels = [1, 5, 10, 20, 50];
      
      for (const concurrency of concurrencyLevels) {
        const result = await runBenchmark(
          `concurrent-operations (${concurrency})`,
          async () => {
            const promises = Array.from({ length: concurrency }, async () => {
              const opType = Math.floor(Math.random() * 3);
              
              switch (opType) {
                case 0:
                  return mockCallToolHandler({
                    params: {
                      name: 'convert-color',
                      arguments: { input: '#FF6B6B' }
                    }
                  });
                case 1:
                  return mockCallToolHandler({
                    params: {
                      name: 'check-contrast',
                      arguments: { foreground: '#000000', background: '#FFFFFF' }
                    }
                  });
                case 2:
                  return mockCallToolHandler({
                    params: {
                      name: 'mix-colors',
                      arguments: { color1: '#FF0000', color2: '#0000FF' }
                    }
                  });
              }
            });
            
            await Promise.all(promises);
          },
          50
        );
        
        // Performance should scale reasonably with concurrency
        expect(result.mean).toBeLessThan(concurrency * 2);
      }
    });

    it('should benchmark mixed read/write operations', async () => {
      const result = await runBenchmark(
        'mixed-read-write',
        async () => {
          // Simulate mixed workload
          const operations = [
            // Read operations
            mockListToolsHandler(),
            mockListResourcesHandler(),
            mockReadResourceHandler({ params: { uri: 'color-palettes' } }),
            
            // Write operations (tool calls)
            mockCallToolHandler({
              params: {
                name: 'convert-color',
                arguments: { input: '#123456' }
              }
            }),
            mockCallToolHandler({
              params: {
                name: 'generate-harmony',
                arguments: { baseColor: '#654321', harmonyType: 'triadic' }
              }
            })
          ];
          
          await Promise.all(operations);
        },
        100
      );
      
      expect(result.mean).toBeLessThan(5);
      expect(result.p95).toBeLessThan(10);
    });
  });

  describe('Memory and Cache Performance', () => {
    it('should benchmark cache hit vs miss performance', async () => {
      // Clear any caches by using unique colors
      const uniqueColors = Array.from({ length: 100 }, (_, i) => 
        `#${i.toString(16).padStart(6, '0')}`
      );
      
      // Benchmark cache misses
      const missBenchmark = await runBenchmark(
        'cache-miss (unique colors)',
        async () => {
          const color = uniqueColors[Math.floor(Math.random() * uniqueColors.length)];
          await mockCallToolHandler({
            params: {
              name: 'convert-color',
              arguments: { input: color }
            }
          });
        },
        100
      );
      
      // Benchmark cache hits (repeated colors)
      const repeatedColors = ['#FF0000', '#00FF00', '#0000FF'];
      
      const hitBenchmark = await runBenchmark(
        'cache-hit (repeated colors)',
        async () => {
          const color = repeatedColors[Math.floor(Math.random() * repeatedColors.length)];
          await mockCallToolHandler({
            params: {
              name: 'convert-color',
              arguments: { input: color }
            }
          });
        },
        100
      );
      
      // Cache hits should be faster
      expect(hitBenchmark.mean).toBeLessThan(missBenchmark.mean);
    });

    it('should benchmark performance under memory pressure', async () => {
      // Generate many unique operations to stress memory
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
        operation: ['convert', 'harmony', 'contrast'][i % 3]
      }));
      
      const result = await runBenchmark(
        'memory-pressure-test',
        async () => {
          const item = largeDataset[Math.floor(Math.random() * largeDataset.length)];
          
          switch (item.operation) {
            case 'convert':
              await mockCallToolHandler({
                params: {
                  name: 'convert-color',
                  arguments: { input: item.color }
                }
              });
              break;
            case 'harmony':
              await mockCallToolHandler({
                params: {
                  name: 'generate-harmony',
                  arguments: { baseColor: item.color, harmonyType: 'complementary' }
                }
              });
              break;
            case 'contrast':
              await mockCallToolHandler({
                params: {
                  name: 'check-contrast',
                  arguments: { foreground: item.color, background: '#FFFFFF' }
                }
              });
              break;
          }
        },
        200
      );
      
      // Performance should remain stable under memory pressure
      expect(result.stdDev).toBeLessThan(result.mean * 0.5); // Low variance
      expect(result.p99).toBeLessThan(result.mean * 3); // No extreme outliers
    });
  });

  describe('Error Handling Performance', () => {
    it('should benchmark error handling overhead', async () => {
      // Benchmark successful operations
      const successBenchmark = await runBenchmark(
        'successful-operations',
        async () => {
          await mockCallToolHandler({
            params: {
              name: 'convert-color',
              arguments: { input: '#FF6B6B' }
            }
          });
        },
        100
      );
      
      // Benchmark error operations
      const errorBenchmark = await runBenchmark(
        'error-operations',
        async () => {
          await mockCallToolHandler({
            params: {
              name: 'convert-color',
              arguments: { input: 'invalid-color-format' }
            }
          });
        },
        100
      );
      
      // Error handling should not add significant overhead
      expect(errorBenchmark.mean).toBeLessThan(successBenchmark.mean * 2);
    });
  });
});