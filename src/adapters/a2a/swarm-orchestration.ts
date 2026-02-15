/**
 * Swarm Intelligence Orchestration
 *
 * Multi-agent swarm coordination for complex task decomposition
 * and distributed execution
 *
 * @module adapters/a2a/swarm-orchestration
 */

import type {
  AgentIdentity,
  A2AMessage,
  MessagePriority,
} from './a2a-protocol.js';

/**
 * Complex Task Definition
 */
export interface ComplexTask {
  /** Task ID */
  id: string;
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Task requirements */
  requirements: TaskRequirements;
  /** Task constraints */
  constraints: TaskConstraints;
  /** Task priority */
  priority: MessagePriority;
  /** Task deadline (ISO 8601) */
  deadline?: string;
  /** Task metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Task Requirements
 */
export interface TaskRequirements {
  /** Required capabilities */
  capabilities: string[];
  /** Minimum number of agents */
  minAgents?: number;
  /** Maximum number of agents */
  maxAgents?: number;
  /** Required resources */
  resources?: {
    /** CPU cores */
    cpu?: number;
    /** Memory in MB */
    memory?: number;
    /** Disk space in MB */
    disk?: number;
    /** GPU required */
    gpu?: boolean;
  };
}

/**
 * Task Constraints
 */
export interface TaskConstraints {
  /** Maximum execution time (milliseconds) */
  maxExecutionTime?: number;
  /** Maximum cost (arbitrary units) */
  maxCost?: number;
  /** Required SLA (0-1) */
  requiredSLA?: number;
  /** Affinity rules (must co-locate) */
  affinity?: string[];
  /** Anti-affinity rules (must not co-locate) */
  antiAffinity?: string[];
}

/**
 * Agent Task (Subtask)
 */
export interface AgentTask {
  /** Task ID */
  id: string;
  /** Parent task ID */
  parentId: string;
  /** Task name */
  name: string;
  /** Task description */
  description: string;
  /** Required capabilities */
  capabilities: string[];
  /** Task input data */
  input: unknown;
  /** Expected output schema */
  outputSchema?: Record<string, unknown>;
  /** Task dependencies (must complete first) */
  dependencies: string[];
  /** Estimated execution time (milliseconds) */
  estimatedDuration: number;
  /** Task priority */
  priority: MessagePriority;
}

/**
 * Agent (for task assignment)
 */
export interface Agent {
  /** Agent identity */
  identity: AgentIdentity;
  /** Agent capabilities */
  capabilities: string[];
  /** Current load (0-1) */
  load: number;
  /** Available capacity (0-1) */
  capacity: number;
  /** Agent status */
  status: 'available' | 'busy' | 'offline';
  /** Performance metrics */
  metrics: {
    /** Average task completion time (milliseconds) */
    avgCompletionTime: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Total tasks completed */
    tasksCompleted: number;
  };
}

/**
 * Task Assignment
 */
export interface TaskAssignment {
  /** Task ID */
  taskId: string;
  /** Assigned agent */
  agent: Agent;
  /** Assignment timestamp */
  assignedAt: string;
  /** Expected completion time */
  expectedCompletion: string;
  /** Assignment score (0-1, higher is better) */
  score: number;
}

/**
 * Proposal (for consensus)
 */
export interface Proposal {
  /** Proposal ID */
  id: string;
  /** Proposer agent */
  proposer: AgentIdentity;
  /** Proposal type */
  type: 'task-assignment' | 'resource-allocation' | 'strategy-change';
  /** Proposal data */
  data: unknown;
  /** Votes received */
  votes: Vote[];
  /** Proposal status */
  status: 'pending' | 'accepted' | 'rejected';
  /** Created timestamp */
  createdAt: string;
}

/**
 * Vote
 */
export interface Vote {
  /** Voter agent */
  voter: AgentIdentity;
  /** Vote value */
  value: 'approve' | 'reject' | 'abstain';
  /** Vote weight (for weighted voting) */
  weight?: number;
  /** Vote reasoning */
  reasoning?: string;
  /** Vote timestamp */
  votedAt: string;
}

/**
 * Consensus Result
 */
export interface ConsensusResult {
  /** Proposal ID */
  proposalId: string;
  /** Consensus reached */
  reached: boolean;
  /** Final decision */
  decision: 'accepted' | 'rejected';
  /** Vote summary */
  votes: {
    approve: number;
    reject: number;
    abstain: number;
  };
  /** Participating agents */
  participants: AgentIdentity[];
  /** Consensus timestamp */
  timestamp: string;
}

/**
 * Swarm Metrics
 */
export interface SwarmMetrics {
  /** Total agents in swarm */
  totalAgents: number;
  /** Active agents */
  activeAgents: number;
  /** Average load across swarm (0-1) */
  avgLoad: number;
  /** Total tasks in progress */
  tasksInProgress: number;
  /** Total tasks completed */
  tasksCompleted: number;
  /** Average task completion time (milliseconds) */
  avgCompletionTime: number;
  /** Success rate (0-1) */
  successRate: number;
  /** Timestamp */
  timestamp: string;
}

/**
 * Swarm Configuration
 */
export interface SwarmConfiguration {
  /** Maximum swarm size */
  maxSize: number;
  /** Minimum swarm size */
  minSize: number;
  /** Auto-scaling enabled */
  autoScaling: boolean;
  /** Load threshold for scaling up (0-1) */
  scaleUpThreshold: number;
  /** Load threshold for scaling down (0-1) */
  scaleDownThreshold: number;
  /** Task queue size limit */
  maxQueueSize: number;
  /** Coordination strategy */
  coordinationStrategy: 'centralized' | 'decentralized' | 'hybrid';
}

/**
 * Swarm Orchestrator
 * Coordinates multi-agent swarms for complex task execution
 */
export class SwarmOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private assignments: Map<string, TaskAssignment> = new Map();
  private config: SwarmConfiguration;

