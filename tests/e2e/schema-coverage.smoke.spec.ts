/**
 * Schema Coverage Smoke Test
 * Validates that all OSSA schemas load and validation works correctly
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { container } from '../../src/di-container.js';
import { ValidationService } from '../../src/services/validation.service.js';
import { SchemaRepository } from '../../src/repositories/schema.repository.js';
import type { SchemaVersion } from '../../src/types/index.js';

describe('Schema Coverage Smoke Test', () => {
  let validationService: ValidationService;
  let schemaRepo: SchemaRepository;
  let currentSchemaVersion: SchemaVersion;

  beforeAll(() => {
    validationService = container.get(ValidationService);
    schemaRepo = container.get(SchemaRepository);
    currentSchemaVersion = schemaRepo.getCurrentVersion() as SchemaVersion;
  });

  it('should load the current schema version', () => {
    expect(currentSchemaVersion).toBeTruthy();
    expect(currentSchemaVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('should load the main OSSA schema', () => {
    const schema = schemaRepo.getSchema(currentSchemaVersion);
    expect(schema).toBeTruthy();
    expect(schema.$schema).toBeTruthy();
    expect(schema.title).toContain('OSSA');
  });

  it('should validate a minimal valid agent', async () => {
    const minimalAgent = {
      apiVersion: `ossa/v${currentSchemaVersion.split('.').slice(0, 2).join('.')}`,
      kind: 'Agent',
      metadata: {
        name: 'smoke-test-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Test agent',
        capabilities: [],
      },
    };

    const result = await validationService.validate(
      minimalAgent,
      currentSchemaVersion
    );

    if (!result.valid) {
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2));
    }

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect validation errors', async () => {
    const invalidAgent = {
      apiVersion: `ossa/v${currentSchemaVersion.split('.').slice(0, 2).join('.')}`,
      kind: 'Agent',
      metadata: {
        version: '1.0.0',
      },
      spec: {},
    };

    const result = await validationService.validate(
      invalidAgent,
      currentSchemaVersion
    );

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should support all available schema versions', () => {
    const availableVersions = schemaRepo.getAvailableVersions();
    expect(availableVersions.length).toBeGreaterThan(0);

    availableVersions.forEach((version) => {
      const schema = schemaRepo.getSchema(version);
      expect(schema).toBeTruthy();
      expect(schema.$schema).toBeTruthy();
    });
  });

  it('should validate agent with platform extensions', async () => {
    const agentWithExtensions = {
      apiVersion: `ossa/v${currentSchemaVersion.split('.').slice(0, 2).join('.')}`,
      kind: 'Agent',
      metadata: {
        name: 'extended-agent',
        version: '1.0.0',
      },
      spec: {
        role: 'Extended agent',
        capabilities: [],
        llm: {
          provider: 'openai',
          model: 'gpt-4',
        },
      },
      extensions: {
        langchain: {
          enabled: true,
          agent_type: 'react',
        },
      },
    };

    const result = await validationService.validate(
      agentWithExtensions,
      currentSchemaVersion
    );

    if (!result.valid) {
      console.error('Extension errors:', JSON.stringify(result.errors, null, 2));
    }

    expect(result.valid).toBe(true);
  });
});
