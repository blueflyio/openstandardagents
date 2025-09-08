/**
 * OSSA Agent Coordination Protocol
 * Critical Missing Piece: Handoff Negotiation, Consensus, Multi-Agent Judgments
 * Handles 1000+ agents with sub-100ms capability matching
 */
import { EventEmitter } from 'events';
export declare enum ConsensusAlgorithm {
    RAFT = "raft",
    PBFT = "pbft",// Byzantine Fault Tolerant
    SIMPLE_MAJORITY = "simple-majority"
}
export declare enum TaskPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum AgentState {
    AVAILABLE = "available",
    BUSY = "busy",
    UNAVAILABLE = "unavailable",
    FAILED = "failed",
    MAINTENANCE = "maintenance"
}
export interface Agent {
    id: string;
    name: string;
    type: string;
    capabilities: Capability[];
    state: AgentState;
    currentLoad: number;
    maxLoad: number;
    sla: ServiceLevelAgreement;
    trustScore: number;
    lastHeartbeat: Date;
    metadata: AgentMetadata;
}
export interface Capability {
    id: string;
    name: string;
    version: string;
    parameters: CapabilityParameter[];
    constraints: Constraint[];
    cost: CostModel;
    sla: ServiceLevelAgreement;
}
export interface CapabilityParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    default?: any;
    validation?: ValidationRule[];
}
export interface Constraint {
    type: 'resource' | 'time' | 'cost' | 'dependency' | 'security';
    condition: string;
    value: any;
    priority: TaskPriority;
}
export interface CostModel {
    baseUnits: number;
    scalingFactor: number;
    currency: 'tokens' | 'compute' | 'time' | 'memory';
    budgetRequired: boolean;
}
export interface ServiceLevelAgreement {
    responseTimeMs: number;
    availabilityPercent: number;
    throughputPerSecond: number;
    errorRatePercent: number;
    recoveryTimeMs: number;
}
export interface AgentMetadata {
    version: string;
    framework: string;
    region: string;
    tags: string[];
    owner: string;
    createdAt: Date;
    lastUpdated: Date;
}
export interface TaskRequest {
    id: string;
    workflowId: string;
    requiredCapabilities: CapabilityRequirement[];
    priority: TaskPriority;
    deadline?: Date;
    budget: Budget;
    context: TaskContext;
    dependencies: string[];
    slaRequirements: ServiceLevelAgreement;
    metadata: TaskMetadata;
}
export interface CapabilityRequirement {
    capabilityId: string;
    version: string;
    parameters: Record<string, any>;
    alternatives: string[];
    weight: number;
}
export interface Budget {
    maxTokens: number;
    maxCost: number;
    currency: string;
    allocation: BudgetAllocation;
    tracking: BudgetTracking;
}
export interface BudgetAllocation {
    planning: number;
    execution: number;
    review: number;
    integration: number;
    contingency: number;
}
export interface BudgetTracking {
    spent: number;
    allocated: number;
    remaining: number;
    projectedOverrun: number;
    alerts: BudgetAlert[];
}
export interface BudgetAlert {
    threshold: number;
    triggered: boolean;
    message: string;
    severity: 'info' | 'warning' | 'error';
}
export interface TaskContext {
    agentId: string;
    stepId: string;
    previousResults: any[];
    environmentVariables: Record<string, string>;
    securityContext: SecurityContext;
}
export interface SecurityContext {
    permissions: string[];
    restrictions: string[];
    auditRequired: boolean;
    encryptionLevel: 'none' | 'standard' | 'high';
}
export interface TaskMetadata {
    createdBy: string;
    createdAt: Date;
    estimatedDuration: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'critical';
    category: string;
}
export interface HandoffNegotiation {
    id: string;
    sourceAgent: string;
    candidateAgents: Agent[];
    taskRequest: TaskRequest;
    proposals: HandoffProposal[];
    selectedAgent?: string;
    status: 'negotiating' | 'completed' | 'failed' | 'timeout';
    startTime: Date;
    endTime?: Date;
    metadata: HandoffMetadata;
}
export interface HandoffProposal {
    agentId: string;
    estimatedCost: number;
    estimatedDuration: number;
    confidence: number;
    slaGuarantee: ServiceLevelAgreement;
    resources: ResourceRequirement[];
    alternatives: AlternativeProposal[];
    metadata: ProposalMetadata;
}
export interface ResourceRequirement {
    type: 'cpu' | 'memory' | 'storage' | 'network' | 'gpu';
    amount: number;
    unit: string;
    duration: number;
    priority: TaskPriority;
}
export interface AlternativeProposal {
    description: string;
    tradeoffs: string[];
    costImpact: number;
    timeImpact: number;
}
export interface ProposalMetadata {
    submittedAt: Date;
    validUntil: Date;
    revision: number;
    dependencies: string[];
}
export interface HandoffMetadata {
    algorithm: ConsensusAlgorithm;
    participantCount: number;
    consensusReached: boolean;
    timeToConsensus?: number;
    qualityScore: number;
}
export interface ConsensusResult {
    decision: any;
    confidence: number;
    participantVotes: Vote[];
    evidence: Evidence[];
    algorithm: ConsensusAlgorithm;
    metadata: ConsensusMetadata;
}
export interface Vote {
    agentId: string;
    choice: any;
    weight: number;
    confidence: number;
    reasoning: string;
    evidence: Evidence[];
    timestamp: Date;
}
export interface Evidence {
    id: string;
    type: 'metric' | 'observation' | 'test' | 'benchmark' | 'expert';
    source: string;
    value: any;
    reliability: number;
    relevance: number;
    timestamp: Date;
}
export interface ConsensusMetadata {
    startTime: Date;
    endTime: Date;
    rounds: number;
    convergenceRate: number;
    dissensus: number;
    qualityMetrics: QualityMetric[];
}
export interface QualityMetric {
    name: string;
    value: number;
    target: number;
    passed: boolean;
}
export declare class AgentCoordinator extends EventEmitter {
    private agents;
    private activeNegotiations;
    private taskQueue;
    private consensusEngines;
    private capabilityIndex;
    private loadBalancer;
    private conflictResolver;
    constructor(config: CoordinatorConfig);
    /**
     * Register an agent with the coordinator
     */
    registerAgent(agent: Agent): Promise<void>;
    /**
     * Initiate handoff negotiation for a task
     */
    initiateHandoff(taskRequest: TaskRequest): Promise<HandoffNegotiation>;
    /**
     * Resolve conflicts between multiple agents working on related tasks
     */
    resolveConflict(conflictingTasks: TaskRequest[], algorithm?: ConsensusAlgorithm): Promise<ConflictResolution>;
    /**
     * Make multi-agent judgment with evidence aggregation
     */
    makeMultiAgentJudgment(judgment: JudgmentRequest, judges: Agent[], algorithm?: ConsensusAlgorithm): Promise<ConsensusResult>;
    /**
     * Find agents that match task requirements
     */
    private findCandidateAgents;
    /**
     * Request proposals from candidate agents
     */
    private requestProposals;
    /**
     * Request proposal from individual agent
     */
    private requestProposalFromAgent;
    /**
     * Run consensus algorithm to select best proposal
     */
    private runConsensus;
    /**
     * Collect judgment vote from a judge agent
     */
    private collectJudgmentVote;
    private calculateEstimatedCost;
    private calculateEstimatedDuration;
    private calculateResourceRequirements;
    private initializeConsensusEngines;
    private startCoordinationLoop;
    private processTaskQueue;
    private cleanupExpiredNegotiations;
    private healthCheckAgents;
}
export interface CoordinatorConfig {
    loadBalancingStrategy: string;
    consensusAlgorithms: ConsensusAlgorithm[];
    maxConcurrentNegotiations: number;
}
export interface JudgmentRequest {
    id: string;
    alternatives: any[];
    criteria: JudgmentCriteria[];
    evidence: Evidence[];
    deadline?: Date;
    metadata: any;
}
export interface JudgmentCriteria {
    name: string;
    weight: number;
    type: 'numeric' | 'boolean' | 'categorical';
    description: string;
}
export interface ConflictResolution {
    resolution: 'sequential' | 'parallel' | 'merge' | 'abort';
    order: string[];
    reasoning: string;
    confidence: number;
}
export interface ValidationRule {
    type: 'range' | 'pattern' | 'custom';
    value: any;
    message: string;
}
