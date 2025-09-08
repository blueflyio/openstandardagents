/**
 * OSSA Monitoring Engine
 * 
 * Advanced monitoring system for 99.97% uptime SLA validation with real-time
 * alerting, incident management, and comprehensive system health tracking.
 */

import { EventEmitter } from 'events';
import {
  TelemetryAlert,
  AlertSeverity,
  AlertStatus,
  UptimeMetrics,
  TelemetryHealthCheck,
  TelemetryEvent,
  TelemetryEventType,
  AgentStatus,
  TelemetryConfiguration,
  AlertRule,
  AlertCondition,
  AlertChannel
} from './types.js';
import { KPICollector } from './kpi-collector.js';
import { ScorecardSystem } from './scorecard-system.js';

export interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  startTime: Date;
  endTime?: Date;
  affectedAgents: string[];
  rootCause?: string;
  resolution?: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  mttr?: number; // Mean Time To Recovery in minutes
}

export interface SLABreach {
  id: string;
  timestamp: Date;
  agentId?: string;
  breachType: 'availability' | 'performance' | 'reliability';
  currentValue: number;
  slaTarget: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // Duration of breach in minutes
}

export interface MonitoringConfiguration {
  slaTarget: number; // 99.97% uptime target
  checkInterval: number; // Health check interval in milliseconds
  alertingEnabled: boolean;
  incidentManagement: boolean;
  breachThresholds: {
    availability: number;
    performance: number;
    reliability: number;
  };
  escalationRules: {
    criticalAfter: number; // Minutes before escalating to critical
    emergencyAfter: number; // Minutes before escalating to emergency
  };
}

export class MonitoringEngine extends EventEmitter {
  private kpiCollector: KPICollector;
  private scorecardSystem: ScorecardSystem;
  private config: MonitoringConfiguration;
  private telemetryConfig: TelemetryConfiguration;
  
  private activeAlerts: Map<string, TelemetryAlert> = new Map();
  private alertHistory: TelemetryAlert[] = [];
  private incidents: Map<string, IncidentRecord> = new Map();
  private slaBreaches: SLABreach[] = [];
  private uptimeMetrics: UptimeMetrics;
  
  private monitoringInterval?: NodeJS.Timer;
  private healthCheckInterval?: NodeJS.Timer;
  private isRunning: boolean = false;
  
  private alertRuleCache: Map<string, AlertRule> = new Map();
  private lastHealthCheck?: TelemetryHealthCheck;

  constructor(
    kpiCollector: KPICollector,
    scorecardSystem: ScorecardSystem,
    config: MonitoringConfiguration,
    telemetryConfig: TelemetryConfiguration
  ) {
    super();
    this.kpiCollector = kpiCollector;
    this.scorecardSystem = scorecardSystem;
    this.config = config;
    this.telemetryConfig = telemetryConfig;
    
    this.initializeUptimeMetrics();
    this.loadAlertRules();
  }

  /**
   * Start the monitoring engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Monitoring Engine is already running');
    }

    console.log('[Monitoring Engine] Starting 99.97% uptime SLA monitoring...');
    
    // Start monitoring intervals
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, this.config.checkInterval);

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval / 2); // More frequent health checks

    this.isRunning = true;
    console.log('[Monitoring Engine] Monitoring engine started');
    
    // Perform initial health check
    await this.performHealthCheck();
  }

  /**
   * Stop the monitoring engine
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('[Monitoring Engine] Stopping monitoring engine...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    this.isRunning = false;
    console.log('[Monitoring Engine] Monitoring engine stopped');
  }

  /**
   * Get current uptime metrics
   */
  public getUptimeMetrics(): UptimeMetrics {
    return { ...this.uptimeMetrics };
  }

  /**
   * Get current system health
   */
  public getSystemHealth(): TelemetryHealthCheck | undefined {
    return this.lastHealthCheck ? { ...this.lastHealthCheck } : undefined;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): TelemetryAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alerts by severity
   */
  public getAlertsBySeverity(severity: AlertSeverity): TelemetryAlert[] {
    return this.getActiveAlerts().filter(alert => alert.severity === severity);
  }

