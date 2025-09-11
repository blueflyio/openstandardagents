/**
 * OSSA Comprehensive Health Check System
 * Multi-layered health monitoring with custom metrics, SLA tracking, and predictive analytics
 */

import { EventEmitter } from 'events';

export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical',
  UNKNOWN = 'unknown'
}

export enum CheckType {
  BASIC = 'basic',           // Simple ping/status check
  READINESS = 'readiness',   // Ready to serve traffic
  LIVENESS = 'liveness',     // Process is alive and working
  STARTUP = 'startup',       // Initial startup validation
  DEEP = 'deep',            // Comprehensive system check
  CUSTOM = 'custom',        // User-defined checks
  DEPENDENCY = 'dependency', // External dependency check
  PERFORMANCE = 'performance', // Performance metrics check
  SECURITY = 'security'      // Security posture check
}

export enum CheckProtocol {
  HTTP = 'http',
  HTTPS = 'https',
  TCP = 'tcp',
  UDP = 'udp',
  GRPC = 'grpc',
  WEBSOCKET = 'websocket',
  CUSTOM = 'custom'
}

export interface HealthCheckConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  retries: number;
  backoffFactor: number;
  gracePeriod: number; // Time before marking as unhealthy
  slidingWindow: number; // Number of recent checks to consider
  thresholds: {
    degraded: number;   // Success rate below this = degraded
    unhealthy: number;  // Success rate below this = unhealthy
    critical: number;   // Success rate below this = critical
  };
  alerting: {
    enabled: boolean;
    channels: string[];
    escalationDelay: number;
    suppressDuration: number;
  };
}

export interface HealthCheck {
  id: string;
  name: string;
  description: string;
  agentId: string;
  type: CheckType;
  protocol: CheckProtocol;
  config: HealthCheckConfig;
  endpoint: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  expectedResponse?: {
    status?: number;
    body?: any;
    headers?: Record<string, string>;
    contentType?: string;
  };
  customValidator?: (response: any) => Promise<HealthResult>;
  dependencies: string[]; // Other checks this depends on
  metadata: {
    priority: number;
    weight: number;
    category: string;
    tags: string[];
    sla?: SLARequirement;
  };
}

export interface SLARequirement {
  availability: number;    // 99.9% uptime
  responseTime: number;    // Max response time in ms
  errorRate: number;       // Max error rate percentage
  throughput: number;      // Min requests per second
  measurementWindow: number; // Time window for SLA measurement
}

export interface HealthResult {
  checkId: string;
  agentId: string;
  timestamp: Date;
  status: HealthStatus;
  responseTime: number;
  success: boolean;
  details: {
    message: string;
    data?: any;
    metrics?: Record<string, number>;
    warnings?: string[];
    errors?: string[];
  };
  metadata: {
    attempt: number;
    totalAttempts: number;
    protocol: CheckProtocol;
    endpoint: string;
  };
}

export interface HealthSummary {
  agentId: string;
  overallStatus: HealthStatus;
  lastUpdated: Date;
  checks: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
    critical: number;
    unknown: number;
  };
  sla: SLAStatus;
  trends: {
    uptime24h: number;
    avgResponseTime: number;
    errorRate: number;
    availability: number;
  };
  predictions: {
    nextFailureProbability: number;
    estimatedRecoveryTime?: number;
    riskFactors: string[];
  };
}

export interface SLAStatus {
  availability: {
    current: number;
    target: number;
    status: 'met' | 'at_risk' | 'violated';
    timeToViolation?: number;
  };
  responseTime: {
    current: number;
    target: number;
    status: 'met' | 'at_risk' | 'violated';
    percentile95: number;
    percentile99: number;
  };
  errorRate: {
    current: number;
    target: number;
    status: 'met' | 'at_risk' | 'violated';
  };
  throughput: {
    current: number;
    target: number;
    status: 'met' | 'at_risk' | 'violated';
  };
}

export interface HealthTrend {
  agentId: string;
  timeWindow: number;
  dataPoints: HealthTrendPoint[];
  analysis: {
    trend: 'improving' | 'stable' | 'degrading' | 'volatile';
    confidence: number;
    factors: string[];
    recommendations: string[];
  };
}

export interface HealthTrendPoint {
  timestamp: Date;
  status: HealthStatus;
  responseTime: number;
  errorRate: number;
  availability: number;
  throughput: number;
}

