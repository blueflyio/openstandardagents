/**
 * Team Generator Service
 *
 * Generates platform-specific multi-agent code from OSSA spec.team / spec.subagents.
 * Supports all 8 architecture patterns: single, swarm, pipeline, graph,
 * hierarchical, reactive, cognitive, lead-teammate.
 *
 * SOLID: Single Responsibility - Multi-agent code generation only
 * DRY: Centralized team generation reusable across all adapters
 */

import type {
  OssaAgent,
  TeamMember,
  SubagentDefinition,
  ArchitecturePattern,
} from '../../types/index.js';
import { formatMemberRow } from '../agents-md/agents-md-generator.service.js';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

export interface GeneratedTeamFile {
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation';
  language?: string;
}

export type TeamTargetPlatform =
  | 'crewai'
  | 'langchain'
  | 'openai-agents'
  | 'claude-code'
  | 'mcp'
  | 'npm'
  | 'generic'
  | 'custom';

export interface TeamGeneratorOptions {
  platform: TeamTargetPlatform;
  outputDir?: string;
  includeTests?: boolean;
  includeDocumentation?: boolean;
}

/**
 * Wrapper class for tests and callers that expect a service instance.
 * Delegates to generateTeamFiles / generateSubagentFiles.
 */
export class TeamGeneratorService {
  generate(
    manifest: OssaAgent,
    platform: TeamTargetPlatform = 'generic'
  ): GeneratedTeamFile[] {
    const effectivePlatform: TeamTargetPlatform =
      platform === 'custom' ? 'generic' : platform;
    const teamFiles = generateTeamFiles(manifest, {
      platform: effectivePlatform,
      includeDocumentation: true,
    });
    const subagentFiles = generateSubagentFiles(manifest, {
      platform: effectivePlatform,
      includeDocumentation: true,
    });
    return [...teamFiles, ...subagentFiles];
  }
}

// ──────────────────────────────────────────────────────────────────
// Service
// ──────────────────────────────────────────────────────────────────

/**
 * Detects if a manifest defines a multi-agent system
 */
export function isMultiAgentManifest(manifest: OssaAgent): boolean {
  return !!(
    manifest.spec?.team ||
    (manifest.spec?.subagents && manifest.spec.subagents.length > 0) ||
    manifest.metadata?.agentArchitecture?.pattern === 'swarm' ||
    manifest.metadata?.agentArchitecture?.pattern === 'hierarchical' ||
    manifest.metadata?.agentArchitecture?.pattern === 'lead-teammate' ||
    manifest.metadata?.agentArchitecture?.pattern === 'pipeline'
  );
}

/**
 * Resolves the effective architecture pattern from manifest
 */
export function resolvePattern(manifest: OssaAgent): ArchitecturePattern {
  // Explicit pattern in architecture
  if (manifest.metadata?.agentArchitecture?.pattern) {
    return manifest.metadata.agentArchitecture.pattern;
  }
  // Infer from team model
  if (manifest.spec?.team?.model === 'lead-teammate') return 'lead-teammate';
  if (manifest.spec?.team?.model === 'swarm') return 'swarm';
  if (manifest.spec?.team?.model === 'hierarchical') return 'hierarchical';
  if (manifest.spec?.team?.model === 'peer-to-peer') return 'pipeline';
  // Infer from subagents
  if (manifest.spec?.subagents && manifest.spec.subagents.length > 0) {
    return 'hierarchical';
  }
  return 'single';
}

/**
 * Generate multi-agent team files for a given platform
 */
export function generateTeamFiles(
  manifest: OssaAgent,
  options: TeamGeneratorOptions
): GeneratedTeamFile[] {
  const pattern = resolvePattern(manifest);
  const files: GeneratedTeamFile[] = [];

  switch (options.platform) {
    case 'crewai':
      files.push(...generateCrewAITeam(manifest, pattern));
      break;
    case 'openai-agents':
      files.push(...generateOpenAIAgentsTeam(manifest, pattern));
      break;
    case 'claude-code':
      files.push(...generateClaudeCodeTeam(manifest, pattern));
      break;
    case 'mcp':
    case 'npm':
    case 'langchain':
    case 'generic':
    default:
      files.push(...generateGenericTeam(manifest, pattern));
      break;
  }

  if (options.includeDocumentation) {
    files.push(generateTeamDocs(manifest, pattern));
  }

  return files;
}

