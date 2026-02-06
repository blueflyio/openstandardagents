/**
 * OSSA v0.4.4 Progressive Validation Scorer
 *
 * Transforms validation from gatekeeping to guidance with:
 * - Multi-dimensional scoring (0.0-1.0)
 * - Grade system (A+ through F)
 * - Ranked improvement suggestions
 *
 * **Philosophy**: Validation should guide, not block
 */

import type { OssaAgent } from '../types/index.js';
import type { ValidationResult } from './validator.js';
import type { Fix } from './validator-registry.js';

/**
 * Validation score with multi-dimensional breakdown
 */
export interface ValidationScore {
  overall: number; // 0.0 - 1.0
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: {
    compatibility: DimensionScore;
    performance: DimensionScore;
    security: DimensionScore;
    observability: DimensionScore;
    maintainability: DimensionScore;
  };
  improvements: RankedImprovement[];
  summary: string;
}

/**
 * Individual dimension score
 */
export interface DimensionScore {
  score: number; // 0.0 - 1.0
  weight: number; // Contribution to overall score
  factors: Record<string, number>; // Individual factor scores
  issues: string[]; // What's wrong
}

/**
 * Ranked improvement suggestion
 */
export interface RankedImprovement {
  id: string;
  description: string;
  impact: number; // Score increase (e.g., 0.15 = +15%)
  effort: 'low' | 'medium' | 'high';
  category: string;
  priority: number; // 1-10 (10 = highest)
  action?: Fix;
}

/**
 * Progressive Scorer
 *
 * Scores manifests across 5 dimensions and ranks improvements by ROI
 */
export class ProgressiveScorer {
  // Dimension weights (must sum to 1.0)
  private weights = {
    compatibility: 0.3, // 30% - Does it work with target platform?
    performance: 0.2, // 20% - Will it scale/perform well?
    security: 0.25, // 25% - Is it secure?
    observability: 0.15, // 15% - Can we monitor it?
    maintainability: 0.1, // 10% - Is it maintainable?
  };

  /**
   * Score a manifest
   */
  score(
    manifest: OssaAgent,
    validationResult: ValidationResult
  ): ValidationScore {
    const dimensions = {
      compatibility: this.scoreCompatibility(manifest),
      performance: this.scorePerformance(manifest),
      security: this.scoreSecurity(manifest),
      observability: this.scoreObservability(manifest),
      maintainability: this.scoreMaintainability(manifest),
    };

    // Calculate overall score (weighted average)
    const overall = Object.entries(dimensions).reduce((sum, [key, dim]) => {
      return (
        sum + dim.score * this.weights[key as keyof typeof this.weights]
      );
    }, 0);

    const grade = this.calculateGrade(overall);
    const improvements = this.rankImprovements(manifest, dimensions);
    const summary = this.generateSummary(overall, grade, dimensions);

    return {
      overall,
      grade,
      dimensions,
      improvements: improvements.slice(0, 10), // Top 10
      summary,
    };
  }

  /**
   * Score compatibility (agentType × capabilities)
   */
  private scoreCompatibility(manifest: OssaAgent): DimensionScore {
    const factors: Record<string, number> = {};
    const issues: string[] = [];

    // Platform support
    factors.platformSupport = this.checkPlatformSupport(manifest, issues);

    // Capability alignment
    factors.capabilityAlignment = this.checkCapabilityAlignment(
      manifest,
      issues
    );

    // Transport compatibility
    factors.transportCompatibility = this.checkTransportCompatibility(
      manifest,
      issues
    );

    const score = Object.values(factors).reduce((sum, s) => sum + s, 0) / 3;

    return {
      score,
      weight: this.weights.compatibility,
      factors,
      issues,
    };
  }

