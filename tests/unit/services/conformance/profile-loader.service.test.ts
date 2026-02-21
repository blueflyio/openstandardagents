/**
 * ConformanceProfileLoader Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConformanceProfileLoader } from '../../../../src/services/conformance/profile-loader.service.js';
import { API_VERSION } from '../../../../src/version.js';

describe('ConformanceProfileLoader', () => {
  let loader: ConformanceProfileLoader;

  beforeEach(() => {
    loader = new ConformanceProfileLoader();
  });

  describe('listProfiles', () => {
    it('should list all available profiles when profiles dir exists', () => {
      const profiles = loader.listProfiles();

      expect(profiles).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);
      if (profiles.length > 0) {
        const baseline = profiles.find((p) => p.id === 'baseline');
        expect(baseline).toBeDefined();
        expect(baseline?.name).toBe('OSSA Baseline Profile');
      }
    });
  });

  describe('hasProfile', () => {
    it('should return true for existing profile when loaded', () => {
      const has = loader.hasProfile('baseline');
      expect(typeof has).toBe('boolean');
    });

    it('should return false for non-existing profile', () => {
      expect(loader.hasProfile('non-existent')).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should load baseline profile when profiles dir exists', () => {
      if (!loader.hasProfile('baseline')) return;
      const profile = loader.getProfile('baseline');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('baseline');
      expect(profile.name).toBe('OSSA Baseline Profile');
      expect(profile.version).toBeDefined();
      expect(profile.required.features).toBeDefined();
      expect(profile.optional.features).toBeDefined();
      expect(profile.scoring).toBeDefined();
    });

    it('should load enterprise profile when present', () => {
      if (!loader.hasProfile('enterprise')) return;
      const profile = loader.getProfile('enterprise');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('enterprise');
      expect(profile.name).toBe('OSSA Enterprise Profile');
      expect(profile.extends).toBe('baseline');
    });

    it('should load gitlab-kagent profile when present', () => {
      if (!loader.hasProfile('gitlab-kagent')) return;
      const profile = loader.getProfile('gitlab-kagent');
      expect(profile).toBeDefined();
      expect(profile.id).toBe('gitlab-kagent');
    });

    it('should throw error for non-existing profile', () => {
      expect(() => loader.getProfile('non-existent')).toThrow();
    });
  });

  describe('profile inheritance', () => {
    it('should resolve enterprise profile extending baseline', () => {
      if (!loader.hasProfile('enterprise')) return;
      const profile = loader.getProfile('enterprise');

      expect(profile.required.features).toContain('metadata.name');
      if (profile.required.features.includes('spec.observability.tracing')) {
        expect(profile.required.features).toContain('spec.observability.tracing');
      }
      if (profile.required.features.includes('spec.constraints.cost')) {
        expect(profile.required.features).toContain('spec.constraints.cost');
      }
    });

    it('should resolve gitlab-kagent profile when present', () => {
      if (!loader.hasProfile('gitlab-kagent')) return;
      const profile = loader.getProfile('gitlab-kagent');
      expect(profile.id).toBe('gitlab-kagent');
    });
  });

  describe('profile structure validation', () => {
    it('should have required weights that sum correctly', () => {
      if (!loader.hasProfile('baseline')) return;
      const profile = loader.getProfile('baseline');

      expect(profile.required.weight).toBeGreaterThan(0);
      expect(profile.optional.weight).toBeGreaterThan(0);
      expect(profile.required.weight + profile.optional.weight).toBe(1);
    });

    it('should have valid scoring thresholds', () => {
      if (!loader.hasProfile('baseline')) return;
      const profile = loader.getProfile('baseline');

      expect(profile.scoring.pass_threshold).toBeGreaterThanOrEqual(0);
      expect(profile.scoring.pass_threshold).toBeLessThanOrEqual(1);
      expect(profile.scoring.warn_threshold).toBeGreaterThanOrEqual(
        profile.scoring.pass_threshold
      );
      expect(profile.scoring.warn_threshold).toBeLessThanOrEqual(1);
    });
  });
});