  constructor(config: Partial<SwarmConfiguration> = {}) {
    this.config = {
      maxSize: 100,
      minSize: 1,
      autoScaling: true,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.2,
      maxQueueSize: 1000,
      coordinationStrategy: 'hybrid',
      ...config,
    };
  }

  /**
   * Decompose complex task into agent subtasks
   */
  decomposeTask(task: ComplexTask): AgentTask[] {
    const subtasks: AgentTask[] = [];

    // Analyze task complexity
    const complexity = this.analyzeComplexity(task);

    // Determine decomposition strategy
    const strategy = this.selectDecompositionStrategy(complexity);

    // Decompose based on strategy
    switch (strategy) {
      case 'sequential':
        return this.decomposeSequential(task);
      case 'parallel':
        return this.decomposeParallel(task);
      case 'hierarchical':
        return this.decomposeHierarchical(task);
      case 'pipeline':
        return this.decomposePipeline(task);
      default:
        return this.decomposeParallel(task);
    }
  }

  /**
   * Load balance tasks across agent pool
   */
  balanceLoad(tasks: AgentTask[], agents: Agent[]): TaskAssignment[] {
    const assignments: TaskAssignment[] = [];
    const availableAgents = agents.filter((a) => a.status === 'available');

    // Sort tasks by priority and estimated duration (create copy to avoid mutating input)
    const sortedTasks = tasks.slice().sort((a, b) => {
      if (a.priority !== b.priority) {
        return (
          this.priorityToNumber(b.priority) - this.priorityToNumber(a.priority)
        );
      }
      return a.estimatedDuration - b.estimatedDuration;
    });

    // Assign tasks using capability-aware load balancing
    for (const task of sortedTasks) {
      const suitableAgents = this.findSuitableAgents(task, availableAgents);
      if (suitableAgents.length === 0) {
        console.warn(`No suitable agents for task ${task.id}`);
        continue;
      }

      // Select best agent based on load, capabilities, and performance
      const bestAgent = this.selectBestAgent(task, suitableAgents);

      // Create assignment
      const assignment: TaskAssignment = {
        taskId: task.id,
        agent: bestAgent,
        assignedAt: new Date().toISOString(),
        expectedCompletion: this.calculateExpectedCompletion(task, bestAgent),
        score: this.calculateAssignmentScore(task, bestAgent),
      };

      assignments.push(assignment);

      // Update agent load
      bestAgent.load += task.estimatedDuration / 3600000; // Convert to hours
      bestAgent.capacity = 1 - bestAgent.load;
    }

    return assignments;
  }

