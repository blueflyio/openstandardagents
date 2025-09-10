import { EventEmitter } from 'events';
import { components } from '../../types/acdl-api.js';

type ACDLManifest = components['schemas']['ACDLManifest'];

export interface HealthMetrics {
  agentId: string;
  timestamp: Date;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  score: number; // 0.0 - 1.0
  availability: number; // 0.0 - 1.0
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    current: number;
  };
  errorRate: number; // 0.0 - 1.0
  throughput: {
    requestsPerSecond: number;
    successfulRequests: number;
    failedRequests: number;
  };
  resources: {
    cpuUsage?: number;
    memoryUsage?: number;
    storageUsage?: number;
  };
  endpoints: Array<{
    protocol: string;
    url: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastChecked: Date;
    errorCount: number;
  }>;
}

export interface LifecycleEvent {
  agentId: string;
  event: 'registered' | 'activated' | 'deactivated' | 'updated' | 'deprecated' | 'unregistered';
  timestamp: Date;
  reason?: string;
  metadata?: any;
}

export interface AgentLifecycle {
  agentId: string;
  currentState: 'registered' | 'active' | 'inactive' | 'suspended' | 'deprecated' | 'terminated';
  registrationDate: Date;
  lastActivated?: Date;
  lastDeactivated?: Date;
  suspensionReason?: string;
  deprecationDate?: Date;
  terminationDate?: Date;
  totalUptime: number; // milliseconds
  stateHistory: LifecycleEvent[];
  healthHistory: HealthMetrics[];
  slaViolations: number;
  performanceTrend: 'improving' | 'stable' | 'degrading' | 'unknown';
}

/**
 * Agent Health Monitor and Lifecycle Manager
 * 
 * Provides comprehensive health monitoring, SLA tracking, and lifecycle
 * management for registered OSSA agents in production environments.
 */
export class HealthMonitor extends EventEmitter {
  private readonly ossaVersion = '0.1.9-alpha.1';
  
  // Health monitoring configuration
  private readonly healthCheckInterval = 30000; // 30 seconds
  private readonly healthCheckTimeout = 10000; // 10 seconds
  private readonly maxHistoryEntries = 1000;
  private readonly slaThresholds = {
    availability: 0.99,
    responseTimeP99: 1000, // ms
    errorRate: 0.01
  };

  // Storage (in production, use persistent storage)
  private readonly agentLifecycles = new Map<string, AgentLifecycle>();
  private readonly currentMetrics = new Map<string, HealthMetrics>();
  private readonly healthCheckTimers = new Map<string, NodeJS.Timer>();
  
  // Performance analytics
  private readonly trendAnalysis = new Map<string, {
    samples: number[];
    window: number;
    trend: 'improving' | 'stable' | 'degrading' | 'unknown';
    confidence: number;
  }>();

  constructor() {
    super();
    this.startSystemHealthCheck();
  }

  /**
   * Initialize lifecycle tracking for a newly registered agent
   */
  async initializeAgent(agentId: string, manifest: ACDLManifest): Promise<void> {
    const now = new Date();
    
    const lifecycle: AgentLifecycle = {
      agentId,
      currentState: 'registered',
      registrationDate: now,
      totalUptime: 0,
      stateHistory: [{
        agentId,
        event: 'registered',
        timestamp: now,
        metadata: {
          agentType: manifest.agentType,
          version: manifest.version,
          capabilities: manifest.capabilities.domains
        }
      }],
      healthHistory: [],
      slaViolations: 0,
      performanceTrend: 'unknown'
    };

    this.agentLifecycles.set(agentId, lifecycle);
    
    // Initialize health metrics
    const initialMetrics: HealthMetrics = {
      agentId,
      timestamp: now,
      status: 'unknown',
      score: 0.5,
      availability: 1.0,
      responseTime: { p50: 0, p95: 0, p99: 0, current: 0 },
      errorRate: 0,
      throughput: { requestsPerSecond: 0, successfulRequests: 0, failedRequests: 0 },
      resources: {},
      endpoints: manifest.protocols.supported.map(protocol => ({
        protocol: protocol.name,
        url: protocol.endpoint,
        status: 'healthy' as const,
        responseTime: 0,
        lastChecked: now,
        errorCount: 0
      }))
    };

    this.currentMetrics.set(agentId, initialMetrics);
    
    // Start health monitoring
    await this.startHealthMonitoring(agentId);
    
    this.emit('agent:initialized', { agentId, timestamp: now.toISOString() });
  }

