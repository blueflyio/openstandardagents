/**
 * ConformanceProfileLoader Service Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConformanceProfileLoader } from '../../../../src/services/conformance/profile-loader.service.js';
import { API_VERSION } from '../../../../src/version.js';

describe.skip('ConformanceProfileLoader', () => {
  let loader: ConformanceProfileLoader;

  beforeEach(() => {
    loader = new ConformanceProfileLoader();
  });

  describe('listProfiles', () => {
    it('should list all available profiles', () => {
      const profiles = loader.listProfiles();

      expect(profiles).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);

      // Check for baseline profile
      const baseline = profiles.find((p) => p.id === 'baseline');
      expect(baseline).toBeDefined();
      expect(baseline?.name).toBe('OSSA Baseline Profile');
    });
  });

  describe('hasProfile', () => {
    it('should return true for existing profile', () => {
      expect(loader.hasProfile('baseline')).toBe(true);
    });

    it('should return false for non-existing profile', () => {
      expect(loader.hasProfile('non-existent')).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should load baseline profile', () => {
      const profile = loader.getProfile('baseline');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('baseline');
      expect(profile.name).toBe('OSSA Baseline Profile');
      expect(profile.version).toBe('0.3.5');
      expect(profile.required.features).toBeDefined();
      expect(profile.optional.features).toBeDefined();
      expect(profile.scoring).toBeDefined();
    });

    it('should load enterprise profile', () => {
      const profile = loader.getProfile('enterprise');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('enterprise');
      expect(profile.name).toBe('OSSA Enterprise Profile');
      expect(profile.extends).toBe('baseline');
    });

    it('should load gitlab-kagent profile', () => {
      const profile = loader.getProfile('gitlab-kagent');

      expect(profile).toBeDefined();
      expect(profile.id).toBe('gitlab-kagent');
      expect(profile.name).toBe('GitLab Kagent Extension Profile');
    });

    it('should throw error for non-existing profile', () => {
      expect(() => loader.getProfile('non-existent')).toThrow();
    });
  });

  describe('profile inheritance', () => {
    it('should resolve enterprise profile extending baseline', () => {
      const profile = loader.getProfile('enterprise');

      // Should include baseline required features
      expect(profile.required.features).toContain('apiVersion');
      expect(profile.required.features).toContain('kind');
      expect(profile.required.features).toContain('metadata.name');

      // Should include enterprise-specific features
      expect(profile.required.features).toContain('spec.observability.tracing');
      expect(profile.required.features).toContain('spec.constraints.cost');
    });

    it('should resolve gitlab-kagent profile extending enterprise', () => {
      const profile = loader.getProfile('gitlab-kagent');

      // Should include baseline features
      expect(profile.required.features).toContain('apiVersion');

      // Should include kagent-specific features
      expect(profile.required.features).toContain('extensions.kagent.enabled');
      expect(profile.required.features).toContain(
        'extensions.kagent.gitlab_integration'
      );
    });
  });

  describe('profile structure validation', () => {
    it('should have required weights that sum correctly', () => {
      const profile = loader.getProfile('baseline');

      expect(profile.required.weight).toBeGreaterThan(0);
      expect(profile.optional.weight).toBeGreaterThan(0);
      expect(profile.required.weight + profile.optional.weight).toBe(1);
    });

    it('should have valid scoring thresholds', () => {
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
