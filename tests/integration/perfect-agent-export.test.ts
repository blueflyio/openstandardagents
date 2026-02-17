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
import { AgentsMdGeneratorService } from '../../src/services/agents-md/agents-md-generator.service.js';
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
const multiAgentManifest = ({
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'code-review-team',
    version: '2.1.0',
    description: 'An AI team that reviews pull requests and enforces code standards.',
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
}) as unknown as OssaAgent;

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

  it('generates team config files for lead-teammate pattern', () => {
    const files = service.generate(multiAgentManifest, 'custom');

    expect(files.length).toBeGreaterThanOrEqual(6); // config + task + comms + pattern + 3 members + readme

    const configFile = files.find((f) => f.path === 'team/config.json');
    expect(configFile).toBeDefined();
    expect(configFile!.type).toBe('config');
    expect(configFile!.language).toBe('json');

    const parsed = JSON.parse(configFile!.content);
    expect(parsed.name).toBe('code-review-team');
    expect(parsed.version).toBe('2.1.0');
    expect(parsed.pattern).toBe('lead-teammate');
    expect(parsed.lead).toBe('lead-reviewer');
    expect(parsed.members).toHaveLength(3);
    expect(parsed.coordination.taskModel).toBe('shared-list');
    expect(parsed.coordination.communication).toBe('mailbox');
    expect(parsed.coordination.taskPersistence).toBe('file-backed');
    expect(parsed.coordination.dependencyTracking).toBe(true);
    expect(parsed.coordination.waveExecution).toBe(true);
    expect(parsed.deployment.backend).toBe('in-process');
  });

  it('generates task list with file-backed persistence', () => {
    const files = service.generate(multiAgentManifest, 'custom');
    const taskFile = files.find((f) => f.path === 'team/tasks/config.yaml');
    expect(taskFile).toBeDefined();
    expect(taskFile!.type).toBe('config');
    expect(taskFile!.language).toBe('yaml');

    const content = taskFile!.content;
    expect(content).toContain('persistence: file-backed');
    expect(content).toContain('dependencyTracking: true');
    expect(content).toContain('waveExecution: true');
    expect(content).toContain('lockingStrategy: file-lock');
    expect(content).toContain('maxConcurrentTasks: 3'); // 3 members
  });

  it('generates communication config with mailbox', () => {
    const files = service.generate(multiAgentManifest, 'custom');
    const commsFile = files.find((f) => f.path === 'team/communication.yaml');
    expect(commsFile).toBeDefined();

    const content = commsFile!.content;
    expect(content).toContain('pattern: mailbox');
    // mailbox should use async delivery mode
    expect(content).toContain('mode: async');
    // mailbox protocols
    expect(content).toContain('async-message');
    expect(content).toContain('idle-notification');
  });

  it('generates member definitions for each teammate', () => {
    const files = service.generate(multiAgentManifest, 'custom');

    const memberFiles = files.filter((f) => f.path.startsWith('team/members/'));
    expect(memberFiles).toHaveLength(3);

    const leadFile = memberFiles.find(
      (f) => f.path === 'team/members/lead-reviewer.yaml'
    );
    expect(leadFile).toBeDefined();
    expect(leadFile!.content).toContain('kind: team-lead');
    // team-lead should have spawn + shutdown + assignTasks permissions
    expect(leadFile!.content).toContain('spawn: true');
    expect(leadFile!.content).toContain('assignTasks: true');

    const teammateFile = memberFiles.find(
      (f) => f.path === 'team/members/style-checker.yaml'
    );
    expect(teammateFile).toBeDefined();
    expect(teammateFile!.content).toContain('kind: teammate');
    // teammate should NOT have spawn permission
    expect(teammateFile!.content).toContain('spawn: false');
    expect(teammateFile!.content).toContain('claimTasks: true');
    expect(teammateFile!.content).toContain('contextIsolation: true');
  });

  it('generates team README with correct coordination info', () => {
    const files = service.generate(multiAgentManifest, 'custom');
    const readme = files.find((f) => f.path === 'team/README.md');
    expect(readme).toBeDefined();
    expect(readme!.type).toBe('documentation');

    const content = readme!.content;
    expect(content).toContain('code-review-team');
    expect(content).toContain('**Pattern**: lead-teammate');
    expect(content).toContain('**Members**: 3');
    expect(content).toContain('**Lead**: lead-reviewer');
    expect(content).toContain('**Task Model**: shared-list');
    expect(content).toContain('**Communication**: mailbox');
    expect(content).toContain('**Task Persistence**: file-backed');
    expect(content).toContain('**Dependency Tracking**: enabled');
    expect(content).toContain('**Wave Execution**: enabled');
    // Members table
    expect(content).toContain('lead-reviewer');
    expect(content).toContain('style-checker');
    expect(content).toContain('security-auditor');
    // Architecture description
    expect(content).toContain('Lead-teammate coordination');
  });

  it('returns empty array for single-agent manifest', () => {
    const files = service.generate(singleAgentManifest, 'custom');
    expect(files).toEqual([]);
  });

  it('generates lead-teammate.yaml for lead-teammate pattern', () => {
    const files = service.generate(multiAgentManifest, 'custom');
    const patternFile = files.find(
      (f) => f.path === 'team/lead-teammate.yaml'
    );
    expect(patternFile).toBeDefined();
    expect(patternFile!.type).toBe('config');

    const content = patternFile!.content;
    expect(content).toContain('lead: lead-reviewer');
    expect(content).toContain('delegateMode: true');
    // Should list teammates (filtered to kind: teammate or worker)
    expect(content).toContain('style-checker');
    expect(content).toContain('security-auditor');
    // Task list settings
    expect(content).toContain('persistence: file-backed');
    expect(content).toContain('claimPolicy: self-claim');
  });
});

