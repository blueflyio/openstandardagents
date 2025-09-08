/**
 * OSSA Agent Capability Verification and Access Control System
 * Dynamic capability validation, permission management, and fine-grained access control
 * Zero-trust capability model with real-time verification and attestation
 */

import { EventEmitter } from 'events';
import { createHash, createSign, createVerify, randomBytes } from 'crypto';
import { AgentIdentity, AgentCapability, AgentAttestation } from './agent-authentication';
import { TrustLevel, TrustScore } from './trust-scoring-system';
import { SecurityPolicy, PolicyEvaluationContext, PolicyAction } from './policy-enforcement';
import { AuditEventType, ImmutableAuditChain } from './audit-chain';

export enum CapabilityType {
  COMPUTE = 'compute',
  STORAGE = 'storage',
  NETWORK = 'network',
  AI_MODEL = 'ai_model',
  DATA_ACCESS = 'data_access',
  COMMUNICATION = 'communication',
  COORDINATION = 'coordination',
  ADMINISTRATION = 'administration',
  SECURITY = 'security',
  AUDIT = 'audit'
}

export enum AccessLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  EXECUTE = 'execute',
  ADMIN = 'admin',
  FULL = 'full'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended'
}

export interface CapabilityDefinition {
  id: string;
  name: string;
  description: string;
  type: CapabilityType;
  category: string;
  version: string;
  requirements: CapabilityRequirement[];
  permissions: Permission[];
  restrictions: CapabilityRestriction[];
  dependencies: string[];
  conflicts: string[];
  metadata: CapabilityMetadata;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface CapabilityRequirement {
  type: 'trust_level' | 'attestation' | 'certification' | 'resource' | 'environment';
  condition: string;
  value: any;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches';
  mandatory: boolean;
  weight: number;
}

export interface Permission {
  resource: string;
  actions: string[];
  conditions: PermissionCondition[];
  scope: PermissionScope;
  timeWindow?: TimeWindow;
  rateLimit?: RateLimit;
  metadata: PermissionMetadata;
}

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: any;
  description: string;
}

export interface PermissionScope {
  type: 'global' | 'tenant' | 'user' | 'resource' | 'custom';
  identifiers: string[];
  excludes?: string[];
  inheritance: boolean;
}

export interface TimeWindow {
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  days: number[];    // 0=Sunday, 1=Monday, etc.
  timezone: string;
  exceptions?: Date[];
}

export interface RateLimit {
  requests: number;
  window: number; // seconds
  burst?: number;
  concurrency?: number;
}

export interface PermissionMetadata {
  owner: string;
  purpose: string;
  sensitivity: 'public' | 'internal' | 'confidential' | 'restricted';
  compliance: string[];
  auditRequired: boolean;
  reviewPeriod: number; // days
  lastReviewed: Date;
  tags: string[];
}

export interface CapabilityRestriction {
  type: 'resource_limit' | 'time_limit' | 'scope_limit' | 'frequency_limit' | 'approval_required';
  description: string;
  parameters: Record<string, any>;
  enforced: boolean;
  exceptions?: string[];
  overridePolicy?: string;
}

