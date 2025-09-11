/**
 * OSSA Multi-Tier Failure Detection System
 * Hierarchical failure detection with escalating responses and circuit breaker patterns
 */

import { EventEmitter } from 'events';

export enum FailureDetectionTier {
  HEARTBEAT = 'heartbeat',
  HEALTH_CHECK = 'health_check',
  PERFORMANCE = 'performance',
  DEPENDENCY = 'dependency',
  RESOURCE = 'resource',
  BUSINESS_LOGIC = 'business_logic'
}

export enum FailureAction {
  LOG = 'log',
  ALERT = 'alert',
  RESTART = 'restart',
  REPLACE = 'replace',
  ISOLATE = 'isolate',
  ESCALATE = 'escalate',
  CIRCUIT_BREAK = 'circuit_break',
  DRAIN_TRAFFIC = 'drain_traffic',
  ROLLBACK = 'rollback'
}

export enum FailureSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface FailureDetectionRule {
  tier: FailureDetectionTier;
  name: string;
  description: string;
  condition: FailureCondition;
  action: FailureAction;
  severity: FailureSeverity;
  threshold: number;
  timeWindow: number; // milliseconds
  escalationTime: number; // milliseconds
  enabled: boolean;
  dependencies?: string[]; // Other rules this depends on
}

export interface FailureCondition {
  type: 'threshold' | 'rate' | 'pattern' | 'composite';
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
  duration?: number; // How long condition must be true
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
}

export interface FailureEvent {
  id: string;
  agentId: string;
  tier: FailureDetectionTier;
  rule: string;
  severity: FailureSeverity;
  timestamp: Date;
  description: string;
  metrics: Record<string, any>;
  context: FailureContext;
  resolved: boolean;
  resolvedAt?: Date;
  actions: FailureActionResult[];
}

export interface FailureContext {
  triggeredBy: string;
  relatedEvents: string[];
  affectedServices: string[];
  impactRadius: string[];
  rootCauseAnalysis?: {
    likelyRootCause: string;
    confidence: number;
    contributingFactors: string[];
    recommendations: string[];
  };
}

export interface FailureActionResult {
  action: FailureAction;
  timestamp: Date;
  success: boolean;
  details: string;
  executionTime: number;
  side_effects?: string[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // Time to wait before transitioning from OPEN to HALF_OPEN
  halfOpenMaxCalls: number;
  monitoringInterval: number;
}

export interface CircuitBreakerState {
  agentId: string;
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: Date;
  lastStateChange: Date;
  halfOpenCalls: number;
  totalCalls: number;
}

export interface EscalationPolicy {
  name: string;
  levels: EscalationLevel[];
  maxRetries: number;
  baseDelay: number;
  backoffMultiplier: number;
  maxDelay: number;
}

export interface EscalationLevel {
  level: number;
  delay: number;
  actions: FailureAction[];
  requiredSeverity: FailureSeverity;
  notificationChannels: string[];
  approvalRequired: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkLatency: number;
  customMetrics: Record<string, number>;
}

export class FailureDetector extends EventEmitter {
  private rules: Map<string, FailureDetectionRule> = new Map();
  private activeFailures: Map<string, FailureEvent> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private escalationPolicies: Map<string, EscalationPolicy> = new Map();
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private detectionIntervals: Map<string, NodeJS.Timeout> = new Map();
  private running = false;

  constructor(
    private config: {
      detectionInterval: number;
      metricsRetentionTime: number;
      maxHistorySize: number;
      circuitBreaker: CircuitBreakerConfig;
      enableRootCauseAnalysis: boolean;
    }
  ) {
    super();
    this.initializeDefaultRules();
    this.initializeDefaultEscalationPolicies();
  }

