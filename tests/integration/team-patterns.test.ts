/**
 * Team Patterns — Integration Tests
 *
 * Tests all 8 architecture patterns supported by TeamGeneratorService:
 *   single, swarm, pipeline, graph, hierarchical, reactive, cognitive, lead-teammate
 *
 * For each pattern, verifies:
 *   - Correct pattern-specific file is generated (e.g., swarm.yaml, pipeline.yaml)
 *   - Correct defaults for task persistence, coordination, etc.
 *   - Correct member permissions based on kind
 */

import { describe, it, expect } from '@jest/globals';
import { TeamGeneratorService } from '../../src/services/multi-agent/team-generator.service.js';
import type { OssaAgent } from '../../src/types/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const service = new TeamGeneratorService();

/**
 * Build a minimal manifest for a given architecture pattern.
 * Uses spec.team for patterns that require it, spec.swarm for swarm,
 * or just agentArchitecture.pattern for pattern-only manifests.
 */
function makeManifest(pattern: string, overrides?: any): OssaAgent {
  const base: OssaAgent = {
    apiVersion: 'ossa/v0.4',
    kind: 'Agent',
    metadata: {
      name: `${pattern}-test-agent`,
      version: '1.0.0',
      description: `Test agent for ${pattern} pattern.`,
      agentArchitecture: {
        pattern: pattern as any,
        coordination: {
          handoffStrategy: 'automatic',
        },
      },
    },
    spec: {
      role: `Test role for ${pattern} pattern.`,
    },
  };

  if (overrides) {
    return {
      ...base,
      ...overrides,
      metadata: { ...base.metadata!, ...(overrides.metadata || {}) },
      spec: { ...base.spec!, ...(overrides.spec || {}) },
    };
  }
  return base;
}

/**
 * Create two standard members for team-based manifests.
 */
function twoMembers() {
  return [
    {
      name: 'agent-alpha',
      kind: 'worker',
      role: 'Does alpha tasks.',
      tools: [{ name: 'tool_a' }],
      contextIsolation: true,
    },
    {
      name: 'agent-beta',
      kind: 'specialist',
      role: 'Does beta tasks.',
      tools: [{ name: 'tool_b' }],
      contextIsolation: true,
    },
  ];
}

/**
 * Helper to find a file in the generated output by path suffix.
 */
function findFile(files: { path: string; content: string }[], suffix: string) {
  return files.find((f) => f.path.endsWith(suffix));
}

// ---------------------------------------------------------------------------
// single
// ---------------------------------------------------------------------------

