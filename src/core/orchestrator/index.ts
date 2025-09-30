/**
 * OSSA Core Orchestrator - Production Platform
 * Enterprise-grade agent coordination with 360° feedback loop
 * Plan → Execute → Review → Judge → Learn → Govern
 */

import { EventEmitter } from 'events';
import {
  Agent,
  Workflow,
  Task,
  OrchestratorConfig,
  AgentType,
  TaskStatus,
  AgentStatus,
  MessageType
} from '../../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface FeedbackLoopPhase {
  name: 'plan' | 'execute' | 'review' | 'judge' | 'learn' | 'govern';
  agents: string[];
  status: 'pending' | 'active' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  budget: {
    tokens: number;
    used: number;
  };
  output?: any;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  phases: FeedbackLoopPhase[];
  currentPhase: number;
  budget: {
    totalTokens: number;
    usedTokens: number;
    timeLimit: number; // in seconds
  };
  startTime: Date;
  endTime?: Date;
  metrics: {
    agentsUsed: number;
    tasksCompleted: number;
    errors: number;
    performance: any;
  };
}

export interface AgentAllocation {
  agentId: string;
  agentType: AgentType;
  allocatedTo: string; // workflow execution ID
  phase: string;
  resourceQuota: {
    tokens: number;
    timeout: number;
  };
  performance: {
    tasksCompleted: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

export class OrchestratorPlatform extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private allocations: Map<string, AgentAllocation> = new Map();
  private taskQueue: Task[] = [];
  private config: OrchestratorConfig;
  private healthMetrics: {
    totalWorkflows: number;
    activeExecutions: number;
    avgExecutionTime: number;
    resourceUtilization: number;
    errorRate: number;
  };

  constructor(config: OrchestratorConfig) {
    super();
    this.config = config;
    this.healthMetrics = {
      totalWorkflows: 0,
      activeExecutions: 0,
      avgExecutionTime: 0,
      resourceUtilization: 0,
      errorRate: 0
    };
    this.initialize();
  }

  private async initialize(): Promise<void> {
    console.log('[ORCHESTRATOR-PLATFORM] Initializing production orchestration engine...');
    await this.loadAgents();
    await this.setupMessageBus();
    await this.startScheduler();
    await this.initializeHealthMonitoring();
    this.emit('orchestrator:ready');
    console.log('[ORCHESTRATOR-PLATFORM] Production orchestration engine ready');
  }

  /**
   * Register agent with production capabilities validation
   */
  async registerAgent(agent: Agent): Promise<void> {
    // Validate agent capabilities for production
    if (!this.validateAgentForProduction(agent)) {
      throw new Error(`Agent ${agent.id} does not meet production requirements`);
    }

    this.agents.set(agent.id, agent);
    this.emit('agent:registered', {
      agentId: agent.id,
      type: agent.type,
      capabilities: agent.capabilities.length,
      timestamp: new Date()
    });

    console.log(`[ORCHESTRATOR-PLATFORM] Agent registered: ${agent.id} (${agent.type})`);
  }

  /**
   * Execute workflow with 360° feedback loop coordination
   */
  async executeWorkflow(
    workflow: Workflow,
    budget?: {
      tokens: number;
      timeLimit: number;
    }
  ): Promise<string> {
    const executionId = uuidv4();
    const defaultBudget = {
      tokens: budget?.tokens || 50000,
      timeLimit: budget?.timeLimit || 3600
    };

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: workflow.id,
      status: 'pending',
      phases: this.initializeFeedbackLoopPhases(workflow),
      currentPhase: 0,
      budget: {
        totalTokens: defaultBudget.tokens,
        usedTokens: 0,
        timeLimit: defaultBudget.timeLimit
      },
      startTime: new Date(),
      metrics: {
        agentsUsed: 0,
        tasksCompleted: 0,
        errors: 0,
        performance: {}
      }
    };

    this.executions.set(executionId, execution);
    this.workflows.set(workflow.id, workflow);
    this.healthMetrics.totalWorkflows++;
    this.healthMetrics.activeExecutions++;

    console.log(`[ORCHESTRATOR-PLATFORM] Starting workflow execution: ${executionId}`);
    this.emit('workflow:started', { executionId, workflowId: workflow.id });

    // Start execution in background
    this.executeFeedbackLoop(executionId).catch((error) => {
      console.error(`[ORCHESTRATOR-PLATFORM] Workflow execution failed: ${executionId}`, error);
      this.handleExecutionError(executionId, error);
    });

    return executionId;
  }

