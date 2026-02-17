/**
 * Team / Multi-Agent Generator Service
 *
 * Generates multi-agent orchestration structures from OSSA manifests.
 * Supports all 7 architecture patterns:
 *   single, swarm, pipeline, graph, hierarchical, reactive, cognitive
 *
 * Reference model: Claude Code Agent Teams architecture
 *   - Lead/teammate model with shared task list and mailbox
 *   - Independent context windows per teammate
 *   - Self-claim task coordination
 *
 * This is the differentiator — no other standard defines agent teams
 * as a structured, exportable specification.
 */

import * as yaml from 'yaml';
import type { OssaAgent } from '../../types/index.js';

interface ExportFile {
  path: string;
  content: string;
  type: 'code' | 'config' | 'documentation' | 'test' | 'other';
  language?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

type ArchitecturePattern =
  | 'single'
  | 'swarm'
  | 'pipeline'
  | 'graph'
  | 'hierarchical'
  | 'reactive'
  | 'cognitive'
  | 'lead-teammate';

interface TeamMember {
  name: string;
  kind: string;
  role: string;
  model?: AnyRecord;
  tools?: AnyRecord[];
  handoffs?: AnyRecord[];
  contextIsolation?: boolean;
}

interface TeamConfig {
  name: string;
  version: string;
  pattern: ArchitecturePattern;
  lead?: string;
  members: TeamMember[];
  taskCoordination: string;
  communicationPattern: string;
  conflictResolution: string;
  taskPersistence: string;
  dependencyTracking: boolean;
  waveExecution: boolean;
  lockingStrategy: string;
  deploymentBackend: string;
  deploymentScaling: string;
}

export class TeamGeneratorService {
  /**
   * Generate multi-agent orchestration files from manifest.
   *
   * @param manifest - OSSA agent manifest
   * @param platform - Target platform (affects code generation)
   */
  generate(manifest: OssaAgent, platform: string): ExportFile[] {
    const config = this.extractTeamConfig(manifest);
    if (!config) return [];

    const files: ExportFile[] = [];

    // Team config (universal)
    files.push(this.generateTeamConfig(config));

    // Task list structure
    files.push(this.generateTaskListConfig(config));

    // Communication / mailbox config
    files.push(this.generateCommunicationConfig(config));

    // Pattern-specific orchestration files
    files.push(...this.generatePatternFiles(config, manifest, platform));

    // Per-member agent definitions
    files.push(...this.generateMemberDefinitions(config, platform));

    // Team README
    files.push(this.generateTeamReadme(config));

    return files;
  }

