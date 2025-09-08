/**
 * OSSA Partial Success Handling Patterns
 * Handles scenarios where operations partially succeed, enabling graceful degradation
 * and optimal resource utilization
 */

import { EventEmitter } from 'events';

export enum PartialSuccessStrategy {
  ALL_OR_NOTHING = 'all-or-nothing',       // Fail if any operation fails
  BEST_EFFORT = 'best-effort',             // Return what succeeded
  THRESHOLD_BASED = 'threshold-based',     // Succeed if threshold met
  WEIGHTED_SUCCESS = 'weighted-success',   // Weight operations by importance
  PROGRESSIVE_FALLBACK = 'progressive-fallback' // Try simpler versions on failure
}

export enum OperationStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  PARTIAL = 'partial'
}

export interface PartialOperation<T = any> {
  id: string;
  name: string;
  operation: () => Promise<T>;
  weight: number;           // Importance weight (0-1)
  required: boolean;        // Must succeed for overall success
  timeout: number;          // Individual operation timeout
  fallback?: () => Promise<T>; // Fallback operation
  dependencies: string[];   // IDs of operations this depends on
  maxRetries: number;       // Max retry attempts
  retryDelay: number;       // Delay between retries
}

export interface OperationResult<T = any> {
  id: string;
  name: string;
  status: OperationStatus;
  result?: T;
  error?: Error;
  duration: number;
  attempts: number;
  startTime: Date;
  endTime?: Date;
  usedFallback: boolean;
}

export interface PartialSuccessResult<T = any> {
  overall: OperationStatus;
  successRate: number;          // Percentage of successful operations
  weightedSuccessRate: number;  // Weighted success rate
  operations: OperationResult<T>[];
  successful: OperationResult<T>[];
  failed: OperationResult<T>[];
  skipped: OperationResult<T>[];
  totalDuration: number;
  metadata: {
    thresholdMet: boolean;
    requiredOperationsFailed: string[];
    criticalPath: string[];
    fallbacksUsed: number;
  };
}

export interface PartialSuccessConfig {
  strategy: PartialSuccessStrategy;
  successThreshold: number;        // 0-1, required success rate
  weightedThreshold: number;       // 0-1, required weighted success rate
  maxConcurrency: number;          // Max concurrent operations
  overallTimeout: number;          // Total timeout for all operations
  continueOnFailure: boolean;      // Continue other ops when one fails
  enableEarlyTermination: boolean; // Stop early if threshold impossible
  enableProgressiveTimeout: boolean; // Increase timeouts for later operations
  fallbackTimeout: number;         // Timeout for fallback operations
}

export interface DependencyGraph {
  nodes: Map<string, PartialOperation>;
  edges: Map<string, string[]>; // operation ID -> dependencies
  resolved: string[];           // Topologically sorted operation IDs
}

export class PartialSuccessHandler<T = any> extends EventEmitter {
  private operations: Map<string, PartialOperation<T>> = new Map();
  private dependencyGraph: DependencyGraph;
  private activeOperations: Map<string, Promise<OperationResult<T>>> = new Map();
  private completedOperations: Map<string, OperationResult<T>> = new Map();
  private semaphore: Semaphore;

  constructor(private config: PartialSuccessConfig) {
    super();
    this.dependencyGraph = {
      nodes: new Map(),
      edges: new Map(),
      resolved: []
    };
    this.semaphore = new Semaphore(config.maxConcurrency);
  }

  /**
   * Add operation to be executed
   */
  addOperation(operation: PartialOperation<T>): void {
    this.operations.set(operation.id, operation);
    this.dependencyGraph.nodes.set(operation.id, operation);
    this.dependencyGraph.edges.set(operation.id, operation.dependencies);
    
    // Recalculate dependency resolution order
    this.resolveDependencies();
    
    this.emit('operationAdded', { operationId: operation.id, name: operation.name });
  }

  /**
   * Remove operation
   */
  removeOperation(operationId: string): void {
    this.operations.delete(operationId);
    this.dependencyGraph.nodes.delete(operationId);
    this.dependencyGraph.edges.delete(operationId);
    
    // Remove this operation from other operations' dependencies
    for (const [id, deps] of this.dependencyGraph.edges) {
      const index = deps.indexOf(operationId);
      if (index > -1) {
        deps.splice(index, 1);
      }
    }
    
    this.resolveDependencies();
    this.emit('operationRemoved', { operationId });
  }