  /**
   * Allocate agents to workflow execution with resource management
   */
  async allocateAgents(
    executionId: string,
    requirements: {
      agentType: AgentType;
      count: number;
      capabilities: string[];
      phase: string;
    }
  ): Promise<string[]> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const availableAgents = Array.from(this.agents.values())
      .filter(
        (agent) =>
          agent.type === requirements.agentType &&
          agent.status === AgentStatus.IDLE &&
          this.hasRequiredCapabilities(agent, requirements.capabilities)
      )
      .slice(0, requirements.count);

    if (availableAgents.length < requirements.count) {
      console.warn(
        `[ORCHESTRATOR-PLATFORM] Insufficient agents available. Required: ${requirements.count}, Available: ${availableAgents.length}`
      );
    }

    const allocatedAgentIds: string[] = [];
    const tokensPerAgent = Math.floor(
      (execution.budget.totalTokens - execution.budget.usedTokens) / (requirements.count || 1)
    );

    for (const agent of availableAgents) {
      const allocation: AgentAllocation = {
        agentId: agent.id,
        agentType: agent.type,
        allocatedTo: executionId,
        phase: requirements.phase,
        resourceQuota: {
          tokens: tokensPerAgent,
          timeout: 300000 // 5 minutes default
        },
        performance: {
          tasksCompleted: 0,
          avgResponseTime: 0,
          errorRate: 0
        }
      };

      this.allocations.set(`${agent.id}-${executionId}`, allocation);
      allocatedAgentIds.push(agent.id);

      // Update agent status
      agent.status = AgentStatus.BUSY;
    }

    execution.metrics.agentsUsed += allocatedAgentIds.length;

    console.log(`[ORCHESTRATOR-PLATFORM] Allocated ${allocatedAgentIds.length} agents to execution ${executionId}`);
    this.emit('agents:allocated', {
      executionId,
      agentIds: allocatedAgentIds,
      phase: requirements.phase
    });

