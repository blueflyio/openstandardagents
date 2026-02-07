/**
 * Conformance Service
 * Main service for OSSA conformance testing
 */

import { inject, injectable } from 'inversify';
import type { OssaAgent } from '../../types/index.js';
import { ValidationService } from '../validation.service.js';
import { ConformanceProfileLoader } from './profile-loader.service.js';
import { FeatureDetector } from './feature-detector.service.js';
import { ConformanceScoreCalculator } from './score-calculator.service.js';
import type {
  ConformanceProfile,
  ConformanceResult,
  ConformanceReport,
  FeatureDetectionResult,
} from './types.js';

@injectable()
export class ConformanceService {
  constructor(
    @inject(ConformanceProfileLoader)
    private profileLoader: ConformanceProfileLoader,
    @inject(FeatureDetector)
    private featureDetector: FeatureDetector,
    @inject(ConformanceScoreCalculator)
    private scoreCalculator: ConformanceScoreCalculator,
    @inject(ValidationService)
    private validationService: ValidationService
  ) {}

  /**
   * Run conformance test against a profile
   * @param manifest - Agent manifest to test
   * @param profileId - Profile ID to test against
   * @param strict - Whether to fail on validation errors
   * @returns Conformance result
   */
  async runConformanceTest(
    manifest: OssaAgent,
    profileId: string,
    strict = false
  ): Promise<ConformanceResult> {
    // 1. Load profile
    const profile = this.profileLoader.getProfile(profileId);

    // 2. Validate manifest first (optional, based on strict mode)
    if (strict) {
      const validationResult = await this.validationService.validate(manifest);
      if (!validationResult.valid) {
        throw new Error(
          `Manifest validation failed: ${validationResult.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }
    }

    // 3. Detect required features
    const requiredResults = this.featureDetector.detectFeatures(
      manifest,
      profile.required.features
    );

    // 4. Detect optional features
    const optionalResults = this.featureDetector.detectFeatures(
      manifest,
      profile.optional.features
    );

    // 5. Calculate score
    const score = this.scoreCalculator.calculateScore(
      profile,
      requiredResults,
      optionalResults
    );

    // 6. Validate constraints
    const constraintViolations = this.scoreCalculator.validateConstraints(
      manifest,
      profile
    );

    // 7. Determine pass/fail
    const passed =
      this.scoreCalculator.passes(score, profile) &&
      constraintViolations.length === 0;

    // 8. Get missing features
    const missingRequired = this.featureDetector.getMissing(requiredResults);
    const missingOptional = this.featureDetector.getMissing(optionalResults);

    // 9. Generate recommendations
    const recommendations = this.scoreCalculator.generateRecommendations(
      profile,
      missingRequired,
      missingOptional
    );

    // 10. Build result
    const result: ConformanceResult = {
      profile: profile.id,
      profileName: profile.name,
      version: profile.version,
      passed,
      score,
      details: {
        required: {
          total: requiredResults.length,
          present: this.featureDetector.countPresent(requiredResults),
          missing: missingRequired,
          score:
            requiredResults.length > 0
              ? this.featureDetector.countPresent(requiredResults) /
                requiredResults.length
              : 1,
        },
        optional: {
          total: optionalResults.length,
          present: this.featureDetector.countPresent(optionalResults),
          missing: missingOptional,
          score:
            optionalResults.length > 0
              ? this.featureDetector.countPresent(optionalResults) /
                optionalResults.length
              : 1,
        },
      },
      features: [...requiredResults, ...optionalResults],
      constraintViolations,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return result;
  }

  /**
   * Generate conformance report
   * @param manifest - Agent manifest to test
   * @param profileId - Profile ID to test against
   * @param strict - Whether to fail on validation errors
   * @returns Conformance report
   */
  async generateReport(
    manifest: OssaAgent,
    profileId: string,
    strict = false
  ): Promise<ConformanceReport> {
    const result = await this.runConformanceTest(manifest, profileId, strict);
    const profile = this.profileLoader.getProfile(profileId);

    return {
      summary: {
        profile: profile.name,
        passed: result.passed,
        score: result.score,
        threshold: profile.scoring.pass_threshold,
        timestamp: result.timestamp,
      },
      manifest: {
        apiVersion: manifest.apiVersion,
        kind: manifest.kind,
        name: manifest.metadata?.name || 'unknown',
      },
      results: result,
    };
  }

  /**
   * List available conformance profiles
   * @returns Array of profile summaries
   */
  listProfiles(): Array<{ id: string; name: string; description: string }> {
    return this.profileLoader.listProfiles();
  }

  /**
   * Get profile details
   * @param profileId - Profile ID
   * @returns Profile definition
   */
  getProfile(profileId: string): ConformanceProfile {
    return this.profileLoader.getProfile(profileId);
  }

  /**
   * Check if profile exists
   * @param profileId - Profile ID
   * @returns True if profile exists
   */
  hasProfile(profileId: string): boolean {
    return this.profileLoader.hasProfile(profileId);
  }

  /**
   * Batch test multiple manifests
   * @param manifests - Array of agent manifests
   * @param profileId - Profile ID to test against
   * @param strict - Whether to fail on validation errors
   * @returns Array of conformance results
   */
  async batchTest(
    manifests: OssaAgent[],
    profileId: string,
    strict = false
  ): Promise<ConformanceResult[]> {
    const results = await Promise.all(
      manifests.map((manifest) =>
        this.runConformanceTest(manifest, profileId, strict)
      )
    );
    return results;
  }

  /**
   * Get conformance summary statistics
   * @param results - Array of conformance results
   * @returns Summary statistics
   */
  getSummaryStatistics(results: ConformanceResult[]): {
    total: number;
    passed: number;
    failed: number;
    averageScore: number;
    passRate: number;
  } {
    const total = results.length;
    const passed = results.filter((r) => r.passed).length;
    const failed = total - passed;
    const averageScore =
      total > 0 ? results.reduce((sum, r) => sum + r.score, 0) / total : 0;
    const passRate = total > 0 ? passed / total : 0;

    return {
      total,
      passed,
      failed,
      averageScore: Math.round(averageScore * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
    };
  }
}