export interface HealthAlert {
  id: string;
  agentId: string;
  checkId: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  escalated: boolean;
  metadata: {
    category: string;
    tags: string[];
    related: string[];
  };
}

export interface PredictiveAnalysis {
  agentId: string;
  predictions: {
    failureProbability: number;
    timeToFailure?: number;
    recoveryTime?: number;
    maintenanceWindow?: Date;
  };
  riskFactors: RiskFactor[];
  recommendations: Recommendation[];
  confidence: number;
  basedOnDataPoints: number;
  lastAnalysis: Date;
}

export interface RiskFactor {
  type: 'performance' | 'availability' | 'dependency' | 'resource' | 'pattern';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  mitigations: string[];
}

export interface Recommendation {
  type: 'preventive' | 'corrective' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  implementation: string;
  estimatedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

export class HealthCheckSystem extends EventEmitter {
  private checks: Map<string, HealthCheck> = new Map();
  private results: Map<string, HealthResult[]> = new Map();
  private summaries: Map<string, HealthSummary> = new Map();
  private alerts: Map<string, HealthAlert[]> = new Map();
  private trends: Map<string, HealthTrend> = new Map();
  private checkIntervals: Map<string, NodeJS.Timeout> = new Map();
  private running = false;
  private predictor: HealthPredictor;
  private slaTracker: SLATracker;
  private alertManager: AlertManager;

  constructor() {
    super();
    this.predictor = new HealthPredictor();
    this.slaTracker = new SLATracker();
    this.alertManager = new AlertManager();
    
    this.startSystemMonitoring();
  }

  /**
   * Register health check for an agent
   */
  registerHealthCheck(check: HealthCheck): void {
    this.checks.set(check.id, check);
    
    // Initialize result history
    if (!this.results.has(check.agentId)) {
      this.results.set(check.agentId, []);
    }

    // Start monitoring if enabled
    if (check.config.enabled) {
      this.startMonitoring(check);
    }

    this.emit('checkRegistered', { check, timestamp: new Date() });
  }

  /**
   * Unregister health check
   */
  unregisterHealthCheck(checkId: string): void {
    const check = this.checks.get(checkId);
    if (check) {
      this.stopMonitoring(checkId);
      this.checks.delete(checkId);
      this.emit('checkUnregistered', { check, timestamp: new Date() });
    }
  }

  /**
   * Start monitoring for a specific check
   */
  startMonitoring(check: HealthCheck): void {
    if (this.checkIntervals.has(check.id)) {
      this.stopMonitoring(check.id);
    }

    const interval = setInterval(async () => {
      try {
        await this.performHealthCheck(check);
      } catch (error) {
        this.emit('checkError', {
          checkId: check.id,
          agentId: check.agentId,
          error: error.message,
          timestamp: new Date()
        });
      }
    }, check.config.interval);

    this.checkIntervals.set(check.id, interval);
  }

  /**
   * Stop monitoring for a specific check
   */
  stopMonitoring(checkId: string): void {
    const interval = this.checkIntervals.get(checkId);
    if (interval) {
      clearInterval(interval);
      this.checkIntervals.delete(checkId);
    }
  }

  /**
   * Perform immediate health check
   */
  async performHealthCheck(check: HealthCheck): Promise<HealthResult> {
    const startTime = Date.now();
    let result: HealthResult;

    try {
      // Execute the health check based on protocol
      const response = await this.executeCheck(check);
      
      // Validate response
      const isValid = await this.validateResponse(check, response);
      
      result = {
        checkId: check.id,
        agentId: check.agentId,
        timestamp: new Date(),
        status: isValid ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        success: isValid,
        details: {
          message: isValid ? 'Health check passed' : 'Health check failed',
          data: response,
          metrics: this.extractMetrics(response),
          warnings: [],
          errors: isValid ? [] : ['Validation failed']
        },
        metadata: {
          attempt: 1,
          totalAttempts: 1,
          protocol: check.protocol,
          endpoint: check.endpoint
        }
      };

    } catch (error) {
      result = {
        checkId: check.id,
        agentId: check.agentId,
        timestamp: new Date(),
        status: HealthStatus.CRITICAL,
        responseTime: Date.now() - startTime,
        success: false,
        details: {
          message: `Health check failed: ${error.message}`,
          errors: [error.message]
        },
        metadata: {
          attempt: 1,
          totalAttempts: 1,
          protocol: check.protocol,
          endpoint: check.endpoint
        }
      };

      // Retry logic
      if (check.config.retries > 0) {
        result = await this.retryHealthCheck(check, error, 1);
      }
    }

    // Store result
    this.storeResult(result);
    
    // Update summary
    await this.updateSummary(check.agentId);
    
    // Check for alerts
    await this.checkAlerts(check, result);

    this.emit('checkCompleted', result);
    
    return result;
  }

