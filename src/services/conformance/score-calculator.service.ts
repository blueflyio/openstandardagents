/**
 * Conformance Score Calculator Service
 * Calculates conformance scores based on feature detection
 */

import { injectable } from 'inversify';
import type {
  ConformanceProfile,
  FeatureDetectionResult,
  ConformanceViolation,
} from './types.js';
import type { OssaAgent } from '../../types/index.js';

@injectable()
export class ConformanceScoreCalculator {
  /**
   * Calculate conformance score
   * @param profile - Conformance profile
   * @param requiredResults - Detection results for required features
   * @param optionalResults - Detection results for optional features
   * @returns Calculated score (0-1)
   */
  calculateScore(
    profile: ConformanceProfile,
    requiredResults: FeatureDetectionResult[],
    optionalResults: FeatureDetectionResult[]
  ): number {
    const requiredPresent = requiredResults.filter((r) => r.present).length;
    const requiredTotal = requiredResults.length;
    const requiredScore =
      requiredTotal > 0 ? requiredPresent / requiredTotal : 1;

    const optionalPresent = optionalResults.filter((r) => r.present).length;
    const optionalTotal = optionalResults.length;
    const optionalScore =
      optionalTotal > 0 ? optionalPresent / optionalTotal : 1;

    // Weighted average
    const score =
      requiredScore * profile.required.weight +
      optionalScore * profile.optional.weight;

    return Math.round(score * 100) / 100; // Round to 2 decimals
  }

  /**
   * Determine if score passes threshold
   * @param score - Calculated score
   * @param profile - Conformance profile with thresholds
   * @returns True if score meets or exceeds pass threshold
   */
  passes(score: number, profile: ConformanceProfile): boolean {
    return score >= profile.scoring.pass_threshold;
  }

  /**
   * Determine warning status
   * @param score - Calculated score
   * @param profile - Conformance profile with thresholds
   * @returns True if score is between pass and warn thresholds
   */
  needsImprovement(score: number, profile: ConformanceProfile): boolean {
    return (
      score >= profile.scoring.pass_threshold &&
      score < profile.scoring.warn_threshold
    );
  }

  /**
   * Validate constraints
   * @param manifest - Agent manifest
   * @param profile - Conformance profile
   * @returns Array of constraint violations
   */
  validateConstraints(
    manifest: OssaAgent,
    profile: ConformanceProfile
  ): ConformanceViolation[] {
    if (!profile.constraints) {
      return [];
    }

    const violations: ConformanceViolation[] = [];

    for (const [feature, constraint] of Object.entries(profile.constraints)) {
      const value = this.getNestedValue(manifest, feature.split('.'));

      if (value === undefined || value === null) {
        // Feature not present - not a constraint violation, handled by required/optional
        continue;
      }

      // Check pattern constraint
      if (constraint.pattern && typeof value === 'string') {
        const regex = new RegExp(constraint.pattern);
        if (!regex.test(value)) {
          violations.push({
            feature,
            constraint: 'pattern',
            expected: constraint.pattern,
            actual: value,
            message: `${feature} does not match pattern: ${constraint.description}`,
          });
        }
      }

      // Check enum constraint
      if (constraint.enum && Array.isArray(constraint.enum)) {
        if (!constraint.enum.includes(value)) {
          violations.push({
            feature,
            constraint: 'enum',
            expected: constraint.enum,
            actual: value,
            message: `${feature} must be one of: ${constraint.enum.join(', ')}. ${constraint.description}`,
          });
        }
      }

      // Check const constraint
      if (constraint.const !== undefined) {
        if (value !== constraint.const) {
          violations.push({
            feature,
            constraint: 'const',
            expected: constraint.const,
            actual: value,
            message: `${feature} must be ${constraint.const}. ${constraint.description}`,
          });
        }
      }

      // Check type constraint
      if (constraint.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== constraint.type) {
          violations.push({
            feature,
            constraint: 'type',
            expected: constraint.type,
            actual: actualType,
            message: `${feature} must be of type ${constraint.type}. ${constraint.description}`,
          });
        }
      }

      // Check minimum constraint
      if (constraint.minimum !== undefined && typeof value === 'number') {
        if (value < constraint.minimum) {
          violations.push({
            feature,
            constraint: 'minimum',
            expected: constraint.minimum,
            actual: value,
            message: `${feature} must be at least ${constraint.minimum}. ${constraint.description}`,
          });
        }
      }

      // Check maximum constraint
      if (constraint.maximum !== undefined && typeof value === 'number') {
        if (value > constraint.maximum) {
          violations.push({
            feature,
            constraint: 'maximum',
            expected: constraint.maximum,
            actual: value,
            message: `${feature} must be at most ${constraint.maximum}. ${constraint.description}`,
          });
        }
      }

      // Check required fields constraint
      if (
        constraint.required &&
        Array.isArray(constraint.required) &&
        typeof value === 'object'
      ) {
        const obj = value as Record<string, unknown>;
        const missing = constraint.required.filter(
          (field) => !(field in obj) || obj[field] === undefined
        );
        if (missing.length > 0) {
          violations.push({
            feature,
            constraint: 'required',
            expected: constraint.required,
            actual: Object.keys(obj),
            message: `${feature} is missing required fields: ${missing.join(', ')}. ${constraint.description}`,
          });
        }
      }
    }

    return violations;
  }

  /**
   * Generate recommendations based on missing features
   * @param profile - Conformance profile
   * @param missingRequired - Missing required features
   * @param missingOptional - Missing optional features
   * @returns Array of recommendation strings
   */
  generateRecommendations(
    profile: ConformanceProfile,
    missingRequired: string[],
    missingOptional: string[]
  ): string[] {
    const recommendations: string[] = [];

    // Recommendations for missing required features
    if (missingRequired.length > 0) {
      recommendations.push(
        `Add required features to meet ${profile.name} profile: ${missingRequired.join(', ')}`
      );
    }

    // Recommendations for missing optional features
    if (missingOptional.length > 0) {
      const topOptional = missingOptional.slice(0, 3); // Top 3 optional features
      recommendations.push(
        `Consider adding optional features to improve score: ${topOptional.join(', ')}`
      );
    }

    // Profile-specific recommendations
    if (profile.id === 'enterprise') {
      if (missingRequired.includes('spec.observability.tracing')) {
        recommendations.push(
          'Enable distributed tracing for production monitoring'
        );
      }
      if (missingRequired.includes('spec.constraints.cost')) {
        recommendations.push('Set cost constraints to prevent budget overruns');
      }
      if (missingRequired.includes('spec.autonomy.approval_required')) {
        recommendations.push(
          'Configure approval requirements for autonomous actions'
        );
      }
    }

    if (profile.id === 'gitlab-kagent') {
      if (missingRequired.includes('extensions.kagent.enabled')) {
        recommendations.push('Enable Kagent extension for GitLab integration');
      }
      if (missingRequired.includes('extensions.kagent.gitlab_integration')) {
        recommendations.push(
          'Configure GitLab integration settings (CI/CD, issues, MRs)'
        );
      }
    }

    return recommendations;
  }

  /**
   * Get nested value from object using path
   */
  private getNestedValue(obj: unknown, path: string[]): unknown {
    let current = obj;

    for (const segment of path) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current !== 'object') {
        return undefined;
      }

      current = (current as Record<string, unknown>)[segment];
    }

    return current;
  }
}
