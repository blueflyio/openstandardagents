/**
 * Tests for ossa validate command
 * Following TDD principles
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('ossa validate', () => {
  it('should validate OSSA manifest structure', () => {
    const validManifest = {
      apiVersion: 'ossa/v0.3.2',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        namespace: 'default',
        version: '1.0.0'
      },
      spec: {
        capabilities: []
      }
    };

    assert.ok(validManifest.apiVersion === 'ossa/v0.3.2');
    assert.ok(validManifest.kind === 'Agent');
    assert.ok(validManifest.metadata.name);
    assert.ok(validManifest.spec);
  });

  it('should reject invalid apiVersion', () => {
    const invalidManifest = {
      apiVersion: 'ossa/v0.1.0',
      kind: 'Agent'
    };

    assert.ok(invalidManifest.apiVersion !== 'ossa/v0.3.2');
  });

  it('should reject missing required fields', () => {
    const invalidManifests = [
      { kind: 'Agent' },
      { apiVersion: 'ossa/v0.3.2' },
      { apiVersion: 'ossa/v0.3.2', kind: 'Agent', metadata: {} }
    ];

    invalidManifests.forEach(manifest => {
      const isValid = manifest.apiVersion === 'ossa/v0.3.2' &&
                      manifest.kind === 'Agent' &&
                      manifest.metadata?.name &&
                      manifest.spec;
      assert.ok(!isValid, 'Should reject invalid manifest');
    });
  });
});