  /**
   * Extract team configuration from manifest.
   * Handles spec.team, spec.swarm, spec.subagents, and agentArchitecture.
   */
  private extractTeamConfig(manifest: OssaAgent): TeamConfig | null {
    const spec = manifest.spec as AnyRecord | undefined;
    const metadata = manifest.metadata as AnyRecord | undefined;
    const arch = metadata?.agentArchitecture as AnyRecord | undefined;
    const pattern = (arch?.pattern as ArchitecturePattern) || 'single';

    const team = spec?.team as AnyRecord | undefined;
    const swarm = spec?.swarm as AnyRecord | undefined;
    const subagents = spec?.subagents as AnyRecord[] | undefined;

    // No multi-agent configuration found
    if (!team && !swarm && !subagents && pattern === 'single') {
      return null;
    }

    const name = metadata?.name || 'agent-team';
    const version = metadata?.version || '1.0.0';

    // Extract from spec.team (Claude Code agent teams model)
    if (team) {
      const members: TeamMember[] = [];
      if (Array.isArray(team.members)) {
        for (const m of team.members as AnyRecord[]) {
          members.push({
            name: m.name || 'unnamed',
            kind: m.kind || 'teammate',
            role: m.role || '',
            model: m.model as AnyRecord | undefined,
            tools: m.tools as AnyRecord[] | undefined,
            handoffs: m.handoffs as AnyRecord[] | undefined,
            contextIsolation: m.contextIsolation ?? true,
          });
        }
      }

      const taskList = team.taskList as AnyRecord | undefined;
      const comms = team.communication as AnyRecord | undefined;
      const coord = arch?.coordination as AnyRecord | undefined;

      const deployment = team.deployment as AnyRecord | undefined;

      return {
        name,
        version,
        pattern: pattern !== 'single' ? pattern : 'hierarchical',
        lead: (team.lead as string) || undefined,
        members,
        taskCoordination:
          (taskList?.coordination as string) ||
          (taskList?.claimPolicy as string) ||
          'shared-list',
        communicationPattern:
          (comms?.pattern as string) || 'mailbox',
        conflictResolution:
          (coord?.conflictResolution as string) || 'leader-decides',
        taskPersistence:
          (taskList?.persistence as string) || 'file-backed',
        dependencyTracking:
          (taskList?.dependencyTracking as boolean) ?? true,
        waveExecution:
          (taskList?.waveExecution as boolean) ?? true,
        lockingStrategy:
          (taskList?.lockingStrategy as string) || 'file-lock',
        deploymentBackend:
          (deployment?.backend as string) || 'in-process',
        deploymentScaling:
          (deployment?.scaling as string) || 'fixed',
      };
    }

    // Extract from spec.swarm (OpenAI Swarm model)
    if (swarm) {
      const members: TeamMember[] = [];
      if (Array.isArray(swarm.agents)) {
        for (const a of swarm.agents as AnyRecord[]) {
          members.push({
            name: a.name || 'unnamed',
            kind: a.agentKind || 'specialist',
            role: a.role || (a.instructions as string) || '',
            tools: a.tools as AnyRecord[] | undefined,
            handoffs: a.handoffs as AnyRecord[] | undefined,
            contextIsolation: true,
          });
        }
      }

      return {
        name,
        version,
        pattern: 'swarm',
        lead: swarm.entryAgent as string | undefined,
        members,
        taskCoordination: 'handoff',
        communicationPattern: 'direct',
        conflictResolution: 'leader-decides',
        taskPersistence: 'in-memory',
        dependencyTracking: false,
        waveExecution: false,
        lockingStrategy: 'none',
        deploymentBackend: 'in-process',
        deploymentScaling: 'fixed',
      };
    }

    // Extract from spec.subagents (parent-child model)
    if (subagents && subagents.length > 0) {
      const members: TeamMember[] = subagents.map((s) => ({
        name: s.name || 'unnamed',
        kind: s.kind || 'subagent',
        role: s.role || '',
        model: s.model as AnyRecord | undefined,
        tools: s.tools as AnyRecord[] | undefined,
        contextIsolation: s.contextIsolation ?? true,
      }));

      return {
        name,
        version,
        pattern: pattern !== 'single' ? pattern : 'hierarchical',
        lead: name,
        members,
        taskCoordination: 'assigned',
        communicationPattern: 'report-to-parent',
        conflictResolution: 'leader-decides',
        taskPersistence: 'in-memory',
        dependencyTracking: true,
        waveExecution: false,
        lockingStrategy: 'none',
        deploymentBackend: 'in-process',
        deploymentScaling: 'fixed',
      };
    }

    // Architecture pattern but no explicit team definition
    return {
      name,
      version,
      pattern,
      members: [],
      taskCoordination: 'self-claim',
      communicationPattern: 'mailbox',
      conflictResolution: 'leader-decides',
      taskPersistence: 'file-backed',
      dependencyTracking: true,
      waveExecution: true,
      lockingStrategy: 'file-lock',
      deploymentBackend: 'in-process',
      deploymentScaling: 'fixed',
    };
  }

