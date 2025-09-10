/**
 * OSSA Agent Scorecard System
 * 
 * Advanced scorecard system for tracking and validating 127 production agents
 * with comprehensive health scoring, SLA compliance, and real-time updates.
 */

import { EventEmitter } from 'events';
import {
  AgentScorecard,
  AgentStatus,
  TelemetryEvent,
  TelemetryEventType,
  UptimeMetrics,
  TelemetryConfiguration,
  TelemetryMetric,
  KPIDefinition
} from './types.js';
import { KPICollector } from './kpi-collector.js';

export interface ScorecardWeights {
  availability: number;
  performance: number;
  reliability: number;
  compliance: number;
}

export interface AgentValidationRule {
  id: string;
  name: string;
  description: string;
  weight: number;
  validator: (scorecard: AgentScorecard, metrics: TelemetryMetric[]) => {
    score: number;
    status: 'pass' | 'warning' | 'fail';
    details: string;
  };
}

export interface ScorecardConfiguration {
  weights: ScorecardWeights;
  validationRules: AgentValidationRule[];
  slaTarget: number;
  updateInterval: number;
  alertThresholds: {
    critical: number;
    warning: number;
  };
}

export class ScorecardSystem extends EventEmitter {
  private scorecards: Map<string, AgentScorecard> = new Map();
  private kpiCollector: KPICollector;
  private config: ScorecardConfiguration;
  private telemetryConfig: TelemetryConfiguration;
  private updateInterval?: NodeJS.Timer;
  private isRunning: boolean = false;
  private validationRules: Map<string, AgentValidationRule> = new Map();
  private agentRegistrationTime: Map<string, Date> = new Map();

  constructor(
    kpiCollector: KPICollector,
    config: ScorecardConfiguration,
    telemetryConfig: TelemetryConfiguration
  ) {
    super();
    this.kpiCollector = kpiCollector;
    this.config = config;
    this.telemetryConfig = telemetryConfig;
    this.initializeValidationRules();
  }

  /**
   * Start the scorecard system
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Scorecard System is already running');
    }

    console.log('[Scorecard System] Starting agent scorecard tracking for 127 agents...');
    
    // Start periodic updates
    this.updateInterval = setInterval(() => {
      this.updateAllScorecards();
    }, this.config.updateInterval);

    this.isRunning = true;
    console.log('[Scorecard System] Scorecard system started');
  }

  /**
   * Stop the scorecard system
   */
  public async stop(): Promise<void> {
    if (!this.isRunning || !this.updateInterval) {
      return;
    }

    console.log('[Scorecard System] Stopping scorecard system...');
    clearInterval(this.updateInterval);
    this.isRunning = false;
    console.log('[Scorecard System] Scorecard system stopped');
  }

  /**
   * Register a new agent for tracking
   */
  public registerAgent(agentId: string, agentName: string): void {
    if (this.scorecards.has(agentId)) {
      console.warn(`[Scorecard System] Agent ${agentId} already registered`);
      return;
    }

    const scorecard: AgentScorecard = {
      agentId,
      agentName,
      healthScore: 0,
      metrics: {
        availability: 0,
        performance: 0,
        reliability: 0,
        compliance: 0
      },
      status: AgentStatus.OFFLINE,
      lastUpdate: new Date(),
      slaCompliance: 0,
      errorCount: 0,
      avgResponseTime: 0,
      throughput: 0
    };

    this.scorecards.set(agentId, scorecard);
    this.agentRegistrationTime.set(agentId, new Date());
    
    console.log(`[Scorecard System] Registered agent: ${agentName} (${agentId})`);
    
    // Emit agent registration event
    this.emitAgentEvent(agentId, TelemetryEventType.AGENT_STATUS_CHANGED, {
      status: AgentStatus.OFFLINE,
      previousStatus: null,
      reason: 'agent_registered'
    });
  }

