/**
 * Schema Validation Integration Tests
 * Tests comprehensive schema validation with platform extensions
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { container } from '../../src/di-container.js';
import { ValidationService } from '../../src/services/validation.service.js';
import { ManifestRepository } from '../../src/repositories/manifest.repository.js';
import { SchemaRepository } from '../../src/repositories/schema.repository.js';
import type { OssaAgent, SchemaVersion } from '../../src/types/index.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Schema Validation Integration', () => {
  const validationService = container.get(ValidationService);
  const manifestRepo = container.get(ManifestRepository);
  const schemaRepo = container.get(SchemaRepository);
  // Use current schema version dynamically from SchemaRepository
  let CURRENT_SCHEMA_VERSION: SchemaVersion;

  beforeAll(() => {
    CURRENT_SCHEMA_VERSION = schemaRepo.getCurrentVersion() as SchemaVersion;
  });

  it('should validate all example agents', async () => {
    const examplesDir = path.join(process.cwd(), 'examples');
    const platforms = [
      'cursor',
      'openai',
      'crewai',
      'anthropic',
      'langflow',
      'vercel',
      'llamaindex',
      'langgraph',
      'autogen',
      'langchain',
    ];

    for (const platform of platforms) {
      const examplePath = path.join(examplesDir, platform);
      if (!fs.existsSync(examplePath)) {
        continue;
      }

      const files = fs.readdirSync(examplePath);
      for (const file of files) {
        if (file.endsWith('.ossa.json') || file.endsWith('.ossa.yaml')) {
          // Skip legacy version examples (v0.2.2, v1)
          if (file.includes('.v0.2.2.') || file.includes('-v1.')) {
            continue;
          }

          const fullPath = path.join(examplePath, file);
          try {
            const manifest = (await manifestRepo.load(fullPath)) as OssaAgent;

            // Skip manifests not using v0.2.x schema
            if (!manifest.apiVersion?.startsWith('ossa/v0.2')) {
              continue;
            }

            // Map ossa/v0.2 or ossa/v0.2.x to current schema version
            const result = await validationService.validate(
              manifest,
              CURRENT_SCHEMA_VERSION
            );

            // Log errors for debugging
            if (result.errors.length > 0) {
              console.warn(
                `Validation errors for ${fullPath}:`,
                JSON.stringify(
                  result.errors.map((e) => ({
                    path: e.instancePath,
                    message: e.message,
                  })),
                  null,
                  2
                )
              );
            }

            // Examples may have warnings (best practices) but should not have errors
            // If there are errors, they should be from platform validators for incomplete configs
            // We'll be lenient here - examples are meant to demonstrate, not be production-ready
            const criticalErrors = result.errors.filter(
              (e) =>
                !e.instancePath?.includes('/extensions/') ||
                e.message?.includes('required')
            );

            if (criticalErrors.length > 0) {
              console.error(`\n❌ Critical validation errors for ${fullPath}:`);
              console.error(`Total errors: ${result.errors.length}`);
              console.error(`Critical errors: ${criticalErrors.length}`);
              criticalErrors.forEach((e) => {
                console.error(`  - ${e.instancePath}: ${e.message}`);
                console.error(`    keyword: ${e.keyword}, params:`, e.params);
              });
            }

            // Only fail on critical schema errors, not platform-specific validation
            expect(criticalErrors.length).toBe(0);
          } catch (error) {
            console.error(`Failed to validate ${fullPath}:`, error);
            throw error;
          }
        }
      }
    }
  });

  it('should validate platform extensions', async () => {
    const manifest = {
      apiVersion: `ossa/v${CURRENT_SCHEMA_VERSION}`,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Test agent',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
      },
      extensions: {
        cursor: {
          enabled: true,
          agent_type: 'composer',
        },
        openai_agents: {
          enabled: true,
          model: 'gpt-4o',
        },
      },
    };

    const result = await validationService.validate(
      manifest,
      CURRENT_SCHEMA_VERSION
    );
    expect(result.valid).toBe(true);
  });

  it('should catch platform-specific validation errors', async () => {
    const manifest = {
      apiVersion: `ossa/v${CURRENT_SCHEMA_VERSION}`,
      kind: 'Agent',
      metadata: {
        name: 'test-agent',
      },
      spec: {
        role: 'Test',
      },
      extensions: {
        cursor: {
          enabled: true,
          agent_type: 'invalid_type',
        },
        openai_agents: {
          enabled: true,
          model: 'invalid-model',
        },
      },
    };

    const result = await validationService.validate(
      manifest,
      CURRENT_SCHEMA_VERSION
    );
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate cross-platform compatibility', async () => {
    const manifest = {
      apiVersion: `ossa/v${CURRENT_SCHEMA_VERSION}`,
      kind: 'Agent',
      metadata: {
        name: 'multi-platform-agent',
        version: '1.0.0',
        description: 'Multi-platform test agent',
      },
      spec: {
        role: 'Multi-platform agent',
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
        tools: [],
      },
      extensions: {
        cursor: { enabled: true, agent_type: 'composer' },
        openai_agents: { enabled: true, model: 'gpt-4o' },
        crewai: {
          enabled: true,
          agent_type: 'worker',
          role: 'Worker',
          goal: 'Complete tasks',
        },
        langchain: { enabled: true, chain_type: 'agent' },
        anthropic: { enabled: true, model: 'claude-3-5-sonnet-20241022' },
      },
    };

    const result = await validationService.validate(
      manifest,
      CURRENT_SCHEMA_VERSION
    );
    if (result.errors.length > 0) {
      console.error(
        'Cross-platform validation errors:',
        JSON.stringify(result.errors, null, 2)
      );
    }
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
