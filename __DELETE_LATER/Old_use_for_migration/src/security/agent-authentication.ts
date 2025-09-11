/**
 * OSSA Agent Authentication Framework
 * Multi-method authentication with trust-based authorization
 * Zero-trust security model with capability-based access control
 */

import { EventEmitter } from 'events';
import { createHash, createHmac, randomBytes, verify, sign } from 'crypto';
import { X509Certificate } from 'crypto';
import jwt from 'jsonwebtoken';
import { TrustLevel, TrustScore } from './trust-scoring-system';
import { 
  AuthenticatedRequest, 
  AuthenticatedUser, 
  JWTPayload, 
  JWTOptions,
  ClientCertificate,
  APIKey,
  AuthenticationError,
  AuthorizationError
} from '../auth/types';

export interface AgentIdentity {
  id: string;
  type: 'ai_agent' | 'human_agent' | 'service_agent' | 'system_agent';
  name: string;
  version: string;
  capabilities: AgentCapability[];
  credentials: AgentCredential[];
  trustLevel: TrustLevel;
  trustScore?: TrustScore;
  metadata: AgentMetadata;
  status: AgentStatus;
  createdAt: Date;
  lastSeen?: Date;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  category: 'computation' | 'communication' | 'storage' | 'analysis' | 'coordination';
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  permissions: string[];
  restrictions: string[];
  resourceLimits: ResourceLimit[];
  trustRequirement: TrustLevel;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

export interface AgentCredential {
  id: string;
  type: 'jwt' | 'api_key' | 'certificate' | 'oauth2' | 'biometric' | 'hardware_token';
  value: string; // Encrypted/hashed
  metadata: CredentialMetadata;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
  lastUsedAt?: Date;
  rotationSchedule?: RotationSchedule;
}

export interface CredentialMetadata {
  issuer: string;
  algorithm?: string;
  fingerprint?: string;
  scopes: string[];
  restrictions: string[];
  usage: {
    totalUses: number;
    lastMonthUses: number;
    errorCount: number;
    suspiciousActivity: number;
  };
}

export interface ResourceLimit {
  type: 'cpu' | 'memory' | 'network' | 'storage' | 'tokens' | 'requests';
  limit: number;
  unit: string;
  window: number; // seconds
  burst?: number;
}

export interface AgentMetadata {
  owner: string;
  organization?: string;
  environment: 'development' | 'staging' | 'production';
  tags: string[];
  attestations: AgentAttestation[];
  securityProfile: SecurityProfile;
  networkPolicy: NetworkPolicy;
}

export interface AgentAttestation {
  id: string;
  type: 'code_signing' | 'security_audit' | 'compliance_check' | 'performance_test';
  attester: string;
  attestedAt: Date;
  validUntil?: Date;
  result: 'pass' | 'fail' | 'warning';
  score?: number;
  evidence: AttestationEvidence[];
  hash: string;
}

export interface AttestationEvidence {
  type: 'document' | 'certificate' | 'signature' | 'measurement' | 'log';
  content: string;
  hash: string;
  verifiable: boolean;
}

export interface SecurityProfile {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  isolation: 'none' | 'process' | 'container' | 'vm' | 'hardware';
  monitoring: 'basic' | 'enhanced' | 'full' | 'debug';
  auditLevel: 'minimal' | 'standard' | 'comprehensive' | 'forensic';
  allowedActions: string[];
  blockedActions: string[];
  requiresApproval: string[];
}

export interface NetworkPolicy {
  allowedDomains: string[];
  blockedDomains: string[];
  allowedPorts: number[];
  blockedPorts: number[];
  requiresProxy: boolean;
  allowPeerToPeer: boolean;
  bandwidthLimit?: number;
}

export enum AgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  QUARANTINED = 'quarantined',
  TERMINATED = 'terminated'
}

export interface AuthenticationContext {
  method: 'jwt' | 'api_key' | 'certificate' | 'oauth2' | 'multi_factor';
  clientIP: string;
  userAgent: string;
  timestamp: Date;
  sessionId?: string;
  deviceFingerprint?: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
  riskFactors: RiskFactor[];
}

