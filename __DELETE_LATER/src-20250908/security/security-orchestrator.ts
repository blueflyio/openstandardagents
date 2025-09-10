/**
 * OSSA Security Orchestrator
 * Central coordination hub for all security and trust components
 * Integrates authentication, trust scoring, threat detection, policy enforcement, and capability management
 */

import { EventEmitter } from 'events';
import { AgentAuthenticator, AgentIdentity, AuthenticationContext, AuthenticationResult } from './agent-authentication';
import { TrustScoringSystem, TrustScore, BehaviorObservation, TrustLevel } from './trust-scoring-system';
import { MaliciousAgentProtection, ThreatAssessment, SandboxEnvironment, QuarantineRecord } from './malicious-agent-protection';
import { SecurityPolicyEngine, PolicyEvaluationContext, PolicyEvaluationResult } from './policy-enforcement';
import { CapabilityVerificationSystem, VerificationResult, AccessRequest, AccessDecision } from './capability-verification';
import { ImmutableAuditChain, AuditEventType } from './audit-chain';

export interface SecurityOrchestrationConfig {
  authentication: {
    enabled: boolean;
    methods: string[];
    mfaRequired: boolean;
    sessionTimeout: number;
  };
  trustScoring: {
    enabled: boolean;
    decayRate: number;
    minimumTrust: TrustLevel;
    updateFrequency: number;
  };
  threatProtection: {
    enabled: boolean;
    autoQuarantine: boolean;
    sandboxing: boolean;
    realTimeMonitoring: boolean;
  };
  policyEnforcement: {
    enabled: boolean;
    strictMode: boolean;
    autoResponse: boolean;
    approvalWorkflow: boolean;
  };
  capabilityManagement: {
    enabled: boolean;
    autoGrant: boolean;
    reviewRequired: boolean;
    usageMonitoring: boolean;
  };
  audit: {
    enabled: boolean;
    immutableChain: boolean;
    realTimeLogging: boolean;
    retention: number;
  };
  integration: {
    crossSystemValidation: boolean;
    consensusRequired: boolean;
    escalationThresholds: SecurityThresholds;
  };
}

export interface SecurityThresholds {
  riskScore: number;
  trustScore: number;
  threatLevel: string;
  violationCount: number;
  timeWindow: number;
}

export interface SecurityContext {
  agentId: string;
  sessionId: string;
  requestId: string;
  timestamp: Date;
  environment: string;
  correlationId?: string;
  metadata: Record<string, any>;
}

export interface ComprehensiveSecurityAssessment {
  agentId: string;
  timestamp: Date;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trustAssessment: TrustAssessment;
  threatAssessment: ThreatAssessment;
  policyCompliance: PolicyCompliance;
  capabilityStatus: CapabilityStatus;
  recommendations: SecurityRecommendation[];
  immediateActions: ImmediateAction[];
  confidence: number;
  assessmentDuration: number;
}

export interface TrustAssessment {
  currentScore: number;
  level: TrustLevel;
  trend: 'improving' | 'stable' | 'declining';
  factors: TrustFactor[];
  violations: number;
  lastUpdate: Date;
}

export interface TrustFactor {
  category: string;
  impact: number;
  confidence: number;
  description: string;
}

export interface PolicyCompliance {
  overallCompliance: number; // 0-100%
  violatingPolicies: string[];
  complianceScore: number;
  lastViolation?: Date;
  activeRestrictions: string[];
}

export interface CapabilityStatus {
  verifiedCapabilities: number;
  pendingVerifications: number;
  revokedCapabilities: number;
  overallAccessLevel: string;
  lastCapabilityCheck: Date;
}

export interface SecurityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'trust' | 'threat' | 'policy' | 'capability' | 'access';
  title: string;
  description: string;
  action: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface ImmediateAction {
  action: 'isolate' | 'restrict' | 'monitor' | 'escalate' | 'approve' | 'deny';
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  automatic: boolean;
  parameters: Record<string, any>;
  deadline?: Date;
}

export interface SecurityDecision {
  allowed: boolean;
  confidence: number;
  reasons: string[];
  restrictions: string[];
  monitoring: string[];
  escalation?: string;
  validFor: number; // seconds
  metadata: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  agentId: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  data: Record<string, any>;
  handled: boolean;
  response?: SecurityResponse;
}