  /**
   * Execute all operations with partial success handling
   */
  async execute(): Promise<PartialSuccessResult<T>> {
    const startTime = Date.now();
    const results: OperationResult<T>[] = [];
    
    this.emit('executionStarted', { 
      operationCount: this.operations.size,
      strategy: this.config.strategy 
    });

    try {
      // Execute operations based on strategy
      switch (this.config.strategy) {
        case PartialSuccessStrategy.ALL_OR_NOTHING:
          results.push(...await this.executeAllOrNothing());
          break;
        case PartialSuccessStrategy.BEST_EFFORT:
          results.push(...await this.executeBestEffort());
          break;
        case PartialSuccessStrategy.THRESHOLD_BASED:
          results.push(...await this.executeThresholdBased());
          break;
        case PartialSuccessStrategy.WEIGHTED_SUCCESS:
          results.push(...await this.executeWeightedSuccess());
          break;
        case PartialSuccessStrategy.PROGRESSIVE_FALLBACK:
          results.push(...await this.executeProgressiveFallback());
          break;
      }
    } catch (error) {
      this.emit('executionFailed', { error, duration: Date.now() - startTime });
      throw error;
    }

    const finalResult = this.buildFinalResult(results, Date.now() - startTime);
    
    this.emit('executionCompleted', finalResult);
    return finalResult;
  }

  /**
   * Execute single operation with retries and fallback
   */
  async executeSingleOperation(operation: PartialOperation<T>): Promise<OperationResult<T>> {
    const result: OperationResult<T> = {
      id: operation.id,
      name: operation.name,
      status: OperationStatus.PENDING,
      duration: 0,
      attempts: 0,
      startTime: new Date(),
      usedFallback: false
    };

    // Check dependencies
    if (!this.areDependenciesMet(operation)) {
      result.status = OperationStatus.SKIPPED;
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      return result;
    }

    // Acquire semaphore for concurrency control
    await this.semaphore.acquire();

    try {
      // Try main operation with retries
      for (let attempt = 1; attempt <= operation.maxRetries + 1; attempt++) {
        result.attempts = attempt;
        
        try {
          result.result = await this.executeWithTimeout(
            operation.operation,
            operation.timeout
          );
          result.status = OperationStatus.SUCCESS;
          break;
        } catch (error) {
          result.error = error as Error;
          
          if (attempt <= operation.maxRetries) {
            this.emit('operationRetry', {
              operationId: operation.id,
              attempt,
              error: result.error
            });
            
            await this.sleep(operation.retryDelay);
          }
        }
      }
      
      // Try fallback if main operation failed
      if (result.status !== OperationStatus.SUCCESS && operation.fallback) {
        try {
          result.result = await this.executeWithTimeout(
            operation.fallback,
            this.config.fallbackTimeout
          );
          result.status = OperationStatus.SUCCESS;
          result.usedFallback = true;
          
          this.emit('fallbackUsed', { operationId: operation.id });
        } catch (fallbackError) {
          result.error = fallbackError as Error;
        }
      }
      
      // Set final status if still not success
      if (result.status === OperationStatus.PENDING) {
        result.status = OperationStatus.FAILED;
      }
      
    } finally {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      this.semaphore.release();
      this.completedOperations.set(operation.id, result);
      
      this.emit('operationCompleted', result);
    }

    return result;
  }

  /**
   * All or nothing strategy - fail if any required operation fails
   */
  private async executeAllOrNothing(): Promise<OperationResult<T>[]> {
    const results: OperationResult<T>[] = [];
    
    for (const operationId of this.dependencyGraph.resolved) {
      const operation = this.operations.get(operationId)!;
      const result = await this.executeSingleOperation(operation);
      results.push(result);
      
      // Fail fast if required operation fails
      if (operation.required && result.status === OperationStatus.FAILED) {
        // Mark remaining operations as skipped
        const remaining = this.dependencyGraph.resolved.slice(
          this.dependencyGraph.resolved.indexOf(operationId) + 1
        );
        
        for (const remainingId of remaining) {
          const remainingOp = this.operations.get(remainingId)!;
          results.push({
            id: remainingOp.id,
            name: remainingOp.name,
            status: OperationStatus.SKIPPED,
            duration: 0,
            attempts: 0,
            startTime: new Date(),
            endTime: new Date(),
            usedFallback: false
          });
        }
        
        break;
      }
    }
    
    return results;
  }

