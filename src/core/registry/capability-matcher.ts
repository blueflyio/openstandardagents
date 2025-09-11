import { components } from '../../types/acdl-api.js';

type ACDLManifest = components['schemas']['ACDLManifest'];
type Capabilities = components['schemas']['Capabilities'];
type Performance = components['schemas']['Performance'];

export interface CapabilityMatch {
  score: number;
  confidence: number;
  reasons: string[];
  warnings: string[];
  missingCapabilities: string[];
  excessCapabilities: string[];
}

export interface PerformanceMatch {
  score: number;
  throughputCompatible: boolean;
  latencyCompatible: boolean;
  resourceCompatible: boolean;
  reasons: string[];
  warnings: string[];
}

export interface SemanticSimilarity {
  score: number;
  relatedTerms: string[];
  contextualRelevance: number;
}

/**
 * Advanced Capability Matching Engine for OSSA Agent Discovery
 * 
 * Implements sophisticated algorithms for matching agent capabilities
 * with task requirements using semantic analysis, performance metrics,
 * and multi-dimensional scoring.
 */
export class CapabilityMatcher {
  private readonly ossaVersion = '0.1.9-alpha.1';
  
  // Domain relationships for semantic matching
  private readonly domainRelationships: Map<string, Set<string>> = new Map([
    ['nlp', new Set(['reasoning', 'documentation', 'validation'])],
    ['vision', new Set(['data', 'validation', 'monitoring'])],
    ['reasoning', new Set(['nlp', 'validation', 'orchestration'])],
    ['data', new Set(['vision', 'monitoring', 'api-design'])],
    ['documentation', new Set(['nlp', 'api-design', 'validation'])],
    ['api-design', new Set(['documentation', 'validation', 'data'])],
    ['validation', new Set(['api-design', 'security', 'compliance'])],
    ['orchestration', new Set(['reasoning', 'monitoring', 'deployment'])],
    ['monitoring', new Set(['data', 'security', 'orchestration'])],
    ['security', new Set(['validation', 'compliance', 'monitoring'])],
    ['compliance', new Set(['security', 'validation', 'documentation'])],
    ['testing', new Set(['validation', 'security', 'api-design'])],
    ['deployment', new Set(['orchestration', 'monitoring', 'security'])]
  ]);

  // Operation complexity scoring
  private readonly operationComplexity: Map<string, number> = new Map([
    ['validate', 0.3],
    ['generate', 0.7],
    ['analyze', 0.6],
    ['transform', 0.8],
    ['optimize', 0.9],
    ['orchestrate', 1.0],
    ['monitor', 0.4],
    ['secure', 0.7]
  ]);

  // Performance weight factors
  private readonly performanceWeights = {
    throughput: 0.4,
    latency: 0.3,
    concurrency: 0.2,
    reliability: 0.1
  };

  constructor() {}

  /**
   * Comprehensive capability matching with semantic analysis
   */
  async matchCapabilities(
    agentCapabilities: Capabilities,
    requiredCapabilities: Capabilities,
    context?: { taskType?: string; urgency?: 'low' | 'medium' | 'high'; budget?: number }
  ): Promise<CapabilityMatch> {
    
    // 1. Direct domain matching
    const domainMatch = this.matchDomains(
      agentCapabilities.domains,
      requiredCapabilities.domains
    );

    // 2. Semantic domain similarity
    const semanticMatch = this.calculateSemanticSimilarity(
      agentCapabilities.domains,
      requiredCapabilities.domains
    );

    // 3. Operation matching
    const operationMatch = this.matchOperations(
      agentCapabilities.operations || [],
      requiredCapabilities.operations || []
    );

    // 4. Specialization compatibility
    const specializationMatch = this.matchSpecializations(
      agentCapabilities.specializations,
      requiredCapabilities.specializations
    );

    // 5. Context-aware scoring adjustments
    const contextAdjustment = this.applyContextualAdjustments(
      { domainMatch, operationMatch, specializationMatch },
      context
    );

    // Calculate weighted final score
    const baseScore = 
      domainMatch.score * 0.35 +
      semanticMatch.score * 0.2 +
      operationMatch.score * 0.25 +
      specializationMatch.score * 0.15 +
      contextAdjustment * 0.05;

    // Calculate confidence based on match quality
    const confidence = this.calculateConfidence([
      domainMatch, operationMatch, specializationMatch
    ]);

    // Aggregate reasons and warnings
    const reasons = [
      ...domainMatch.reasons,
      ...operationMatch.reasons,
      ...specializationMatch.reasons
    ];

    const warnings = [
      ...domainMatch.warnings,
      ...operationMatch.warnings,
      ...specializationMatch.warnings
    ];

    // Identify missing and excess capabilities
    const missingCapabilities = requiredCapabilities.domains.filter(
      domain => !agentCapabilities.domains.includes(domain)
    );

    const excessCapabilities = agentCapabilities.domains.filter(
      domain => !requiredCapabilities.domains.includes(domain)
    );

    return {
      score: Math.min(1.0, Math.max(0.0, baseScore)),
      confidence,
      reasons,
      warnings,
      missingCapabilities,
      excessCapabilities
    };
  }

