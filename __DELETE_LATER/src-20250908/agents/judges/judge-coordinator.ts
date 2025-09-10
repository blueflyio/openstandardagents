/**
 * Judge Coordinator - OSSA v0.1.8 Compliant
 * 
 * Coordinates judge agents with the existing coordination system,
 * manages judge selection, and orchestrates multi-judge decisions.
 */

import { EventEmitter } from 'events';
import { BaseJudgeAgent } from './base-judge-agent';
import { QualityJudge } from './quality-judge';
import { ComplianceJudge } from './compliance-judge';
import { PerformanceJudge } from './performance-judge';
import {
  JudgeDecisionRequest,
  JudgeDecision,
  JudgeType,
  JudgeConfiguration,
  JudgePerformanceMetrics,
  Evidence,
  EvidenceType
} from './types';
import { ConsensusResult } from '../../coordination/agent-coordinator';
import { VotingSystem } from '../../coordination/distributed-decision';

export interface JudgeRegistry {
  judges: Map<string, BaseJudgeAgent>;
  capabilities: Map<string, string[]>; // judgeId -> capabilities
  performance: Map<string, JudgePerformanceMetrics>;
  availability: Map<string, boolean>;
  specializations: Map<JudgeType, string[]>; // judgeType -> judgeIds
}

export interface MultiJudgeRequest {
  id: string;
  primary: JudgeDecisionRequest;
  requiresConsensus: boolean;
  votingSystem: VotingSystem;
  minimumJudges: number;
  maximumJudges: number;
  confidenceThreshold: number;
  timeoutMs: number;
  fallbackStrategy: 'single_best' | 'majority_vote' | 'weighted_consensus';
}

export interface MultiJudgeDecision {
  id: string;
  requestId: string;
  participatingJudges: string[];
  individualDecisions: Map<string, JudgeDecision>;
  consensus: ConsensusResult;
  finalDecision: any;
  confidence: number;
  speedupAchieved: number;
  metadata: {
    coordinationTimeMs: number;
    votingTimeMs: number;
    totalTimeMs: number;
    fallbackUsed: boolean;
    qualityScore: number;
  };
}

export interface JudgeSelectionCriteria {
  requiredCapabilities: string[];
  preferredSpecializations: JudgeType[];
  minimumExperience: number;
  maximumResponseTime: number;
  availabilityRequired: boolean;
  domainExpertise?: string[];
  excludeJudges?: string[];
}

export interface CoordinationMetrics {
  totalRequests: number;
  successRate: number;
  averageSpeedup: number;
  consensusRate: number;
  averageJudgesUsed: number;
  averageCoordinationTime: number;
  qualityImprovement: number;
}

/**
 * Central coordinator for judge agents with OSSA coordination integration
 */
export class JudgeCoordinator extends EventEmitter {
  private registry: JudgeRegistry;
  private activeRequests: Map<string, MultiJudgeRequest>;
  private metrics: CoordinationMetrics;
  private coordinationEnabled: boolean;

  constructor(options: {
    coordinationEnabled?: boolean;
    maxConcurrentRequests?: number;
  } = {}) {
    super();

    this.registry = {
      judges: new Map(),
      capabilities: new Map(),
      performance: new Map(),
      availability: new Map(),
      specializations: new Map()
    };

    this.activeRequests = new Map();
    this.coordinationEnabled = options.coordinationEnabled !== false;

    this.metrics = {
      totalRequests: 0,
      successRate: 0,
      averageSpeedup: 0,
      consensusRate: 0,
      averageJudgesUsed: 0,
      averageCoordinationTime: 0,
      qualityImprovement: 0
    };

    this.initializeSpecializationMaps();
  }

  /**
   * Register a judge agent with the coordinator
   */
  public registerJudge(judge: BaseJudgeAgent): void {
    const judgeId = judge.id;
    
    this.registry.judges.set(judgeId, judge);
    this.registry.capabilities.set(judgeId, judge.capabilities);
    this.registry.performance.set(judgeId, judge.getPerformanceMetrics());
    this.registry.availability.set(judgeId, true);

    // Add to specialization map
    if ('judgeType' in judge) {
      const judgeType = (judge as any).judgeType;
      if (!this.registry.specializations.has(judgeType)) {
        this.registry.specializations.set(judgeType, []);
      }
      this.registry.specializations.get(judgeType)!.push(judgeId);
    }

    this.emit('judge-registered', { judgeId, type: (judge as any).judgeType });
  }