  /**
   * Best effort strategy - execute all operations regardless of failures
   */
  private async executeBestEffort(): Promise<OperationResult<T>[]> {
    const promises: Promise<OperationResult<T>>[] = [];
    const results: OperationResult<T>[] = [];
    
    // Group operations by dependency level
    const levels = this.groupByDependencyLevel();
    
    for (const level of levels) {
      // Execute operations in current level concurrently
      for (const operationId of level) {
        const operation = this.operations.get(operationId)!;
        promises.push(this.executeSingleOperation(operation));
      }
      
      // Wait for current level to complete before moving to next
      const levelResults = await Promise.all(promises);
      results.push(...levelResults);
      promises.length = 0; // Clear promises array
    }
    
    return results;
  }

  /**
   * Threshold-based strategy - succeed if enough operations succeed
   */
  private async executeThresholdBased(): Promise<OperationResult<T>[]> {
    const results: OperationResult<T>[] = [];
    const totalOperations = this.operations.size;
    let successCount = 0;
    let failureCount = 0;
    
    for (const operationId of this.dependencyGraph.resolved) {
      const operation = this.operations.get(operationId)!;
      const result = await this.executeSingleOperation(operation);
      results.push(result);
      
      if (result.status === OperationStatus.SUCCESS) {
        successCount++;
      } else if (result.status === OperationStatus.FAILED) {
        failureCount++;
      }
      
      const currentSuccessRate = successCount / (successCount + failureCount);
      const remainingOperations = totalOperations - results.length;
      const maxPossibleSuccessRate = (successCount + remainingOperations) / totalOperations;
      
      // Early termination if threshold impossible to reach
      if (this.config.enableEarlyTermination && 
          maxPossibleSuccessRate < this.config.successThreshold) {
        
        // Mark remaining as skipped
        const remaining = this.dependencyGraph.resolved.slice(
          this.dependencyGraph.resolved.indexOf(operationId) + 1
        );
        
        for (const remainingId of remaining) {
          const remainingOp = this.operations.get(remainingId)!;
          results.push({
            id: remainingOp.id,
            name: remainingOp.name,
            status: OperationStatus.SKIPPED,
            duration: 0,
            attempts: 0,
            startTime: new Date(),
            endTime: new Date(),
            usedFallback: false
          });
        }
        
        break;
      }
    }
    
    return results;
  }

  /**
   * Weighted success strategy - operations have different importance weights
   */
  private async executeWeightedSuccess(): Promise<OperationResult<T>[]> {
    const results: OperationResult<T>[] = [];
    let totalWeight = 0;
    let successWeight = 0;
    
    // Calculate total weight
    for (const operation of this.operations.values()) {
      totalWeight += operation.weight;
    }
    
    for (const operationId of this.dependencyGraph.resolved) {
      const operation = this.operations.get(operationId)!;
      const result = await this.executeSingleOperation(operation);
      results.push(result);
      
      if (result.status === OperationStatus.SUCCESS) {
        successWeight += operation.weight;
      }
      
      const currentWeightedSuccess = successWeight / totalWeight;
      const remainingWeight = Array.from(this.operations.values())
        .filter(op => !this.completedOperations.has(op.id))
        .reduce((sum, op) => sum + op.weight, 0);
      
      const maxPossibleWeightedSuccess = (successWeight + remainingWeight) / totalWeight;
      
      // Early termination if weighted threshold impossible to reach
      if (this.config.enableEarlyTermination && 
          maxPossibleWeightedSuccess < this.config.weightedThreshold) {
        
        // Mark remaining as skipped
        const remaining = this.dependencyGraph.resolved.slice(
          this.dependencyGraph.resolved.indexOf(operationId) + 1
        );
        
        for (const remainingId of remaining) {
          const remainingOp = this.operations.get(remainingId)!;
          results.push({
            id: remainingOp.id,
            name: remainingOp.name,
            status: OperationStatus.SKIPPED,
            duration: 0,
            attempts: 0,
            startTime: new Date(),
            endTime: new Date(),
            usedFallback: false
          });
        }
        
        break;
      }
    }
    
    return results;
  }