/**
 * Generate subagent delegation files
 */
export function generateSubagentFiles(
  manifest: OssaAgent,
  options: TeamGeneratorOptions
): GeneratedTeamFile[] {
  const subagents = manifest.spec?.subagents;
  if (!subagents || subagents.length === 0) return [];

  const files: GeneratedTeamFile[] = [];

  switch (options.platform) {
    case 'crewai':
      files.push(...generateCrewAISubagents(manifest, subagents));
      break;
    case 'openai-agents':
      files.push(...generateOpenAISubagents(manifest, subagents));
      break;
    case 'claude-code':
      files.push(...generateClaudeCodeSubagents(manifest, subagents));
      break;
    default:
      files.push(...generateGenericSubagents(manifest, subagents));
      break;
  }

  return files;
}

// ──────────────────────────────────────────────────────────────────
// CrewAI Generation
// ──────────────────────────────────────────────────────────────────

function generateCrewAITeam(
  manifest: OssaAgent,
  pattern: ArchitecturePattern
): GeneratedTeamFile[] {
  const team = manifest.spec?.team;
  if (!team) return [];

  const agentName = manifest.metadata?.name || 'agent';
  const files: GeneratedTeamFile[] = [];

  // Generate crew.py with team members as agents
  const agentDefs = team.members
    .map((m) => generateCrewAIMemberDef(m))
    .join('\n\n');

  const taskDefs = team.members
    .filter((m) => m.kind !== 'team-lead')
    .map((m) => generateCrewAITaskDef(m))
    .join('\n\n');

  const processType =
    pattern === 'lead-teammate' || pattern === 'hierarchical'
      ? 'Process.hierarchical'
      : pattern === 'pipeline'
        ? 'Process.sequential'
        : 'Process.sequential';

  const managerAgent = team.lead
    ? `manager_agent=${sanitizePythonName(team.lead)}`
    : '';

  files.push({
    path: 'crew/agents.py',
    content: `"""${agentName} - Team Agent Definitions
Generated from OSSA manifest (spec.team)
Pattern: ${pattern}
"""

from crewai import Agent

${agentDefs}
`,
    type: 'code',
    language: 'python',
  });

  files.push({
    path: 'crew/tasks.py',
    content: `"""${agentName} - Team Task Definitions
Generated from OSSA manifest (spec.team)
"""

from crewai import Task

${taskDefs}
`,
    type: 'code',
    language: 'python',
  });

  files.push({
    path: 'crew/crew.py',
    content: `"""${agentName} - Crew Orchestration
Generated from OSSA manifest (spec.team)
Pattern: ${pattern} | Model: ${team.model}
"""

from crewai import Crew, Process
from .agents import ${team.members.map((m) => sanitizePythonName(m.name)).join(', ')}
from .tasks import ${team.members
      .filter((m) => m.kind !== 'team-lead')
      .map((m) => sanitizePythonName(m.name) + '_task')
      .join(', ')}


crew = Crew(
    agents=[${team.members.map((m) => sanitizePythonName(m.name)).join(', ')}],
    tasks=[${team.members
      .filter((m) => m.kind !== 'team-lead')
      .map((m) => sanitizePythonName(m.name) + '_task')
      .join(', ')}],
    process=${processType},
    ${managerAgent}
    verbose=True,
    memory=True,
)


if __name__ == "__main__":
    result = crew.kickoff()
    print(result)
`,
    type: 'code',
    language: 'python',
  });

  return files;
}

function generateCrewAIMemberDef(member: TeamMember): string {
  const name = sanitizePythonName(member.name);
  const tools = member.tools
    ? `tools=[${member.tools.map((t) => `"${t}"`).join(', ')}]`
    : '';
  return `${name} = Agent(
    role="${member.role}",
    goal="Execute tasks as ${member.kind || 'teammate'} in the team",
    backstory="${member.role}",
    ${tools ? tools + ',' : ''}
    verbose=True,
    allow_delegation=${member.kind === 'team-lead' ? 'True' : 'False'},
)`;
}