  /**
   * Start failure detection for an agent
   */
  startDetection(agentId: string): void {
    if (this.detectionIntervals.has(agentId)) {
      return;
    }

    // Initialize circuit breaker
    this.circuitBreakers.set(agentId, {
      agentId,
      state: CircuitState.CLOSED,
      failureCount: 0,
      successCount: 0,
      lastFailureTime: new Date(0),
      lastStateChange: new Date(),
      halfOpenCalls: 0,
      totalCalls: 0
    });

    // Initialize metrics history
    this.metricsHistory.set(agentId, []);

    // Start detection interval
    const interval = setInterval(() => {
      this.performFailureDetection(agentId);
    }, this.config.detectionInterval);

    this.detectionIntervals.set(agentId, interval);

    this.emit('detectionStarted', { agentId, timestamp: new Date() });
  }

  /**
   * Stop failure detection for an agent
   */
  stopDetection(agentId: string): void {
    const interval = this.detectionIntervals.get(agentId);
    if (interval) {
      clearInterval(interval);
      this.detectionIntervals.delete(agentId);
    }

    this.emit('detectionStopped', { agentId, timestamp: new Date() });
  }

  /**
   * Add custom failure detection rule
   */
  addRule(rule: FailureDetectionRule): void {
    this.rules.set(rule.name, rule);
    this.emit('ruleAdded', { rule, timestamp: new Date() });
  }

  /**
   * Remove failure detection rule
   */
  removeRule(ruleName: string): void {
    const rule = this.rules.get(ruleName);
    if (rule) {
      this.rules.delete(ruleName);
      this.emit('ruleRemoved', { rule, timestamp: new Date() });
    }
  }

  /**
   * Update agent metrics for failure detection
   */
  updateMetrics(agentId: string, metrics: PerformanceMetrics): void {
    const history = this.metricsHistory.get(agentId) || [];
    
    // Add new metrics
    history.push({
      ...metrics,
      timestamp: Date.now()
    } as any);

    // Maintain history size
    if (history.length > this.config.maxHistorySize) {
      history.splice(0, history.length - this.config.maxHistorySize);
    }

    this.metricsHistory.set(agentId, history);

    // Update circuit breaker
    this.updateCircuitBreaker(agentId, metrics);
  }

  /**
   * Get active failures for an agent
   */
  getActiveFailures(agentId: string): FailureEvent[] {
    return Array.from(this.activeFailures.values())
      .filter(failure => failure.agentId === agentId && !failure.resolved);
  }

  /**
   * Get circuit breaker state for an agent
   */
  getCircuitBreakerState(agentId: string): CircuitBreakerState | null {
    return this.circuitBreakers.get(agentId) || null;
  }

