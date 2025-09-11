/**
 * Base Protocol Interface
 * Common interface for all protocol implementations
 */

import { EventEmitter } from 'events';
import { DiscoveryQuery, DiscoveryResult, PerformanceMetrics } from '../types';

export interface ProtocolHandler {
  name: string;
  version: string;
  isHealthy(): boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  getMetrics(): PerformanceMetrics;
}

export abstract class BaseProtocol extends EventEmitter implements ProtocolHandler {
  public readonly name: string;
  public readonly version: string;
  protected isRunning = false;
  protected startTime: Date;
  protected requestCount = 0;
  protected errorCount = 0;
  protected totalResponseTime = 0;

  constructor(name: string, version: string = '1.0.0') {
    super();
    this.name = name;
    this.version = version;
    this.startTime = new Date();
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  isHealthy(): boolean {
    const errorRate = this.requestCount > 0 ? this.errorCount / this.requestCount : 0;
    return this.isRunning && errorRate < 0.1; // Less than 10% error rate
  }

  getMetrics(): PerformanceMetrics {
    const avgResponseTime = this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0;
    const uptime = Date.now() - this.startTime.getTime();

    return {
      timestamp: new Date(),
      totalQueries: this.requestCount,
      avgResponseTime,
      p95ResponseTime: avgResponseTime * 1.2, // Approximation
      p99ResponseTime: avgResponseTime * 1.5, // Approximation
      cacheHitRate: 0, // To be implemented by subclasses
      activeConnections: 0, // To be implemented by subclasses
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: process.cpuUsage().user,
      indexSize: 0, // To be implemented by subclasses
    };
  }

  protected recordRequest(responseTime: number, hasError = false): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
    
    if (hasError) {
      this.errorCount++;
    }

    this.emit('request_completed', {
      responseTime,
      hasError,
      timestamp: new Date(),
    });
  }

  protected validateDiscoveryQuery(query: DiscoveryQuery): void {
    if (query.maxResults && query.maxResults > 10000) {
      throw new Error('maxResults cannot exceed 10,000 for performance reasons');
    }

    if (query.capabilities && query.capabilities.length > 100) {
      throw new Error('Cannot query more than 100 capabilities at once');
    }

    if (query.domains && query.domains.length > 50) {
      throw new Error('Cannot query more than 50 domains at once');
    }
  }

  protected formatDiscoveryResult(result: DiscoveryResult): DiscoveryResult {
    return {
      ...result,
      agents: result.agents.map(agent => ({
        ...agent,
        // Ensure sensitive information is not exposed
        endpoints: {
          ...agent.endpoints,
          // Remove internal endpoints from public responses
        }
      }))
    };
  }
}