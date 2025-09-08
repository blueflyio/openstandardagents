/**
 * OSSA Heartbeat Monitoring System
 * Continuous agent heartbeat monitoring with adaptive intervals and failure detection
 */

import { EventEmitter } from 'events';

export interface HeartbeatConfig {
  interval: number;
  timeout: number;
  retryAttempts: number;
  backoffMultiplier: number;
  maxBackoffInterval: number;
  adaptiveInterval: boolean;
  jitterPercentage: number;
}

export interface HeartbeatMetrics {
  sent: number;
  received: number;
  failed: number;
  avgResponseTime: number;
  lastHeartbeat: Date;
  consecutiveFailures: number;
  uptime: number;
  successRate: number;
}

export interface HeartbeatStatus {
  agentId: string;
  status: 'healthy' | 'degraded' | 'failed' | 'unknown';
  lastSeen: Date;
  responseTime: number;
  metrics: HeartbeatMetrics;
  failureReason?: string;
}

export interface HeartbeatEvent {
  type: 'heartbeat_sent' | 'heartbeat_received' | 'heartbeat_failed' | 'heartbeat_timeout' | 'agent_recovered';
  agentId: string;
  timestamp: Date;
  data: any;
  metadata?: {
    responseTime?: number;
    attempt?: number;
    failureReason?: string;
  };
}

export class HeartbeatMonitor extends EventEmitter {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private metrics: Map<string, HeartbeatMetrics> = new Map();
  private statuses: Map<string, HeartbeatStatus> = new Map();
  private pendingHeartbeats: Map<string, { timestamp: Date; timeout: NodeJS.Timeout }> = new Map();
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private running = false;

  constructor(private config: HeartbeatConfig) {
    super();
    this.validateConfig();
  }

  /**
   * Start monitoring an agent
   */
  startMonitoring(agentId: string, endpoint: string): void {
    if (this.intervals.has(agentId)) {
      this.stopMonitoring(agentId);
    }

    // Initialize metrics
    this.metrics.set(agentId, {
      sent: 0,
      received: 0,
      failed: 0,
      avgResponseTime: 0,
      lastHeartbeat: new Date(0),
      consecutiveFailures: 0,
      uptime: 0,
      successRate: 100
    });

    // Initialize status
    this.statuses.set(agentId, {
      agentId,
      status: 'unknown',
      lastSeen: new Date(0),
      responseTime: 0,
      metrics: this.metrics.get(agentId)!,
    });

    // Start heartbeat interval
    this.scheduleHeartbeat(agentId, endpoint);
    
    this.emit('monitoringStarted', { agentId, endpoint, timestamp: new Date() });
  }

  /**
   * Stop monitoring an agent
   */
  stopMonitoring(agentId: string): void {
    // Clear heartbeat interval
    const interval = this.intervals.get(agentId);
    if (interval) {
      clearTimeout(interval);
      this.intervals.delete(agentId);
    }

    // Clear retry timeout
    const retryTimeout = this.retryTimeouts.get(agentId);
    if (retryTimeout) {
      clearTimeout(retryTimeout);
      this.retryTimeouts.delete(agentId);
    }

    // Clear pending heartbeat timeout
    const pending = this.pendingHeartbeats.get(agentId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingHeartbeats.delete(agentId);
    }

    // Keep metrics and status for historical purposes
    this.emit('monitoringStopped', { agentId, timestamp: new Date() });
  }

  /**
   * Get heartbeat status for an agent
   */
  getStatus(agentId: string): HeartbeatStatus | null {
    return this.statuses.get(agentId) || null;
  }

  /**
   * Get metrics for an agent
   */
  getMetrics(agentId: string): HeartbeatMetrics | null {
    return this.metrics.get(agentId) || null;
  }

  /**
   * Get overview of all monitored agents
   */
  getOverview(): {
    total: number;
    healthy: number;
    degraded: number;
    failed: number;
    unknown: number;
    avgResponseTime: number;
    totalUptime: number;
  } {
    const statuses = Array.from(this.statuses.values());
    const overview = {
      total: statuses.length,
      healthy: 0,
      degraded: 0,
      failed: 0,
      unknown: 0,
      avgResponseTime: 0,
      totalUptime: 0
    };

    if (statuses.length === 0) {
      return overview;
    }

    let totalResponseTime = 0;
    let totalUptime = 0;

    statuses.forEach(status => {
      overview[status.status]++;
      totalResponseTime += status.responseTime;
      totalUptime += status.metrics.uptime;
    });

    overview.avgResponseTime = totalResponseTime / statuses.length;
    overview.totalUptime = totalUptime / statuses.length;

    return overview;
  }

