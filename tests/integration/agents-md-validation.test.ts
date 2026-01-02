/**
 * agents.md Extension Integration Tests
 * Tests schema validation and Cursor extension integration
 */

import { describe, it, expect } from '@jest/globals';
import { container } from '../../src/di-container.js';
import { ValidationService } from '../../src/services/validation.service.js';
import { ManifestRepository } from '../../src/repositories/manifest.repository.js';
import * as path from 'path';
import * as fs from 'fs';

describe('agents.md Extension Integration', () => {
  const validationService = container.get(ValidationService);
  const manifestRepo = container.get(ManifestRepository);

  it('should validate agents_md extension in manifest', async () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Test agent with agents.md support',
        llm: {
          provider: 'openai',
          model: 'gpt-4o',
        },
      },
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          file_path: 'AGENTS.md',
          sections: {
            dev_environment: {
              enabled: true,
              custom: 'Use pnpm for package management',
            },
            testing: {
              enabled: true,
              custom: 'Run pnpm test before committing',
            },
          },
          sync: {
            on_manifest_change: true,
            include_comments: true,
          },
        },
      },
    };

    const result = await validationService.validate(manifest, '0.3.3');
    if (result.errors.length > 0) {
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate agents_md with Cursor extension integration', async () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'cursor-agents-md-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Code assistant with Cursor and agents.md support',
        llm: {
          provider: 'openai',
          model: 'gpt-4o',
        },
      },
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          cursor_integration: true,
          sections: {
            dev_environment: { enabled: true },
            testing: { enabled: true },
            pr_instructions: { enabled: true },
            code_style: { enabled: true },
          },
        },
        cursor: {
          enabled: true,
          agent_type: 'composer',
          workspace_config: {
            context_files: ['src/**/*.ts'],
            ignore_patterns: ['node_modules/**'],
          },
        },
      },
    };

    const result = await validationService.validate(manifest, '0.3.3');
    if (result.errors.length > 0) {
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
  });

  it('should validate agents_md with sections for monorepo', async () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'monorepo-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Monorepo development assistant',
      },
      extensions: {
        agents_md: {
          enabled: true,
          generate: true,
          file_path: 'AGENTS.md',
          sections: {
            dev_environment: {
              enabled: true,
              custom: 'This is a pnpm workspace monorepo',
            },
            architecture: {
              enabled: true,
              custom: 'Multi-package workspace with apps and libs',
            },
          },
        },
      },
    };

    const result = await validationService.validate(manifest, '0.3.3');
    if (result.errors.length > 0) {
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
  });

  it('should validate agents_md with bidirectional mapping', async () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'mapping-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Agent with bidirectional mapping',
        tools: [
          {
            type: 'mcp',
            name: 'filesystem',
            server: 'fs',
          },
        ],
        constraints: {
          performance: {
            maxLatencySeconds: 30,
          },
        },
        autonomy: {
          level: 'supervised',
          approval_required: true,
        },
      },
      extensions: {
        agents_md: {
          enabled: true,
          mapping: {
            tools_to_dev_environment: true,
            constraints_to_testing: true,
            autonomy_to_pr_instructions: true,
          },
        },
      },
    };

    const result = await validationService.validate(manifest, '0.3.3');
    if (result.errors.length > 0) {
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
  });

  it('should validate agents_md example manifests', async () => {
    const examplesDir = path.join(process.cwd(), 'examples', 'agents-md');

    if (!fs.existsSync(examplesDir)) {
      console.warn('agents-md examples directory not found, skipping');
      return;
    }

    const files = fs.readdirSync(examplesDir);
    for (const file of files) {
      if (file.endsWith('.ossa.json') || file.endsWith('.ossa.yaml')) {
        const fullPath = path.join(examplesDir, file);
        try {
          const manifest = await manifestRepo.load(fullPath);

          // Only validate v0.3.3 manifests
          if (!manifest.apiVersion?.includes('0.3.3')) {
            continue;
          }

          const result = await validationService.validate(manifest, '0.3.3');
          if (result.errors.length > 0) {
            console.error(`Validation errors for ${file}:`, JSON.stringify(result.errors, null, 2));
          }
          expect(result.errors).toHaveLength(0);
        } catch (error) {
          console.error(`Failed to validate ${file}:`, error);
          throw error;
        }
      }
    }
  });

  it('should validate custom sections array', async () => {
    const manifest = {
      apiVersion: 'ossa/v0.3.3',
      kind: 'Agent',
      metadata: {
        name: 'custom-sections-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Agent with custom sections',
      },
      extensions: {
        agents_md: {
          enabled: true,
          sections: {
            custom: [
              {
                enabled: true,
                title: 'Architecture',
                custom: 'This is a microservices architecture using event sourcing.',
              },
              {
                enabled: true,
                title: 'Deployment',
                custom: 'Deploy using Kubernetes with Helm charts.',
              },
            ],
          },
        },
      },
    };

    const result = await validationService.validate(manifest, '0.3.3');
    if (result.errors.length > 0) {
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
    }
    expect(result.valid).toBe(true);
  });
});