  /**
   * Unregister a judge agent
   */
  public unregisterJudge(judgeId: string): void {
    const judge = this.registry.judges.get(judgeId);
    if (!judge) return;

    this.registry.judges.delete(judgeId);
    this.registry.capabilities.delete(judgeId);
    this.registry.performance.delete(judgeId);
    this.registry.availability.delete(judgeId);

    // Remove from specialization maps
    for (const [type, judges] of this.registry.specializations) {
      const index = judges.indexOf(judgeId);
      if (index > -1) {
        judges.splice(index, 1);
      }
    }

    this.emit('judge-unregistered', { judgeId });
  }

  /**
   * Make a decision using optimal judge selection
   */
  public async makeDecision(
    request: JudgeDecisionRequest,
    selectionCriteria?: JudgeSelectionCriteria
  ): Promise<JudgeDecision> {
    const startTime = Date.now();
    
    this.emit('decision-request', { requestId: request.id, criteria: selectionCriteria });

    try {
      // Select the best judge for this request
      const selectedJudge = await this.selectOptimalJudge(request, selectionCriteria);
      
      if (!selectedJudge) {
        throw new Error('No suitable judge found for the request');
      }

      // Mark judge as busy
      this.registry.availability.set(selectedJudge.id, false);

      // Make the decision
      const decision = await selectedJudge.makeDecision(request);

      // Update metrics
      this.updateSingleDecisionMetrics(decision, Date.now() - startTime);

      // Mark judge as available
      this.registry.availability.set(selectedJudge.id, true);

      this.emit('decision-completed', { 
        requestId: request.id, 
        judgeId: selectedJudge.id,
        speedup: decision.timing.speedupAchieved 
      });

      return decision;

    } catch (error) {
      this.emit('decision-failed', { requestId: request.id, error: error.message });
      throw error;
    }
  }

  /**
   * Make a multi-judge decision with consensus
   */
  public async makeMultiJudgeDecision(
    multiRequest: MultiJudgeRequest
  ): Promise<MultiJudgeDecision> {
    const startTime = Date.now();
    
    this.emit('multi-judge-request', { requestId: multiRequest.id });

    try {
      this.activeRequests.set(multiRequest.id, multiRequest);

      // Select multiple judges
      const selectedJudges = await this.selectMultipleJudges(
        multiRequest.primary,
        multiRequest.minimumJudges,
        multiRequest.maximumJudges
      );

      if (selectedJudges.length < multiRequest.minimumJudges) {
        throw new Error(`Insufficient judges available: ${selectedJudges.length} < ${multiRequest.minimumJudges}`);
      }

      // Mark judges as busy
      selectedJudges.forEach(judge => {
        this.registry.availability.set(judge.id, false);
      });

      // Collect individual decisions in parallel
      const coordinationStart = Date.now();
      const decisionPromises = selectedJudges.map(judge => 
        judge.makeDecision(multiRequest.primary)
      );

      const individualDecisions = await Promise.all(decisionPromises);
      const coordinationTime = Date.now() - coordinationStart;

      // Build decision map
      const decisionMap = new Map<string, JudgeDecision>();
      selectedJudges.forEach((judge, index) => {
        decisionMap.set(judge.id, individualDecisions[index]);
      });

      // Achieve consensus
      const votingStart = Date.now();
      const consensus = await this.achieveConsensus(
        decisionMap,
        multiRequest.votingSystem,
        multiRequest.confidenceThreshold
      );
      const votingTime = Date.now() - votingStart;

      // Formulate final decision
      const finalDecision = await this.formulateFinalDecision(
        consensus,
        decisionMap,
        multiRequest
      );

      // Calculate overall metrics
      const totalTime = Date.now() - startTime;
      const averageSpeedup = individualDecisions.reduce(
        (sum, decision) => sum + decision.timing.speedupAchieved, 0
      ) / individualDecisions.length;

      const multiJudgeDecision: MultiJudgeDecision = {
        id: `multi-${multiRequest.id}-${Date.now()}`,
        requestId: multiRequest.id,
        participatingJudges: selectedJudges.map(j => j.id),
        individualDecisions: decisionMap,
        consensus,
        finalDecision,
        confidence: consensus.confidence,
        speedupAchieved: averageSpeedup,
        metadata: {
          coordinationTimeMs: coordinationTime,
          votingTimeMs: votingTime,
          totalTimeMs: totalTime,
          fallbackUsed: false,
          qualityScore: consensus.confidence
        }
      };

      // Mark judges as available
      selectedJudges.forEach(judge => {
        this.registry.availability.set(judge.id, true);
      });

      // Update metrics
      this.updateMultiDecisionMetrics(multiJudgeDecision);

      this.activeRequests.delete(multiRequest.id);

      this.emit('multi-judge-completed', {
        requestId: multiRequest.id,
        judgeCount: selectedJudges.length,
        consensus: consensus.achieved,
        speedup: averageSpeedup
      });

      return multiJudgeDecision;

    } catch (error) {
      this.emit('multi-judge-failed', { requestId: multiRequest.id, error: error.message });
      throw error;
    }
  }