export enum SecurityEventType {
  AUTHENTICATION_SUCCESS = 'authentication_success',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  TRUST_SCORE_CHANGE = 'trust_score_change',
  THREAT_DETECTED = 'threat_detected',
  POLICY_VIOLATION = 'policy_violation',
  CAPABILITY_GRANTED = 'capability_granted',
  CAPABILITY_REVOKED = 'capability_revoked',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  SECURITY_INCIDENT = 'security_incident',
  QUARANTINE_ACTIVATED = 'quarantine_activated',
  SANDBOX_CREATED = 'sandbox_created',
  AUDIT_ALERT = 'audit_alert'
}

export interface SecurityResponse {
  action: string;
  timestamp: Date;
  performer: string;
  successful: boolean;
  details: Record<string, any>;
}

export interface SecurityMetrics {
  totalAgents: number;
  authenticatedAgents: number;
  quarantinedAgents: number;
  highRiskAgents: number;
  averageTrustScore: number;
  securityIncidents: number;
  policyViolations: number;
  threatDetections: number;
  lastUpdated: Date;
}

export class SecurityOrchestrator extends EventEmitter {
  private authenticator: AgentAuthenticator;
  private trustSystem: TrustScoringSystem;
  private threatProtection: MaliciousAgentProtection;
  private policyEngine: SecurityPolicyEngine;
  private capabilitySystem: CapabilityVerificationSystem;
  private auditChain: ImmutableAuditChain;

  private securityEvents: Map<string, SecurityEvent> = new Map();
  private agentContexts: Map<string, SecurityContext> = new Map();
  private metrics: SecurityMetrics;

  constructor(private config: SecurityOrchestrationConfig) {
    super();
    this.initializeComponents();
    this.setupEventHandlers();
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  /**
   * Primary security checkpoint - validates all aspects of agent request
   */
  async validateSecurityCheckpoint(
    agentId: string,
    requestType: string,
    context: SecurityContext
  ): Promise<SecurityDecision> {
    const startTime = Date.now();

    try {
      // Step 1: Get comprehensive security assessment
      const assessment = await this.getComprehensiveAssessment(agentId, context);

      // Step 2: Make security decision based on assessment
      const decision = this.makeSecurityDecision(assessment, requestType, context);

      // Step 3: Execute immediate actions if required
      if (assessment.immediateActions.length > 0) {
        await this.executeImmediateActions(assessment.immediateActions, context);
      }

      // Step 4: Update security context
      this.updateSecurityContext(agentId, context, decision);

      // Step 5: Log security decision
      await this.auditChain.recordEvent({
        type: decision.allowed ? AuditEventType.PERMISSION_GRANTED : AuditEventType.PERMISSION_DENIED,
        agentId,
        timestamp: context.timestamp,
        data: {
          requestType,
          decision: decision.allowed,
          confidence: decision.confidence,
          riskScore: assessment.overallRiskScore,
          restrictions: decision.restrictions
        },
        metadata: {
          source: 'security-orchestrator',
          severity: assessment.riskLevel === 'critical' ? 'critical' : 'medium',
          category: 'security_checkpoint',
          tags: ['security', 'validation'],
          correlationId: context.correlationId
        }
      });

      decision.metadata.assessmentTime = Date.now() - startTime;
      return decision;

    } catch (error) {
      const errorDecision: SecurityDecision = {
        allowed: false,
        confidence: 0,
        reasons: [`Security validation failed: ${error.message}`],
        restrictions: ['access_denied'],
        monitoring: ['enhanced_logging'],
        validFor: 0,
        metadata: { error: error.message, assessmentTime: Date.now() - startTime }
      };

      await this.handleSecurityError(agentId, context, error);
      return errorDecision;
    }
  }

  /**
   * Authenticate agent and establish security context
   */
  async authenticateAgent(
    credentials: any,
    authContext: AuthenticationContext
  ): Promise<AuthenticationResult> {
    const result = await this.authenticator.authenticateAgent(credentials, authContext);

    if (result.success && result.agent) {
      // Initialize security context for authenticated agent
      const securityContext: SecurityContext = {
        agentId: result.agent.id,
        sessionId: result.metadata.sessionId,
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        environment: authContext.geolocation?.country || 'unknown',
        metadata: {
          authMethod: credentials.method,
          trustScore: result.trustScore,
          riskScore: result.riskScore
        }
      };

      this.agentContexts.set(result.agent.id, securityContext);

      // Record security event
      await this.recordSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_SUCCESS,
        agentId: result.agent.id,
        severity: 'low',
        source: 'authenticator',
        description: 'Agent successfully authenticated',
        data: {
          method: credentials.method,
          trustScore: result.trustScore,
          riskScore: result.riskScore
        }
      });

      // Start comprehensive monitoring for authenticated agent
      await this.startAgentMonitoring(result.agent.id);

    } else {
      // Record failed authentication
      await this.recordSecurityEvent({
        type: SecurityEventType.AUTHENTICATION_FAILURE,
        agentId: credentials.agentId || 'unknown',
        severity: 'medium',
        source: 'authenticator',
        description: 'Agent authentication failed',
        data: {
          method: credentials.method,
          errors: result.errors?.map(e => e.message)
        }
      });
    }

