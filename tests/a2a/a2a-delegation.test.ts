/**
 * A2A Delegation Tests
 *
 * Demonstrates:
 * - Agent delegating subtasks to specialized agents
 * - SLA negotiation between agents
 * - Task execution monitoring
 *
 * @module tests/a2a/a2a-delegation.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DelegationService,
  type Task,
  type Constraints,
} from '../../src/adapters/a2a/delegation.js';
import type { Agent } from '../../src/adapters/a2a/swarm-orchestration.js';
import type { AgentIdentity } from '../../src/adapters/a2a/a2a-protocol.js';

describe('A2A Task Delegation', () => {
  let delegationService: DelegationService;

  beforeEach(() => {
    delegationService = new DelegationService();
  });

  describe('Task Delegation', () => {
    it('should delegate task to most capable agent', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Code Review Task',
        description: 'Review pull request for security vulnerabilities',
        capabilities: ['code-review', 'security-analysis'],
        input: {
          repo: 'example/repo',
          prNumber: 123,
        },
        constraints: {
          maxExecutionTime: 300000, // 5 minutes
          requiredSLA: 0.95,
        },
        priority: 'high',
        createdAt: new Date().toISOString(),
      };

      const constraints: Constraints = {
        minSLA: 0.95,
        maxCost: 50,
      };

      const agents: Agent[] = [
        createAgent('security-expert', ['code-review', 'security-analysis'], 0.2, 0.8, 0.98),
        createAgent('junior-reviewer', ['code-review'], 0.5, 0.5, 0.85),
        createAgent('general-agent', ['code-review', 'security-analysis'], 0.7, 0.3, 0.90),
      ];

      const delegation = await delegationService.delegate(task, constraints, agents);

      expect(delegation).toBeDefined();
      expect(delegation.taskId).toBe(task.id);
      expect(delegation.agent.capabilities).toContain('code-review');
      expect(delegation.agent.capabilities).toContain('security-analysis');
      expect(delegation.status).toBe('pending');
      expect(delegation.score).toBeGreaterThan(0);

      // Should select security-expert (best SLA and low load)
      expect(delegation.agent.identity.name).toBe('security-expert');
    });

    it('should respect SLA constraints', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Critical Production Fix',
        description: 'Fix production bug immediately',
        capabilities: ['debugging', 'deployment'],
        input: {},
        constraints: {
          requiredSLA: 0.99, // Very high SLA required
        },
        priority: 'critical',
        createdAt: new Date().toISOString(),
      };

      const constraints: Constraints = {
        minSLA: 0.99,
      };

      const agents: Agent[] = [
        createAgent('reliable-agent', ['debugging', 'deployment'], 0.3, 0.7, 0.99),
        createAgent('unreliable-agent', ['debugging', 'deployment'], 0.1, 0.9, 0.80),
      ];

      const delegation = await delegationService.delegate(task, constraints, agents);

      // Should only select agent meeting SLA requirement
      expect(delegation.agent.identity.name).toBe('reliable-agent');
      expect(delegation.agent.metrics.successRate).toBeGreaterThanOrEqual(0.99);
    });

    it('should throw error when no suitable agents found', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Specialized Task',
        description: 'Task requiring rare capability',
        capabilities: ['quantum-computing'],
        input: {},
        constraints: {},
        priority: 'normal',
        createdAt: new Date().toISOString(),
      };

      const agents: Agent[] = [
        createAgent('regular-agent', ['code', 'test'], 0.5, 0.5, 0.95),
      ];

      await expect(
        delegationService.delegate(task, {}, agents)
      ).rejects.toThrow('No suitable agents found');
    });
  });

  describe('SLA Negotiation', () => {
    it('should negotiate SLA between agents', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Data Processing',
        description: 'Process large dataset',
        capabilities: ['data-processing'],
        input: {},
        constraints: {
          maxExecutionTime: 600000, // 10 minutes
        },
        priority: 'normal',
        createdAt: new Date().toISOString(),
      };

      const agent = createAgent('data-processor', ['data-processing'], 0.4, 0.6, 0.96);

      const sla = await delegationService.negotiateSLA(task, agent);

      expect(sla).toBeDefined();
      expect(sla.taskId).toBe(task.id);
      expect(sla.provider).toBe(agent.identity);
      expect(sla.availability).toBeGreaterThan(0);
      expect(sla.availability).toBeLessThanOrEqual(1);
      expect(sla.responseTime).toBeGreaterThan(0);
      expect(sla.cost).toBeGreaterThan(0);
      expect(sla.status).toBe('active');

      // Should include penalties
      expect(sla.penalties).toBeDefined();
      expect(sla.penalties?.availabilityPenalty).toBeGreaterThan(0);
      expect(sla.penalties?.responseTimePenalty).toBeGreaterThan(0);
      expect(sla.penalties?.errorRatePenalty).toBeGreaterThan(0);
    });

    it('should calculate SLA terms based on agent performance', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Test Task',
        description: 'Test',
        capabilities: ['test'],
        input: {},
        constraints: {},
        priority: 'normal',
        createdAt: new Date().toISOString(),
      };

      const highPerformanceAgent = createAgent('fast-agent', ['test'], 0.2, 0.8, 0.99);
      const lowPerformanceAgent = createAgent('slow-agent', ['test'], 0.7, 0.3, 0.85);

      const slaFast = await delegationService.negotiateSLA(task, highPerformanceAgent);
      const slaSlow = await delegationService.negotiateSLA(task, lowPerformanceAgent);

      // Fast agent should have better SLA terms
      expect(slaFast.availability).toBeGreaterThan(slaSlow.availability);
      expect(slaFast.responseTime).toBeLessThan(slaSlow.responseTime);
    });
  });

  describe('Execution Monitoring', () => {
    it('should monitor delegated task execution', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Monitored Task',
        description: 'Task with monitoring',
        capabilities: ['processing'],
        input: {},
        constraints: {},
        priority: 'normal',
        createdAt: new Date().toISOString(),
      };

      const agent = createAgent('processor', ['processing'], 0.5, 0.5, 0.95);

      const delegation = await delegationService.delegate(task, {}, [agent]);

      // Monitor execution
      const status = delegationService.monitor(delegation.id);

      expect(status).toBeDefined();
      expect(status.delegationId).toBe(delegation.id);
      expect(status.taskId).toBe(task.id);
      expect(status.state).toBe('queued');
      expect(status.progress).toBe(0);
    });

    it('should update execution status', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Updateable Task',
        description: 'Task with status updates',
        capabilities: ['work'],
        input: {},
        constraints: {},
        priority: 'normal',
        createdAt: new Date().toISOString(),
      };

      const agent = createAgent('worker', ['work'], 0.3, 0.7, 0.95);

      const delegation = await delegationService.delegate(task, {}, [agent]);

      // Start execution
      delegationService.updateExecution(delegation.id, {
        state: 'running',
        progress: 0.5,
        startedAt: new Date().toISOString(),
      });

      const status = delegationService.monitor(delegation.id);

      expect(status.state).toBe('running');
      expect(status.progress).toBe(0.5);
      expect(status.startedAt).toBeDefined();

      // Complete execution
      delegationService.updateExecution(delegation.id, {
        state: 'completed',
        progress: 1.0,
        completedAt: new Date().toISOString(),
        duration: 30000,
        result: { success: true },
      });

      const finalStatus = delegationService.monitor(delegation.id);

      expect(finalStatus.state).toBe('completed');
      expect(finalStatus.progress).toBe(1.0);
      expect(finalStatus.completedAt).toBeDefined();
      expect(finalStatus.result).toEqual({ success: true });
    });

    it('should detect SLA violations', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'SLA Task',
        description: 'Task with SLA',
        capabilities: ['work'],
        input: {},
        constraints: {
          maxExecutionTime: 10000, // 10 seconds
        },
        priority: 'high',
        createdAt: new Date().toISOString(),
      };

      const agent = createAgent('slow-worker', ['work'], 0.6, 0.4, 0.90);

      const delegation = await delegationService.delegate(task, {}, [agent]);

      // Simulate slow execution (exceeds response time SLA)
      delegationService.updateExecution(delegation.id, {
        state: 'running',
        startedAt: new Date(Date.now() - 60000).toISOString(), // Started 1 min ago
        progress: 0.8,
      });

      delegationService.updateExecution(delegation.id, {
        state: 'completed',
        completedAt: new Date().toISOString(),
        duration: 60000, // 1 minute (exceeds max execution time)
        progress: 1.0,
      });

      // Check for violations
      const violations = delegationService.getViolations(delegation.sla.id);

      expect(violations.length).toBeGreaterThan(0);
      expect(violations.some((v) => v.type === 'response-time')).toBe(true);
    });

    it('should track failed executions', async () => {
      const task: Task = {
        id: crypto.randomUUID(),
        name: 'Failing Task',
        description: 'Task that fails',
        capabilities: ['unstable'],
        input: {},
        constraints: {},
        priority: 'normal',
        createdAt: new Date().toISOString(),
      };

      const agent = createAgent('unstable-agent', ['unstable'], 0.5, 0.5, 0.85);

      const delegation = await delegationService.delegate(task, {}, [agent]);

      // Simulate failure
      delegationService.updateExecution(delegation.id, {
        state: 'failed',
        progress: 0.3,
        error: {
          code: 'EXECUTION_ERROR',
          message: 'Task execution failed',
          details: { reason: 'Resource exhausted' },
        },
      });

      const status = delegationService.monitor(delegation.id);
      const violations = delegationService.getViolations(delegation.sla.id);

      expect(status.state).toBe('failed');
      expect(status.error).toBeDefined();
      expect(status.error?.code).toBe('EXECUTION_ERROR');
      expect(violations.some((v) => v.type === 'error-rate')).toBe(true);
    });
  });

  describe('Delegation History', () => {
    it('should track all delegations', async () => {
      const tasks: Task[] = [
        createTask('task-1', ['capability-1']),
        createTask('task-2', ['capability-2']),
        createTask('task-3', ['capability-3']),
      ];

      const agents: Agent[] = [
        createAgent('agent-1', ['capability-1'], 0.3, 0.7, 0.95),
        createAgent('agent-2', ['capability-2'], 0.4, 0.6, 0.93),
        createAgent('agent-3', ['capability-3'], 0.2, 0.8, 0.97),
      ];

      for (const task of tasks) {
        await delegationService.delegate(task, {}, agents);
      }

      const allDelegations = delegationService.getAllDelegations();

      expect(allDelegations.length).toBe(3);
    });

    it('should retrieve delegation by ID', async () => {
      const task = createTask('test-task', ['test']);
      const agent = createAgent('test-agent', ['test'], 0.5, 0.5, 0.95);

      const delegation = await delegationService.delegate(task, {}, [agent]);
      const retrieved = delegationService.getDelegation(delegation.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(delegation.id);
      expect(retrieved?.taskId).toBe(task.id);
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
  capacity: number,
  successRate: number
): Agent {
  return {
    identity: createAgentIdentity(name),
    capabilities,
    load,
    capacity,
    status: 'available',
    metrics: {
      avgCompletionTime: 60000,
      successRate,
      tasksCompleted: Math.floor(Math.random() * 100),
    },
  };
}

function createTask(id: string, capabilities: string[]): Task {
  return {
    id: crypto.randomUUID(),
    name: `Task ${id}`,
    description: `Test task ${id}`,
    capabilities,
    input: {},
    constraints: {},
    priority: 'normal',
    createdAt: new Date().toISOString(),
  };
}