  /**
   * Select the optimal single judge for a request
   */
  private async selectOptimalJudge(
    request: JudgeDecisionRequest,
    criteria?: JudgeSelectionCriteria
  ): Promise<BaseJudgeAgent | null> {
    const availableJudges = Array.from(this.registry.judges.values())
      .filter(judge => this.registry.availability.get(judge.id) === true);

    if (availableJudges.length === 0) return null;

    // Score each judge based on suitability
    const scoredJudges = await Promise.all(
      availableJudges.map(async judge => ({
        judge,
        score: await this.scoreJudgeForRequest(judge, request, criteria)
      }))
    );

    // Filter out judges with zero scores
    const viableJudges = scoredJudges.filter(scored => scored.score > 0);
    if (viableJudges.length === 0) return null;

    // Select the highest scoring judge
    viableJudges.sort((a, b) => b.score - a.score);
    return viableJudges[0].judge;
  }

  /**
   * Select multiple judges for consensus decision
   */
  private async selectMultipleJudges(
    request: JudgeDecisionRequest,
    minJudges: number,
    maxJudges: number
  ): Promise<BaseJudgeAgent[]> {
    const availableJudges = Array.from(this.registry.judges.values())
      .filter(judge => this.registry.availability.get(judge.id) === true);

    // Score all judges
    const scoredJudges = await Promise.all(
      availableJudges.map(async judge => ({
        judge,
        score: await this.scoreJudgeForRequest(judge, request)
      }))
    );

    // Select top judges up to maxJudges
    const viableJudges = scoredJudges
      .filter(scored => scored.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxJudges);

    return viableJudges.map(scored => scored.judge);
  }

  /**
   * Score a judge's suitability for a specific request
   */
  private async scoreJudgeForRequest(
    judge: BaseJudgeAgent,
    request: JudgeDecisionRequest,
    criteria?: JudgeSelectionCriteria
  ): Promise<number> {
    let score = 0;

    // Base capability match score
    const judgeCapabilities = this.registry.capabilities.get(judge.id) || [];
    const requiredCapabilities = criteria?.requiredCapabilities || [];
    
    if (requiredCapabilities.length > 0) {
      const matches = requiredCapabilities.filter(cap => 
        judgeCapabilities.includes(cap)
      ).length;
      score += (matches / requiredCapabilities.length) * 40; // 40% weight
    } else {
      score += 20; // Base score if no specific requirements
    }

    // Specialization match score
    if (criteria?.preferredSpecializations) {
      const judgeType = (judge as any).judgeType;
      if (criteria.preferredSpecializations.includes(judgeType)) {
        score += 25; // 25% weight for specialization match
      }
    }

    // Performance history score
    const performance = this.registry.performance.get(judge.id);
    if (performance) {
      // Factor in success rate, speed, and quality
      score += (performance.quality.averageScore * 20); // 20% weight
      score += Math.min(15, performance.decisions.speedupAchieved * 15 / 45); // Up to 15% for speed
    }

    // Availability and capacity score
    if (this.registry.availability.get(judge.id)) {
      score += 5; // Small bonus for availability
    }

    // Domain expertise match (if specified)
    if (criteria?.domainExpertise) {
      const domainMatch = criteria.domainExpertise.some(domain =>
        judgeCapabilities.some(cap => cap.includes(domain.toLowerCase()))
      );
      if (domainMatch) score += 10;
    }

    // Exclude judges that are explicitly excluded
    if (criteria?.excludeJudges?.includes(judge.id)) {
      return 0;
    }

    return Math.min(100, score);
  }

