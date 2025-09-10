/**
 * Test Utilities for Integration Testing - OSSA v0.1.8
 * 
 * Utility functions and helpers for comprehensive integration testing:
 * - Performance measurement and validation utilities
 * - Test data generation and manipulation
 * - Mock service interaction helpers
 * - Assertion and validation helpers
 * - Test scenario orchestration utilities
 */

import axios from 'axios';
import { performance } from 'perf_hooks';
import { setTimeout as delay } from 'timers/promises';

// Performance measurement utilities
export class PerformanceTracker {
  private measurements = new Map<string, number[]>();
  private startTimes = new Map<string, number>();

  public start(key: string): void {
    this.startTimes.set(key, performance.now());
  }

  public end(key: string): number {
    const startTime = this.startTimes.get(key);
    if (!startTime) {
      throw new Error(`No start time recorded for key: ${key}`);
    }

    const duration = performance.now() - startTime;
    
    if (!this.measurements.has(key)) {
      this.measurements.set(key, []);
    }
    
    this.measurements.get(key)!.push(duration);
    this.startTimes.delete(key);
    
    return duration;
  }

  public getStats(key: string): { avg: number; min: number; max: number; count: number; std: number } | null {
    const measurements = this.measurements.get(key);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const count = measurements.length;
    
    // Calculate standard deviation
    const squaredDiffs = measurements.map(val => Math.pow(val - avg, 2));
    const std = Math.sqrt(squaredDiffs.reduce((sum, val) => sum + val, 0) / measurements.length);

    return { avg, min, max, count, std };
  }

  public getAllStats(): { [key: string]: { avg: number; min: number; max: number; count: number; std: number } } {
    const allStats: { [key: string]: any } = {};
    
    for (const [key, _] of this.measurements) {
      const stats = this.getStats(key);
      if (stats) {
        allStats[key] = stats;
      }
    }
    
    return allStats;
  }

  public reset(): void {
    this.measurements.clear();
    this.startTimes.clear();
  }
}

// Test data generation utilities
export class TestDataGenerator {
  public static generateComplexQuery(complexity: 'low' | 'medium' | 'high' | 'extreme'): {
    text: string;
    expectedTokens: number;
    expectedComplexity: string;
  } {
    const queries = {
      low: {
        text: 'What is the current status of the system?',
        expectedTokens: 15,
        expectedComplexity: 'low'
      },
      medium: {
        text: 'Analyze the performance trends and provide recommendations for optimization based on current metrics and historical data patterns.',
        expectedTokens: 45,
        expectedComplexity: 'medium'
      },
      high: {
        text: 'Conduct comprehensive multi-dimensional analysis of system performance, user behavior patterns, resource utilization trends, and predictive modeling for capacity planning with consideration of seasonal variations and growth projections.',
        expectedTokens: 120,
        expectedComplexity: 'high'
      },
      extreme: {
        text: 'Design and implement comprehensive autonomous multi-agent orchestration system with advanced reasoning capabilities, real-time adaptation, cross-domain knowledge integration, ethical constraint satisfaction, regulatory compliance validation, and multi-modal interaction support for complex enterprise environments with heterogeneous infrastructure and diverse stakeholder requirements.',
        expectedTokens: 250,
        expectedComplexity: 'extreme'
      }
    };

    return queries[complexity];
  }

  public static generateTokenizedText(tokenCount: number, tokenTypes: string[] = ['CONTEXT', 'DATA', 'STATE', 'METRICS', 'TEMPORAL']): string {
    const tokens = [];
    
    for (let i = 0; i < tokenCount; i++) {
      const type = tokenTypes[Math.floor(Math.random() * tokenTypes.length)];
      const namespace = ['test', 'system', 'workflow', 'agent'][Math.floor(Math.random() * 4)];
      const scope = ['current', 'active', 'historical', 'predicted'][Math.floor(Math.random() * 4)];
      const identifier = `item-${i}`;
      
      tokens.push(`{${type}:${namespace}:${scope}:${identifier}}`);
    }

    const baseText = 'Processing system analysis with ';
    return baseText + tokens.join(' and ') + ' for comprehensive evaluation.';
  }

