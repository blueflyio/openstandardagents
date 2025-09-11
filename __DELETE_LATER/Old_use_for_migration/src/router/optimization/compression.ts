/**
 * Data Compression Utilities
 * High-performance compression for payloads and responses
 */

import { promisify } from 'util';
import { gzip, gunzip, deflate, inflate, brotliCompress, brotliDecompress } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);
const brotliCompressAsync = promisify(brotliCompress);
const brotliDecompressAsync = promisify(brotliDecompress);

export type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli';

export interface CompressionOptions {
  algorithm: CompressionAlgorithm;
  level?: number; // Compression level (1-9 for gzip/deflate, 0-11 for brotli)
  threshold?: number; // Minimum size to compress (bytes)
  chunkSize?: number; // Chunk size for streaming compression
}

export interface CompressionResult {
  compressed: Buffer;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  algorithm: CompressionAlgorithm;
}

export interface CompressionStatistics {
  totalCompressions: number;
  totalDecompressions: number;
  bytesCompressed: number;
  bytesDecompressed: number;
  averageRatio: number;
  timeSpentCompressing: number;
  timeSpentDecompressing: number;
  algorithmsUsed: Record<CompressionAlgorithm, number>;
}

export class CompressionManager {
  private stats: CompressionStatistics = {
    totalCompressions: 0,
    totalDecompressions: 0,
    bytesCompressed: 0,
    bytesDecompressed: 0,
    averageRatio: 1,
    timeSpentCompressing: 0,
    timeSpentDecompressing: 0,
    algorithmsUsed: {
      gzip: 0,
      deflate: 0,
      brotli: 0,
    },
  };

  private compressionCache = new Map<string, CompressionResult>();
  private cacheTimeout = 300000; // 5 minutes

