/**
 * Performance Optimizer
 * Advanced performance optimization for sub-100ms response times
 */

import { EventEmitter } from 'events';
import { PerformanceMetrics } from '../types';

export interface PerformanceConfig {
  targetResponseTime: number; // Target response time in ms
  maxConcurrentQueries: number;
  batchSize: number;
  compressionEnabled: boolean;
  connectionPooling: boolean;
  preloadingEnabled: boolean;
  adaptiveOptimization: boolean;
}

export interface OptimizationStrategy {
  name: string;
  priority: number;
  condition: (metrics: PerformanceMetrics) => boolean;
  apply: () => Promise<void>;
  rollback: () => Promise<void>;
}

export interface PerformanceProfile {
  timestamp: Date;
  avgResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  concurrency: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class PerformanceOptimizer extends EventEmitter {
  private config: PerformanceConfig;
  private isRunning = false;
  private optimizationStrategies: OptimizationStrategy[] = [];
  private activeOptimizations = new Set<string>();
  
  // Performance tracking
  private responseTimes: number[] = [];
  private requestStartTimes = new Map<string, number>();
  private metrics: PerformanceMetrics;
  private performanceHistory: PerformanceProfile[] = [];
  
  // Optimization state
  private queryQueue: Array<{ query: () => Promise<any>; resolve: Function; reject: Function }> = [];
  private activeQueries = 0;
  private batchBuffer: Array<() => Promise<any>> = [];
  private batchTimeout?: NodeJS.Timeout;
  
  // Monitoring
  private monitoringInterval?: NodeJS.Timeout;
  private adaptiveInterval?: NodeJS.Timeout;

  constructor(config: PerformanceConfig) {
    super();
    this.config = config;
    
    this.metrics = {
      timestamp: new Date(),
      totalQueries: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHitRate: 0,
      activeConnections: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      indexSize: 0,
    };

    this.initializeOptimizationStrategies();
  }

  /**
   * Start the performance optimizer
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startMonitoring();
    
    if (this.config.adaptiveOptimization) {
      this.startAdaptiveOptimization();
    }

    console.log(`⚡ Performance Optimizer started (target: ${this.config.targetResponseTime}ms)`);
  }

  /**
   * Stop the performance optimizer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.adaptiveInterval) {
      clearInterval(this.adaptiveInterval);
    }

    // Clear batch timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Wait for active queries to complete
    while (this.activeQueries > 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Rollback active optimizations
    for (const optimizationName of this.activeOptimizations) {
      const strategy = this.optimizationStrategies.find(s => s.name === optimizationName);
      if (strategy) {
        try {
          await strategy.rollback();
        } catch (error) {
          console.error(`Failed to rollback optimization ${optimizationName}:`, error);
        }
      }
    }

    this.isRunning = false;
    console.log('⚡ Performance Optimizer stopped');
  }

  /**
   * Execute query with performance optimization
   */
  async executeOptimizedQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    const queryId = this.generateQueryId();
    this.requestStartTimes.set(queryId, performance.now());
    
    try {
      // Check if we need to queue the query
      if (this.activeQueries >= this.config.maxConcurrentQueries) {
        return this.queueQuery(queryFn);
      }

      // Check if we should batch the query
      if (this.config.batchSize > 1 && this.shouldBatch()) {
        return this.batchQuery(queryFn);
      }

      // Execute directly with concurrency control
      return this.executeWithConcurrencyControl(queryFn);
      
    } finally {
      const startTime = this.requestStartTimes.get(queryId);
      if (startTime) {
        const responseTime = performance.now() - startTime;
        this.recordMetric('query_execution', responseTime);
        this.requestStartTimes.delete(queryId);
      }
    }
  }