export interface RiskFactor {
  type: 'ip_reputation' | 'unusual_location' | 'unusual_time' | 'device_change' | 'behavior_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number; // 0-100
  description: string;
  mitigated: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  agent?: AgentIdentity;
  user?: AuthenticatedUser;
  token?: string;
  permissions: string[];
  restrictions: string[];
  sessionDuration: number;
  requiresMFA?: boolean;
  riskScore: number;
  trustScore?: number;
  errors?: AuthenticationError[];
  warnings?: string[];
  metadata: Record<string, any>;
}

export interface RotationSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextRotation: Date;
  gracePeriodDays: number;
  autoRotate: boolean;
  notifyBeforeDays: number;
}

export class AgentAuthenticator extends EventEmitter {
  private agents: Map<string, AgentIdentity> = new Map();
  private activeSessions: Map<string, AuthSession> = new Map();
  private credentialStore: Map<string, AgentCredential> = new Map();
  private trustScores: Map<string, TrustScore> = new Map();
  private authPolicies: Map<string, AuthPolicy> = new Map();

  constructor(private config: AuthenticationConfig) {
    super();
    this.initializeDefaultPolicies();
    this.startSessionMonitoring();
  }

  /**
   * Register a new agent in the authentication system
   */
  async registerAgent(
    identity: Omit<AgentIdentity, 'id' | 'createdAt' | 'status'>,
    credentials: Omit<AgentCredential, 'id' | 'createdAt' | 'isActive'>[]
  ): Promise<AgentIdentity> {
    const agentId = this.generateAgentId();
    
    const agent: AgentIdentity = {
      ...identity,
      id: agentId,
      status: AgentStatus.INACTIVE, // Start inactive, requires activation
      createdAt: new Date()
    };

    // Process and store credentials
    const processedCredentials: AgentCredential[] = [];
    for (const cred of credentials) {
      const credential: AgentCredential = {
        ...cred,
        id: this.generateCredentialId(),
        createdAt: new Date(),
        isActive: true,
        value: await this.encryptCredentialValue(cred.value)
      };
      
      processedCredentials.push(credential);
      this.credentialStore.set(credential.id, credential);
    }

    agent.credentials = processedCredentials;
    this.agents.set(agentId, agent);

    // Initialize trust score if provided
    if (identity.trustScore) {
      this.trustScores.set(agentId, identity.trustScore);
    }

    this.emit('agentRegistered', { agentId, agent });
    return agent;
  }

