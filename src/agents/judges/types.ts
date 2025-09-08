/**
 * Judge Agent Types - OSSA v0.1.8 Compliant
 * 
 * Core type definitions for judge agents that make pairwise decisions
 * with evidence trails, optimized for 45% faster resolution times.
 */

import { UADPAgent } from '../../types/uadp-discovery';
import { DecisionCriteria, Alternative } from '../../coordination/distributed-decision';

export enum JudgeType {
  QUALITY_JUDGE = 'quality_judge',
  PERFORMANCE_JUDGE = 'performance_judge', 
  COMPLIANCE_JUDGE = 'compliance_judge',
  COST_JUDGE = 'cost_judge',
  SECURITY_JUDGE = 'security_judge',
  CONSENSUS_JUDGE = 'consensus_judge',
  ARBITRATION_JUDGE = 'arbitration_judge',
  SPECIALIST_JUDGE = 'specialist_judge'
}

export enum JudgmentType {
  PAIRWISE_COMPARISON = 'pairwise_comparison',
  ABSOLUTE_EVALUATION = 'absolute_evaluation',
  RANKING = 'ranking',
  CLASSIFICATION = 'classification',
  THRESHOLD_DECISION = 'threshold_decision'
}

export enum EvidenceType {
  QUANTITATIVE_METRIC = 'quantitative_metric',
  QUALITATIVE_ASSESSMENT = 'qualitative_assessment',
  HISTORICAL_DATA = 'historical_data',
  BENCHMARK_COMPARISON = 'benchmark_comparison',
  EXPERT_OPINION = 'expert_opinion',
  AUTOMATED_ANALYSIS = 'automated_analysis',
  STAKEHOLDER_FEEDBACK = 'stakeholder_feedback',
  COMPLIANCE_CHECK = 'compliance_check'
}