  /**
   * Progressive fallback strategy - try simpler versions on failure
   */
  private async executeProgressiveFallback(): Promise<OperationResult<T>[]> {
    const results: OperationResult<T>[] = [];
    
    // Execute operations with progressive timeouts
    for (let i = 0; i < this.dependencyGraph.resolved.length; i++) {
      const operationId = this.dependencyGraph.resolved[i];
      const operation = this.operations.get(operationId)!;
      
      // Increase timeout for later operations if enabled
      if (this.config.enableProgressiveTimeout) {
        operation.timeout = operation.timeout * (1 + (i * 0.1)); // 10% increase per operation
      }
      
      const result = await this.executeSingleOperation(operation);
      results.push(result);
      
      // If operation failed and it's required, try to adapt remaining operations
      if (operation.required && result.status === OperationStatus.FAILED) {
        this.adaptRemainingOperations(i);
      }
    }
    
    return results;
  }

  /**
   * Adapt remaining operations after a failure
   */
  private adaptRemainingOperations(failedIndex: number): void {
    const remaining = this.dependencyGraph.resolved.slice(failedIndex + 1);
    
    for (const operationId of remaining) {
      const operation = this.operations.get(operationId)!;
      
      // Increase timeouts
      operation.timeout *= 1.5;
      
      // Reduce weight for non-critical operations
      if (!operation.required) {
        operation.weight *= 0.8;
      }
      
      // Increase retry attempts
      operation.maxRetries = Math.min(operation.maxRetries + 1, 5);
    }
    
    this.emit('operationsAdapted', { 
      remainingOperations: remaining.length,
      adaptations: 'increased timeouts and retries'
    });
  }

  /**
   * Check if operation dependencies are met
   */
  private areDependenciesMet(operation: PartialOperation<T>): boolean {
    return operation.dependencies.every(depId => {
      const depResult = this.completedOperations.get(depId);
      return depResult && depResult.status === OperationStatus.SUCCESS;
    });
  }

  /**
   * Group operations by dependency level for parallel execution
   */
  private groupByDependencyLevel(): string[][] {
    const levels: string[][] = [];
    const processed = new Set<string>();
    
    while (processed.size < this.operations.size) {
      const currentLevel: string[] = [];
      
      for (const operationId of this.dependencyGraph.resolved) {
        if (processed.has(operationId)) continue;
        
        const operation = this.operations.get(operationId)!;
        const depsProcessed = operation.dependencies.every(dep => processed.has(dep));
        
        if (depsProcessed) {
          currentLevel.push(operationId);
          processed.add(operationId);
        }
      }
      
      if (currentLevel.length > 0) {
        levels.push(currentLevel);
      } else {
        // Circular dependency or other issue
        break;
      }
    }
    
    return levels;
  }

  /**
   * Resolve dependency order using topological sort
   */
  private resolveDependencies(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const resolved: string[] = [];
    
    const visit = (nodeId: string): void => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error(`Circular dependency detected involving ${nodeId}`);
      }
      
      visiting.add(nodeId);
      
      const dependencies = this.dependencyGraph.edges.get(nodeId) || [];
      for (const depId of dependencies) {
        visit(depId);
      }
      
