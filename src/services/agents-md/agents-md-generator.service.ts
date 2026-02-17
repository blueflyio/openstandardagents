/**
 * AGENTS.md Generator Service
 *
 * Generates AGENTS.md files from OSSA manifests — the convention adopted
 * by the Agentic AI Foundation (AAIF) and 60,000+ open-source projects.
 * AGENTS.md serves as a "README for AI agents" — project-specific markdown
 * instructions that coding agents read before operating in a repository.
 *
 * This bridges OSSA's contract layer with the AAIF ecosystem: define once
 * in .ossa.yaml, export to AGENTS.md for universal agent compatibility.
 */

import type { OssaAgent } from '../../types/index.js';

interface ExportFile {
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation' | 'test' | 'other';
  language?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

export class AgentsMdGeneratorService {
  /**
   * Generate AGENTS.md from an OSSA manifest.
   */
  generate(manifest: OssaAgent): ExportFile[] {
    const content = this.buildAgentsMd(manifest);
    return [
      {
        path: 'AGENTS.md',
        content,
        type: 'documentation',
        language: 'markdown',
      },
    ];
  }

  private buildAgentsMd(manifest: OssaAgent): string {
    const name = manifest.metadata?.name || 'Agent';
    const description =
      manifest.metadata?.description || (manifest.spec?.role as string) || '';
    const version = manifest.metadata?.version || '0.1.0';
    const metadata = manifest.metadata as AnyRecord | undefined;
    const spec = manifest.spec as AnyRecord | undefined;

    const sections: string[] = [];

    // Header
    sections.push(`# ${name}\n`);
    if (description) {
      sections.push(`${description}\n`);
    }

    // Identity & Classification
    sections.push(this.buildIdentitySection(metadata, manifest.apiVersion));

    // Capabilities
    sections.push(this.buildCapabilitiesSection(metadata, spec));

    // Tools
    const tools = (spec?.tools || []) as AnyRecord[];
    if (tools.length > 0) {
      sections.push(this.buildToolsSection(tools));
    }

    // LLM Configuration
    const llm = spec?.llm as AnyRecord | undefined;
    const model = spec?.model as AnyRecord | undefined;
    if (llm || model) {
      sections.push(this.buildLLMSection((llm || model)!));
    }

    // Autonomy & Boundaries
    const autonomy = spec?.autonomy as AnyRecord | undefined;
    if (autonomy) {
      sections.push(this.buildAutonomySection(autonomy));
    }

    // Team / Multi-Agent
    const team = spec?.team as AnyRecord | undefined;
    const swarm = spec?.swarm as AnyRecord | undefined;
    const subagents = spec?.subagents as AnyRecord[] | undefined;
    if (team || swarm || subagents) {
      sections.push(this.buildTeamSection(team, swarm, subagents));
    }

    // MCP Servers
    const extensions = (manifest.extensions || spec?.extensions) as AnyRecord | undefined;
    const mcp = extensions?.mcp as AnyRecord | undefined;
    if (mcp?.servers && Array.isArray(mcp.servers)) {
      sections.push(this.buildMCPSection(mcp.servers as AnyRecord[]));
    }

    // A2A Protocol
    const a2a = extensions?.a2a as AnyRecord | undefined;
    if (a2a) {
      sections.push(this.buildA2ASection(a2a));
    }

    // Endpoints
    const endpoints = spec?.endpoints as AnyRecord | undefined;
    if (endpoints) {
      sections.push(this.buildEndpointsSection(endpoints));
    }

    // Constraints
    const constraints = spec?.constraints as AnyRecord | undefined;
    if (constraints) {
      sections.push(this.buildConstraintsSection(constraints));
    }

    // Handoffs
    const handoffs = spec?.handoffs as AnyRecord[] | undefined;
    if (handoffs && handoffs.length > 0) {
      sections.push(this.buildHandoffsSection(handoffs));
    }

    // Footer
    sections.push(this.buildFooter(name, version, manifest.apiVersion));

    return sections.filter(Boolean).join('\n');
  }

  private buildIdentitySection(
    metadata: AnyRecord | undefined,
    apiVersion: string | undefined
  ): string {
    const lines: string[] = ['## Identity\n'];
    lines.push(`| Property | Value |`);
    lines.push(`|----------|-------|`);
    lines.push(`| **Spec** | ${apiVersion || 'ossa/v0.4'} |`);

    if (metadata?.agentType) {
      lines.push(`| **Runtime** | ${metadata.agentType} |`);
    }
    if (metadata?.agentKind) {
      lines.push(`| **Kind** | ${metadata.agentKind} |`);
    }

    const arch = metadata?.agentArchitecture as AnyRecord | undefined;
    if (arch?.pattern) {
      lines.push(`| **Architecture** | ${arch.pattern} |`);
    }
    if (Array.isArray(arch?.capabilities) && arch.capabilities.length > 0) {
      lines.push(
        `| **Capabilities** | ${(arch.capabilities as string[]).join(', ')} |`
      );
    }

    const labels = metadata?.labels as AnyRecord | undefined;
    if (labels?.capability) {
      lines.push(`| **Domains** | ${labels.capability} |`);
    }

    lines.push('');
    return lines.join('\n');
  }

