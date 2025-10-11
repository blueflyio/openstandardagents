/**
 * OSSA 1.0 Schema Validation Test Suite
 *
 * Comprehensive tests for OSSA agent manifest validation
 */

import { describe, expect, test } from '@jest/globals';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';

const SCHEMA_PATH = path.join(__dirname, '../../spec/ossa-1.0.schema.json');
const EXAMPLES_PATH = path.join(__dirname, '../../spec/examples');

let ajv: Ajv;
let schema: any;

beforeAll(() => {
  ajv = new Ajv({ allErrors: true, verbose: true });
  schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
});

describe('OSSA Schema Validation', () => {
  test('Schema file exists and is valid JSON', () => {
    expect(schema).toBeDefined();
    expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(schema.title).toBe('OSSA 1.0 Agent Schema');
  });

  test('Schema has required top-level properties', () => {
    expect(schema.required).toContain('ossaVersion');
    expect(schema.required).toContain('agent');
  });

  test('Agent schema has all required fields', () => {
    const agentSchema = schema.properties.agent;
    expect(agentSchema.required).toContain('id');
    expect(agentSchema.required).toContain('name');
    expect(agentSchema.required).toContain('version');
    expect(agentSchema.required).toContain('role');
    expect(agentSchema.required).toContain('runtime');
    expect(agentSchema.required).toContain('capabilities');
  });
});

describe('Example Agent Validation', () => {
  const exampleFiles = fs.readdirSync(EXAMPLES_PATH).filter((f) => f.endsWith('.yml'));

  test.each(exampleFiles)('Example %s validates against schema', (filename) => {
    const filePath = path.join(EXAMPLES_PATH, filename);
    const content = fs.readFileSync(filePath, 'utf-8');
    const agent = yaml.parse(content);

    const validate = ajv.compile(schema);
    const valid = validate(agent);

    if (!valid) {
      console.error(`Validation errors for ${filename}:`, validate.errors);
    }

    expect(valid).toBe(true);
  });
});

describe('Field Validation', () => {
  test('Valid agent ID formats', () => {
    const validate = ajv.compile(schema);

    const validIds = ['compliance-scanner', 'chat-bot-v1', 'agent-123', 'a', 'a-b-c-1-2-3'];

    validIds.forEach((id) => {
      const agent = createMinimalAgent({ id });
      expect(validate(agent)).toBe(true);
    });
  });

  test('Invalid agent ID formats should fail', () => {
    const validate = ajv.compile(schema);

    const invalidIds = [
      'UPPERCASE',
      'has_underscore',
      'has spaces',
      '-starts-with-dash',
      'ends-with-dash-',
      'has..dots',
      ''
    ];

    invalidIds.forEach((id) => {
      const agent = createMinimalAgent({ id });
      expect(validate(agent)).toBe(false);
    });
  });

  test('Valid semver versions', () => {
    const validate = ajv.compile(schema);

    const validVersions = ['1.0.0', '2.1.3', '0.0.1', '1.0.0-beta.1', '2.0.0-rc.1+build.123'];

    validVersions.forEach((version) => {
      const agent = createMinimalAgent({ version });
      expect(validate(agent)).toBe(true);
    });
  });

  test('Invalid versions should fail', () => {
    const validate = ajv.compile(schema);

    const invalidVersions = ['v1.0.0', '1.0', '1', 'latest', ''];

    invalidVersions.forEach((version) => {
      const agent = createMinimalAgent({ version });
      expect(validate(agent)).toBe(false);
    });
  });

  test('Valid roles', () => {
    const validate = ajv.compile(schema);

    const validRoles = [
      'compliance',
      'chat',
      'orchestration',
      'audit',
      'workflow',
      'monitoring',
      'data_processing',
      'integration',
      'development',
      'custom'
    ];

    validRoles.forEach((role) => {
      const agent = createMinimalAgent({ role });
      expect(validate(agent)).toBe(true);
    });
  });

  test('Invalid role should fail', () => {
    const validate = ajv.compile(schema);
    const agent = createMinimalAgent({ role: 'invalid-role' });
    expect(validate(agent)).toBe(false);
  });
});

describe('Runtime Validation', () => {
  test('Valid runtime types', () => {
    const validate = ajv.compile(schema);

    const types = ['docker', 'k8s', 'local', 'serverless', 'edge'];

    types.forEach((type) => {
      const agent = createMinimalAgent({ runtime: { type } });
      expect(validate(agent)).toBe(true);
    });
  });

  test('Docker runtime requires image', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({
      runtime: {
        type: 'docker',
        image: 'ossa/my-agent:1.0.0'
      }
    });

    expect(validate(agent)).toBe(true);
  });

  test('K8s runtime with resources', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({
      runtime: {
        type: 'k8s',
        image: 'ossa/my-agent:1.0.0',
        resources: {
          cpu: '500m',
          memory: '512Mi'
        }
      }
    });

    expect(validate(agent)).toBe(true);
  });
});

describe('Capabilities Validation', () => {
  test('At least one capability required', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({ capabilities: [] });
    // Should still validate structurally but minItems should enforce >=1
    const valid = validate(agent);
    expect(valid).toBe(false);
  });

  test('Valid capability structure', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({
      capabilities: [
        {
          name: 'test_capability',
          description: 'Test capability',
          input_schema: { type: 'object' },
          output_schema: { type: 'object' }
        }
      ]
    });

    expect(validate(agent)).toBe(true);
  });

  test('Capability with OpenAPI reference', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({
      capabilities: [
        {
          name: 'api_call',
          description: 'API call',
          input_schema: 'openapi://api.yaml#/paths/~1users/get',
          output_schema: 'openapi://api.yaml#/components/schemas/User'
        }
      ]
    });

    expect(validate(agent)).toBe(true);
  });
});

describe('Compliance Validation', () => {
  test('Valid compliance frameworks', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({
      policies: {
        compliance: ['fedramp-moderate', 'soc2-type2', 'hipaa']
      }
    });

    expect(validate(agent)).toBe(true);
  });

  test('Encryption required for compliance', () => {
    const validate = ajv.compile(schema);

    const agent = createMinimalAgent({
      policies: {
        compliance: ['fedramp-moderate'],
        encryption: true
      }
    });

    expect(validate(agent)).toBe(true);
  });
});

// Helper function to create minimal valid agent
function createMinimalAgent(overrides: any = {}): any {
  const defaults = {
    ossaVersion: '1.0',
    agent: {
      id: 'test-agent',
      name: 'Test Agent',
      version: '1.0.0',
      role: 'custom',
      runtime: {
        type: 'docker'
      },
      capabilities: [
        {
          name: 'test',
          description: 'Test',
          input_schema: { type: 'object' },
          output_schema: { type: 'object' }
        }
      ]
    }
  };

  // Deep merge overrides
  if (overrides.id) defaults.agent.id = overrides.id;
  if (overrides.version) defaults.agent.version = overrides.version;
  if (overrides.role) defaults.agent.role = overrides.role;
  if (overrides.runtime) defaults.agent.runtime = overrides.runtime;
  if (overrides.capabilities !== undefined) defaults.agent.capabilities = overrides.capabilities;
  if (overrides.policies) (defaults.agent as any).policies = overrides.policies;

  return defaults;
}
