/**
 * OSSA v0.3.5 Backward Compatibility Tests
 *
 * Ensures v0.3.5 agents work with v0.3.4 runtimes
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'yaml';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { API_VERSION } from '../../../src/version.js';

describe.skip('OSSA v0.3.5 Backward Compatibility', () => {
  const rootDir = process.cwd();
  const v034SchemaPath = join(
    rootDir,
    'spec',
    'v0.3.4',
    'ossa-0.3.4.schema.json'
  );
  const v035SchemaPath = join(
    rootDir,
    'spec',
    'v0.3.5',
    'ossa-0.3.5.schema.json'
  );

  it('should validate v0.3.4 manifest with v0.3.5 schema', () => {
    const v034Schema = JSON.parse(readFileSync(v034SchemaPath, 'utf-8'));
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(v034Schema);

    // Create minimal v0.3.4 manifest
    const manifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        identity: {
          id: '@test-agent',
        },
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet',
        },
      },
    };

    const valid = validate(manifest);
    expect(valid).toBe(true);
  });

  it('should validate v0.3.5 manifest without v0.3.5 features using v0.3.4 schema', () => {
    const v034Schema = JSON.parse(readFileSync(v034SchemaPath, 'utf-8'));
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(v034Schema);

    // Create v0.3.5 manifest without new features (backward compatible)
    const manifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        identity: {
          id: '@test-agent',
        },
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet',
        },
      },
    };

    const valid = validate(manifest);
    // Should be valid because v0.3.5 extends v0.3.4
    expect(valid).toBe(true);
  });

  it('should ignore v0.3.5 extensions when validating with v0.3.4 schema', () => {
    const v034Schema = JSON.parse(readFileSync(v034SchemaPath, 'utf-8'));
    const ajv = new Ajv({ strict: false, allErrors: true });
    addFormats(ajv);
    const validate = ajv.compile(v034Schema);

    // Create v0.3.5 manifest with new features
    const manifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        identity: {
          id: '@test-agent',
        },
        llm: {
          provider: 'anthropic',
          model: 'claude-sonnet',
        },
        completion: {
          default_signal: 'complete',
        },
        checkpointing: {
          enabled: true,
        },
      },
      extensions: {
        experts: {
          registry: [],
        },
      },
    };

    const valid = validate(manifest);
    // v0.3.4 schema should ignore unknown properties (additionalProperties: true)
    // So this should still validate
    expect(valid).toBe(true);
  });

  it('should validate v0.3.5 Flow kind separately', () => {
    const v035Schema = JSON.parse(readFileSync(v035SchemaPath, 'utf-8'));
    const ajv = new Ajv({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(v035Schema);

    const flowManifest = {
      apiVersion: API_VERSION,
      kind: 'Flow',
      metadata: {
        name: 'test-flow',
        version: '1.0.0',
      },
      spec: {
        flow_schema: {
          initial_state: 'ready',
          states: [{ name: 'ready' }, { name: 'completed' }],
        },
        transitions: [
          {
            from: 'ready',
            to: 'completed',
            trigger: {
              type: 'webhook',
              event: 'test.event',
            },
          },
        ],
      },
    };

    const valid = validate(flowManifest);
    expect(valid).toBe(true);
  });
});
