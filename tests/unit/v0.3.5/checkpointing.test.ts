/**
 * OSSA v0.3.5 Checkpointing Tests
 */

import { describe, it, expect } from '@jest/globals';
import { V035FeatureValidator } from '../../../src/tools/validation/validate-v0.3.5-features.js';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

describe('OSSA v0.3.5 Checkpointing', () => {
  const validator = new V035FeatureValidator();
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'v0.3.5');

  it('should validate valid checkpointing configuration', () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: {
        identity: { id: '@test-agent' },
        checkpointing: {
          enabled: true,
          interval: 'iteration',
          interval_value: 5,
          storage: {
            backend: 'agent-brain',
            location: 's3://checkpoints/{agent_id}/{session_id}',
          },
        },
      },
    };

    const tempFile = join(testDir, 'checkpoint-test.yaml');
    writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

    const result = validator.validate(tempFile);
    expect(result.valid).toBe(true);
    expect(result.features.checkpointing).toBe(true);

    unlinkSync(tempFile);
  });

  it('should validate all checkpoint intervals', () => {
    const intervals = ['iteration', 'time', 'manual'];

    for (const interval of intervals) {
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          identity: { id: '@test-agent' },
          checkpointing: {
            enabled: true,
            interval,
          },
        },
      };

      const tempFile = join(testDir, `checkpoint-${interval}-test.yaml`);
      writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

      const result = validator.validate(tempFile);
      expect(result.valid).toBe(true);

      unlinkSync(tempFile);
    }
  });

  it('should reject invalid checkpoint backend', () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: {
        identity: { id: '@test-agent' },
        checkpointing: {
          enabled: true,
          storage: {
            backend: 'invalid-backend',
          },
        },
      },
    };

    const tempFile = join(testDir, 'invalid-checkpoint-test.yaml');
    writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

    const result = validator.validate(tempFile);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('backend'))).toBe(true);

    unlinkSync(tempFile);
  });
});
