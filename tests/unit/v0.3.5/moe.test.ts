/**
 * OSSA v0.3.5 Mixture of Experts (MoE) Tests
 */

import { describe, it, expect } from '@jest/globals';
import { V035FeatureValidator } from '../../../src/tools/validation/validate-v0.3.5-features.js';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';

describe('OSSA v0.3.5 Mixture of Experts', () => {
  const validator = new V035FeatureValidator();
  const testDir = join(process.cwd(), 'tests', 'fixtures', 'v0.3.5');

  it('should validate valid MoE configuration', () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: {
        identity: { id: '@test-agent' },
      },
      extensions: {
        experts: {
          registry: [
            {
              id: 'reasoning-expert',
              model: {
                provider: 'anthropic',
                model: 'claude-opus-4-5-20251101',
              },
              specializations: ['complex_reasoning'],
              cost_tier: 'premium',
            },
          ],
          selection_strategy: 'agent_controlled',
        },
      },
    };

    const tempFile = join(testDir, 'moe-test.yaml');
    writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

    const result = validator.validate(tempFile);
    expect(result.valid).toBe(true);
    expect(result.features.moe).toBe(true);

    unlinkSync(tempFile);
  });

  it('should validate all selection strategies', () => {
    const strategies = ['agent_controlled', 'cost_optimized', 'capability_match', 'hybrid'];
    
    for (const strategy of strategies) {
      const manifest = {
        apiVersion: 'ossa/v0.3.5',
        kind: 'Agent',
        metadata: { name: 'test-agent' },
        spec: {
          identity: { id: '@test-agent' },
        },
        extensions: {
          experts: {
            registry: [],
            selection_strategy: strategy,
          },
        },
      };

      const tempFile = join(testDir, `moe-${strategy}-test.yaml`);
      writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

      const result = validator.validate(tempFile);
      expect(result.valid).toBe(true);

      unlinkSync(tempFile);
    }
  });

  it('should reject expert without required fields', () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.5',
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: {
        identity: { id: '@test-agent' },
      },
      extensions: {
        experts: {
          registry: [
            {
              id: 'incomplete-expert',
              // Missing model
            },
          ],
        },
      },
    };

    const tempFile = join(testDir, 'invalid-moe-test.yaml');
    writeFileSync(tempFile, yaml.stringify(manifest), 'utf-8');

    const result = validator.validate(tempFile);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('model'))).toBe(true);

    unlinkSync(tempFile);
  });
});
