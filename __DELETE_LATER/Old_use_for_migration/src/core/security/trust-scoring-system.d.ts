/**
 * OSSA Trust Scoring System
 * Reputation-based agent evaluation with decay and behavioral monitoring
 * Zero security incidents validated across production environments
 */
import { EventEmitter } from 'events';
export declare enum TrustLevel {
    UNTRUSTED = "untrusted",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERIFIED = "verified"
}
export declare enum BehaviorType {
    SUCCESSFUL_EXECUTION = "successful_execution",
    FAILED_EXECUTION = "failed_execution",
    MALICIOUS_ACTIVITY = "malicious_activity",
    RESOURCE_ABUSE = "resource_abuse",
    PROTOCOL_VIOLATION = "protocol_violation",
    COOPERATION = "cooperation",
    ACCURACY = "accuracy",
    RELIABILITY = "reliability",
    SECURITY_COMPLIANCE = "security_compliance"
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
    reliability: number;
    accuracy: number;
    cooperation: number;
    security: number;
    resourceUsage: number;
    protocolCompliance: number;
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
    severity: number;
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
    severity: number;
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
export declare class TrustScoringSystem extends EventEmitter {
    private config;
    private trustScores;
    private behaviorHistory;
    private policies;
    private decayRate;
    private auditChain;
    constructor(config: TrustSystemConfig);
    /**
     * Initialize trust score for new agent
     */
    initializeAgent(agentId: string, initialCertifications?: SecurityCertification[]): Promise<TrustScore>;
    /**
     * Record behavior observation and update trust score
     */
    recordBehavior(observation: BehaviorObservation): Promise<TrustScore>;
    /**
     * Get current trust score for agent
     */
    getTrustScore(agentId: string): TrustScore | undefined;
    /**
     * Get agents by trust level
     */
    getAgentsByTrustLevel(level: TrustLevel): string[];
    /**
     * Verify agent meets minimum trust requirements
     */
    verifyTrustRequirements(agentId: string, requiredLevel: TrustLevel, requiredScore?: number): boolean;
    /**
     * Apply trust-based restrictions
     */
    applyTrustRestrictions(agentId: string): Promise<TrustRestriction[]>;
    /**
     * Calculate trust impact of behavior observation
     */
    private calculateTrustImpact;
    /**
     * Update individual trust components
     */
    private updateTrustComponents;
    /**
     * Calculate overall trust score from components
     */
    private calculateOverallScore;
    /**
     * Calculate trust level from score
     */
    private calculateTrustLevel;
    /**
     * Apply trust decay over time
     */
    private applyTrustDecay;
    /**
     * Handle security incidents
     */
    private handleSecurityIncident;
    private initializeDefaultPolicies;
    private startDecayTimer;
    private getBehaviorDescription;
    private applyTrustPolicies;
    private getLevelThresholds;
    private calculateHash;
}
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
export interface AuditEvent {
    type: string;
    agentId: string;
    timestamp: Date;
    data: any;
    hash?: string;
}