  /**
   * Unregister an agent
   */
  public unregisterAgent(agentId: string): void {
    const scorecard = this.scorecards.get(agentId);
    if (!scorecard) {
      console.warn(`[Scorecard System] Agent ${agentId} not found for unregistration`);
      return;
    }

    this.scorecards.delete(agentId);
    this.agentRegistrationTime.delete(agentId);
    
    console.log(`[Scorecard System] Unregistered agent: ${scorecard.agentName} (${agentId})`);
  }

  /**
   * Update scorecard for a specific agent
   */
  public async updateAgentScorecard(agentId: string): Promise<AgentScorecard | null> {
    const scorecard = this.scorecards.get(agentId);
    if (!scorecard) {
      console.warn(`[Scorecard System] Agent ${agentId} not found for update`);
      return null;
    }

    const previousStatus = scorecard.status;
    const previousHealthScore = scorecard.healthScore;

    try {
      // Get recent metrics for the agent
      const recentMetrics = this.kpiCollector.getAgentMetrics(agentId);
      
      // Calculate individual metric scores
      const metrics = {
        availability: await this.calculateAvailabilityScore(agentId, recentMetrics),
        performance: await this.calculatePerformanceScore(agentId, recentMetrics),
        reliability: await this.calculateReliabilityScore(agentId, recentMetrics),
        compliance: await this.calculateComplianceScore(agentId, recentMetrics)
      };

      // Calculate overall health score
      const healthScore = this.calculateOverallHealthScore(metrics);

      // Determine agent status
      const status = this.determineAgentStatus(healthScore, metrics);

      // Calculate SLA compliance
      const slaCompliance = await this.calculateSLACompliance(agentId);

      // Update scorecard
      Object.assign(scorecard, {
        metrics,
        healthScore,
        status,
        lastUpdate: new Date(),
        slaCompliance,
        errorCount: await this.getErrorCount(agentId),
        avgResponseTime: await this.getAverageResponseTime(agentId),
        throughput: await this.getThroughput(agentId)
      });

      this.scorecards.set(agentId, scorecard);

      // Emit events for significant changes
      if (status !== previousStatus) {
        this.emitAgentEvent(agentId, TelemetryEventType.AGENT_STATUS_CHANGED, {
          status,
          previousStatus,
          reason: 'scorecard_update',
          healthScore,
          metrics
        });
      }

      if (Math.abs(healthScore - previousHealthScore) >= 5) {
        this.emitAgentEvent(agentId, TelemetryEventType.METRIC_UPDATED, {
          type: 'health_score',
          newValue: healthScore,
          previousValue: previousHealthScore,
          agentId
        });
      }

      return scorecard;

    } catch (error) {
      console.error(`[Scorecard System] Error updating scorecard for agent ${agentId}:`, error);
      
      // Mark agent as critical if update fails
      scorecard.status = AgentStatus.CRITICAL;
      scorecard.lastUpdate = new Date();
      
      return scorecard;
    }
  }

  /**
   * Get scorecard for a specific agent
   */
  public getScorecard(agentId: string): AgentScorecard | undefined {
    return this.scorecards.get(agentId);
  }

  /**
   * Get all scorecards
   */
  public getAllScorecards(): AgentScorecard[] {
    return Array.from(this.scorecards.values());
  }

  /**
   * Get scorecards filtered by status
   */
  public getScorecardsByStatus(status: AgentStatus): AgentScorecard[] {
    return this.getAllScorecards().filter(scorecard => scorecard.status === status);
  }

  /**
   * Get top performing agents
   */
  public getTopPerformers(limit: number = 10): AgentScorecard[] {
    return this.getAllScorecards()
      .sort((a, b) => b.healthScore - a.healthScore)
      .slice(0, limit);
  }

  /**
   * Get agents needing attention
   */
  public getAgentsNeedingAttention(): AgentScorecard[] {
    return this.getAllScorecards()
      .filter(scorecard => 
        scorecard.status === AgentStatus.CRITICAL || 
        scorecard.status === AgentStatus.WARNING ||
        scorecard.healthScore < this.config.alertThresholds.warning
      )
      .sort((a, b) => a.healthScore - b.healthScore);
  }

