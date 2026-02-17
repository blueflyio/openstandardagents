/**
 * Team Generator Integration Tests
 *
 * Tests multi-agent team generation across all 8 architecture patterns
 * and validates team manifest → platform export pipeline.
 */

import { describe, it, expect } from '@jest/globals';
import {
  isMultiAgentManifest,
  resolvePattern,
  generateTeamFiles,
  generateSubagentFiles,
} from '../../src/services/multi-agent/team-generator.service.js';
import { generateAgentsMd } from '../../src/services/agents-md/agents-md-generator.service.js';
import {
  generatePerfectAgentBundle,
  generateTeamFilesForExport,
  generateAgentsMdFile,
} from '../../src/adapters/base/common-file-generator.js';
import type { OssaAgent } from '../../src/types/index.js';

// ──────────────────────────────────────────────────────────────────
// Test Fixtures
// ──────────────────────────────────────────────────────────────────

const singleAgentManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'single-agent',
    version: '1.0.0',
    description: 'A basic single agent',
    agentKind: 'assistant',
    agentArchitecture: { pattern: 'single' },
  },
  spec: {
    role: 'You are a helpful assistant.',
    llm: { provider: 'anthropic', model: 'claude-sonnet-4-5-20250514' },
  },
};

const teamLeadManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'code-review-team',
    version: '1.0.0',
    description: 'A code review team with lead-teammate pattern',
    agentKind: 'team-lead',
    agentArchitecture: {
      pattern: 'lead-teammate',
      coordination: {
        teamModel: 'lead-teammate',
        communicationPattern: 'task-list',
        taskPersistence: 'file-backed',
      },
    },
  },
  spec: {
    role: 'You lead a code review team.',
    team: {
      model: 'lead-teammate',
      lead: 'lead-reviewer',
      delegateMode: 'task-list',
      members: [
        {
          name: 'lead-reviewer',
          kind: 'team-lead',
          role: 'Senior code reviewer who delegates tasks',
          model: 'claude-sonnet-4-5-20250514',
          tools: ['read-file', 'grep'],
        },
        {
          name: 'security-reviewer',
          kind: 'specialist',
          role: 'Security vulnerability scanner',
          tools: ['sast-scan', 'dependency-check'],
        },
        {
          name: 'style-checker',
          kind: 'teammate',
          role: 'Code style and formatting checker',
          tools: ['eslint', 'prettier'],
        },
      ],
      taskList: {
        persistence: 'file-backed',
        format: 'markdown',
        dependencyTracking: true,
      },
      communication: {
        channel: 'task-list',
        consensus: 'leader-decides',
      },
      deployment: {
        backend: 'in-process',
        maxConcurrency: 3,
      },
    },
  },
};

const swarmManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'swarm-agent',
    version: '1.0.0',
    description: 'Swarm with handoff agents',
    agentArchitecture: { pattern: 'swarm' },
  },
  spec: {
    role: 'Triage agent that routes to specialists.',
    team: {
      model: 'swarm',
      lead: 'triage',
      members: [
        { name: 'triage', kind: 'team-lead', role: 'Routes incoming requests' },
        { name: 'sales', kind: 'teammate', role: 'Handles sales queries' },
        { name: 'support', kind: 'teammate', role: 'Handles support queries' },
      ],
    },
  },
};

const subagentManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'parent-agent',
    version: '1.0.0',
    description: 'Parent agent with child subagents',
  },
  spec: {
    role: 'Parent orchestrator.',
    subagents: [
      {
        name: 'research-sub',
        kind: 'specialist',
        role: 'Research and gather information',
        model: 'claude-sonnet-4-5-20250514',
        tools: ['web-search', 'read-file'],
        contextIsolation: true,
        reportTo: 'parent-agent',
        maxTokenBudget: 10000,
      },
      {
        name: 'writer-sub',
        kind: 'worker',
        role: 'Write and format content',
        contextIsolation: true,
        reportTo: 'parent-agent',
      },
    ],
  },
};

const pipelineManifest: OssaAgent = {
  apiVersion: 'ossa/v0.4',
  kind: 'Agent',
  metadata: {
    name: 'pipeline-agent',
    version: '1.0.0',
    agentArchitecture: { pattern: 'pipeline' },
  },
  spec: {
    role: 'Sequential processing pipeline.',
    team: {
      model: 'peer-to-peer',
      members: [
        { name: 'parser', kind: 'teammate', role: 'Parse input' },
        { name: 'processor', kind: 'teammate', role: 'Process data' },
        { name: 'formatter', kind: 'teammate', role: 'Format output' },
      ],
    },
  },
};

// ──────────────────────────────────────────────────────────────────
// Detection Tests
// ──────────────────────────────────────────────────────────────────

