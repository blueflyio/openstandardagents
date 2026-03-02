/**
 * Team Generator Service - Unit tests for isMultiAgentManifest, resolvePattern, generateTeamFiles, generateSubagentFiles
 */

import { describe, it, expect } from '@jest/globals';
import {
  isMultiAgentManifest,
  resolvePattern,
  generateTeamFiles,
  generateSubagentFiles,
} from '../../../../src/services/multi-agent/team-generator.service.js';
import type { OssaAgent } from '../../../../src/types/index.js';
import { API_VERSION } from '../../../../src/version.js';

const singleAgent: OssaAgent = {
  apiVersion: API_VERSION,
  kind: 'Agent',
  metadata: { name: 'solo', version: '1.0.0' },
  spec: { role: 'Solo agent', llm: { provider: 'openai', model: 'gpt-4' } },
};

describe('isMultiAgentManifest', () => {
  it('returns false for single agent without team or subagents', () => {
    expect(isMultiAgentManifest(singleAgent)).toBe(false);
  });

  it('returns true when spec.team is present', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        team: {
          model: 'lead-teammate',
          members: [
            { name: 'lead', kind: 'team-lead', role: 'Lead', model: 'gpt-4' },
          ],
        },
      },
    };
    expect(isMultiAgentManifest(manifest)).toBe(true);
  });

  it('returns true when spec.subagents has length', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        subagents: [
          {
            name: 'c',
            kind: 'worker',
            role: 'R',
            reportsTo: 'solo',
            tokenBudget: 100,
          },
        ],
      },
    };
    expect(isMultiAgentManifest(manifest)).toBe(true);
  });

  it('returns true when agentArchitecture.pattern is swarm', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      metadata: {
        ...singleAgent.metadata!,
        agentArchitecture: { pattern: 'swarm' },
      },
    };
    expect(isMultiAgentManifest(manifest)).toBe(true);
  });
});

describe('resolvePattern', () => {
  it('returns single for manifest without team or pattern', () => {
    expect(resolvePattern(singleAgent)).toBe('single');
  });

  it('returns pattern from metadata.agentArchitecture.pattern', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      metadata: {
        ...singleAgent.metadata!,
        agentArchitecture: { pattern: 'pipeline' },
      },
    };
    expect(resolvePattern(manifest)).toBe('pipeline');
  });

  it('returns lead-teammate when spec.team.model is lead-teammate', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        team: { model: 'lead-teammate', members: [] },
      },
    };
    expect(resolvePattern(manifest)).toBe('lead-teammate');
  });

  it('returns hierarchical when spec.subagents present', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        subagents: [
          {
            name: 'c',
            kind: 'worker',
            role: 'R',
            reportsTo: 'solo',
            tokenBudget: 100,
          },
        ],
      },
    };
    expect(resolvePattern(manifest)).toBe('hierarchical');
  });
});

describe('generateTeamFiles', () => {
  it('returns array (generic platform)', () => {
    const files = generateTeamFiles(singleAgent, { platform: 'generic' });
    expect(Array.isArray(files)).toBe(true);
  });

  it('includes documentation when includeDocumentation true', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        team: {
          model: 'lead-teammate',
          members: [{ name: 'a', kind: 'worker', role: 'R', model: 'gpt-4' }],
        },
      },
    };
    const files = generateTeamFiles(manifest, {
      platform: 'generic',
      includeDocumentation: true,
    });
    expect(files.length).toBeGreaterThan(0);
    const doc = files.find((f) => f.type === 'documentation');
    expect(doc).toBeDefined();
  });

  it('crewai platform produces files when team present', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        team: {
          model: 'sequential',
          members: [
            { name: 'agent1', kind: 'worker', role: 'Worker', model: 'gpt-4' },
          ],
        },
      },
    };
    const files = generateTeamFiles(manifest, { platform: 'crewai' });
    expect(files.length).toBeGreaterThan(0);
    expect(
      files.some((f) => f.path.includes('crew') || f.path.includes('.py'))
    ).toBe(true);
  });
});

describe('generateSubagentFiles', () => {
  it('returns empty array when no subagents', () => {
    const files = generateSubagentFiles(singleAgent, { platform: 'generic' });
    expect(files).toEqual([]);
  });

  it('returns files when subagents present', () => {
    const manifest: OssaAgent = {
      ...singleAgent,
      spec: {
        ...singleAgent.spec!,
        subagents: [
          {
            name: 'child1',
            kind: 'worker',
            role: 'Helper',
            reportsTo: 'solo',
            tokenBudget: 500,
          },
        ],
      },
    };
    const files = generateSubagentFiles(manifest, { platform: 'generic' });
    expect(files.length).toBeGreaterThan(0);
  });
});
