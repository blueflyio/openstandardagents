/**
 * FeatureDetector Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FeatureDetector } from '../../../../src/services/conformance/feature-detector.service.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

describe('FeatureDetector', () => {
  let detector: FeatureDetector;

  beforeEach(() => {
    detector = new FeatureDetector();
  });

  const mockManifest: OssaAgent = {
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: {
      name: 'test-agent',
      description: 'Test agent',
      labels: {
        env: 'test',
      },
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
      llm: {
        provider: 'openai',
        model: 'gpt-4',
        temperature: 0.7,
      },
      autonomy: {
        level: 'monitored',
        approval_required: true,
      },
    },
  };

  describe('detectFeatures', () => {
    it('should detect present features', () => {
      const features = ['apiVersion', 'kind', 'metadata.name'];
      const results = detector.detectFeatures(mockManifest, features);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.present)).toBe(true);
    });

    it('should detect missing features', () => {
      const features = ['spec.missing.feature', 'another.missing'];
      const results = detector.detectFeatures(mockManifest, features);

      expect(results).toHaveLength(2);
      expect(results.every((r) => !r.present)).toBe(true);
    });

    it('should detect nested features', () => {
      const features = ['spec.llm.provider', 'spec.llm.model'];
      const results = detector.detectFeatures(mockManifest, features);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.present)).toBe(true);
      expect(results[0].value).toBe('openai');
      expect(results[1].value).toBe('gpt-4');
    });

    it('should handle deeply nested paths', () => {
      const features = ['spec.identity.id', 'spec.identity.version'];
      const results = detector.detectFeatures(mockManifest, features);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.present)).toBe(true);
    });
  });

  describe('countPresent', () => {
    it('should count present features correctly', () => {
      const features = ['apiVersion', 'kind', 'missing.feature'];
      const results = detector.detectFeatures(mockManifest, features);
      const count = detector.countPresent(results);

      expect(count).toBe(2);
    });
  });

  describe('getMissing', () => {
    it('should return missing feature names', () => {
      const features = ['apiVersion', 'missing.feature', 'another.missing'];
      const results = detector.detectFeatures(mockManifest, features);
      const missing = detector.getMissing(results);

      expect(missing).toHaveLength(2);
      expect(missing).toContain('missing.feature');
      expect(missing).toContain('another.missing');
    });
  });

  describe('getPresent', () => {
    it('should return present feature names', () => {
      const features = ['apiVersion', 'kind', 'missing.feature'];
      const results = detector.detectFeatures(mockManifest, features);
      const present = detector.getPresent(results);

      expect(present).toHaveLength(2);
      expect(present).toContain('apiVersion');
      expect(present).toContain('kind');
    });
  });

  describe('detectAllFeatures', () => {
    it('should detect all standard OSSA features', () => {
      const allFeatures = detector.detectAllFeatures(mockManifest);

      expect(allFeatures.core).toBeDefined();
      expect(allFeatures.capabilities).toBeDefined();
      expect(allFeatures.configuration).toBeDefined();
      expect(allFeatures.operational).toBeDefined();
      expect(allFeatures.extensions).toBeDefined();

      // Core features should be present
      expect(allFeatures.core.filter((f) => f.present).length).toBeGreaterThan(
        0
      );
    });

    it('should categorize features correctly', () => {
      const allFeatures = detector.detectAllFeatures(mockManifest);

      // Check core features
      const corePresent = allFeatures.core.filter((f) => f.present);
      expect(corePresent.map((f) => f.feature)).toContain('apiVersion');
      expect(corePresent.map((f) => f.feature)).toContain('kind');

      // Check configuration features
      const configPresent = allFeatures.configuration.filter((f) => f.present);
      expect(configPresent.map((f) => f.feature)).toContain(
        'spec.llm.provider'
      );
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const manifest = {
        ...mockManifest,
        spec: {
          ...mockManifest.spec,
          nullField: null,
        },
      };
      const results = detector.detectFeatures(manifest as OssaAgent, [
        'spec.nullField',
      ]);

      expect(results[0].present).toBe(false);
    });

    it('should handle undefined values', () => {
      const results = detector.detectFeatures(mockManifest, ['spec.undefined']);

      expect(results[0].present).toBe(false);
    });

    it('should handle array fields', () => {
      const results = detector.detectFeatures(mockManifest, [
        'spec.capabilities',
      ]);

      expect(results[0].present).toBe(true);
      expect(Array.isArray(results[0].value)).toBe(true);
    });

    it('should handle object fields', () => {
      const results = detector.detectFeatures(mockManifest, ['spec.llm']);

      expect(results[0].present).toBe(true);
      expect(typeof results[0].value).toBe('object');
    });
  });
});
