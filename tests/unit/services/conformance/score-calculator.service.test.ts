/**
 * ConformanceScoreCalculator Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConformanceScoreCalculator } from '../../../../src/services/conformance/score-calculator.service.js';
import { API_VERSION } from '../../../src/version.js';
import type {
  ConformanceProfile,
  FeatureDetectionResult,
} from '../../../../src/services/conformance/types.js';
import type { OssaAgent } from '../../../../src/types/index.js';

describe('ConformanceScoreCalculator', () => {
  let calculator: ConformanceScoreCalculator;

  beforeEach(() => {
    calculator = new ConformanceScoreCalculator();
  });

  const mockProfile: ConformanceProfile = {
    id: 'test',
    name: 'Test Profile',
    version: '1.0.0',
    description: 'Test profile',
    required: {
      features: ['feature1', 'feature2'],
      weight: 0.7,
    },
    optional: {
      features: ['feature3', 'feature4'],
      weight: 0.3,
    },
    scoring: {
      pass_threshold: 0.7,
      warn_threshold: 0.85,
    },
  };

  describe('calculateScore', () => {
    it('should calculate perfect score when all features present', () => {
      const requiredResults: FeatureDetectionResult[] = [
        { feature: 'feature1', present: true, path: 'feature1' },
        { feature: 'feature2', present: true, path: 'feature2' },
      ];
      const optionalResults: FeatureDetectionResult[] = [
        { feature: 'feature3', present: true, path: 'feature3' },
        { feature: 'feature4', present: true, path: 'feature4' },
      ];

      const score = calculator.calculateScore(
        mockProfile,
        requiredResults,
        optionalResults
      );

      expect(score).toBe(1.0);
    });

    it('should calculate score with missing optional features', () => {
      const requiredResults: FeatureDetectionResult[] = [
        { feature: 'feature1', present: true, path: 'feature1' },
        { feature: 'feature2', present: true, path: 'feature2' },
      ];
      const optionalResults: FeatureDetectionResult[] = [
        { feature: 'feature3', present: false, path: 'feature3' },
        { feature: 'feature4', present: false, path: 'feature4' },
      ];

      const score = calculator.calculateScore(
        mockProfile,
        requiredResults,
        optionalResults
      );

      expect(score).toBe(0.7); // Only required features (70% weight)
    });

    it('should calculate score with missing required features', () => {
      const requiredResults: FeatureDetectionResult[] = [
        { feature: 'feature1', present: true, path: 'feature1' },
        { feature: 'feature2', present: false, path: 'feature2' },
      ];
      const optionalResults: FeatureDetectionResult[] = [
        { feature: 'feature3', present: true, path: 'feature3' },
        { feature: 'feature4', present: true, path: 'feature4' },
      ];

      const score = calculator.calculateScore(
        mockProfile,
        requiredResults,
        optionalResults
      );

      // 50% required (0.5 * 0.7) + 100% optional (1.0 * 0.3) = 0.65
      expect(score).toBe(0.65);
    });

    it('should handle empty feature lists', () => {
      const emptyProfile = {
        ...mockProfile,
        required: { features: [], weight: 0.7 },
        optional: { features: [], weight: 0.3 },
      };

      const score = calculator.calculateScore(emptyProfile, [], []);

      expect(score).toBe(1.0); // Empty lists treated as 100%
    });
  });

  describe('passes', () => {
    it('should pass when score meets threshold', () => {
      expect(calculator.passes(0.7, mockProfile)).toBe(true);
      expect(calculator.passes(0.8, mockProfile)).toBe(true);
    });

    it('should fail when score below threshold', () => {
      expect(calculator.passes(0.69, mockProfile)).toBe(false);
      expect(calculator.passes(0.5, mockProfile)).toBe(false);
    });
  });

  describe('needsImprovement', () => {
    it('should return true when score between pass and warn thresholds', () => {
      expect(calculator.needsImprovement(0.7, mockProfile)).toBe(true);
      expect(calculator.needsImprovement(0.8, mockProfile)).toBe(true);
    });

    it('should return false when score meets warn threshold', () => {
      expect(calculator.needsImprovement(0.85, mockProfile)).toBe(false);
      expect(calculator.needsImprovement(0.9, mockProfile)).toBe(false);
    });

    it('should return false when score below pass threshold', () => {
      expect(calculator.needsImprovement(0.6, mockProfile)).toBe(false);
    });
  });

  describe('validateConstraints', () => {
    it('should validate pattern constraint', () => {
      const manifest: OssaAgent = {
        apiVersion: 'invalid-format',
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          identity: { id: 'test', version: '1.0.0' },
        },
      };

      const profile: ConformanceProfile = {
        ...mockProfile,
        constraints: {
          apiVersion: {
            pattern: '^ossa/v[0-9]+\\.[0-9]+\\.[0-9]+$',
            description: 'Must follow ossa/vX.Y.Z format',
          },
        },
      };

      const violations = calculator.validateConstraints(manifest, profile);

      expect(violations).toHaveLength(1);
      expect(violations[0].feature).toBe('apiVersion');
      expect(violations[0].constraint).toBe('pattern');
    });

    it('should validate enum constraint', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'InvalidKind' as any,
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          identity: { id: 'test', version: '1.0.0' },
        },
      };

      const profile: ConformanceProfile = {
        ...mockProfile,
        constraints: {
          kind: {
            enum: ['Agent', 'AgentTeam', 'AgentWorkflow'],
            description: 'Must be valid kind',
          },
        },
      };

      const violations = calculator.validateConstraints(manifest, profile);

      expect(violations).toHaveLength(1);
      expect(violations[0].constraint).toBe('enum');
    });

    it('should validate type constraint', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          identity: { id: 'test', version: '1.0.0' },
          constraints: {
            cost: {
              max_cost_per_task: '1.0' as any, // String instead of number
            },
          },
        },
      };

      const profile: ConformanceProfile = {
        ...mockProfile,
        constraints: {
          'spec.constraints.cost.max_cost_per_task': {
            type: 'number',
            description: 'Must be a number',
          },
        },
      };

      const violations = calculator.validateConstraints(manifest, profile);

      expect(violations).toHaveLength(1);
      expect(violations[0].constraint).toBe('type');
    });

    it('should validate minimum constraint', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          identity: { id: 'test', version: '1.0.0' },
          constraints: {
            cost: {
              max_cost_per_task: -1,
            },
          },
        },
      };

      const profile: ConformanceProfile = {
        ...mockProfile,
        constraints: {
          'spec.constraints.cost.max_cost_per_task': {
            type: 'number',
            minimum: 0,
            description: 'Must be non-negative',
          },
        },
      };

      const violations = calculator.validateConstraints(manifest, profile);

      expect(violations).toHaveLength(1);
      expect(violations[0].constraint).toBe('minimum');
    });

    it('should not report violations for missing features', () => {
      const manifest: OssaAgent = {
        apiVersion: API_VERSION,
        kind: 'Agent',
        metadata: { name: 'test' },
        spec: {
          type: 'service',
          identity: { id: 'test', version: '1.0.0' },
        },
      };

      const profile: ConformanceProfile = {
        ...mockProfile,
        constraints: {
          'spec.missing.feature': {
            type: 'string',
            description: 'Missing feature',
          },
        },
      };

      const violations = calculator.validateConstraints(manifest, profile);

      expect(violations).toHaveLength(0); // Missing features are not constraint violations
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend adding missing required features', () => {
      const recommendations = calculator.generateRecommendations(
        mockProfile,
        ['feature1', 'feature2'],
        []
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('required features');
    });

    it('should recommend adding missing optional features', () => {
      const recommendations = calculator.generateRecommendations(
        mockProfile,
        [],
        ['feature3', 'feature4']
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toContain('optional features');
    });

    it('should provide profile-specific recommendations for enterprise', () => {
      const enterpriseProfile: ConformanceProfile = {
        ...mockProfile,
        id: 'enterprise',
        name: 'Enterprise Profile',
      };

      const recommendations = calculator.generateRecommendations(
        enterpriseProfile,
        ['spec.observability.tracing', 'spec.constraints.cost'],
        []
      );

      expect(recommendations.length).toBeGreaterThan(1);
      expect(recommendations.some((r) => r.includes('tracing'))).toBe(true);
      expect(recommendations.some((r) => r.includes('cost'))).toBe(true);
    });
  });
});