  /**
   * Start the heartbeat monitor system
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.emit('monitorStarted', { timestamp: new Date() });

    // Start cleanup interval
    setInterval(() => {
      this.cleanupStaleEntries();
      this.updateUptimeMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop the heartbeat monitor system
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Stop monitoring all agents
    const agentIds = Array.from(this.intervals.keys());
    agentIds.forEach(agentId => this.stopMonitoring(agentId));

    this.emit('monitorStopped', { timestamp: new Date() });
  }

  /**
   * Force a heartbeat check for an agent
   */
  async forceHeartbeat(agentId: string): Promise<HeartbeatStatus> {
    const status = this.statuses.get(agentId);
    if (!status) {
      throw new Error(`Agent ${agentId} is not being monitored`);
    }

    await this.performHeartbeat(agentId, `agent://${agentId}/health`);
    return this.getStatus(agentId)!;
  }

  /**
   * Update heartbeat configuration for an agent
   */
  updateConfig(agentId: string, config: Partial<HeartbeatConfig>): void {
    // Apply new config (simplified - in practice would merge with existing)
    this.config = { ...this.config, ...config };
    
    // Restart monitoring with new config
    const status = this.statuses.get(agentId);
    if (status) {
      this.stopMonitoring(agentId);
      this.startMonitoring(agentId, `agent://${agentId}/health`);
    }
  }

  // Private methods

  private scheduleHeartbeat(agentId: string, endpoint: string): void {
    const interval = this.calculateInterval(agentId);
    
    const timeout = setTimeout(async () => {
      try {
        await this.performHeartbeat(agentId, endpoint);
      } catch (error) {
        console.error(`Heartbeat failed for agent ${agentId}:`, error);
      }
      
      // Schedule next heartbeat
      this.scheduleHeartbeat(agentId, endpoint);
    }, interval);

    this.intervals.set(agentId, timeout);
  }

  private calculateInterval(agentId: string): number {
    let interval = this.config.interval;

    if (this.config.adaptiveInterval) {
      const metrics = this.metrics.get(agentId);
      if (metrics) {
        // Adjust interval based on success rate
        if (metrics.successRate < 50) {
          // Increase frequency for problematic agents
          interval = Math.max(interval / 2, 1000);
        } else if (metrics.successRate > 95) {
          // Decrease frequency for healthy agents
          interval = Math.min(interval * 1.5, this.config.maxBackoffInterval);
        }

        // Apply backoff for consecutive failures
        if (metrics.consecutiveFailures > 0) {
          const backoff = Math.pow(this.config.backoffMultiplier, metrics.consecutiveFailures);
          interval = Math.min(interval * backoff, this.config.maxBackoffInterval);
        }
      }
    }

    // Add jitter to prevent thundering herd
    if (this.config.jitterPercentage > 0) {
      const jitter = interval * (this.config.jitterPercentage / 100);
      const randomJitter = (Math.random() - 0.5) * 2 * jitter;
      interval += randomJitter;
    }

    return Math.max(interval, 100); // Minimum 100ms
  }

  private async performHeartbeat(agentId: string, endpoint: string): Promise<void> {
    const startTime = Date.now();
    const metrics = this.metrics.get(agentId)!;
    const status = this.statuses.get(agentId)!;

    // Emit heartbeat sent event
    this.emitHeartbeatEvent('heartbeat_sent', agentId, { endpoint });

    // Update metrics
    metrics.sent++;

    try {
      // Set timeout for heartbeat response
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Heartbeat timeout'));
        }, this.config.timeout);