  /**
   * Compress data with specified algorithm
   */
  async compress(
    data: string | Buffer, 
    options: CompressionOptions = { algorithm: 'gzip' }
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    const originalSize = buffer.length;

    // Skip compression if below threshold
    if (options.threshold && originalSize < options.threshold) {
      return {
        compressed: buffer,
        originalSize,
        compressedSize: originalSize,
        ratio: 1,
        algorithm: options.algorithm,
      };
    }

    // Check cache
    const cacheKey = this.generateCacheKey(buffer, options);
    const cached = this.compressionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let compressed: Buffer;

    try {
      switch (options.algorithm) {
        case 'gzip':
          compressed = await gzipAsync(buffer, { level: options.level || 6 });
          break;
        case 'deflate':
          compressed = await deflateAsync(buffer, { level: options.level || 6 });
          break;
        case 'brotli':
          compressed = await brotliCompressAsync(buffer, {
            params: {
              [require('zlib').constants.BROTLI_PARAM_QUALITY]: options.level || 4,
            },
          });
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${options.algorithm}`);
      }

      const compressedSize = compressed.length;
      const ratio = originalSize > 0 ? compressedSize / originalSize : 1;
      const compressionTime = performance.now() - startTime;

      const result: CompressionResult = {
        compressed,
        originalSize,
        compressedSize,
        ratio,
        algorithm: options.algorithm,
      };

      // Update statistics
      this.updateCompressionStats(originalSize, compressedSize, compressionTime, options.algorithm, ratio);

      // Cache result if beneficial
      if (ratio < 0.9 && originalSize > 1024) { // Only cache if >10% reduction and >1KB
        this.compressionCache.set(cacheKey, result);
        
        // Clean cache if too large
        if (this.compressionCache.size > 1000) {
          this.cleanupCache();
        }
      }

      return result;

    } catch (error) {
      console.error(`Compression failed with ${options.algorithm}:`, error);
      
      // Return uncompressed data as fallback
      return {
        compressed: buffer,
        originalSize,
        compressedSize: originalSize,
        ratio: 1,
        algorithm: options.algorithm,
      };
    }
  }

  /**
   * Decompress data
   */
  async decompress(
    compressedData: Buffer, 
    algorithm: CompressionAlgorithm,
    originalSize?: number
  ): Promise<Buffer> {
    const startTime = performance.now();

    try {
      let decompressed: Buffer;

      switch (algorithm) {
        case 'gzip':
          decompressed = await gunzipAsync(compressedData);
          break;
        case 'deflate':
          decompressed = await inflateAsync(compressedData);
          break;
        case 'brotli':
          decompressed = await brotliDecompressAsync(compressedData);
          break;
        default:
          throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
      }

      const decompressionTime = performance.now() - startTime;
      
      // Update statistics
      this.stats.totalDecompressions++;
      this.stats.bytesDecompressed += decompressed.length;
      this.stats.timeSpentDecompressing += decompressionTime;

      return decompressed;

    } catch (error) {
      console.error(`Decompression failed with ${algorithm}:`, error);
      throw new Error(`Failed to decompress data: ${error}`);
    }
  }

  /**
   * Compress JSON data optimally
   */
  async compressJSON(obj: any, options: Partial<CompressionOptions> = {}): Promise<CompressionResult> {
    const jsonString = JSON.stringify(obj);
    
    // Choose optimal algorithm based on data characteristics
    const algorithm = this.selectOptimalAlgorithm(jsonString);
    
    return this.compress(jsonString, {
      algorithm,
      threshold: 100, // Compress JSON > 100 bytes
      ...options,
    });
  }

  /**
   * Decompress JSON data
   */
  async decompressJSON(compressedData: Buffer, algorithm: CompressionAlgorithm): Promise<any> {
    const decompressed = await this.decompress(compressedData, algorithm);
    return JSON.parse(decompressed.toString('utf8'));
  }

  /**
   * Compress response payload for HTTP
   */
  async compressResponse(
    data: any, 
    acceptedEncodings: string[] = ['gzip', 'deflate', 'br']
  ): Promise<{ data: Buffer; encoding: string; ratio: number } | null> {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (jsonString.length < 1024) { // Don't compress small responses
      return null;
    }

    // Select best supported algorithm
    let algorithm: CompressionAlgorithm;
    if (acceptedEncodings.includes('br')) {
      algorithm = 'brotli';
    } else if (acceptedEncodings.includes('gzip')) {
      algorithm = 'gzip';
    } else if (acceptedEncodings.includes('deflate')) {
      algorithm = 'deflate';
    } else {
      return null; // No supported compression
    }

    const result = await this.compress(jsonString, {
      algorithm,
      level: algorithm === 'brotli' ? 4 : 6, // Balanced speed/ratio
    });

    // Only return compressed if beneficial
    if (result.ratio < 0.8) {
      return {
        data: result.compressed,
        encoding: algorithm === 'brotli' ? 'br' : algorithm,
        ratio: result.ratio,
      };
    }

    return null;
  }

  /**
   * Stream compression for large datasets
   */
  async compressStream(
    inputStream: NodeJS.ReadableStream,
    algorithm: CompressionAlgorithm = 'gzip',
    options: { level?: number } = {}
  ): Promise<NodeJS.ReadableStream> {
    const { createGzip, createDeflate, createBrotliCompress } = require('zlib');
    
    switch (algorithm) {
      case 'gzip':
        return inputStream.pipe(createGzip({ level: options.level || 6 }));
      case 'deflate':
        return inputStream.pipe(createDeflate({ level: options.level || 6 }));
      case 'brotli':
        return inputStream.pipe(createBrotliCompress({
          params: {
            [require('zlib').constants.BROTLI_PARAM_QUALITY]: options.level || 4,
          },
        }));
      default:
        throw new Error(`Unsupported streaming compression: ${algorithm}`);
    }
  }

  /**
   * Batch compression for multiple items
   */
  async compressBatch(
    items: Array<{ key: string; data: string | Buffer }>,
    options: CompressionOptions = { algorithm: 'gzip' }
  ): Promise<Map<string, CompressionResult>> {
    const results = new Map<string, CompressionResult>();
    
    // Process in parallel but limit concurrency
    const batchSize = 10;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const promises = batch.map(async (item) => {
        const result = await this.compress(item.data, options);
        return { key: item.key, result };
      });
      
      const batchResults = await Promise.allSettled(promises);
      
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          results.set(promiseResult.value.key, promiseResult.value.result);
        }
      }
    }
    
    return results;
  }

  /**
   * Get compression statistics
   */
  getStatistics(): CompressionStatistics {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.stats = {
      totalCompressions: 0,
      totalDecompressions: 0,
      bytesCompressed: 0,
      bytesDecompressed: 0,
      averageRatio: 1,
      timeSpentCompressing: 0,
      timeSpentDecompressing: 0,
      algorithmsUsed: {
        gzip: 0,
        deflate: 0,
        brotli: 0,
      },
    };
  }

  /**
   * Clear compression cache
   */
  clearCache(): void {
    this.compressionCache.clear();
  }

  /**
   * Get optimal compression algorithm for data type
   */
  getOptimalAlgorithm(data: string | Buffer): CompressionAlgorithm {
    return this.selectOptimalAlgorithm(data);
  }

  // Private methods

  private selectOptimalAlgorithm(data: string | Buffer): CompressionAlgorithm {
    const content = Buffer.isBuffer(data) ? data.toString() : data;
    
    // For JSON data, brotli usually provides best compression
    if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
      return 'brotli';
    }
    
    // For repetitive text, brotli is also good
    if (this.hasHighRepetition(content)) {
      return 'brotli';
    }
    
    // For general text, gzip is a good balance
    if (content.length > 10000) {
      return 'gzip';
    }
    
    // For small data, deflate has less overhead
    return 'deflate';
  }

  private hasHighRepetition(content: string): boolean {
    // Simple heuristic: check for repeated patterns
    const chunks = content.match(/.{1,10}/g) || [];
    const uniqueChunks = new Set(chunks);
    
    return uniqueChunks.size < chunks.length * 0.7; // Less than 70% unique chunks
  }

  private generateCacheKey(data: Buffer, options: CompressionOptions): string {
    const hash = require('crypto').createHash('md5').update(data).digest('hex');
    return `${hash}-${options.algorithm}-${options.level || 'default'}`;
  }

  private updateCompressionStats(
    originalSize: number,
    compressedSize: number,
    compressionTime: number,
    algorithm: CompressionAlgorithm,
    ratio: number
  ): void {
    this.stats.totalCompressions++;
    this.stats.bytesCompressed += originalSize;
    this.stats.timeSpentCompressing += compressionTime;
    this.stats.algorithmsUsed[algorithm]++;
    
    // Update average ratio (running average)
    this.stats.averageRatio = 
      (this.stats.averageRatio * (this.stats.totalCompressions - 1) + ratio) / this.stats.totalCompressions;
  }

  private cleanupCache(): void {
    // Remove oldest entries (simple LRU-like cleanup)
    const entries = Array.from(this.compressionCache.entries());
    entries.sort(() => Math.random() - 0.5); // Random eviction for simplicity
    
    const toRemove = entries.slice(0, entries.length - 500); // Keep 500 entries
    for (const [key] of toRemove) {
      this.compressionCache.delete(key);
    }
  }
}

// Export singleton instance
export const compressionManager = new CompressionManager();