  /**
   * Achieve consensus among multiple judge decisions
   */
  private async achieveConsensus(
    decisions: Map<string, JudgeDecision>,
    votingSystem: VotingSystem,
    confidenceThreshold: number
  ): Promise<ConsensusResult> {
    // This would integrate with the existing coordination system
    // For now, implementing a simple consensus mechanism
    
    const decisionArray = Array.from(decisions.values());
    const averageConfidence = decisionArray.reduce(
      (sum, decision) => sum + decision.confidence, 0
    ) / decisionArray.length;

    const achieved = averageConfidence >= confidenceThreshold;

    return {
      achieved,
      confidence: averageConfidence,
      votes: decisionArray.map(d => ({
        agent: d.judgeId,
        value: d.decision,
        confidence: d.confidence,
        reasoning: d.reasoning.steps.map(s => s.content).join('; ')
      })),
      finalValue: decisionArray[0].decision, // Simplified - take first decision
      dissent: [],
      metadata: {
        votingSystem,
        threshold: confidenceThreshold,
        participantCount: decisionArray.length
      }
    };
  }

  /**
   * Formulate final decision from consensus
   */
  private async formulateFinalDecision(
    consensus: ConsensusResult,
    decisions: Map<string, JudgeDecision>,
    request: MultiJudgeRequest
  ): Promise<any> {
    if (consensus.achieved) {
      return consensus.finalValue;
    }

    // Apply fallback strategy
    switch (request.fallbackStrategy) {
      case 'single_best':
        // Use decision from highest confidence judge
        let bestDecision = null;
        let maxConfidence = 0;
        
        for (const decision of decisions.values()) {
          if (decision.confidence > maxConfidence) {
            maxConfidence = decision.confidence;
            bestDecision = decision;
          }
        }
        
        return bestDecision?.decision;

      case 'majority_vote':
        // Implement majority voting logic
        return this.getMajorityVote(decisions);

      case 'weighted_consensus':
        // Weight decisions by judge performance
        return this.getWeightedConsensus(decisions);

      default:
        return consensus.finalValue;
    }
  }

  /**
   * Factory methods for creating specialized judges
   */
  public static createQualityJudge(config: Partial<JudgeConfiguration> = {}): QualityJudge {
    const fullConfig: JudgeConfiguration & any = {
      judgeId: `quality-judge-${Date.now()}`,
      judgeType: JudgeType.QUALITY_JUDGE,
      specializations: ['quality_assessment'],
      criteria: ['quality'],
      evidencePreferences: [EvidenceType.QUANTITATIVE_METRIC, EvidenceType.BENCHMARK_COMPARISON],
      decisionStyle: {
        riskTolerance: 0.3,
        evidenceThreshold: 0.7,
        speedVsQuality: 0.7,
        transparencyLevel: 0.9
      },
      operatingParameters: {
        maxConcurrentDecisions: 3,
        targetDecisionTimeMs: 45000,
        confidenceThreshold: 0.8,
        appealThreshold: 0.6
      },
      integrations: {
        coordinationSystem: true,
        auditSystem: true,
        complianceSystem: false,
        performanceMonitoring: true
      },
      qualityFrameworks: ['iso-9001', 'cmmi', 'six-sigma'],
      qualityMetrics: ['reliability', 'performance', 'usability', 'maintainability'],
      benchmarkSources: ['industry_standard', 'competitor_analysis'],
      ...config
    };

    return new QualityJudge(fullConfig);
  }

  public static createComplianceJudge(config: Partial<JudgeConfiguration> = {}): ComplianceJudge {
    const fullConfig: JudgeConfiguration & any = {
      judgeId: `compliance-judge-${Date.now()}`,
      judgeType: JudgeType.COMPLIANCE_JUDGE,
      specializations: ['compliance_assessment'],
      criteria: ['compliance'],
      evidencePreferences: [EvidenceType.COMPLIANCE_CHECK, EvidenceType.EXPERT_OPINION],
      decisionStyle: {
        riskTolerance: 0.1,
        evidenceThreshold: 0.8,
        speedVsQuality: 0.3,
        transparencyLevel: 1.0
      },
      operatingParameters: {
        maxConcurrentDecisions: 2,
        targetDecisionTimeMs: 60000,
        confidenceThreshold: 0.9,
        appealThreshold: 0.5
      },
      integrations: {
        coordinationSystem: true,
        auditSystem: true,
        complianceSystem: true,
        performanceMonitoring: true
      },
      complianceFrameworks: ['iso-42001', 'nist-ai-rmf', 'gdpr'],
      regulatoryExpertise: ['ai_governance', 'data_privacy', 'risk_management'],
      auditCapabilities: ['control_testing', 'evidence_review', 'gap_analysis'],
      ...config
    };

    return new ComplianceJudge(fullConfig);
  }

