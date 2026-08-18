/**
 * MCPAdapter — stateless MCP 2026-07-28 export behavior.
 *
 * Covers .mcp.json generation (stateless vs legacy stateful), the
 * transport-mode validation guard, deprecation warnings, and the Agent Card
 * preferredTransport projection.
 */

import { describe, it, expect } from '@jest/globals';
import { MCPAdapter } from '../../../src/adapters/mcp/adapter.js';
import { AgentCardGenerator } from '../../../src/services/agent-card-generator.js';
import type { OssaAgent } from '../../../src/types/index.js';
import { API_VERSION } from '../../../src/version.js';

const baseManifest = (mcp: Record<string, unknown>): OssaAgent =>
  ({
    apiVersion: API_VERSION,
    kind: 'Agent',
    metadata: { name: 'knowledge-search', version: '1.0.0' },
    spec: {
      role: 'Stateless MCP search agent',
      tools: [{ name: 'search', type: 'mcp', description: 'Search the corpus' }],
    },
    protocols: { mcp: { version: '1.0.0', ...mcp } },
  }) as unknown as OssaAgent;

const statelessMcp = {
  specVersion: '2026-07-28',
  transport: 'stateless',
  endpoint: 'https://agents.example.com/mcp',
  auth: { type: 'oauth2.1', pkce: true, issuerValidation: true },
  capabilities: { serverDiscover: true },
};

const findMcpJson = (files: Array<{ path: string; content: string }>) => {
  const file = files.find((f) => f.path.endsWith('.mcp.json'));
  if (!file) throw new Error('.mcp.json not generated');
  return JSON.parse(file.content).mcpServers['knowledge-search'];
};

describe('MCPAdapter — stateless 2026-07-28 export', () => {
  const adapter = new MCPAdapter();

  it('emits a stateless HTTP .mcp.json by default', async () => {
    const result = await adapter.export(baseManifest(statelessMcp), {
      validate: true,
    });
    expect(result.success).toBe(true);
    const server = findMcpJson(result.files);
    expect(server.url).toBe('https://agents.example.com/mcp');
    expect(server.transport).toBe('http');
    expect(server.specVersion).toBe('2026-07-28');
    expect(server.headers['MCP-Protocol-Version']).toBe('2026-07-28');
    expect(server.auth?.type).toBe('oauth2.1');
    // No stdio/session artifacts in stateless mode.
    expect(server.command).toBeUndefined();
    expect(server.args).toBeUndefined();
  });

  it('emits a legacy stdio .mcp.json when the spec version is overridden to 2025-11-25', async () => {
    const result = await adapter.export(baseManifest(statelessMcp), {
      validate: true,
      platformOptions: { mcpSpecVersion: '2025-11-25' },
    });
    expect(result.success).toBe(true);
    const server = findMcpJson(result.files);
    expect(server.command).toBe('npx');
    expect(server.args.join(' ')).toContain('serve --mcp');
    expect(server.url).toBeUndefined();
  });

  it('hard-errors when transport is stateful under 2026-07-28', async () => {
    const bad = baseManifest({ specVersion: '2026-07-28', transport: 'stateful' });
    const validation = await adapter.validate(bad);
    expect(validation.valid).toBe(false);
    const messages = (validation.errors || []).map((e) => e.message).join(' ');
    expect(messages).toContain('does not support stateful transport');
  });

  it('warns about deprecated features on a 2025-11-25 manifest', async () => {
    const legacy = baseManifest({
      specVersion: '2025-11-25',
      transport: 'stateful',
      deprecated: { sampling: true, roots: false, logging: true },
    });
    const validation = await adapter.validate(legacy);
    const warnings = (validation.warnings || []).map((w) => w.message).join(' | ');
    expect(warnings).toContain("'sampling' is deprecated");
    expect(warnings).toContain("'logging' is deprecated");
    expect(warnings).not.toContain("'roots' is deprecated");
  });
});

describe('AgentCardGenerator — preferredTransport projection', () => {
  const generator = new AgentCardGenerator();

  it('sets preferredTransport http-stateless for spec 2026-07-28', () => {
    const result = generator.generate(baseManifest(statelessMcp), {
      cardProfile: 'discovery',
    });
    expect(result.success).toBe(true);
    expect((result.card as { preferredTransport?: string }).preferredTransport).toBe(
      'http-stateless'
    );
  });

  it('sets preferredTransport http for legacy spec 2025-11-25', () => {
    const result = generator.generate(
      baseManifest({ specVersion: '2025-11-25', transport: 'stateful' }),
      { cardProfile: 'discovery' }
    );
    expect((result.card as { preferredTransport?: string }).preferredTransport).toBe(
      'http'
    );
  });
});