  /**
   * Build consensus among agents
   */
  async buildConsensus(proposals: Proposal[]): Promise<ConsensusResult[]> {
    const results: ConsensusResult[] = [];

    for (const proposal of proposals) {
      const result = await this.processProposal(proposal);
      results.push(result);
    }

    return results;
  }

  /**
   * Adapt swarm based on metrics
   */
  adaptSwarm(metrics: SwarmMetrics): SwarmConfiguration {
    const newConfig = { ...this.config };

    // Auto-scaling logic
    if (this.config.autoScaling) {
      if (metrics.avgLoad > this.config.scaleUpThreshold) {
        newConfig.maxSize = Math.min(
          this.config.maxSize * 1.5,
          this.config.maxSize + 10
        );
      } else if (metrics.avgLoad < this.config.scaleDownThreshold) {
        newConfig.maxSize = Math.max(
          this.config.maxSize * 0.8,
          this.config.minSize
        );
      }
    }

    // Adjust coordination strategy based on swarm size
    if (metrics.totalAgents > 50) {
      newConfig.coordinationStrategy = 'decentralized';
    } else if (metrics.totalAgents < 10) {
      newConfig.coordinationStrategy = 'centralized';
    } else {
      newConfig.coordinationStrategy = 'hybrid';
    }

    this.config = newConfig;
    return newConfig;
  }

  /**
   * Register agent in swarm
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.identity.id, agent);
  }

  /**
   * Unregister agent from swarm
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
  }

  /**
   * Get swarm metrics
   */
  getMetrics(): SwarmMetrics {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter((a) => a.status !== 'offline');

    const totalLoad = agents.reduce((sum, a) => sum + a.load, 0);
    const totalCompleted = agents.reduce(
      (sum, a) => sum + a.metrics.tasksCompleted,
      0
    );
    const avgCompletionTime =
      agents.reduce((sum, a) => sum + a.metrics.avgCompletionTime, 0) /
      agents.length;
    const avgSuccessRate =
      agents.reduce((sum, a) => sum + a.metrics.successRate, 0) / agents.length;

    return {
      totalAgents: agents.length,
      activeAgents: activeAgents.length,
      avgLoad: totalLoad / agents.length,
      tasksInProgress: this.assignments.size,
      tasksCompleted: totalCompleted,
      avgCompletionTime,
      successRate: avgSuccessRate,
      timestamp: new Date().toISOString(),
    };
  }

  // Private helper methods

  private analyzeComplexity(task: ComplexTask): number {
    // Simple complexity score (0-1)
    let score = 0;

    score += task.requirements.capabilities.length * 0.1;
    score += (task.requirements.minAgents || 1) * 0.2;
    score += task.constraints.maxExecutionTime ? 0.1 : 0;

    return Math.min(score, 1);
  }

  private selectDecompositionStrategy(
    complexity: number
  ): 'sequential' | 'parallel' | 'hierarchical' | 'pipeline' {
    if (complexity > 0.7) return 'hierarchical';
    if (complexity > 0.4) return 'pipeline';
    if (complexity > 0.2) return 'parallel';
    return 'sequential';
  }

  private decomposeSequential(task: ComplexTask): AgentTask[] {
    // Simple sequential decomposition
    return [
      {
        id: crypto.randomUUID(),
        parentId: task.id,
        name: `${task.name} - Step 1`,
        description: task.description,
        capabilities: task.requirements.capabilities,
        input: {},
        dependencies: [],
        estimatedDuration: 60000,
        priority: task.priority,
      },
    ];
  }

  private decomposeParallel(task: ComplexTask): AgentTask[] {
    // Parallel decomposition - split into independent subtasks
    return task.requirements.capabilities.map((capability, index) => ({
      id: crypto.randomUUID(),
      parentId: task.id,
      name: `${task.name} - Part ${index + 1}`,
      description: `Handle ${capability} for ${task.name}`,
      capabilities: [capability],
      input: {},
      dependencies: [],
      estimatedDuration: 60000,
      priority: task.priority,
    }));
  }

