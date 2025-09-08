/**
 * Connection Pool Manager
 * High-performance HTTP connection pooling for agent communication
 */

import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';
import { EventEmitter } from 'events';

export interface ConnectionPoolConfig {
  maxSockets: number;
  maxFreeSockets: number;
  timeout: number;
  keepAlive: boolean;
  keepAliveMsecs: number;
  maxSockets6?: number;
  maxFreeSockets6?: number;
  scheduling?: 'fifo' | 'lifo';
}

export interface PoolStatistics {
  totalConnections: number;
  activeConnections: number;
  freeConnections: number;
  queuedRequests: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  connectionReuse: number;
  timeouts: number;
}

export interface ConnectionMetrics {
  host: string;
  port: number;
  protocol: 'http' | 'https';
  connections: number;
  requests: number;
  failures: number;
  avgResponseTime: number;
  lastUsed: Date;
}

export class ConnectionPoolManager extends EventEmitter {
  private httpAgent: HttpAgent;
  private httpsAgent: HttpsAgent;
  private config: ConnectionPoolConfig;
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;
  
  // Statistics tracking
  private stats: PoolStatistics = {
    totalConnections: 0,
    activeConnections: 0,
    freeConnections: 0,
    queuedRequests: 0,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    connectionReuse: 0,
    timeouts: 0,
  };

  // Per-host metrics
  private hostMetrics = new Map<string, ConnectionMetrics>();
  private requestTimes: number[] = [];

  constructor(config: Partial<ConnectionPoolConfig> = {}) {
    super();
    
    this.config = {
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 30000, // 30 seconds
      keepAlive: true,
      keepAliveMsecs: 1000,
      scheduling: 'lifo',
      ...config,
    };

    this.initializeAgents();
  }

  /**
   * Start the connection pool manager
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startMonitoring();
    
    console.log('🔗 Connection Pool Manager started');
    console.log(`   Max Sockets: ${this.config.maxSockets}`);
    console.log(`   Keep-Alive: ${this.config.keepAlive}`);
  }

  /**
   * Stop the connection pool manager
   */
  stop(): void {
    if (!this.isRunning) return;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Destroy all agents
    this.httpAgent.destroy();
    this.httpsAgent.destroy();

    this.isRunning = false;
    console.log('🔗 Connection Pool Manager stopped');
  }

  /**
   * Get HTTP agent for requests
   */
  getHttpAgent(): HttpAgent {
    return this.httpAgent;
  }

  /**
   * Get HTTPS agent for requests
   */
  getHttpsAgent(): HttpsAgent {
    return this.httpsAgent;
  }

  /**
   * Get agent for URL
   */
  getAgent(url: string): HttpAgent | HttpsAgent {
    return url.startsWith('https:') ? this.httpsAgent : this.httpAgent;
  }

  /**
   * Record request metrics
   */
  recordRequest(
    host: string, 
    port: number, 
    protocol: 'http' | 'https', 
    responseTime: number, 
    success: boolean
  ): void {
    const hostKey = `${protocol}://${host}:${port}`;
    
    // Update global stats
    this.stats.totalRequests++;
    this.requestTimes.push(responseTime);
    
    if (this.requestTimes.length > 1000) {
      this.requestTimes = this.requestTimes.slice(-500);
    }
    
    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update average response time
    const totalTime = this.stats.averageResponseTime * (this.stats.totalRequests - 1);
    this.stats.averageResponseTime = (totalTime + responseTime) / this.stats.totalRequests;

    // Update host metrics
    if (!this.hostMetrics.has(hostKey)) {
      this.hostMetrics.set(hostKey, {
        host,
        port,
        protocol,
        connections: 0,
        requests: 0,
        failures: 0,
        avgResponseTime: 0,
        lastUsed: new Date(),
      });
    }

    const hostMetric = this.hostMetrics.get(hostKey)!;
    hostMetric.requests++;
    hostMetric.lastUsed = new Date();
    
    if (!success) {
      hostMetric.failures++;
    }

    // Update host average response time
    const hostTotal = hostMetric.avgResponseTime * (hostMetric.requests - 1);
    hostMetric.avgResponseTime = (hostTotal + responseTime) / hostMetric.requests;
  }

  /**
   * Record timeout
   */
  recordTimeout(host: string, port: number, protocol: 'http' | 'https'): void {
    this.stats.timeouts++;
    this.recordRequest(host, port, protocol, this.config.timeout, false);
  }

  /**
   * Get connection statistics
   */
  getStatistics(): PoolStatistics {
    this.updateConnectionStats();
    return { ...this.stats };
  }

  /**
   * Get host-specific metrics
   */
  getHostMetrics(): Map<string, ConnectionMetrics> {
    return new Map(this.hostMetrics);
  }