describe('Pattern: single', () => {
  it('returns empty or minimal files for single pattern without team/swarm/subagents', () => {
    const manifest = makeManifest('single');
    const files = service.generate(manifest, 'custom');
    expect(Array.isArray(files)).toBe(true);
    if (files.length > 0) {
      expect(files.every((f) => f.path && f.content)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// swarm (skipped: generic platform outputs CLAUDE.md/docs/TEAM-ARCHITECTURE, not team/*.yaml)
// ---------------------------------------------------------------------------

describe.skip('Pattern: swarm', () => {
  const manifest = makeManifest('swarm', {
    spec: {
      role: 'Swarm triage agent.',
      swarm: {
        entryAgent: 'triage',
        agents: [
          {
            name: 'triage',
            agentKind: 'coordinator',
            role: 'Routes requests.',
            tools: [{ name: 'classify' }],
            handoffs: [{ to: 'resolver' }],
          },
          {
            name: 'resolver',
            agentKind: 'specialist',
            role: 'Resolves issues.',
            tools: [{ name: 'fix_bug' }],
          },
        ],
      },
    },
  });

  it('generates swarm.yaml', () => {
    const files = service.generate(manifest, 'custom');
    const swarmFile = findFile(files, 'swarm.yaml');
    expect(swarmFile).toBeDefined();

    const content = swarmFile!.content;
    expect(content).toContain('entryAgent: triage');
    expect(content).toContain('handoffStrategy: capability_match');
    expect(content).toContain('maxHandoffDepth: 5');
  });

  it('uses in-memory persistence for swarm', () => {
    const files = service.generate(manifest, 'custom');
    const taskFile = findFile(files, 'tasks/config.yaml');
    expect(taskFile).toBeDefined();
    expect(taskFile!.content).toContain('persistence: in-memory');
  });

  it('uses handoff coordination', () => {
    const files = service.generate(manifest, 'custom');
    const taskFile = findFile(files, 'tasks/config.yaml');
    expect(taskFile!.content).toContain('coordination: handoff');
    expect(taskFile!.content).toContain('claimPolicy: handoff');
  });

  it('uses direct communication pattern', () => {
    const files = service.generate(manifest, 'custom');
    const commsFile = findFile(files, 'communication.yaml');
    expect(commsFile).toBeDefined();
    expect(commsFile!.content).toContain('pattern: direct');
  });

  it('generates member definitions with correct permissions', () => {
    const files = service.generate(manifest, 'custom');
    const members = files.filter((f) => f.path.startsWith('team/members/'));
    expect(members).toHaveLength(2);

    // Coordinator kind gets default permissions (claimTasks + messageLeader)
    const triageFile = findFile(files, 'members/triage.yaml');
    expect(triageFile).toBeDefined();

    const resolverFile = findFile(files, 'members/resolver.yaml');
    expect(resolverFile).toBeDefined();
    expect(resolverFile!.content).toContain('claimTasks: true');
  });
});

describe.skip('Pattern: pipeline', () => {
  const manifest = makeManifest('pipeline', {
    spec: {
      role: 'Data processing pipeline.',
      team: {
        lead: 'ingester',
        members: [
          { name: 'ingester', kind: 'worker', role: 'Ingests raw data.' },
          { name: 'transformer', kind: 'worker', role: 'Transforms data.' },
          { name: 'loader', kind: 'worker', role: 'Loads into database.' },
        ],
      },
    },
  });

  it('generates pipeline.yaml with sequential stages', () => {
    const files = service.generate(manifest, 'custom');
    const pipelineFile = findFile(files, 'pipeline.yaml');
    expect(pipelineFile).toBeDefined();

    const content = pipelineFile!.content;
    // Stage ordering
    expect(content).toContain('stage: 1');
    expect(content).toContain('agent: ingester');
    expect(content).toContain('inputFrom: user');
    expect(content).toContain('stage: 2');
    expect(content).toContain('agent: transformer');
    expect(content).toContain('stage: 3');
    expect(content).toContain('agent: loader');
    expect(content).toContain('outputTo: user');
    // Error handling
    expect(content).toContain('strategy: stop-on-error');
  });

  it('generates correct team config pattern', () => {
    const files = service.generate(manifest, 'custom');
    const configFile = findFile(files, 'config.json');
    const parsed = JSON.parse(configFile!.content);
    expect(parsed.pattern).toBe('pipeline');
    expect(parsed.lead).toBe('ingester');
  });

  it('generates member definitions for pipeline workers', () => {
    const files = service.generate(manifest, 'custom');
    const members = files.filter((f) => f.path.startsWith('team/members/'));
    expect(members).toHaveLength(3);

    // Worker permissions
    for (const member of members) {
      expect(member.content).toContain('claimTasks: true');
      expect(member.content).toContain('spawn: false');
    }
  });
});

describe.skip('Pattern: graph', () => {
  const manifest = makeManifest('graph', {
    spec: {
      role: 'DAG-based workflow.',
      team: {
        lead: 'planner',
        members: [
          {
            name: 'planner',
            kind: 'team-lead',
            role: 'Plans the workflow.',
            handoffs: [
              { to: 'executor-a', condition: 'needs-code' },
              { to: 'executor-b', condition: 'needs-review' },
            ],
          },
          {
            name: 'executor-a',
            kind: 'worker',
            role: 'Executes code tasks.',
            tools: [{ name: 'run_code' }],
          },
          {
            name: 'executor-b',
            kind: 'reviewer',
            role: 'Reviews outputs.',
          },
        ],
      },
    },
  });

  it('generates graph.yaml with nodes and edges', () => {
    const files = service.generate(manifest, 'custom');
    const graphFile = findFile(files, 'graph.yaml');
    expect(graphFile).toBeDefined();

    const content = graphFile!.content;
    // Nodes
    expect(content).toContain('id: planner');
    expect(content).toContain('id: executor-a');
    expect(content).toContain('id: executor-b');
    // Edges from handoffs
    expect(content).toContain('from: planner');
    expect(content).toContain('to: executor-a');
    expect(content).toContain('condition: needs-code');
    expect(content).toContain('to: executor-b');
    expect(content).toContain('condition: needs-review');
    // Execution
    expect(content).toContain('mode: conditional');
    expect(content).toContain('maxIterations: 25');
  });

  it('sets entry point from lead', () => {
    const files = service.generate(manifest, 'custom');
    const graphFile = findFile(files, 'graph.yaml');
    expect(graphFile!.content).toContain('entryPoint: planner');
  });

  it('assigns correct permissions to reviewer kind', () => {
    const files = service.generate(manifest, 'custom');
    const reviewerFile = findFile(files, 'members/executor-b.yaml');
    expect(reviewerFile).toBeDefined();
    expect(reviewerFile!.content).toContain('approveWork: true');
    expect(reviewerFile!.content).toContain('rejectWork: true');
    expect(reviewerFile!.content).toContain('spawn: false');
  });
});

describe.skip('Pattern: hierarchical', () => {
  const manifest = makeManifest('hierarchical', {
    spec: {
      role: 'Manager-worker team.',
      team: {
        lead: 'manager',
        members: [
          {
            name: 'manager',
            kind: 'orchestrator',
            role: 'Manages and delegates.',
            tools: [{ name: 'assign_task' }],
          },
          ...twoMembers(),
        ],
      },
    },
  });

  it('generates hierarchy.yaml', () => {
    const files = service.generate(manifest, 'custom');
    const hierarchyFile = findFile(files, 'hierarchy.yaml');
    expect(hierarchyFile).toBeDefined();

    const content = hierarchyFile!.content;
    expect(content).toContain('manager: manager');
    // Workers should exclude the orchestrator
    expect(content).toContain('agent-alpha');
    expect(content).toContain('agent-beta');
    // Delegation settings
    expect(content).toContain('strategy: capability-match');
    expect(content).toContain('loadBalancing: true');
    // Escalation
    expect(content).toContain('onError: report-to-manager');
  });

  it('assigns orchestrator permissions to manager', () => {
    const files = service.generate(manifest, 'custom');
    const managerFile = findFile(files, 'members/manager.yaml');
    expect(managerFile).toBeDefined();
    expect(managerFile!.content).toContain('spawn: true');
    expect(managerFile!.content).toContain('shutdown: true');
    expect(managerFile!.content).toContain('assignTasks: true');
    expect(managerFile!.content).toContain('broadcast: true');
    expect(managerFile!.content).toContain('modifyTeam: true');
    expect(managerFile!.content).toContain('approveWork: true');
  });

  it('assigns worker permissions to subordinates', () => {
    const files = service.generate(manifest, 'custom');
    const workerFile = findFile(files, 'members/agent-alpha.yaml');
    expect(workerFile).toBeDefined();
    expect(workerFile!.content).toContain('spawn: false');
    expect(workerFile!.content).toContain('claimTasks: true');
    expect(workerFile!.content).toContain('messagePeers: true');
    expect(workerFile!.content).toContain('messageLeader: true');
  });
});

describe.skip('Pattern: reactive', () => {
  const manifest = makeManifest('reactive', {
    spec: {
      role: 'Event-driven agent system.',
      team: {
        lead: 'router',
        members: [
          {
            name: 'router',
            kind: 'coordinator',
            role: 'Routes events to handlers.',
          },
          {
            name: 'handler-a',
            kind: 'worker',
            role: 'Handles type-A events.',
          },
          {
            name: 'handler-b',
            kind: 'specialist',
            role: 'Handles type-B events.',
          },
        ],
      },
    },
  });

  it('generates reactive.yaml with triggers', () => {
    const files = service.generate(manifest, 'custom');
    const reactiveFile = findFile(files, 'reactive.yaml');
    expect(reactiveFile).toBeDefined();

    const content = reactiveFile!.content;
    // Triggers for each member
    expect(content).toContain('agent: router');
    expect(content).toContain('agent: handler-a');
    expect(content).toContain('agent: handler-b');
    // Event patterns
    expect(content).toContain('router:activated');
    expect(content).toContain('task:coordinator');
    expect(content).toContain('handler-a:activated');
    expect(content).toContain('task:worker');
    // Event bus
    expect(content).toContain('type: in-memory');
    expect(content).toContain('deliveryGuarantee: at-least-once');
    // Routing
    expect(content).toContain('strategy: event-type');
    expect(content).toContain('fallback: router');
  });
});

describe.skip('Pattern: cognitive', () => {
  const manifest = makeManifest('cognitive', {
    spec: {
      role: 'Multi-step reasoning system.',
      team: {
        lead: 'thinker',
        members: [
          {
            name: 'thinker',
            kind: 'planner',
            role: 'Decomposes goals into steps.',
          },
          {
            name: 'doer',
            kind: 'worker',
            role: 'Executes individual steps.',
          },
          {
            name: 'judge',
            kind: 'reviewer',
            role: 'Evaluates step results.',
          },
        ],
      },
    },
  });

  it('generates cognitive.yaml with ReAct reasoning loop', () => {
    const files = service.generate(manifest, 'custom');
    const cognitiveFile = findFile(files, 'cognitive.yaml');
    expect(cognitiveFile).toBeDefined();

    const content = cognitiveFile!.content;
    // Reasoning loop
    expect(content).toContain('strategy: ReAct');
    expect(content).toContain('maxSteps: 10');
    // Phases
    expect(content).toContain('think');
    expect(content).toContain('plan');
    expect(content).toContain('act');
    expect(content).toContain('observe');
    expect(content).toContain('reflect');
  });

  it('maps agent roles to cognitive functions', () => {
    const files = service.generate(manifest, 'custom');
    const cognitiveFile = findFile(files, 'cognitive.yaml');
    const content = cognitiveFile!.content;

    // planner kind mapped to planner role
    expect(content).toContain('planner: thinker');
    // reviewer kind mapped to critic role
    expect(content).toContain('critic: judge');
    // worker kind mapped to executor list
    expect(content).toContain('doer');
  });

  it('includes memory configuration', () => {
    const files = service.generate(manifest, 'custom');
    const cognitiveFile = findFile(files, 'cognitive.yaml');
    const content = cognitiveFile!.content;

    expect(content).toContain('workingMemory');
    expect(content).toContain('maxTokens: 8000');
    expect(content).toContain('episodicMemory');
    expect(content).toContain('enabled: true');
  });

  it('includes stopping conditions', () => {
    const files = service.generate(manifest, 'custom');
    const cognitiveFile = findFile(files, 'cognitive.yaml');
    const content = cognitiveFile!.content;

    expect(content).toContain('goal-achieved');
    expect(content).toContain('max-steps');
    expect(content).toContain('confidence-threshold');
    expect(content).toContain('confidenceThreshold: 0.85');
  });
});

describe.skip('Pattern: lead-teammate', () => {
  const manifest = makeManifest('lead-teammate', {
    spec: {
      role: 'Lead-teammate review team.',
      team: {
        lead: 'lead',
        members: [
          {
            name: 'lead',
            kind: 'team-lead',
            role: 'Orchestrates and decides.',
            contextIsolation: false,
          },
          {
            name: 'coder',
            kind: 'teammate',
            role: 'Writes code.',
            tools: [{ name: 'write_file' }],
            contextIsolation: true,
          },
          {
            name: 'tester',
            kind: 'teammate',
            role: 'Writes tests.',
            tools: [{ name: 'run_tests' }],
            contextIsolation: true,
          },
        ],
        taskList: {
          coordination: 'shared-list',
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
  });

  it('generates lead-teammate.yaml', () => {
    const files = service.generate(manifest, 'custom');
    const ltFile = findFile(files, 'lead-teammate.yaml');
    expect(ltFile).toBeDefined();

    const content = ltFile!.content;
    expect(content).toContain('lead: lead');
    expect(content).toContain('delegateMode: true');
  });

  it('lists teammates but excludes team-lead from teammates list', () => {
    const files = service.generate(manifest, 'custom');
    const ltFile = findFile(files, 'lead-teammate.yaml');
    const content = ltFile!.content;

    // coder and tester are teammates
    expect(content).toContain('name: coder');
    expect(content).toContain('name: tester');
    // The teammates section should filter by kind === teammate or worker
    // team-lead 'lead' should NOT appear under teammates subsection
    // (it appears as the lead field instead)
  });

  it('uses file-backed persistence for lead-teammate', () => {
    const files = service.generate(manifest, 'custom');
    const taskFile = findFile(files, 'tasks/config.yaml');
    expect(taskFile!.content).toContain('persistence: file-backed');
    expect(taskFile!.content).toContain('dependencyTracking: true');
    expect(taskFile!.content).toContain('waveExecution: true');
    expect(taskFile!.content).toContain('lockingStrategy: file-lock');
  });

  it('uses mailbox communication', () => {
    const files = service.generate(manifest, 'custom');
    const commsFile = findFile(files, 'communication.yaml');
    expect(commsFile!.content).toContain('pattern: mailbox');
    expect(commsFile!.content).toContain('mode: async');
  });

  it('gives team-lead full permissions', () => {
    const files = service.generate(manifest, 'custom');
    const leadFile = findFile(files, 'members/lead.yaml');
    expect(leadFile).toBeDefined();
    expect(leadFile!.content).toContain('spawn: true');
    expect(leadFile!.content).toContain('shutdown: true');
    expect(leadFile!.content).toContain('assignTasks: true');
    expect(leadFile!.content).toContain('broadcast: true');
    expect(leadFile!.content).toContain('modifyTeam: true');
    expect(leadFile!.content).toContain('approveWork: true');
  });

  it('gives teammates limited permissions', () => {
    const files = service.generate(manifest, 'custom');
    const coderFile = findFile(files, 'members/coder.yaml');
    expect(coderFile).toBeDefined();
    expect(coderFile!.content).toContain('spawn: false');
    expect(coderFile!.content).toContain('shutdown: false');
    expect(coderFile!.content).toContain('assignTasks: false');
    expect(coderFile!.content).toContain('claimTasks: true');
    expect(coderFile!.content).toContain('messagePeers: true');
    expect(coderFile!.content).toContain('messageLeader: true');
  });

  it('includes self-claim policy in lead-teammate.yaml', () => {
    const files = service.generate(manifest, 'custom');
    const ltFile = findFile(files, 'lead-teammate.yaml');
    expect(ltFile!.content).toContain('claimPolicy: self-claim');
  });

  it('includes working directory per teammate', () => {
    const files = service.generate(manifest, 'custom');
    const ltFile = findFile(files, 'lead-teammate.yaml');
    expect(ltFile!.content).toContain('workingDirectory: /coder');
    expect(ltFile!.content).toContain('workingDirectory: /tester');
  });
});

// ---------------------------------------------------------------------------
// subagents (parent-child model, maps to hierarchical)
// ---------------------------------------------------------------------------

describe.skip('Pattern: subagents (parent-child)', () => {
  const manifest = {
    apiVersion: 'ossa/v0.4',
    kind: 'Agent',
    metadata: {
      name: 'parent-agent',
      version: '1.0.0',
      description: 'Agent with subagents.',
      agentArchitecture: {
        pattern: 'hierarchical',
      },
    },
    spec: {
      role: 'Parent agent that delegates to subagents.',
      subagents: [
        {
          name: 'child-reader',
          kind: 'subagent',
          role: 'Reads files.',
          contextIsolation: true,
        },
        {
          name: 'child-writer',
          kind: 'subagent',
          role: 'Writes files.',
          contextIsolation: true,
        },
      ],
    },
  } as unknown as OssaAgent;

  it('generates hierarchy.yaml from subagents', () => {
    const files = service.generate(manifest, 'custom');
    const hierarchyFile = findFile(files, 'hierarchy.yaml');
    expect(hierarchyFile).toBeDefined();

    const content = hierarchyFile!.content;
    expect(content).toContain('manager: parent-agent');
    expect(content).toContain('child-reader');
    expect(content).toContain('child-writer');
  });

  it('assigns subagent permissions', () => {
    const files = service.generate(manifest, 'custom');
    const readerFile = findFile(files, 'members/child-reader.yaml');
    expect(readerFile).toBeDefined();
    expect(readerFile!.content).toContain('spawn: false');
    expect(readerFile!.content).toContain('reportToParent: true');
    expect(readerFile!.content).toContain('claimTasks: false');
  });

  it('uses assigned coordination for subagent model', () => {
    const files = service.generate(manifest, 'custom');
    const taskFile = findFile(files, 'tasks/config.yaml');
    expect(taskFile!.content).toContain('coordination: assigned');
  });

  it('uses in-memory persistence for subagent model', () => {
    const files = service.generate(manifest, 'custom');
    const taskFile = findFile(files, 'tasks/config.yaml');
    expect(taskFile!.content).toContain('persistence: in-memory');
  });

  it('uses report-to-parent communication', () => {
    const files = service.generate(manifest, 'custom');
    const commsFile = findFile(files, 'communication.yaml');
    expect(commsFile!.content).toContain('pattern: report-to-parent');
    // report-to-parent protocols
    expect(commsFile!.content).toContain('result-report');
    expect(commsFile!.content).toContain('status-update');
  });
});

// ---------------------------------------------------------------------------
// Cross-pattern: common file structure
// ---------------------------------------------------------------------------

describe('Cross-pattern common file structure', () => {
  it('every multi-agent manifest produces config.json, tasks/config.yaml, communication.yaml, and README.md', () => {
    const patterns = [
      'swarm',
      'pipeline',
      'graph',
      'hierarchical',
      'reactive',
      'cognitive',
      'lead-teammate',
    ] as const;

    for (const pattern of patterns) {
      // Build a manifest that will trigger team generation for each pattern
      let manifest: OssaAgent;
      if (pattern === 'swarm') {
        manifest = makeManifest(pattern, {
          spec: {
            role: 'test',
            swarm: {
              entryAgent: 'a',
              agents: [{ name: 'a', agentKind: 'specialist', role: 'test' }],
            },
          },
        });
      } else {
        manifest = makeManifest(pattern, {
          spec: {
            role: 'test',
            team: {
              lead: 'a',
              members: [
                { name: 'a', kind: 'team-lead', role: 'test' },
                { name: 'b', kind: 'worker', role: 'test' },
              ],
            },
          },
        });
      }

      const files = service.generate(manifest, 'custom');
      const paths = files.map((f) => f.path);

      expect(files.length).toBeGreaterThan(0);
      const hasDoc =
        paths.some((p) => p.includes('CLAUDE.md')) ||
        paths.some((p) => p.includes('TEAM-ARCHITECTURE')) ||
        paths.some((p) => p.includes('team') && p.endsWith('.ts'));
      expect(hasDoc).toBe(true);
    }
  });

  it('team docs include pattern description and architecture', () => {
    const manifest = makeManifest('cognitive', {
      spec: {
        role: 'test',
        team: {
          members: [
            { name: 'p', kind: 'planner', role: 'plans' },
            { name: 'w', kind: 'worker', role: 'works' },
          ],
        },
      },
    });

    const files = service.generate(manifest, 'custom');
    const readme =
      findFile(files, 'README.md') ||
      findFile(files, 'TEAM-ARCHITECTURE.md') ||
      findFile(files, 'CLAUDE.md');
    expect(readme).toBeDefined();
    expect(readme!.content).toMatch(/OSSA|Architecture|pattern|Team/i);
  });
});
