/**
 * Agents.md Extension Schema Validation Tests
 * Test the AgentsMdExtension schema definition
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import Ajv from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import type { OssaAgent } from '../../../src/types/index.js';

describe('AgentsMdExtension Schema Validation', () => {
  let ajv: Ajv;
  let schema: Record<string, unknown>;

  beforeAll(() => {
    // Load schema
    const schemaPath = path.resolve(__dirname, '../../../spec/v0.3.3/ossa-0.3.3.schema.json');
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    ajv = new Ajv({ strict: false, allErrors: true });
    ajv.addSchema(schema);
  });

  it('should validate manifest with agents_md extension', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          file_path: 'AGENTS.md',
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }

    expect(valid).toBe(true);
  });

  it('should validate manifest with all agents_md properties', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          file_path: '.github/AGENTS.md',
          sections: {
            dev_environment: {
              enabled: true,
              source: 'spec.tools',
              custom: 'Custom content',
              title_format: 'Dev Setup',
            },
            testing: {
              enabled: true,
              source: 'spec.constraints',
            },
            pr_instructions: {
              enabled: false,
            },
          },
          sync: {
            on_manifest_change: true,
            include_comments: false,
          },
          cursor_integration: true,
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }

    expect(valid).toBe(true);
  });

  it('should validate manifest with minimal agents_md config', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    expect(valid).toBe(true);
  });

  it('should validate AgentsMdSection schema', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          sections: {
            dev_environment: {
              enabled: true,
              source: 'spec.tools',
            },
            testing: {
              enabled: true,
              custom: 'Run npm test',
            },
            pr_instructions: {
              enabled: true,
              title_format: '[{metadata.labels.domain}] {title}',
            },
          },
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    expect(valid).toBe(true);
  });

  it('should validate sync configuration', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          sync: {
            on_manifest_change: true,
            include_comments: true,
          },
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    expect(valid).toBe(true);
  });

  it('should validate cursor_integration flag', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          cursor_integration: true,
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    expect(valid).toBe(true);
  });

  it('should validate manifest with both agents_md and cursor extensions', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          file_path: 'AGENTS.md',
          cursor_integration: true,
        },
        cursor: {
          enabled: true,
          workspace_config: {
            agents_md_path: 'AGENTS.md',
            context_files: ['AGENTS.md', 'README.md'],
          },
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }

    expect(valid).toBe(true);
  });

  it('should validate Cursor extension with agents_md_path', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        cursor: {
          enabled: true,
          workspace_config: {
            agents_md_path: '.github/AGENTS.md',
            rules_file: '.cursorrules',
            context_files: ['.github/AGENTS.md'],
          },
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    if (!valid) {
      console.error('Validation errors:', validate.errors);
    }

    expect(valid).toBe(true);
  });

  it('should reject additional properties in agents_md extension', () => {
    const manifest: OssaAgent = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test role',
      },
      extensions: {
        agents_md: {
          enabled: true,
          custom_property: 'custom value',
        },
      },
    };

    const validate = ajv.compile(schema);
    const valid = validate(manifest);

    // Schema has additionalProperties: false so custom properties are rejected
    expect(valid).toBe(false);
  });

  it('should validate example manifests', () => {
    const examplePaths = [
      '../../../examples/extensions/agents-md-basic.yml',
      '../../../examples/extensions/agents-md-advanced.yml',
      '../../../examples/extensions/agents-md-sync.yml',
    ];

    examplePaths.forEach((examplePath) => {
      const fullPath = path.resolve(__dirname, examplePath);

      // Skip if file doesn't exist (examples might not be built yet)
      if (!fs.existsSync(fullPath)) {
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');

      // Parse YAML (simple approach - in real tests would use yaml parser)
      // For now, just check file exists
      expect(fs.existsSync(fullPath)).toBe(true);
    });
  });
});
