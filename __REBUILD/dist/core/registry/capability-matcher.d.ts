import { components } from '../../types/api.js';
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
export declare class CapabilityMatcher {
    private readonly ossaVersion;
    private readonly domainRelationships;
    private readonly operationComplexity;
    private readonly performanceWeights;
    constructor();
    /**
     * Comprehensive capability matching with semantic analysis
     */
    matchCapabilities(agentCapabilities: Capabilities, requiredCapabilities: Capabilities, context?: {
        taskType?: string;
        urgency?: 'low' | 'medium' | 'high';
        budget?: number;
    }): Promise<CapabilityMatch>;
    /**
     * Advanced performance matching with SLA considerations
     */
    matchPerformance(agentPerformance: Performance, requiredPerformance: Performance, slaRequirements?: {
        uptime?: number;
        errorRate?: number;
    }): Promise<PerformanceMatch>;
    /**
     * Multi-dimensional agent ranking for optimal selection
     */
    rankAgents(candidates: Array<{
        agentId: string;
        manifest: ACDLManifest;
        healthScore: number;
    }>, requirements: {
        capabilities: Capabilities;
        performance?: Performance;
        preferences?: {
            preferredTypes?: string[];
            avoidTypes?: string[];
            prioritizeFreshness?: boolean;
            prioritizeHealth?: boolean;
        };
    }, context?: {
        taskComplexity?: number;
        timeConstraints?: boolean;
    }): Promise<Array<{
        agentId: string;
        overallScore: number;
        capabilityScore: number;
        performanceScore: number;
        healthScore: number;
        freshnessScore: number;
        reasons: string[];
        warnings: string[];
        rank: number;
    }>>;
    /**
     * Ensemble composition for complex multi-agent tasks
     */
    composeEnsemble(rankedAgents: Array<{
        agentId: string;
        manifest: ACDLManifest;
        overallScore: number;
    }>, taskRequirements: {
        complexity: 'simple' | 'moderate' | 'complex' | 'expert';
        domains: string[];
        estimatedDuration: number;
        parallelizable: boolean;
    }): Promise<{
        composition: Array<{
            agentId: string;
            role: 'primary' | 'secondary' | 'validator' | 'monitor';
            responsibilities: string[];
            weight: number;
        }>;
        confidence: number;
        reasoning: string[];
    }>;
    private matchDomains;
    private calculateSemanticSimilarity;
    private matchOperations;
    private matchSpecializations;
    private applyContextualAdjustments;
    private calculateConfidence;
    private assessThroughputCompatibility;
    private assessLatencyCompatibility;
    private assessResourceCompatibility;
    private calculateFreshnessScore;
    private calculateTypePreferenceScore;
    private getPrimaryResponsibilities;
    private calculateEnsembleConfidence;
}
export {};
//# sourceMappingURL=capability-matcher.d.ts.map