  private generateTeamConfig(config: TeamConfig): ExportFile {
    const teamConfig = {
      name: config.name,
      version: config.version,
      pattern: config.pattern,
      lead: config.lead || null,
      members: config.members.map((m) => ({
        name: m.name,
        kind: m.kind,
        contextIsolation: m.contextIsolation ?? true,
      })),
      coordination: {
        taskModel: config.taskCoordination,
        communication: config.communicationPattern,
        conflictResolution: config.conflictResolution,
        taskPersistence: config.taskPersistence,
        dependencyTracking: config.dependencyTracking,
        waveExecution: config.waveExecution,
        lockingStrategy: config.lockingStrategy,
      },
      deployment: {
        backend: config.deploymentBackend,
        scaling: config.deploymentScaling,
      },
    };

    return {
      path: 'team/config.json',
      content: JSON.stringify(teamConfig, null, 2),
      type: 'config',
      language: 'json',
    };
  }

  private generateTaskListConfig(config: TeamConfig): ExportFile {
    const taskListConfig = {
      version: '1.0.0',
      coordination: config.taskCoordination,
      claimPolicy: config.taskCoordination === 'handoff' ? 'handoff' : 'self-claim',
      persistence: config.taskPersistence,
      dependencyTracking: config.dependencyTracking,
      waveExecution: config.waveExecution,
      statuses: ['pending', 'in_progress', 'completed', 'blocked'],
      lockingStrategy: config.lockingStrategy,
      maxConcurrentTasks: config.members.length || 3,
      idleNotification: true,
    };

    return {
      path: 'team/tasks/config.yaml',
      content: yaml.stringify(taskListConfig),
      type: 'config',
      language: 'yaml',
    };
  }

  private generateCommunicationConfig(config: TeamConfig): ExportFile {
    const commsConfig = {
      version: '1.0.0',
      pattern: config.communicationPattern,
      protocols: this.getCommsProtocols(config.communicationPattern),
      messageTypes: [
        'request',
        'response',
        'broadcast',
        'coordination',
        'delegation',
        'event',
        'shutdown',
      ],
      delivery: {
        mode: config.communicationPattern === 'mailbox' ? 'async' : 'sync',
        retries: 3,
        timeoutMs: 30000,
      },
      routing: {
        algorithm: config.members.length > 5 ? 'capability-based' : 'direct',
      },
    };

    return {
      path: 'team/communication.yaml',
      content: yaml.stringify(commsConfig),
      type: 'config',
      language: 'yaml',
    };
  }

  private getCommsProtocols(pattern: string): string[] {
    switch (pattern) {
      case 'mailbox':
        return ['async-message', 'idle-notification'];
      case 'broadcast':
        return ['broadcast', 'async-message'];
      case 'shared-file':
        return ['file-write', 'file-watch', 'async-message'];
      case 'direct':
        return ['sync-request', 'async-message'];
      case 'report-to-parent':
        return ['result-report', 'status-update'];
      default:
        return ['async-message'];
    }
  }

  private generatePatternFiles(
    config: TeamConfig,
    manifest: OssaAgent,
    platform: string
  ): ExportFile[] {
    switch (config.pattern) {
      case 'swarm':
        return this.generateSwarmFiles(config, manifest);
      case 'pipeline':
        return this.generatePipelineFiles(config);
      case 'graph':
        return this.generateGraphFiles(config);
      case 'hierarchical':
        return this.generateHierarchicalFiles(config);
      case 'reactive':
        return this.generateReactiveFiles(config);
      case 'cognitive':
        return this.generateCognitiveFiles(config);
      case 'lead-teammate':
        return this.generateLeadTeammateFiles(config);
      default:
        return [];
    }
  }