export interface JudgeDecisionRequest {
  id: string;
  title: string;
  description: string;
  judgmentType: JudgmentType;
  alternatives: Alternative[];
  criteria: JudgmentCriteria[];
  context: JudgmentContext;
  constraints: JudgmentConstraint[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: Date;
  requiredConfidenceLevel: number; // 0-1
  evidenceRequirements: EvidenceRequirement[];
  appealable: boolean;
  metadata: Record<string, any>;
}

export interface JudgmentCriteria {
  id: string;
  name: string;
  type: DecisionCriteria;
  weight: number; // 0-1
  description: string;
  measurementMethod: string;
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  evidenceTypes: EvidenceType[];
  required: boolean;
}

export interface JudgmentContext {
  domain: string;
  organizationLevel: 'team' | 'department' | 'organization' | 'enterprise';
  regulatoryEnvironment: string[];
  stakeholders: string[];
  businessContext: Record<string, any>;
  technicalContext: Record<string, any>;
  historicalDecisions: string[];
  relatedJudgments: string[];
}

export interface JudgmentConstraint {
  type: 'hard' | 'soft';
  description: string;
  condition: string;
  weight: number; // For soft constraints
  violationPenalty: number;
}

export interface EvidenceRequirement {
  type: EvidenceType;
  minInstances: number;
  qualityThreshold: number;
  freshness: number; // Max age in hours
  sourceCredibility: number; // Min credibility score
  mandatory: boolean;
}

export interface Evidence {
  id: string;
  type: EvidenceType;
  title: string;
  description: string;
  data: any;
  source: EvidenceSource;
  collectionMethod: string;
  timestamp: Date;
  quality: EvidenceQuality;
  relevance: number; // 0-1
  credibility: number; // 0-1
  freshness: number; // Hours old
  crossReferences: string[];
  metadata: Record<string, any>;
}

export interface EvidenceSource {
  id: string;
  name: string;
  type: 'agent' | 'system' | 'human' | 'external_api' | 'database' | 'document';
  credibilityScore: number; // 0-1
  trackRecord: {
    totalEvidenceProvided: number;
    accurateEvidenceCount: number;
    accuracyRate: number;
  };
  bias: {
    detected: boolean;
    type?: string;
    severity?: number;
  };
}

export interface EvidenceQuality {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  relevance: number; // 0-1
  objectivity: number; // 0-1
  verifiability: number; // 0-1
  overall: number; // 0-1
}

export interface PairwiseComparison {
  id: string;
  alternativeA: string;
  alternativeB: string;
  criteria: string;
  preference: 'A' | 'B' | 'EQUAL';
  strength: number; // 1-9 scale (AHP)
  confidence: number; // 0-1
  evidence: Evidence[];
  reasoning: string;
  timestamp: Date;
  judge: string;
}

export interface JudgeDecision {
  id: string;
  requestId: string;
  judgeId: string;
  judgmentType: JudgmentType;
  decision: Decision;
  pairwiseComparisons: PairwiseComparison[];
  evidenceTrail: EvidenceTrail;
  reasoning: ReasoningChain;
  confidence: number; // 0-1
  quality: DecisionQuality;
  timing: DecisionTiming;
  appeals: Appeal[];
  status: 'draft' | 'final' | 'appealed' | 'overturned' | 'confirmed';
  metadata: Record<string, any>;
}

export interface Decision {
  selectedAlternative?: string;
  ranking?: AlternativeRanking[];
  classification?: Classification;
  thresholdResult?: ThresholdResult;
  customDecision?: any;
}

export interface AlternativeRanking {
  alternativeId: string;
  rank: number;
  score: number;
  percentile: number;
  gaps: Array<{
    criterion: string;
    gapSize: number;
    improvementSuggestion: string;
  }>;
}

export interface Classification {
  category: string;
  subcategory?: string;
  confidence: number;
  alternativeCategories: Array<{
    category: string;
    probability: number;
  }>;
}

export interface ThresholdResult {
  passThreshold: boolean;
  score: number;
  threshold: number;
  margin: number;
  risk: 'low' | 'medium' | 'high';
}

export interface EvidenceTrail {
  id: string;
  evidenceCollected: Evidence[];
  evidenceGaps: EvidenceGap[];
  evidenceConflicts: EvidenceConflict[];
  evidenceSynthesis: EvidenceSynthesis;
  auditTrail: EvidenceAuditEntry[];
  completenessScore: number; // 0-1
  credibilityScore: number; // 0-1
  consistencyScore: number; // 0-1
}

export interface EvidenceGap {
  type: EvidenceType;
  criterion: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  compensatingEvidence: string[];
}

export interface EvidenceConflict {
  id: string;
  conflictingEvidence: string[];
  conflictType: 'contradiction' | 'inconsistency' | 'measurement_error';
  severity: number; // 0-1
  resolution: ConflictResolution;
}

export interface ConflictResolution {
  method: string;
  chosenEvidence?: string;
  synthesizedValue?: any;
  reasoning: string;
  confidence: number;
}

export interface EvidenceSynthesis {
  method: 'weighted_average' | 'median' | 'expert_judgment' | 'bayesian' | 'custom';
  weights: Record<string, number>;
  synthesizedValues: Record<string, any>;
  uncertaintyEstimate: number;
  sensitivityAnalysis: SensitivityAnalysis;
}

export interface SensitivityAnalysis {
  robustness: number; // 0-1
  keyInfluencers: Array<{
    evidenceId: string;
    influence: number;
  }>;
  scenarioTests: Array<{
    scenario: string;
    outcome: any;
    probability: number;
  }>;
}

export interface EvidenceAuditEntry {
  timestamp: Date;
  action: 'collected' | 'validated' | 'rejected' | 'synthesized' | 'conflicted';
  evidenceId: string;
  details: string;
  performedBy: string;
  impact: string;
}

export interface ReasoningChain {
  steps: ReasoningStep[];
  logicalStructure: 'linear' | 'branching' | 'cyclical' | 'hierarchical';
  assumptions: Assumption[];
  inferences: Inference[];
  conclusions: Conclusion[];
  alternativeReasonings: AlternativeReasoning[];
  cognitiveChecks: CognitiveCheck[];
}

export interface ReasoningStep {
  id: string;
  sequence: number;
  type: 'premise' | 'inference' | 'conclusion' | 'assumption' | 'constraint';
  content: string;
  supportingEvidence: string[];
  logicalOperator?: 'AND' | 'OR' | 'NOT' | 'IF_THEN' | 'IFF';
  confidence: number;
  dependencies: string[];
}

export interface Assumption {
  id: string;
  content: string;
  type: 'explicit' | 'implicit' | 'working' | 'fundamental';
  justification: string;
  confidence: number;
  testable: boolean;
  tested?: boolean;
  impact: number; // If assumption is wrong
}

export interface Inference {
  id: string;
  premise: string[];
  conclusion: string;
  rule: string;
  confidence: number;
  validity: number;
  strength: number;
}

export interface Conclusion {
  id: string;
  content: string;
  type: 'main' | 'intermediate' | 'alternative';
  support: number; // 0-1
  confidence: number;
  implications: string[];
}

export interface AlternativeReasoning {
  id: string;
  description: string;
  reasoning: ReasoningChain;
  outcome: any;
  probability: number;
  whyNotChosen: string;
}

export interface CognitiveCheck {
  type: 'confirmation_bias' | 'anchoring' | 'availability_heuristic' | 'framing' | 'groupthink';
  detected: boolean;
  severity?: number;
  mitigation?: string;
  impact?: number;
}

export interface DecisionQuality {
  logicalConsistency: number; // 0-1
  evidenceSupport: number; // 0-1
  comprehensiveness: number; // 0-1
  transparency: number; // 0-1
  reproducibility: number; // 0-1
  fairness: number; // 0-1
  robustness: number; // 0-1
  overall: number; // 0-1
  qualityFactors: QualityFactor[];
}

export interface QualityFactor {
  factor: string;
  score: number;
  weight: number;
  description: string;
  improvementSuggestions: string[];
}

export interface DecisionTiming {
  requestReceived: Date;
  evidenceCollectionStarted: Date;
  evidenceCollectionCompleted: Date;
  analysisStarted: Date;
  analysisCompleted: Date;
  decisionMade: Date;
  decisionCommunicated: Date;
  totalTimeMs: number;
  targetTimeMs: number;
  speedupAchieved: number; // Percentage
  bottlenecks: TimingBottleneck[];
}

export interface TimingBottleneck {
  phase: string;
  timeMs: number;
  percentageOfTotal: number;
  cause: string;
  improvementOpportunity: string;
}

export interface Appeal {
  id: string;
  appellant: string;
  grounds: AppealGrounds;
  evidence: Evidence[];
  requestedOutcome: string;
  appealDate: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  response?: AppealResponse;
}

export interface AppealGrounds {
  type: 'procedural_error' | 'evidence_error' | 'bias' | 'new_evidence' | 'misinterpretation';
  description: string;
  specificIssues: string[];
  requestedRemedies: string[];
}

export interface AppealResponse {
  decision: 'uphold' | 'modify' | 'overturn' | 'remand';
  reasoning: string;
  modifications?: any;
  newDecision?: JudgeDecision;
  responseDate: Date;
  judge: string;
}

export interface JudgePerformanceMetrics {
  judgeId: string;
  period: {
    start: Date;
    end: Date;
  };
  decisions: {
    total: number;
    byType: Record<JudgmentType, number>;
    averageTimeMs: number;
    speedupAchieved: number; // Target: 45%
  };
  quality: {
    averageScore: number;
    consistencyScore: number;
    appealRate: number;
    overturnRate: number;
  };
  evidence: {
    averageEvidenceCount: number;
    evidenceQualityScore: number;
    gapRate: number;
    conflictResolutionRate: number;
  };
  efficiency: {
    tokenOptimization: number;
    resourceUtilization: number;
    throughput: number;
  };
  specialization: {
    domains: string[];
    expertiseLevel: Record<string, number>;
    preferredCriteria: DecisionCriteria[];
  };
}

export interface JudgeConfiguration {
  judgeId: string;
  judgeType: JudgeType;
  specializations: string[];
  criteria: DecisionCriteria[];
  evidencePreferences: EvidenceType[];
  decisionStyle: {
    riskTolerance: number; // 0-1
    evidenceThreshold: number; // Min evidence quality
    speedVsQuality: number; // 0-1 (0=speed, 1=quality)
    transparencyLevel: number; // 0-1
  };
  operatingParameters: {
    maxConcurrentDecisions: number;
    targetDecisionTimeMs: number;
    confidenceThreshold: number;
    appealThreshold: number;
  };
  integrations: {
    coordinationSystem: boolean;
    auditSystem: boolean;
    complianceSystem: boolean;
    performanceMonitoring: boolean;
  };
}

// Specialized Judge Agent interfaces extending UADPAgent
export interface QualityJudgeAgent extends UADPAgent {
  judgeType: JudgeType.QUALITY_JUDGE;
  qualityFrameworks: string[];
  qualityMetrics: string[];
  benchmarkSources: string[];
}

export interface ComplianceJudgeAgent extends UADPAgent {
  judgeType: JudgeType.COMPLIANCE_JUDGE;
  complianceFrameworks: string[];
  regulatoryExpertise: string[];
  auditCapabilities: string[];
}

export interface PerformanceJudgeAgent extends UADPAgent {
  judgeType: JudgeType.PERFORMANCE_JUDGE;
  performanceMetrics: string[];
  benchmarkingCapabilities: string[];
  optimizationFocus: string[];
}

export interface SecurityJudgeAgent extends UADPAgent {
  judgeType: JudgeType.SECURITY_JUDGE;
  securityFrameworks: string[];
  threatModeling: string[];
  riskAssessment: string[];
}