  /**
   * Record performance metric
   */
  recordMetric(type: string, value: number): void {
    this.responseTimes.push(value);
    
    // Keep only recent measurements for performance
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-500);
    }

    this.updateMetrics();
    this.checkPerformanceThresholds();
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(): PerformanceProfile[] {
    return [...this.performanceHistory];
  }

  /**
   * Check if optimizer is healthy
   */
  isHealthy(): boolean {
    return this.isRunning && 
           this.metrics.avgResponseTime < this.config.targetResponseTime * 2 &&
           this.activeQueries < this.config.maxConcurrentQueries;
  }

  /**
   * Force performance optimization
   */
  async optimizePerformance(): Promise<void> {
    const currentMetrics = this.getMetrics();
    
    for (const strategy of this.optimizationStrategies) {
      if (strategy.condition(currentMetrics) && !this.activeOptimizations.has(strategy.name)) {
        try {
          await strategy.apply();
          this.activeOptimizations.add(strategy.name);
          
          console.log(`🔧 Applied optimization strategy: ${strategy.name}`);
          this.emit('optimization_applied', { strategy: strategy.name });
          
        } catch (error) {
          console.error(`Failed to apply optimization ${strategy.name}:`, error);
        }
      }
    }
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    strategy: string;
    priority: number;
    reason: string;
    estimatedImprovement: string;
  }> {
    const recommendations = [];
    const currentMetrics = this.getMetrics();
    
    for (const strategy of this.optimizationStrategies) {
      if (strategy.condition(currentMetrics) && !this.activeOptimizations.has(strategy.name)) {
        recommendations.push({
          strategy: strategy.name,
          priority: strategy.priority,
          reason: this.getOptimizationReason(strategy.name, currentMetrics),
          estimatedImprovement: this.getEstimatedImprovement(strategy.name),
        });
      }
    }
    
    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  // Private methods

  private async executeWithConcurrencyControl<T>(queryFn: () => Promise<T>): Promise<T> {
    this.activeQueries++;
    
    try {
      const result = await queryFn();
      return result;
    } finally {
      this.activeQueries--;
      this.processQueue();
    }
  }

  private async queueQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queryQueue.push({
        query: queryFn,
        resolve,
        reject,
      });
    });
  }

  private async batchQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchBuffer.push(async () => {
        try {
          const result = await queryFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      // Set timeout to flush batch
      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.flushBatch();
        }, 10); // 10ms batch window
      }

      // Flush if batch is full
      if (this.batchBuffer.length >= this.config.batchSize) {
        this.flushBatch();
      }
    });
  }

  private async flushBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = undefined;
    }

    if (this.batchBuffer.length === 0) return;

    const batch = this.batchBuffer.splice(0);
    
    try {
      // Execute batch in parallel
      await Promise.all(batch.map(query => query()));
    } catch (error) {
      console.error('Batch execution error:', error);
    }
  }

  private processQueue(): void {
    while (this.queryQueue.length > 0 && this.activeQueries < this.config.maxConcurrentQueries) {
      const { query, resolve, reject } = this.queryQueue.shift()!;
      
      this.executeWithConcurrencyControl(query)
        .then(resolve)
        .catch(reject);
    }
  }

  private shouldBatch(): boolean {
    return this.config.batchSize > 1 && 
           this.activeQueries < this.config.maxConcurrentQueries * 0.8; // Don't batch if near limit
  }

  private updateMetrics(): void {
    if (this.responseTimes.length === 0) return;

    const sortedTimes = [...this.responseTimes].sort((a, b) => a - b);
    const total = sortedTimes.reduce((sum, time) => sum + time, 0);
    
    this.metrics = {
      ...this.metrics,
      timestamp: new Date(),
      totalQueries: this.metrics.totalQueries + 1,
      avgResponseTime: total / sortedTimes.length,
      p95ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
      p99ResponseTime: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
      activeConnections: this.activeQueries,
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user,
    };
  }

  private checkPerformanceThresholds(): void {
    const currentMetrics = this.getMetrics();
    
    // Check if we're exceeding target response time
    if (currentMetrics.avgResponseTime > this.config.targetResponseTime) {
      this.emit('performance_warning', {
        type: 'response_time',
        current: currentMetrics.avgResponseTime,
        target: this.config.targetResponseTime,
      });
    }

    // Check if we're hitting concurrency limits
    if (this.activeQueries > this.config.maxConcurrentQueries * 0.9) {
      this.emit('performance_warning', {
        type: 'concurrency',
        current: this.activeQueries,
        limit: this.config.maxConcurrentQueries,
      });
    }

    // Check for memory pressure
    const memoryUsageMB = currentMetrics.memoryUsage / (1024 * 1024);
    if (memoryUsageMB > 500) { // 500MB threshold
      this.emit('performance_warning', {
        type: 'memory',
        current: memoryUsageMB,
        threshold: 500,
      });
    }
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.recordPerformanceProfile();
      this.cleanupOldData();
    }, 5000); // Every 5 seconds
  }

  private startAdaptiveOptimization(): void {
    this.adaptiveInterval = setInterval(async () => {
      await this.optimizePerformance();
    }, 30000); // Every 30 seconds
  }

  private recordPerformanceProfile(): void {
    const profile: PerformanceProfile = {
      timestamp: new Date(),
      avgResponseTime: this.metrics.avgResponseTime,
      p50ResponseTime: this.responseTimes.length > 0 ? 
        [...this.responseTimes].sort((a, b) => a - b)[Math.floor(this.responseTimes.length * 0.5)] : 0,
      p95ResponseTime: this.metrics.p95ResponseTime,
      p99ResponseTime: this.metrics.p99ResponseTime,
      throughput: this.calculateThroughput(),
      concurrency: this.activeQueries,
      memoryUsage: this.metrics.memoryUsage,
      cpuUsage: this.metrics.cpuUsage,
    };

    this.performanceHistory.push(profile);
    
    // Keep only recent history
    if (this.performanceHistory.length > 288) { // 24 hours of 5-minute intervals
      this.performanceHistory = this.performanceHistory.slice(-144); // Keep 12 hours
    }
  }

  private calculateThroughput(): number {
    // Calculate queries per second based on recent activity
    const recentProfiles = this.performanceHistory.slice(-12); // Last minute
    if (recentProfiles.length < 2) return 0;
    
    const timeSpan = recentProfiles[recentProfiles.length - 1].timestamp.getTime() - 
                   recentProfiles[0].timestamp.getTime();
    
    return (this.metrics.totalQueries * 1000) / timeSpan; // QPS
  }

  private cleanupOldData(): void {
    // Clean up old request tracking
    const cutoffTime = performance.now() - 300000; // 5 minutes
    for (const [queryId, startTime] of this.requestStartTimes) {
      if (startTime < cutoffTime) {
        this.requestStartTimes.delete(queryId);
      }
    }
  }

  private initializeOptimizationStrategies(): void {
    // Response time optimization
    this.optimizationStrategies.push({
      name: 'aggressive_caching',
      priority: 10,
      condition: (metrics) => metrics.avgResponseTime > this.config.targetResponseTime * 1.5,
      apply: async () => {
        // Increase cache TTL and size
        this.emit('optimization_request', { type: 'increase_cache_ttl', factor: 2 });
      },
      rollback: async () => {
        this.emit('optimization_request', { type: 'reset_cache_ttl' });
      },
    });

    // Concurrency optimization
    this.optimizationStrategies.push({
      name: 'increase_batch_size',
      priority: 8,
      condition: (metrics) => this.activeQueries > this.config.maxConcurrentQueries * 0.8,
      apply: async () => {
        this.config.batchSize = Math.min(this.config.batchSize * 2, 100);
      },
      rollback: async () => {
        this.config.batchSize = Math.max(this.config.batchSize / 2, 1);
      },
    });

    // Memory optimization
    this.optimizationStrategies.push({
      name: 'memory_optimization',
      priority: 9,
      condition: (metrics) => metrics.memoryUsage > 500 * 1024 * 1024, // 500MB
      apply: async () => {
        // Trigger garbage collection and cache cleanup
        if (global.gc) {
          global.gc();
        }
        this.emit('optimization_request', { type: 'cleanup_cache' });
      },
      rollback: async () => {
        // No rollback needed for memory optimization
      },
    });

    // Index optimization
    this.optimizationStrategies.push({
      name: 'optimize_indexes',
      priority: 7,
      condition: (metrics) => metrics.avgResponseTime > this.config.targetResponseTime,
      apply: async () => {
        this.emit('optimization_request', { type: 'rebuild_indexes' });
      },
      rollback: async () => {
        // Index optimization doesn't need rollback
      },
    });

    // Connection pooling
    this.optimizationStrategies.push({
      name: 'enable_connection_pooling',
      priority: 6,
      condition: (metrics) => !this.config.connectionPooling && metrics.avgResponseTime > this.config.targetResponseTime,
      apply: async () => {
        this.config.connectionPooling = true;
        this.emit('optimization_request', { type: 'enable_connection_pooling' });
      },
      rollback: async () => {
        this.config.connectionPooling = false;
        this.emit('optimization_request', { type: 'disable_connection_pooling' });
      },
    });
  }

  private getOptimizationReason(strategyName: string, metrics: PerformanceMetrics): string {
    switch (strategyName) {
      case 'aggressive_caching':
        return `Response time ${metrics.avgResponseTime.toFixed(2)}ms exceeds target ${this.config.targetResponseTime}ms`;
      case 'increase_batch_size':
        return `High concurrency: ${this.activeQueries} active queries`;
      case 'memory_optimization':
        return `Memory usage: ${(metrics.memoryUsage / (1024 * 1024)).toFixed(2)}MB`;
      case 'optimize_indexes':
        return `Suboptimal query performance detected`;
      case 'enable_connection_pooling':
        return `Connection overhead impacting performance`;
      default:
        return 'Performance optimization opportunity detected';
    }
  }

  private getEstimatedImprovement(strategyName: string): string {
    switch (strategyName) {
      case 'aggressive_caching':
        return '20-40% response time reduction';
      case 'increase_batch_size':
        return '15-25% throughput improvement';
      case 'memory_optimization':
        return '10-20% memory reduction';
      case 'optimize_indexes':
        return '10-30% query speed improvement';
      case 'enable_connection_pooling':
        return '5-15% connection overhead reduction';
      default:
        return 'Performance improvement expected';
    }
  }

  private generateQueryId(): string {
    return `query-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}