  /**
   * Get health summary for an agent
   */
  getHealthSummary(agentId: string): HealthSummary | null {
    return this.summaries.get(agentId) || null;
  }

  /**
   * Get health trends for an agent
   */
  getHealthTrends(agentId: string, timeWindow?: number): HealthTrend | null {
    const trend = this.trends.get(agentId);
    if (!trend || !timeWindow) return trend;

    // Filter data points by time window
    const cutoff = Date.now() - timeWindow;
    const filteredDataPoints = trend.dataPoints.filter(
      point => point.timestamp.getTime() > cutoff
    );

    return {
      ...trend,
      timeWindow,
      dataPoints: filteredDataPoints
    };
  }

  /**
   * Get predictive analysis for an agent
   */
  async getPredictiveAnalysis(agentId: string): Promise<PredictiveAnalysis | null> {
    const results = this.results.get(agentId);
    if (!results || results.length < 10) {
      return null; // Need sufficient data for prediction
    }

    return await this.predictor.analyze(agentId, results);
  }

  /**
   * Get SLA status for an agent
   */
  getSLAStatus(agentId: string): SLAStatus | null {
    const results = this.results.get(agentId);
    if (!results) return null;

    const checks = Array.from(this.checks.values())
      .filter(c => c.agentId === agentId && c.metadata.sla);

    if (checks.length === 0) return null;

    return this.slaTracker.calculateStatus(checks, results);
  }

  /**
   * Get active alerts for an agent
   */
  getActiveAlerts(agentId: string): HealthAlert[] {
    const alerts = this.alerts.get(agentId) || [];
    return alerts.filter(alert => !alert.resolvedAt);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): void {
    for (const [agentId, agentAlerts] of this.alerts) {
      const alert = agentAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        this.emit('alertAcknowledged', { alert, timestamp: new Date() });
        break;
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    for (const [agentId, agentAlerts] of this.alerts) {
      const alert = agentAlerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolvedAt = new Date();
        this.emit('alertResolved', { alert, timestamp: new Date() });
        break;
      }
    }
  }

  /**
   * Start system-wide health monitoring
   */
  start(): void {
    if (this.running) return;

    this.running = true;
    
    // Start monitoring for all enabled checks
    for (const check of this.checks.values()) {
      if (check.config.enabled) {
        this.startMonitoring(check);
      }
    }

    this.emit('systemStarted', { timestamp: new Date() });
  }

  /**
   * Stop system-wide health monitoring
   */
  stop(): void {
    if (!this.running) return;

    this.running = false;

    // Stop all monitoring
    for (const checkId of this.checkIntervals.keys()) {
      this.stopMonitoring(checkId);
    }

    this.emit('systemStopped', { timestamp: new Date() });
  }

  // Private methods

  private async executeCheck(check: HealthCheck): Promise<any> {
    switch (check.protocol) {
      case CheckProtocol.HTTP:
      case CheckProtocol.HTTPS:
        return await this.executeHttpCheck(check);
      case CheckProtocol.TCP:
        return await this.executeTcpCheck(check);
      case CheckProtocol.UDP:
        return await this.executeUdpCheck(check);
      case CheckProtocol.GRPC:
        return await this.executeGrpcCheck(check);
      case CheckProtocol.WEBSOCKET:
        return await this.executeWebSocketCheck(check);
      case CheckProtocol.CUSTOM:
        return await this.executeCustomCheck(check);
      default:
        throw new Error(`Unsupported protocol: ${check.protocol}`);
    }
  }

