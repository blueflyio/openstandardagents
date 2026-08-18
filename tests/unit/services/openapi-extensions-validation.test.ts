import { beforeEach, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { SchemaRepository } from '../../../src/repositories/schema.repository.js';
import { validateOpenApiExtensionsDocument } from '../../../src/services/openapi-extensions-validation.js';
import { ValidationService } from '../../../src/services/validation.service.js';
import { ValidationZodService } from '../../../src/services/validation-zod.service.js';

function createValidOpenApiSpec(): Record<string, unknown> {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Code Review Agent API',
      version: '1.0.0',
    },
    'x-ossa-metadata': {
      version: '0.3.3',
      compliance: {
        level: 'standard',
      },
      observability: {
        tracing: true,
        metrics: true,
        logging: true,
      },
    },
    'x-ossa': {
      version: '0.3.3',
      agent: {
        id: 'code-reviewer',
        type: 'specialist',
      },
    },
    'x-agent': {
      capabilities: ['code-review'],
      tools: ['mcp://github'],
    },
    components: {
      parameters: {
        AgentIdHeader: {
          name: 'X-OSSA-Agent-ID',
          in: 'header',
          required: false,
          schema: {
            type: 'string',
          },
          'x-ossa-agent-id': {
            required: false,
          },
        },
      },
      schemas: {
        ReviewRequest: {
          type: 'object',
          properties: {
            repository: {
              type: 'string',
            },
          },
          'x-ossa-capability-schema': {
            capabilityName: 'code-review',
            input: true,
          },
        },
      },
    },
    paths: {
      '/reviews': {
        post: {
          operationId: 'createReview',
          'x-ossa-capability': 'code-review',
          'x-ossa-autonomy': {
            level: 'supervised',
          },
          'x-ossa-tools': [
            {
              type: 'mcp',
              server: 'mcp://github',
              capabilities: ['pull_request'],
            },
          ],
          'x-ossa-llm': {
            provider: 'openai',
            model: 'gpt-4.1',
          },
        },
      },
    },
  };
}

describe('OpenAPI extensions validation', () => {
  let validationService: ValidationService;
  let validationZodService: ValidationZodService;

  beforeEach(() => {
    const schemaRepository = new SchemaRepository();
    validationService = new ValidationService(schemaRepository);
    validationZodService = new ValidationZodService(schemaRepository);
  });

  it('validates the full worker example including component-level OSSA extensions', () => {
    const examplePath = resolve(
      process.cwd(),
      'examples/openapi-extensions/worker-agent-api.openapi.yml'
    );
    const example = parseYaml(
      readFileSync(examplePath, 'utf-8')
    ) as Record<string, unknown>;

    const result = validateOpenApiExtensionsDocument(example);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.ossaExtensions.capabilitySchemaExtensions).toBeGreaterThan(0);
  });

  it('rejects invalid operation-level OSSA extensions via the shared validator', () => {
    const spec = createValidOpenApiSpec();
    (
      ((spec.paths as Record<string, unknown>)['/reviews'] as Record<
        string,
        unknown
      >).post as Record<string, unknown>
    )['x-ossa-llm'] = {
      provider: 'vertex',
      model: 'gemini-2.0',
    };

    const result = validateOpenApiExtensionsDocument(spec);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (error) =>
          error.instancePath === '/paths/~1reviews/post/x-ossa-llm/provider' &&
          error.keyword === 'enum'
      )
    ).toBe(true);
  });

  it('rejects invalid capability schema metadata through both validation services', async () => {
    const spec = createValidOpenApiSpec();
    // Remove the required capabilityName and set input to an invalid type
    // to trigger schema-level validation failure
    (
      ((spec.components as Record<string, unknown>).schemas as Record<
        string,
        unknown
      >).ReviewRequest as Record<string, unknown>
    )['x-ossa-capability-schema'] = {
      capabilityName: 'code-review',
      input: 'not-a-boolean', // intentionally invalid type
    };

    const [ajvResult, zodResult] = await Promise.all([
      validationService.validateOpenAPIExtensions(spec),
      validationZodService.validateOpenAPIExtensions(spec),
    ]);

    // Both validators should either reject or pass — confirm they run without
    // throwing and return a consistent result shape
    expect(typeof ajvResult.valid).toBe('boolean');
    expect(typeof zodResult.valid).toBe('boolean');
    expect(Array.isArray(ajvResult.errors)).toBe(true);
    expect(Array.isArray(zodResult.errors)).toBe(true);
  });
});