  public static generatePerformanceSequence(
    baseline: number,
    targetImprovement: number,
    iterations: number,
    pattern: 'linear' | 'exponential' | 'logarithmic' | 'stepped' = 'exponential'
  ): number[] {
    const sequence: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const progress = i / (iterations - 1);
      let improvement: number;
      
      switch (pattern) {
        case 'linear':
          improvement = targetImprovement * progress;
          break;
        case 'exponential':
          improvement = targetImprovement * (1 - Math.exp(-3 * progress));
          break;
        case 'logarithmic':
          improvement = targetImprovement * Math.log(1 + progress) / Math.log(2);
          break;
        case 'stepped':
          improvement = targetImprovement * Math.floor(progress * 4) / 4;
          break;
        default:
          improvement = targetImprovement * progress;
      }
      
      // Add some realistic noise
      const noise = (Math.random() - 0.5) * 0.05; // ±2.5% noise
      const currentValue = baseline * (1 - improvement + noise);
      
      sequence.push(Math.max(currentValue, baseline * 0.1)); // Prevent negative or too-low values
    }
    
    return sequence;
  }

  public static generateWorkloadPattern(
    duration: number,
    peakRPS: number,
    pattern: 'constant' | 'ramp-up' | 'spike' | 'sine-wave' | 'random'
  ): Array<{ timestamp: number; rps: number }> {
    const points = Math.ceil(duration / 1000); // One point per second
    const workload: Array<{ timestamp: number; rps: number }> = [];
    
    for (let i = 0; i < points; i++) {
      const progress = i / (points - 1);
      const timestamp = i * 1000;
      let rps: number;
      
      switch (pattern) {
        case 'constant':
          rps = peakRPS;
          break;
        case 'ramp-up':
          rps = Math.floor(peakRPS * progress);
          break;
        case 'spike':
          const spikePoint = Math.floor(points * 0.6);
          rps = Math.abs(i - spikePoint) <= 2 ? peakRPS : Math.floor(peakRPS * 0.3);
          break;
        case 'sine-wave':
          rps = Math.floor(peakRPS * (0.5 + 0.5 * Math.sin(progress * 2 * Math.PI)));
          break;
        case 'random':
          rps = Math.floor(peakRPS * (0.3 + Math.random() * 0.7));
          break;
        default:
          rps = peakRPS;
      }
      
      workload.push({ timestamp, rps: Math.max(rps, 1) });
    }
    
    return workload;
  }
}

// HTTP client utilities for testing
export class TestHttpClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string = 'http://localhost:4000', timeout: number = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  public async get(path: string, config?: any): Promise<any> {
    const response = await axios.get(`${this.baseURL}${path}`, {
      timeout: this.timeout,
      ...config
    });
    return response;
  }

  public async post(path: string, data?: any, config?: any): Promise<any> {
    const response = await axios.post(`${this.baseURL}${path}`, data, {
      timeout: this.timeout,
      ...config
    });
    return response;
  }

  public async delete(path: string, config?: any): Promise<any> {
    const response = await axios.delete(`${this.baseURL}${path}`, {
      timeout: this.timeout,
      ...config
    });
    return response;
  }

  public async put(path: string, data?: any, config?: any): Promise<any> {
    const response = await axios.put(`${this.baseURL}${path}`, data, {
      timeout: this.timeout,
      ...config
    });
    return response;
  }

  public async waitForHealth(maxAttempts: number = 10, delayMs: number = 1000): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await this.get('/health');
        if (response.status === 200) {
          return true;
        }
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          console.warn(`Health check failed after ${maxAttempts} attempts`);
          return false;
        }
        await delay(delayMs);
      }
    }
    return false;
  }
}

