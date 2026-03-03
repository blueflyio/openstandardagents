/**
 * Perfect Agent Export Pipeline — Integration Tests
 *
 * Tests the full export pipeline for OSSA "Perfect Agent" artifacts:
 *   - TeamGeneratorService (multi-agent orchestration files)
 *   - AgentsMdGeneratorService (AGENTS.md generation)
 *   - generateSkillContent (SKILL.md generation)
 *   - generatePerfectAgentFiles (orchestrator that wires everything together)
 */

import { describe, it, expect } from '@jest/globals';
import { TeamGeneratorService } from '../../src/services/multi-agent/team-generator.service.js';
import { generateAgentsMd } from '../../src/services/agents-md/agents-md-generator.service.js';
import { generateSkillContent } from '../../src/adapters/base/perfect-agent-utils.js';
import { generatePerfectAgentFiles } from '../../src/adapters/base/common-file-generator.js';
import type { OssaAgent } from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Shared mock manifests
// ---------------------------------------------------------------------------

/**
 * Full multi-agent manifest with lead-teammate pattern, team section,
 * tools, LLM config, and communication/deployment settings.
 */
// Schema supports team/subagents/a2a/lead-teammate but TS types lag — cast through unknown
const multiAgentManifest = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'code-review-team',
    version: '2.1.0',
    description:
      'An AI team that reviews pull requests and enforces code standards.',
    agentKind: 'orchestrator',
    agentType: 'a2a',
    agentArchitecture: {
      pattern: 'lead-teammate',
      capabilities: ['handoff', 'tools', 'context'],
      coordination: {
        handoffStrategy: 'automatic',
        leaderAgent: 'lead-reviewer',
        maxDepth: 3,
      },
    },
    labels: {
      capability: 'code-review,static-analysis',
    },
    tags: ['review', 'quality'],
  },
  spec: {
    role: 'Coordinate a team of reviewers to analyze code quality, security, and style.',
    tools: [
      {
        type: 'function',
        name: 'run_linter',
        description: 'Runs ESLint and returns violations.',
      },
      {
        type: 'function',
        name: 'check_security',
        description: 'Scans for known CVEs and insecure patterns.',
      },
    ],
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      temperature: 0.2,
      maxTokens: 8192,
    },
    team: {
      lead: 'lead-reviewer',
      members: [
        {
          name: 'lead-reviewer',
          kind: 'team-lead',
          role: 'Orchestrates reviews and makes final approval decisions.',
          model: { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
          tools: [{ name: 'run_linter' }, { name: 'check_security' }],
          contextIsolation: false,
        },
        {
          name: 'style-checker',
          kind: 'teammate',
          role: 'Checks code formatting and naming conventions.',
          tools: [{ name: 'run_linter' }],
          contextIsolation: true,
        },
        {
          name: 'security-auditor',
          kind: 'teammate',
          role: 'Checks for security vulnerabilities and secrets.',
          tools: [{ name: 'check_security' }],
          contextIsolation: true,
        },
      ],
      taskList: {
        coordination: 'shared-list',
        claimPolicy: 'self-claim',
        persistence: 'file-backed',
        dependencyTracking: true,
        waveExecution: true,
        lockingStrategy: 'file-lock',
      },
      communication: {
        pattern: 'mailbox',
      },
      deployment: {
        backend: 'in-process',
        scaling: 'fixed',
      },
    },
  },
} as unknown as OssaAgent;

/**
 * Minimal single-agent manifest with no team section.
 */
const singleAgentManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'simple-assistant',
    version: '1.0.0',
    description: 'A simple assistant with no team.',
    agentKind: 'worker' as const,
    agentType: 'claude' as const,
    agentArchitecture: {
      pattern: 'single' as const,
    },
  },
  spec: {
    role: 'You are a helpful assistant.',
    tools: [
      {
        type: 'function',
        name: 'search',
        description: 'Search the knowledge base.',
      },
    ],
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
    },
  },
};

/**
 * Manifest with no tools at all.
 */
const noToolsManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'no-tools-agent',
    version: '0.1.0',
    description: 'Agent without any tools configured.',
  },
  spec: {
    role: 'Answer questions from memory only.',
  },
};

// ---------------------------------------------------------------------------
// TeamGeneratorService
// ---------------------------------------------------------------------------

describe('TeamGeneratorService', () => {
  const service = new TeamGeneratorService();

  it('generates non-empty files for multi-agent manifest', () => {
    const files = service.generate(multiAgentManifest, 'custom');
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    files.forEach((f) => {
      expect(f.path).toBeDefined();
      expect(f.content).toBeDefined();
      expect(['code', 'config', 'documentation']).toContain(f.type);
    });
  });

  it('generates CLAUDE.md or team docs for lead-teammate pattern', () => {
    const files = service.generate(multiAgentManifest, 'custom');
    const doc =
      files.find((f) => f.path === 'CLAUDE.md') ||
      files.find((f) => f.path.includes('TEAM-ARCHITECTURE'));
    expect(doc).toBeDefined();
    expect(doc!.content).toMatch(/code-review-team|lead|team|pattern/i);
  });

  it('returns empty or minimal files for single-agent manifest', () => {
    const files = service.generate(singleAgentManifest, 'custom');
    expect(Array.isArray(files)).toBe(true);
    if (files.length > 0) {
      expect(files.every((f) => f.path && f.content)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// AgentsMdGeneratorService
// ---------------------------------------------------------------------------

describe('AgentsMdGeneratorService', () => {
  function generate(manifest: OssaAgent) {
    const content = generateAgentsMd(manifest);
    return [
      {
        path: 'AGENTS.md',
        content,
        type: 'documentation' as const,
        language: 'markdown' as const,
      },
    ];
  }

  it('generates AGENTS.md file', () => {
    const files = generate(multiAgentManifest);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('AGENTS.md');
    expect(files[0].type).toBe('documentation');
    expect(files[0].language).toBe('markdown');
    expect(files[0].content.length).toBeGreaterThan(0);
  });

  it('includes agent identity section', () => {
    const files = generate(multiAgentManifest);
    const content = files[0].content;

    // Header
    expect(content).toContain('# code-review-team');
    // Description
    expect(content).toContain(
      'An AI team that reviews pull requests and enforces code standards.'
    );
    expect(content).toContain('ossa/v0.4');
    expect(content).toContain('orchestrator');
    expect(content).toContain('lead-teammate');
  });

  it('includes tools section', () => {
    const files = generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toContain('## Tools');
    expect(content).toContain('run_linter');
    expect(content).toContain('Runs ESLint');
    expect(content).toContain('check_security');
    expect(content).toContain('CVE');
  });

  it('includes team section for multi-agent', () => {
    const files = generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toMatch(/## (Agent )?Team|Team Structure/);
    expect(content).toContain('lead-reviewer');
    expect(content).toContain('style-checker');
    expect(content).toContain('security-auditor');
  });

  it('includes LLM or model reference', () => {
    const files = generate(multiAgentManifest);
    const content = files[0].content;
    expect(content).toMatch(/anthropic|claude|model|Model/i);
  });

  it('omits team section for single-agent manifest', () => {
    const files = generate(singleAgentManifest);
    const content = files[0].content;

    expect(content).not.toContain('## Agent Team');
  });

  it('includes footer with version info', () => {
    const files = generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toContain('Generated from OSSA');
    expect(content).toMatch(/code-review-team|v2\.1\.0|ossa\/v0\.4/);
  });
});

// ---------------------------------------------------------------------------
// generateSkillContent
// ---------------------------------------------------------------------------

describe('generateSkillContent', () => {
  it('generates SKILL.md from manifest', () => {
    const content = generateSkillContent(multiAgentManifest);
    expect(content).toBeDefined();
    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: code-review-team');
    expect(content).toContain('An AI team that reviews pull requests');
  });

  it('includes tool descriptions', () => {
    const content = generateSkillContent(multiAgentManifest);
    expect(content).toMatch(/#+ Tools/);
    expect(content).toContain('run_linter');
    expect(content).toContain('Runs ESLint');
    expect(content).toContain('check_security');
  });

  it('includes agent name and description', () => {
    const content = generateSkillContent(multiAgentManifest);
    expect(content).toContain('code-review-team');
    expect(content).toContain('2.1.0');
  });

  it('generates content for manifest without tools', () => {
    const content = generateSkillContent(noToolsManifest);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
  });

  it('generates content for single-agent worker', () => {
    const content = generateSkillContent(singleAgentManifest);
    expect(content).toContain('simple-assistant');
    expect(content).toContain('helpful assistant');
  });
});

// ---------------------------------------------------------------------------
// generatePerfectAgentFiles (orchestrator)
// ---------------------------------------------------------------------------

describe('generatePerfectAgentFiles', () => {
  it('generates all perfect agent files for multi-agent manifest', async () => {
    const files = await generatePerfectAgentFiles(multiAgentManifest);

    const paths = files.map((f) => f.path);
    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('skills/SKILL.md');

    const teamOrDocFiles = paths.filter(
      (p) =>
        p.startsWith('team/') ||
        p.includes('TEAM-ARCHITECTURE') ||
        p === 'CLAUDE.md'
    );
    expect(teamOrDocFiles.length).toBeGreaterThan(0);
  });

  it('generates files without team section for single-agent', async () => {
    const files = await generatePerfectAgentFiles(singleAgentManifest);
    const paths = files.map((f) => f.path);

    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('skills/SKILL.md');

    // Single agent should NOT have team files
    const teamFiles = paths.filter((p) => p.startsWith('team/'));
    expect(teamFiles).toHaveLength(0);
  });

  it('respects options to disable sections', async () => {
    const files = await generatePerfectAgentFiles(multiAgentManifest, {
      includeAgentsMd: false,
      includeSkill: false,
      includeTeam: false,
      includeEvals: false,
      includeGovernance: false,
      includeObservability: false,
      includeAgentCard: false,
    });

    const paths = files.map((f) => f.path);
    expect(paths).not.toContain('AGENTS.md');
    expect(paths).not.toContain('skills/SKILL.md');
    expect(paths.filter((p) => p.startsWith('team/')).length).toBe(0);
  });

  it('includes AGENTS.md only when enabled', async () => {
    const files = await generatePerfectAgentFiles(multiAgentManifest, {
      includeAgentsMd: true,
      includeSkill: false,
      includeTeam: false,
      includeEvals: false,
      includeGovernance: false,
      includeObservability: false,
      includeAgentCard: false,
    });

    const paths = files.map((f) => f.path);
    expect(paths).toContain('AGENTS.md');
    expect(paths).not.toContain('skills/SKILL.md');
  });

  it('includes SKILL.md only when enabled', async () => {
    const files = await generatePerfectAgentFiles(multiAgentManifest, {
      includeAgentsMd: false,
      includeSkill: true,
      includeTeam: false,
      includeEvals: false,
      includeGovernance: false,
      includeObservability: false,
      includeAgentCard: false,
    });

    const paths = files.map((f) => f.path);
    expect(paths).not.toContain('AGENTS.md');
    expect(paths).toContain('skills/SKILL.md');
  });

  it('uses custom platform for team generation', async () => {
    const files = await generatePerfectAgentFiles(multiAgentManifest, {
      includeAgentsMd: false,
      includeSkill: false,
      includeTeam: true,
      includeEvals: false,
      includeGovernance: false,
      includeObservability: false,
      includeAgentCard: false,
      platform: 'langchain',
    });

    const teamOrGenericFiles = files.filter(
      (f) =>
        f.path.startsWith('team/') ||
        f.path.includes('TEAM-ARCHITECTURE') ||
        f.path === 'CLAUDE.md' ||
        f.path.startsWith('src/')
    );
    expect(teamOrGenericFiles.length).toBeGreaterThan(0);
  });
});