  /**
   * Authenticate an agent using multiple methods
   */
  async authenticateAgent(
    credentials: AuthenticationCredentials,
    context: AuthenticationContext
  ): Promise<AuthenticationResult> {
    const result: AuthenticationResult = {
      success: false,
      permissions: [],
      restrictions: [],
      sessionDuration: 0,
      riskScore: 0,
      metadata: {}
    };

    try {
      // Step 1: Credential verification
      const credentialResult = await this.verifyCredentials(credentials);
      if (!credentialResult.valid) {
        result.errors = [new AuthenticationError(
          'Invalid credentials',
          'CREDENTIAL_VERIFICATION_FAILED',
          401,
          { method: credentials.method }
        )];
        return result;
      }

      const agent = credentialResult.agent!;
      
      // Step 2: Agent status check
      if (agent.status !== AgentStatus.ACTIVE) {
        result.errors = [new AuthenticationError(
          `Agent is ${agent.status}`,
          'AGENT_NOT_ACTIVE',
          403,
          { agentId: agent.id, status: agent.status }
        )];
        return result;
      }

      // Step 3: Risk assessment
      const riskAssessment = await this.assessRisk(agent, context);
      result.riskScore = riskAssessment.score;

      // Step 4: Trust score verification
      const trustScore = this.trustScores.get(agent.id);
      if (trustScore) {
        result.trustScore = trustScore.currentScore;
        
        // Check if trust level is sufficient for authentication
        if (!this.verifyMinimumTrust(trustScore, this.config.minimumTrustLevel)) {
          result.errors = [new AuthorizationError(
            'Insufficient trust level',
            'INSUFFICIENT_TRUST',
            403,
            { currentLevel: trustScore.level, required: this.config.minimumTrustLevel }
          )];
          return result;
        }
      }

      // Step 5: Multi-factor authentication if required
      if (this.requiresMFA(agent, riskAssessment)) {
        if (!credentials.mfaToken) {
          result.requiresMFA = true;
          return result;
        }
        
        const mfaValid = await this.verifyMFA(agent.id, credentials.mfaToken);
        if (!mfaValid) {
          result.errors = [new AuthenticationError(
            'Invalid MFA token',
            'MFA_VERIFICATION_FAILED',
            401
          )];
          return result;
        }
      }

      // Step 6: Generate session and permissions
      const session = await this.createAuthSession(agent, context, riskAssessment);
      const permissions = await this.calculatePermissions(agent, trustScore, riskAssessment);
      const restrictions = await this.calculateRestrictions(agent, trustScore, riskAssessment);

      // Step 7: Update agent last seen
      agent.lastSeen = new Date();
      this.agents.set(agent.id, agent);

      // Success!
      result.success = true;
      result.agent = agent;
      result.token = session.token;
      result.permissions = permissions;
      result.restrictions = restrictions;
      result.sessionDuration = session.expiresIn;
      result.metadata = {
        sessionId: session.id,
        method: credentials.method,
        riskFactors: riskAssessment.factors
      };

      this.emit('agentAuthenticated', { 
        agentId: agent.id, 
        sessionId: session.id,
        riskScore: riskAssessment.score,
        trustScore: trustScore?.currentScore 
      });

      return result;

    } catch (error) {
      result.errors = [new AuthenticationError(
        'Authentication failed',
        'AUTHENTICATION_ERROR',
        500,
        { error: error.message }
      )];
      return result;
    }
  }

  /**
   * Verify credentials using appropriate method
   */
  private async verifyCredentials(credentials: AuthenticationCredentials): Promise<CredentialVerificationResult> {
    switch (credentials.method) {
      case 'jwt':
        return this.verifyJWT(credentials.token!);
      
      case 'api_key':
        return this.verifyAPIKey(credentials.apiKey!);
      
      case 'certificate':
        return this.verifyCertificate(credentials.certificate!);
      
      case 'oauth2':
        return this.verifyOAuth2Token(credentials.token!);
      
      default:
        return { valid: false, error: 'Unsupported authentication method' };
    }
  }