function generateCrewAITaskDef(member: TeamMember): string {
  const name = sanitizePythonName(member.name);
  return `${name}_task = Task(
    description="Execute ${member.name} responsibilities: ${member.role}",
    expected_output="Completed ${member.name} task output",
    agent=${name},
)`;
}

function generateCrewAISubagents(
  manifest: OssaAgent,
  subagents: SubagentDefinition[]
): GeneratedTeamFile[] {
  const agentDefs = subagents
    .map(
      (s) => `${sanitizePythonName(s.name)} = Agent(
    role="${s.role}",
    goal="Execute delegated tasks as ${s.kind || 'subagent'}",
    backstory="${s.role}",
    verbose=True,
    allow_delegation=False,
)`
    )
    .join('\n\n');

  return [
    {
      path: 'crew/subagents.py',
      content: `"""Subagent Definitions
Generated from OSSA manifest (spec.subagents)
"""

from crewai import Agent

${agentDefs}
`,
      type: 'code',
      language: 'python',
    },
  ];
}

// ──────────────────────────────────────────────────────────────────
// OpenAI Agents SDK Generation
// ──────────────────────────────────────────────────────────────────

function generateOpenAIAgentsTeam(
  manifest: OssaAgent,
  pattern: ArchitecturePattern
): GeneratedTeamFile[] {
  const team = manifest.spec?.team;
  if (!team) return [];

  const agentName = manifest.metadata?.name || 'agent';

  const memberDefs = team.members
    .map(
      (m) => `const ${camelCase(m.name)} = new Agent({
  name: '${m.name}',
  instructions: ${JSON.stringify(m.role)},${m.model ? `\n  model: '${m.model}',` : ''}
});`
    )
    .join('\n\n');

  // For swarm pattern, generate handoffs
  const handoffs =
    pattern === 'swarm'
      ? team.members
          .filter((m) => m.kind !== 'team-lead')
          .map(
            (m) =>
              `${camelCase(team.lead || team.members[0].name)}.handoffs.push(handoff(${camelCase(m.name)}));`
          )
          .join('\n')
      : '';

  const content = `/**
 * ${agentName} - Multi-Agent Team (OpenAI Agents SDK)
 * Generated from OSSA manifest (spec.team)
 * Pattern: ${pattern} | Model: ${team.model}
 */

import { Agent, run } from '@openai/agents';
${pattern === 'swarm' ? "import { handoff } from '@openai/agents';\n" : ''}

${memberDefs}

${handoffs}

export async function runTeam(input: string): Promise<string> {
  const lead = ${camelCase(team.lead || team.members[0].name)};
  const result = await run(lead, input);
  return result.finalOutput;
}
`;

  return [
    {
      path: 'src/team.ts',
      content,
      type: 'code',
      language: 'typescript',
    },
  ];
}

function generateOpenAISubagents(
  manifest: OssaAgent,
  subagents: SubagentDefinition[]
): GeneratedTeamFile[] {
  const defs = subagents
    .map(
      (s) => `export const ${camelCase(s.name)} = new Agent({
  name: '${s.name}',
  instructions: ${JSON.stringify(s.role)},${s.model ? `\n  model: '${s.model}',` : ''}
});`
    )
    .join('\n\n');

  return [
    {
      path: 'src/subagents.ts',
      content: `/**
 * Subagent Definitions (OpenAI Agents SDK)
 * Generated from OSSA manifest (spec.subagents)
 */

import { Agent } from '@openai/agents';

${defs}
`,
      type: 'code',
      language: 'typescript',
    },
  ];
}

// ──────────────────────────────────────────────────────────────────
// Claude Code Generation
// ──────────────────────────────────────────────────────────────────