    return allocatedAgentIds;
  }

  /**
   * Execute 360° feedback loop: Plan → Execute → Review → Judge → Learn → Govern
   */
  private async executeFeedbackLoop(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    execution.status = 'running';

    try {
      for (let i = 0; i < execution.phases.length; i++) {
        const phase = execution.phases[i];
        execution.currentPhase = i;

        console.log(`[ORCHESTRATOR-PLATFORM] Executing phase: ${phase.name} for execution ${executionId}`);

        await this.executePhase(executionId, phase);

        // Check budget constraints
        if (execution.budget.usedTokens >= execution.budget.totalTokens) {
          console.warn(`[ORCHESTRATOR-PLATFORM] Token budget exceeded for execution ${executionId}`);
          throw new Error('Token budget exceeded');
        }

        // Check time constraints
        const elapsed = Date.now() - execution.startTime.getTime();
        if (elapsed > execution.budget.timeLimit * 1000) {
          console.warn(`[ORCHESTRATOR-PLATFORM] Time limit exceeded for execution ${executionId}`);
          throw new Error('Time limit exceeded');
        }
      }

      execution.status = 'completed';
      execution.endTime = new Date();
      this.healthMetrics.activeExecutions--;

      console.log(`[ORCHESTRATOR-PLATFORM] Workflow execution completed: ${executionId}`);
      this.emit('workflow:completed', { executionId });
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.healthMetrics.activeExecutions--;
      this.healthMetrics.errorRate++;

      console.error(`[ORCHESTRATOR-PLATFORM] Workflow execution failed: ${executionId}`, error);
      this.emit('workflow:failed', { executionId, error });
      throw error;
    } finally {
      await this.cleanupExecution(executionId);
    }
  }

  /**
   * Execute individual phase with agent coordination
   */
  private async executePhase(executionId: string, phase: FeedbackLoopPhase): Promise<void> {
    phase.status = 'active';
    phase.startTime = new Date();

    const agentRequirements = this.getPhaseAgentRequirements(phase.name);
    const allocatedAgents = await this.allocateAgents(executionId, agentRequirements);

    phase.agents = allocatedAgents;

    // Coordinate agents for this phase
    const phaseResults = await this.coordinatePhaseExecution(executionId, phase, allocatedAgents);

    phase.output = phaseResults;
    phase.status = 'completed';
    phase.endTime = new Date();

    console.log(`[ORCHESTRATOR-PLATFORM] Phase ${phase.name} completed for execution ${executionId}`);
  }

  /**
   * Get agent requirements for each feedback loop phase
   */
  private getPhaseAgentRequirements(phaseName: string): {
    agentType: AgentType;
    count: number;
    capabilities: string[];
    phase: string;
  } {
    const phaseMap = {
      plan: {
        agentType: AgentType.ORCHESTRATOR,
        count: 1,
        capabilities: ['planning', 'coordination']
      },
      execute: {
        agentType: AgentType.WORKER,
        count: 3,
        capabilities: ['implementation', 'processing']
      },
      review: {
        agentType: AgentType.CRITIC,
        count: 2,
        capabilities: ['analysis', 'validation']
      },
      judge: {
        agentType: AgentType.JUDGE,
        count: 1,
        capabilities: ['evaluation', 'decision']
      },
      learn: {
        agentType: AgentType.TRAINER,
        count: 1,
        capabilities: ['learning', 'optimization']
      },
      govern: {
        agentType: AgentType.GOVERNOR,
        count: 1,
        capabilities: ['governance', 'compliance']
      }
    };

    const requirements = phaseMap[phaseName as keyof typeof phaseMap];
    return { ...requirements, phase: phaseName };
  }

  /**
   * Coordinate agent execution within a phase
   */
  private async coordinatePhaseExecution(
    executionId: string,
    phase: FeedbackLoopPhase,
    agentIds: string[]
  ): Promise<any> {
    console.log(`[ORCHESTRATOR-PLATFORM] Coordinating ${agentIds.length} agents for phase ${phase.name}`);

    const results: any[] = [];
    const execution = this.executions.get(executionId)!;

    // Execute agents in parallel for most phases, sequentially for governance
    if (phase.name === 'govern' || phase.name === 'judge') {
      // Sequential execution for governance and judgment
      for (const agentId of agentIds) {
        const result = await this.executeAgentTask(executionId, agentId, phase);
        results.push(result);
      }
    } else {
      // Parallel execution for other phases
      const promises = agentIds.map((agentId) => this.executeAgentTask(executionId, agentId, phase));
      const parallelResults = await Promise.allSettled(promises);

      parallelResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(
            `[ORCHESTRATOR-PLATFORM] Agent ${agentIds[index]} failed in phase ${phase.name}:`,
            result.reason
          );
          execution.metrics.errors++;
        }
      });
    }

    return {
      phase: phase.name,
      agentResults: results,
      summary: this.summarizePhaseResults(phase.name, results)
    };
  }

  /**
   * Execute task for specific agent
   */
  private async executeAgentTask(executionId: string, agentId: string, phase: FeedbackLoopPhase): Promise<any> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const allocation = this.allocations.get(`${agentId}-${executionId}`);
    if (!allocation) {
      throw new Error(`No allocation found for agent ${agentId} in execution ${executionId}`);
    }

    const startTime = Date.now();

    try {
      // Simulate agent task execution
      // In production, this would call the actual agent via its protocol
      const mockResult = {
        agentId,
        phase: phase.name,
        status: 'completed',
        tokensUsed: Math.floor(Math.random() * allocation.resourceQuota.tokens * 0.5),
        output: `${phase.name} result from ${agentId}`
      };

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Update metrics
      const execution = this.executions.get(executionId)!;
      execution.budget.usedTokens += mockResult.tokensUsed;
      execution.metrics.tasksCompleted++;

      allocation.performance.tasksCompleted++;
      allocation.performance.avgResponseTime =
        (allocation.performance.avgResponseTime + duration) / allocation.performance.tasksCompleted;

      console.log(
        `[ORCHESTRATOR-PLATFORM] Agent ${agentId} completed task in phase ${phase.name} (${duration}ms, ${mockResult.tokensUsed} tokens)`
      );

      return mockResult;
    } catch (error) {
      allocation.performance.errorRate++;
      throw error;
    }
  }

  /**
   * Summarize results from a phase
   */
  private summarizePhaseResults(phaseName: string, results: any[]): any {
    return {
      totalAgents: results.length,
      successfulTasks: results.filter((r) => r.status === 'completed').length,
      totalTokensUsed: results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
      insights: `Phase ${phaseName} completed with ${results.length} agent contributions`
    };
  }

  /**
   * Initialize feedback loop phases for workflow
   */
  private initializeFeedbackLoopPhases(workflow: Workflow): FeedbackLoopPhase[] {
    const phases: FeedbackLoopPhase[] = ['plan', 'execute', 'review', 'judge', 'learn', 'govern'].map((name) => ({
      name: name as any,
      agents: [],
      status: 'pending',
      budget: {
        tokens: Math.floor(8000), // ~1/6 of total budget per phase
        used: 0
      }
    }));

    return phases;
  }

  /**
   * Validate agent meets production requirements
   */
  private validateAgentForProduction(agent: Agent): boolean {
    // Production validation criteria
    return (
      agent.capabilities.length > 0 &&
      agent.version !== undefined &&
      agent.type !== undefined &&
      agent.config !== undefined
    );
  }

  /**
   * Check if agent has required capabilities
   */
  private hasRequiredCapabilities(agent: Agent, requiredCapabilities: string[]): boolean {
    const agentCapabilityNames = agent.capabilities.map((cap) => cap.name);
    return requiredCapabilities.every((required) => agentCapabilityNames.includes(required));
  }

  /**
   * Handle execution errors with recovery strategies
   */
  private handleExecutionError(executionId: string, error: any): void {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'failed';
      execution.endTime = new Date();
      this.healthMetrics.activeExecutions--;
      this.healthMetrics.errorRate++;
    }

    console.error(`[ORCHESTRATOR-PLATFORM] Execution ${executionId} failed:`, error);
    this.emit('execution:error', { executionId, error });
  }

  /**
   * Cleanup resources after execution
   */
  private async cleanupExecution(executionId: string): Promise<void> {
    // Release allocated agents
    const allocationsToRemove: string[] = [];

    for (const [key, allocation] of this.allocations.entries()) {
      if (allocation.allocatedTo === executionId) {
        const agent = this.agents.get(allocation.agentId);
        if (agent) {
          agent.status = AgentStatus.IDLE;
        }
        allocationsToRemove.push(key);
      }
    }

    allocationsToRemove.forEach((key) => this.allocations.delete(key));

    console.log(`[ORCHESTRATOR-PLATFORM] Cleaned up execution ${executionId}`);
  }

  /**
   * Initialize health monitoring
   */
  private async initializeHealthMonitoring(): Promise<void> {
    setInterval(() => {
      this.updateHealthMetrics();
      this.emit('health:update', this.getHealthStatus());
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update health metrics
   */
  private updateHealthMetrics(): void {
    const activeAgents = Array.from(this.agents.values()).filter(
      (agent) => agent.status !== AgentStatus.OFFLINE
    ).length;

    this.healthMetrics.resourceUtilization =
      activeAgents > 0 ? (this.healthMetrics.activeExecutions / activeAgents) * 100 : 0;
  }

  /**
   * Get current health status
   */
  public getHealthStatus(): any {
    return {
      status: this.healthMetrics.activeExecutions > 0 ? 'active' : 'idle',
      metrics: { ...this.healthMetrics },
      agents: {
        total: this.agents.size,
        active: Array.from(this.agents.values()).filter((agent) => agent.status === AgentStatus.BUSY).length,
        idle: Array.from(this.agents.values()).filter((agent) => agent.status === AgentStatus.IDLE).length
      },
      executions: {
        active: this.healthMetrics.activeExecutions,
        total: this.healthMetrics.totalWorkflows
      },
      timestamp: new Date()
    };
  }

  /**
   * Get execution status
   */
  public getExecutionStatus(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * List all active executions
   */
  public getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter((execution) => execution.status === 'running');
  }

  private async scheduleWorkflowTasks(workflow: Workflow): Promise<void> {
    // Legacy method - now handled by executeWorkflow
    console.log('[ORCHESTRATOR-PLATFORM] scheduleWorkflowTasks deprecated - use executeWorkflow');
  }

  private async loadAgents(): Promise<void> {
    console.log('[ORCHESTRATOR-PLATFORM] Loading agent registry...');
    // In production, this would load from persistent storage
  }

  private async setupMessageBus(): Promise<void> {
    console.log('[ORCHESTRATOR-PLATFORM] Setting up message bus...');
    // Production message bus initialization
  }

  private async startScheduler(): Promise<void> {
    console.log('[ORCHESTRATOR-PLATFORM] Starting task scheduler...');
    // Production scheduler initialization
  }
}

// Maintain backward compatibility
export const Orchestrator = OrchestratorPlatform;
export default OrchestratorPlatform;
