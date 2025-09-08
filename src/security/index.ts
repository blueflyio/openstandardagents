/**
 * OSSA Security Module - Main Exports
 * Comprehensive security and trust model implementation
 */

// Core Components
export { SecurityOrchestrator } from './security-orchestrator';
export { AgentAuthenticator } from './agent-authentication';
export { TrustScoringSystem } from './trust-scoring-system';
export { MaliciousAgentProtection } from './malicious-agent-protection';
export { SecurityPolicyEngine } from './policy-enforcement';
export { CapabilityVerificationSystem } from './capability-verification';
export { ImmutableAuditChain } from './audit-chain';

// Types and Interfaces

// Authentication Types
export type {
  AgentIdentity,
  AgentCapability,
  AgentCredential,
  AuthenticationContext,
  AuthenticationResult,
  AuthenticationCredentials,
  AuthenticationConfig
} from './agent-authentication';

// Trust System Types
export type {
  TrustScore,
  TrustComponents,
  BehaviorObservation,
  BehaviorType,
  TrustLevel,
  TrustPolicy,
  TrustSystemConfig
} from './trust-scoring-system';

// Threat Protection Types
export type {
  ThreatDetection,
  ThreatLevel,
  ThreatType,
  SandboxEnvironment,
  QuarantineRecord,
  ThreatAssessment,
  ProtectionConfig
} from './malicious-agent-protection';

// Policy Enforcement Types
export type {
  SecurityPolicy,
  PolicyRule,
  PolicyAction,
  PolicyType,
  PolicyEvaluationContext,
  PolicyEvaluationResult,
  PolicyViolation,
  PolicyEngineConfig
} from './policy-enforcement';

// Capability Verification Types
export type {
  CapabilityDefinition,
  CapabilityRequest,
  CapabilityGrant,
  VerificationResult,
  AccessRequest,
  AccessDecision,
  CapabilityType,
  AccessLevel,
  CapabilityConfig
} from './capability-verification';

// Audit Chain Types
export type {
  AuditBlock,
  AuditEvent,
  AuditEventType,
  AuditChainConfig,
  VerificationResult as AuditVerificationResult,
  SearchQuery,
  SearchResult
} from './audit-chain';

// Security Orchestrator Types
export type {
  SecurityOrchestrationConfig,
  ComprehensiveSecurityAssessment,
  SecurityDecision,
  SecurityEvent,
  SecurityEventType,
  SecurityMetrics
} from './security-orchestrator';

// Enums
export {
  TrustLevel,
  BehaviorType
} from './trust-scoring-system';

export {
  ThreatLevel,
  ThreatType,
  IsolationLevel
} from './malicious-agent-protection';

export {
  PolicyType,
  PolicyAction,
  PolicyPriority
} from './policy-enforcement';

export {
  CapabilityType,
  AccessLevel,
  VerificationStatus
} from './capability-verification';

export {
  AuditEventType
} from './audit-chain';

export {
  SecurityEventType
} from './security-orchestrator';

// Factory function for creating a complete security system
export function createSecuritySystem(config: SecurityOrchestrationConfig) {
  return new SecurityOrchestrator(config);
}

// Default configuration template
export const defaultSecurityConfig: SecurityOrchestrationConfig = {
  authentication: {
    enabled: true,
    methods: ['jwt', 'api_key', 'certificate'],
    mfaRequired: false,
    sessionTimeout: 3600
  },
  trustScoring: {
    enabled: true,
    decayRate: 0.05,
    minimumTrust: TrustLevel.LOW,
    updateFrequency: 300
  },
  threatProtection: {
    enabled: true,
    autoQuarantine: true,
    sandboxing: true,
    realTimeMonitoring: true
  },
  policyEnforcement: {
    enabled: true,
    strictMode: false,
    autoResponse: true,
    approvalWorkflow: true
  },
  capabilityManagement: {
    enabled: true,
    autoGrant: false,
    reviewRequired: true,
    usageMonitoring: true
  },
  audit: {
    enabled: true,
    immutableChain: true,
    realTimeLogging: true,
    retention: 365
  },
  integration: {
    crossSystemValidation: true,
    consensusRequired: false,
    escalationThresholds: {
      riskScore: 80,
      trustScore: 20,
      threatLevel: 'high',
      violationCount: 3,
      timeWindow: 3600
    }
  }
};

// Utility functions
export function createDefaultTrustScore(agentId: string): TrustScore {
  return {
    agentId,
    currentScore: 50,
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
      reason: 'Initial trust score',
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
      certifications: [],
      flags: []
    }
  };
}

export function createStandardCapabilityDefinition(
  name: string,
  type: CapabilityType,
  permissions: string[]
): Omit<CapabilityDefinition, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name,
    description: `Standard ${type} capability`,
    type,
    category: 'standard',
    version: '1.0.0',
    requirements: [{
      type: 'trust_level',
      condition: 'trust_level >= medium',
      value: TrustLevel.MEDIUM,
      operator: 'greater_than',
      mandatory: true,
      weight: 100
    }],
    permissions: [{
      resource: '*',
      actions: permissions,
      conditions: [],
      scope: {
        type: 'global',
        identifiers: ['*'],
        inheritance: true
      },
      metadata: {
        owner: 'system',
        purpose: 'Standard capability permissions',
        sensitivity: 'internal',
        compliance: [],
        auditRequired: false,
        reviewPeriod: 90,
        lastReviewed: new Date(),
        tags: ['standard']
      }
    }],
    restrictions: [],
    dependencies: [],
    conflicts: [],
    metadata: {
      provider: 'ossa-security',
      category: 'standard',
      tags: ['standard', type],
      documentation: '',
      examples: [],
      riskLevel: 'low',
      compliance: [],
      supportContact: 'security@ossa.dev',
      changeLog: []
    },
    isActive: true
  };
}

// Security best practices validation
export function validateSecurityConfig(config: SecurityOrchestrationConfig): string[] {
  const warnings: string[] = [];

  if (!config.authentication.enabled) {
    warnings.push('Authentication is disabled - this is not recommended for production');
  }

  if (!config.authentication.mfaRequired && config.authentication.enabled) {
    warnings.push('MFA is not required - consider enabling for enhanced security');
  }

  if (config.authentication.sessionTimeout > 7200) {
    warnings.push('Session timeout is longer than 2 hours - consider shorter timeouts for better security');
  }

  if (!config.trustScoring.enabled) {
    warnings.push('Trust scoring is disabled - behavioral analysis will not be available');
  }

  if (!config.threatProtection.enabled) {
    warnings.push('Threat protection is disabled - malicious agent detection will not function');
  }

  if (!config.audit.enabled) {
    warnings.push('Audit logging is disabled - compliance and forensic capabilities will be limited');
  }

  if (config.integration.escalationThresholds.riskScore > 90) {
    warnings.push('Risk score escalation threshold is very high - consider lowering for better protection');
  }

  return warnings;
}

// Version information
export const SECURITY_SYSTEM_VERSION = '1.0.0';
export const SECURITY_SYSTEM_BUILD = new Date().toISOString();

// Re-export commonly used constants
export const STANDARD_SESSION_TIMEOUT = 3600; // 1 hour
export const MINIMUM_TRUST_SCORE = 20;
export const MAXIMUM_RISK_SCORE = 100;
export const DEFAULT_QUARANTINE_DURATION = 86400; // 24 hours