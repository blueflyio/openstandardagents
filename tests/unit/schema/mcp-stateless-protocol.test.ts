/**
 * MCP Stateless Protocol (2026-07-28) Schema Validation Tests
 *
 * Covers the protocols.mcp extensions added for the finalized MCP 2026-07-28
 * wire spec: specVersion/transport enums, the auth block, and the allOf
 * conditional rules (stateful+2026-07-28 rejected; oauth2.1 requires pkce).
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import Ajv, { type ValidateFunction } from 'ajv';
import * as fs from 'fs';
import * as path from 'path';
import type { OssaAgent } from '../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

describe('protocols.mcp — stateless 2026-07-28 schema', () => {
  let validate: ValidateFunction;

  beforeAll(() => {
    const schemaPath = path.resolve(
      __dirname,
      '../../../spec/v0.5/agent.schema.json'
    );
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    const ajv = new Ajv({ strict: false, allErrors: true });
    validate = ajv.compile(schema);
  });

  const withMcp = (mcp: Record<string, unknown>): OssaAgent =>
    ({
      apiVersion: API_VERSION,
      kind: 'Agent',
      metadata: { name: 'test-agent' },
      spec: { role: 'Test role' },
      protocols: { mcp: { version: '1.0.0', ...mcp } },
    }) as unknown as OssaAgent;

  it('accepts stateless 2026-07-28 with oauth2.1 + pkce + issuerValidation', () => {
    const ok = validate(
      withMcp({
        specVersion: '2026-07-28',
        transport: 'stateless',
        endpoint: 'https://agents.example.com/mcp',
        auth: { type: 'oauth2.1', pkce: true, issuerValidation: true },
        capabilities: { serverDiscover: true, tasks: false },
      })
    );
    expect(ok).toBe(true);
  });

  it('rejects transport "stateful" under specVersion 2026-07-28', () => {
    const ok = validate(
      withMcp({ specVersion: '2026-07-28', transport: 'stateful' })
    );
    expect(ok).toBe(false);
  });

  it('accepts transport "stateful" under legacy specVersion 2025-11-25', () => {
    const ok = validate(
      withMcp({ specVersion: '2025-11-25', transport: 'stateful' })
    );
    expect(ok).toBe(true);
  });

  it('rejects oauth2.1 auth when pkce is false', () => {
    const ok = validate(
      withMcp({
        specVersion: '2026-07-28',
        transport: 'stateless',
        auth: { type: 'oauth2.1', pkce: false },
      })
    );
    expect(ok).toBe(false);
  });

  it('rejects oauth2.1 auth when pkce is omitted', () => {
    const ok = validate(
      withMcp({
        specVersion: '2026-07-28',
        transport: 'stateless',
        auth: { type: 'oauth2.1' },
      })
    );
    expect(ok).toBe(false);
  });

  it('accepts api-key auth without pkce', () => {
    const ok = validate(
      withMcp({
        specVersion: '2026-07-28',
        transport: 'stateless',
        auth: { type: 'api-key' },
      })
    );
    expect(ok).toBe(true);
  });

  it('accepts deprecated feature flags (deprecation is a CLI warning, not a schema error)', () => {
    const ok = validate(
      withMcp({
        specVersion: '2026-07-28',
        transport: 'stateless',
        deprecated: { sampling: true, roots: true, logging: true },
      })
    );
    expect(ok).toBe(true);
  });

  it('preserves the legacy MCP shape (version + role + servers)', () => {
    const ok = validate(
      withMcp({
        role: 'server',
        servers: [{ name: 's', transport: 'stdio' }],
      })
    );
    expect(ok).toBe(true);
  });

  it('rejects unknown properties on the mcp block (additionalProperties: false)', () => {
    const ok = validate(withMcp({ bogusField: true }));
    expect(ok).toBe(false);
  });
});