  /**
   * Check platform support
   */
  private checkPlatformSupport(
    manifest: OssaAgent,
    issues: string[]
  ): number {
    const agentType = manifest.metadata?.agentType;
    const capabilities = manifest.metadata?.agentArchitecture?.capabilities || [];

    // KAGENT incompatibilities
    if (agentType === 'kagent') {
      if (capabilities.includes('vision')) {
        issues.push('KAGENT does not support vision capability');
        return 0.0;
      }
      if (capabilities.includes('audio')) {
        issues.push('KAGENT does not support audio capability');
        return 0.0;
      }
      return 1.0; // Compatible
    }

    // Claude supports everything
    if (agentType === 'claude') {
      return 1.0;
    }

    // OpenAI partial support
    if (agentType === 'openai') {
      const unsupported = capabilities.filter(
        (c) => !['handoff', 'streaming', 'context', 'tools', 'vision', 'code'].includes(c)
      );
      if (unsupported.length > 0) {
        issues.push(`OpenAI may not support: ${unsupported.join(', ')}`);
        return 1.0 - unsupported.length / capabilities.length;
      }
      return 1.0;
    }

    // LangChain support
    if (agentType === 'langchain') {
      const unsupported = capabilities.filter(
        (c) =>
          !['handoff', 'streaming', 'context', 'tools', 'memory', 'retrieval'].includes(c)
      );
      if (unsupported.length > 0) {
        issues.push(`LangChain may not support: ${unsupported.join(', ')}`);
        return 1.0 - unsupported.length / capabilities.length;
      }
      return 1.0;
    }

    // Unknown agent type
    if (!agentType) {
      issues.push('No agentType specified');
      return 0.5;
    }

    return 0.8; // Default for unknown types
  }

  /**
   * Check capability alignment
   */
  private checkCapabilityAlignment(
    manifest: OssaAgent,
    issues: string[]
  ): number {
    const agentType = manifest.metadata?.agentType;
    const capabilities = manifest.metadata?.agentArchitecture?.capabilities || [];

    // Swarm requires handoff
    if (agentType === 'swarm' && !capabilities.includes('handoff')) {
      issues.push('Swarm agents require handoff capability');
      return 0.0;
    }

    return 1.0;
  }

  /**
   * Check transport compatibility
   */
  private checkTransportCompatibility(
    manifest: OssaAgent,
    issues: string[]
  ): number {
    const transport = (manifest.spec as any)?.transport;

    if (!transport) {
      return 1.0; // No transport = no issue
    }

    // Check TLS for production
    const environment = manifest.metadata?.labels?.environment;
    if (environment === 'production' && transport.tls === false) {
      issues.push('Production agents should enable TLS');
      return 0.5;
    }

    return 1.0;
  }

  /**
   * Score performance characteristics
   */
  private scorePerformance(manifest: OssaAgent): DimensionScore {
    const factors: Record<string, number> = {};
    const issues: string[] = [];

    // Scalability configuration
    const scalability = manifest.metadata?.agentArchitecture?.runtime?.scalability;
    factors.scalability = scalability ? 1.0 : 0.7;
    if (!scalability) {
      issues.push('No scalability configuration');
    }

    // Execution model
    const executionModel =
      manifest.metadata?.agentArchitecture?.runtime?.executionModel;
    factors.executionModel = executionModel ? 1.0 : 0.8;

    const score = Object.values(factors).reduce((sum, s) => sum + s, 0) / 2;

    return {
      score,
      weight: this.weights.performance,
      factors,
      issues,
    };
  }

  /**
   * Score security posture
   */
  private scoreSecurity(manifest: OssaAgent): DimensionScore {
    const factors: Record<string, number> = {};
    const issues: string[] = [];

    // Authentication
    const transport = (manifest.spec as any)?.transport;
    const hasAuth = transport?.authentication !== undefined;
    factors.authentication = hasAuth ? 1.0 : 0.3;
    if (!hasAuth && manifest.metadata?.labels?.environment === 'production') {
      issues.push('Production agents should configure authentication');
    }

    // TLS/SSL
    const hasTLS = transport?.tls !== false;
    factors.tls = hasTLS ? 1.0 : 0.0;
    if (!hasTLS && manifest.metadata?.labels?.environment === 'production') {
      issues.push('Production agents must enable TLS');
    }

    const score = Object.values(factors).reduce((sum, s) => sum + s, 0) / 2;

    return {
      score,
      weight: this.weights.security,
      factors,
      issues,
    };
  }

