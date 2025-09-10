/**
 * OSSA Orchestra v0.1.8 - Main Orchestration Engine
 * Advanced Multi-Agent Workflow Orchestration Platform
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistry } from '../agents/registry';
import { WorkflowEngine } from '../workflows/engine';
import { ScalingManager } from '../scaling/manager';
import { LoadBalancer } from '../balancer/load-balancer';
import { ComplianceValidator } from '../compliance/validator';
import { MetricsCollector } from '../utils/metrics';
import { Logger } from '../utils/logger';
import {
  AgentDefinition,
  WorkflowDefinition,
  OrchestrationRequest,
  OrchestrationResult,
  ExecutionStatus,
  LoadBalancerConfig,
  ScalingPolicy,
  ComplianceRequirement
} from './types';

export class OrchestrationEngine extends EventEmitter {
  private agentRegistry: AgentRegistry;
  private workflowEngine: WorkflowEngine;
  private scalingManager: ScalingManager;
  private loadBalancer: LoadBalancer;
  private complianceValidator: ComplianceValidator;
  private metricsCollector: MetricsCollector;
  private logger: Logger;

  private activeExecutions: Map<string, OrchestrationExecution> = new Map();
  private isInitialized = false;

  constructor() {
    super();
    this.logger = new Logger('OrchestrationEngine');
    this.metricsCollector = new MetricsCollector();
    this.agentRegistry = new AgentRegistry();
    this.workflowEngine = new WorkflowEngine(this.agentRegistry, this.metricsCollector);
    this.scalingManager = new ScalingManager(this.agentRegistry);
    this.loadBalancer = new LoadBalancer();
    this.complianceValidator = new ComplianceValidator();

    this.setupEventHandlers();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing OSSA Orchestra v0.1.8');

    try {
      await this.agentRegistry.initialize();
      await this.workflowEngine.initialize();
      await this.scalingManager.initialize();
      await this.loadBalancer.initialize();
      await this.complianceValidator.initialize();
      await this.metricsCollector.initialize();

      this.isInitialized = true;
      this.logger.info('OSSA Orchestra initialized successfully');
      this.emit('initialized');
    } catch (error) {
      this.logger.error('Failed to initialize orchestra:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down OSSA Orchestra');

    // Cancel all active executions
    for (const execution of this.activeExecutions.values()) {
      await this.cancelExecution(execution.id);
    }

    // Shutdown components in reverse order
    await this.metricsCollector.shutdown();
    await this.complianceValidator.shutdown();
    await this.loadBalancer.shutdown();
    await this.scalingManager.shutdown();
    await this.workflowEngine.shutdown();
    await this.agentRegistry.shutdown();

    this.isInitialized = false;
    this.logger.info('OSSA Orchestra shutdown complete');
    this.emit('shutdown');
  }

  // Agent Management
  async registerAgent(agent: AgentDefinition): Promise<void> {
    this.ensureInitialized();
    await this.agentRegistry.register(agent);
    await this.loadBalancer.addAgent(agent);
    this.logger.info(`Agent registered: ${agent.id}`);
    this.emit('agent-registered', agent);
  }

  async unregisterAgent(agentId: string): Promise<void> {
    this.ensureInitialized();
    await this.loadBalancer.removeAgent(agentId);
    await this.agentRegistry.unregister(agentId);
    this.logger.info(`Agent unregistered: ${agentId}`);
    this.emit('agent-unregistered', agentId);
  }

  async getAgents(): Promise<AgentDefinition[]> {
    this.ensureInitialized();
    return await this.agentRegistry.getAll();
  }

  async getAgent(agentId: string): Promise<AgentDefinition | null> {
    this.ensureInitialized();
    return await this.agentRegistry.get(agentId);
  }

  // Workflow Management
  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    this.ensureInitialized();
    await this.workflowEngine.registerWorkflow(workflow);
    this.logger.info(`Workflow registered: ${workflow.id}`);
    this.emit('workflow-registered', workflow);
  }

  async unregisterWorkflow(workflowId: string): Promise<void> {
    this.ensureInitialized();
    await this.workflowEngine.unregisterWorkflow(workflowId);
    this.logger.info(`Workflow unregistered: ${workflowId}`);
    this.emit('workflow-unregistered', workflowId);
  }

  async getWorkflows(): Promise<WorkflowDefinition[]> {
    this.ensureInitialized();
    return await this.workflowEngine.getWorkflows();
  }

  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    this.ensureInitialized();
    return await this.workflowEngine.getWorkflow(workflowId);
  }

  // Orchestration Execution
  async execute(request: OrchestrationRequest): Promise<OrchestrationResult> {
    this.ensureInitialized();

    const executionId = uuidv4();
    const execution = new OrchestrationExecution(executionId, request);
    
    this.activeExecutions.set(executionId, execution);
    this.logger.info(`Starting execution: ${executionId} for workflow: ${request.workflowId}`);

    try {
      // Pre-execution compliance validation
      await this.validatePreExecution(request);

      // Load workflow definition
      const workflow = await this.workflowEngine.getWorkflow(request.workflowId);
      if (!workflow) {
        throw new Error(`Workflow not found: ${request.workflowId}`);
      }

      // Execute workflow through the engine
      const result = await this.workflowEngine.execute(request, workflow);

      // Post-execution compliance validation
      await this.validatePostExecution(result);

      // Update execution with result
      execution.complete(result);
      this.activeExecutions.delete(executionId);

      this.logger.info(`Execution completed: ${executionId}`);
      this.emit('execution-completed', result);

      return result;

    } catch (error) {
      this.logger.error(`Execution failed: ${executionId}`, error);
      
      const failedResult: OrchestrationResult = {
        id: executionId,
        requestId: request.id,
        status: 'failed',
        error: {
          code: 'EXECUTION_FAILED',
          message: error.message,
          recoverable: false,
          details: error
        },
        metrics: {
          startTime: execution.startTime,
          endTime: new Date(),
          duration: Date.now() - execution.startTime.getTime(),
          stagesExecuted: 0,
          agentsUsed: [],
          resourceUsage: { cpu: 0, memory: 0, network: 0 },
          performance: { avgResponseTime: 0, totalThroughput: 0, errorRate: 100, bottlenecks: [] }
        },
        stages: [],
        compliance: { level: 'bronze', passed: false, violations: [], score: 0 }
      };

      execution.fail(failedResult);
      this.activeExecutions.delete(executionId);
      this.emit('execution-failed', failedResult);

      return failedResult;
    }
  }

  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) {
      return false;
    }

    try {
      await this.workflowEngine.cancelExecution(executionId);
      execution.cancel();
      this.activeExecutions.delete(executionId);
      
      this.logger.info(`Execution cancelled: ${executionId}`);
      this.emit('execution-cancelled', executionId);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel execution: ${executionId}`, error);
      return false;
    }
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus | null> {
    const execution = this.activeExecutions.get(executionId);
    return execution ? execution.status : null;
  }

  async getActiveExecutions(): Promise<OrchestrationExecution[]> {
    return Array.from(this.activeExecutions.values());
  }

  // Scaling Management
  async addScalingPolicy(policy: ScalingPolicy): Promise<void> {
    this.ensureInitialized();
    await this.scalingManager.addPolicy(policy);
    this.logger.info(`Scaling policy added: ${policy.id}`);
    this.emit('scaling-policy-added', policy);
  }

  async removeScalingPolicy(policyId: string): Promise<void> {
    this.ensureInitialized();
    await this.scalingManager.removePolicy(policyId);
    this.logger.info(`Scaling policy removed: ${policyId}`);
    this.emit('scaling-policy-removed', policyId);
  }

  async getScalingPolicies(): Promise<ScalingPolicy[]> {
    this.ensureInitialized();
    return await this.scalingManager.getPolicies();
  }

  // Load Balancer Configuration
  async configureLoadBalancer(config: LoadBalancerConfig): Promise<void> {
    this.ensureInitialized();
    await this.loadBalancer.configure(config);
    this.logger.info('Load balancer configured');
    this.emit('load-balancer-configured', config);
  }

  async getLoadBalancerConfig(): Promise<LoadBalancerConfig> {
    this.ensureInitialized();
    return await this.loadBalancer.getConfig();
  }

  // Health and Status
  async getHealth(): Promise<HealthReport> {
    const agents = await this.agentRegistry.getHealthStatus();
    const workflows = await this.workflowEngine.getHealth();
    const scaling = await this.scalingManager.getHealth();
    const loadBalancer = await this.loadBalancer.getHealth();

    return {
      overall: 'healthy',
      components: {
        agentRegistry: agents.overall,
        workflowEngine: workflows.overall,
        scalingManager: scaling.overall,
        loadBalancer: loadBalancer.overall,
        complianceValidator: 'healthy',
        metricsCollector: 'healthy'
      },
      activeExecutions: this.activeExecutions.size,
      registeredAgents: agents.total,
      registeredWorkflows: workflows.total,
      timestamp: new Date()
    };
  }

  async getMetrics(): Promise<any> {
    this.ensureInitialized();
    return await this.metricsCollector.getMetrics();
  }

  // Private Methods
  private setupEventHandlers(): void {
    this.scalingManager.on('scaling-triggered', (event) => {
      this.logger.info(`Scaling triggered: ${event.policy} for ${event.target}`);
      this.emit('scaling-triggered', event);
    });

    this.loadBalancer.on('agent-failed', (agentId) => {
      this.logger.warn(`Agent marked as failed by load balancer: ${agentId}`);
      this.emit('agent-failed', agentId);
    });

    this.loadBalancer.on('agent-recovered', (agentId) => {
      this.logger.info(`Agent recovered: ${agentId}`);
      this.emit('agent-recovered', agentId);
    });
  }

  private async validatePreExecution(request: OrchestrationRequest): Promise<void> {
    const workflow = await this.workflowEngine.getWorkflow(request.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${request.workflowId}`);
    }

    // Validate compliance requirements
    const violations = await this.complianceValidator.validatePreExecution(
      request,
      workflow.compliance
    );

    if (violations.length > 0) {
      throw new Error(`Pre-execution compliance violations: ${violations.map(v => v.message).join(', ')}`);
    }
  }

  private async validatePostExecution(result: OrchestrationResult): Promise<void> {
    const workflow = await this.workflowEngine.getWorkflow(result.requestId);
    if (!workflow) {
      return; // Skip validation if workflow not found
    }

    const violations = await this.complianceValidator.validatePostExecution(
      result,
      workflow.compliance
    );

    if (violations.length > 0) {
      this.logger.warn(`Post-execution compliance violations: ${violations.map(v => v.message).join(', ')}`);
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Orchestra not initialized. Call initialize() first.');
    }
  }
}

class OrchestrationExecution {
  public readonly id: string;
  public readonly request: OrchestrationRequest;
  public readonly startTime: Date;
  public status: ExecutionStatus = 'pending';
  public result?: OrchestrationResult;
  public endTime?: Date;

  constructor(id: string, request: OrchestrationRequest) {
    this.id = id;
    this.request = request;
    this.startTime = new Date();
  }

  complete(result: OrchestrationResult): void {
    this.status = 'completed';
    this.result = result;
    this.endTime = new Date();
  }

  fail(result: OrchestrationResult): void {
    this.status = 'failed';
    this.result = result;
    this.endTime = new Date();
  }

  cancel(): void {
    this.status = 'cancelled';
    this.endTime = new Date();
  }
}

interface HealthReport {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  components: Record<string, string>;
  activeExecutions: number;
  registeredAgents: number;
  registeredWorkflows: number;
  timestamp: Date;
}