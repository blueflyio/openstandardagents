/**
 * A2A Swarm Intelligence Tests
 *
 * Demonstrates:
 * - Agent swarm coordinating on complex tasks
 * - Task decomposition and load balancing
 * - Consensus building among agents
 * - Emergent swarm behavior
 *
 * @module tests/a2a/a2a-swarm.test
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SwarmOrchestrator,
  type ComplexTask,
  type Agent,
  type Proposal,
} from '../../src/adapters/a2a/swarm-orchestration.js';
import { MessagePriority, type AgentIdentity } from '../../src/adapters/a2a/a2a-protocol.js';

describe('A2A Swarm Intelligence', () => {
  let swarm: SwarmOrchestrator;

  beforeEach(() => {
    swarm = new SwarmOrchestrator({
      maxSize: 10,
      minSize: 2,
      autoScaling: true,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.2,
      maxQueueSize: 100,
      coordinationStrategy: 'hybrid',
    });
  });

  describe('Task Decomposition', () => {
    it('should decompose complex task into agent subtasks', () => {
      const complexTask: ComplexTask = {
        id: crypto.randomUUID(),
        name: 'Build Multi-Agent System',
        description: 'Create a comprehensive multi-agent communication system',
        requirements: {
          capabilities: [
            'code-generation',
            'testing',
            'documentation',
            'deployment',
          ],
          minAgents: 3,
          maxAgents: 10,
          resources: {
            cpu: 4,
            memory: 8192,
            gpu: false,
          },
        },
        constraints: {
          maxExecutionTime: 3600000, // 1 hour
          maxCost: 100,
          requiredSLA: 0.95,
        },
        priority: MessagePriority.HIGH,
      };

      const subtasks = swarm.decomposeTask(complexTask);

      expect(subtasks).toBeDefined();
      expect(subtasks.length).toBeGreaterThan(0);
      expect(subtasks.length).toBeLessThanOrEqual(complexTask.requirements.capabilities.length + 1);

      // Verify subtasks have proper structure
      for (const subtask of subtasks) {
        expect(subtask.id).toBeDefined();
        expect(subtask.parentId).toBe(complexTask.id);
        expect(subtask.capabilities.length).toBeGreaterThan(0);
        expect(subtask.priority).toBe(complexTask.priority);
      }
    });

    it('should use parallel decomposition for medium complexity', () => {
      const task: ComplexTask = {
        id: crypto.randomUUID(),
        name: 'Parallel Processing Task',
        description: 'Task with independent subtasks',
        requirements: {
          capabilities: ['analyze', 'transform', 'validate'],
          minAgents: 3,
        },
        constraints: {},
        priority: MessagePriority.NORMAL,
      };

      const subtasks = swarm.decomposeTask(task);

      // Parallel tasks should have no dependencies
      const independentTasks = subtasks.filter(
        (t) => t.dependencies.length === 0
      );
      expect(independentTasks.length).toBeGreaterThan(0);
    });

    it('should use hierarchical decomposition for high complexity', () => {
      const task: ComplexTask = {
        id: crypto.randomUUID(),
        name: 'Complex Hierarchical Task',
        description: 'Task requiring coordinator',
        requirements: {
          capabilities: ['coord', 'exec1', 'exec2', 'exec3', 'exec4', 'exec5'],
          minAgents: 5,
        },
        constraints: {
          maxExecutionTime: 7200000,
        },
        priority: MessagePriority.URGENT,
      };

      const subtasks = swarm.decomposeTask(task);

      // Should have coordinator task
      const coordinatorTask = subtasks.find((t) =>
        t.capabilities.includes('coordination')
      );
      expect(coordinatorTask).toBeDefined();

      // Other tasks should depend on coordinator
      const dependentTasks = subtasks.filter((t) =>
        t.dependencies.includes(coordinatorTask?.id || '')
      );
      expect(dependentTasks.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancing', () => {
    it('should balance load across agent pool', () => {
      // Create agent pool
      const agents: Agent[] = [
        createAgent('agent-1', ['code-generation'], 0.2, 0.8),
        createAgent('agent-2', ['testing'], 0.5, 0.5),
        createAgent('agent-3', ['documentation'], 0.1, 0.9),
        createAgent('agent-4', ['deployment'], 0.7, 0.3),
      ];

      // Register agents
      for (const agent of agents) {
        swarm.registerAgent(agent);
      }

      // Create tasks
      const tasks = [
        createTask('task-1', ['code-generation'], 60000),
        createTask('task-2', ['testing'], 45000),
        createTask('task-3', ['documentation'], 30000),
        createTask('task-4', ['deployment'], 90000),
      ];

      // Balance load
      const assignments = swarm.balanceLoad(tasks, agents);

      expect(assignments).toBeDefined();
      expect(assignments.length).toBe(tasks.length);

      // Verify all tasks are assigned
      const assignedTaskIds = new Set(assignments.map((a) => a.taskId));
      for (const task of tasks) {
        expect(assignedTaskIds.has(task.id)).toBe(true);
      }

      // Verify assignments have scores
      for (const assignment of assignments) {
        expect(assignment.score).toBeGreaterThan(0);
        expect(assignment.score).toBeLessThanOrEqual(1);
      }
    });

    it('should prioritize high-priority tasks', () => {
      const agents: Agent[] = [
        createAgent('agent-1', ['general'], 0.5, 0.5),
      ];

      for (const agent of agents) {
        swarm.registerAgent(agent);
      }

      const tasks = [
        createTask('low', ['general'], 30000, 'low'),
        createTask('critical', ['general'], 30000, 'critical'),
        createTask('normal', ['general'], 30000, 'normal'),
      ];

      const assignments = swarm.balanceLoad(tasks, agents);

      // Critical task should be assigned first
      expect(assignments[0].taskId).toBe(tasks[1].id);
    });

    it('should match capabilities when assigning tasks', () => {
      const agents: Agent[] = [
        createAgent('specialist', ['database'], 0.3, 0.7),
        createAgent('generalist', ['database', 'api'], 0.5, 0.5),
      ];

      for (const agent of agents) {
        swarm.registerAgent(agent);
      }

      const task = createTask('db-task', ['database'], 60000);

      const assignments = swarm.balanceLoad([task], agents);

      expect(assignments.length).toBe(1);
      expect(assignments[0].agent.capabilities).toContain('database');
    });
  });

  describe('Consensus Building', () => {
    it('should build consensus among agents', async () => {
      // Create proposals
      const proposals: Proposal[] = [
        {
          id: crypto.randomUUID(),
          proposer: createAgentIdentity('proposer-1'),
          type: 'task-assignment',
          data: { taskId: 'task-1', agentId: 'agent-1' },
          votes: [
            {
              voter: createAgentIdentity('voter-1'),
              value: 'approve',
              weight: 1,
              votedAt: new Date().toISOString(),
            },
            {
              voter: createAgentIdentity('voter-2'),
              value: 'approve',
              weight: 1,
              votedAt: new Date().toISOString(),
            },
            {
              voter: createAgentIdentity('voter-3'),
              value: 'reject',
              weight: 1,
              votedAt: new Date().toISOString(),
            },
          ],
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      const results = await swarm.buildConsensus(proposals);

      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].reached).toBe(true);
      expect(results[0].decision).toBe('accepted'); // 2 approve vs 1 reject
    });

    it('should reject proposal with majority rejections', async () => {
      const proposals: Proposal[] = [
        {
          id: crypto.randomUUID(),
          proposer: createAgentIdentity('proposer-1'),
          type: 'resource-allocation',
          data: { resource: 'gpu', amount: 4 },
          votes: [
            {
              voter: createAgentIdentity('voter-1'),
              value: 'reject',
              weight: 1,
              votedAt: new Date().toISOString(),
            },
            {
              voter: createAgentIdentity('voter-2'),
              value: 'reject',
              weight: 1,
              votedAt: new Date().toISOString(),
            },
            {
              voter: createAgentIdentity('voter-3'),
              value: 'approve',
              weight: 1,
              votedAt: new Date().toISOString(),
            },
          ],
          status: 'pending',
          createdAt: new Date().toISOString(),
        },
      ];

      const results = await swarm.buildConsensus(proposals);

      expect(results[0].decision).toBe('rejected');
    });
  });

  describe('Swarm Adaptation', () => {
    it('should adapt swarm configuration based on metrics', () => {
      const metrics = {
        totalAgents: 5,
        activeAgents: 5,
        avgLoad: 0.85, // High load - should scale up
        tasksInProgress: 10,
        tasksCompleted: 100,
        avgCompletionTime: 60000,
        successRate: 0.95,
        timestamp: new Date().toISOString(),
      };

      const newConfig = swarm.adaptSwarm(metrics);

      // Should increase max size due to high load
      expect(newConfig.maxSize).toBeGreaterThan(10);
    });

    it('should scale down when load is low', () => {
      const metrics = {
        totalAgents: 10,
        activeAgents: 10,
        avgLoad: 0.15, // Low load - should scale down
        tasksInProgress: 2,
        tasksCompleted: 100,
        avgCompletionTime: 30000,
        successRate: 0.98,
        timestamp: new Date().toISOString(),
      };

      const newConfig = swarm.adaptSwarm(metrics);

      // Should decrease max size due to low load
      expect(newConfig.maxSize).toBeLessThan(10);
    });

    it('should adjust coordination strategy based on swarm size', () => {
      // Small swarm - should use centralized
      const smallMetrics = {
        totalAgents: 5,
        activeAgents: 5,
        avgLoad: 0.5,
        tasksInProgress: 5,
        tasksCompleted: 50,
        avgCompletionTime: 45000,
        successRate: 0.96,
        timestamp: new Date().toISOString(),
      };

      const configSmall = swarm.adaptSwarm(smallMetrics);
      expect(configSmall.coordinationStrategy).toBe('centralized');

      // Large swarm - should use decentralized
      const largeMetrics = {
        totalAgents: 60,
        activeAgents: 55,
        avgLoad: 0.7,
        tasksInProgress: 40,
        tasksCompleted: 500,
        avgCompletionTime: 50000,
        successRate: 0.94,
        timestamp: new Date().toISOString(),
      };

      const configLarge = swarm.adaptSwarm(largeMetrics);
      expect(configLarge.coordinationStrategy).toBe('decentralized');
    });
  });

  describe('Swarm Metrics', () => {
    it('should calculate swarm metrics', () => {
      // Register agents
      const agents: Agent[] = [
        createAgent('agent-1', ['code'], 0.4, 0.6),
        createAgent('agent-2', ['test'], 0.6, 0.4),
        createAgent('agent-3', ['docs'], 0.2, 0.8),
      ];

      for (const agent of agents) {
        swarm.registerAgent(agent);
      }

      const metrics = swarm.getMetrics();

      expect(metrics.totalAgents).toBe(3);
      expect(metrics.activeAgents).toBeGreaterThanOrEqual(0);
      expect(metrics.avgLoad).toBeGreaterThan(0);
      expect(metrics.avgCompletionTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.timestamp).toBeDefined();
    });
  });
});

// Helper functions

function createAgentIdentity(name: string): AgentIdentity {
  return {
    id: crypto.randomUUID(),
    namespace: 'test',
    name,
    uri: `agent://test/${name}`,
    capabilities: [],
    version: '1.0.0',
  };
}

function createAgent(
  name: string,
  capabilities: string[],
  load: number,
  capacity: number
): Agent {
  return {
    identity: createAgentIdentity(name),
    capabilities,
    load,
    capacity,
    status: 'available',
    metrics: {
      avgCompletionTime: 60000,
      successRate: 0.95,
      tasksCompleted: 10,
    },
  };
}

function createTask(
  id: string,
  capabilities: string[],
  duration: number,
  priority: MessagePriority.LOW | 'normal' | 'high' | 'urgent' | 'critical' = 'normal'
) {
  return {
    id,
    parentId: 'parent-task',
    name: `Task ${id}`,
    description: `Test task ${id}`,
    capabilities,
    input: {},
    dependencies: [],
    estimatedDuration: duration,
    priority,
  };
}