  /**
   * Advanced performance matching with SLA considerations
   */
  async matchPerformance(
    agentPerformance: Performance,
    requiredPerformance: Performance,
    slaRequirements?: { uptime?: number; errorRate?: number }
  ): Promise<PerformanceMatch> {
    
    const reasons: string[] = [];
    const warnings: string[] = [];

    // 1. Throughput compatibility
    const throughputCompatible = this.assessThroughputCompatibility(
      agentPerformance.throughput,
      requiredPerformance.throughput
    );

    if (throughputCompatible.compatible) {
      reasons.push(`Throughput compatible: ${throughputCompatible.margin}% margin`);
    } else {
      warnings.push(`Throughput shortfall: ${Math.abs(throughputCompatible.margin)}%`);
    }

    // 2. Latency compatibility
    const latencyCompatible = this.assessLatencyCompatibility(
      agentPerformance.latency,
      requiredPerformance.latency
    );

    if (latencyCompatible.compatible) {
      reasons.push(`Latency meets requirements: P99 ${latencyCompatible.p99Margin}ms margin`);
    } else {
      warnings.push(`Latency concerns: P99 exceeds requirement by ${Math.abs(latencyCompatible.p99Margin)}ms`);
    }

    // 3. Resource compatibility
    const resourceCompatible = this.assessResourceCompatibility(
      agentPerformance.limits,
      requiredPerformance.limits
    );

    // 4. Calculate performance score
    const throughputScore = throughputCompatible.compatible ? 1.0 : Math.max(0, 1 - Math.abs(throughputCompatible.margin) / 100);
    const latencyScore = latencyCompatible.compatible ? 1.0 : Math.max(0, 1 - Math.abs(latencyCompatible.p99Margin) / 1000);
    const resourceScore = resourceCompatible.compatible ? 1.0 : 0.7;

    const score = 
      throughputScore * this.performanceWeights.throughput +
      latencyScore * this.performanceWeights.latency +
      resourceScore * this.performanceWeights.concurrency +
      0.9 * this.performanceWeights.reliability; // Assume good reliability

    return {
      score: Math.min(1.0, Math.max(0.0, score)),
      throughputCompatible: throughputCompatible.compatible,
      latencyCompatible: latencyCompatible.compatible,
      resourceCompatible: resourceCompatible.compatible,
      reasons,
      warnings
    };
  }

