/**
 * Task Delegation Service
 *
 * Intelligent task delegation between agents with SLA negotiation
 * and execution monitoring
 *
 * @module adapters/a2a/delegation
 */

import type { AgentIdentity } from './a2a-protocol.js';
import type { Agent, AgentTask } from './swarm-orchestration.js';

/**
 * Task Definition
 */
export interface Task {
  /** Task ID */
  id: string;
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Required capabilities */
  capabilities: string[];
  /** Task input data */
  input: unknown;
  /** Task constraints */
  constraints: DelegationTaskConstraints;
  /** Task priority */
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical';
  /** Created timestamp */
  createdAt: string;
  /** Deadline (ISO 8601) */
  deadline?: string;
}

/**
 * Delegation Task Constraints
 */
export interface DelegationTaskConstraints {
  /** Maximum execution time (milliseconds) */
  maxExecutionTime?: number;
  /** Maximum cost (arbitrary units) */
  maxCost?: number;
  /** Required SLA (0-1) */
  requiredSLA?: number;
  /** Required data locality */
  dataLocality?: string;
  /** Security level */
  securityLevel?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Constraints for delegation
 */
export interface Constraints {
  /** Maximum cost */
  maxCost?: number;
  /** Required SLA (0-1) */
  minSLA?: number;
  /** Preferred region */
  region?: string;
  /** Required capabilities */
  capabilities?: string[];
  /** Maximum latency (milliseconds) */
  maxLatency?: number;
  /** Data locality requirements */
  dataLocality?: string;
}

/**
 * Service Level Agreement
 */
export interface SLA {
  /** Agreement ID */
  id: string;
  /** Task ID */
  taskId: string;
  /** Provider agent */
  provider: AgentIdentity;
  /** Consumer agent */
  consumer: AgentIdentity;
  /** Availability guarantee (0-1) */
  availability: number;
  /** Response time guarantee (milliseconds) */
  responseTime: number;
  /** Throughput guarantee (tasks/second) */
  throughput: number;
  /** Error rate threshold (0-1) */
  errorRate: number;
  /** Cost per task */
  cost: number;
  /** Agreement start time */
  startTime: string;
  /** Agreement end time */
  endTime: string;
  /** Penalties for SLA violations */
  penalties?: {
    availabilityPenalty?: number;
    responseTimePenalty?: number;
    errorRatePenalty?: number;
  };
  /** SLA status */
  status: 'proposed' | 'negotiating' | 'active' | 'violated' | 'expired';
}

/**
 * Delegation Result
 */
export interface DelegationResult {
  /** Delegation ID */
  id: string;
  /** Task ID */
  taskId: string;
  /** Selected agent */
  agent: Agent;
  /** Negotiated SLA */
  sla: SLA;
  /** Delegation score (0-1, higher is better) */
  score: number;
  /** Estimated completion time */
  estimatedCompletion: string;
  /** Delegation status */
  status:
    | 'pending'
    | 'accepted'
    | 'rejected'
    | 'executing'
    | 'completed'
    | 'failed';
  /** Created timestamp */
  createdAt: string;
  /** Updated timestamp */
  updatedAt: string;
}

/**
 * Execution Status
 */
export interface ExecutionStatus {
  /** Delegation ID */
  delegationId: string;
  /** Task ID */
  taskId: string;
  /** Execution state */
  state: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  /** Progress (0-1) */
  progress: number;
  /** Current step */
  currentStep?: string;
  /** Started timestamp */
  startedAt?: string;
  /** Completed timestamp */
  completedAt?: string;
  /** Duration (milliseconds) */
  duration?: number;
  /** Result data */
  result?: unknown;
  /** Error information */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  /** Metrics */
  metrics?: {
    /** CPU usage (0-1) */
    cpuUsage?: number;
    /** Memory usage (bytes) */
    memoryUsage?: number;
    /** Network I/O (bytes) */
    networkIO?: number;
  };
  /** Checkpoints for resume */
  checkpoints?: {
    id: string;
    timestamp: string;
    state: unknown;
  }[];
}

/**
 * SLA Violation
 */
export interface SLAViolation {
  /** Violation ID */
  id: string;
  /** SLA ID */
  slaId: string;
  /** Violation type */
  type: 'availability' | 'response-time' | 'error-rate' | 'throughput';
  /** Violation severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Actual value */
  actualValue: number;
  /** Expected value */
  expectedValue: number;
  /** Violation timestamp */
  timestamp: string;
  /** Penalty applied */
  penalty?: number;
}

/**
 * Delegation Service
 * Handles intelligent task delegation between agents
 */
export class DelegationService {
  private delegations: Map<string, DelegationResult> = new Map();
  private slas: Map<string, SLA> = new Map();
  private executions: Map<string, ExecutionStatus> = new Map();
  private violations: Map<string, SLAViolation[]> = new Map();

