/**
 * OpenAPI Adapter - Unit tests for toOpenAPI
 */

import { describe, it, expect } from '@jest/globals';
import { OpenAPIAdapter } from '../../../src/adapters/openapi-adapter.js';
import type { OssaAgent } from '../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

const minimalManifest: OssaAgent = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { name: 'test-agent', version: '1.0.0', description: 'Test' },
  spec: {
    role: 'You are helpful.',
    llm: { provider: 'openai', model: 'gpt-4' },
    tools: [
      {
        name: 'search',
        description: 'Search the web',
        type: 'function',
        input_schema: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    ],
  },
};

describe('OpenAPIAdapter.toOpenAPI', () => {
  it('returns OpenAPI 3.x spec with info from manifest', () => {
    const spec = OpenAPIAdapter.toOpenAPI(minimalManifest);
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe('test-agent');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.info.description).toBe('Test');
  });

  it('includes paths for tools as endpoints', () => {
    const spec = OpenAPIAdapter.toOpenAPI(minimalManifest);
    expect(spec.paths).toBeDefined();
    const pathKeys = Object.keys(spec.paths);
    expect(pathKeys.length).toBeGreaterThan(0);
  });

  it('handles manifest with no spec', () => {
    const manifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: { name: 'minimal' },
    } as OssaAgent;
    const spec = OpenAPIAdapter.toOpenAPI(manifest);
    expect(spec.info.title).toBe('minimal');
  });

  it('handles empty metadata', () => {
    const manifest = {
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: {},
      spec: { role: '' },
    } as OssaAgent;
    const spec = OpenAPIAdapter.toOpenAPI(manifest);
    expect(spec.info).toBeDefined();
    expect(spec.openapi).toMatch(/^3\./);
  });
});