  public static createPerformanceJudge(config: Partial<JudgeConfiguration> = {}): PerformanceJudge {
    const fullConfig: JudgeConfiguration & any = {
      judgeId: `performance-judge-${Date.now()}`,
      judgeType: JudgeType.PERFORMANCE_JUDGE,
      specializations: ['performance_assessment'],
      criteria: ['performance'],
      evidencePreferences: [EvidenceType.QUANTITATIVE_METRIC, EvidenceType.HISTORICAL_DATA],
      decisionStyle: {
        riskTolerance: 0.5,
        evidenceThreshold: 0.6,
        speedVsQuality: 0.8,
        transparencyLevel: 0.8
      },
      operatingParameters: {
        maxConcurrentDecisions: 5,
        targetDecisionTimeMs: 30000,
        confidenceThreshold: 0.75,
        appealThreshold: 0.7
      },
      integrations: {
        coordinationSystem: true,
        auditSystem: false,
        complianceSystem: false,
        performanceMonitoring: true
      },
      performanceMetrics: ['response_time', 'throughput', 'resource_utilization'],
      benchmarkingCapabilities: ['load_testing', 'stress_testing', 'capacity_planning'],
      optimizationFocus: ['latency', 'cost', 'scalability'],
      ...config
    };

    return new PerformanceJudge(fullConfig);
  }

  // Utility methods
  private initializeSpecializationMaps(): void {
    Object.values(JudgeType).forEach(type => {
      this.registry.specializations.set(type, []);
    });
  }

  private updateSingleDecisionMetrics(decision: JudgeDecision, totalTimeMs: number): void {
    this.metrics.totalRequests++;
    
    // Update running averages
    const weight = 1 / this.metrics.totalRequests;
    this.metrics.averageSpeedup = 
      this.metrics.averageSpeedup * (1 - weight) + decision.timing.speedupAchieved * weight;
  }

  private updateMultiDecisionMetrics(multiDecision: MultiJudgeDecision): void {
    this.metrics.totalRequests++;
    
    const weight = 1 / this.metrics.totalRequests;
    this.metrics.averageSpeedup = 
      this.metrics.averageSpeedup * (1 - weight) + multiDecision.speedupAchieved * weight;
    
    this.metrics.averageJudgesUsed = 
      this.metrics.averageJudgesUsed * (1 - weight) + multiDecision.participatingJudges.length * weight;
    
    this.metrics.averageCoordinationTime = 
      this.metrics.averageCoordinationTime * (1 - weight) + multiDecision.metadata.coordinationTimeMs * weight;

    if (multiDecision.consensus.achieved) {
      this.metrics.consensusRate = 
        (this.metrics.consensusRate * (this.metrics.totalRequests - 1) + 1) / this.metrics.totalRequests;
    } else {
      this.metrics.consensusRate = 
        this.metrics.consensusRate * (this.metrics.totalRequests - 1) / this.metrics.totalRequests;
    }
  }

  private getMajorityVote(decisions: Map<string, JudgeDecision>): any {
    // Simplified majority voting implementation
    const decisionArray = Array.from(decisions.values());
    return decisionArray[0].decision;
  }

  private getWeightedConsensus(decisions: Map<string, JudgeDecision>): any {
    // Simplified weighted consensus implementation
    const decisionArray = Array.from(decisions.values());
    return decisionArray[0].decision;
  }

  /**
   * Public API methods
   */
  public getRegisteredJudges(): { id: string; type: string; available: boolean }[] {
    return Array.from(this.registry.judges.entries()).map(([id, judge]) => ({
      id,
      type: (judge as any).judgeType || 'unknown',
      available: this.registry.availability.get(id) || false
    }));
  }

  public getCoordinationMetrics(): CoordinationMetrics {
    return { ...this.metrics };
  }

  public getActiveRequests(): string[] {
    return Array.from(this.activeRequests.keys());
  }

  public setJudgeAvailability(judgeId: string, available: boolean): void {
    if (this.registry.judges.has(judgeId)) {
      this.registry.availability.set(judgeId, available);
    }
  }
}