describe('Multi-Agent Detection', () => {
  it('should detect single agent as not multi-agent', () => {
    expect(isMultiAgentManifest(singleAgentManifest)).toBe(false);
  });

  it('should detect team manifest as multi-agent', () => {
    expect(isMultiAgentManifest(teamLeadManifest)).toBe(true);
  });

  it('should detect swarm manifest as multi-agent', () => {
    expect(isMultiAgentManifest(swarmManifest)).toBe(true);
  });

  it('should detect subagent manifest as multi-agent', () => {
    expect(isMultiAgentManifest(subagentManifest)).toBe(true);
  });

  it('should detect pipeline manifest as multi-agent', () => {
    expect(isMultiAgentManifest(pipelineManifest)).toBe(true);
  });
});

// ──────────────────────────────────────────────────────────────────
// Pattern Resolution Tests
// ──────────────────────────────────────────────────────────────────

describe('Pattern Resolution', () => {
  it('should resolve single pattern', () => {
    expect(resolvePattern(singleAgentManifest)).toBe('single');
  });

  it('should resolve lead-teammate pattern', () => {
    expect(resolvePattern(teamLeadManifest)).toBe('lead-teammate');
  });

  it('should resolve swarm pattern', () => {
    expect(resolvePattern(swarmManifest)).toBe('swarm');
  });

  it('should resolve pipeline pattern', () => {
    expect(resolvePattern(pipelineManifest)).toBe('pipeline');
  });

  it('should infer hierarchical from subagents', () => {
    expect(resolvePattern(subagentManifest)).toBe('hierarchical');
  });
});

// ──────────────────────────────────────────────────────────────────
// Team Generation Tests (All Platforms)
// ──────────────────────────────────────────────────────────────────

describe('Team File Generation', () => {
  describe('CrewAI Platform', () => {
    it('should generate CrewAI team files', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'crewai',
      });
      expect(files.length).toBeGreaterThanOrEqual(3);
      const paths = files.map((f) => f.path);
      expect(paths).toContain('crew/agents.py');
      expect(paths).toContain('crew/tasks.py');
      expect(paths).toContain('crew/crew.py');
    });

    it('should include all members in CrewAI agents', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'crewai',
      });
      const agentsFile = files.find((f) => f.path === 'crew/agents.py');
      expect(agentsFile).toBeDefined();
      expect(agentsFile!.content).toContain('lead_reviewer');
      expect(agentsFile!.content).toContain('security_reviewer');
      expect(agentsFile!.content).toContain('style_checker');
    });

    it('should set hierarchical process for lead-teammate', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'crewai',
      });
      const crewFile = files.find((f) => f.path === 'crew/crew.py');
      expect(crewFile).toBeDefined();
      expect(crewFile!.content).toContain('Process.hierarchical');
    });
  });

  describe('OpenAI Agents SDK Platform', () => {
    it('should generate OpenAI agents team files', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'openai-agents',
      });
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files[0].path).toBe('src/team.ts');
      expect(files[0].language).toBe('typescript');
    });

    it('should generate handoff imports for swarm pattern', () => {
      const files = generateTeamFiles(swarmManifest, {
        platform: 'openai-agents',
      });
      const teamFile = files.find((f) => f.path === 'src/team.ts');
      expect(teamFile).toBeDefined();
      expect(teamFile!.content).toContain('handoff');
    });
  });

  describe('Claude Code Platform', () => {
    it('should generate Claude Code team files', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'claude-code',
      });
      expect(files.length).toBeGreaterThanOrEqual(1);
      const paths = files.map((f) => f.path);
      expect(paths).toContain('CLAUDE.md');
    });

    it('should include task list for file-backed persistence', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'claude-code',
      });
      const paths = files.map((f) => f.path);
      expect(paths).toContain('tasks.md');
    });
  });

  describe('Generic Platform', () => {
    it('should generate generic TypeScript team config', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'generic',
      });
      expect(files.length).toBeGreaterThanOrEqual(1);
      expect(files[0].path).toBe('src/team-config.ts');
      expect(files[0].language).toBe('typescript');
    });

    it('should include all member properties', () => {
      const files = generateTeamFiles(teamLeadManifest, {
        platform: 'generic',
      });
      const configFile = files[0];
      expect(configFile.content).toContain("model: 'lead-teammate'");
      expect(configFile.content).toContain("lead: 'lead-reviewer'");
      expect(configFile.content).toContain('lead-reviewer');
      expect(configFile.content).toContain('security-reviewer');
    });
  });

  it('should return empty array for single agent', () => {
    const files = generateTeamFiles(singleAgentManifest, {
      platform: 'generic',
    });
    expect(files).toHaveLength(0);
  });

  it('should include documentation when requested', () => {
    const files = generateTeamFiles(teamLeadManifest, {
      platform: 'generic',
      includeDocumentation: true,
    });
    const docFile = files.find((f) => f.path === 'docs/TEAM-ARCHITECTURE.md');
    expect(docFile).toBeDefined();
    expect(docFile!.content).toContain('lead-teammate');
  });
});