  private async executeHttpCheck(check: HealthCheck): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), check.config.timeout);

    try {
      const response = await fetch(check.endpoint, {
        method: check.method || 'GET',
        headers: check.headers || {},
        body: check.body ? JSON.stringify(check.body) : undefined,
        signal: controller.signal
      });

      const data = await response.json().catch(() => ({}));
      
      return {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
        ok: response.ok
      };

    } finally {
      clearTimeout(timeout);
    }
  }

  private async executeTcpCheck(check: HealthCheck): Promise<any> {
    // Simplified TCP check - in real implementation would use net module
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('TCP check timeout'));
      }, check.config.timeout);

      // Simulate TCP connection
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          connected: true,
          port: check.endpoint.split(':')[1] || 80
        });
      }, 50);
    });
  }

  private async executeUdpCheck(check: HealthCheck): Promise<any> {
    // Simplified UDP check
    return { connected: true };
  }

  private async executeGrpcCheck(check: HealthCheck): Promise<any> {
    // Simplified gRPC check
    return { status: 'SERVING' };
  }

  private async executeWebSocketCheck(check: HealthCheck): Promise<any> {
    // Simplified WebSocket check
    return { connected: true };
  }

  private async executeCustomCheck(check: HealthCheck): Promise<any> {
    if (check.customValidator) {
      return await check.customValidator({});
    }
    throw new Error('Custom check requires customValidator function');
  }

  private async validateResponse(check: HealthCheck, response: any): Promise<boolean> {
    if (check.customValidator) {
      const result = await check.customValidator(response);
      return result.success;
    }

    // Default validation for HTTP checks
    if (check.protocol === CheckProtocol.HTTP || check.protocol === CheckProtocol.HTTPS) {
      if (check.expectedResponse) {
        const expected = check.expectedResponse;
        
        if (expected.status && response.status !== expected.status) {
          return false;
        }
        
        if (expected.body && JSON.stringify(response.body) !== JSON.stringify(expected.body)) {
          return false;
        }
      }
      
      return response.ok;
    }

    // Default validation for other protocols
    return response.connected || response.status === 'SERVING';
  }

  private extractMetrics(response: any): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    if (typeof response.responseTime === 'number') {
      metrics.responseTime = response.responseTime;
    }
    
    if (typeof response.status === 'number') {
      metrics.httpStatus = response.status;
    }
    
    // Extract custom metrics from response body
    if (response.body && typeof response.body === 'object') {
      for (const [key, value] of Object.entries(response.body)) {
        if (typeof value === 'number') {
          metrics[`body_${key}`] = value;
        }
      }
    }
    
    return metrics;
  }

  private async retryHealthCheck(
    check: HealthCheck,
    lastError: Error,
    attempt: number
  ): Promise<HealthResult> {
    if (attempt >= check.config.retries) {
      throw lastError;
    }

    // Exponential backoff
    const delay = Math.min(
      1000 * Math.pow(check.config.backoffFactor, attempt),
      30000 // Max 30 seconds
    );
    
    await new Promise(resolve => setTimeout(resolve, delay));

    try {
      const startTime = Date.now();
      const response = await this.executeCheck(check);
      const isValid = await this.validateResponse(check, response);

      return {
        checkId: check.id,
        agentId: check.agentId,
        timestamp: new Date(),
        status: isValid ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY,
        responseTime: Date.now() - startTime,
        success: isValid,
        details: {
          message: isValid ? 'Health check passed after retry' : 'Health check failed after retry',
          data: response,
          metrics: this.extractMetrics(response)
        },
        metadata: {
          attempt: attempt + 1,
          totalAttempts: check.config.retries + 1,
          protocol: check.protocol,
          endpoint: check.endpoint
        }
      };

    } catch (error) {
      return await this.retryHealthCheck(check, error, attempt + 1);
    }
  }

  private storeResult(result: HealthResult): void {
    const results = this.results.get(result.agentId) || [];
    results.push(result);
    
    // Keep only recent results (sliding window)
    const maxResults = 1000; // Keep last 1000 results
    if (results.length > maxResults) {
      results.splice(0, results.length - maxResults);
    }
    
    this.results.set(result.agentId, results);
  }

  private async updateSummary(agentId: string): Promise<void> {
    const results = this.results.get(agentId) || [];
    const checks = Array.from(this.checks.values()).filter(c => c.agentId === agentId);
    
    if (results.length === 0) return;

    // Calculate check status distribution
    const recentResults = results.slice(-100); // Last 100 results
    const checkStats = {
      total: checks.length,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      critical: 0,
      unknown: 0
    };

    for (const check of checks) {
      const checkResults = recentResults.filter(r => r.checkId === check.id);
      if (checkResults.length > 0) {
        const latestResult = checkResults[checkResults.length - 1];
        checkStats[latestResult.status]++;
      } else {
        checkStats.unknown++;
      }
    }

    // Calculate overall status
    let overallStatus = HealthStatus.HEALTHY;
    if (checkStats.critical > 0) {
      overallStatus = HealthStatus.CRITICAL;
    } else if (checkStats.unhealthy > 0) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (checkStats.degraded > 0) {
      overallStatus = HealthStatus.DEGRADED;
    } else if (checkStats.unknown > 0) {
      overallStatus = HealthStatus.UNKNOWN;
    }

    // Calculate trends
    const last24h = results.filter(r => 
      r.timestamp.getTime() > Date.now() - (24 * 60 * 60 * 1000)
    );
    
    const uptime24h = last24h.length > 0 ? 
      (last24h.filter(r => r.success).length / last24h.length) * 100 : 0;
    
    const avgResponseTime = last24h.length > 0 ?
      last24h.reduce((sum, r) => sum + r.responseTime, 0) / last24h.length : 0;
    
    const errorRate = last24h.length > 0 ?
      ((last24h.length - last24h.filter(r => r.success).length) / last24h.length) * 100 : 0;

    // Get predictions
    const predictions = await this.predictor.analyze(agentId, results) || {
      nextFailureProbability: 0,
      riskFactors: []
    };

    const summary: HealthSummary = {
      agentId,
      overallStatus,
      lastUpdated: new Date(),
      checks: checkStats,
      sla: this.getSLAStatus(agentId) || {} as SLAStatus,
      trends: {
        uptime24h,
        avgResponseTime,
        errorRate,
        availability: uptime24h
      },
      predictions: {
        nextFailureProbability: predictions.nextFailureProbability,
        estimatedRecoveryTime: predictions.recoveryTime,
        riskFactors: predictions.riskFactors.map(rf => rf.description)
      }
    };

    this.summaries.set(agentId, summary);
    this.emit('summaryUpdated', { summary, timestamp: new Date() });
  }

  private async checkAlerts(check: HealthCheck, result: HealthResult): Promise<void> {
    if (!check.config.alerting.enabled) return;

    const shouldAlert = this.shouldGenerateAlert(check, result);
    
    if (shouldAlert) {
      const alert: HealthAlert = {
        id: `alert-${Date.now()}-${Math.random()}`,
        agentId: result.agentId,
        checkId: result.checkId,
        level: this.getAlertLevel(result.status),
        title: `Health check ${result.success ? 'recovered' : 'failed'}: ${check.name}`,
        description: result.details.message,
        timestamp: new Date(),
        acknowledged: false,
        escalated: false,
        metadata: {
          category: check.metadata.category,
          tags: check.metadata.tags,
          related: []
        }
      };

      const agentAlerts = this.alerts.get(result.agentId) || [];
      agentAlerts.push(alert);
      this.alerts.set(result.agentId, agentAlerts);

      this.emit('alertGenerated', alert);
      
      // Send to alert manager
      await this.alertManager.processAlert(alert, check.config.alerting);
    }
  }

  private shouldGenerateAlert(check: HealthCheck, result: HealthResult): boolean {
    // Get recent results for this check
    const results = this.results.get(result.agentId) || [];
    const checkResults = results
      .filter(r => r.checkId === check.id)
      .slice(-check.config.slidingWindow);

    if (checkResults.length === 0) return false;

    // Check if status changed
    const previousResult = checkResults[checkResults.length - 2];
    if (previousResult && previousResult.status !== result.status) {
      return true;
    }

    // Check thresholds
    const successRate = checkResults.filter(r => r.success).length / checkResults.length;
    
    if (successRate <= check.config.thresholds.critical) {
      return result.status === HealthStatus.CRITICAL;
    }
    
    if (successRate <= check.config.thresholds.unhealthy) {
      return result.status === HealthStatus.UNHEALTHY;
    }
    
    if (successRate <= check.config.thresholds.degraded) {
      return result.status === HealthStatus.DEGRADED;
    }

    return false;
  }

  private getAlertLevel(status: HealthStatus): HealthAlert['level'] {
    switch (status) {
      case HealthStatus.CRITICAL:
        return 'critical';
      case HealthStatus.UNHEALTHY:
        return 'error';
      case HealthStatus.DEGRADED:
        return 'warning';
      default:
        return 'info';
    }
  }

  private startSystemMonitoring(): void {
    // System-wide monitoring tasks
    setInterval(async () => {
      await this.updateTrends();
      await this.runPredictiveAnalysis();
      await this.cleanupOldData();
    }, 60000); // Every minute

    // SLA monitoring
    setInterval(async () => {
      await this.updateSLATracking();
    }, 300000); // Every 5 minutes
  }

  private async updateTrends(): Promise<void> {
    for (const [agentId, results] of this.results) {
      const trend = await this.calculateTrend(agentId, results);
      this.trends.set(agentId, trend);
    }
  }

  private async calculateTrend(agentId: string, results: HealthResult[]): Promise<HealthTrend> {
    const timeWindow = 24 * 60 * 60 * 1000; // 24 hours
    const cutoff = Date.now() - timeWindow;
    const recentResults = results.filter(r => r.timestamp.getTime() > cutoff);
    
    // Group by hour
    const hourlyData = new Map<number, HealthResult[]>();
    for (const result of recentResults) {
      const hour = Math.floor(result.timestamp.getTime() / (60 * 60 * 1000));
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(result);
    }

    // Create trend points
    const dataPoints: HealthTrendPoint[] = [];
    for (const [hour, hourResults] of hourlyData) {
      const successRate = hourResults.filter(r => r.success).length / hourResults.length;
      const avgResponseTime = hourResults.reduce((sum, r) => sum + r.responseTime, 0) / hourResults.length;
      
      let status = HealthStatus.HEALTHY;
      if (successRate < 0.5) status = HealthStatus.CRITICAL;
      else if (successRate < 0.8) status = HealthStatus.UNHEALTHY;
      else if (successRate < 0.95) status = HealthStatus.DEGRADED;

      dataPoints.push({
        timestamp: new Date(hour * 60 * 60 * 1000),
        status,
        responseTime: avgResponseTime,
        errorRate: (1 - successRate) * 100,
        availability: successRate * 100,
        throughput: hourResults.length
      });
    }

    // Analyze trend
    const analysis = this.analyzeTrend(dataPoints);

    return {
      agentId,
      timeWindow,
      dataPoints,
      analysis
    };
  }

  private analyzeTrend(dataPoints: HealthTrendPoint[]): HealthTrend['analysis'] {
    if (dataPoints.length < 2) {
      return {
        trend: 'stable',
        confidence: 0,
        factors: [],
        recommendations: []
      };
    }

    // Calculate trend direction
    const first = dataPoints[0];
    const last = dataPoints[dataPoints.length - 1];
    
    const availabilityChange = last.availability - first.availability;
    const responseTimeChange = last.responseTime - first.responseTime;
    
    let trend: HealthTrend['analysis']['trend'] = 'stable';
    if (availabilityChange > 5 && responseTimeChange < 100) {
      trend = 'improving';
    } else if (availabilityChange < -5 || responseTimeChange > 200) {
      trend = 'degrading';
    }
    
    // Check for volatility
    const volatility = this.calculateVolatility(dataPoints);
    if (volatility > 0.3) {
      trend = 'volatile';
    }

    return {
      trend,
      confidence: Math.min(dataPoints.length / 24, 1), // More data = higher confidence
      factors: this.identifyTrendFactors(dataPoints),
      recommendations: this.generateTrendRecommendations(trend, dataPoints)
    };
  }

  private calculateVolatility(dataPoints: HealthTrendPoint[]): number {
    if (dataPoints.length < 3) return 0;
    
    const values = dataPoints.map(dp => dp.availability);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean;
  }

  private identifyTrendFactors(dataPoints: HealthTrendPoint[]): string[] {
    const factors: string[] = [];
    
    const avgResponseTime = dataPoints.reduce((sum, dp) => sum + dp.responseTime, 0) / dataPoints.length;
    if (avgResponseTime > 1000) {
      factors.push('High response times detected');
    }
    
    const avgErrorRate = dataPoints.reduce((sum, dp) => sum + dp.errorRate, 0) / dataPoints.length;
    if (avgErrorRate > 5) {
      factors.push('Elevated error rates');
    }
    
    return factors;
  }

  private generateTrendRecommendations(
    trend: HealthTrend['analysis']['trend'],
    dataPoints: HealthTrendPoint[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (trend === 'degrading') {
      recommendations.push('Investigate root cause of performance degradation');
      recommendations.push('Consider scaling resources or optimizing code');
    } else if (trend === 'volatile') {
      recommendations.push('Identify sources of instability');
      recommendations.push('Implement more robust error handling');
    } else if (trend === 'improving') {
      recommendations.push('Monitor to ensure continued improvement');
    }
    
    return recommendations;
  }

  private async runPredictiveAnalysis(): Promise<void> {
    for (const [agentId, results] of this.results) {
      if (results.length >= 50) { // Need sufficient data
        await this.predictor.analyze(agentId, results);
      }
    }
  }

  private async updateSLATracking(): Promise<void> {
    for (const [agentId, results] of this.results) {
      const checks = Array.from(this.checks.values()).filter(c => c.agentId === agentId);
      this.slaTracker.update(agentId, checks, results);
    }
  }

  private cleanupOldData(): void {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    
    for (const [agentId, results] of this.results) {
      const filtered = results.filter(r => r.timestamp.getTime() > cutoff);
      this.results.set(agentId, filtered);
    }

    for (const [agentId, alerts] of this.alerts) {
      const filtered = alerts.filter(a => 
        a.timestamp.getTime() > cutoff || !a.resolvedAt
      );
      this.alerts.set(agentId, filtered);
    }
  }
}