export interface CapabilityMetadata {
  provider: string;
  category: string;
  tags: string[];
  documentation: string;
  examples: CapabilityExample[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  compliance: ComplianceRequirement[];
  supportContact: string;
  changeLog: CapabilityChange[];
}

export interface CapabilityExample {
  name: string;
  description: string;
  code: string;
  expectedOutput?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ComplianceRequirement {
  framework: string;
  controls: string[];
  evidence: string[];
  lastAssessed: Date;
  nextAssessment: Date;
  status: 'compliant' | 'non_compliant' | 'partial' | 'unknown';
}

export interface CapabilityChange {
  version: string;
  date: Date;
  type: 'major' | 'minor' | 'patch' | 'security';
  description: string;
  author: string;
  breaking: boolean;
  migrationRequired: boolean;
}

export interface CapabilityRequest {
  id: string;
  agentId: string;
  capabilityId: string;
  requestedPermissions: string[];
  justification: string;
  requestType: 'permanent' | 'temporary' | 'conditional';
  duration?: number;
  conditions?: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  businessJustification: string;
  riskAssessment: RiskAssessment;
  status: RequestStatus;
  submittedAt: Date;
  reviewedAt?: Date;
  approvedAt?: Date;
  reviewers: string[];
  approvers: string[];
  reviews: CapabilityReview[];
  metadata: Record<string, any>;
}

export interface RiskAssessment {
  riskScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  mitigations: RiskMitigation[];
  residualRisk: number;
  acceptableRisk: boolean;
  assessedBy: string;
  assessedAt: Date;
  validUntil: Date;
}

export interface RiskFactor {
  category: 'technical' | 'operational' | 'compliance' | 'business';
  description: string;
  likelihood: number; // 0-100
  impact: number; // 0-100
  riskScore: number;
  mitigation?: string;
}

export interface RiskMitigation {
  description: string;
  effectiveness: number; // 0-100
  cost: 'low' | 'medium' | 'high';
  timeToImplement: number; // days
  responsible: string;
  status: 'planned' | 'implemented' | 'verified' | 'failed';
}

export enum RequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  WITHDRAWN = 'withdrawn'
}

export interface CapabilityReview {
  reviewerId: string;
  reviewType: 'technical' | 'security' | 'compliance' | 'business';
  decision: 'approve' | 'reject' | 'request_changes' | 'escalate';
  comments: string;
  conditions?: string[];
  score: number; // 0-100
  reviewedAt: Date;
  metadata: Record<string, any>;
}

export interface CapabilityGrant {
  id: string;
  agentId: string;
  capabilityId: string;
  permissions: GrantedPermission[];
  restrictions: GrantRestriction[];
  conditions: GrantCondition[];
  grantedAt: Date;
  grantedBy: string;
  validFrom: Date;
  validUntil?: Date;
  status: GrantStatus;
  usageTracking: UsageTracking;
  reviewSchedule: ReviewSchedule;
  attestations: GrantAttestation[];
  metadata: GrantMetadata;
}

export interface GrantedPermission {
  resource: string;
  actions: string[];
  scope: PermissionScope;
  limitations: PermissionLimitation[];
  monitored: boolean;
  auditRequired: boolean;
}

export interface PermissionLimitation {
  type: 'count' | 'size' | 'frequency' | 'time' | 'scope';
  limit: number;
  period?: number;
  unit: string;
  breachAction: 'warn' | 'restrict' | 'revoke' | 'escalate';
}

export interface GrantRestriction {
  type: 'environment' | 'time' | 'location' | 'resource' | 'approval';
  description: string;
  parameters: Record<string, any>;
  enforced: boolean;
  violationAction: 'warn' | 'block' | 'revoke' | 'escalate';
}

export interface GrantCondition {
  condition: string;
  description: string;
  continuous: boolean; // Check continuously vs. once at grant time
  frequency?: number; // Check frequency in seconds
  violationAction: 'warn' | 'suspend' | 'revoke' | 'escalate';
}

export enum GrantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export interface UsageTracking {
  totalUsage: number;
  dailyUsage: Record<string, number>;
  weeklyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
  lastUsed: Date;
  averageUsagePerDay: number;
  peakUsage: number;
  unusualPatterns: UsageAnomaly[];
}

export interface UsageAnomaly {
  type: 'spike' | 'unusual_time' | 'unusual_location' | 'bulk_operation';
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  investigated: boolean;
  resolution?: string;
}

export interface ReviewSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  nextReview: Date;
  lastReview?: Date;
  overdue: boolean;
  autoRevoke: boolean;
  gracePeriod: number; // days
}

export interface GrantAttestation {
  id: string;
  type: 'usage' | 'compliance' | 'security' | 'performance';
  status: VerificationStatus;
  attestedBy: string;
  attestedAt: Date;
  validUntil: Date;
  evidence: AttestationEvidence[];
  signature?: string;
  metadata: Record<string, any>;
}

export interface AttestationEvidence {
  type: 'log' | 'metric' | 'certificate' | 'audit' | 'test_result';
  description: string;
  data: any;
  verifiable: boolean;
  hash: string;
  timestamp: Date;
}

export interface GrantMetadata {
  purpose: string;
  businessJustification: string;
  riskAcceptance: string;
  compliance: string[];
  stakeholders: string[];
  emergencyContact: string;
  documentation: string;
  tags: string[];
}

export interface AccessControlMatrix {
  agentId: string;
  capabilities: Map<string, CapabilityGrant>;
  effectivePermissions: EffectivePermission[];
  restrictions: AccessRestriction[];
  lastUpdated: Date;
  cacheExpiry: Date;
}

export interface EffectivePermission {
  resource: string;
  actions: string[];
  level: AccessLevel;
  source: string; // Capability ID that granted this permission
  conditions: string[];
  limitations: PermissionLimitation[];
}

export interface AccessRestriction {
  type: 'capability' | 'resource' | 'action' | 'time' | 'location';
  description: string;
  source: string;
  enforceable: boolean;
  parameters: Record<string, any>;
}

export interface AccessRequest {
  agentId: string;
  resource: string;
  action: string;
  context: AccessContext;
  timestamp: Date;
}

export interface AccessContext {
  sessionId: string;
  requestId: string;
  clientIP: string;
  userAgent: string;
  environment: string;
  metadata: Record<string, any>;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  appliedPermissions: string[];
  appliedRestrictions: string[];
  conditions: string[];
  monitoring: MonitoringRequirement[];
  audit: boolean;
  confidence: number;
  evaluationTime: number;
  metadata: Record<string, any>;
}