  /**
   * Run validation across all 127 agents
   */
  public async validateAll127Agents(): Promise<{
    totalAgents: number;
    validatedAgents: number;
    validationResults: Map<string, any>;
    overallCompliance: number;
    issues: Array<{
      agentId: string;
      agentName: string;
      issue: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  }> {
    console.log('[Scorecard System] Running validation across all 127 production agents...');
    
    const startTime = Date.now();
    const validationResults = new Map<string, any>();
    const issues: Array<any> = [];
    let validatedAgents = 0;
    let totalCompliance = 0;

    // Ensure we have exactly 127 agents registered
    const totalAgents = this.scorecards.size;
    if (totalAgents !== 127) {
      console.warn(`[Scorecard System] Expected 127 agents but found ${totalAgents}`);
    }

    for (const [agentId, scorecard] of this.scorecards) {
      try {
        const agentResults = await this.validateAgent(agentId);
        validationResults.set(agentId, agentResults);
        validatedAgents++;
        totalCompliance += agentResults.complianceScore;

        // Collect issues
        agentResults.issues.forEach((issue: any) => {
          issues.push({
            agentId,
            agentName: scorecard.agentName,
            issue: issue.description,
            severity: issue.severity
          });
        });

      } catch (error) {
        console.error(`[Scorecard System] Validation failed for agent ${agentId}:`, error);
        issues.push({
          agentId,
          agentName: scorecard.agentName,
          issue: `Validation error: ${error}`,
          severity: 'critical' as const
        });
      }
    }

    const overallCompliance = validatedAgents > 0 ? totalCompliance / validatedAgents : 0;
    const executionTime = Date.now() - startTime;

    console.log(`[Scorecard System] Validation completed in ${executionTime}ms`);
    console.log(`[Scorecard System] Overall compliance: ${overallCompliance.toFixed(2)}%`);
    console.log(`[Scorecard System] Found ${issues.length} issues across ${validatedAgents} agents`);

    return {
      totalAgents,
      validatedAgents,
      validationResults,
      overallCompliance,
      issues
    };
  }

  /**
   * Get system-wide statistics
   */
  public getSystemStats(): {
    totalAgents: number;
    activeAgents: number;
    healthyAgents: number;
    warningAgents: number;
    criticalAgents: number;
    offlineAgents: number;
    averageHealthScore: number;
    averageSLACompliance: number;
    uptimeTarget: number;
  } {
    const scorecards = this.getAllScorecards();
    
    const stats = {
      totalAgents: scorecards.length,
      activeAgents: scorecards.filter(s => s.status !== AgentStatus.OFFLINE).length,
      healthyAgents: scorecards.filter(s => s.status === AgentStatus.HEALTHY).length,
      warningAgents: scorecards.filter(s => s.status === AgentStatus.WARNING).length,
      criticalAgents: scorecards.filter(s => s.status === AgentStatus.CRITICAL).length,
      offlineAgents: scorecards.filter(s => s.status === AgentStatus.OFFLINE).length,
      averageHealthScore: scorecards.reduce((sum, s) => sum + s.healthScore, 0) / (scorecards.length || 1),
      averageSLACompliance: scorecards.reduce((sum, s) => sum + s.slaCompliance, 0) / (scorecards.length || 1),
      uptimeTarget: this.config.slaTarget
    };

    return stats;
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    const defaultRules: AgentValidationRule[] = [
      {
        id: 'availability_check',
        name: 'Availability Check',
        description: 'Verify agent availability meets SLA requirements',
        weight: 0.3,
        validator: (scorecard, metrics) => {
          const availability = scorecard.metrics.availability;
          if (availability >= 99.97) return { score: 100, status: 'pass', details: 'Excellent availability' };
          if (availability >= 99.0) return { score: 80, status: 'warning', details: 'Below SLA target' };
          return { score: 0, status: 'fail', details: 'Critical availability issues' };
        }
      },
      {
        id: 'performance_check',
        name: 'Performance Check',
        description: 'Verify agent performance metrics',
        weight: 0.25,
        validator: (scorecard, metrics) => {
          const performance = scorecard.metrics.performance;
          if (performance >= 90) return { score: 100, status: 'pass', details: 'Excellent performance' };
          if (performance >= 70) return { score: 70, status: 'warning', details: 'Performance degradation' };
          return { score: 0, status: 'fail', details: 'Poor performance' };
        }
      },
      {
        id: 'reliability_check',
        name: 'Reliability Check',
        description: 'Verify agent reliability and error rates',
        weight: 0.25,
        validator: (scorecard, metrics) => {
          const reliability = scorecard.metrics.reliability;
          if (reliability >= 95) return { score: 100, status: 'pass', details: 'Highly reliable' };
          if (reliability >= 85) return { score: 75, status: 'warning', details: 'Some reliability issues' };
          return { score: 0, status: 'fail', details: 'Reliability problems' };
        }
      },
      {
        id: 'compliance_check',
        name: 'Compliance Check',
        description: 'Verify agent meets compliance requirements',
        weight: 0.2,
        validator: (scorecard, metrics) => {
          const compliance = scorecard.metrics.compliance;
          if (compliance >= 95) return { score: 100, status: 'pass', details: 'Fully compliant' };
          if (compliance >= 80) return { score: 80, status: 'warning', details: 'Minor compliance issues' };
          return { score: 0, status: 'fail', details: 'Compliance violations' };
        }
      }
    ];

    defaultRules.forEach(rule => {
      this.validationRules.set(rule.id, rule);
    });

    // Add any custom rules from configuration
    this.config.validationRules?.forEach(rule => {
      this.validationRules.set(rule.id, rule);
    });
  }

  /**
   * Update all scorecards
   */
  private async updateAllScorecards(): Promise<void> {
    const updatePromises = Array.from(this.scorecards.keys()).map(agentId => 
      this.updateAgentScorecard(agentId)
    );

    try {
      await Promise.allSettled(updatePromises);
    } catch (error) {
      console.error('[Scorecard System] Error updating scorecards:', error);
    }
  }

  /**
   * Calculate availability score for an agent
   */
  private async calculateAvailabilityScore(agentId: string, metrics: TelemetryMetric[]): Promise<number> {
    const uptimeMetrics = metrics.filter(m => m.name === 'uptime_percentage');
    if (uptimeMetrics.length === 0) return 0;

    const latestUptime = uptimeMetrics[uptimeMetrics.length - 1]?.value || 0;
    return Math.min(100, latestUptime);
  }

  /**
   * Calculate performance score for an agent
   */
  private async calculatePerformanceScore(agentId: string, metrics: TelemetryMetric[]): Promise<number> {
    const responseTimeMetrics = metrics.filter(m => m.name === 'response_time');
    const throughputMetrics = metrics.filter(m => m.name === 'throughput');

    let responseTimeScore = 100;
    let throughputScore = 100;

    if (responseTimeMetrics.length > 0) {
      const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
      responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // Assuming 1000ms = 0 score
    }

    if (throughputMetrics.length > 0) {
      const avgThroughput = throughputMetrics.reduce((sum, m) => sum + m.value, 0) / throughputMetrics.length;
      throughputScore = Math.min(100, avgThroughput * 10); // Assuming 10 req/s = 100 score
    }

    return (responseTimeScore * 0.6 + throughputScore * 0.4);
  }

  /**
   * Calculate reliability score for an agent
   */
  private async calculateReliabilityScore(agentId: string, metrics: TelemetryMetric[]): Promise<number> {
    const errorMetrics = metrics.filter(m => m.name === 'error_count');
    const requestMetrics = metrics.filter(m => m.name === 'request_count');

    if (errorMetrics.length === 0 || requestMetrics.length === 0) {
      return 100; // Assume reliable if no error data
    }

    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);

    if (totalRequests === 0) return 100;

    const errorRate = (totalErrors / totalRequests) * 100;
    return Math.max(0, 100 - (errorRate * 20)); // 5% error rate = 0 score
  }