  private generateSwarmFiles(
    config: TeamConfig,
    manifest: OssaAgent
  ): ExportFile[] {
    const spec = manifest.spec as AnyRecord | undefined;
    const handoffs = (spec?.handoffs || []) as AnyRecord[];

    const swarmConfig = {
      entryAgent: config.lead || config.members[0]?.name || 'triage',
      agents: config.members.map((m) => ({
        name: m.name,
        kind: m.kind,
        handoffs: m.handoffs || handoffs.filter((h) => h.from === m.name),
      })),
      handoffStrategy: 'capability_match',
      maxHandoffDepth: 5,
      contextTransfer: {
        mode: 'summary',
        includeHistory: false,
        maxTokens: 2000,
      },
    };

    return [
      {
        path: 'team/swarm.yaml',
        content: yaml.stringify(swarmConfig),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generatePipelineFiles(config: TeamConfig): ExportFile[] {
    const stages = config.members.map((m, i) => ({
      stage: i + 1,
      agent: m.name,
      kind: m.kind,
      inputFrom: i === 0 ? 'user' : config.members[i - 1].name,
      outputTo:
        i === config.members.length - 1
          ? 'user'
          : config.members[i + 1].name,
    }));

    const pipelineConfig = {
      stages,
      errorHandling: {
        strategy: 'stop-on-error',
        retries: 2,
        fallbackAgent: config.lead || null,
      },
      dataFlow: {
        format: 'json',
        validation: true,
        maxPayloadBytes: 1048576,
      },
    };

    return [
      {
        path: 'team/pipeline.yaml',
        content: yaml.stringify(pipelineConfig),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generateGraphFiles(config: TeamConfig): ExportFile[] {
    const nodes = config.members.map((m) => ({
      id: m.name,
      kind: m.kind,
      tools: m.tools?.map((t: AnyRecord) => t.name || t) || [],
    }));

    // Create edges from handoffs
    const edges: AnyRecord[] = [];
    for (const m of config.members) {
      if (m.handoffs) {
        for (const h of m.handoffs) {
          edges.push({
            from: m.name,
            to: h.to || h.target,
            condition: h.condition || 'always',
          });
        }
      }
    }

    const graphConfig = {
      nodes,
      edges,
      entryPoint: config.lead || config.members[0]?.name,
      stateSchema: {
        type: 'object',
        properties: {
          messages: { type: 'array' },
          currentAgent: { type: 'string' },
          completedSteps: { type: 'array' },
        },
      },
      execution: {
        mode: 'conditional',
        maxIterations: 25,
        checkpointStrategy: 'per-node',
      },
    };

    return [
      {
        path: 'team/graph.yaml',
        content: yaml.stringify(graphConfig),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generateHierarchicalFiles(config: TeamConfig): ExportFile[] {
    const hierarchy = {
      manager: config.lead || config.name,
      workers: config.members
        .filter((m) => m.kind !== 'team-lead' && m.kind !== 'orchestrator')
        .map((m) => ({
          name: m.name,
          kind: m.kind,
          capabilities: m.tools?.map((t: AnyRecord) => t.name || t) || [],
          maxConcurrent: 3,
        })),
      delegation: {
        strategy: 'capability-match',
        loadBalancing: true,
        maxQueueSize: 10,
        requirePlanApproval: false,
      },
      escalation: {
        onError: 'report-to-manager',
        onTimeout: 'reassign',
        onConflict: 'manager-decides',
      },
    };

    return [
      {
        path: 'team/hierarchy.yaml',
        content: yaml.stringify(hierarchy),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generateReactiveFiles(config: TeamConfig): ExportFile[] {
    const reactiveConfig = {
      triggers: config.members.map((m) => ({
        agent: m.name,
        events: [`${m.name}:activated`, `task:${m.kind}`],
        conditions: m.handoffs?.map((h: AnyRecord) => h.condition) || [],
      })),
      eventBus: {
        type: 'in-memory',
        maxQueueSize: 1000,
        deliveryGuarantee: 'at-least-once',
      },
      routing: {
        strategy: 'event-type',
        fallback: config.lead || 'default-handler',
      },
    };

    return [
      {
        path: 'team/reactive.yaml',
        content: yaml.stringify(reactiveConfig),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generateCognitiveFiles(config: TeamConfig): ExportFile[] {
    const cognitiveConfig = {
      reasoningLoop: {
        strategy: 'ReAct',
        maxSteps: 10,
        phases: ['think', 'plan', 'act', 'observe', 'reflect'],
      },
      agents: {
        planner: config.members.find((m) => m.kind === 'planner')?.name || config.lead,
        executor:
          config.members
            .filter((m) => m.kind === 'worker' || m.kind === 'specialist')
            .map((m) => m.name) || [],
        critic:
          config.members.find((m) => m.kind === 'reviewer')?.name || null,
      },
      memory: {
        workingMemory: { type: 'buffer', maxTokens: 8000 },
        episodicMemory: { enabled: true, format: 'json' },
        semanticMemory: { enabled: false },
      },
      stopping: {
        conditions: ['goal-achieved', 'max-steps', 'confidence-threshold'],
        confidenceThreshold: 0.85,
      },
    };

    return [
      {
        path: 'team/cognitive.yaml',
        content: yaml.stringify(cognitiveConfig),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generateLeadTeammateFiles(config: TeamConfig): ExportFile[] {
    const leadTeammateConfig = {
      lead: config.lead || config.name,
      delegateMode: true,
      teammates: config.members
        .filter((m) => m.kind === 'teammate' || m.kind === 'worker')
        .map((m) => ({
          name: m.name,
          role: m.role,
          model: m.model || null,
          tools: m.tools?.map((t: AnyRecord) => t.name || t) || [],
          contextIsolation: m.contextIsolation ?? true,
          workingDirectory: `/${m.name}`,
        })),
      taskList: {
        coordination: config.taskCoordination,
        persistence: config.taskPersistence,
        stateModel: ['pending', 'in_progress', 'completed', 'blocked'],
        dependencyTracking: config.dependencyTracking,
        waveExecution: config.waveExecution,
        lockingStrategy: config.lockingStrategy,
        claimPolicy: 'self-claim',
      },
      communication: {
        pattern: config.communicationPattern,
        channels: ['direct', 'shared-file'],
        broadcastEnabled: false,
      },
      deployment: {
        backend: config.deploymentBackend,
        scaling: config.deploymentScaling,
      },
      conflictResolution: config.conflictResolution,
    };

    return [
      {
        path: 'team/lead-teammate.yaml',
        content: yaml.stringify(leadTeammateConfig),
        type: 'config',
        language: 'yaml',
      },
    ];
  }

  private generateMemberDefinitions(
    config: TeamConfig,
    platform: string
  ): ExportFile[] {
    return config.members.map((member) => {
      const memberDef = {
        name: member.name,
        kind: member.kind,
        role: member.role,
        model: member.model || null,
        tools:
          member.tools?.map((t: AnyRecord) => ({
            name: t.name || t,
            ...(t.description ? { description: t.description } : {}),
          })) || [],
        contextIsolation: member.contextIsolation ?? true,
        handoffs:
          member.handoffs?.map((h: AnyRecord) => ({
            to: h.to || h.target,
            condition: h.condition || 'any',
          })) || [],
        permissions: this.getMemberPermissions(member.kind),
      };

      return {
        path: `team/members/${member.name}.yaml`,
        content: yaml.stringify(memberDef),
        type: 'config' as const,
        language: 'yaml',
      };
    });
  }

  private getMemberPermissions(kind: string): AnyRecord {
    switch (kind) {
      case 'team-lead':
      case 'orchestrator':
      case 'coordinator':
        return {
          spawn: true,
          shutdown: true,
          assignTasks: true,
          broadcast: true,
          modifyTeam: true,
          approveWork: true,
        };
      case 'teammate':
      case 'worker':
      case 'specialist':
        return {
          spawn: false,
          shutdown: false,
          assignTasks: false,
          broadcast: false,
          claimTasks: true,
          messagePeers: true,
          messageLeader: true,
        };
      case 'subagent':
        return {
          spawn: false,
          shutdown: false,
          assignTasks: false,
          broadcast: false,
          claimTasks: false,
          reportToParent: true,
        };
      case 'reviewer':
        return {
          spawn: false,
          shutdown: false,
          assignTasks: false,
          broadcast: false,
          claimTasks: true,
          approveWork: true,
          rejectWork: true,
        };
      default:
        return {
          claimTasks: true,
          messageLeader: true,
        };
    }
  }

  private generateTeamReadme(config: TeamConfig): ExportFile {
    const lines: string[] = [];

    lines.push(`# ${config.name} — Agent Team\n`);
    lines.push(`**Pattern**: ${config.pattern}`);
    lines.push(`**Members**: ${config.members.length}`);
    if (config.lead) lines.push(`**Lead**: ${config.lead}`);
    lines.push('');

    lines.push(`## Architecture\n`);
    lines.push(this.getPatternDescription(config.pattern));
    lines.push('');

    if (config.members.length > 0) {
      lines.push(`## Members\n`);
      lines.push(`| Name | Kind | Role |`);
      lines.push(`|------|------|------|`);
      for (const m of config.members) {
        lines.push(
          `| ${m.name} | ${m.kind} | ${m.role.substring(0, 60) || '-'} |`
        );
      }
      lines.push('');
    }

    lines.push(`## Coordination\n`);
    lines.push(`- **Task Model**: ${config.taskCoordination}`);
    lines.push(`- **Communication**: ${config.communicationPattern}`);
    lines.push(`- **Conflict Resolution**: ${config.conflictResolution}`);
    lines.push(`- **Task Persistence**: ${config.taskPersistence}`);
    lines.push(`- **Dependency Tracking**: ${config.dependencyTracking ? 'enabled' : 'disabled'}`);
    if (config.waveExecution) lines.push(`- **Wave Execution**: enabled`);
    lines.push(`- **Locking**: ${config.lockingStrategy}`);
    lines.push(`- **Deployment**: ${config.deploymentBackend} (${config.deploymentScaling})`);
    lines.push('');

    lines.push(`## Files\n`);
    lines.push(`- \`config.json\` — Team configuration`);
    lines.push(`- \`tasks/config.yaml\` — Task coordination settings`);
    lines.push(`- \`communication.yaml\` — Inter-agent messaging`);
    lines.push(`- \`${config.pattern}.yaml\` — Pattern-specific orchestration`);
    lines.push(`- \`members/*.yaml\` — Individual agent definitions`);
    lines.push('');

    lines.push(
      `---\n*Generated by OSSA v0.4 — [openstandardagents.org](https://openstandardagents.org)*`
    );

    return {
      path: 'team/README.md',
      content: lines.join('\n'),
      type: 'documentation',
      language: 'markdown',
    };
  }

  private getPatternDescription(pattern: ArchitecturePattern): string {
    const descriptions: Record<ArchitecturePattern, string> = {
      single: 'Single agent operating independently.',
      swarm:
        'Peer-to-peer collaboration with handoffs. Agents transfer control based on capability matching. Modeled after OpenAI Swarm and Claude Code agent teams.',
      pipeline:
        'Sequential processing chain. Each agent receives output from the previous stage and passes results to the next. Best for data transformation workflows.',
      graph:
        'Directed acyclic graph (DAG) workflow. Agents are nodes with conditional edges. Supports branching, merging, and parallel execution paths. Modeled after LangGraph StateGraph.',
      hierarchical:
        'Manager/worker structure. A lead agent delegates tasks to workers based on capabilities. Workers report results back. Supports plan approval before execution.',
      reactive:
        'Event-driven architecture. Agents activate in response to events and triggers. No fixed execution order — behavior emerges from event routing.',
      cognitive:
        'Multi-step reasoning loop (ReAct pattern). Combines planning, execution, and reflection phases. A planner agent decomposes goals, executor agents carry out steps, and a critic evaluates results.',
      'lead-teammate':
        'Lead-teammate coordination modeled after Claude Code Agent Teams. A lead orchestrates independent teammates via shared task list and mailbox messaging. Teammates self-claim tasks, work in isolated contexts, and coordinate through file-backed persistence with dependency wave execution.',
    };
    return descriptions[pattern] || descriptions.single;
  }
}