  /**
   * Delegate task to most capable agent
   */
  async delegate(
    task: Task,
    constraints: Constraints,
    agents: Agent[]
  ): Promise<DelegationResult> {
    // Find suitable agents
    const suitableAgents = this.findSuitableAgents(task, constraints, agents);

    if (suitableAgents.length === 0) {
      throw new Error('No suitable agents found for task delegation');
    }

    // Score each agent
    const scoredAgents = suitableAgents.map((agent) => ({
      agent,
      score: this.scoreAgent(agent, task, constraints),
    }));

    // Sort by score (descending)
    scoredAgents.sort((a, b) => b.score - a.score);

    // Select best agent
    const bestAgent = scoredAgents[0].agent;

    // Negotiate SLA
    const sla = await this.negotiateSLA(task, bestAgent);

    // Create delegation
    const delegation: DelegationResult = {
      id: crypto.randomUUID(),
      taskId: task.id,
      agent: bestAgent,
      sla,
      score: scoredAgents[0].score,
      estimatedCompletion: this.calculateEstimatedCompletion(task, bestAgent),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.delegations.set(delegation.id, delegation);
    this.slas.set(sla.id, sla);

    // Initialize execution status
    const execution: ExecutionStatus = {
      delegationId: delegation.id,
      taskId: task.id,
      state: 'queued',
      progress: 0,
    };

    this.executions.set(delegation.id, execution);

    return delegation;
  }

  /**
   * Negotiate SLA between agents
   */
  async negotiateSLA(task: Task, agent: Agent): Promise<SLA> {
    const slaId = crypto.randomUUID();

    // Calculate SLA terms based on agent capabilities and task requirements
    const availability = Math.min(agent.metrics.successRate, 0.999);
    const responseTime = agent.metrics.avgCompletionTime * 1.2; // 20% buffer
    const throughput = 1 / (agent.metrics.avgCompletionTime / 1000); // tasks per second
    const errorRate = 1 - agent.metrics.successRate;
    const cost = this.calculateCost(task, agent);

    const sla: SLA = {
      id: slaId,
      taskId: task.id,
      provider: agent.identity,
      consumer: {
        id: 'consumer',
        namespace: 'default',
        name: 'consumer',
        uri: 'uadp://default/consumer',
        capabilities: [],
        version: '1.0.0',
      },
      availability,
      responseTime,
      throughput,
      errorRate,
      cost,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      penalties: {
        availabilityPenalty: cost * 0.1,
        responseTimePenalty: cost * 0.05,
        errorRatePenalty: cost * 0.15,
      },
      status: 'active',
    };

    return sla;
  }

  /**
   * Monitor delegated task execution
   */
  monitor(delegationId: string): ExecutionStatus {
    const execution = this.executions.get(delegationId);

    if (!execution) {
      throw new Error(`Execution not found: ${delegationId}`);
    }

    // Check for SLA violations
    this.checkSLAViolations(delegationId);

    return execution;
  }

  /**
   * Update execution status
   */
  updateExecution(
    delegationId: string,
    updates: Partial<ExecutionStatus>
  ): void {
    const execution = this.executions.get(delegationId);

    if (!execution) {
      throw new Error(`Execution not found: ${delegationId}`);
    }

    Object.assign(execution, updates);

    // Update delegation status
    const delegation = this.delegations.get(delegationId);
    if (delegation) {
      if (execution.state === 'completed') {
        delegation.status = 'completed';
      } else if (execution.state === 'failed') {
        delegation.status = 'failed';
      } else if (execution.state === 'running') {
        delegation.status = 'executing';
      }
      delegation.updatedAt = new Date().toISOString();
    }

    // Check for SLA violations
    this.checkSLAViolations(delegationId);
  }

  /**
   * Get delegation by ID
   */
  getDelegation(delegationId: string): DelegationResult | undefined {
    return this.delegations.get(delegationId);
  }

  /**
   * Get all delegations
   */
  getAllDelegations(): DelegationResult[] {
    return Array.from(this.delegations.values());
  }

  /**
   * Get SLA violations
   */
  getViolations(slaId: string): SLAViolation[] {
    return this.violations.get(slaId) || [];
  }

  // Private helper methods

  private findSuitableAgents(
    task: Task,
    constraints: Constraints,
    agents: Agent[]
  ): Agent[] {
    return agents.filter((agent) => {
      // Check capabilities
      const hasCapabilities = task.capabilities.every((cap) =>
        agent.capabilities.includes(cap)
      );

      // Check availability
      const isAvailable = agent.status === 'available';

      // Check SLA requirement
      const meetsSLA =
        !constraints.minSLA || agent.metrics.successRate >= constraints.minSLA;

      // Check capacity
      const hasCapacity = agent.capacity > 0.1;

      return hasCapabilities && isAvailable && meetsSLA && hasCapacity;
    });
  }

  private scoreAgent(
    agent: Agent,
    task: Task,
    constraints: Constraints
  ): number {
    let score = 0;

    // Success rate (0-0.4)
    score += agent.metrics.successRate * 0.4;

    // Capacity (0-0.3)
    score += agent.capacity * 0.3;

    // Performance (0-0.2)
    const performanceScore =
      1 - Math.min(agent.metrics.avgCompletionTime / 300000, 1); // Normalize to 5 min
    score += performanceScore * 0.2;

    // Load (0-0.1) - prefer less loaded
    score += (1 - agent.load) * 0.1;

    return Math.min(score, 1);
  }

  private calculateCost(task: Task, agent: Agent): number {
    // Simple cost calculation (can be enhanced)
    const baseCost = 10;
    const complexityMultiplier = task.capabilities.length;
    const performanceMultiplier = agent.metrics.avgCompletionTime / 60000; // per minute

    return baseCost * complexityMultiplier * performanceMultiplier;
  }

  private calculateEstimatedCompletion(task: Task, agent: Agent): string {
    const estimatedDuration = agent.metrics.avgCompletionTime * 1.2; // 20% buffer
    const completionTime = new Date(Date.now() + estimatedDuration);
    return completionTime.toISOString();
  }

  private checkSLAViolations(delegationId: string): void {
    const delegation = this.delegations.get(delegationId);
    const execution = this.executions.get(delegationId);
    const sla = delegation ? this.slas.get(delegation.sla.id) : undefined;

    if (!delegation || !execution || !sla) {
      return;
    }

    const violations: SLAViolation[] = [];

    // Check response time violation
    if (execution.duration && execution.duration > sla.responseTime) {
      violations.push({
        id: crypto.randomUUID(),
        slaId: sla.id,
        type: 'response-time',
        severity: 'medium',
        actualValue: execution.duration,
        expectedValue: sla.responseTime,
        timestamp: new Date().toISOString(),
        penalty: sla.penalties?.responseTimePenalty,
      });
    }

    // Check error rate violation (if failed)
    if (execution.state === 'failed') {
      violations.push({
        id: crypto.randomUUID(),
        slaId: sla.id,
        type: 'error-rate',
        severity: 'high',
        actualValue: 1,
        expectedValue: sla.errorRate,
        timestamp: new Date().toISOString(),
        penalty: sla.penalties?.errorRatePenalty,
      });
    }

    if (violations.length > 0) {
      sla.status = 'violated';
      this.violations.set(sla.id, violations);
    }
  }
}