      visiting.delete(nodeId);
      visited.add(nodeId);
      resolved.push(nodeId);
    };
    
    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    
    this.dependencyGraph.resolved = resolved;
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<R>(
    operation: () => Promise<R>,
    timeoutMs: number
  ): Promise<R> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([operation(), timeoutPromise]);
  }

  /**
   * Build final result from operation results
   */
  private buildFinalResult(
    results: OperationResult<T>[],
    totalDuration: number
  ): PartialSuccessResult<T> {
    const successful = results.filter(r => r.status === OperationStatus.SUCCESS);
    const failed = results.filter(r => r.status === OperationStatus.FAILED);
    const skipped = results.filter(r => r.status === OperationStatus.SKIPPED);
    
    const totalOps = results.length;
    const successRate = totalOps > 0 ? successful.length / totalOps : 0;
    
    // Calculate weighted success rate
    const totalWeight = Array.from(this.operations.values())
      .reduce((sum, op) => sum + op.weight, 0);
    const successWeight = successful.reduce((sum, result) => {
      const operation = this.operations.get(result.id)!;
      return sum + operation.weight;
    }, 0);
    const weightedSuccessRate = totalWeight > 0 ? successWeight / totalWeight : 0;
    
    // Determine overall status
    let overall: OperationStatus;
    const requiredFailed = failed.filter(r => this.operations.get(r.id)!.required);
    
    if (requiredFailed.length > 0) {
      overall = OperationStatus.FAILED;
    } else if (successRate >= this.config.successThreshold && 
               weightedSuccessRate >= this.config.weightedThreshold) {
      overall = OperationStatus.SUCCESS;
    } else if (successful.length > 0) {
      overall = OperationStatus.PARTIAL;
    } else {
      overall = OperationStatus.FAILED;
    }
    
    return {
      overall,
      successRate,
      weightedSuccessRate,
      operations: results,
      successful,
      failed,
      skipped,
      totalDuration,
      metadata: {
        thresholdMet: successRate >= this.config.successThreshold,
        requiredOperationsFailed: requiredFailed.map(r => r.id),
        criticalPath: this.findCriticalPath(results),
        fallbacksUsed: results.filter(r => r.usedFallback).length
      }
    };
  }

  /**
   * Find critical path in operation execution
   */
  private findCriticalPath(results: OperationResult<T>[]): string[] {
    // Simple implementation - longest duration path
    // In a real implementation, this would consider dependencies
    return results
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map(r => r.id);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Semaphore for controlling concurrency
 */
class Semaphore {
  private permits: number;
  private waiting: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise<void>(resolve => {
      this.waiting.push(resolve);
    });
  }

  release(): void {
    if (this.waiting.length > 0) {
      const resolve = this.waiting.shift()!;
      resolve();
    } else {
      this.permits++;
    }
  }
}

/**
 * Partial success builder for easier configuration
 */
export class PartialSuccessBuilder<T = any> {
  private operations: PartialOperation<T>[] = [];
  private config: Partial<PartialSuccessConfig> = {
    strategy: PartialSuccessStrategy.BEST_EFFORT,
    successThreshold: 0.5,
    weightedThreshold: 0.5,
    maxConcurrency: 10,
    overallTimeout: 30000,
    continueOnFailure: true,
    enableEarlyTermination: false,
    enableProgressiveTimeout: false,
    fallbackTimeout: 5000
  };

  addOperation(operation: Partial<PartialOperation<T>>): PartialSuccessBuilder<T> {
    const fullOperation: PartialOperation<T> = {
      id: operation.id || `op_${Date.now()}_${Math.random()}`,
      name: operation.name || 'Unnamed Operation',
      operation: operation.operation!,
      weight: operation.weight || 1,
      required: operation.required || false,
      timeout: operation.timeout || 5000,
      fallback: operation.fallback,
      dependencies: operation.dependencies || [],
      maxRetries: operation.maxRetries || 2,
      retryDelay: operation.retryDelay || 1000
    };

    this.operations.push(fullOperation);
    return this;
  }

  strategy(strategy: PartialSuccessStrategy): PartialSuccessBuilder<T> {
    this.config.strategy = strategy;
    return this;
  }

  successThreshold(threshold: number): PartialSuccessBuilder<T> {
    this.config.successThreshold = threshold;
    return this;
  }

  weightedThreshold(threshold: number): PartialSuccessBuilder<T> {
    this.config.weightedThreshold = threshold;
    return this;
  }

  maxConcurrency(concurrency: number): PartialSuccessBuilder<T> {
    this.config.maxConcurrency = concurrency;
    return this;
  }

  overallTimeout(timeout: number): PartialSuccessBuilder<T> {
    this.config.overallTimeout = timeout;
    return this;
  }

  build(): PartialSuccessHandler<T> {
    const handler = new PartialSuccessHandler<T>(this.config as PartialSuccessConfig);
    
    for (const operation of this.operations) {
      handler.addOperation(operation);
    }
    
    return handler;
  }
}