// Helper classes (simplified implementations)

class HealthPredictor {
  async analyze(agentId: string, results: HealthResult[]): Promise<PredictiveAnalysis> {
    // Simplified predictive analysis
    const recentFailures = results.slice(-50).filter(r => !r.success).length;
    const failureProbability = Math.min(recentFailures / 50, 1);
    
    return {
      agentId,
      predictions: {
        failureProbability,
        timeToFailure: failureProbability > 0.5 ? 3600000 : undefined, // 1 hour
        recoveryTime: 600000, // 10 minutes
      },
      riskFactors: [
        {
          type: 'performance',
          description: 'Recent performance degradation',
          impact: 'medium',
          probability: failureProbability,
          mitigations: ['Scale resources', 'Optimize code']
        }
      ],
      recommendations: [
        {
          type: 'preventive',
          priority: 'medium',
          description: 'Monitor resource usage closely',
          implementation: 'Add resource monitoring alerts',
          estimatedImpact: 'Prevent resource exhaustion',
          effort: 'low'
        }
      ],
      confidence: Math.min(results.length / 100, 1),
      basedOnDataPoints: results.length,
      lastAnalysis: new Date()
    };
  }
}

class SLATracker {
  calculateStatus(checks: HealthCheck[], results: HealthResult[]): SLAStatus {
    // Simplified SLA calculation
    const recentResults = results.slice(-1000);
    const successRate = recentResults.filter(r => r.success).length / recentResults.length;
    const avgResponseTime = recentResults.reduce((sum, r) => sum + r.responseTime, 0) / recentResults.length;
    
    return {
      availability: {
        current: successRate * 100,
        target: 99.9,
        status: successRate >= 0.999 ? 'met' : 'violated'
      },
      responseTime: {
        current: avgResponseTime,
        target: 1000,
        status: avgResponseTime <= 1000 ? 'met' : 'violated',
        percentile95: this.calculatePercentile(recentResults.map(r => r.responseTime), 95),
        percentile99: this.calculatePercentile(recentResults.map(r => r.responseTime), 99)
      },
      errorRate: {
        current: (1 - successRate) * 100,
        target: 1,
        status: (1 - successRate) * 100 <= 1 ? 'met' : 'violated'
      },
      throughput: {
        current: recentResults.length / 3600, // Per hour
        target: 100,
        status: recentResults.length / 3600 >= 100 ? 'met' : 'violated'
      }
    };
  }

  update(agentId: string, checks: HealthCheck[], results: HealthResult[]): void {
    // Update SLA tracking
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
}

class AlertManager {
  async processAlert(alert: HealthAlert, config: HealthCheckConfig['alerting']): Promise<void> {
    // Process alert through configured channels
    for (const channel of config.channels) {
      await this.sendToChannel(channel, alert);
    }
  }

  private async sendToChannel(channel: string, alert: HealthAlert): Promise<void> {
    // Implementation would send to actual channels (email, slack, etc.)
    console.log(`Sending alert to ${channel}: ${alert.title}`);
  }
}

export default HealthCheckSystem;