  /**
   * Multi-dimensional agent ranking for optimal selection
   */
  async rankAgents(
    candidates: Array<{ agentId: string; manifest: ACDLManifest; healthScore: number }>,
    requirements: {
      capabilities: Capabilities;
      performance?: Performance;
      preferences?: {
        preferredTypes?: string[];
        avoidTypes?: string[];
        prioritizeFreshness?: boolean;
        prioritizeHealth?: boolean;
      };
    },
    context?: { taskComplexity?: number; timeConstraints?: boolean }
  ): Promise<Array<{
    agentId: string;
    overallScore: number;
    capabilityScore: number;
    performanceScore: number;
    healthScore: number;
    freshnessScore: number;
    reasons: string[];
    warnings: string[];
    rank: number;
  }>> {
    
    const scoredCandidates = [];

    for (const candidate of candidates) {
      // 1. Capability matching
      const capabilityMatch = await this.matchCapabilities(
        candidate.manifest.capabilities,
        requirements.capabilities,
        {} as any
      );

      // 2. Performance matching (if specified)
      let performanceMatch: PerformanceMatch | null = null;
      if (requirements.performance && candidate.manifest.performance) {
        performanceMatch = await this.matchPerformance(
          candidate.manifest.performance,
          requirements.performance
        );
      }

      // 3. Freshness score based on agent version and update frequency
      const freshnessScore = this.calculateFreshnessScore(candidate.manifest);

      // 4. Type preference adjustments
      const typePreferenceScore = this.calculateTypePreferenceScore(
        candidate.manifest.agentType,
        requirements.preferences
      );

      // 5. Calculate weighted overall score
      const weights = {
        capability: 0.4,
        performance: requirements.performance ? 0.25 : 0,
        health: requirements.preferences?.prioritizeHealth ? 0.25 : 0.15,
        freshness: requirements.preferences?.prioritizeFreshness ? 0.15 : 0.1,
        typePreference: 0.1
      };

      const overallScore = 
        capabilityMatch.score * weights.capability +
        (performanceMatch?.score || 0.8) * weights.performance +
        candidate.healthScore * weights.health +
        freshnessScore * weights.freshness +
        typePreferenceScore * weights.typePreference;

      scoredCandidates.push({
        agentId: candidate.agentId,
        overallScore: Math.min(1.0, overallScore),
        capabilityScore: capabilityMatch.score,
        performanceScore: performanceMatch?.score || 0.8,
        healthScore: candidate.healthScore,
        freshnessScore,
        reasons: [
          ...capabilityMatch.reasons,
          ...(performanceMatch?.reasons || [])
        ],
        warnings: [
          ...capabilityMatch.warnings,
          ...(performanceMatch?.warnings || [])
        ],
        rank: 0 // Will be set after sorting
      });
    }

    // Sort by overall score (descending) and assign ranks
    scoredCandidates.sort((a, b) => b.overallScore - a.overallScore);
    scoredCandidates.forEach((candidate, index) => {
      candidate.rank = index + 1;
    });

    return scoredCandidates;
  }

  /**
   * Ensemble composition for complex multi-agent tasks
   */
  async composeEnsemble(
    rankedAgents: Array<{ agentId: string; manifest: ACDLManifest; overallScore: number }>,
    taskRequirements: {
      complexity: 'simple' | 'moderate' | 'complex' | 'expert';
      domains: string[];
      estimatedDuration: number;
      parallelizable: boolean;
    }
  ): Promise<{
    composition: Array<{
      agentId: string;
      role: 'primary' | 'secondary' | 'validator' | 'monitor';
      responsibilities: string[];
      weight: number;
    }>;
    confidence: number;
    reasoning: string[];
  }> {
    
    const composition: Array<{
      agentId: string;
      role: 'primary' | 'secondary' | 'validator' | 'monitor';
      responsibilities: string[];
      weight: number;
    }> = [];

    const reasoning: string[] = [];

    if (taskRequirements.complexity === 'simple' && rankedAgents.length > 0) {
      // Single agent for simple tasks
      composition.push({
        agentId: rankedAgents[0].agentId,
        role: 'primary',
        responsibilities: taskRequirements.domains,
        weight: 1.0
      });
      reasoning.push('Simple task assigned to single best-matching agent');
      
      return { composition, confidence: rankedAgents[0].overallScore, reasoning };
    }

    // Multi-agent ensemble for complex tasks
    const primaryAgent = rankedAgents[0];
    composition.push({
      agentId: primaryAgent.agentId,
      role: 'primary',
      responsibilities: this.getPrimaryResponsibilities(primaryAgent.manifest, taskRequirements),
      weight: 0.6
    });

    // Add secondary agents for missing capabilities
    const coveredDomains = new Set(primaryAgent.manifest.capabilities.domains);
    const uncoveredDomains = taskRequirements.domains.filter(domain => !coveredDomains.has(domain as any));

    for (const agent of rankedAgents.slice(1, 4)) {
      const agentDomains = agent.manifest.capabilities.domains;
      const relevantDomains = agentDomains.filter(domain => uncoveredDomains.includes(domain));
      
      if (relevantDomains.length > 0) {
        composition.push({
          agentId: agent.agentId,
          role: 'secondary',
          responsibilities: relevantDomains,
          weight: 0.3 / (composition.length - 1)
        });
        
        relevantDomains.forEach(domain => {
          const index = uncoveredDomains.indexOf(domain);
          if (index > -1) uncoveredDomains.splice(index, 1);
        });
      }
    }

    // Add validator if needed for high-stakes tasks
    if (taskRequirements.complexity === 'expert') {
      const validatorCandidate = rankedAgents.find(agent =>
        agent.manifest.agentType === 'critic' || 
        agent.manifest.capabilities.domains.includes('validation')
      );
      
      if (validatorCandidate) {
        composition.push({
          agentId: validatorCandidate.agentId,
          role: 'validator',
          responsibilities: ['validation', 'quality-assurance'],
          weight: 0.1
        });
      }
    }

    const confidence = this.calculateEnsembleConfidence(composition, rankedAgents);
    reasoning.push(`Composed ${composition.length}-agent ensemble for ${taskRequirements.complexity} task`);
    reasoning.push(`Coverage: ${(1 - uncoveredDomains.length / taskRequirements.domains.length) * 100}% of required domains`);

    return { composition, confidence, reasoning };
  }