  /**
   * Calculate compliance score for an agent
   */
  private async calculateComplianceScore(agentId: string, metrics: TelemetryMetric[]): Promise<number> {
    // This would integrate with actual compliance validation systems
    // For now, return a score based on basic health indicators
    const registrationTime = this.agentRegistrationTime.get(agentId);
    if (!registrationTime) return 0;

    const hoursOnline = (Date.now() - registrationTime.getTime()) / (1000 * 60 * 60);
    return Math.min(100, hoursOnline * 2); // Full compliance after 50 hours
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealthScore(metrics: {
    availability: number;
    performance: number;
    reliability: number;
    compliance: number;
  }): number {
    const weights = this.config.weights;
    return (
      metrics.availability * weights.availability +
      metrics.performance * weights.performance +
      metrics.reliability * weights.reliability +
      metrics.compliance * weights.compliance
    );
  }

  /**
   * Determine agent status based on health score
   */
  private determineAgentStatus(healthScore: number, metrics: any): AgentStatus {
    if (healthScore < this.config.alertThresholds.critical) return AgentStatus.CRITICAL;
    if (healthScore < this.config.alertThresholds.warning) return AgentStatus.WARNING;
    if (metrics.availability > 0) return AgentStatus.HEALTHY;
    return AgentStatus.OFFLINE;
  }

  /**
   * Calculate SLA compliance
   */
  private async calculateSLACompliance(agentId: string): Promise<number> {
    const uptime = this.kpiCollector.calculateAggregation(
      'uptime_percentage',
      'avg' as any,
      24 * 60 * 60 * 1000, // 24 hours
      agentId
    );
    
    return Math.min(100, (uptime / this.config.slaTarget) * 100);
  }

  /**
   * Get error count for agent
   */
  private async getErrorCount(agentId: string): Promise<number> {
    return this.kpiCollector.calculateAggregation(
      'error_count',
      'sum' as any,
      60 * 60 * 1000, // 1 hour
      agentId
    );
  }

  /**
   * Get average response time for agent
   */
  private async getAverageResponseTime(agentId: string): Promise<number> {
    return this.kpiCollector.calculateAggregation(
      'response_time',
      'avg' as any,
      60 * 60 * 1000, // 1 hour
      agentId
    );
  }

  /**
   * Get throughput for agent
   */
  private async getThroughput(agentId: string): Promise<number> {
    return this.kpiCollector.calculateAggregation(
      'requests_per_second',
      'avg' as any,
      60 * 60 * 1000, // 1 hour
      agentId
    );
  }

  /**
   * Validate a specific agent
   */
  private async validateAgent(agentId: string): Promise<{
    agentId: string;
    complianceScore: number;
    issues: Array<any>;
    validationPassed: boolean;
  }> {
    const scorecard = this.scorecards.get(agentId);
    if (!scorecard) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const metrics = this.kpiCollector.getAgentMetrics(agentId);
    const issues: Array<any> = [];
    let totalScore = 0;
    let totalWeight = 0;

    for (const [ruleId, rule] of this.validationRules) {
      try {
        const result = rule.validator(scorecard, metrics);
        totalScore += result.score * rule.weight;
        totalWeight += rule.weight;

        if (result.status === 'fail') {
          issues.push({
            ruleId,
            ruleName: rule.name,
            description: result.details,
            severity: 'high' as const
          });
        } else if (result.status === 'warning') {
          issues.push({
            ruleId,
            ruleName: rule.name,
            description: result.details,
            severity: 'medium' as const
          });
        }
      } catch (error) {
        issues.push({
          ruleId,
          ruleName: rule.name,
          description: `Validation rule failed: ${error}`,
          severity: 'critical' as const
        });
      }
    }

    const complianceScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
    const validationPassed = complianceScore >= 80 && issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0;

    return {
      agentId,
      complianceScore,
      issues,
      validationPassed
    };
  }

  /**
   * Emit agent-related events
   */
  private emitAgentEvent(agentId: string, type: TelemetryEventType, payload: any): void {
    const event: TelemetryEvent = {
      type,
      payload,
      timestamp: new Date(),
      agentId
    };

    this.emit('agent_event', event);
    this.emit('telemetry_event', event);
  }
}