  /**
   * Get pool health status
   */
  getHealthStatus(): {
    healthy: boolean;
    issues: string[];
    utilization: number;
    errorRate: number;
  } {
    const errorRate = this.stats.totalRequests > 0 
      ? this.stats.failedRequests / this.stats.totalRequests 
      : 0;
    
    const utilization = this.config.maxSockets > 0 
      ? this.stats.activeConnections / this.config.maxSockets 
      : 0;

    const issues: string[] = [];
    let healthy = true;

    if (errorRate > 0.1) {
      issues.push(`High error rate: ${(errorRate * 100).toFixed(1)}%`);
      healthy = false;
    }

    if (utilization > 0.9) {
      issues.push(`High connection utilization: ${(utilization * 100).toFixed(1)}%`);
      healthy = false;
    }

    if (this.stats.averageResponseTime > 5000) {
      issues.push(`Slow response time: ${this.stats.averageResponseTime.toFixed(0)}ms`);
      healthy = false;
    }

    if (this.stats.timeouts > this.stats.totalRequests * 0.05) {
      issues.push(`High timeout rate: ${this.stats.timeouts} timeouts`);
      healthy = false;
    }

    return { healthy, issues, utilization, errorRate };
  }

  /**
   * Optimize pool configuration based on usage patterns
   */
  optimizeConfiguration(): {
    recommendations: Array<{
      setting: string;
      current: any;
      recommended: any;
      reason: string;
    }>;
    applied: boolean;
  } {
    const recommendations = [];
    let applied = false;

    // Analyze connection usage patterns
    const avgActiveConnections = this.stats.activeConnections;
    const maxUtilization = this.config.maxSockets > 0 
      ? avgActiveConnections / this.config.maxSockets 
      : 0;

    // Recommend max sockets adjustment
    if (maxUtilization > 0.8) {
      const recommendedMaxSockets = Math.ceil(this.config.maxSockets * 1.5);
      recommendations.push({
        setting: 'maxSockets',
        current: this.config.maxSockets,
        recommended: recommendedMaxSockets,
        reason: `High utilization (${(maxUtilization * 100).toFixed(1)}%), increase pool size`,
      });
      
      // Auto-apply if reasonable
      if (recommendedMaxSockets <= 500) {
        this.config.maxSockets = recommendedMaxSockets;
        this.reconfigureAgents();
        applied = true;
      }
    }

    // Recommend free sockets adjustment
    const freeSocketRatio = this.stats.freeConnections / Math.max(1, this.stats.totalConnections);
    if (freeSocketRatio < 0.1 && this.stats.connectionReuse > 0.7) {
      const recommendedFreeSockets = Math.ceil(this.config.maxFreeSockets * 1.5);
      recommendations.push({
        setting: 'maxFreeSockets',
        current: this.config.maxFreeSockets,
        recommended: recommendedFreeSockets,
        reason: `Low free socket ratio (${(freeSocketRatio * 100).toFixed(1)}%), increase for better reuse`,
      });
      
      if (recommendedFreeSockets <= 50) {
        this.config.maxFreeSockets = recommendedFreeSockets;
        this.reconfigureAgents();
        applied = true;
      }
    }

    // Recommend timeout adjustment
    if (this.stats.timeouts > this.stats.totalRequests * 0.05) {
      const recommendedTimeout = Math.min(this.config.timeout * 1.5, 60000);
      recommendations.push({
        setting: 'timeout',
        current: this.config.timeout,
        recommended: recommendedTimeout,
        reason: `High timeout rate (${this.stats.timeouts} timeouts), increase timeout`,
      });
      
      this.config.timeout = recommendedTimeout;
      this.reconfigureAgents();
      applied = true;
    }

    if (applied) {
      this.emit('configuration_optimized', { recommendations });
    }

    return { recommendations, applied };
  }

  /**
   * Force cleanup of idle connections
   */
  cleanupIdleConnections(): void {
    // Force cleanup by destroying and recreating agents
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
    this.initializeAgents();
    
    this.emit('connections_cleaned');
  }

  /**
   * Get connection pool size recommendations
   */
  getPoolSizeRecommendations(): {
    current: { http: number; https: number };
    recommended: { http: number; https: number };
    reasoning: string;
  } {
    const httpMetrics = Array.from(this.hostMetrics.values())
      .filter(m => m.protocol === 'http');
    const httpsMetrics = Array.from(this.hostMetrics.values())
      .filter(m => m.protocol === 'https');

    const avgHttpHosts = httpMetrics.length;
    const avgHttpsHosts = httpsMetrics.length;
    
    // Recommend based on number of unique hosts and request patterns
    const httpRecommended = Math.max(10, Math.min(avgHttpHosts * 3, 100));
    const httpsRecommended = Math.max(20, Math.min(avgHttpsHosts * 3, 200));

    let reasoning = 'Based on host diversity and request patterns';
    if (this.stats.connectionReuse > 0.8) {
      reasoning += '. High reuse rate suggests current pool is efficient';
    }
    if (this.stats.queuedRequests > 0) {
      reasoning += '. Queued requests suggest pool may be undersized';
    }

    return {
      current: { 
        http: this.config.maxSockets, 
        https: this.config.maxSockets 
      },
      recommended: { 
        http: httpRecommended, 
        https: httpsRecommended 
      },
      reasoning,
    };
  }