  /**
   * Get alert history
   */
  public getAlertHistory(limit?: number): TelemetryAlert[] {
    const history = [...this.alertHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Get current incidents
   */
  public getIncidents(): IncidentRecord[] {
    return Array.from(this.incidents.values());
  }

  /**
   * Get open incidents
   */
  public getOpenIncidents(): IncidentRecord[] {
    return this.getIncidents().filter(incident => incident.status === 'open' || incident.status === 'investigating');
  }

  /**
   * Get SLA breaches
   */
  public getSLABreaches(limit?: number): SLABreach[] {
    const breaches = [...this.slaBreaches].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? breaches.slice(0, limit) : breaches;
  }

  /**
   * Acknowledge an alert
   */
  public acknowledgeAlert(alertId: string, acknowledgedBy: string, comment?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== AlertStatus.ACTIVE) {
      return false;
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.ack = {
      by: acknowledgedBy,
      at: new Date(),
      comment
    };

    this.activeAlerts.set(alertId, alert);
    
    // Emit acknowledgment event
    this.emitTelemetryEvent(TelemetryEventType.ALERT_TRIGGERED, {
      action: 'acknowledged',
      alert,
      acknowledgedBy,
      comment
    });

    console.log(`[Monitoring Engine] Alert ${alertId} acknowledged by ${acknowledgedBy}`);
    return true;
  }

  /**
   * Resolve an alert
   */
  public resolveAlert(alertId: string, resolvedBy: string, resolution?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.status = AlertStatus.RESOLVED;
    
    // Move to history
    this.alertHistory.push(alert);
    this.activeAlerts.delete(alertId);

    // Update related incident if exists
    const relatedIncidents = this.getIncidents().filter(incident => 
      incident.affectedAgents.includes(alert.agentId || '') ||
      incident.title.includes(alert.title)
    );

    for (const incident of relatedIncidents) {
      if (incident.status === 'open' || incident.status === 'investigating') {
        incident.resolution = resolution;
        incident.endTime = new Date();
        incident.status = 'resolved';
        incident.mttr = this.calculateMTTR(incident.startTime, incident.endTime);
      }
    }

    // Emit resolution event
    this.emitTelemetryEvent(TelemetryEventType.ALERT_RESOLVED, {
      alert,
      resolvedBy,
      resolution
    });

    console.log(`[Monitoring Engine] Alert ${alertId} resolved by ${resolvedBy}`);
    return true;
  }

  /**
   * Create a new incident
   */
  public createIncident(
    title: string,
    description: string,
    severity: AlertSeverity,
    affectedAgents: string[]
  ): string {
    const incident: IncidentRecord = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description,
      severity,
      startTime: new Date(),
      affectedAgents,
      status: 'open'
    };

    this.incidents.set(incident.id, incident);
    
    // Emit incident creation event
    this.emitTelemetryEvent(TelemetryEventType.SYSTEM_HEALTH_CHANGED, {
      action: 'incident_created',
      incident
    });

    console.log(`[Monitoring Engine] Incident created: ${incident.id} - ${title}`);
    return incident.id;
  }

  /**
   * Force SLA breach check for testing
   */
  public async checkSLACompliance(): Promise<{
    overallCompliance: number;
    breaches: SLABreach[];
    atRiskAgents: string[];
  }> {
    const scorecards = this.scorecardSystem.getAllScorecards();
    const breaches: SLABreach[] = [];
    const atRiskAgents: string[] = [];
    let totalCompliance = 0;

    for (const scorecard of scorecards) {
      totalCompliance += scorecard.slaCompliance;

      // Check for availability breaches
      if (scorecard.metrics.availability < this.config.breachThresholds.availability) {
        const breach: SLABreach = {
          id: `breach_${Date.now()}_${scorecard.agentId}`,
          timestamp: new Date(),
          agentId: scorecard.agentId,
          breachType: 'availability',
          currentValue: scorecard.metrics.availability,
          slaTarget: this.config.slaTarget,
          impact: this.determineSLAImpact(scorecard.metrics.availability),
          duration: this.calculateBreachDuration(scorecard.agentId, 'availability')
        };

        breaches.push(breach);
        this.slaBreaches.push(breach);

        // Emit SLA breach event
        this.emitTelemetryEvent(TelemetryEventType.SLA_BREACH, {
          breach,
          agent: scorecard
        });
      }

      // Check for performance breaches
      if (scorecard.metrics.performance < this.config.breachThresholds.performance) {
        const breach: SLABreach = {
          id: `breach_${Date.now()}_${scorecard.agentId}_perf`,
          timestamp: new Date(),
          agentId: scorecard.agentId,
          breachType: 'performance',
          currentValue: scorecard.metrics.performance,
          slaTarget: this.config.breachThresholds.performance,
          impact: this.determineSLAImpact(scorecard.metrics.performance),
          duration: this.calculateBreachDuration(scorecard.agentId, 'performance')
        };

        breaches.push(breach);
        this.slaBreaches.push(breach);
      }

      // Check for reliability breaches
      if (scorecard.metrics.reliability < this.config.breachThresholds.reliability) {
        const breach: SLABreach = {
          id: `breach_${Date.now()}_${scorecard.agentId}_rel`,
          timestamp: new Date(),
          agentId: scorecard.agentId,
          breachType: 'reliability',
          currentValue: scorecard.metrics.reliability,
          slaTarget: this.config.breachThresholds.reliability,
          impact: this.determineSLAImpact(scorecard.metrics.reliability),
          duration: this.calculateBreachDuration(scorecard.agentId, 'reliability')
        };

        breaches.push(breach);
        this.slaBreaches.push(breach);
      }

      // Identify at-risk agents
      if (scorecard.slaCompliance < this.config.slaTarget * 1.001) { // Within 0.1% of breach
        atRiskAgents.push(scorecard.agentId);
      }
    }

    const overallCompliance = scorecards.length > 0 ? totalCompliance / scorecards.length : 100;

    return {
      overallCompliance,
      breaches,
      atRiskAgents
    };
  }

  /**
   * Initialize uptime metrics
   */
  private initializeUptimeMetrics(): void {
    this.uptimeMetrics = {
      overallUptime: 100,
      slaTarget: this.config.slaTarget,
      periodStart: new Date(),
      totalDowntime: 0,
      incidentCount: 0,
      mttr: 0,
      mtbf: 0
    };
  }

  /**
   * Load alert rules from configuration
   */
  private loadAlertRules(): void {
    if (!this.telemetryConfig.alerts.rules) return;

    for (const rule of this.telemetryConfig.alerts.rules) {
      this.alertRuleCache.set(rule.id, rule);
    }

    console.log(`[Monitoring Engine] Loaded ${this.alertRuleCache.size} alert rules`);
  }

  /**
   * Perform monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Check alert rules
      await this.checkAlertRules();
      
      // Update uptime metrics
      await this.updateUptimeMetrics();
      
      // Check for SLA breaches
      await this.checkSLACompliance();
      
      // Process incident escalation
      this.processIncidentEscalation();
      
      // Clean up old data
      this.performDataCleanup();

    } catch (error) {
      console.error('[Monitoring Engine] Error in monitoring cycle:', error);
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const systemStats = this.scorecardSystem.getSystemStats();
      const kpiStats = this.kpiCollector.getSystemStats();
      const activeAlerts = this.getActiveAlerts();

      const healthCheck: TelemetryHealthCheck = {
        status: this.determineSystemStatus(systemStats, activeAlerts),
        activeAgents: systemStats.activeAgents,
        totalAgents: systemStats.totalAgents,
        currentUptime: systemStats.averageSLACompliance,
        slaCompliance: {
          current: systemStats.averageSLACompliance,
          target: this.config.slaTarget,
          status: this.determineSLAStatus(systemStats.averageSLACompliance)
        },
        activeAlerts: {
          critical: activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length,
          warning: activeAlerts.filter(a => a.severity === AlertSeverity.WARNING).length,
          info: activeAlerts.filter(a => a.severity === AlertSeverity.INFO).length
        },
        performance: {
          avgResponseTime: this.calculateSystemResponseTime(),
          totalThroughput: this.calculateSystemThroughput(),
          errorRate: this.calculateSystemErrorRate()
        },
        timestamp: new Date()
      };

      // Compare with previous health check
      const previousHealth = this.lastHealthCheck;
      this.lastHealthCheck = healthCheck;

      // Emit health change event if status changed
      if (previousHealth && previousHealth.status !== healthCheck.status) {
        this.emitTelemetryEvent(TelemetryEventType.SYSTEM_HEALTH_CHANGED, {
          newStatus: healthCheck.status,
          previousStatus: previousHealth.status,
          healthCheck
        });
      }

    } catch (error) {
      console.error('[Monitoring Engine] Error performing health check:', error);
    }
  }

  /**
   * Check alert rules
   */
  private async checkAlertRules(): Promise<void> {
    for (const [ruleId, rule] of this.alertRuleCache) {
      if (!rule.enabled) continue;

      try {
        const shouldAlert = await this.evaluateAlertRule(rule);
        
        if (shouldAlert && !this.isAlertActive(rule)) {
          await this.triggerAlert(rule);
        } else if (!shouldAlert && this.isAlertActive(rule)) {
          // Auto-resolve alert if condition no longer met
          const activeAlert = this.findActiveAlert(rule);
          if (activeAlert) {
            this.resolveAlert(activeAlert.id, 'system', 'Condition no longer met');
          }
        }
      } catch (error) {
        console.error(`[Monitoring Engine] Error evaluating alert rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Evaluate alert rule condition
   */
  private async evaluateAlertRule(rule: AlertRule): Promise<boolean> {
    const currentValue = this.kpiCollector.getKPI(rule.kpiId);
    if (currentValue === undefined) return false;

    const condition = rule.condition;
    let conditionMet = false;

    switch (condition.operator) {
      case 'gt':
        conditionMet = currentValue > condition.threshold;
        break;
      case 'lt':
        conditionMet = currentValue < condition.threshold;
        break;
      case 'eq':
        conditionMet = currentValue === condition.threshold;
        break;
      case 'ne':
        conditionMet = currentValue !== condition.threshold;
        break;
      case 'gte':
        conditionMet = currentValue >= condition.threshold;
        break;
      case 'lte':
        conditionMet = currentValue <= condition.threshold;
        break;
    }

    // Check if condition has persisted for required duration
    if (conditionMet && condition.duration > 0) {
      // This would require tracking condition state over time
      // For simplicity, assuming condition has persisted
      return true;
    }

    return conditionMet;
  }

  /**
   * Check if alert is currently active for a rule
   */
  private isAlertActive(rule: AlertRule): boolean {
    return Array.from(this.activeAlerts.values()).some(alert => 
      alert.kpiId === rule.kpiId && alert.status === AlertStatus.ACTIVE
    );
  }

  /**
   * Find active alert for a rule
   */
  private findActiveAlert(rule: AlertRule): TelemetryAlert | undefined {
    return Array.from(this.activeAlerts.values()).find(alert => 
      alert.kpiId === rule.kpiId && alert.status === AlertStatus.ACTIVE
    );
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule): Promise<void> {
    const alert: TelemetryAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity: rule.severity,
      title: `${rule.name} Alert`,
      message: `KPI ${rule.kpiId} threshold breached`,
      kpiId: rule.kpiId,
      timestamp: new Date(),
      status: AlertStatus.ACTIVE
    };

    this.activeAlerts.set(alert.id, alert);
    
    // Send alert notifications
    if (this.config.alertingEnabled) {
      await this.sendAlertNotifications(alert, rule);
    }

    // Emit alert event
    this.emitTelemetryEvent(TelemetryEventType.ALERT_TRIGGERED, {
      alert,
      rule
    });

    console.log(`[Monitoring Engine] Alert triggered: ${alert.title} (${alert.id})`);
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(alert: TelemetryAlert, rule: AlertRule): Promise<void> {
    // This would integrate with actual notification systems
    console.log(`[Monitoring Engine] Would send notifications for alert ${alert.id} to channels: ${rule.channels.join(', ')}`);
  }

  /**
   * Update uptime metrics
   */
  private async updateUptimeMetrics(): Promise<void> {
    const systemStats = this.scorecardSystem.getSystemStats();
    const currentTime = new Date();
    
    // Calculate overall uptime based on agent availability
    this.uptimeMetrics.overallUptime = systemStats.averageSLACompliance;
    
    // Update incident count
    this.uptimeMetrics.incidentCount = Array.from(this.incidents.values())
      .filter(incident => incident.startTime >= this.uptimeMetrics.periodStart).length;
    
    // Calculate MTTR (Mean Time To Recovery)
    const resolvedIncidents = Array.from(this.incidents.values())
      .filter(incident => incident.status === 'resolved' && incident.mttr);
    
    if (resolvedIncidents.length > 0) {
      this.uptimeMetrics.mttr = resolvedIncidents.reduce((sum, incident) => 
        sum + (incident.mttr || 0), 0) / resolvedIncidents.length;
    }
    
    // Calculate MTBF (Mean Time Between Failures)
    if (this.uptimeMetrics.incidentCount > 1) {
      const periodHours = (currentTime.getTime() - this.uptimeMetrics.periodStart.getTime()) / (1000 * 60 * 60);
      this.uptimeMetrics.mtbf = periodHours / (this.uptimeMetrics.incidentCount - 1);
    }
  }

  /**
   * Process incident escalation
   */
  private processIncidentEscalation(): void {
    const now = Date.now();
    
    for (const [incidentId, incident] of this.incidents) {
      if (incident.status !== 'open' && incident.status !== 'investigating') continue;
      
      const minutesOpen = (now - incident.startTime.getTime()) / (1000 * 60);
      
      // Escalate to critical after configured time
      if (minutesOpen >= this.config.escalationRules.criticalAfter && 
          incident.severity !== AlertSeverity.CRITICAL && 
          incident.severity !== AlertSeverity.EMERGENCY) {
        
        incident.severity = AlertSeverity.CRITICAL;
        console.log(`[Monitoring Engine] Incident ${incidentId} escalated to CRITICAL`);
      }
      
      // Escalate to emergency after configured time
      if (minutesOpen >= this.config.escalationRules.emergencyAfter && 
          incident.severity !== AlertSeverity.EMERGENCY) {
        
        incident.severity = AlertSeverity.EMERGENCY;
        console.log(`[Monitoring Engine] Incident ${incidentId} escalated to EMERGENCY`);
      }
    }
  }

  /**
   * Perform data cleanup
   */
  private performDataCleanup(): void {
    // Clean up old alert history
    const maxHistoryAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    const cutoffTime = Date.now() - maxHistoryAge;
    
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.timestamp.getTime() >= cutoffTime
    );
    
    // Clean up old SLA breaches
    this.slaBreaches = this.slaBreaches.filter(breach => 
      breach.timestamp.getTime() >= cutoffTime
    );
  }

  /**
   * Determine system status
   */
  private determineSystemStatus(
    systemStats: any, 
    activeAlerts: TelemetryAlert[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const criticalAlerts = activeAlerts.filter(a => a.severity === AlertSeverity.CRITICAL).length;
    const emergencyAlerts = activeAlerts.filter(a => a.severity === AlertSeverity.EMERGENCY).length;
    
    if (emergencyAlerts > 0 || systemStats.averageSLACompliance < 95) {
      return 'unhealthy';
    }
    
    if (criticalAlerts > 0 || systemStats.averageSLACompliance < 99) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  /**
   * Determine SLA status
   */
  private determineSLAStatus(compliance: number): 'compliant' | 'at-risk' | 'breach' {
    if (compliance >= this.config.slaTarget) return 'compliant';
    if (compliance >= this.config.slaTarget * 0.999) return 'at-risk'; // Within 0.1%
    return 'breach';
  }

  /**
   * Calculate system-wide metrics
   */
  private calculateSystemResponseTime(): number {
    return this.kpiCollector.calculateAggregation('response_time', 'avg' as any, 60000);
  }

  private calculateSystemThroughput(): number {
    return this.kpiCollector.calculateAggregation('throughput', 'sum' as any, 60000);
  }

  private calculateSystemErrorRate(): number {
    return this.kpiCollector.calculateAggregation('error_rate', 'avg' as any, 60000);
  }

  /**
   * Determine SLA impact level
   */
  private determineSLAImpact(value: number): 'low' | 'medium' | 'high' | 'critical' {
    if (value < 90) return 'critical';
    if (value < 95) return 'high';
    if (value < 99) return 'medium';
    return 'low';
  }

  /**
   * Calculate breach duration
   */
  private calculateBreachDuration(agentId: string, breachType: string): number {
    // This would calculate how long the breach has been occurring
    // For simplicity, returning a placeholder value
    return 5; // 5 minutes
  }

  /**
   * Calculate MTTR
   */
  private calculateMTTR(startTime: Date, endTime: Date): number {
    return (endTime.getTime() - startTime.getTime()) / (1000 * 60); // Minutes
  }

  /**
   * Emit telemetry event
   */
  private emitTelemetryEvent(type: TelemetryEventType, payload: any): void {
    const event: TelemetryEvent = {
      type,
      payload,
      timestamp: new Date()
    };

    this.emit('telemetry_event', event);
    this.emit(type.toLowerCase(), payload);
  }
}