  /**
   * Score observability setup
   */
  private scoreObservability(manifest: OssaAgent): DimensionScore {
    const factors: Record<string, number> = {};
    const issues: string[] = [];

    // Monitoring
    const monitoring = (manifest.spec as any)?.monitoring;
    factors.monitoring = monitoring ? 1.0 : 0.5;
    if (!monitoring) {
      issues.push('No monitoring configuration');
    }

    // Logging
    const logging = (manifest.spec as any)?.logging;
    factors.logging = logging ? 1.0 : 0.6;

    const score = Object.values(factors).reduce((sum, s) => sum + s, 0) / 2;

    return {
      score,
      weight: this.weights.observability,
      factors,
      issues,
    };
  }

  /**
   * Score maintainability
   */
  private scoreMaintainability(manifest: OssaAgent): DimensionScore {
    const factors: Record<string, number> = {};
    const issues: string[] = [];

    // Description
    const hasDescription = !!manifest.metadata?.description;
    factors.documentation = hasDescription ? 1.0 : 0.5;
    if (!hasDescription) {
      issues.push('Add description for maintainability');
    }

    // Version
    const hasVersion = !!manifest.metadata?.version;
    factors.versioning = hasVersion ? 1.0 : 0.3;
    if (!hasVersion) {
      issues.push('Specify version for tracking');
    }

    const score = Object.values(factors).reduce((sum, s) => sum + s, 0) / 2;

    return {
      score,
      weight: this.weights.maintainability,
      factors,
      issues,
    };
  }

  /**
   * Calculate letter grade
   */
  private calculateGrade(score: number): ValidationScore['grade'] {
    if (score >= 0.97) return 'A+';
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }

  /**
   * Rank improvements by ROI (impact / effort)
   */
  private rankImprovements(
    manifest: OssaAgent,
    dimensions: ValidationScore['dimensions']
  ): RankedImprovement[] {
    const improvements: RankedImprovement[] = [];

    // Generate improvements from each dimension
    for (const [dimName, dim] of Object.entries(dimensions)) {
      if (dim.score < 0.9) {
        for (const issue of dim.issues) {
          improvements.push(
            this.createImprovement(dimName, issue, dim.score)
          );
        }
      }
    }

    // Sort by priority (impact / effort weight)
    return improvements.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create improvement suggestion
   */
  private createImprovement(
    dimension: string,
    issue: string,
    currentScore: number
  ): RankedImprovement {
    const impact = 1.0 - currentScore; // Potential score increase
    const effort = this.estimateEffort(issue);
    const priority = this.calculatePriority(impact, effort);

    return {
      id: `${dimension}-${Date.now()}`,
      description: issue,
      impact: Math.min(impact, 0.3), // Cap at +0.3
      effort,
      category: dimension,
      priority,
    };
  }

  /**
   * Estimate implementation effort
   */
  private estimateEffort(issue: string): 'low' | 'medium' | 'high' {
    const lowEffortKeywords = ['add', 'enable', 'specify', 'declare'];
    const highEffortKeywords = ['implement', 'refactor', 'redesign'];

    const issueLower = issue.toLowerCase();

    if (lowEffortKeywords.some((k) => issueLower.includes(k))) {
      return 'low';
    }
    if (highEffortKeywords.some((k) => issueLower.includes(k))) {
      return 'high';
    }
    return 'medium';
  }

  /**
   * Calculate priority (1-10)
   */
  private calculatePriority(
    impact: number,
    effort: 'low' | 'medium' | 'high'
  ): number {
    const effortWeight = { low: 1.0, medium: 0.6, high: 0.3 };
    const roi = impact * effortWeight[effort];
    return Math.round(roi * 10);
  }

  /**
   * Generate score summary
   */
  private generateSummary(
    overall: number,
    grade: ValidationScore['grade'],
    dimensions: ValidationScore['dimensions']
  ): string {
    const percentage = Math.round(overall * 100);
    const weakest = Object.entries(dimensions)
      .sort((a, b) => a[1].score - b[1].score)[0];

    return `Grade ${grade} (${percentage}%). Weakest: ${weakest[0]} (${Math.round(weakest[1].score * 100)}%)`;
  }
}

/**
 * Singleton instance
 */
let scorerInstance: ProgressiveScorer | null = null;

/**
 * Get the global scorer instance
 */
export function getProgressiveScorer(): ProgressiveScorer {
  if (!scorerInstance) {
    scorerInstance = new ProgressiveScorer();
  }
  return scorerInstance;
}