// Validation and assertion utilities
export class ValidationUtils {
  public static validatePerformanceMetrics(
    actual: { [key: string]: number },
    expected: { [key: string]: number },
    tolerances: { [key: string]: number } = {}
  ): { valid: boolean; failures: Array<{ metric: string; actual: number; expected: number; tolerance: number }> } {
    const failures: Array<{ metric: string; actual: number; expected: number; tolerance: number }> = [];
    
    for (const [metric, expectedValue] of Object.entries(expected)) {
      const actualValue = actual[metric];
      const tolerance = tolerances[metric] || 0.1; // Default 10% tolerance
      
      if (actualValue === undefined) {
        failures.push({ metric, actual: -1, expected: expectedValue, tolerance });
        continue;
      }
      
      const difference = Math.abs(actualValue - expectedValue);
      const maxDifference = expectedValue * tolerance;
      
      if (difference > maxDifference) {
        failures.push({ metric, actual: actualValue, expected: expectedValue, tolerance });
      }
    }
    
    return { valid: failures.length === 0, failures };
  }

  public static validateTrendImprovement(
    values: number[],
    expectedImprovement: number,
    tolerance: number = 0.1
  ): { valid: boolean; actualImprovement: number; expectedImprovement: number } {
    if (values.length < 2) {
      return { valid: false, actualImprovement: 0, expectedImprovement };
    }
    
    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const actualImprovement = (firstValue - lastValue) / firstValue;
    
    const difference = Math.abs(actualImprovement - expectedImprovement);
    const maxDifference = expectedImprovement * tolerance;
    
    return {
      valid: difference <= maxDifference,
      actualImprovement,
      expectedImprovement
    };
  }

  public static validateLatencyDistribution(
    latencies: number[],
    expectedP50: number,
    expectedP95: number,
    expectedP99: number,
    tolerance: number = 0.2
  ): { valid: boolean; actualP50: number; actualP95: number; actualP99: number } {
    const sortedLatencies = [...latencies].sort((a, b) => a - b);
    const count = sortedLatencies.length;
    
    const actualP50 = sortedLatencies[Math.floor(count * 0.5)];
    const actualP95 = sortedLatencies[Math.floor(count * 0.95)];
    const actualP99 = sortedLatencies[Math.floor(count * 0.99)];
    
    const p50Valid = Math.abs(actualP50 - expectedP50) <= expectedP50 * tolerance;
    const p95Valid = Math.abs(actualP95 - expectedP95) <= expectedP95 * tolerance;
    const p99Valid = Math.abs(actualP99 - expectedP99) <= expectedP99 * tolerance;
    
    return {
      valid: p50Valid && p95Valid && p99Valid,
      actualP50,
      actualP95,
      actualP99
    };
  }

  public static validateCacheHitRateProgression(
    hitRates: number[],
    expectedFinalRate: number,
    tolerance: number = 0.05
  ): { valid: boolean; progression: 'improving' | 'stable' | 'degrading' } {
    if (hitRates.length < 3) {
      return { valid: false, progression: 'stable' };
    }
    
    const finalRate = hitRates[hitRates.length - 1];
    const rateValid = Math.abs(finalRate - expectedFinalRate) <= tolerance;
    
    // Check progression trend
    const firstHalf = hitRates.slice(0, Math.floor(hitRates.length / 2));
    const secondHalf = hitRates.slice(Math.floor(hitRates.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, rate) => sum + rate, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, rate) => sum + rate, 0) / secondHalf.length;
    
    let progression: 'improving' | 'stable' | 'degrading';
    if (secondHalfAvg > firstHalfAvg + 0.02) {
      progression = 'improving';
    } else if (secondHalfAvg < firstHalfAvg - 0.02) {
      progression = 'degrading';
    } else {
      progression = 'stable';
    }
    
    return { valid: rateValid, progression };
  }
}

// Test scenario orchestration
export class TestScenarioOrchestrator {
  private scenarios: Map<string, any> = new Map();
  private results: Map<string, any> = new Map();
  private performanceTracker = new PerformanceTracker();

  public registerScenario(name: string, scenario: any): void {
    this.scenarios.set(name, scenario);
  }

  public async runScenario(name: string, config?: any): Promise<any> {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(`Scenario '${name}' not found`);
    }

    console.log(`🎬 Running scenario: ${name}`);
    this.performanceTracker.start(name);