    return result;
  }

  /**
   * Record behavioral observation and update trust
   */
  async recordBehavior(observation: BehaviorObservation): Promise<void> {
    // Record in trust system
    const trustScore = await this.trustSystem.recordBehavior(observation);

    // Check if behavior indicates potential threat
    const threatAssessment = await this.threatProtection.analyzeAgent(observation.agentId, {
      behavior: [observation],
      metadata: { source: 'behavior_observation' }
    });

    // Update security metrics
    this.updateSecurityMetrics(observation.agentId, trustScore, threatAssessment);

    // Record security event if significant
    if (trustScore.currentScore < 40 || threatAssessment.threatLevel !== 'none') {
      await this.recordSecurityEvent({
        type: SecurityEventType.TRUST_SCORE_CHANGE,
        agentId: observation.agentId,
        severity: trustScore.currentScore < 20 ? 'high' : 'medium',
        source: 'trust-system',
        description: `Trust score changed to ${trustScore.currentScore}`,
        data: {
          oldScore: trustScore.history[trustScore.history.length - 2]?.score || 50,
          newScore: trustScore.currentScore,
          behavior: observation.behaviorType,
          threatLevel: threatAssessment.threatLevel
        }
      });
    }
  }

  /**
   * Evaluate access request through all security layers
   */
  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    const context = this.agentContexts.get(request.agentId);
    if (!context) {
      throw new Error(`No security context found for agent ${request.agentId}`);
    }

    // Step 1: Check capability verification
    const capabilityCheck = await this.capabilitySystem.checkAccess(request);
    
    if (!capabilityCheck.allowed) {
      return capabilityCheck;
    }

    // Step 2: Policy evaluation
    const policyContext: PolicyEvaluationContext = {
      agentId: request.agentId,
      trustScore: this.trustSystem.getTrustScore(request.agentId),
      requestType: 'access_request',
      resource: request.resource,
      operation: request.action,
      environment: context.environment,
      timestamp: request.timestamp,
      sessionId: context.sessionId,
      correlationId: context.correlationId,
      metadata: request.context.metadata
    };

    const policyResults = await this.policyEngine.evaluatePolicy(policyContext);

    // Step 3: Merge results and make final decision
    const finalDecision = this.mergeAccessDecisions(capabilityCheck, policyResults);

    // Record access decision
    await this.recordSecurityEvent({
      type: finalDecision.allowed ? SecurityEventType.ACCESS_GRANTED : SecurityEventType.ACCESS_DENIED,
      agentId: request.agentId,
      severity: finalDecision.allowed ? 'low' : 'medium',
      source: 'access-control',
      description: `Access ${finalDecision.allowed ? 'granted' : 'denied'} for ${request.resource}`,
      data: {
        resource: request.resource,
        action: request.action,
        reason: finalDecision.reason,
        confidence: finalDecision.confidence
      }
    });

    return finalDecision;
  }

  /**
   * Get comprehensive security assessment for an agent
   */
  async getComprehensiveAssessment(
    agentId: string,
    context: SecurityContext
  ): Promise<ComprehensiveSecurityAssessment> {
    const startTime = Date.now();

    // Gather data from all security components
    const [trustScore, threatAssessment, agentCapabilities] = await Promise.all([
      this.trustSystem.getTrustScore(agentId),
      this.threatProtection.analyzeAgent(agentId, { metadata: { source: 'assessment' } }),
      this.capabilitySystem.getAgentCapabilities(agentId)
    ]);

    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore({
      trustScore: trustScore?.currentScore || 0,
      threatLevel: threatAssessment.threatLevel,
      policyViolations: 0, // Would get from policy engine
      capabilityRisk: this.calculateCapabilityRisk(agentCapabilities)
    });

    const assessment: ComprehensiveSecurityAssessment = {
      agentId,
      timestamp: new Date(),
      overallRiskScore,
      riskLevel: this.scoreToRiskLevel(overallRiskScore),
      trustAssessment: {
        currentScore: trustScore?.currentScore || 0,
        level: trustScore?.level || TrustLevel.UNTRUSTED,
        trend: this.calculateTrustTrend(trustScore),
        factors: this.extractTrustFactors(trustScore),
        violations: trustScore?.metadata.negativeActions || 0,
        lastUpdate: trustScore?.lastUpdated || new Date()
      },
      threatAssessment,
      policyCompliance: await this.calculatePolicyCompliance(agentId),
      capabilityStatus: {
        verifiedCapabilities: agentCapabilities.length,
        pendingVerifications: 0, // Would get from capability system
        revokedCapabilities: 0, // Would get from capability system
        overallAccessLevel: this.calculateOverallAccessLevel(agentCapabilities),
        lastCapabilityCheck: new Date()
      },
      recommendations: this.generateSecurityRecommendations(overallRiskScore, trustScore, threatAssessment),
      immediateActions: this.determineImmediateActions(overallRiskScore, threatAssessment),
      confidence: this.calculateAssessmentConfidence(trustScore, threatAssessment),
      assessmentDuration: Date.now() - startTime
    };

    return assessment;
  }

  /**
   * Handle security incidents
   */
  async handleSecurityIncident(
    agentId: string,
    incidentType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): Promise<void> {
    // Record security event
    await this.recordSecurityEvent({
      type: SecurityEventType.SECURITY_INCIDENT,
      agentId,
      severity,
      source: 'security-orchestrator',
      description: `Security incident: ${incidentType}`,
      data: details
    });

    // Take immediate action based on severity
    if (severity === 'critical' || severity === 'high') {
      // Quarantine agent
      await this.quarantineAgent(agentId, `Security incident: ${incidentType}`, severity);
    } else if (severity === 'medium') {
      // Increase monitoring
      await this.enhanceMonitoring(agentId, 3600); // 1 hour enhanced monitoring
    }

    // Update security metrics
    this.metrics.securityIncidents++;
    this.metrics.lastUpdated = new Date();

    this.emit('securityIncident', { agentId, incidentType, severity, details });
  }

  /**
   * Quarantine agent with comprehensive restrictions
   */
  async quarantineAgent(
    agentId: string,
    reason: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    duration?: number
  ): Promise<QuarantineRecord> {
    // Quarantine through threat protection system
    const quarantineRecord = await this.threatProtection.quarantineAgent(
      agentId,
      reason,
      undefined,
      duration || this.calculateQuarantineDuration(severity)
    );

    // Revoke all capabilities
    const capabilities = this.capabilitySystem.getAgentCapabilities(agentId);
    for (const capability of capabilities) {
      await this.capabilitySystem.revokeCapability(
        capability.id,
        `Agent quarantined: ${reason}`,
        'security-orchestrator'
      );
    }

    // Record quarantine event
    await this.recordSecurityEvent({
      type: SecurityEventType.QUARANTINE_ACTIVATED,
      agentId,
      severity,
      source: 'security-orchestrator',
      description: `Agent quarantined: ${reason}`,
      data: {
        quarantineId: quarantineRecord.id,
        reason,
        duration: quarantineRecord.duration
      }
    });

    this.metrics.quarantinedAgents++;
    this.emit('agentQuarantined', { agentId, quarantineRecord, reason });

    return quarantineRecord;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    this.updateMetricsSnapshot();
    return { ...this.metrics };
  }

  // Private implementation methods...

  private initializeComponents(): void {
    this.auditChain = new ImmutableAuditChain(this.config.audit);
    
    this.authenticator = new AgentAuthenticator({
      jwt: {
        privateKey: process.env.JWT_PRIVATE_KEY || '',
        publicKey: process.env.JWT_PUBLIC_KEY || '',
        algorithm: 'RS256',
        issuer: 'ossa-security',
        audience: 'ossa-agents'
      },
      credentialSalt: process.env.CREDENTIAL_SALT || 'default-salt',
      sessionTimeout: this.config.authentication.sessionTimeout,
      minimumTrustLevel: this.config.trustScoring.minimumTrust,
      mfaRequired: this.config.authentication.mfaRequired,
      riskThresholds: {
        low: 30,
        medium: 60,
        high: 80
      }
    });

    this.trustSystem = new TrustScoringSystem({
      decayRate: this.config.trustScoring.decayRate,
      auditConfig: this.config.audit,
      alertingConfig: {
        securityThreshold: 20,
        escalationThreshold: 10,
        notificationChannels: ['log']
      }
    });

    this.threatProtection = new MaliciousAgentProtection({
      autoResponse: this.config.threatProtection.autoQuarantine,
      behaviorThreshold: 2.0,
      monitoring: {
        enabled: this.config.threatProtection.realTimeMonitoring,
        interval: 10000,
        retention: 86400
      },
      sandbox: {
        defaultConfig: {
          maxCpuPercent: 25,
          maxMemoryMB: 512,
          maxNetworkMbps: 10,
          maxStorageMB: 1024,
          maxExecutionTime: 3600,
          allowedSyscalls: ['read', 'write', 'open', 'close'],
          blockedSyscalls: ['execve', 'fork', 'clone'],
          allowedNetworkHosts: [],
          blockedNetworkHosts: ['*'],
          fileSystemAccess: 'restricted',
          networkAccess: 'restricted',
          internetAccess: false
        },
        maxConcurrent: 10,
        cleanupInterval: 300
      },
      quarantine: {
        maxDuration: 604800, // 1 week
        autoReview: true,
        reviewInterval: 3600
      }
    });

    this.policyEngine = new SecurityPolicyEngine({
      auditConfig: this.config.audit,
      approvalTimeout: 3600,
      maxConcurrentEvaluations: 100,
      enableAnalytics: true,
      notificationChannels: {
        webhook: {
          enabled: false,
          url: ''
        }
      }
    });

    this.capabilitySystem = new CapabilityVerificationSystem({
      auditConfig: this.config.audit,
      defaultReviewFrequency: 'monthly',
      autoGrantEnabled: this.config.capabilityManagement.autoGrant,
      maxGrantDuration: 90,
      requiresApproval: this.config.capabilityManagement.reviewRequired,
      monitoringEnabled: this.config.capabilityManagement.usageMonitoring,
      anomalyDetection: true
    });
  }

  private setupEventHandlers(): void {
    // Trust system events
    this.trustSystem.on('trustDecayed', (event) => {
      this.handleTrustDecay(event);
    });

    this.trustSystem.on('securityIncident', (event) => {
      this.handleSecurityIncident(event.agentId, 'trust_violation', 'high', event);
    });

    // Threat protection events
    this.threatProtection.on('threatDetected', (event) => {
      this.handleThreatDetection(event);
    });

    this.threatProtection.on('agentQuarantined', (event) => {
      this.recordSecurityEvent({
        type: SecurityEventType.QUARANTINE_ACTIVATED,
        agentId: event.agentId,
        severity: 'high',
        source: 'threat-protection',
        description: event.reason,
        data: event
      });
    });

    // Policy engine events
    this.policyEngine.on('policyViolation', (event) => {
      this.handlePolicyViolation(event);
    });

    // Capability system events
    this.capabilitySystem.on('capabilityRevoked', (event) => {
      this.recordSecurityEvent({
        type: SecurityEventType.CAPABILITY_REVOKED,
        agentId: event.grant.agentId,
        severity: 'medium',
        source: 'capability-system',
        description: `Capability revoked: ${event.reason}`,
        data: event
      });
    });
  }

  private makeSecurityDecision(
    assessment: ComprehensiveSecurityAssessment,
    requestType: string,
    context: SecurityContext
  ): SecurityDecision {
    const decision: SecurityDecision = {
      allowed: true,
      confidence: assessment.confidence,
      reasons: [],
      restrictions: [],
      monitoring: [],
      validFor: 3600, // 1 hour default
      metadata: {
        riskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        trustScore: assessment.trustAssessment.currentScore
      }
    };

    // Risk-based decision making
    if (assessment.riskLevel === 'critical') {
      decision.allowed = false;
      decision.reasons.push('Critical risk level detected');
      decision.escalation = 'immediate';
    } else if (assessment.riskLevel === 'high') {
      decision.allowed = false;
      decision.reasons.push('High risk level requires approval');
      decision.escalation = 'approval_required';
    } else if (assessment.riskLevel === 'medium') {
      decision.allowed = true;
      decision.restrictions.push('enhanced_monitoring', 'limited_scope');
      decision.monitoring.push('behavior_tracking', 'resource_monitoring');
      decision.validFor = 1800; // 30 minutes
      decision.reasons.push('Medium risk - restricted access granted');
    } else {
      decision.reasons.push('Low risk - full access granted');
    }

    // Trust-based adjustments
    if (assessment.trustAssessment.level === TrustLevel.UNTRUSTED) {
      decision.allowed = false;
      decision.reasons.push('Untrusted agent');
    } else if (assessment.trustAssessment.level === TrustLevel.LOW) {
      decision.restrictions.push('sandbox_required', 'approval_for_sensitive');
      decision.validFor = Math.min(decision.validFor, 900); // 15 minutes max
    }

    // Threat-based adjustments
    if (assessment.threatAssessment.threatLevel !== 'none') {
      decision.restrictions.push('threat_monitoring');
      decision.monitoring.push('security_enhanced');
      decision.validFor = Math.min(decision.validFor, 600); // 10 minutes max
    }

    return decision;
  }

  private async executeImmediateActions(
    actions: ImmediateAction[],
    context: SecurityContext
  ): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.action) {
          case 'isolate':
            await this.threatProtection.createSandbox(context.agentId);
            break;
          case 'restrict':
            // Apply restrictions through policy engine
            break;
          case 'monitor':
            await this.enhanceMonitoring(context.agentId, 3600);
            break;
          case 'escalate':
            await this.escalateToAdministrators(context.agentId, action.reason);
            break;
        }
      } catch (error) {
        console.error(`Failed to execute immediate action ${action.action}:`, error);
      }
    }
  }

  private calculateOverallRiskScore(factors: {
    trustScore: number;
    threatLevel: string;
    policyViolations: number;
    capabilityRisk: number;
  }): number {
    let riskScore = 0;

    // Trust score factor (inverted - lower trust = higher risk)
    riskScore += (100 - factors.trustScore) * 0.3;

    // Threat level factor
    const threatScores = { 'none': 0, 'low': 20, 'medium': 50, 'high': 80, 'critical': 100 };
    riskScore += (threatScores[factors.threatLevel] || 0) * 0.4;

    // Policy violations factor
    riskScore += Math.min(factors.policyViolations * 10, 100) * 0.2;

    // Capability risk factor
    riskScore += factors.capabilityRisk * 0.1;

    return Math.min(100, Math.max(0, riskScore));
  }

  private scoreToRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  }

  private calculateCapabilityRisk(capabilities: any[]): number {
    // Calculate risk based on granted capabilities
    let risk = 0;
    
    for (const capability of capabilities) {
      // High-risk capabilities increase overall risk
      if (capability.metadata?.riskLevel === 'high') risk += 20;
      else if (capability.metadata?.riskLevel === 'medium') risk += 10;
      else if (capability.metadata?.riskLevel === 'critical') risk += 40;
    }

    return Math.min(100, risk);
  }

  private calculateTrustTrend(trustScore?: any): 'improving' | 'stable' | 'declining' {
    if (!trustScore || trustScore.history.length < 2) return 'stable';

    const recent = trustScore.history.slice(-5);
    const trend = recent[recent.length - 1].score - recent[0].score;

    if (trend > 5) return 'improving';
    if (trend < -5) return 'declining';
    return 'stable';
  }

  private extractTrustFactors(trustScore?: any): TrustFactor[] {
    if (!trustScore) return [];

    return Object.entries(trustScore.components || {}).map(([category, score]) => ({
      category,
      impact: Number(score) - 50, // Deviation from neutral (50)
      confidence: 80, // Default confidence
      description: `${category} component score: ${score}`
    }));
  }

  private async calculatePolicyCompliance(agentId: string): Promise<PolicyCompliance> {
    // Would get from policy engine
    return {
      overallCompliance: 85,
      violatingPolicies: [],
      complianceScore: 85,
      activeRestrictions: []
    };
  }

  private calculateOverallAccessLevel(capabilities: any[]): string {
    if (capabilities.length === 0) return 'none';
    
    const hasAdminCapabilities = capabilities.some(cap => 
      cap.permissions?.some(perm => 
        perm.actions?.includes('admin') || perm.actions?.includes('manage')
      )
    );
    
    if (hasAdminCapabilities) return 'admin';
    
    const hasWriteCapabilities = capabilities.some(cap => 
      cap.permissions?.some(perm => 
        perm.actions?.includes('write') || perm.actions?.includes('create')
      )
    );
    
    if (hasWriteCapabilities) return 'write';
    
    return 'read';
  }

  private generateSecurityRecommendations(
    riskScore: number,
    trustScore?: any,
    threatAssessment?: any
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    if (riskScore > 70) {
      recommendations.push({
        priority: 'high',
        category: 'trust',
        title: 'Implement Enhanced Monitoring',
        description: 'High risk score indicates need for enhanced monitoring',
        action: 'Enable comprehensive behavior tracking and real-time alerting',
        impact: 'Improved threat detection and faster incident response',
        effort: 'medium',
        timeline: 'immediate'
      });
    }

    if (trustScore && trustScore.currentScore < 30) {
      recommendations.push({
        priority: 'high',
        category: 'trust',
        title: 'Trust Rebuilding Program',
        description: 'Low trust score requires remediation',
        action: 'Implement supervised activities with gradual trust rebuilding',
        impact: 'Restored agent functionality with maintained security',
        effort: 'high',
        timeline: '1-2 weeks'
      });
    }

    return recommendations;
  }

  private determineImmediateActions(
    riskScore: number,
    threatAssessment?: any
  ): ImmediateAction[] {
    const actions: ImmediateAction[] = [];

    if (riskScore > 85) {
      actions.push({
        action: 'isolate',
        reason: 'Critical risk score detected',
        severity: 'critical',
        automatic: true,
        parameters: { riskScore }
      });
    } else if (riskScore > 60) {
      actions.push({
        action: 'restrict',
        reason: 'High risk score requires restrictions',
        severity: 'high',
        automatic: true,
        parameters: { riskScore, restrictions: ['limited_scope', 'enhanced_monitoring'] }
      });
    }

    if (threatAssessment && threatAssessment.threatLevel === 'critical') {
      actions.push({
        action: 'escalate',
        reason: 'Critical threat level detected',
        severity: 'critical',
        automatic: true,
        parameters: { threatLevel: threatAssessment.threatLevel }
      });
    }

    return actions;
  }

  private calculateAssessmentConfidence(trustScore?: any, threatAssessment?: any): number {
    let confidence = 100;

    // Reduce confidence based on data availability
    if (!trustScore) confidence -= 20;
    if (!threatAssessment) confidence -= 15;

    // Reduce confidence based on data quality
    if (trustScore && trustScore.history.length < 5) confidence -= 10;
    if (threatAssessment && threatAssessment.confidence < 80) confidence -= 10;

    return Math.max(0, confidence);
  }

  private mergeAccessDecisions(
    capabilityDecision: AccessDecision,
    policyResults: PolicyEvaluationResult[]
  ): AccessDecision {
    // Most restrictive decision wins
    let finalDecision = { ...capabilityDecision };

    for (const policyResult of policyResults) {
      if (policyResult.decision === 'deny') {
        finalDecision.allowed = false;
        finalDecision.reason = `Policy violation: ${policyResult.reasons.join(', ')}`;
      }
    }

    return finalDecision;
  }

  private async recordSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'handled'>): Promise<void> {
    const event: SecurityEvent = {
      ...eventData,
      id: this.generateEventId(),
      handled: false
    };

    this.securityEvents.set(event.id, event);

    // Auto-handle low severity events
    if (event.severity === 'low') {
      event.handled = true;
    }

    this.emit('securityEvent', event);
  }

  private updateSecurityContext(
    agentId: string,
    context: SecurityContext,
    decision: SecurityDecision
  ): void {
    const existingContext = this.agentContexts.get(agentId);
    if (existingContext) {
      existingContext.metadata.lastDecision = decision;
      existingContext.metadata.lastActivity = new Date();
    }
  }

  private calculateQuarantineDuration(severity: 'low' | 'medium' | 'high' | 'critical'): number {
    const durations = {
      low: 3600,      // 1 hour
      medium: 7200,   // 2 hours
      high: 86400,    // 24 hours
      critical: 604800 // 1 week
    };
    
    return durations[severity];
  }

  private updateSecurityMetrics(agentId: string, trustScore?: any, threatAssessment?: any): void {
    // Update metrics based on security events
    this.metrics.lastUpdated = new Date();
  }

  private async startAgentMonitoring(agentId: string): Promise<void> {
    // Start comprehensive monitoring for agent
  }

  private async handleTrustDecay(event: any): Promise<void> {
    // Handle trust decay events
  }

  private async handleThreatDetection(event: any): Promise<void> {
    await this.recordSecurityEvent({
      type: SecurityEventType.THREAT_DETECTED,
      agentId: event.agentId,
      severity: event.threat.severity === 'critical' ? 'critical' : 'high',
      source: 'threat-protection',
      description: `Threat detected: ${event.threat.threatType}`,
      data: event
    });

    this.metrics.threatDetections++;
  }

  private async handlePolicyViolation(event: any): Promise<void> {
    await this.recordSecurityEvent({
      type: SecurityEventType.POLICY_VIOLATION,
      agentId: event.violation.agentId,
      severity: event.violation.severity,
      source: 'policy-engine',
      description: `Policy violation: ${event.violation.description}`,
      data: event
    });

    this.metrics.policyViolations++;
  }

  private async handleSecurityError(agentId: string, context: SecurityContext, error: Error): Promise<void> {
    await this.recordSecurityEvent({
      type: SecurityEventType.SECURITY_INCIDENT,
      agentId,
      severity: 'high',
      source: 'security-orchestrator',
      description: `Security validation error: ${error.message}`,
      data: { error: error.message, context }
    });
  }

  private async enhanceMonitoring(agentId: string, duration: number): Promise<void> {
    // Implementation would enhance monitoring for specified duration
  }

  private async escalateToAdministrators(agentId: string, reason: string): Promise<void> {
    // Implementation would escalate to administrators
  }

  private initializeMetrics(): SecurityMetrics {
    return {
      totalAgents: 0,
      authenticatedAgents: 0,
      quarantinedAgents: 0,
      highRiskAgents: 0,
      averageTrustScore: 50,
      securityIncidents: 0,
      policyViolations: 0,
      threatDetections: 0,
      lastUpdated: new Date()
    };
  }

  private updateMetricsSnapshot(): void {
    // Update current metrics snapshot
    this.metrics.totalAgents = this.agentContexts.size;
    this.metrics.lastUpdated = new Date();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startMonitoring(): void {
    // Start periodic security monitoring and maintenance
    setInterval(() => {
      this.performSecurityMaintenance();
    }, 60000); // Every minute
  }

  private async performSecurityMaintenance(): Promise<void> {
    // Clean up expired sessions, update metrics, check for overdue reviews, etc.
    this.updateMetricsSnapshot();
    
    // Clean up old security events
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [eventId, event] of this.securityEvents) {
      if (event.timestamp.getTime() < cutoffTime && event.handled) {
        this.securityEvents.delete(eventId);
      }
    }
  }
}