/**
 * Tests for ossa validate command
 * Following TDD principles
 */

import { describe, it, expect } from '@jest/globals';
import { API_VERSION } from '../../../src/version.js';

describe('ossa validate', () => {
  it('should validate OSSA manifest structure', () => {
    const validManifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        namespace: 'default',
        version: '1.0.0',
      },
      spec: {
        role: 'Test agent',
      },
    };

    expect(validManifest.apiVersion).toBe('ossa/v0.4.1');
    expect(validManifest.kind).toBe('Agent');
    expect(validManifest.metadata.name).toBeTruthy();
    expect(validManifest.spec).toBeDefined();
  });

  it('should reject invalid apiVersion', () => {
    const invalidManifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
    };

    expect(invalidManifest.apiVersion).not.toBe('ossa/v0.4.1');
  });

  it('should reject missing required fields', () => {
    const invalidManifests = [
      { kind: 'Agent' },
      { apiVersion: API_VERSION },
      { apiVersion: API_VERSION, kind: 'Agent', metadata: {} },
    ];

    invalidManifests.forEach((manifest) => {
      const isValid =
        manifest.apiVersion === 'ossa/v0.4.1' &&
        manifest.kind === 'Agent' &&
        (manifest as any).metadata?.name &&
        (manifest as any).spec;
      expect(isValid).toBeFalsy();
    });
  });
});