        this.pendingHeartbeats.set(agentId, {
          timestamp: new Date(),
          timeout
        });
      });

      // Perform actual heartbeat
      const heartbeatPromise = this.sendHeartbeat(endpoint);

      // Race between heartbeat and timeout
      const response = await Promise.race([heartbeatPromise, timeoutPromise]);

      // Clear timeout
      const pending = this.pendingHeartbeats.get(agentId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingHeartbeats.delete(agentId);
      }

      // Calculate response time
      const responseTime = Date.now() - startTime;

      // Update metrics
      metrics.received++;
      metrics.lastHeartbeat = new Date();
      metrics.consecutiveFailures = 0;
      metrics.avgResponseTime = this.updateAverageResponseTime(metrics.avgResponseTime, responseTime, metrics.received);

      // Update status
      const previousStatus = status.status;
      status.status = this.determineHealthStatus(responseTime, metrics);
      status.lastSeen = new Date();
      status.responseTime = responseTime;

      // Emit events
      this.emitHeartbeatEvent('heartbeat_received', agentId, { 
        responseTime,
        response 
      });

      if (previousStatus !== 'healthy' && status.status === 'healthy') {
        this.emitHeartbeatEvent('agent_recovered', agentId, { 
          previousStatus,
          responseTime 
        });
      }

    } catch (error) {
      // Handle heartbeat failure
      await this.handleHeartbeatFailure(agentId, error, startTime);
    }

    // Update success rate
    metrics.successRate = (metrics.received / metrics.sent) * 100;
  }

  private async sendHeartbeat(endpoint: string): Promise<any> {
    // Simulate heartbeat request - in real implementation, this would be HTTP/WebSocket/gRPC
    return new Promise((resolve, reject) => {
      const delay = Math.random() * 1000; // Simulate network latency
      
      setTimeout(() => {
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
          reject(new Error('Network error'));
        } else {
          resolve({
            timestamp: new Date(),
            status: 'ok',
            version: '1.0.0',
            uptime: Math.random() * 86400 // Random uptime in seconds
          });
        }
      }, delay);
    });
  }

  private async handleHeartbeatFailure(agentId: string, error: any, startTime: number): Promise<void> {
    const metrics = this.metrics.get(agentId)!;
    const status = this.statuses.get(agentId)!;

    // Update failure metrics
    metrics.failed++;
    metrics.consecutiveFailures++;

    // Update status
    status.status = 'failed';
    status.failureReason = error.message;

    // Emit failure event
    this.emitHeartbeatEvent('heartbeat_failed', agentId, {
      error: error.message,
      consecutiveFailures: metrics.consecutiveFailures,
      failureReason: error.message
    });

    // Check if we should retry
    if (metrics.consecutiveFailures <= this.config.retryAttempts) {
      await this.scheduleRetry(agentId, error);
    } else {
      // Too many failures, emit timeout event
      this.emitHeartbeatEvent('heartbeat_timeout', agentId, {
        consecutiveFailures: metrics.consecutiveFailures,
        lastAttempt: Date.now() - startTime
      });
    }
  }

  private async scheduleRetry(agentId: string, lastError: any): Promise<void> {
    const metrics = this.metrics.get(agentId)!;
    const retryDelay = this.calculateRetryDelay(metrics.consecutiveFailures);

    const timeout = setTimeout(async () => {
      try {
        await this.performHeartbeat(agentId, `agent://${agentId}/health`);
      } catch (error) {
        console.error(`Retry heartbeat failed for agent ${agentId}:`, error);
      }
      
      this.retryTimeouts.delete(agentId);
    }, retryDelay);

    this.retryTimeouts.set(agentId, timeout);
  }

  private calculateRetryDelay(consecutiveFailures: number): number {
    const baseDelay = 1000; // 1 second base delay
    const backoff = Math.pow(this.config.backoffMultiplier, consecutiveFailures - 1);
    return Math.min(baseDelay * backoff, this.config.maxBackoffInterval);
  }

  private determineHealthStatus(responseTime: number, metrics: HeartbeatMetrics): 'healthy' | 'degraded' | 'failed' {
    if (responseTime > this.config.timeout * 0.8) {
      return 'degraded';
    }

    if (metrics.successRate < 90) {
      return 'degraded';
    }

    if (metrics.consecutiveFailures > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  private updateAverageResponseTime(currentAvg: number, newTime: number, count: number): number {
    // Calculate running average
    return ((currentAvg * (count - 1)) + newTime) / count;
  }

  private cleanupStaleEntries(): void {
    const staleThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes

    for (const [agentId, status] of this.statuses) {
      if (status.lastSeen.getTime() < staleThreshold && !this.intervals.has(agentId)) {
        // Remove stale entries that are no longer being monitored
        this.statuses.delete(agentId);
        this.metrics.delete(agentId);
        
        this.emit('staleEntryRemoved', { agentId, timestamp: new Date() });
      }
    }
  }

  private updateUptimeMetrics(): void {
    const now = Date.now();

    for (const [agentId, metrics] of this.metrics) {
      const status = this.statuses.get(agentId);
      if (status && status.status === 'healthy') {
        // Calculate uptime based on last heartbeat
        const timeSinceLastHeartbeat = now - metrics.lastHeartbeat.getTime();
        if (timeSinceLastHeartbeat < this.config.interval * 2) {
          metrics.uptime += 30; // Add 30 seconds of uptime
        }
      }
    }
  }

  private emitHeartbeatEvent(type: HeartbeatEvent['type'], agentId: string, data: any): void {
    const event: HeartbeatEvent = {
      type,
      agentId,
      timestamp: new Date(),
      data,
      metadata: {
        responseTime: data.responseTime,
        attempt: data.attempt,
        failureReason: data.failureReason || data.error
      }
    };

    this.emit(type, event);
    this.emit('heartbeatEvent', event);
  }

  private validateConfig(): void {
    if (this.config.interval < 100) {
      throw new Error('Heartbeat interval must be at least 100ms');
    }

    if (this.config.timeout >= this.config.interval) {
      throw new Error('Heartbeat timeout must be less than interval');
    }

    if (this.config.retryAttempts < 0) {
      throw new Error('Retry attempts must be non-negative');
    }

    if (this.config.backoffMultiplier < 1) {
      throw new Error('Backoff multiplier must be at least 1');
    }

    if (this.config.jitterPercentage < 0 || this.config.jitterPercentage > 100) {
      throw new Error('Jitter percentage must be between 0 and 100');
    }
  }
}

export default HeartbeatMonitor;