export interface MonitoringRequirement {
  type: 'usage' | 'behavior' | 'performance' | 'security';
  level: 'basic' | 'enhanced' | 'comprehensive';
  duration: number;
  alertThresholds: Record<string, number>;
}

export class CapabilityVerificationSystem extends EventEmitter {
  private capabilities: Map<string, CapabilityDefinition> = new Map();
  private grants: Map<string, CapabilityGrant> = new Map();
  private requests: Map<string, CapabilityRequest> = new Map();
  private accessMatrix: Map<string, AccessControlMatrix> = new Map();
  private auditChain: ImmutableAuditChain;

  constructor(private config: CapabilityConfig) {
    super();
    this.auditChain = new ImmutableAuditChain(config.auditConfig);
    this.initializeStandardCapabilities();
    this.startMonitoring();
  }

  /**
   * Register a new capability definition
   */
  async registerCapability(capability: Omit<CapabilityDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<CapabilityDefinition> {
    const capabilityId = this.generateCapabilityId(capability.name);
    
    const definition: CapabilityDefinition = {
      ...capability,
      id: capabilityId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate capability definition
    await this.validateCapabilityDefinition(definition);

    // Store capability
    this.capabilities.set(capabilityId, definition);

    // Audit log
    await this.auditChain.recordEvent({
      type: AuditEventType.SYSTEM_STARTED,
      agentId: 'system',
      timestamp: new Date(),
      data: { capabilityId, name: capability.name, type: capability.type },
      metadata: {
        source: 'capability-system',
        severity: 'medium',
        category: 'capability_management',
        tags: ['capability', 'registration']
      }
    });

    this.emit('capabilityRegistered', { capabilityId, definition });
    return definition;
  }

  /**
   * Request capability for an agent
   */
  async requestCapability(request: Omit<CapabilityRequest, 'id' | 'submittedAt' | 'status'>): Promise<CapabilityRequest> {
    const requestId = this.generateRequestId();
    
    const capabilityRequest: CapabilityRequest = {
      ...request,
      id: requestId,
      submittedAt: new Date(),
      status: RequestStatus.SUBMITTED,
      reviews: []
    };

    // Validate request
    await this.validateCapabilityRequest(capabilityRequest);

    // Perform automatic security checks
    const securityCheck = await this.performSecurityCheck(capabilityRequest);
    if (!securityCheck.passed) {
      capabilityRequest.status = RequestStatus.REJECTED;
      capabilityRequest.metadata.rejectionReason = securityCheck.reason;
    }

    this.requests.set(requestId, capabilityRequest);

    // Trigger review workflow if not automatically rejected
    if (capabilityRequest.status === RequestStatus.SUBMITTED) {
      await this.initiateReviewProcess(capabilityRequest);
    }

    // Audit log
    await this.auditChain.recordEvent({
      type: AuditEventType.PERMISSION_GRANTED,
      agentId: request.agentId,
      timestamp: new Date(),
      data: { requestId, capabilityId: request.capabilityId, status: capabilityRequest.status },
      metadata: {
        source: 'capability-system',
        severity: 'medium',
        category: 'capability_request',
        tags: ['capability', 'request']
      }
    });

    this.emit('capabilityRequested', { requestId, request: capabilityRequest });
    return capabilityRequest;
  }

  /**
   * Grant capability to an agent
   */
  async grantCapability(
    agentId: string,
    capabilityId: string,
    permissions: GrantedPermission[],
    restrictions: GrantRestriction[] = [],
    conditions: GrantCondition[] = [],
    validUntil?: Date
  ): Promise<CapabilityGrant> {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) {
      throw new Error(`Capability ${capabilityId} not found`);
    }

    const grantId = this.generateGrantId();
    
    const grant: CapabilityGrant = {
      id: grantId,
      agentId,
      capabilityId,
      permissions,
      restrictions,
      conditions,
      grantedAt: new Date(),
      grantedBy: 'system', // In practice, would be the granting user/system
      validFrom: new Date(),
      validUntil,
      status: GrantStatus.ACTIVE,
      usageTracking: this.initializeUsageTracking(),
      reviewSchedule: this.createReviewSchedule(capability),
      attestations: [],
      metadata: {
        purpose: 'System granted capability',
        businessJustification: 'Automated capability grant',
        riskAcceptance: 'Acceptable risk level',
        compliance: [],
        stakeholders: [],
        emergencyContact: '',
        documentation: '',
        tags: []
      }
    };

    this.grants.set(grantId, grant);

    // Update access control matrix
    await this.updateAccessMatrix(agentId);

    // Start monitoring usage
    this.startUsageMonitoring(grant);

    // Audit log
    await this.auditChain.recordEvent({
      type: AuditEventType.PERMISSION_GRANTED,
      agentId,
      timestamp: new Date(),
      data: { grantId, capabilityId, permissions: permissions.length },
      metadata: {
        source: 'capability-system',
        severity: 'high',
        category: 'capability_grant',
        tags: ['capability', 'grant']
      }
    });

    this.emit('capabilityGranted', { grantId, grant });
    return grant;
  }

  /**
   * Verify agent has required capability
   */
  async verifyCapability(agentId: string, capabilityId: string, requiredLevel?: AccessLevel): Promise<VerificationResult> {
    const result: VerificationResult = {
      agentId,
      capabilityId,
      verified: false,
      level: AccessLevel.NONE,
      permissions: [],
      restrictions: [],
      conditions: [],
      reasons: [],
      confidence: 0,
      verifiedAt: new Date(),
      validUntil: new Date(Date.now() + 3600000), // 1 hour default
      metadata: {}
    };

    try {
      // Check if agent has active grants for this capability
      const grants = this.getAgentGrants(agentId, capabilityId);
      
      if (grants.length === 0) {
        result.reasons.push('No active grants found for this capability');
        return result;
      }

      // Check grant validity
      const activeGrants = grants.filter(grant => this.isGrantActive(grant));
      
      if (activeGrants.length === 0) {
        result.reasons.push('All grants are inactive, expired, or suspended');
        return result;
      }

      // Verify conditions for active grants
      const verifiedGrants: CapabilityGrant[] = [];
      
      for (const grant of activeGrants) {
        const conditionCheck = await this.verifyGrantConditions(grant);
        if (conditionCheck.passed) {
          verifiedGrants.push(grant);
        } else {
          result.reasons.push(`Grant ${grant.id} failed condition check: ${conditionCheck.reason}`);
        }
      }

      if (verifiedGrants.length === 0) {
        result.reasons.push('No grants passed condition verification');
        return result;
      }

      // Calculate effective permissions and restrictions
      const effective = this.calculateEffectiveAccess(verifiedGrants);
      
      result.verified = true;
      result.level = effective.level;
      result.permissions = effective.permissions;
      result.restrictions = effective.restrictions;
      result.conditions = effective.conditions;
      result.confidence = this.calculateVerificationConfidence(verifiedGrants);
      result.validUntil = this.calculateValidityPeriod(verifiedGrants);
      result.reasons.push('Capability verified successfully');

      // Check if required level is met
      if (requiredLevel && !this.isAccessLevelSufficient(result.level, requiredLevel)) {
        result.verified = false;
        result.reasons.push(`Required access level ${requiredLevel} not met (current: ${result.level})`);
      }

      // Update usage tracking
      for (const grant of verifiedGrants) {
        this.trackCapabilityUsage(grant, 'verification');
      }

      return result;

    } catch (error) {
      result.reasons.push(`Verification failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Check access permissions for a specific request
   */
  async checkAccess(request: AccessRequest): Promise<AccessDecision> {
    const startTime = Date.now();
    
    const decision: AccessDecision = {
      allowed: false,
      reason: '',
      appliedPermissions: [],
      appliedRestrictions: [],
      conditions: [],
      monitoring: [],
      audit: false,
      confidence: 0,
      evaluationTime: 0,
      metadata: {}
    };

    try {
      // Get access control matrix for agent
      const matrix = await this.getAccessMatrix(request.agentId);
      
      if (!matrix) {
        decision.reason = 'No access control matrix found for agent';
        return decision;
      }

      // Find applicable permissions
      const applicablePermissions = matrix.effectivePermissions.filter(perm => 
        this.isPermissionApplicable(perm, request)
      );

      if (applicablePermissions.length === 0) {
        decision.reason = 'No applicable permissions found';
        return decision;
      }

      // Check restrictions
      const applicableRestrictions = matrix.restrictions.filter(restriction =>
        this.isRestrictionApplicable(restriction, request)
      );

      // Evaluate permissions and restrictions
      const permissionCheck = this.evaluatePermissions(applicablePermissions, request);
      const restrictionCheck = this.evaluateRestrictions(applicableRestrictions, request);

      // Make final decision
      if (permissionCheck.allowed && restrictionCheck.allowed) {
        decision.allowed = true;
        decision.reason = 'Access granted';
        decision.appliedPermissions = permissionCheck.applied;
        decision.appliedRestrictions = restrictionCheck.applied;
        decision.conditions = [...permissionCheck.conditions, ...restrictionCheck.conditions];
        decision.confidence = Math.min(permissionCheck.confidence, restrictionCheck.confidence);
      } else {
        decision.allowed = false;
        decision.reason = permissionCheck.allowed ? restrictionCheck.reason : permissionCheck.reason;
        decision.appliedRestrictions = restrictionCheck.applied;
      }

      // Determine monitoring requirements
      decision.monitoring = this.determineMonitoringRequirements(
        applicablePermissions, 
        applicableRestrictions, 
        request
      );

      // Check if audit is required
      decision.audit = applicablePermissions.some(perm => perm.source && 
        this.grants.get(perm.source)?.permissions.some(gp => gp.auditRequired)
      );

      decision.evaluationTime = Date.now() - startTime;

      // Record access attempt
      await this.recordAccessAttempt(request, decision);

      return decision;

    } catch (error) {
      decision.reason = `Access evaluation failed: ${error.message}`;
      decision.evaluationTime = Date.now() - startTime;
      return decision;
    }
  }

  /**
   * Revoke capability grant
   */
  async revokeCapability(grantId: string, reason: string, revokedBy: string): Promise<boolean> {
    const grant = this.grants.get(grantId);
    if (!grant) {
      return false;
    }

    // Update grant status
    grant.status = GrantStatus.REVOKED;
    grant.metadata.revocationReason = reason;
    grant.metadata.revokedBy = revokedBy;
    grant.metadata.revokedAt = new Date();

    // Update access control matrix
    await this.updateAccessMatrix(grant.agentId);

    // Stop monitoring
    this.stopUsageMonitoring(grant);

    // Audit log
    await this.auditChain.recordEvent({
      type: AuditEventType.PERMISSION_DENIED,
      agentId: grant.agentId,
      timestamp: new Date(),
      data: { grantId, capabilityId: grant.capabilityId, reason },
      metadata: {
        source: 'capability-system',
        severity: 'high',
        category: 'capability_revocation',
        tags: ['capability', 'revocation']
      }
    });

    this.emit('capabilityRevoked', { grantId, grant, reason, revokedBy });
    return true;
  }

  /**
   * Get agent's capabilities
   */
  getAgentCapabilities(agentId: string): CapabilityGrant[] {
    return Array.from(this.grants.values()).filter(grant => 
      grant.agentId === agentId && this.isGrantActive(grant)
    );
  }

  /**
   * Get capability definition
   */
  getCapability(capabilityId: string): CapabilityDefinition | undefined {
    return this.capabilities.get(capabilityId);
  }

  /**
   * List available capabilities
   */
  getAvailableCapabilities(category?: string, type?: CapabilityType): CapabilityDefinition[] {
    let capabilities = Array.from(this.capabilities.values()).filter(cap => cap.isActive);
    
    if (category) {
      capabilities = capabilities.filter(cap => cap.category === category);
    }
    
    if (type) {
      capabilities = capabilities.filter(cap => cap.type === type);
    }
    
    return capabilities;
  }

  // Private implementation methods...

  private getAgentGrants(agentId: string, capabilityId?: string): CapabilityGrant[] {
    let grants = Array.from(this.grants.values()).filter(grant => grant.agentId === agentId);
    
    if (capabilityId) {
      grants = grants.filter(grant => grant.capabilityId === capabilityId);
    }
    
    return grants;
  }

  private isGrantActive(grant: CapabilityGrant): boolean {
    if (grant.status !== GrantStatus.ACTIVE) {
      return false;
    }
    
    const now = new Date();
    if (now < grant.validFrom) {
      return false;
    }
    
    if (grant.validUntil && now > grant.validUntil) {
      grant.status = GrantStatus.EXPIRED;
      return false;
    }
    
    return true;
  }

  private async verifyGrantConditions(grant: CapabilityGrant): Promise<{ passed: boolean; reason?: string }> {
    for (const condition of grant.conditions) {
      const result = await this.evaluateCondition(condition, grant.agentId);
      if (!result.passed) {
        return { passed: false, reason: result.reason };
      }
    }
    
    return { passed: true };
  }

  private async evaluateCondition(condition: GrantCondition, agentId: string): Promise<{ passed: boolean; reason?: string }> {
    try {
      // In a real implementation, this would use a safe expression evaluator
      // For now, we'll use a simple placeholder
      return { passed: true };
    } catch (error) {
      return { passed: false, reason: `Condition evaluation failed: ${error.message}` };
    }
  }

  private calculateEffectiveAccess(grants: CapabilityGrant[]): EffectiveAccess {
    const permissions: string[] = [];
    const restrictions: string[] = [];
    const conditions: string[] = [];
    let maxLevel = AccessLevel.NONE;

    for (const grant of grants) {
      // Collect permissions
      for (const perm of grant.permissions) {
        permissions.push(...perm.actions);
      }

      // Collect restrictions
      for (const restriction of grant.restrictions) {
        restrictions.push(restriction.description);
      }

      // Collect conditions
      for (const condition of grant.conditions) {
        conditions.push(condition.description);
      }

      // Calculate maximum access level
      const grantLevel = this.calculateGrantAccessLevel(grant);
      if (this.isAccessLevelHigher(grantLevel, maxLevel)) {
        maxLevel = grantLevel;
      }
    }

    return {
      level: maxLevel,
      permissions: [...new Set(permissions)],
      restrictions: [...new Set(restrictions)],
      conditions: [...new Set(conditions)]
    };
  }

  private calculateGrantAccessLevel(grant: CapabilityGrant): AccessLevel {
    // Simple heuristic based on granted permissions
    const hasAdminActions = grant.permissions.some(perm => 
      perm.actions.some(action => action.includes('admin') || action.includes('manage'))
    );
    
    if (hasAdminActions) return AccessLevel.ADMIN;
    
    const hasWriteActions = grant.permissions.some(perm => 
      perm.actions.some(action => action.includes('write') || action.includes('create') || action.includes('update'))
    );
    
    if (hasWriteActions) return AccessLevel.WRITE;
    
    const hasExecuteActions = grant.permissions.some(perm => 
      perm.actions.some(action => action.includes('execute') || action.includes('run'))
    );
    
    if (hasExecuteActions) return AccessLevel.EXECUTE;
    
    return AccessLevel.READ;
  }

  private isAccessLevelHigher(level1: AccessLevel, level2: AccessLevel): boolean {
    const levels = {
      [AccessLevel.NONE]: 0,
      [AccessLevel.READ]: 1,
      [AccessLevel.WRITE]: 2,
      [AccessLevel.EXECUTE]: 3,
      [AccessLevel.ADMIN]: 4,
      [AccessLevel.FULL]: 5
    };
    
    return levels[level1] > levels[level2];
  }

  private isAccessLevelSufficient(current: AccessLevel, required: AccessLevel): boolean {
    const levels = {
      [AccessLevel.NONE]: 0,
      [AccessLevel.READ]: 1,
      [AccessLevel.WRITE]: 2,
      [AccessLevel.EXECUTE]: 3,
      [AccessLevel.ADMIN]: 4,
      [AccessLevel.FULL]: 5
    };
    
    return levels[current] >= levels[required];
  }

  private calculateVerificationConfidence(grants: CapabilityGrant[]): number {
    if (grants.length === 0) return 0;
    
    let totalConfidence = 0;
    
    for (const grant of grants) {
      let grantConfidence = 90; // Base confidence
      
      // Reduce confidence for conditions
      grantConfidence -= grant.conditions.length * 5;
      
      // Reduce confidence for restrictions
      grantConfidence -= grant.restrictions.length * 3;
      
      // Reduce confidence based on age
      const age = Date.now() - grant.grantedAt.getTime();
      const ageInDays = age / (1000 * 60 * 60 * 24);
      grantConfidence -= Math.min(ageInDays * 0.1, 10);
      
      totalConfidence += Math.max(0, grantConfidence);
    }
    
    return Math.min(100, totalConfidence / grants.length);
  }

  private calculateValidityPeriod(grants: CapabilityGrant[]): Date {
    let earliest = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
    
    for (const grant of grants) {
      if (grant.validUntil && grant.validUntil < earliest) {
        earliest = grant.validUntil;
      }
    }
    
    return earliest;
  }

  private async getAccessMatrix(agentId: string): Promise<AccessControlMatrix | undefined> {
    let matrix = this.accessMatrix.get(agentId);
    
    // Check if matrix needs refresh
    if (!matrix || matrix.cacheExpiry < new Date()) {
      await this.updateAccessMatrix(agentId);
      matrix = this.accessMatrix.get(agentId);
    }
    
    return matrix;
  }

  private async updateAccessMatrix(agentId: string): Promise<void> {
    const grants = this.getAgentCapabilities(agentId);
    const effectivePermissions: EffectivePermission[] = [];
    const restrictions: AccessRestriction[] = [];

    // Build effective permissions from all grants
    for (const grant of grants) {
      for (const permission of grant.permissions) {
        effectivePermissions.push({
          resource: permission.resource,
          actions: permission.actions,
          level: this.calculateGrantAccessLevel(grant),
          source: grant.id,
          conditions: grant.conditions.map(c => c.description),
          limitations: permission.limitations || []
        });
      }

      // Build restrictions
      for (const restriction of grant.restrictions) {
        restrictions.push({
          type: restriction.type as any,
          description: restriction.description,
          source: grant.id,
          enforceable: restriction.enforced,
          parameters: restriction.parameters
        });
      }
    }

    const matrix: AccessControlMatrix = {
      agentId,
      capabilities: new Map(grants.map(grant => [grant.capabilityId, grant])),
      effectivePermissions,
      restrictions,
      lastUpdated: new Date(),
      cacheExpiry: new Date(Date.now() + 300000) // 5 minutes cache
    };

    this.accessMatrix.set(agentId, matrix);
  }

  private isPermissionApplicable(permission: EffectivePermission, request: AccessRequest): boolean {
    // Check if resource matches
    if (permission.resource !== '*' && permission.resource !== request.resource) {
      return false;
    }

    // Check if action is allowed
    if (!permission.actions.includes('*') && !permission.actions.includes(request.action)) {
      return false;
    }

    return true;
  }

  private isRestrictionApplicable(restriction: AccessRestriction, request: AccessRequest): boolean {
    // Implement restriction applicability logic
    return true; // Placeholder
  }

  private evaluatePermissions(permissions: EffectivePermission[], request: AccessRequest): PermissionEvaluation {
    const result: PermissionEvaluation = {
      allowed: permissions.length > 0,
      applied: [],
      conditions: [],
      confidence: 100
    };

    for (const permission of permissions) {
      result.applied.push(permission.source);
      result.conditions.push(...permission.conditions);

      // Check limitations
      for (const limitation of permission.limitations) {
        const limitCheck = this.checkLimitation(limitation, request);
        if (!limitCheck.allowed) {
          result.allowed = false;
          result.reason = limitCheck.reason;
        }
      }
    }

    return result;
  }

  private evaluateRestrictions(restrictions: AccessRestriction[], request: AccessRequest): RestrictionEvaluation {
    const result: RestrictionEvaluation = {
      allowed: true,
      applied: [],
      conditions: [],
      confidence: 100
    };

    for (const restriction of restrictions) {
      if (restriction.enforceable) {
        const restrictionCheck = this.checkRestriction(restriction, request);
        if (!restrictionCheck.allowed) {
          result.allowed = false;
          result.reason = restrictionCheck.reason;
          result.applied.push(restriction.source);
        }
      }
    }

    return result;
  }

  private checkLimitation(limitation: PermissionLimitation, request: AccessRequest): { allowed: boolean; reason?: string } {
    // Implement limitation checking logic
    return { allowed: true }; // Placeholder
  }

  private checkRestriction(restriction: AccessRestriction, request: AccessRequest): { allowed: boolean; reason?: string } {
    // Implement restriction checking logic
    return { allowed: true }; // Placeholder
  }

  private determineMonitoringRequirements(
    permissions: EffectivePermission[],
    restrictions: AccessRestriction[],
    request: AccessRequest
  ): MonitoringRequirement[] {
    const requirements: MonitoringRequirement[] = [];

    // High-risk actions require enhanced monitoring
    if (request.action.includes('admin') || request.action.includes('delete')) {
      requirements.push({
        type: 'security',
        level: 'enhanced',
        duration: 3600, // 1 hour
        alertThresholds: { 'unusual_activity': 1 }
      });
    }

    return requirements;
  }

  private async recordAccessAttempt(request: AccessRequest, decision: AccessDecision): Promise<void> {
    await this.auditChain.recordEvent({
      type: decision.allowed ? AuditEventType.PERMISSION_GRANTED : AuditEventType.PERMISSION_DENIED,
      agentId: request.agentId,
      timestamp: request.timestamp,
      data: {
        resource: request.resource,
        action: request.action,
        decision: decision.allowed,
        reason: decision.reason
      },
      metadata: {
        source: 'capability-system',
        severity: decision.allowed ? 'low' : 'medium',
        category: 'access_control',
        tags: ['access', 'verification'],
        correlationId: request.context.requestId
      }
    });
  }

  private trackCapabilityUsage(grant: CapabilityGrant, operation: string): void {
    grant.usageTracking.totalUsage++;
    grant.usageTracking.lastUsed = new Date();

    const today = new Date().toISOString().split('T')[0];
    grant.usageTracking.dailyUsage[today] = (grant.usageTracking.dailyUsage[today] || 0) + 1;

    // Update average usage
    const daysActive = Object.keys(grant.usageTracking.dailyUsage).length;
    grant.usageTracking.averageUsagePerDay = grant.usageTracking.totalUsage / Math.max(1, daysActive);

    // Check for anomalies
    const dailyUsage = grant.usageTracking.dailyUsage[today];
    if (dailyUsage > grant.usageTracking.averageUsagePerDay * 3) {
      grant.usageTracking.unusualPatterns.push({
        type: 'spike',
        description: `Usage spike detected: ${dailyUsage} uses today vs ${grant.usageTracking.averageUsagePerDay.toFixed(1)} average`,
        timestamp: new Date(),
        severity: 'medium',
        investigated: false
      });
    }
  }

  private startUsageMonitoring(grant: CapabilityGrant): void {
    // Implementation would start monitoring grant usage
  }

  private stopUsageMonitoring(grant: CapabilityGrant): void {
    // Implementation would stop monitoring grant usage
  }

  private async validateCapabilityDefinition(definition: CapabilityDefinition): Promise<void> {
    if (!definition.name || !definition.type || !definition.requirements) {
      throw new Error('Invalid capability definition');
    }
  }

  private async validateCapabilityRequest(request: CapabilityRequest): Promise<void> {
    const capability = this.capabilities.get(request.capabilityId);
    if (!capability) {
      throw new Error(`Capability ${request.capabilityId} not found`);
    }

    if (!request.justification || !request.businessJustification) {
      throw new Error('Justification required for capability requests');
    }
  }

  private async performSecurityCheck(request: CapabilityRequest): Promise<{ passed: boolean; reason?: string }> {
    // Implement security checks
    return { passed: true };
  }

  private async initiateReviewProcess(request: CapabilityRequest): Promise<void> {
    // Implementation would initiate review workflow
  }

  private initializeUsageTracking(): UsageTracking {
    return {
      totalUsage: 0,
      dailyUsage: {},
      weeklyUsage: {},
      monthlyUsage: {},
      lastUsed: new Date(),
      averageUsagePerDay: 0,
      peakUsage: 0,
      unusualPatterns: []
    };
  }

  private createReviewSchedule(capability: CapabilityDefinition): ReviewSchedule {
    let frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually' = 'monthly';
    
    // High-risk capabilities require more frequent reviews
    if (capability.metadata.riskLevel === 'critical' || capability.metadata.riskLevel === 'high') {
      frequency = 'weekly';
    } else if (capability.metadata.riskLevel === 'medium') {
      frequency = 'monthly';
    } else {
      frequency = 'quarterly';
    }

    return {
      frequency,
      nextReview: this.calculateNextReviewDate(frequency),
      overdue: false,
      autoRevoke: false,
      gracePeriod: 7 // 7 days grace period
    };
  }

  private calculateNextReviewDate(frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually'): Date {
    const now = new Date();
    
    switch (frequency) {
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case 'annually':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
  }

  private generateCapabilityId(name: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `cap_${sanitized}_${randomBytes(8).toString('hex')}`;
  }

  private generateRequestId(): string {
    return `req_${randomBytes(16).toString('hex')}`;
  }

  private generateGrantId(): string {
    return `grant_${randomBytes(16).toString('hex')}`;
  }

  private initializeStandardCapabilities(): void {
    // Initialize with standard OSSA capabilities
  }

  private startMonitoring(): void {
    // Start monitoring capability usage and violations
    setInterval(() => {
      this.checkGrantExpirations();
      this.checkReviewSchedules();
      this.analyzeUsagePatterns();
    }, 60000); // Check every minute
  }

  private checkGrantExpirations(): void {
    const now = new Date();
    for (const [grantId, grant] of this.grants) {
      if (grant.validUntil && grant.validUntil < now && grant.status === GrantStatus.ACTIVE) {
        grant.status = GrantStatus.EXPIRED;
        this.updateAccessMatrix(grant.agentId);
        this.emit('grantExpired', { grantId, grant });
      }
    }
  }

  private checkReviewSchedules(): void {
    const now = new Date();
    for (const [grantId, grant] of this.grants) {
      if (grant.reviewSchedule.nextReview < now && !grant.reviewSchedule.overdue) {
        grant.reviewSchedule.overdue = true;
        this.emit('reviewOverdue', { grantId, grant });
      }
    }
  }

  private analyzeUsagePatterns(): void {
    // Analyze usage patterns for anomalies
  }
}

// Supporting interfaces
interface VerificationResult {
  agentId: string;
  capabilityId: string;
  verified: boolean;
  level: AccessLevel;
  permissions: string[];
  restrictions: string[];
  conditions: string[];
  reasons: string[];
  confidence: number;
  verifiedAt: Date;
  validUntil: Date;
  metadata: Record<string, any>;
}

interface EffectiveAccess {
  level: AccessLevel;
  permissions: string[];
  restrictions: string[];
  conditions: string[];
}

interface PermissionEvaluation {
  allowed: boolean;
  applied: string[];
  conditions: string[];
  confidence: number;
  reason?: string;
}

interface RestrictionEvaluation {
  allowed: boolean;
  applied: string[];
  conditions: string[];
  confidence: number;
  reason?: string;
}

export interface CapabilityConfig {
  auditConfig: any;
  defaultReviewFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  autoGrantEnabled: boolean;
  maxGrantDuration: number; // days
  requiresApproval: boolean;
  monitoringEnabled: boolean;
  anomalyDetection: boolean;
}