  // Private helper methods

  private matchDomains(agentDomains: string[], requiredDomains: string[]): {
    score: number;
    reasons: string[];
    warnings: string[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    const matchingDomains = requiredDomains.filter(domain => agentDomains.includes(domain));
    const score = requiredDomains.length > 0 ? matchingDomains.length / requiredDomains.length : 1;
    
    if (score === 1.0) {
      reasons.push('All required domains supported');
    } else if (score >= 0.7) {
      reasons.push(`Strong domain match: ${Math.round(score * 100)}%`);
      const missing = requiredDomains.filter(domain => !agentDomains.includes(domain));
      warnings.push(`Missing domains: ${missing.join(', ')}`);
    } else {
      warnings.push(`Limited domain coverage: ${Math.round(score * 100)}%`);
    }
    
    return { score, reasons, warnings };
  }

  private calculateSemanticSimilarity(agentDomains: string[], requiredDomains: string[]): SemanticSimilarity {
    let totalSimilarity = 0;
    let relationshipCount = 0;
    const relatedTerms: string[] = [];

    for (const requiredDomain of requiredDomains) {
      const relatedDomains = this.domainRelationships.get(requiredDomain) || new Set();
      const agentRelatedDomains = agentDomains.filter(domain => relatedDomains.has(domain));
      
      if (agentRelatedDomains.length > 0) {
        totalSimilarity += 0.5; // Partial credit for related domains
        relatedTerms.push(...agentRelatedDomains);
        relationshipCount++;
      }
    }

    const score = requiredDomains.length > 0 ? totalSimilarity / requiredDomains.length : 0;
    const contextualRelevance = relationshipCount / Math.max(1, requiredDomains.length);

    return {
      score: Math.min(1.0, score),
      relatedTerms: Array.from(new Set(relatedTerms)),
      contextualRelevance
    };
  }

  private matchOperations(agentOps: any[], requiredOps: any[]): {
    score: number;
    reasons: string[];
    warnings: string[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    if (requiredOps.length === 0) {
      return { score: 1.0, reasons: ['No specific operations required'], warnings: [] };
    }

    const agentOpNames = agentOps.map(op => op.name);
    const requiredOpNames = requiredOps.map(op => op.name);
    
    const matchingOps = requiredOpNames.filter(op => agentOpNames.includes(op));
    const score = matchingOps.length / requiredOpNames.length;
    
    if (score === 1.0) {
      reasons.push('All required operations supported');
    } else if (score > 0.5) {
      reasons.push(`Most operations supported: ${matchingOps.join(', ')}`);
      const missing = requiredOpNames.filter(op => !agentOpNames.includes(op));
      warnings.push(`Missing operations: ${missing.join(', ')}`);
    } else {
      warnings.push('Limited operation support');
    }
    
    return { score, reasons, warnings };
  }

  private matchSpecializations(agentSpec: any, requiredSpec: any): {
    score: number;
    reasons: string[];
    warnings: string[];
  } {
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    if (!requiredSpec) {
      return { score: 1.0, reasons: ['No specializations required'], warnings: [] };
    }

    if (!agentSpec) {
      warnings.push('Agent has no specializations defined');
      return { score: 0.7, reasons: [], warnings };
    }

    let matchCount = 0;
    let totalRequired = 0;

    for (const [specType, requiredDetails] of Object.entries(requiredSpec)) {
      totalRequired++;
      if (agentSpec[specType]) {
        matchCount++;
        reasons.push(`${specType} specialization available`);
      } else {
        warnings.push(`Missing ${specType} specialization`);
      }
    }

    const score = totalRequired > 0 ? matchCount / totalRequired : 1.0;
    return { score, reasons, warnings };
  }

  private applyContextualAdjustments(
    matches: { domainMatch: any; operationMatch: any; specializationMatch: any },
    context?: { taskType?: string; urgency?: 'low' | 'medium' | 'high'; budget?: number }
  ): number {
    if (!context) return 0;

    let adjustment = 0;

    // Urgency adjustments
    if (context.urgency === 'high' && matches.domainMatch.score > 0.8) {
      adjustment += 0.1; // Prefer strong matches for urgent tasks
    }

    // Task type adjustments
    if (context.taskType === 'validation' && matches.domainMatch.score < 0.9) {
      adjustment -= 0.05; // Penalize weaker matches for validation tasks
    }

    // Budget constraints
    if (context.budget && context.budget < 1000) {
      adjustment += 0.05; // Slight preference for any viable match under budget constraints
    }

    return Math.max(-0.2, Math.min(0.2, adjustment));
  }

  private calculateConfidence(matches: Array<{ score: number; warnings: string[] }>): number {
    const avgScore = matches.reduce((sum, match) => sum + match.score, 0) / matches.length;
    const warningPenalty = matches.reduce((sum, match) => sum + match.warnings.length, 0) * 0.05;
    
    return Math.max(0, Math.min(1, avgScore - warningPenalty));
  }

  private assessThroughputCompatibility(agentThroughput: any, requiredThroughput: any): {
    compatible: boolean;
    margin: number;
  } {
    if (!requiredThroughput?.requestsPerSecond || !agentThroughput?.requestsPerSecond) {
      return { compatible: true, margin: 0 };
    }

    const margin = ((agentThroughput.requestsPerSecond - requiredThroughput.requestsPerSecond) / requiredThroughput.requestsPerSecond) * 100;
    
    return {
      compatible: agentThroughput.requestsPerSecond >= requiredThroughput.requestsPerSecond,
      margin: Math.round(margin)
    };
  }

  private assessLatencyCompatibility(agentLatency: any, requiredLatency: any): {
    compatible: boolean;
    p99Margin: number;
  } {
    if (!requiredLatency?.p99 || !agentLatency?.p99) {
      return { compatible: true, p99Margin: 0 };
    }

    const p99Margin = requiredLatency.p99 - agentLatency.p99;
    
    return {
      compatible: agentLatency.p99 <= requiredLatency.p99,
      p99Margin: Math.round(p99Margin)
    };
  }

  private assessResourceCompatibility(agentLimits: any, requiredLimits: any): {
    compatible: boolean;
  } {
    // Simplified resource compatibility check
    return { compatible: true };
  }

  private calculateFreshnessScore(manifest: ACDLManifest): number {
    // Simple freshness score based on version recency
    // In production, this would consider last update time, version number, etc.
    const versionParts = manifest.version.split('.');
    const major = parseInt(versionParts[0]) || 0;
    const minor = parseInt(versionParts[1]) || 0;
    const patch = parseInt(versionParts[2]?.split('-')[0]) || 0;
    
    // Simple scoring: newer versions get higher scores
    return Math.min(1.0, (major * 0.3 + minor * 0.1 + patch * 0.01) / 2);
  }

  private calculateTypePreferenceScore(agentType: string, preferences?: any): number {
    if (!preferences) return 1.0;

    if (preferences.preferredTypes?.includes(agentType)) return 1.0;
    if (preferences.avoidTypes?.includes(agentType)) return 0.3;
    
    return 0.8; // Neutral score
  }

  private getPrimaryResponsibilities(manifest: ACDLManifest, taskRequirements: any): string[] {
    const agentDomains = manifest.capabilities.domains;
    const requiredDomains = taskRequirements.domains;
    
    return agentDomains.filter(domain => requiredDomains.includes(domain));
  }

  private calculateEnsembleConfidence(composition: any[], rankedAgents: any[]): number {
    if (composition.length === 0) return 0;
    
    const weightedScore = composition.reduce((sum, member) => {
      const agent = rankedAgents.find(a => a.agentId === member.agentId);
      return sum + (agent ? agent.overallScore * member.weight : 0);
    }, 0);
    
    return Math.min(1.0, weightedScore);
  }
}