  // Private methods

  private initializeAgents(): void {
    this.httpAgent = new HttpAgent({
      keepAlive: this.config.keepAlive,
      keepAliveMsecs: this.config.keepAliveMsecs,
      maxSockets: this.config.maxSockets,
      maxFreeSockets: this.config.maxFreeSockets,
      timeout: this.config.timeout,
      scheduling: this.config.scheduling,
    });

    this.httpsAgent = new HttpsAgent({
      keepAlive: this.config.keepAlive,
      keepAliveMsecs: this.config.keepAliveMsecs,
      maxSockets: this.config.maxSockets,
      maxFreeSockets: this.config.maxFreeSockets,
      timeout: this.config.timeout,
      scheduling: this.config.scheduling,
      rejectUnauthorized: false, // Allow self-signed certificates for development
    });

    this.setupAgentEventListeners();
  }

  private setupAgentEventListeners(): void {
    // HTTP Agent events
    this.httpAgent.on('free', (socket, options) => {
      this.stats.freeConnections++;
      this.stats.connectionReuse++;
      this.emit('connection_freed', { protocol: 'http', host: options.host, port: options.port });
    });

    this.httpAgent.on('connect', (res, socket, head) => {
      this.stats.totalConnections++;
      this.stats.activeConnections++;
    });

    // HTTPS Agent events
    this.httpsAgent.on('free', (socket, options) => {
      this.stats.freeConnections++;
      this.stats.connectionReuse++;
      this.emit('connection_freed', { protocol: 'https', host: options.host, port: options.port });
    });

    this.httpsAgent.on('connect', (res, socket, head) => {
      this.stats.totalConnections++;
      this.stats.activeConnections++;
    });
  }

  private reconfigureAgents(): void {
    // Destroy existing agents
    this.httpAgent.destroy();
    this.httpsAgent.destroy();
    
    // Create new agents with updated config
    this.initializeAgents();
    
    console.log(`🔗 Connection pool reconfigured: ${this.config.maxSockets} max sockets`);
  }

  private updateConnectionStats(): void {
    // Get current socket counts from agents
    const httpSockets = (this.httpAgent as any).sockets || {};
    const httpFreeSockets = (this.httpAgent as any).freeSockets || {};
    const httpRequests = (this.httpAgent as any).requests || {};

    const httpsSocketsObj = (this.httpsAgent as any).sockets || {};
    const httpsFreeSocketsObj = (this.httpsAgent as any).freeSockets || {};
    const httpsRequestsObj = (this.httpsAgent as any).requests || {};

    // Count active connections
    let activeConnections = 0;
    let freeConnections = 0;
    let queuedRequests = 0;

    // Count HTTP connections
    for (const hostPort in httpSockets) {
      const sockets = httpSockets[hostPort];
      if (Array.isArray(sockets)) {
        activeConnections += sockets.length;
      }
    }

    for (const hostPort in httpFreeSockets) {
      const sockets = httpFreeSockets[hostPort];
      if (Array.isArray(sockets)) {
        freeConnections += sockets.length;
      }
    }

    for (const hostPort in httpRequests) {
      const requests = httpRequests[hostPort];
      if (Array.isArray(requests)) {
        queuedRequests += requests.length;
      }
    }

    // Count HTTPS connections
    for (const hostPort in httpsSocketsObj) {
      const sockets = httpsSocketsObj[hostPort];
      if (Array.isArray(sockets)) {
        activeConnections += sockets.length;
      }
    }

    for (const hostPort in httpsFreeSocketsObj) {
      const sockets = httpsFreeSocketsObj[hostPort];
      if (Array.isArray(sockets)) {
        freeConnections += sockets.length;
      }
    }

    for (const hostPort in httpsRequestsObj) {
      const requests = httpsRequestsObj[hostPort];
      if (Array.isArray(requests)) {
        queuedRequests += requests.length;
      }
    }

    this.stats.activeConnections = activeConnections;
    this.stats.freeConnections = freeConnections;
    this.stats.queuedRequests = queuedRequests;
  }

  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.updateConnectionStats();
      this.cleanupStaleMetrics();
      this.emitMetrics();
    }, 30000); // Every 30 seconds
  }

  private cleanupStaleMetrics(): void {
    const staleThreshold = 300000; // 5 minutes
    const now = Date.now();

    for (const [hostKey, metrics] of this.hostMetrics) {
      if (now - metrics.lastUsed.getTime() > staleThreshold) {
        this.hostMetrics.delete(hostKey);
      }
    }
  }

  private emitMetrics(): void {
    this.emit('metrics_updated', {
      stats: this.getStatistics(),
      health: this.getHealthStatus(),
      hostCount: this.hostMetrics.size,
    });
  }
}

// Export singleton instance
export const connectionPool = new ConnectionPoolManager();