  /**
   * Verify JWT token and extract agent identity
   */
  private async verifyJWT(token: string): Promise<CredentialVerificationResult> {
    try {
      const decoded = jwt.verify(token, this.config.jwt.publicKey, {
        algorithms: [this.config.jwt.algorithm],
        issuer: this.config.jwt.issuer,
        audience: this.config.jwt.audience
      }) as JWTPayload;

      const agentId = decoded.agentId || decoded.sub;
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        return { valid: false, error: 'Agent not found' };
      }

      return { valid: true, agent, payload: decoded };
    } catch (error) {
      return { valid: false, error: `JWT verification failed: ${error.message}` };
    }
  }

  /**
   * Verify API key and get associated agent
   */
  private async verifyAPIKey(apiKey: string): Promise<CredentialVerificationResult> {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    
    // Find credential by hash
    for (const [credId, credential] of this.credentialStore) {
      if (credential.type === 'api_key' && credential.value === keyHash && credential.isActive) {
        // Find associated agent
        for (const [agentId, agent] of this.agents) {
          if (agent.credentials.some(c => c.id === credId)) {
            // Update usage statistics
            credential.lastUsedAt = new Date();
            credential.metadata.usage.totalUses++;
            credential.metadata.usage.lastMonthUses++;
            
            return { valid: true, agent, credential };
          }
        }
      }
    }
    
    return { valid: false, error: 'Invalid API key' };
  }

  /**
   * Verify client certificate
   */
  private async verifyCertificate(certPem: string): Promise<CredentialVerificationResult> {
    try {
      const cert = new X509Certificate(certPem);
      const fingerprint = cert.fingerprint256;
      
      // Find credential by certificate fingerprint
      for (const [credId, credential] of this.credentialStore) {
        if (credential.type === 'certificate' && 
            credential.metadata.fingerprint === fingerprint && 
            credential.isActive) {
          
          // Check certificate validity
          const now = new Date();
          if (now < cert.validFrom || now > cert.validTo) {
            return { valid: false, error: 'Certificate expired or not yet valid' };
          }
          
          // Find associated agent
          for (const [agentId, agent] of this.agents) {
            if (agent.credentials.some(c => c.id === credId)) {
              return { valid: true, agent, credential };
            }
          }
        }
      }
      
      return { valid: false, error: 'Certificate not recognized' };
    } catch (error) {
      return { valid: false, error: `Certificate verification failed: ${error.message}` };
    }
  }

  /**
   * Verify OAuth2 access token
   */
  private async verifyOAuth2Token(token: string): Promise<CredentialVerificationResult> {
    // Implementation would depend on OAuth2 provider
    // This is a placeholder for OAuth2 token introspection
    try {
      // Would call introspection endpoint here
      const introspectionResult = await this.introspectOAuth2Token(token);
      
      if (!introspectionResult.active) {
        return { valid: false, error: 'OAuth2 token is not active' };
      }
      
      const agentId = introspectionResult.sub;
      const agent = this.agents.get(agentId);
      
      if (!agent) {
        return { valid: false, error: 'Agent not found' };
      }
      
      return { valid: true, agent, payload: introspectionResult };
    } catch (error) {
      return { valid: false, error: `OAuth2 verification failed: ${error.message}` };
    }
  }

  /**
   * Assess authentication risk based on context and agent history
   */
  private async assessRisk(agent: AgentIdentity, context: AuthenticationContext): Promise<RiskAssessment> {
    const factors: RiskFactor[] = [];
    let totalScore = 0;

    // IP reputation check
    const ipRisk = await this.checkIPReputation(context.clientIP);
    if (ipRisk.score > 30) {
      factors.push({
        type: 'ip_reputation',
        severity: ipRisk.score > 70 ? 'high' : 'medium',
        score: ipRisk.score,
        description: `IP ${context.clientIP} has reputation score ${ipRisk.score}`,
        mitigated: false
      });
      totalScore += ipRisk.score * 0.3;
    }

    // Unusual location check
    if (context.geolocation && agent.lastSeen) {
      // Implementation would check against agent's normal locations
      const locationRisk = await this.checkLocationAnomaly(agent.id, context.geolocation);
      if (locationRisk > 0) {
        factors.push({
          type: 'unusual_location',
          severity: locationRisk > 50 ? 'high' : 'medium',
          score: locationRisk,
          description: 'Authentication from unusual location',
          mitigated: false
        });
        totalScore += locationRisk * 0.2;
      }
    }

    // Time-based anomaly detection
    const timeRisk = this.checkTimeAnomaly(agent.id, context.timestamp);
    if (timeRisk > 0) {
      factors.push({
        type: 'unusual_time',
        severity: timeRisk > 60 ? 'high' : 'medium',
        score: timeRisk,
        description: 'Authentication at unusual time',
        mitigated: false
      });
      totalScore += timeRisk * 0.1;
    }

    return {
      score: Math.min(100, totalScore),
      factors,
      recommendation: totalScore > 70 ? 'deny' : totalScore > 40 ? 'require_mfa' : 'allow'
    };
  }

  /**
   * Calculate permissions for authenticated agent
   */
  private async calculatePermissions(
    agent: AgentIdentity, 
    trustScore?: TrustScore, 
    riskAssessment?: RiskAssessment
  ): Promise<string[]> {
    const permissions = new Set<string>();

    // Base permissions from capabilities
    for (const capability of agent.capabilities) {
      if (capability.verified && 
          this.verifyMinimumTrust(trustScore, capability.trustRequirement)) {
        permissions.add(...capability.permissions);
      }
    }

    // Trust-based permission adjustments
    if (trustScore) {
      const trustPermissions = this.getTrustBasedPermissions(trustScore.level);
      trustPermissions.forEach(p => permissions.add(p));
    }

    // Risk-based permission restrictions
    if (riskAssessment && riskAssessment.score > 50) {
      const restrictedPermissions = this.getRiskBasedRestrictions(riskAssessment.score);
      restrictedPermissions.forEach(p => permissions.delete(p));
    }

    return Array.from(permissions);
  }

  // Helper methods...
  private generateAgentId(): string {
    return `agent_${randomBytes(16).toString('hex')}`;
  }

  private generateCredentialId(): string {
    return `cred_${randomBytes(16).toString('hex')}`;
  }

  private async encryptCredentialValue(value: string): Promise<string> {
    // In production, use proper encryption
    return createHash('sha256').update(value + this.config.credentialSalt).digest('hex');
  }

  private verifyMinimumTrust(trustScore?: TrustScore, required?: TrustLevel): boolean {
    if (!trustScore || !required) return true;
    
    const levels = {
      'untrusted': 0,
      'low': 1,
      'medium': 2,
      'high': 3,
      'verified': 4
    };
    
    return levels[trustScore.level] >= levels[required];
  }

  private requiresMFA(agent: AgentIdentity, riskAssessment: RiskAssessment): boolean {
    return riskAssessment.score > 40 || 
           agent.metadata.securityProfile.riskLevel === 'high' ||
           agent.metadata.securityProfile.riskLevel === 'critical';
  }

  private async verifyMFA(agentId: string, token: string): Promise<boolean> {
    // Implementation would verify TOTP, SMS, or other MFA methods
    return true; // Placeholder
  }

  private async createAuthSession(
    agent: AgentIdentity,
    context: AuthenticationContext, 
    riskAssessment: RiskAssessment
  ): Promise<AuthSession> {
    const sessionId = randomBytes(32).toString('hex');
    const expiresIn = this.calculateSessionDuration(agent, riskAssessment);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Generate JWT token for session
    const tokenPayload: JWTPayload = {
      sub: agent.id,
      iss: this.config.jwt.issuer,
      aud: this.config.jwt.audience,
      exp: Math.floor(expiresAt.getTime() / 1000),
      nbf: Math.floor(Date.now() / 1000),
      iat: Math.floor(Date.now() / 1000),
      jti: sessionId,
      agentId: agent.id,
      trustLevel: agent.trustLevel,
      capabilities: agent.capabilities.map(c => c.name)
    };

    const token = jwt.sign(tokenPayload, this.config.jwt.privateKey, {
      algorithm: this.config.jwt.algorithm
    });

    const session: AuthSession = {
      id: sessionId,
      agentId: agent.id,
      token,
      createdAt: new Date(),
      expiresAt,
      expiresIn,
      lastActivity: new Date(),
      context,
      riskScore: riskAssessment.score,
      isActive: true
    };

    this.activeSessions.set(sessionId, session);
    return session;
  }

  private calculateSessionDuration(agent: AgentIdentity, riskAssessment: RiskAssessment): number {
    let baseDuration = this.config.sessionTimeout; // Default timeout in seconds

    // Adjust based on trust level
    switch (agent.trustLevel) {
      case TrustLevel.VERIFIED:
        baseDuration *= 2; // Longer sessions for trusted agents
        break;
      case TrustLevel.UNTRUSTED:
        baseDuration *= 0.25; // Very short sessions for untrusted agents
        break;
    }

    // Adjust based on risk score
    if (riskAssessment.score > 70) {
      baseDuration *= 0.1; // Very short for high risk
    } else if (riskAssessment.score > 40) {
      baseDuration *= 0.5; // Reduced for medium risk
    }

    return Math.max(300, baseDuration); // Minimum 5 minutes
  }

  private async calculateRestrictions(
    agent: AgentIdentity, 
    trustScore?: TrustScore, 
    riskAssessment?: RiskAssessment
  ): Promise<string[]> {
    const restrictions = new Set<string>();

    // Add security profile restrictions
    restrictions.add(...agent.metadata.securityProfile.blockedActions);

    // Add trust-based restrictions
    if (trustScore && trustScore.level === TrustLevel.LOW) {
      restrictions.add('no_admin_actions');
      restrictions.add('limited_resource_access');
    }

    // Add risk-based restrictions
    if (riskAssessment && riskAssessment.score > 60) {
      restrictions.add('no_sensitive_data');
      restrictions.add('audit_all_actions');
    }

    return Array.from(restrictions);
  }

  private getTrustBasedPermissions(trustLevel: TrustLevel): string[] {
    const permissionMap = {
      [TrustLevel.UNTRUSTED]: ['read_basic'],
      [TrustLevel.LOW]: ['read_basic', 'execute_basic'],
      [TrustLevel.MEDIUM]: ['read', 'execute', 'communicate'],
      [TrustLevel.HIGH]: ['read', 'execute', 'communicate', 'coordinate'],
      [TrustLevel.VERIFIED]: ['full_access', 'admin', 'policy_management']
    };
    
    return permissionMap[trustLevel] || [];
  }

  private getRiskBasedRestrictions(riskScore: number): string[] {
    const restrictions: string[] = [];
    
    if (riskScore > 30) {
      restrictions.push('write_sensitive');
    }
    
    if (riskScore > 60) {
      restrictions.push('admin_actions', 'peer_communication');
    }
    
    if (riskScore > 80) {
      restrictions.push('execute', 'coordinate');
    }
    
    return restrictions;
  }

  private async checkIPReputation(ip: string): Promise<{ score: number; sources: string[] }> {
    // Implementation would check against IP reputation databases
    return { score: 0, sources: [] }; // Placeholder
  }

  private async checkLocationAnomaly(agentId: string, location: any): Promise<number> {
    // Implementation would check against agent's historical locations
    return 0; // Placeholder
  }

  private checkTimeAnomaly(agentId: string, timestamp: Date): number {
    // Implementation would check against agent's typical activity times
    return 0; // Placeholder
  }

  private async introspectOAuth2Token(token: string): Promise<any> {
    // Implementation would call OAuth2 introspection endpoint
    return { active: true, sub: 'agent_id' }; // Placeholder
  }

  private initializeDefaultPolicies(): void {
    // Initialize default authentication policies
  }

  private startSessionMonitoring(): void {
    // Monitor active sessions for expiry and anomalies
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Check every minute
  }

  private cleanupExpiredSessions(): void {
    const now = new Date();
    for (const [sessionId, session] of this.activeSessions) {
      if (session.expiresAt < now) {
        this.activeSessions.delete(sessionId);
        this.emit('sessionExpired', { sessionId, agentId: session.agentId });
      }
    }
  }
}

