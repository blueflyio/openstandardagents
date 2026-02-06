/**
 * ConformanceService Tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Container } from 'inversify';
import { ConformanceService } from '../../../../src/services/conformance/conformance.service.js';
import { ConformanceProfileLoader } from '../../../../src/services/conformance/profile-loader.service.js';
import { FeatureDetector } from '../../../../src/services/conformance/feature-detector.service.js';
import { ConformanceScoreCalculator } from '../../../../src/services/conformance/score-calculator.service.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

describe.skip('ConformanceService', () => {
  let container: Container;
  let conformanceService: ConformanceService;

  beforeEach(() => {
    container = new Container();

    // Mock ValidationService
    const mockValidationService = {
      validate: jest.fn().mockResolvedValue({
        valid: true,
        errors: [],
        warnings: [],
      }),
    };

    // Bind services
    container.bind(ConformanceProfileLoader).toSelf();
    container.bind(FeatureDetector).toSelf();
    container.bind(ConformanceScoreCalculator).toSelf();
    container.bind('ValidationService').toConstantValue(mockValidationService);
    container.bind(ConformanceService).toSelf();

    conformanceService = container.get(ConformanceService);
  });

  const mockMinimalManifest: OssaAgent = {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
      description: 'Test agent',
    },
    spec: {
      type: 'service',
      identity: {
        id: 'test-agent',
        version: '1.0.0',
      },
      capabilities: [
        {
          name: 'test',
          description: 'Test capability',
        },
      ],
    },
  };

  const mockEnterpriseManifest: OssaAgent = {
    ...mockMinimalManifest,
    metadata: {
      ...mockMinimalManifest.metadata,
      version: '1.0.0',
      labels: { env: 'prod' },
    },
    spec: {
      ...mockMinimalManifest.spec,
      llm: {
        provider: 'openai',
        model: 'gpt-4',
      },
      autonomy: {
        level: 'monitored',
        approval_required: true,
      },
      constraints: {
        cost: {
          max_cost_per_task: 0.5,
        },
        performance: {
          max_execution_time_ms: 30000,
        },
      },
      observability: {
        tracing: {
          enabled: true,
        },
        metrics: {
          enabled: true,
        },
        logging: {
          enabled: true,
        },
      },
    },
  };

  describe('listProfiles', () => {
    it('should list available conformance profiles', () => {
      const profiles = conformanceService.listProfiles();

      expect(profiles).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
    });
  });

  describe('hasProfile', () => {
    it('should return true for existing profile', () => {
      expect(conformanceService.hasProfile('baseline')).toBe(true);
    });

    it('should return false for non-existing profile', () => {
      expect(conformanceService.hasProfile('non-existent')).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should get profile details', () => {
      const profile = conformanceService.getProfile('baseline');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('baseline');
      expect(profile.name).toBe('OSSA Baseline Profile');
    });
  });

  describe('runConformanceTest', () => {
    it('should test minimal manifest against baseline profile', async () => {
      const result = await conformanceService.runConformanceTest(
        mockMinimalManifest,
        'baseline'
      );

      expect(result).toBeDefined();
      expect(result.profile).toBe('baseline');
      expect(result.score).toBeGreaterThan(0);
      expect(result.details.required).toBeDefined();
      expect(result.details.optional).toBeDefined();
    });

    it('should test enterprise manifest against enterprise profile', async () => {
      const result = await conformanceService.runConformanceTest(
        mockEnterpriseManifest,
        'enterprise'
      );

      expect(result).toBeDefined();
      expect(result.profile).toBe('enterprise');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should include constraint violations in result', async () => {
      const invalidManifest: OssaAgent = {
        ...mockMinimalManifest,
        kind: 'InvalidKind' as any,
      };

      const result = await conformanceService.runConformanceTest(
        invalidManifest,
        'baseline'
      );

      expect(result).toBeDefined();
      expect(result.constraintViolations).toBeDefined();
    });

    it('should include recommendations in result', async () => {
      const result = await conformanceService.runConformanceTest(
        mockMinimalManifest,
        'baseline'
      );

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('generateReport', () => {
    it('should generate conformance report', async () => {
      const report = await conformanceService.generateReport(
        mockMinimalManifest,
        'baseline'
      );

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.manifest).toBeDefined();
      expect(report.results).toBeDefined();
      expect(report.summary.profile).toBe('OSSA Baseline Profile');
      expect(report.manifest.name).toBe('test-agent');
    });
  });

  describe('batchTest', () => {
    it('should test multiple manifests', async () => {
      const manifests = [mockMinimalManifest, mockEnterpriseManifest];

      const results = await conformanceService.batchTest(manifests, 'baseline');

      expect(results).toHaveLength(2);
      expect(results[0].profile).toBe('baseline');
      expect(results[1].profile).toBe('baseline');
    });
  });

  describe('getSummaryStatistics', () => {
    it('should calculate summary statistics', async () => {
      const manifests = [mockMinimalManifest, mockEnterpriseManifest];
      const results = await conformanceService.batchTest(manifests, 'baseline');

      const stats = conformanceService.getSummaryStatistics(results);

      expect(stats).toBeDefined();
      expect(stats.total).toBe(2);
      expect(stats.passed).toBeGreaterThanOrEqual(0);
      expect(stats.failed).toBeGreaterThanOrEqual(0);
      expect(stats.averageScore).toBeGreaterThanOrEqual(0);
      expect(stats.averageScore).toBeLessThanOrEqual(1);
      expect(stats.passRate).toBeGreaterThanOrEqual(0);
      expect(stats.passRate).toBeLessThanOrEqual(1);
    });
  });
});