function generateClaudeCodeTeam(
  manifest: OssaAgent,
  pattern: ArchitecturePattern
): GeneratedTeamFile[] {
  const team = manifest.spec?.team;
  if (!team) return [];

  const agentName = manifest.metadata?.name || 'agent';

  // Generate CLAUDE.md with team instructions
  const membersList = team.members
    .map(
      (m) =>
        `- **${m.name}** (${m.kind || 'teammate'}): ${m.role}${m.tools ? ` [tools: ${m.tools.join(', ')}]` : ''}`
    )
    .join('\n');

  const claudeMd = `# ${agentName} - Multi-Agent Team

## Team Model: ${team.model}
## Pattern: ${pattern}
${team.lead ? `## Lead: ${team.lead}` : ''}

## Team Members

${membersList}

## Communication

- Channel: ${team.communication?.channel || 'task-list'}
- Consensus: ${team.communication?.consensus || 'leader-decides'}

## Task Coordination

- Delegate Mode: ${team.delegateMode || 'task-list'}
- Persistence: ${team.taskList?.persistence || 'file-backed'}
- Dependency Tracking: ${team.taskList?.dependencyTracking !== false ? 'enabled' : 'disabled'}

## Deployment

- Backend: ${team.deployment?.backend || 'in-process'}
- Max Concurrency: ${team.deployment?.maxConcurrency || 5}
`;

  const files: GeneratedTeamFile[] = [
    {
      path: 'CLAUDE.md',
      content: claudeMd,
      type: 'documentation',
      language: 'markdown',
    },
  ];

  // Generate task-list.md if file-backed
  if (
    team.taskList?.persistence === 'file-backed' ||
    !team.taskList?.persistence
  ) {
    files.push({
      path: team.taskList?.path || 'tasks.md',
      content: `# Task List

## Pending

<!-- Tasks assigned by ${team.lead || 'lead'} -->

## In Progress

## Completed
`,
      type: 'config',
      language: 'markdown',
    });
  }

  return files;
}

function generateClaudeCodeSubagents(
  manifest: OssaAgent,
  subagents: SubagentDefinition[]
): GeneratedTeamFile[] {
  const defs = subagents
    .map(
      (s) => `### ${s.name}

- **Kind**: ${s.kind || 'subagent'}
- **Role**: ${s.role}
${s.model ? `- **Model**: ${s.model}` : ''}
${s.tools ? `- **Tools**: ${s.tools.join(', ')}` : ''}
- **Context Isolation**: ${s.contextIsolation !== false ? 'yes' : 'no'}
${s.reportTo ? `- **Reports To**: ${s.reportTo}` : ''}
${s.maxTokenBudget ? `- **Token Budget**: ${s.maxTokenBudget}` : ''}`
    )
    .join('\n\n');

  return [
    {
      path: 'SUBAGENTS.md',
      content: `# Subagent Definitions

${defs}
`,
      type: 'documentation',
      language: 'markdown',
    },
  ];
}

// ──────────────────────────────────────────────────────────────────
// Generic / TypeScript Generation
// ──────────────────────────────────────────────────────────────────

function generateGenericTeam(
  manifest: OssaAgent,
  pattern: ArchitecturePattern
): GeneratedTeamFile[] {
  const team = manifest.spec?.team;
  if (!team) return [];

  const agentName = manifest.metadata?.name || 'agent';

  const memberInterfaces = team.members
    .map(
      (m) => `  {
    name: '${m.name}',
    kind: '${m.kind || 'teammate'}',
    role: ${JSON.stringify(m.role)},${m.model ? `\n    model: '${m.model}',` : ''}${m.tools ? `\n    tools: [${m.tools.map((t) => `'${t}'`).join(', ')}],` : ''}
    contextIsolation: ${m.contextIsolation !== false},${m.maxTokenBudget ? `\n    maxTokenBudget: ${m.maxTokenBudget},` : ''}
  }`
    )
    .join(',\n');

  const content = `/**
 * ${agentName} - Multi-Agent Team Configuration
 * Generated from OSSA manifest (spec.team)
 * Pattern: ${pattern} | Model: ${team.model}
 */

export interface TeamMember {
  name: string;
  kind: string;
  role: string;
  model?: string;
  tools?: string[];
  contextIsolation: boolean;
  maxTokenBudget?: number;
}

export interface TeamConfig {
  model: string;
  lead?: string;
  delegateMode: string;
  members: TeamMember[];
  communication: {
    channel: string;
    consensus: string;
  };
  deployment: {
    backend: string;
    maxConcurrency: number;
  };
}

export const teamConfig: TeamConfig = {
  model: '${team.model}',
  ${team.lead ? `lead: '${team.lead}',` : ''}
  delegateMode: '${team.delegateMode || 'task-list'}',
  members: [
${memberInterfaces}
  ],
  communication: {
    channel: '${team.communication?.channel || 'task-list'}',
    consensus: '${team.communication?.consensus || 'leader-decides'}',
  },
  deployment: {
    backend: '${team.deployment?.backend || 'in-process'}',
    maxConcurrency: ${team.deployment?.maxConcurrency || 5},
  },
};
`;

  return [
    {
      path: 'src/team-config.ts',
      content,
      type: 'code',
      language: 'typescript',
    },
  ];
}

function generateGenericSubagents(
  manifest: OssaAgent,
  subagents: SubagentDefinition[]
): GeneratedTeamFile[] {
  const defs = subagents
    .map(
      (s) => `  {
    name: '${s.name}',
    kind: '${s.kind || 'subagent'}',
    role: ${JSON.stringify(s.role)},${s.model ? `\n    model: '${s.model}',` : ''}${s.tools ? `\n    tools: [${s.tools.map((t) => `'${t}'`).join(', ')}],` : ''}
    contextIsolation: ${s.contextIsolation !== false},${s.reportTo ? `\n    reportTo: '${s.reportTo}',` : ''}${s.maxTokenBudget ? `\n    maxTokenBudget: ${s.maxTokenBudget},` : ''}
  }`
    )
    .join(',\n');

  return [
    {
      path: 'src/subagent-config.ts',
      content: `/**
 * Subagent Definitions
 * Generated from OSSA manifest (spec.subagents)
 */

export interface SubagentConfig {
  name: string;
  kind: string;
  role: string;
  model?: string;
  tools?: string[];
  contextIsolation: boolean;
  reportTo?: string;
  maxTokenBudget?: number;
}

export const subagents: SubagentConfig[] = [
${defs}
];
`,
      type: 'code',
      language: 'typescript',
    },
  ];
}

// ──────────────────────────────────────────────────────────────────
// Team Documentation
// ──────────────────────────────────────────────────────────────────

function generateTeamDocs(
  manifest: OssaAgent,
  pattern: ArchitecturePattern
): GeneratedTeamFile {
  const team = manifest.spec?.team;
  const subagents = manifest.spec?.subagents;
  const agentName = manifest.metadata?.name || 'agent';

  const sections: string[] = [`# ${agentName} - Team Architecture\n`];

  sections.push(`## Architecture Pattern: ${pattern}\n`);

  if (team) {
    sections.push(`## Team Model: ${team.model}\n`);
    if (team.lead) {
      sections.push(`**Lead Agent**: ${team.lead}\n`);
    }

    sections.push('## Members\n');
    sections.push(
      '| Name | Kind | Role | Model | Tools |',
      '|------|------|------|-------|-------|'
    );
    for (const m of team.members) {
      sections.push(formatMemberRow(m));
    }
    sections.push('');

    sections.push('## Communication\n');
    sections.push(
      `- **Channel**: ${team.communication?.channel || 'task-list'}`
    );
    sections.push(
      `- **Consensus**: ${team.communication?.consensus || 'leader-decides'}`
    );
    sections.push(`- **Delegate Mode**: ${team.delegateMode || 'task-list'}\n`);

    sections.push('## Deployment\n');
    sections.push(`- **Backend**: ${team.deployment?.backend || 'in-process'}`);
    sections.push(
      `- **Max Concurrency**: ${team.deployment?.maxConcurrency || 5}\n`
    );
  }

  if (subagents && subagents.length > 0) {
    sections.push('## Subagents\n');
    sections.push(
      '| Name | Kind | Role | Reports To |',
      '|------|------|------|------------|'
    );
    for (const s of subagents) {
      const role =
        s.role.length > 50 ? s.role.substring(0, 47) + '...' : s.role;
      sections.push(
        `| ${s.name} | ${s.kind || 'subagent'} | ${role} | ${s.reportTo || '-'} |`
      );
    }
    sections.push('');
  }

  return {
    path: 'docs/TEAM-ARCHITECTURE.md',
    content: sections.join('\n'),
    type: 'documentation',
    language: 'markdown',
  };
}

// ──────────────────────────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────────────────────────

function sanitizePythonName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^[0-9]/, '_$&');
}

function camelCase(name: string): string {
  return name.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase());
}
