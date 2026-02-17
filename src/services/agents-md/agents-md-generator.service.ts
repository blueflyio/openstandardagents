/**
 * AGENTS.md Generator Service (Team-Aware)
 *
 * Generates AGENTS.md from OSSA manifest with team topology awareness.
 * - Single agent: standard AGENTS.md with role, tools, capabilities
 * - Team: includes team structure table, member roles, communication patterns
 * - Subagents: includes parent-child hierarchy diagram
 *
 * Extends the existing AgentsMdService without duplicating its logic.
 *
 * SOLID: Single Responsibility - Team-aware AGENTS.md generation
 * DRY: Reuses AgentsMdService for base sections
 */

import type {
  OssaAgent,
  TeamMember,
  SubagentDefinition,
} from '../../types/index.js';
import {
  isMultiAgentManifest,
  resolvePattern,
} from '../multi-agent/team-generator.service.js';

// ──────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────

export interface AgentsMdGeneratorOptions {
  includeTeamSection?: boolean;
  includeSubagentSection?: boolean;
  includeToolsTable?: boolean;
  includeCapabilities?: boolean;
  includeCoordination?: boolean;
}

// ──────────────────────────────────────────────────────────────────
// Main Generator
// ──────────────────────────────────────────────────────────────────

/**
 * Generate a complete AGENTS.md from an OSSA manifest.
 * Automatically detects team/subagent topology and includes relevant sections.
 */
export function generateAgentsMd(
  manifest: OssaAgent,
  options?: AgentsMdGeneratorOptions
): string {
  const sections: string[] = [];
  const name = manifest.metadata?.name || 'Agent';
  const description = manifest.metadata?.description || '';
  const role = manifest.spec?.role || '';
  const isTeam = isMultiAgentManifest(manifest);
  const pattern = resolvePattern(manifest);

  // Header
  sections.push(`# ${name}\n`);
  if (description) {
    sections.push(`> ${description}\n`);
  }

  // Agent overview
  sections.push(generateOverviewSection(manifest));

  // Role / System Prompt
  if (role) {
    sections.push(`## Role\n\n${role}\n`);
  }

  // Tools
  if (options?.includeToolsTable !== false) {
    const toolsSection = generateToolsSection(manifest);
    if (toolsSection) sections.push(toolsSection);
  }

  // Capabilities
  if (options?.includeCapabilities !== false) {
    const capsSection = generateCapabilitiesSection(manifest);
    if (capsSection) sections.push(capsSection);
  }

  // Team section (if multi-agent)
  if (isTeam && options?.includeTeamSection !== false) {
    const teamSection = generateTeamSection(manifest);
    if (teamSection) sections.push(teamSection);
  }

  // Subagents section
  if (
    manifest.spec?.subagents &&
    manifest.spec.subagents.length > 0 &&
    options?.includeSubagentSection !== false
  ) {
    sections.push(generateSubagentSection(manifest));
  }

  // Coordination section
  if (isTeam && options?.includeCoordination !== false) {
    const coordSection = generateCoordinationSection(manifest);
    if (coordSection) sections.push(coordSection);
  }

  // Constraints
  const constraintsSection = generateConstraintsSection(manifest);
  if (constraintsSection) sections.push(constraintsSection);

  // Footer
  sections.push(generateFooter(manifest, pattern));

  return sections.join('\n');
}

// ──────────────────────────────────────────────────────────────────
// Section Generators
// ──────────────────────────────────────────────────────────────────

function generateOverviewSection(manifest: OssaAgent): string {
  const lines: string[] = ['## Overview\n'];
  const meta = manifest.metadata;

  if (meta?.version) lines.push(`- **Version**: ${meta.version}`);
  if (meta?.agentType) lines.push(`- **Type**: ${meta.agentType}`);
  if (meta?.agentKind) lines.push(`- **Kind**: ${meta.agentKind}`);
  if (meta?.agentArchitecture?.pattern) {
    lines.push(`- **Architecture**: ${meta.agentArchitecture.pattern}`);
  }
  if (manifest.spec?.llm) {
    const llm = manifest.spec.llm;
    lines.push(`- **LLM**: ${llm.provider}/${llm.model}`);
  }
  if (meta?.lifecycle?.state) {
    lines.push(`- **State**: ${meta.lifecycle.state}`);
  }
  if (meta?.lifecycle?.maturity) {
    lines.push(`- **Maturity**: ${meta.lifecycle.maturity}`);
  }
  lines.push('');

  return lines.join('\n');
}

function generateToolsSection(manifest: OssaAgent): string | null {
  const tools = manifest.spec?.tools;
  if (!tools || tools.length === 0) return null;

  const lines: string[] = [
    '## Tools\n',
    '| Name | Type | Description |',
    '|------|------|-------------|',
  ];

  for (const tool of tools) {
    lines.push(
      `| ${tool.name || '-'} | ${tool.type} | ${tool.description || '-'} |`
    );
  }
  lines.push('');

  return lines.join('\n');
}

function generateCapabilitiesSection(manifest: OssaAgent): string | null {
  const caps = manifest.metadata?.agentArchitecture?.capabilities;
  if (!caps || caps.length === 0) return null;

  return `## Capabilities\n\n${caps.map((c) => `- ${c}`).join('\n')}\n`;
}