  private decomposeHierarchical(task: ComplexTask): AgentTask[] {
    // Hierarchical decomposition - tree structure
    const rootTask: AgentTask = {
      id: crypto.randomUUID(),
      parentId: task.id,
      name: `${task.name} - Coordinator`,
      description: 'Coordinate subtasks',
      capabilities: ['coordination'],
      input: {},
      dependencies: [],
      estimatedDuration: 30000,
      priority: task.priority,
    };

    const subtasks = task.requirements.capabilities.map((capability) => ({
      id: crypto.randomUUID(),
      parentId: rootTask.id,
      name: `${task.name} - ${capability}`,
      description: `Execute ${capability}`,
      capabilities: [capability],
      input: {},
      dependencies: [rootTask.id],
      estimatedDuration: 60000,
      priority: task.priority,
    }));

    return [rootTask, ...subtasks];
  }

  private decomposePipeline(task: ComplexTask): AgentTask[] {
    // Pipeline decomposition - sequential with data flow
    const tasks: AgentTask[] = [];
    let previousTaskId: string | null = null;

    for (let i = 0; i < task.requirements.capabilities.length; i++) {
      const capability = task.requirements.capabilities[i];
      const taskId = crypto.randomUUID();

      tasks.push({
        id: taskId,
        parentId: task.id,
        name: `${task.name} - Stage ${i + 1}`,
        description: `Pipeline stage: ${capability}`,
        capabilities: [capability],
        input: {},
        dependencies: previousTaskId ? [previousTaskId] : [],
        estimatedDuration: 60000,
        priority: task.priority,
      });

      previousTaskId = taskId;
    }

    return tasks;
  }

  private findSuitableAgents(task: AgentTask, agents: Agent[]): Agent[] {
    return agents.filter((agent) => {
      // Check capability match
      const hasCapabilities = task.capabilities.every((cap) =>
        agent.capabilities.includes(cap)
      );

      // Check capacity
      const hasCapacity = agent.capacity > 0.1;

      return hasCapabilities && hasCapacity;
    });
  }

  private selectBestAgent(task: AgentTask, agents: Agent[]): Agent {
    // Score each agent
    const scored = agents.map((agent) => ({
      agent,
      score: this.calculateAssignmentScore(task, agent),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    return scored[0].agent;
  }

  private calculateAssignmentScore(task: AgentTask, agent: Agent): number {
    let score = 0;

    // Capacity score (0-0.4)
    score += agent.capacity * 0.4;

    // Performance score (0-0.3)
    score += agent.metrics.successRate * 0.3;

    // Load score (0-0.3) - prefer less loaded agents
    score += (1 - agent.load) * 0.3;

    return Math.min(score, 1);
  }

  private calculateExpectedCompletion(task: AgentTask, agent: Agent): string {
    const completionTime = new Date(
      Date.now() + task.estimatedDuration * (1 / agent.metrics.successRate)
    );
    return completionTime.toISOString();
  }

  private async processProposal(proposal: Proposal): Promise<ConsensusResult> {
    // Count votes
    const votes = {
      approve: proposal.votes.filter((v) => v.value === 'approve').length,
      reject: proposal.votes.filter((v) => v.value === 'reject').length,
      abstain: proposal.votes.filter((v) => v.value === 'abstain').length,
    };

    // Determine consensus (simple majority)
    const totalVotes = votes.approve + votes.reject + votes.abstain;
    const reached = totalVotes >= this.agents.size * 0.5;
    const decision = votes.approve > votes.reject ? 'accepted' : 'rejected';

    return {
      proposalId: proposal.id,
      reached,
      decision,
      votes,
      participants: proposal.votes.map((v) => v.voter),
      timestamp: new Date().toISOString(),
    };
  }

  private priorityToNumber(priority: MessagePriority): number {
    const mapping = {
      low: 1,
      normal: 2,
      high: 3,
      urgent: 4,
      critical: 5,
    };
    return mapping[priority] || 2;
  }
}