// ──────────────────────────────────────────────────────────────────
// Subagent Generation Tests
// ──────────────────────────────────────────────────────────────────

describe('Subagent File Generation', () => {
  it('should generate subagent files', () => {
    const files = generateSubagentFiles(subagentManifest, {
      platform: 'generic',
    });
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files[0].path).toBe('src/subagent-config.ts');
  });

  it('should include all subagent definitions', () => {
    const files = generateSubagentFiles(subagentManifest, {
      platform: 'generic',
    });
    const content = files[0].content;
    expect(content).toContain('research-sub');
    expect(content).toContain('writer-sub');
    expect(content).toContain('parent-agent');
  });

  it('should generate CrewAI subagent files', () => {
    const files = generateSubagentFiles(subagentManifest, {
      platform: 'crewai',
    });
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files[0].path).toBe('crew/subagents.py');
    expect(files[0].language).toBe('python');
  });

  it('should return empty for manifest without subagents', () => {
    const files = generateSubagentFiles(singleAgentManifest, {
      platform: 'generic',
    });
    expect(files).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────
// AGENTS.md Generation Tests
// ──────────────────────────────────────────────────────────────────

describe('AGENTS.md Generation', () => {
  it('should generate basic AGENTS.md for single agent', () => {
    const content = generateAgentsMd(singleAgentManifest);
    expect(content).toContain('# single-agent');
    expect(content).toContain('assistant');
    expect(content).toContain('single');
  });

  it('should include team structure for team manifest', () => {
    const content = generateAgentsMd(teamLeadManifest);
    expect(content).toContain('## Team Structure');
    expect(content).toContain('lead-reviewer');
    expect(content).toContain('security-reviewer');
    expect(content).toContain('style-checker');
  });

  it('should include subagent section', () => {
    const content = generateAgentsMd(subagentManifest);
    expect(content).toContain('## Subagents');
    expect(content).toContain('research-sub');
    expect(content).toContain('writer-sub');
    expect(content).toContain('Hierarchy');
  });

  it('should include coordination section for teams', () => {
    const content = generateAgentsMd(teamLeadManifest);
    expect(content).toContain('## Coordination');
    expect(content).toContain('task-list');
    expect(content).toContain('leader-decides');
  });
});

// ──────────────────────────────────────────────────────────────────
// Perfect Agent Bundle Tests
// ──────────────────────────────────────────────────────────────────

describe('Perfect Agent Bundle', () => {
  it('should generate all files when perfectAgent is true', () => {
    const files = generatePerfectAgentBundle(teamLeadManifest, {
      perfectAgent: true,
    });
    const paths = files.map((f) => f.path);
    expect(paths).toContain('AGENTS.md');
    expect(paths).toContain('evals/clear-evals.ts');
    expect(paths).toContain('governance/policy.json');
    expect(paths).toContain('observability/otel-config.json');
  });

  it('should include team files for multi-agent manifest', () => {
    const files = generatePerfectAgentBundle(teamLeadManifest, {
      perfectAgent: true,
    });
    // Should contain team config and documentation
    const teamFile = files.find(
      (f) => f.path === 'src/team-config.ts' || f.path === 'docs/TEAM-ARCHITECTURE.md'
    );
    expect(teamFile).toBeDefined();
  });

  it('should generate only AGENTS.md when only that flag is set', () => {
    const files = generatePerfectAgentBundle(singleAgentManifest, {
      includeAgentsMd: true,
    });
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('AGENTS.md');
  });

  it('should generate only evals when only that flag is set', () => {
    const files = generatePerfectAgentBundle(singleAgentManifest, {
      includeEvals: true,
    });
    expect(files).toHaveLength(1);
    expect(files[0].path).toBe('evals/clear-evals.ts');
  });

  it('should return empty for no flags set', () => {
    const files = generatePerfectAgentBundle(singleAgentManifest, {});
    expect(files).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────
// Convenience Function Tests
// ──────────────────────────────────────────────────────────────────

describe('Convenience Functions', () => {
  it('generateTeamFilesForExport returns empty for single agent', () => {
    const files = generateTeamFilesForExport(singleAgentManifest);
    expect(files).toHaveLength(0);
  });

  it('generateTeamFilesForExport returns files for team manifest', () => {
    const files = generateTeamFilesForExport(teamLeadManifest, 'generic');
    expect(files.length).toBeGreaterThan(0);
  });

  it('generateAgentsMdFile returns ExportFile format', () => {
    const file = generateAgentsMdFile(teamLeadManifest);
    expect(file.path).toBe('AGENTS.md');
    expect(file.type).toBe('documentation');
    expect(file.content).toContain('# code-review-team');
  });
});