function generateTeamSection(manifest: OssaAgent): string | null {
  const team = manifest.spec?.team;
  if (!team) return null;

  const lines: string[] = ['## Team Structure\n'];

  lines.push(`- **Model**: ${team.model}`);
  if (team.lead) lines.push(`- **Lead**: ${team.lead}`);
  lines.push(
    `- **Delegate Mode**: ${team.delegateMode || 'task-list'}`
  );
  lines.push('');

  // Members table
  lines.push('### Members\n');
  lines.push(
    '| Name | Kind | Role | Model | Tools |',
    '|------|------|------|-------|-------|'
  );
  for (const m of team.members) {
    lines.push(formatMemberRow(m));
  }
  lines.push('');

  return lines.join('\n');
}

function generateSubagentSection(manifest: OssaAgent): string {
  const subagents = manifest.spec!.subagents!;
  const lines: string[] = ['## Subagents\n'];

  lines.push(
    '| Name | Kind | Role | Reports To | Token Budget |',
    '|------|------|------|------------|--------------|'
  );
  for (const s of subagents) {
    lines.push(formatSubagentRow(s));
  }
  lines.push('');

  // Hierarchy diagram (text-based)
  const parentName = manifest.metadata?.name || 'parent';
  lines.push('### Hierarchy\n');
  lines.push('```');
  lines.push(parentName);
  for (const s of subagents) {
    lines.push(`  └── ${s.name} (${s.kind || 'subagent'})`);
  }
  lines.push('```\n');

  return lines.join('\n');
}

function generateCoordinationSection(manifest: OssaAgent): string | null {
  const team = manifest.spec?.team;
  const coord = manifest.metadata?.agentArchitecture?.coordination;
  if (!team && !coord) return null;

  const lines: string[] = ['## Coordination\n'];

  if (team?.communication) {
    lines.push(
      `- **Channel**: ${team.communication.channel || 'task-list'}`
    );
    lines.push(
      `- **Consensus**: ${team.communication.consensus || 'leader-decides'}`
    );
  }

  if (coord) {
    if (coord.handoffStrategy)
      lines.push(`- **Handoff Strategy**: ${coord.handoffStrategy}`);
    if (coord.teamModel)
      lines.push(`- **Team Model**: ${coord.teamModel}`);
    if (coord.taskCoordination)
      lines.push(`- **Task Coordination**: ${coord.taskCoordination}`);
    if (coord.taskPersistence)
      lines.push(`- **Task Persistence**: ${coord.taskPersistence}`);
    if (coord.dependencyTracking !== undefined)
      lines.push(
        `- **Dependency Tracking**: ${coord.dependencyTracking ? 'enabled' : 'disabled'}`
      );
  }

  if (team?.taskList) {
    lines.push('');
    lines.push('### Task List\n');
    lines.push(
      `- **Persistence**: ${team.taskList.persistence || 'file-backed'}`
    );
    lines.push(`- **Format**: ${team.taskList.format || 'markdown'}`);
    if (team.taskList.path) {
      lines.push(`- **Path**: ${team.taskList.path}`);
    }
  }

  if (team?.deployment) {
    lines.push('');
    lines.push('### Deployment\n');
    lines.push(
      `- **Backend**: ${team.deployment.backend || 'in-process'}`
    );
    lines.push(
      `- **Max Concurrency**: ${team.deployment.maxConcurrency || 5}`
    );
  }

  lines.push('');
  return lines.join('\n');
}

function generateConstraintsSection(manifest: OssaAgent): string | null {
  const constraints = manifest.spec?.constraints;
  if (!constraints) return null;

  const lines: string[] = ['## Constraints\n'];

  if (constraints.cost) {
    lines.push('### Cost\n');
    if (constraints.cost.maxTokensPerDay) {
      lines.push(
        `- Max tokens/day: ${constraints.cost.maxTokensPerDay.toLocaleString()}`
      );
    }
    if (constraints.cost.maxTokensPerRequest) {
      lines.push(
        `- Max tokens/request: ${constraints.cost.maxTokensPerRequest.toLocaleString()}`
      );
    }
    if (constraints.cost.maxCostPerDay) {
      lines.push(
        `- Max cost/day: $${constraints.cost.maxCostPerDay} ${constraints.cost.currency || 'USD'}`
      );
    }
  }

  if (constraints.performance) {
    lines.push('### Performance\n');
    if (constraints.performance.maxLatencySeconds) {
      lines.push(
        `- Max latency: ${constraints.performance.maxLatencySeconds}s`
      );
    }
    if (constraints.performance.timeoutSeconds) {
      lines.push(`- Timeout: ${constraints.performance.timeoutSeconds}s`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

function generateFooter(
  manifest: OssaAgent,
  pattern: string
): string {
  const version = manifest.apiVersion || 'ossa/v0.4';
  return `---

*Generated from OSSA manifest (${version}). Architecture: ${pattern}.*
`;
}

// ──────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────

export function formatMemberRow(m: TeamMember): string {
  const role = m.role.length > 50 ? m.role.substring(0, 47) + '...' : m.role;
  return `| ${m.name} | ${m.kind || 'teammate'} | ${role} | ${m.model || 'default'} | ${(m.tools || []).join(', ') || '-'} |`;
}

export function formatSubagentRow(s: SubagentDefinition): string {
  const role = s.role.length > 50 ? s.role.substring(0, 47) + '...' : s.role;
  return `| ${s.name} | ${s.kind || 'subagent'} | ${role} | ${s.reportTo || '-'} | ${s.maxTokenBudget?.toLocaleString() || '-'} |`;
}