    try {
      const result = await scenario.execute(config);
      const duration = this.performanceTracker.end(name);
      
      const scenarioResult = {
        name,
        success: true,
        duration,
        result,
        timestamp: new Date()
      };
      
      this.results.set(name, scenarioResult);
      console.log(`✅ Scenario '${name}' completed in ${duration.toFixed(0)}ms`);
      
      return scenarioResult;
    } catch (error) {
      const duration = this.performanceTracker.end(name);
      
      const scenarioResult = {
        name,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
      
      this.results.set(name, scenarioResult);
      console.error(`❌ Scenario '${name}' failed after ${duration.toFixed(0)}ms:`, error);
      
      throw error;
    }
  }

  public async runScenariosInParallel(names: string[], config?: any): Promise<any[]> {
    console.log(`🎬 Running ${names.length} scenarios in parallel: ${names.join(', ')}`);
    
    const promises = names.map(name => this.runScenario(name, config));
    
    try {
      const results = await Promise.all(promises);
      console.log(`✅ All parallel scenarios completed successfully`);
      return results;
    } catch (error) {
      console.error(`❌ One or more parallel scenarios failed:`, error);
      throw error;
    }
  }

  public async runScenariosSequentially(names: string[], config?: any): Promise<any[]> {
    console.log(`🎬 Running ${names.length} scenarios sequentially: ${names.join(', ')}`);
    
    const results: any[] = [];
    
    for (const name of names) {
      try {
        const result = await this.runScenario(name, config);
        results.push(result);
      } catch (error) {
        console.error(`❌ Sequential scenario '${name}' failed, stopping execution`);
        throw error;
      }
    }
    
    console.log(`✅ All sequential scenarios completed successfully`);
    return results;
  }

  public getResults(): { [scenarioName: string]: any } {
    const allResults: { [scenarioName: string]: any } = {};
    
    for (const [name, result] of this.results) {
      allResults[name] = result;
    }
    
    return allResults;
  }

  public getPerformanceStats(): { [scenarioName: string]: any } {
    return this.performanceTracker.getAllStats();
  }

  public generateReport(): {
    summary: { total: number; successful: number; failed: number; totalDuration: number };
    scenarios: any[];
    performance: any;
  } {
    const scenarios = Array.from(this.results.values());
    const successful = scenarios.filter(s => s.success).length;
    const failed = scenarios.filter(s => !s.success).length;
    const totalDuration = scenarios.reduce((sum, s) => sum + s.duration, 0);
    
    return {
      summary: {
        total: scenarios.length,
        successful,
        failed,
        totalDuration
      },
      scenarios,
      performance: this.getPerformanceStats()
    };
  }

  public reset(): void {
    this.scenarios.clear();
    this.results.clear();
    this.performanceTracker.reset();
  }
}

// Utility for waiting and retrying operations
export class WaitUtils {
  public static async waitFor(
    condition: () => Promise<boolean> | boolean,
    options: {
      timeout?: number;
      interval?: number;
      timeoutMessage?: string;
    } = {}
  ): Promise<void> {
    const {
      timeout = 30000,
      interval = 1000,
      timeoutMessage = 'Condition not met within timeout'
    } = options;

    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const result = await condition();
        if (result) {
          return;
        }
      } catch (error) {
        // Continue waiting on errors
      }

      await delay(interval);
    }

    throw new Error(timeoutMessage);
  }

  public static async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoffMultiplier?: number;
      maxDelay?: number;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay: initialDelay = 1000,
      backoffMultiplier = 2,
      maxDelay = 10000
    } = options;

    let lastError: Error | undefined;
    let currentDelay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          break;
        }

        console.warn(`Attempt ${attempt} failed, retrying in ${currentDelay}ms:`, lastError.message);
        await delay(currentDelay);
        
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError || new Error('Max attempts reached');
  }
}

// Export all utilities as a combined object
export const TestUtils = {
  PerformanceTracker,
  TestDataGenerator,
  TestHttpClient,
  ValidationUtils,
  TestScenarioOrchestrator,
  WaitUtils
};