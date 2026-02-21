/**
 * AgentsMd Generator Service - Unit tests for generateAgentsMd
 */

import { describe, it, expect } from '@jest/globals';
import { generateAgentsMd } from '../../../../src/services/agents-md/agents-md-generator.service.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

const minimalManifest: OssaAgent = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { name: 'test-agent', version: '1.0.0', description: 'A test agent' },
  spec: {
    role: 'You are a helpful assistant.',
    llm: { provider: 'openai', model: 'gpt-4' },
    tools: [
      { name: 'search', description: 'Search the web', type: 'function' },
    ],
  },
};

describe('generateAgentsMd', () => {
  it('includes header with name and description', () => {
    const out = generateAgentsMd(minimalManifest);
    expect(out).toContain('# test-agent');
    expect(out).toContain('A test agent');
  });

  it('includes Role section from spec.role', () => {
    const out = generateAgentsMd(minimalManifest);
    expect(out).toContain('## Role');
    expect(out).toContain('You are a helpful assistant.');
  });

  it('includes Overview section with LLM', () => {
    const out = generateAgentsMd(minimalManifest);
    expect(out).toContain('## Overview');
    expect(out).toContain('openai');
    expect(out).toContain('gpt-4');
  });

  it('includes Tools table when includeToolsTable not false', () => {
    const out = generateAgentsMd(minimalManifest);
    expect(out).toContain('## Tools');
    expect(out).toContain('search');
    expect(out).toContain('Search the web');
  });

  it('omits tools section when includeToolsTable false', () => {
    const out = generateAgentsMd(minimalManifest, {
      includeToolsTable: false,
    });
    expect(out).not.toContain('## Tools');
  });

  it('includes capabilities when manifest has agentArchitecture.capabilities', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      metadata: {
        ...minimalManifest.metadata!,
        agentArchitecture: { capabilities: ['handoff', 'tool-use'] },
      },
    };
    const out = generateAgentsMd(manifest);
    expect(out).toContain('## Capabilities');
    expect(out).toContain('handoff');
    expect(out).toContain('tool-use');
  });

  it('includes subagents section when spec.subagents present', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      spec: {
        ...minimalManifest.spec!,
        subagents: [
          {
            name: 'child',
            kind: 'worker',
            role: 'Helper',
            reportsTo: 'test-agent',
            tokenBudget: 1000,
          },
        ],
      },
    };
    const out = generateAgentsMd(manifest);
    expect(out).toContain('## Subagents');
    expect(out).toContain('child');
    expect(out).toContain('Hierarchy');
  });

  it('omits subagent section when includeSubagentSection false', () => {
    const manifest: OssaAgent = {
      ...minimalManifest,
      spec: {
        ...minimalManifest.spec!,
        subagents: [{ name: 'c', kind: 'worker', role: 'R', reportsTo: 'test-agent', tokenBudget: 100 }],
      },
    };
    const out = generateAgentsMd(manifest, { includeSubagentSection: false });
    expect(out).not.toContain('## Subagents');
  });

  it('uses Agent as default name when metadata.name missing', () => {
    const manifest = {
      ...minimalManifest,
      metadata: { version: '1.0.0' },
    } as OssaAgent;
    const out = generateAgentsMd(manifest);
    expect(out).toContain('# Agent');
  });
});