// ---------------------------------------------------------------------------
// AgentsMdGeneratorService
// ---------------------------------------------------------------------------

describe('AgentsMdGeneratorService', () => {
  const service = new AgentsMdGeneratorService();

  it('generates AGENTS.md file', () => {
    const files = service.generate(multiAgentManifest);
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('AGENTS.md');
    expect(files[0].type).toBe('documentation');
    expect(files[0].language).toBe('markdown');
    expect(files[0].content.length).toBeGreaterThan(0);
  });

  it('includes agent identity section', () => {
    const files = service.generate(multiAgentManifest);
    const content = files[0].content;

    // Header
    expect(content).toContain('# code-review-team');
    // Description
    expect(content).toContain(
      'An AI team that reviews pull requests and enforces code standards.'
    );
    // Identity table
    expect(content).toContain('## Identity');
    expect(content).toContain('ossa/v0.4');
    expect(content).toContain('orchestrator');
    expect(content).toContain('lead-teammate');
  });

  it('includes tools section', () => {
    const files = service.generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toContain('## Tools');
    expect(content).toContain('`run_linter`');
    expect(content).toContain('Runs ESLint and returns violations');
    expect(content).toContain('`check_security`');
    expect(content).toContain('Scans for known CVEs');
  });

  it('includes team section for multi-agent', () => {
    const files = service.generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toContain('## Agent Team');
    expect(content).toContain('lead-reviewer');
    // Members table
    expect(content).toContain('style-checker');
    expect(content).toContain('security-auditor');
    // Task coordination
    expect(content).toContain('Task Coordination');
    expect(content).toContain('shared-list');
    // Communication
    expect(content).toContain('Communication');
    expect(content).toContain('mailbox');
  });

  it('includes LLM configuration section', () => {
    const files = service.generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toContain('## Model Configuration');
    expect(content).toContain('anthropic');
    expect(content).toContain('claude-sonnet-4-20250514');
    expect(content).toContain('0.2');
    expect(content).toContain('8192');
  });

  it('omits team section for single-agent manifest', () => {
    const files = service.generate(singleAgentManifest);
    const content = files[0].content;

    expect(content).not.toContain('## Agent Team');
  });

  it('includes footer with version info', () => {
    const files = service.generate(multiAgentManifest);
    const content = files[0].content;

    expect(content).toContain('Generated from OSSA');
    expect(content).toContain('openstandardagents.org');
    expect(content).toContain('code-review-team v2.1.0');
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

    // Frontmatter
    expect(content).toMatch(/^---\n/);
    expect(content).toContain('name: code-review-team');
    expect(content).toContain('trigger_keywords:');

    // Body
    expect(content).toContain('# code-review-team');
    expect(content).toContain('An AI team that reviews pull requests');
    expect(content).toContain('## Manifest');
    expect(content).toContain('**Version**: 2.1.0');
    expect(content).toContain('**OSSA Spec**: ossa/v0.4');
    expect(content).toContain('**Architecture**: lead-teammate');
  });

  it('includes tool descriptions', () => {
    const content = generateSkillContent(multiAgentManifest);

    expect(content).toContain('## Tools');
    expect(content).toContain('**run_linter**');
    expect(content).toContain('Runs ESLint and returns violations');
    expect(content).toContain('**check_security**');
    expect(content).toContain('Scans for known CVEs');
  });

  it('includes trigger keywords from taxonomy', () => {
    const content = generateSkillContent(multiAgentManifest);

    // Should include taxonomy-derived keywords
    expect(content).toContain('ossa');
    expect(content).toContain('code-review-team');
    expect(content).toContain('a2a'); // agentType
    expect(content).toContain('orchestrator'); // agentKind
    expect(content).toContain('lead-teammate'); // architecture pattern
  });

  it('includes "When to Use" section', () => {
    const content = generateSkillContent(multiAgentManifest);
    expect(content).toContain('## When to Use');
    expect(content).toContain('Coordinate multiple agents');
    expect(content).toContain('2 available tool(s)');
  });

  it('generates content for manifest without tools', () => {
    const content = generateSkillContent(noToolsManifest);
    expect(content).toBeDefined();
    expect(content.length).toBeGreaterThan(0);
    // Should NOT contain a Tools section
    expect(content).not.toContain('## Tools');
  });

  it('generates content for single-agent worker', () => {
    const content = generateSkillContent(singleAgentManifest);
    expect(content).toContain('# simple-assistant');
    expect(content).toContain('Execute specific, focused tasks autonomously');
    expect(content).toContain('1 available tool(s)');
  });
});

// ---------------------------------------------------------------------------
// generatePerfectAgentFiles (orchestrator)
// ---------------------------------------------------------------------------

describe('generatePerfectAgentFiles', () => {
  it('generates all perfect agent files for multi-agent manifest', async () => {
    const files = await generatePerfectAgentFiles(multiAgentManifest);

    // Should include at minimum: AGENTS.md, skills/SKILL.md, and team files
    const paths = files.map((f) => f.path);

    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('skills/SKILL.md');

    // Team files should be present for multi-agent
    const teamFiles = paths.filter((p) => p.startsWith('team/'));
    expect(teamFiles.length).toBeGreaterThan(0);
    expect(teamFiles).toContain('team/config.json');
    expect(teamFiles).toContain('team/lead-teammate.yaml');
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

    // Team files should still be generated regardless of platform
    const teamFiles = files.filter((f) => f.path.startsWith('team/'));
    expect(teamFiles.length).toBeGreaterThan(0);
  });
});
