/**
 * OSSA v0.3.5 Completion Signals Tests
 */

import { describe, it, expect } from '@jest/globals';
import { V035FeatureValidator } from '../../../src/tools/validation/validate-v0.3.5-features.js';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

describe('OSSA v0.3.5 Completion Signals', () => {
  const validator = new V035FeatureValidator();
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'v0.3.5');

  it('should validate valid completion signals', () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: {
        identity: { id: '@test-agent' },
        completion: {
          default_signal: 'complete',
          signals: [
            { signal: 'continue', condition: 'iteration_count < 10' },
            { signal: 'blocked', condition: 'confidence < 0.5' },
          ],
          max_iterations: 10,
        },
      },
    };

    const tempFile = join(testDir, 'completion-test.yaml');
    writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

    const result = validator.validate(tempFile);
    expect(result.valid).toBe(true);
    expect(result.features.completion_signals).toBe(true);

    unlinkSync(tempFile);
  });

  it('should reject invalid completion signal', () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: {
        identity: { id: '@test-agent' },
        completion: {
          default_signal: 'invalid_signal',
        },
      },
    };

    const tempFile = join(testDir, 'invalid-completion-test.yaml');
    writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

    const result = validator.validate(tempFile);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid'))).toBe(true);

    unlinkSync(tempFile);
  });

  it('should validate all five completion signals', () => {
    const signals = [
      'continue',
      'complete',
      'blocked',
      'escalate',
      'checkpoint',
    ];

    for (const signal of signals) {
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          identity: { id: '@test-agent' },
          completion: {
            default_signal: signal,
          },
        },
      };

      const tempFile = join(testDir, `signal-${signal}-test.yaml`);
      writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

      const result = validator.validate(tempFile);
      expect(result.valid).toBe(true);
      expect(result.features.completion_signals).toBe(true);

      unlinkSync(tempFile);
    }
  });
});