// Supporting interfaces
export interface AuthenticationCredentials {
  method: 'jwt' | 'api_key' | 'certificate' | 'oauth2' | 'multi_factor';
  token?: string;
  apiKey?: string;
  certificate?: string;
  mfaToken?: string;
  metadata?: Record<string, any>;
}

export interface CredentialVerificationResult {
  valid: boolean;
  agent?: AgentIdentity;
  credential?: AgentCredential;
  payload?: any;
  error?: string;
}

export interface RiskAssessment {
  score: number; // 0-100
  factors: RiskFactor[];
  recommendation: 'allow' | 'require_mfa' | 'deny';
}

export interface AuthSession {
  id: string;
  agentId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  expiresIn: number;
  lastActivity: Date;
  context: AuthenticationContext;
  riskScore: number;
  isActive: boolean;
}

export interface AuthPolicy {
  id: string;
  name: string;
  description: string;
  rules: AuthPolicyRule[];
  active: boolean;
  priority: number;
}

export interface AuthPolicyRule {
  condition: string;
  action: 'allow' | 'deny' | 'require_mfa' | 'restrict';
  parameters?: Record<string, any>;
}

export interface AuthenticationConfig {
  jwt: {
    privateKey: string;
    publicKey: string;
    algorithm: 'RS256' | 'RS384' | 'RS512';
    issuer: string;
    audience: string | string[];
  };
  credentialSalt: string;
  sessionTimeout: number;
  minimumTrustLevel: TrustLevel;
  mfaRequired: boolean;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}