  private buildCapabilitiesSection(
    metadata: AnyRecord | undefined,
    spec: AnyRecord | undefined
  ): string {
    const capabilities: string[] = [];
    const arch = metadata?.agentArchitecture as AnyRecord | undefined;

    if (Array.isArray(arch?.capabilities)) {
      capabilities.push(...(arch.capabilities as string[]));
    }

    if (spec?.capabilities && Array.isArray(spec.capabilities)) {
      for (const cap of spec.capabilities as AnyRecord[]) {
        if (typeof cap === 'string') {
          capabilities.push(cap);
        } else if (cap?.name) {
          capabilities.push(String(cap.name));
        }
      }
    }

    if (capabilities.length === 0) return '';

    const lines: string[] = ['## Capabilities\n'];
    for (const cap of [...new Set(capabilities)]) {
      lines.push(`- ${cap}`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildToolsSection(tools: AnyRecord[]): string {
    const lines: string[] = ['## Tools\n'];
    lines.push(`| Tool | Description |`);
    lines.push(`|------|-------------|`);

    for (const tool of tools) {
      const toolName = tool.name || 'unnamed';
      const desc = tool.description || 'No description';
      lines.push(`| \`${toolName}\` | ${desc} |`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildLLMSection(llm: AnyRecord): string {
    const lines: string[] = ['## Model Configuration\n'];
    if (llm.provider) lines.push(`- **Provider**: ${llm.provider}`);
    if (llm.model || llm.name) lines.push(`- **Model**: ${llm.model || llm.name}`);
    if (llm.temperature !== undefined)
      lines.push(`- **Temperature**: ${llm.temperature}`);
    if (llm.maxTokens !== undefined)
      lines.push(`- **Max Tokens**: ${llm.maxTokens}`);
    lines.push('');
    return lines.join('\n');
  }

  private buildAutonomySection(autonomy: AnyRecord): string {
    const lines: string[] = ['## Autonomy\n'];
    if (autonomy.level) lines.push(`- **Level**: ${autonomy.level}`);
    if (autonomy.approvalRequired !== undefined)
      lines.push(
        `- **Approval Required**: ${autonomy.approvalRequired ? 'Yes' : 'No'}`
      );

    if (
      Array.isArray(autonomy.allowedActions) &&
      autonomy.allowedActions.length > 0
    ) {
      lines.push(
        `- **Allowed**: ${(autonomy.allowedActions as string[]).join(', ')}`
      );
    }
    if (
      Array.isArray(autonomy.blockedActions) &&
      autonomy.blockedActions.length > 0
    ) {
      lines.push(
        `- **Blocked**: ${(autonomy.blockedActions as string[]).join(', ')}`
      );
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildTeamSection(
    team: AnyRecord | undefined,
    swarm: AnyRecord | undefined,
    subagents: AnyRecord[] | undefined
  ): string {
    const lines: string[] = ['## Agent Team\n'];

    if (team) {
      if (team.model) lines.push(`- **Model**: ${team.model}`);
      if (team.lead) lines.push(`- **Lead**: ${team.lead}`);

      if (Array.isArray(team.members) && team.members.length > 0) {
        lines.push('');
        lines.push(`### Team Members\n`);
        lines.push(`| Name | Kind | Role |`);
        lines.push(`|------|------|------|`);
        for (const member of team.members as AnyRecord[]) {
          lines.push(
            `| ${member.name || '?'} | ${member.kind || 'teammate'} | ${(member.role || '').substring(0, 60)} |`
          );
        }
      }

      const taskList = team.taskList as AnyRecord | undefined;
      if (taskList) {
        lines.push('');
        lines.push(`### Task Coordination\n`);
        if (taskList.coordination)
          lines.push(`- **Coordination**: ${taskList.coordination}`);
        if (taskList.claimPolicy)
          lines.push(`- **Claim Policy**: ${taskList.claimPolicy}`);
      }

      const comms = team.communication as AnyRecord | undefined;
      if (comms) {
        lines.push('');
        lines.push(`### Communication\n`);
        if (comms.pattern)
          lines.push(`- **Pattern**: ${comms.pattern}`);
      }
    }

    if (swarm) {
      if (swarm.entryAgent)
        lines.push(`- **Entry Agent**: ${swarm.entryAgent}`);
      if (Array.isArray(swarm.agents)) {
        lines.push('');
        lines.push(`### Swarm Agents\n`);
        lines.push(`| Name | Kind | Tools |`);
        lines.push(`|------|------|-------|`);
        for (const agent of swarm.agents as AnyRecord[]) {
          const toolNames = Array.isArray(agent.tools)
            ? (agent.tools as AnyRecord[]).map((t) => t.name || '?').join(', ')
            : '';
          lines.push(
            `| ${agent.name || '?'} | ${agent.agentKind || 'specialist'} | ${toolNames} |`
          );
        }
      }
    }

    if (subagents && subagents.length > 0) {
      lines.push('');
      lines.push(`### Subagents\n`);
      lines.push(`| Name | Kind | Context |`);
      lines.push(`|------|------|---------|`);
      for (const sub of subagents) {
        lines.push(
          `| ${sub.name || '?'} | ${sub.kind || 'subagent'} | ${sub.contextIsolation ? 'Isolated' : 'Shared'} |`
        );
      }
    }

    lines.push('');
    return lines.join('\n');
  }

  private buildMCPSection(servers: AnyRecord[]): string {
    const lines: string[] = ['## MCP Servers\n'];
    for (const server of servers) {
      lines.push(`### ${server.name || 'unnamed'}\n`);
      const transport = server.transport as AnyRecord | undefined;
      if (transport?.type) lines.push(`- **Transport**: ${transport.type}`);
      if (transport?.command)
        lines.push(
          `- **Command**: \`${transport.command}${Array.isArray(transport.args) ? ' ' + (transport.args as string[]).join(' ') : ''}\``
        );
      if (server.description) lines.push(`- ${server.description}`);
      lines.push('');
    }
    return lines.join('\n');
  }

  private buildA2ASection(a2a: AnyRecord): string {
    const lines: string[] = ['## A2A Protocol\n'];
    const protocol = a2a.protocol as AnyRecord | undefined;
    if (protocol?.type) lines.push(`- **Type**: ${protocol.type}`);
    if (protocol?.version) lines.push(`- **Version**: ${protocol.version}`);

    const endpoints = a2a.endpoints as AnyRecord | undefined;
    if (endpoints) {
      if (endpoints.http) lines.push(`- **HTTP**: ${endpoints.http}`);
      if (endpoints.grpc) lines.push(`- **gRPC**: ${endpoints.grpc}`);
      if (endpoints.websocket)
        lines.push(`- **WebSocket**: ${endpoints.websocket}`);
    }

    const routing = a2a.routing as AnyRecord | undefined;
    if (routing?.strategy) lines.push(`- **Routing**: ${routing.strategy}`);

    const delegation = a2a.delegation as AnyRecord | undefined;
    if (delegation?.enabled) {
      lines.push(`- **Delegation**: Enabled (max depth: ${delegation.maxDepth || 3})`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildEndpointsSection(endpoints: AnyRecord): string {
    const lines: string[] = ['## Endpoints\n'];
    for (const [key, value] of Object.entries(endpoints)) {
      if (typeof value === 'string') {
        lines.push(`- **${key}**: ${value}`);
      }
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildConstraintsSection(constraints: AnyRecord): string {
    const lines: string[] = ['## Constraints\n'];
    const cost = constraints.cost as AnyRecord | undefined;
    if (cost) {
      if (cost.maxTokensPerDay)
        lines.push(
          `- **Max Tokens/Day**: ${Number(cost.maxTokensPerDay).toLocaleString()}`
        );
      if (cost.maxCostPerDay)
        lines.push(
          `- **Max Cost/Day**: ${cost.currency || '$'}${cost.maxCostPerDay}`
        );
    }
    const perf = constraints.performance as AnyRecord | undefined;
    if (perf) {
      if (perf.maxLatencySeconds)
        lines.push(`- **Max Latency**: ${perf.maxLatencySeconds}s`);
      if (perf.timeoutSeconds)
        lines.push(`- **Timeout**: ${perf.timeoutSeconds}s`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildHandoffsSection(handoffs: AnyRecord[]): string {
    const lines: string[] = ['## Handoffs\n'];
    lines.push(`| Target | Condition |`);
    lines.push(`|--------|-----------|`);
    for (const h of handoffs) {
      lines.push(`| ${h.to || '?'} | ${h.condition || 'any'} |`);
    }
    lines.push('');
    return lines.join('\n');
  }

  private buildFooter(
    name: string,
    version: string,
    apiVersion: string | undefined
  ): string {
    return `---

*Generated from OSSA ${apiVersion || 'v0.4'} manifest. ${name} v${version}.*
*See [openstandardagents.org](https://openstandardagents.org) for specification details.*
`;
  }
}