  /**
   * Get failure detection overview
   */
  getDetectionOverview(): {
    totalRules: number;
    activeRules: number;
    totalFailures: number;
    activeFailures: number;
    criticalFailures: number;
    circuitBreakersOpen: number;
    detectionCoverage: number;
  } {
    const rules = Array.from(this.rules.values());
    const failures = Array.from(this.activeFailures.values());
    const circuitBreakers = Array.from(this.circuitBreakers.values());

    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.enabled).length,
      totalFailures: failures.length,
      activeFailures: failures.filter(f => !f.resolved).length,
      criticalFailures: failures.filter(f => !f.resolved && f.severity === FailureSeverity.CRITICAL).length,
      circuitBreakersOpen: circuitBreakers.filter(cb => cb.state === CircuitState.OPEN).length,
      detectionCoverage: this.detectionIntervals.size
    };
  }

  /**
   * Manually trigger failure detection for an agent
   */
  async triggerDetection(agentId: string): Promise<FailureEvent[]> {
    const detectedFailures: FailureEvent[] = [];
    
    for (const [ruleName, rule] of this.rules) {
      if (!rule.enabled) continue;

      const failure = await this.evaluateRule(agentId, rule);
      if (failure) {
        detectedFailures.push(failure);
        await this.handleFailure(failure);
      }
    }

    return detectedFailures;
  }

  /**
   * Resolve a failure manually
   */
  resolveFailure(failureId: string, resolution: string): void {
    const failure = this.activeFailures.get(failureId);
    if (failure && !failure.resolved) {
      failure.resolved = true;
      failure.resolvedAt = new Date();
      
      this.emit('failureResolved', { 
        failure, 
        resolution, 
        timestamp: new Date() 
      });
    }
  }

  // Private methods

  private async performFailureDetection(agentId: string): Promise<void> {
    try {
      const detectedFailures = await this.triggerDetection(agentId);
      
      if (detectedFailures.length > 0) {
        this.emit('failuresDetected', {
          agentId,
          failures: detectedFailures,
          timestamp: new Date()
        });
      }

      // Perform cleanup
      this.cleanupResolvedFailures();
      this.cleanupOldMetrics();

    } catch (error) {
      this.emit('detectionError', {
        agentId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  private async evaluateRule(agentId: string, rule: FailureDetectionRule): Promise<FailureEvent | null> {
    const metrics = this.getLatestMetrics(agentId);
    const history = this.metricsHistory.get(agentId) || [];

    if (!metrics || history.length === 0) {
      return null;
    }

    const conditionMet = await this.evaluateCondition(rule.condition, metrics, history);
    
    if (conditionMet) {
      // Check if this failure already exists and is active
      const existingFailure = Array.from(this.activeFailures.values())
        .find(f => f.agentId === agentId && f.rule === rule.name && !f.resolved);

      if (existingFailure) {
        return null; // Don't create duplicate failures
      }

      // Create new failure event
      const failure: FailureEvent = {
        id: `failure-${Date.now()}-${Math.random()}`,
        agentId,
        tier: rule.tier,
        rule: rule.name,
        severity: rule.severity,
        timestamp: new Date(),
        description: `${rule.description} - Condition: ${rule.condition.metric} ${rule.condition.operator} ${rule.condition.value}`,
        metrics: { ...metrics },
        context: await this.analyzeFailureContext(agentId, rule, metrics, history),
        resolved: false,
        actions: []
      };

      this.activeFailures.set(failure.id, failure);
      return failure;
    }

    return null;
  }

  private async evaluateCondition(
    condition: FailureCondition,
    metrics: PerformanceMetrics,
    history: PerformanceMetrics[]
  ): Promise<boolean> {
    let value: number | string | boolean;

    // Get metric value
    if (condition.metric in metrics) {
      value = (metrics as any)[condition.metric];
    } else if (condition.metric in metrics.customMetrics) {
      value = metrics.customMetrics[condition.metric];
    } else {
      return false; // Metric not found
    }

    // Apply aggregation if specified
    if (condition.aggregation && history.length > 0) {
      const values = history
        .slice(-10) // Last 10 data points
        .map(h => (h as any)[condition.metric] || 0);

      switch (condition.aggregation) {
        case 'avg':
          value = values.reduce((sum, v) => sum + v, 0) / values.length;
          break;
        case 'max':
          value = Math.max(...values);
          break;
        case 'min':
          value = Math.min(...values);
          break;
        case 'sum':
          value = values.reduce((sum, v) => sum + v, 0);
          break;
        case 'count':
          value = values.length;
          break;
      }
    }

    // Evaluate condition
    const conditionValue = condition.value;
    
    switch (condition.operator) {
      case '>':
        return Number(value) > Number(conditionValue);
      case '<':
        return Number(value) < Number(conditionValue);
      case '>=':
        return Number(value) >= Number(conditionValue);
      case '<=':
        return Number(value) <= Number(conditionValue);
      case '==':
        return value === conditionValue;
      case '!=':
        return value !== conditionValue;
      default:
        return false;
    }
  }

  private async analyzeFailureContext(
    agentId: string,
    rule: FailureDetectionRule,
    metrics: PerformanceMetrics,
    history: PerformanceMetrics[]
  ): Promise<FailureContext> {
    const context: FailureContext = {
      triggeredBy: rule.name,
      relatedEvents: [],
      affectedServices: [agentId],
      impactRadius: [agentId]
    };

    if (this.config.enableRootCauseAnalysis) {
      context.rootCauseAnalysis = await this.performRootCauseAnalysis(agentId, rule, metrics, history);
    }

    return context;
  }

  private async performRootCauseAnalysis(
    agentId: string,
    rule: FailureDetectionRule,
    metrics: PerformanceMetrics,
    history: PerformanceMetrics[]
  ): Promise<FailureContext['rootCauseAnalysis']> {
    // Simplified root cause analysis
    const causes: string[] = [];
    const factors: string[] = [];
    const recommendations: string[] = [];

    // Analyze metrics trends
    if (history.length >= 5) {
      const recent = history.slice(-5);
      const older = history.slice(-10, -5);

      // CPU analysis
      const avgRecentCPU = recent.reduce((sum, m) => sum + m.cpuUsage, 0) / recent.length;
      const avgOlderCPU = older.length > 0 ? older.reduce((sum, m) => sum + m.cpuUsage, 0) / older.length : 0;
      
      if (avgRecentCPU > avgOlderCPU * 1.5) {
        factors.push('CPU usage trending upward');
        recommendations.push('Investigate CPU-intensive processes');
      }

      // Memory analysis
      const avgRecentMemory = recent.reduce((sum, m) => sum + m.memoryUsage, 0) / recent.length;
      const avgOlderMemory = older.length > 0 ? older.reduce((sum, m) => sum + m.memoryUsage, 0) / older.length : 0;
      
      if (avgRecentMemory > avgOlderMemory * 1.3) {
        factors.push('Memory usage increasing');
        recommendations.push('Check for memory leaks');
      }

      // Error rate analysis
      if (metrics.errorRate > 5) {
        causes.push('High error rate detected');
        recommendations.push('Review recent deployments and logs');
      }
    }

    // Determine likely root cause
    let likelyRootCause = 'Unknown';
    let confidence = 0.5;

    if (rule.tier === FailureDetectionTier.PERFORMANCE) {
      if (metrics.cpuUsage > 90) {
        likelyRootCause = 'CPU resource exhaustion';
        confidence = 0.8;
      } else if (metrics.memoryUsage > 90) {
        likelyRootCause = 'Memory resource exhaustion';
        confidence = 0.8;
      } else if (metrics.responseTime > 10000) {
        likelyRootCause = 'Network or processing bottleneck';
        confidence = 0.7;
      }
    }

    return {
      likelyRootCause,
      confidence,
      contributingFactors: factors,
      recommendations
    };
  }

  private async handleFailure(failure: FailureEvent): Promise<void> {
    this.emit('failureDetected', failure);

    const rule = this.rules.get(failure.rule);
    if (!rule) return;

    // Execute failure action
    const actionResult = await this.executeFailureAction(failure, rule.action);
    failure.actions.push(actionResult);

    // Check for escalation
    if (failure.severity === FailureSeverity.CRITICAL || !actionResult.success) {
      await this.escalateFailure(failure);
    }
  }

  private async executeFailureAction(failure: FailureEvent, action: FailureAction): Promise<FailureActionResult> {
    const startTime = Date.now();
    const result: FailureActionResult = {
      action,
      timestamp: new Date(),
      success: false,
      details: '',
      executionTime: 0
    };

    try {
      switch (action) {
        case FailureAction.LOG:
          result.details = `Failure logged: ${failure.description}`;
          result.success = true;
          break;

        case FailureAction.ALERT:
          await this.sendAlert(failure);
          result.details = 'Alert sent to notification channels';
          result.success = true;
          break;

        case FailureAction.RESTART:
          await this.restartAgent(failure.agentId);
          result.details = 'Agent restart initiated';
          result.success = true;
          break;

        case FailureAction.CIRCUIT_BREAK:
          this.openCircuitBreaker(failure.agentId);
          result.details = 'Circuit breaker opened';
          result.success = true;
          break;

        case FailureAction.ISOLATE:
          await this.isolateAgent(failure.agentId);
          result.details = 'Agent isolated from traffic';
          result.success = true;
          break;

        case FailureAction.DRAIN_TRAFFIC:
          await this.drainTraffic(failure.agentId);
          result.details = 'Traffic drained from agent';
          result.success = true;
          break;

        default:
          result.details = `Action ${action} not implemented`;
          result.success = false;
      }

    } catch (error) {
      result.details = `Action failed: ${error.message}`;
      result.success = false;
    }

    result.executionTime = Date.now() - startTime;
    return result;
  }

  private async escalateFailure(failure: FailureEvent): Promise<void> {
    const defaultPolicy = this.escalationPolicies.get('default');
    if (!defaultPolicy) return;

    this.emit('failureEscalated', { 
      failure, 
      policy: defaultPolicy,
      timestamp: new Date() 
    });

    // Execute escalation actions
    for (const level of defaultPolicy.levels) {
      if (this.shouldExecuteEscalationLevel(failure, level)) {
        for (const action of level.actions) {
          await this.executeFailureAction(failure, action);
        }
      }
    }
  }

  private shouldExecuteEscalationLevel(failure: FailureEvent, level: EscalationLevel): boolean {
    // Simple escalation logic - in practice this would be more sophisticated
    const severityOrder = [FailureSeverity.LOW, FailureSeverity.MEDIUM, FailureSeverity.HIGH, FailureSeverity.CRITICAL];
    const failureSeverityIndex = severityOrder.indexOf(failure.severity);
    const requiredSeverityIndex = severityOrder.indexOf(level.requiredSeverity);
    
    return failureSeverityIndex >= requiredSeverityIndex;
  }

  private updateCircuitBreaker(agentId: string, metrics: PerformanceMetrics): void {
    const cb = this.circuitBreakers.get(agentId);
    if (!cb) return;

    cb.totalCalls++;

    // Determine if this is a failure based on metrics
    const isFailure = metrics.errorRate > 10 || metrics.responseTime > 30000;

    if (isFailure) {
      cb.failureCount++;
      cb.lastFailureTime = new Date();
      cb.successCount = 0; // Reset success count on failure
    } else {
      cb.successCount++;
    }

    // Update circuit breaker state
    this.evaluateCircuitBreakerState(cb);
  }

  private evaluateCircuitBreakerState(cb: CircuitBreakerState): void {
    const config = this.config.circuitBreaker;
    const now = Date.now();

    switch (cb.state) {
      case CircuitState.CLOSED:
        if (cb.failureCount >= config.failureThreshold) {
          this.transitionCircuitBreaker(cb, CircuitState.OPEN);
        }
        break;

      case CircuitState.OPEN:
        const timeSinceLastFailure = now - cb.lastFailureTime.getTime();
        if (timeSinceLastFailure >= config.timeout) {
          this.transitionCircuitBreaker(cb, CircuitState.HALF_OPEN);
        }
        break;

      case CircuitState.HALF_OPEN:
        if (cb.successCount >= config.successThreshold) {
          this.transitionCircuitBreaker(cb, CircuitState.CLOSED);
        } else if (cb.halfOpenCalls >= config.halfOpenMaxCalls && cb.failureCount > 0) {
          this.transitionCircuitBreaker(cb, CircuitState.OPEN);
        }
        break;
    }
  }

  private transitionCircuitBreaker(cb: CircuitBreakerState, newState: CircuitState): void {
    const oldState = cb.state;
    cb.state = newState;
    cb.lastStateChange = new Date();

    if (newState === CircuitState.CLOSED) {
      cb.failureCount = 0;
      cb.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      cb.halfOpenCalls = 0;
      cb.successCount = 0;
    }

    this.emit('circuitBreakerStateChanged', {
      agentId: cb.agentId,
      oldState,
      newState,
      timestamp: new Date()
    });
  }

  private openCircuitBreaker(agentId: string): void {
    const cb = this.circuitBreakers.get(agentId);
    if (cb && cb.state !== CircuitState.OPEN) {
      this.transitionCircuitBreaker(cb, CircuitState.OPEN);
    }
  }

  private getLatestMetrics(agentId: string): PerformanceMetrics | null {
    const history = this.metricsHistory.get(agentId);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  private cleanupResolvedFailures(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    for (const [id, failure] of this.activeFailures) {
      if (failure.resolved && failure.resolvedAt && failure.resolvedAt.getTime() < cutoff) {
        this.activeFailures.delete(id);
      }
    }
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.config.metricsRetentionTime;

    for (const [agentId, history] of this.metricsHistory) {
      const filtered = history.filter((metrics: any) => metrics.timestamp > cutoff);
      this.metricsHistory.set(agentId, filtered);
    }
  }

  // Action implementations (simplified)
  private async sendAlert(failure: FailureEvent): Promise<void> {
    // Implementation would send alerts via various channels
    console.log(`ALERT: ${failure.description} for agent ${failure.agentId}`);
  }

  private async restartAgent(agentId: string): Promise<void> {
    // Implementation would restart the agent
    console.log(`Restarting agent ${agentId}`);
  }

  private async isolateAgent(agentId: string): Promise<void> {
    // Implementation would isolate the agent from traffic
    console.log(`Isolating agent ${agentId}`);
  }

  private async drainTraffic(agentId: string): Promise<void> {
    // Implementation would drain traffic from the agent
    console.log(`Draining traffic from agent ${agentId}`);
  }

  private initializeDefaultRules(): void {
    // Default failure detection rules
    const rules: FailureDetectionRule[] = [
      {
        tier: FailureDetectionTier.HEARTBEAT,
        name: 'heartbeat_timeout',
        description: 'Agent heartbeat timeout',
        condition: {
          type: 'threshold',
          metric: 'last_heartbeat_age',
          operator: '>',
          value: 30000, // 30 seconds
        },
        action: FailureAction.RESTART,
        severity: FailureSeverity.HIGH,
        threshold: 1,
        timeWindow: 60000,
        escalationTime: 120000,
        enabled: true
      },
      {
        tier: FailureDetectionTier.PERFORMANCE,
        name: 'high_response_time',
        description: 'High response time detected',
        condition: {
          type: 'threshold',
          metric: 'responseTime',
          operator: '>',
          value: 10000, // 10 seconds
          aggregation: 'avg'
        },
        action: FailureAction.ALERT,
        severity: FailureSeverity.MEDIUM,
        threshold: 3,
        timeWindow: 300000,
        escalationTime: 600000,
        enabled: true
      },
      {
        tier: FailureDetectionTier.RESOURCE,
        name: 'high_cpu_usage',
        description: 'High CPU usage detected',
        condition: {
          type: 'threshold',
          metric: 'cpuUsage',
          operator: '>',
          value: 90,
          duration: 60000
        },
        action: FailureAction.CIRCUIT_BREAK,
        severity: FailureSeverity.CRITICAL,
        threshold: 1,
        timeWindow: 120000,
        escalationTime: 300000,
        enabled: true
      }
    ];

    rules.forEach(rule => this.addRule(rule));
  }

  private initializeDefaultEscalationPolicies(): void {
    const defaultPolicy: EscalationPolicy = {
      name: 'default',
      levels: [
        {
          level: 1,
          delay: 60000, // 1 minute
          actions: [FailureAction.ALERT],
          requiredSeverity: FailureSeverity.MEDIUM,
          notificationChannels: ['log', 'email'],
          approvalRequired: false
        },
        {
          level: 2,
          delay: 300000, // 5 minutes
          actions: [FailureAction.RESTART],
          requiredSeverity: FailureSeverity.HIGH,
          notificationChannels: ['log', 'email', 'slack'],
          approvalRequired: false
        },
        {
          level: 3,
          delay: 900000, // 15 minutes
          actions: [FailureAction.REPLACE],
          requiredSeverity: FailureSeverity.CRITICAL,
          notificationChannels: ['log', 'email', 'slack', 'pager'],
          approvalRequired: true
        }
      ],
      maxRetries: 3,
      baseDelay: 60000,
      backoffMultiplier: 2,
      maxDelay: 3600000
    };

    this.escalationPolicies.set('default', defaultPolicy);
  }
}

export default FailureDetector;