  /**
   * Start health monitoring for an agent
   */
  async startHealthMonitoring(agentId: string): Promise<void> {
    // Clear existing timer if any
    const existingTimer = this.healthCheckTimers.get(agentId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Start periodic health checks
    const timer = setInterval(async () => {
      await this.performHealthCheck(agentId);
    }, this.healthCheckInterval);

    this.healthCheckTimers.set(agentId, timer);
    
    // Perform initial health check
    await this.performHealthCheck(agentId);
  }

  /**
   * Perform comprehensive health check for an agent
   */
  async performHealthCheck(agentId: string): Promise<HealthMetrics | null> {
    const lifecycle = this.agentLifecycles.get(agentId);
    const currentMetrics = this.currentMetrics.get(agentId);
    
    if (!lifecycle || !currentMetrics) {
      return null;
    }

    const now = new Date();
    const healthMetrics: HealthMetrics = { ...currentMetrics, timestamp: now };

    try {
      // 1. Endpoint health checks
      const endpointResults = await Promise.allSettled(
        currentMetrics.endpoints.map(endpoint => this.checkEndpoint(endpoint))
      );

      healthMetrics.endpoints = endpointResults.map((result, index) => {
        const endpoint = currentMetrics.endpoints[index];
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            ...endpoint,
            status: 'unhealthy' as const,
            responseTime: this.healthCheckTimeout,
            lastChecked: now,
            errorCount: endpoint.errorCount + 1
          };
        }
      });

      // 2. Calculate overall health score
      healthMetrics.score = this.calculateHealthScore(healthMetrics.endpoints);
      healthMetrics.status = this.determineHealthStatus(healthMetrics.score);

      // 3. Update availability metrics
      healthMetrics.availability = this.calculateAvailability(agentId, healthMetrics.status);

      // 4. Calculate response time percentiles
      healthMetrics.responseTime = this.calculateResponseTimePercentiles(
        healthMetrics.endpoints.map(ep => ep.responseTime)
      );

      // 5. Update error rate
      const totalRequests = lifecycle.healthHistory.length;
      const recentErrors = lifecycle.healthHistory
        .slice(-100) // Last 100 checks
        .filter(h => h.status === 'unhealthy').length;
      healthMetrics.errorRate = totalRequests > 0 ? recentErrors / Math.min(100, totalRequests) : 0;

      // 6. Update current metrics
      this.currentMetrics.set(agentId, healthMetrics);

      // 7. Add to health history
      lifecycle.healthHistory.push(healthMetrics);
      if (lifecycle.healthHistory.length > this.maxHistoryEntries) {
        lifecycle.healthHistory.shift();
      }

      // 8. Update performance trend
      await this.updatePerformanceTrend(agentId, healthMetrics.score);

      // 9. Check SLA violations
      await this.checkSLAViolations(agentId, healthMetrics);

      // 10. Update lifecycle state if needed
      await this.updateLifecycleState(agentId, healthMetrics);

      this.emit('health:checked', {
        agentId,
        status: healthMetrics.status,
        score: healthMetrics.score,
        timestamp: now.toISOString()
      });

      return healthMetrics;

    } catch (error) {
      // Health check failed
      healthMetrics.status = 'unhealthy';
      healthMetrics.score = 0;
      
      this.currentMetrics.set(agentId, healthMetrics);
      
      this.emit('health:check_failed', {
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: now.toISOString()
      });

      return healthMetrics;
    }
  }

  /**
   * Get current health status for an agent
   */
  getAgentHealth(agentId: string): HealthMetrics | null {
    return this.currentMetrics.get(agentId) || null;
  }

  /**
   * Get complete lifecycle information for an agent
   */
  getAgentLifecycle(agentId: string): AgentLifecycle | null {
    return this.agentLifecycles.get(agentId) || null;
  }

  /**
   * Update agent state (activate, deactivate, suspend, etc.)
   */
  async updateAgentState(
    agentId: string,
    newState: AgentLifecycle['currentState'],
    reason?: string
  ): Promise<boolean> {
    const lifecycle = this.agentLifecycles.get(agentId);
    if (!lifecycle) return false;

    const now = new Date();
    const previousState = lifecycle.currentState;
    
    // Update uptime if transitioning from active
    if (previousState === 'active' && newState !== 'active') {
      const lastActivated = lifecycle.lastActivated || lifecycle.registrationDate;
      lifecycle.totalUptime += now.getTime() - lastActivated.getTime();
      lifecycle.lastDeactivated = now;
    } else if (previousState !== 'active' && newState === 'active') {
      lifecycle.lastActivated = now;
    }

    // Update state
    lifecycle.currentState = newState;

    // Add to history
    const event: LifecycleEvent = {
      agentId,
      event: this.mapStateToEvent(newState),
      timestamp: now,
      reason,
      metadata: { previousState }
    };
    
    lifecycle.stateHistory.push(event);

    // Handle special state transitions
    if (newState === 'suspended') {
      lifecycle.suspensionReason = reason;
      await this.stopHealthMonitoring(agentId);
    } else if (newState === 'deprecated') {
      lifecycle.deprecationDate = now;
    } else if (newState === 'terminated') {
      lifecycle.terminationDate = now;
      await this.stopHealthMonitoring(agentId);
    } else if (newState === 'active' && previousState !== 'active') {
      await this.startHealthMonitoring(agentId);
    }

    this.emit('lifecycle:state_changed', {
      agentId,
      previousState,
      newState,
      reason,
      timestamp: now.toISOString()
    });

    return true;
  }

  /**
   * Stop health monitoring for an agent
   */
  async stopHealthMonitoring(agentId: string): Promise<void> {
    const timer = this.healthCheckTimers.get(agentId);
    if (timer) {
      clearInterval(timer);
      this.healthCheckTimers.delete(agentId);
    }

    this.emit('health:monitoring_stopped', {
      agentId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate health report for an agent or all agents
   */
  generateHealthReport(agentId?: string): any {
    if (agentId) {
      const health = this.currentMetrics.get(agentId);
      const lifecycle = this.agentLifecycles.get(agentId);
      
      if (!health || !lifecycle) return null;

      return this.generateSingleAgentReport(agentId, health, lifecycle);
    } else {
      // Generate system-wide report
      const agents = Array.from(this.agentLifecycles.keys());
      const reports = agents.map(id => {
        const health = this.currentMetrics.get(id)!;
        const lifecycle = this.agentLifecycles.get(id)!;
        return this.generateSingleAgentReport(id, health, lifecycle);
      });

      return {
        summary: {
          totalAgents: agents.length,
          healthyAgents: reports.filter(r => r.health.status === 'healthy').length,
          degradedAgents: reports.filter(r => r.health.status === 'degraded').length,
          unhealthyAgents: reports.filter(r => r.health.status === 'unhealthy').length,
          averageHealthScore: reports.reduce((sum, r) => sum + r.health.score, 0) / reports.length,
          totalSLAViolations: reports.reduce((sum, r) => sum + r.lifecycle.slaViolations, 0),
          reportGeneratedAt: new Date().toISOString()
        },
        agents: reports
      };
    }
  }

  /**
   * Cleanup terminated agent data
   */
  async cleanupAgent(agentId: string): Promise<boolean> {
    const lifecycle = this.agentLifecycles.get(agentId);
    if (!lifecycle || lifecycle.currentState !== 'terminated') {
      return false;
    }

    // Stop monitoring
    await this.stopHealthMonitoring(agentId);

    // Remove from tracking (in production, archive to persistent storage)
    this.agentLifecycles.delete(agentId);
    this.currentMetrics.delete(agentId);
    this.trendAnalysis.delete(agentId);

    this.emit('agent:cleaned_up', {
      agentId,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  /**
   * Shutdown the health monitor
   */
  async shutdown(): Promise<void> {
    // Stop all health monitoring
    for (const [agentId] of this.healthCheckTimers) {
      await this.stopHealthMonitoring(agentId);
    }

    this.emit('health_monitor:shutdown', {
      monitoredAgents: this.agentLifecycles.size,
      timestamp: new Date().toISOString()
    });
  }

  // Private helper methods

  private async checkEndpoint(endpoint: {
    protocol: string;
    url: string;
    status: string;
    responseTime: number;
    lastChecked: Date;
    errorCount: number;
  }): Promise<typeof endpoint> {
    const startTime = Date.now();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Health check timeout')), this.healthCheckTimeout);
    });

    try {
      // Simulate endpoint health check (in production, make actual HTTP/gRPC calls)
      await Promise.race([
        this.simulateEndpointCheck(endpoint.url),
        timeoutPromise
      ]);

      const responseTime = Date.now() - startTime;
      
      return {
        ...endpoint,
        status: responseTime < 5000 ? 'healthy' : 'degraded',
        responseTime,
        lastChecked: new Date(),
        errorCount: Math.max(0, endpoint.errorCount - 1)
      };

    } catch (error) {
      return {
        ...endpoint,
        status: 'unhealthy',
        responseTime: this.healthCheckTimeout,
        lastChecked: new Date(),
        errorCount: endpoint.errorCount + 1
      };
    }
  }

  private async simulateEndpointCheck(url: string): Promise<void> {
    // Simulate variable response times
    const responseTime = 100 + Math.random() * 900;
    await new Promise(resolve => setTimeout(resolve, responseTime));
    
    // Simulate occasional failures (5% failure rate)
    if (Math.random() < 0.05) {
      throw new Error('Simulated endpoint failure');
    }
  }

  private calculateHealthScore(endpoints: HealthMetrics['endpoints']): number {
    if (endpoints.length === 0) return 0;

    const healthyCount = endpoints.filter(ep => ep.status === 'healthy').length;
    const degradedCount = endpoints.filter(ep => ep.status === 'degraded').length;
    
    const baseScore = (healthyCount + degradedCount * 0.5) / endpoints.length;
    
    // Adjust for response times
    const avgResponseTime = endpoints.reduce((sum, ep) => sum + ep.responseTime, 0) / endpoints.length;
    const responseTimePenalty = Math.min(0.3, avgResponseTime / 10000); // Max 30% penalty
    
    return Math.max(0, baseScore - responseTimePenalty);
  }

  private determineHealthStatus(score: number): 'healthy' | 'degraded' | 'unhealthy' | 'unknown' {
    if (score >= 0.8) return 'healthy';
    if (score >= 0.5) return 'degraded';
    if (score > 0) return 'unhealthy';
    return 'unknown';
  }

  private calculateAvailability(agentId: string, currentStatus: string): number {
    const lifecycle = this.agentLifecycles.get(agentId);
    if (!lifecycle || lifecycle.healthHistory.length < 2) return 1.0;

    const recentChecks = lifecycle.healthHistory.slice(-100); // Last 100 checks
    const healthyChecks = recentChecks.filter(h => h.status === 'healthy').length;
    
    return healthyChecks / recentChecks.length;
  }

  private calculateResponseTimePercentiles(responseTimes: number[]): HealthMetrics['responseTime'] {
    if (responseTimes.length === 0) {
      return { p50: 0, p95: 0, p99: 0, current: 0 };
    }

    const sorted = [...responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)],
      current: responseTimes[responseTimes.length - 1]
    };
  }

  private async updatePerformanceTrend(agentId: string, currentScore: number): Promise<void> {
    let analysis = this.trendAnalysis.get(agentId);
    
    if (!analysis) {
      analysis = {
        samples: [],
        window: 20, // 20 samples for trend analysis
        trend: 'unknown',
        confidence: 0
      };
    }

    analysis.samples.push(currentScore);
    if (analysis.samples.length > analysis.window) {
      analysis.samples.shift();
    }

    if (analysis.samples.length >= 10) {
      // Simple linear regression for trend
      const n = analysis.samples.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const y = analysis.samples;
      
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      
      if (slope > 0.01) analysis.trend = 'improving';
      else if (slope < -0.01) analysis.trend = 'degrading';
      else analysis.trend = 'stable';
      
      analysis.confidence = Math.min(1, n / analysis.window);
    }

    this.trendAnalysis.set(agentId, analysis);
    
    // Update lifecycle
    const lifecycle = this.agentLifecycles.get(agentId);
    if (lifecycle) {
      lifecycle.performanceTrend = analysis.trend;
    }
  }

  private async checkSLAViolations(agentId: string, metrics: HealthMetrics): Promise<void> {
    const lifecycle = this.agentLifecycles.get(agentId);
    if (!lifecycle) return;

    let violations = 0;
    const reasons: string[] = [];

    // Check availability SLA
    if (metrics.availability < this.slaThresholds.availability) {
      violations++;
      reasons.push(`Availability SLA violation: ${(metrics.availability * 100).toFixed(2)}% < ${(this.slaThresholds.availability * 100)}%`);
    }

    // Check response time SLA
    if (metrics.responseTime.p99 > this.slaThresholds.responseTimeP99) {
      violations++;
      reasons.push(`Response time SLA violation: P99 ${metrics.responseTime.p99}ms > ${this.slaThresholds.responseTimeP99}ms`);
    }

    // Check error rate SLA
    if (metrics.errorRate > this.slaThresholds.errorRate) {
      violations++;
      reasons.push(`Error rate SLA violation: ${(metrics.errorRate * 100).toFixed(2)}% > ${(this.slaThresholds.errorRate * 100)}%`);
    }

    if (violations > 0) {
      lifecycle.slaViolations += violations;
      
      this.emit('sla:violation', {
        agentId,
        violations: reasons,
        totalViolations: lifecycle.slaViolations,
        timestamp: new Date().toISOString()
      });
    }
  }

  private async updateLifecycleState(agentId: string, metrics: HealthMetrics): Promise<void> {
    const lifecycle = this.agentLifecycles.get(agentId);
    if (!lifecycle) return;

    const currentState = lifecycle.currentState;
    
    // Auto-transition from active to inactive if consistently unhealthy
    if (currentState === 'active' && metrics.status === 'unhealthy') {
      const recentHealth = lifecycle.healthHistory.slice(-5);
      const allUnhealthy = recentHealth.length >= 5 && 
        recentHealth.every(h => h.status === 'unhealthy');
      
      if (allUnhealthy) {
        await this.updateAgentState(agentId, 'inactive', 'Consistent health check failures');
      }
    }
    
    // Auto-transition from inactive to active if healthy again
    if (currentState === 'inactive' && metrics.status === 'healthy') {
      await this.updateAgentState(agentId, 'active', 'Health recovered');
    }
  }

  private mapStateToEvent(state: AgentLifecycle['currentState']): LifecycleEvent['event'] {
    const stateEventMap: Record<string, LifecycleEvent['event']> = {
      'registered': 'registered',
      'active': 'activated',
      'inactive': 'deactivated',
      'suspended': 'deactivated',
      'deprecated': 'deprecated',
      'terminated': 'unregistered'
    };
    
    return stateEventMap[state] || 'updated';
  }

  private generateSingleAgentReport(
    agentId: string,
    health: HealthMetrics,
    lifecycle: AgentLifecycle
  ): any {
    const uptime = lifecycle.totalUptime;
    if (lifecycle.currentState === 'active' && lifecycle.lastActivated) {
      uptime += Date.now() - lifecycle.lastActivated.getTime();
    }

    const uptimeHours = uptime / (1000 * 60 * 60);
    
    return {
      agentId,
      health: {
        status: health.status,
        score: health.score,
        availability: health.availability,
        responseTime: health.responseTime,
        errorRate: health.errorRate,
        lastChecked: health.timestamp.toISOString()
      },
      lifecycle: {
        currentState: lifecycle.currentState,
        uptimeHours: Math.round(uptimeHours * 100) / 100,
        registrationAge: Date.now() - lifecycle.registrationDate.getTime(),
        slaViolations: lifecycle.slaViolations,
        performanceTrend: lifecycle.performanceTrend,
        stateChanges: lifecycle.stateHistory.length
      }
    };
  }

  private startSystemHealthCheck(): void {
    // System-wide health check every 5 minutes
    setInterval(() => {
      const totalAgents = this.agentLifecycles.size;
      const activeAgents = Array.from(this.agentLifecycles.values())
        .filter(l => l.currentState === 'active').length;
      
      this.emit('system:health_summary', {
        totalAgents,
        activeAgents,
        monitoringLoad: this.healthCheckTimers.size,
        timestamp: new Date().toISOString()
      });
    }, 5 * 60 * 1000);
  }
}