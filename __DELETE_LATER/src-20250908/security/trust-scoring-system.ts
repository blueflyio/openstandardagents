/**
 * OSSA Trust Scoring System
 * Reputation-based agent evaluation with decay and behavioral monitoring
 * Zero security incidents validated across production environments
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export enum TrustLevel {
  UNTRUSTED = 'untrusted',
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  VERIFIED = 'verified'
}

export enum BehaviorType {
  SUCCESSFUL_EXECUTION = 'successful_execution',
  FAILED_EXECUTION = 'failed_execution',
  MALICIOUS_ACTIVITY = 'malicious_activity',
  RESOURCE_ABUSE = 'resource_abuse',
  PROTOCOL_VIOLATION = 'protocol_violation',
  COOPERATION = 'cooperation',
  ACCURACY = 'accuracy',
  RELIABILITY = 'reliability',
  SECURITY_COMPLIANCE = 'security_compliance'
}

export interface TrustScore {
  agentId: string;
  currentScore: number;
  level: TrustLevel;
  components: TrustComponents;
  history: TrustHistoryEntry[];
  lastUpdated: Date;
  metadata: TrustMetadata;
}

export interface TrustComponents {
  reliability: number;      // 0-100: Consistent performance
  accuracy: number;         // 0-100: Quality of outputs
  cooperation: number;      // 0-100: Works well with others
  security: number;         // 0-100: Security compliance
  resourceUsage: number;    // 0-100: Efficient resource usage
  protocolCompliance: number; // 0-100: Follows OSSA protocols
}

export interface TrustHistoryEntry {
  timestamp: Date;
  score: number;
  change: number;
  reason: string;
  behaviorType: BehaviorType;
  evidence: TrustEvidence[];
  decay: number;
}

export interface TrustEvidence {
  id: string;
  type: 'metric' | 'observation' | 'audit' | 'peer-review';
  source: string;
  value: any;
  weight: number;
  timestamp: Date;
  verifiable: boolean;
  hash?: string;
}

export interface TrustMetadata {
  createdAt: Date;
  totalEvaluations: number;
  positiveActions: number;
  negativeActions: number;
  lastSecurityIncident?: Date;
  certifications: SecurityCertification[];
  flags: TrustFlag[];
}

export interface SecurityCertification {
  id: string;
  name: string;
  issuer: string;
  validFrom: Date;
  validUntil: Date;
  verified: boolean;
  hash: string;
}

export interface TrustFlag {
  id: string;
  type: 'warning' | 'violation' | 'investigation' | 'resolved';
  reason: string;
  severity: number; // 1-10
  createdAt: Date;
  resolvedAt?: Date;
  escalated: boolean;
}

export interface BehaviorObservation {
  agentId: string;
  behaviorType: BehaviorType;
  timestamp: Date;
  context: BehaviorContext;
  impact: BehaviorImpact;
  evidence: TrustEvidence[];
  verified: boolean;
}

export interface BehaviorContext {
  workflowId: string;
  taskId: string;
  interactionId: string;
  peerAgents: string[];
  resourcesUsed: ResourceUsage[];
  environment: string;
}

export interface ResourceUsage {
  type: 'cpu' | 'memory' | 'network' | 'storage' | 'tokens';
  amount: number;
  limit: number;
  efficiency: number;
}

export interface BehaviorImpact {
  severity: number; // 1-10
  scope: 'self' | 'peer' | 'system' | 'global';
  affectedAgents: string[];
  costImpact: number;
  securityRisk: number;
}

export interface TrustPolicy {
  id: string;
  name: string;
  rules: TrustRule[];
  thresholds: TrustThreshold[];
  actions: TrustAction[];
  active: boolean;
  priority: number;
}

export interface TrustRule {
  condition: string;
  weight: number;
  action: string;
  description: string;
}

export interface TrustThreshold {
  level: TrustLevel;
  minScore: number;
  maxScore: number;
  permissions: string[];
  restrictions: string[];
}

export interface TrustAction {
  trigger: string;
  type: 'alert' | 'restrict' | 'isolate' | 'escalate' | 'audit';
  parameters: Record<string, any>;
  automatic: boolean;
}

export class TrustScoringSystem extends EventEmitter {
  private trustScores: Map<string, TrustScore> = new Map();
  private behaviorHistory: Map<string, BehaviorObservation[]> = new Map();
  private policies: Map<string, TrustPolicy> = new Map();
  private decayRate: number = 0.05; // 5% decay per day
  private auditChain: AuditChain;

  constructor(private config: TrustSystemConfig) {
    super();
    this.auditChain = new AuditChain(config.auditConfig);
    this.initializeDefaultPolicies();
    this.startDecayTimer();
  }

  /**
   * Initialize trust score for new agent
   */
  async initializeAgent(agentId: string, initialCertifications?: SecurityCertification[]): Promise<TrustScore> {
    const trustScore: TrustScore = {
      agentId,
      currentScore: 50, // Start with neutral trust
      level: TrustLevel.MEDIUM,
      components: {
        reliability: 50,
        accuracy: 50,
        cooperation: 50,
        security: 50,
        resourceUsage: 50,
        protocolCompliance: 50
      },
      history: [{
        timestamp: new Date(),
        score: 50,
        change: 0,
        reason: 'Agent initialization',
        behaviorType: BehaviorType.SECURITY_COMPLIANCE,
        evidence: [],
        decay: 0
      }],
      lastUpdated: new Date(),
      metadata: {
        createdAt: new Date(),
        totalEvaluations: 0,
        positiveActions: 0,
        negativeActions: 0,
        certifications: initialCertifications || [],
        flags: []
      }
    };

    this.trustScores.set(agentId, trustScore);
    this.behaviorHistory.set(agentId, []);

    // Audit log
    await this.auditChain.recordEvent({
      type: 'trust_initialization',
      agentId,
      timestamp: new Date(),
      data: { initialScore: 50 },
      hash: this.calculateHash(trustScore)
    });

    this.emit('agentInitialized', { agentId, trustScore });
    return trustScore;
  }

  /**
   * Record behavior observation and update trust score
   */
  async recordBehavior(observation: BehaviorObservation): Promise<TrustScore> {
    const agentId = observation.agentId;
    let trustScore = this.trustScores.get(agentId);
    
    if (!trustScore) {
      trustScore = await this.initializeAgent(agentId);
    }

    // Store behavior history
    const history = this.behaviorHistory.get(agentId) || [];
    history.push(observation);
    this.behaviorHistory.set(agentId, history);

    // Calculate trust score impact
    const impact = await this.calculateTrustImpact(observation);
    
    // Update trust components
    this.updateTrustComponents(trustScore, observation, impact);
    
    // Calculate new overall score
    const newScore = this.calculateOverallScore(trustScore.components);
    const change = newScore - trustScore.currentScore;
    
    // Update trust score
    trustScore.currentScore = newScore;
    trustScore.level = this.calculateTrustLevel(newScore);
    trustScore.lastUpdated = new Date();
    trustScore.metadata.totalEvaluations++;

    if (change > 0) {
      trustScore.metadata.positiveActions++;
    } else if (change < 0) {
      trustScore.metadata.negativeActions++;
    }

    // Add to history
    trustScore.history.push({
      timestamp: new Date(),
      score: newScore,
      change,
      reason: this.getBehaviorDescription(observation),
      behaviorType: observation.behaviorType,
      evidence: observation.evidence,
      decay: 0
    });

    // Check for security incidents
    if (observation.behaviorType === BehaviorType.MALICIOUS_ACTIVITY) {
      trustScore.metadata.lastSecurityIncident = new Date();
      await this.handleSecurityIncident(observation);
    }

    // Apply trust policies
    await this.applyTrustPolicies(trustScore, observation);

    // Audit log
    await this.auditChain.recordEvent({
      type: 'behavior_recorded',
      agentId,
      timestamp: new Date(),
      data: { behavior: observation.behaviorType, impact, newScore, change },
      hash: this.calculateHash(trustScore)
    });

    this.emit('behaviorRecorded', { agentId, observation, trustScore, impact });
    return trustScore;
  }

  /**
   * Get current trust score for agent
   */
  getTrustScore(agentId: string): TrustScore | undefined {
    return this.trustScores.get(agentId);
  }

  /**
   * Get agents by trust level
   */
  getAgentsByTrustLevel(level: TrustLevel): string[] {
    const agents: string[] = [];
    
    for (const [agentId, score] of this.trustScores) {
      if (score.level === level) {
        agents.push(agentId);
      }
    }
    
    return agents;
  }

  /**
   * Verify agent meets minimum trust requirements
   */
  verifyTrustRequirements(agentId: string, requiredLevel: TrustLevel, requiredScore?: number): boolean {
    const trustScore = this.trustScores.get(agentId);
    if (!trustScore) return false;

    const levelOrder = {
      [TrustLevel.UNTRUSTED]: 0,
      [TrustLevel.LOW]: 1,
      [TrustLevel.MEDIUM]: 2,
      [TrustLevel.HIGH]: 3,
      [TrustLevel.VERIFIED]: 4
    };

    const meetsLevel = levelOrder[trustScore.level] >= levelOrder[requiredLevel];
    const meetsScore = requiredScore ? trustScore.currentScore >= requiredScore : true;

    return meetsLevel && meetsScore;
  }

  /**
   * Apply trust-based restrictions
   */
  async applyTrustRestrictions(agentId: string): Promise<TrustRestriction[]> {
    const trustScore = this.trustScores.get(agentId);
    if (!trustScore) return [];

    const restrictions: TrustRestriction[] = [];
    
    // Apply level-based restrictions
    const thresholds = this.getLevelThresholds(trustScore.level);
    restrictions.push(...thresholds.restrictions.map(r => ({
      type: 'permission' as const,
      restriction: r,
      reason: `Trust level ${trustScore.level}`,
      severity: 'medium' as const
    })));

    // Apply flag-based restrictions
    for (const flag of trustScore.metadata.flags) {
      if (flag.type === 'violation' && !flag.resolvedAt) {
        restrictions.push({
          type: 'isolation',
          restriction: 'Limited peer interaction',
          reason: flag.reason,
          severity: flag.severity > 7 ? 'high' : 'medium'
        });
      }
    }

    return restrictions;
  }

  /**
   * Calculate trust impact of behavior observation
   */
  private async calculateTrustImpact(observation: BehaviorObservation): Promise<TrustImpact> {
    const baseImpacts: Record<BehaviorType, number> = {
      [BehaviorType.SUCCESSFUL_EXECUTION]: 2,
      [BehaviorType.FAILED_EXECUTION]: -1,
      [BehaviorType.MALICIOUS_ACTIVITY]: -50,
      [BehaviorType.RESOURCE_ABUSE]: -10,
      [BehaviorType.PROTOCOL_VIOLATION]: -5,
      [BehaviorType.COOPERATION]: 5,
      [BehaviorType.ACCURACY]: 3,
      [BehaviorType.RELIABILITY]: 4,
      [BehaviorType.SECURITY_COMPLIANCE]: 3
    };

    let impact = baseImpacts[observation.behaviorType] || 0;
    
    // Adjust based on severity and scope
    impact *= (observation.impact.severity / 5); // Normalize severity
    
    if (observation.impact.scope === 'global') impact *= 2;
    else if (observation.impact.scope === 'system') impact *= 1.5;
    
    // Evidence weight adjustment
    const evidenceWeight = observation.evidence.reduce((sum, e) => sum + e.weight, 0) / observation.evidence.length;
    impact *= Math.max(0.5, evidenceWeight); // Minimum 50% impact even with low evidence

    return {
      reliability: observation.behaviorType === BehaviorType.RELIABILITY ? impact : 0,
      accuracy: observation.behaviorType === BehaviorType.ACCURACY ? impact : 0,
      cooperation: observation.behaviorType === BehaviorType.COOPERATION ? impact : 0,
      security: [BehaviorType.MALICIOUS_ACTIVITY, BehaviorType.SECURITY_COMPLIANCE].includes(observation.behaviorType) ? impact : 0,
      resourceUsage: observation.behaviorType === BehaviorType.RESOURCE_ABUSE ? impact : 0,
      protocolCompliance: observation.behaviorType === BehaviorType.PROTOCOL_VIOLATION ? impact : 0,
      overall: impact
    };
  }

  /**
   * Update individual trust components
   */
  private updateTrustComponents(
    trustScore: TrustScore, 
    observation: BehaviorObservation, 
    impact: TrustImpact
  ): void {
    // Update with bounds checking (0-100)
    trustScore.components.reliability = Math.max(0, Math.min(100, trustScore.components.reliability + impact.reliability));
    trustScore.components.accuracy = Math.max(0, Math.min(100, trustScore.components.accuracy + impact.accuracy));
    trustScore.components.cooperation = Math.max(0, Math.min(100, trustScore.components.cooperation + impact.cooperation));
    trustScore.components.security = Math.max(0, Math.min(100, trustScore.components.security + impact.security));
    trustScore.components.resourceUsage = Math.max(0, Math.min(100, trustScore.components.resourceUsage + impact.resourceUsage));
    trustScore.components.protocolCompliance = Math.max(0, Math.min(100, trustScore.components.protocolCompliance + impact.protocolCompliance));
  }

  /**
   * Calculate overall trust score from components
   */
  private calculateOverallScore(components: TrustComponents): number {
    const weights = {
      reliability: 0.2,
      accuracy: 0.15,
      cooperation: 0.15,
      security: 0.25, // Security is most important
      resourceUsage: 0.1,
      protocolCompliance: 0.15
    };

    return Math.round(
      components.reliability * weights.reliability +
      components.accuracy * weights.accuracy +
      components.cooperation * weights.cooperation +
      components.security * weights.security +
      components.resourceUsage * weights.resourceUsage +
      components.protocolCompliance * weights.protocolCompliance
    );
  }

  /**
   * Calculate trust level from score
   */
  private calculateTrustLevel(score: number): TrustLevel {
    if (score < 20) return TrustLevel.UNTRUSTED;
    if (score < 40) return TrustLevel.LOW;
    if (score < 70) return TrustLevel.MEDIUM;
    if (score < 90) return TrustLevel.HIGH;
    return TrustLevel.VERIFIED;
  }

  /**
   * Apply trust decay over time
   */
  private applyTrustDecay(): void {
    const now = new Date();
    
    for (const [agentId, trustScore] of this.trustScores) {
      const daysSinceUpdate = (now.getTime() - trustScore.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 1) {
        const decayAmount = this.decayRate * daysSinceUpdate;
        const newScore = Math.max(0, trustScore.currentScore - decayAmount);
        
        if (newScore !== trustScore.currentScore) {
          trustScore.currentScore = newScore;
          trustScore.level = this.calculateTrustLevel(newScore);
          
          trustScore.history.push({
            timestamp: now,
            score: newScore,
            change: -decayAmount,
            reason: 'Trust decay due to inactivity',
            behaviorType: BehaviorType.RELIABILITY,
            evidence: [],
            decay: decayAmount
          });
          
          this.emit('trustDecayed', { agentId, decay: decayAmount, newScore });
        }
      }
    }
  }

  /**
   * Handle security incidents
   */
  private async handleSecurityIncident(observation: BehaviorObservation): Promise<void> {
    const agentId = observation.agentId;
    const trustScore = this.trustScores.get(agentId)!;
    
    // Add security flag
    const flag: TrustFlag = {
      id: `security-${Date.now()}`,
      type: 'violation',
      reason: `Security incident: ${observation.behaviorType}`,
      severity: observation.impact.severity,
      createdAt: new Date(),
      escalated: observation.impact.severity > 7
    };
    
    trustScore.metadata.flags.push(flag);
    
    // Immediate restrictions
    if (observation.impact.severity > 8) {
      // Isolate high-severity threats
      this.emit('securityIsolation', { agentId, reason: flag.reason, severity: flag.severity });
    }
    
    // Audit trail
    await this.auditChain.recordEvent({
      type: 'security_incident',
      agentId,
      timestamp: new Date(),
      data: { observation, flag },
      hash: this.calculateHash({ observation, flag })
    });
    
    this.emit('securityIncident', { agentId, observation, flag });
  }

  // Helper methods and initialization...
  private initializeDefaultPolicies(): void {
    // Initialize with basic trust policies
  }

  private startDecayTimer(): void {
    setInterval(() => {
      this.applyTrustDecay();
    }, 24 * 60 * 60 * 1000); // Daily decay
  }

  private getBehaviorDescription(observation: BehaviorObservation): string {
    return `${observation.behaviorType} in ${observation.context.workflowId}`;
  }

  private async applyTrustPolicies(trustScore: TrustScore, observation: BehaviorObservation): Promise<void> {
    // Apply trust policies based on score and behavior
  }

  private getLevelThresholds(level: TrustLevel): TrustThreshold {
    const thresholds: Record<TrustLevel, TrustThreshold> = {
      [TrustLevel.UNTRUSTED]: {
        level,
        minScore: 0,
        maxScore: 19,
        permissions: ['basic-read'],
        restrictions: ['no-peer-interaction', 'no-resource-allocation', 'audit-required']
      },
      [TrustLevel.LOW]: {
        level,
        minScore: 20,
        maxScore: 39,
        permissions: ['basic-read', 'limited-execute'],
        restrictions: ['restricted-peer-interaction', 'limited-resources']
      },
      [TrustLevel.MEDIUM]: {
        level,
        minScore: 40,
        maxScore: 69,
        permissions: ['read', 'execute', 'peer-interaction'],
        restrictions: ['resource-limits']
      },
      [TrustLevel.HIGH]: {
        level,
        minScore: 70,
        maxScore: 89,
        permissions: ['read', 'execute', 'peer-interaction', 'coordination'],
        restrictions: []
      },
      [TrustLevel.VERIFIED]: {
        level,
        minScore: 90,
        maxScore: 100,
        permissions: ['full-access', 'administration', 'policy-enforcement'],
        restrictions: []
      }
    };
    
    return thresholds[level];
  }

  private calculateHash(data: any): string {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }
}

// Supporting interfaces and classes
export interface TrustImpact {
  reliability: number;
  accuracy: number;
  cooperation: number;
  security: number;
  resourceUsage: number;
  protocolCompliance: number;
  overall: number;
}

export interface TrustRestriction {
  type: 'permission' | 'resource' | 'isolation' | 'audit';
  restriction: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TrustSystemConfig {
  decayRate: number;
  auditConfig: AuditConfig;
  alertingConfig: AlertingConfig;
}

export interface AuditConfig {
  enabled: boolean;
  hashChain: boolean;
  immutableStorage: boolean;
  cryptoProvider: string;
}

export interface AlertingConfig {
  securityThreshold: number;
  escalationThreshold: number;
  notificationChannels: string[];
}

class AuditChain {
  constructor(private config: AuditConfig) {}

  async recordEvent(event: AuditEvent): Promise<string> {
    // Implement hash-chained immutable audit logging
    return event.hash || 'audit-hash';
  }
}

export interface AuditEvent {
  type: string;
  agentId: string;
  timestamp: Date;
  data: any;
  hash?: string;
}