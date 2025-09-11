/**
 * OSSA Orchestra v0.1.8 - Workflow Engine
 * Executes multi-agent workflows with advanced orchestration patterns
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentRegistry } from '../agents/registry';
import { MetricsCollector } from '../utils/metrics';
import { Logger } from '../utils/logger';
import {
  WorkflowDefinition,
  WorkflowType,
  WorkflowStage,
  OrchestrationRequest,
  OrchestrationResult,
  ExecutionStatus,
  StageResult,
  ExecutionError,
  ExecutionMetrics,
  ComplianceResult
} from '../core/types';

export class WorkflowEngine extends EventEmitter {
  private logger: Logger;
  private agentRegistry: AgentRegistry;
  private metricsCollector: MetricsCollector;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private activeExecutions: Map<string, WorkflowExecution> = new Map();
  private isInitialized = false;

  constructor(agentRegistry: AgentRegistry, metricsCollector: MetricsCollector) {
    super();
    this.logger = new Logger('WorkflowEngine');
    this.agentRegistry = agentRegistry;
    this.metricsCollector = metricsCollector;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.info('Initializing Workflow Engine');
    this.isInitialized = true;
    this.logger.info('Workflow Engine initialized');
  }

  async shutdown(): Promise<void> {
    // Cancel all active executions
    for (const execution of this.activeExecutions.values()) {
      await this.cancelExecution(execution.id);
    }
    
    this.workflows.clear();
    this.activeExecutions.clear();
    this.isInitialized = false;
    this.logger.info('Workflow Engine shutdown');
  }

  async registerWorkflow(workflow: WorkflowDefinition): Promise<void> {
    this.ensureInitialized();
    
    // Validate workflow definition
    await this.validateWorkflowDefinition(workflow);
    
    this.workflows.set(workflow.id, { ...workflow });
    this.logger.info(`Registered workflow: ${workflow.id}`);
    this.emit('workflow-registered', workflow);
  }

  async unregisterWorkflow(workflowId: string): Promise<boolean> {
    this.ensureInitialized();
    
    const existed = this.workflows.delete(workflowId);
    
    if (existed) {
      this.logger.info(`Unregistered workflow: ${workflowId}`);
      this.emit('workflow-unregistered', workflowId);
    }
    
    return existed;
  }

  async getWorkflows(): Promise<WorkflowDefinition[]> {
    this.ensureInitialized();
    return Array.from(this.workflows.values());
  }

  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    this.ensureInitialized();
    return this.workflows.get(workflowId) || null;
  }

  async execute(
    request: OrchestrationRequest,
    workflow: WorkflowDefinition
  ): Promise<OrchestrationResult> {
    this.ensureInitialized();

    const executionId = uuidv4();
    const execution = new WorkflowExecution(executionId, request, workflow);
    
    this.activeExecutions.set(executionId, execution);
    this.logger.info(`Starting workflow execution: ${executionId}`);

    try {
      execution.start();
      
      // Execute workflow based on type
      const result = await this.executeWorkflowByType(execution);
      
      execution.complete(result);
      this.activeExecutions.delete(executionId);
      
      this.logger.info(`Workflow execution completed: ${executionId}`);
      this.emit('execution-completed', result);
      
      return result;
      
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${executionId}`, error);
      
      const failedResult = this.createFailedResult(execution, error);
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
      execution.cancel();
      this.activeExecutions.delete(executionId);
      
      this.logger.info(`Workflow execution cancelled: ${executionId}`);
      this.emit('execution-cancelled', executionId);
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel execution: ${executionId}`, error);
      return false;
    }
  }

  async getHealth(): Promise<{ overall: string; total: number; active: number }> {
    return {
      overall: 'healthy',
      total: this.workflows.size,
      active: this.activeExecutions.size
    };
  }

  private async executeWorkflowByType(execution: WorkflowExecution): Promise<OrchestrationResult> {
    const workflow = execution.workflow;
    
    switch (workflow.type) {
      case 'sequential':
        return await this.executeSequential(execution);
      case 'parallel':
        return await this.executeParallel(execution);
      case 'dag':
        return await this.executeDAG(execution);
      case 'pipeline':
        return await this.executePipeline(execution);
      case 'fanout':
        return await this.executeFanout(execution);
      case 'scatter_gather':
        return await this.executeScatterGather(execution);
      case 'conditional':
        return await this.executeConditional(execution);
      case 'loop':
        return await this.executeLoop(execution);
      case 'event_driven':
        return await this.executeEventDriven(execution);
      default:
        throw new Error(`Unsupported workflow type: ${workflow.type}`);
    }
  }

  private async executeSequential(execution: WorkflowExecution): Promise<OrchestrationResult> {
    const workflow = execution.workflow;
    const stageResults: StageResult[] = [];
    let currentData = execution.request.input;

    // Execute stages in order
    for (const stage of workflow.stages) {
      const stageResult = await this.executeStage(stage, currentData, execution);
      stageResults.push(stageResult);
      
      if (stageResult.status === 'failed') {
        throw new Error(`Stage ${stage.id} failed: ${stageResult.error?.message}`);
      }
      
      // Pass output to next stage
      currentData = stageResult.output;
    }

    return this.createSuccessResult(execution, stageResults, currentData);
  }

  private async executeParallel(execution: WorkflowExecution): Promise<OrchestrationResult> {
    const workflow = execution.workflow;
    const inputData = execution.request.input;

    // Execute all stages in parallel
    const stagePromises = workflow.stages.map(stage =>
      this.executeStage(stage, inputData, execution)
    );

    const stageResults = await Promise.all(stagePromises);

    // Check for failures
    const failures = stageResults.filter(result => result.status === 'failed');
    if (failures.length > 0) {
      throw new Error(`${failures.length} stages failed in parallel execution`);
    }

    // Combine outputs
    const combinedOutput = stageResults.reduce((acc, result) => {
      return { ...acc, [result.stageId]: result.output };
    }, {});

    return this.createSuccessResult(execution, stageResults, combinedOutput);
  }

  private async executeDAG(execution: WorkflowExecution): Promise<OrchestrationResult> {
    const workflow = execution.workflow;
    const stageResults: StageResult[] = [];
    const completedStages = new Set<string>();
    const stageOutputs = new Map<string, any>();
    
    // Initialize with input data
    stageOutputs.set('__input__', execution.request.input);

    // Create dependency graph
    const dependencyMap = new Map<string, string[]>();
    for (const dep of workflow.dependencies) {
      dependencyMap.set(dep.stageId, dep.dependsOn);
    }

    // Execute stages based on dependency resolution
    while (completedStages.size < workflow.stages.length) {
      // Find stages ready to execute
      const readyStages = workflow.stages.filter(stage => {
        if (completedStages.has(stage.id)) return false;
        
        const dependencies = dependencyMap.get(stage.id) || [];
        return dependencies.every(dep => completedStages.has(dep));
      });

      if (readyStages.length === 0) {
        throw new Error('Circular dependency or unresolved dependencies detected');
      }

      // Execute ready stages in parallel
      const stagePromises = readyStages.map(async (stage) => {
        // Prepare input from dependencies
        const dependencies = dependencyMap.get(stage.id) || [];
        const stageInput = this.prepareStageInput(dependencies, stageOutputs, execution.request.input);
        
        return await this.executeStage(stage, stageInput, execution);
      });

      const batchResults = await Promise.all(stagePromises);
      
      // Process results
      for (const result of batchResults) {
        stageResults.push(result);
        
        if (result.status === 'failed') {
          throw new Error(`Stage ${result.stageId} failed: ${result.error?.message}`);
        }
        
        completedStages.add(result.stageId);
        stageOutputs.set(result.stageId, result.output);
      }
    }

    // Combine final outputs
    const finalOutput = Array.from(stageOutputs.entries())
      .filter(([key]) => key !== '__input__')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return this.createSuccessResult(execution, stageResults, finalOutput);
  }

  private async executePipeline(execution: WorkflowExecution): Promise<OrchestrationResult> {
    // Pipeline is similar to sequential but with streaming capabilities
    return await this.executeSequential(execution);
  }

  private async executeFanout(execution: WorkflowExecution): Promise<OrchestrationResult> {
    // Fanout distributes the same input to multiple stages
    const workflow = execution.workflow;
    const inputData = execution.request.input;

    // Execute all stages with the same input
    const stagePromises = workflow.stages.map(stage =>
      this.executeStage(stage, inputData, execution)
    );

    const stageResults = await Promise.allSettled(stagePromises);
    const successResults: StageResult[] = [];
    const failedResults: StageResult[] = [];

    for (const result of stageResults) {
      if (result.status === 'fulfilled') {
        successResults.push(result.value);
      } else {
        // Create failed stage result
        failedResults.push({
          stageId: 'unknown',
          agentId: 'unknown',
          capabilityId: 'unknown',
          status: 'failed',
          input: inputData,
          error: {
            code: 'EXECUTION_FAILED',
            message: result.reason.message,
            recoverable: false
          },
          metrics: {
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            retryCount: 0,
            resourceUsage: { cpu: 0, memory: 0, network: 0 }
          }
        });
      }
    }

    const allResults = [...successResults, ...failedResults];
    
    // Fanout can tolerate some failures
    const successCount = successResults.length;
    const totalCount = allResults.length;
    
    if (successCount === 0) {
      throw new Error('All fanout stages failed');
    }

    // Combine successful outputs
    const combinedOutput = {
      successful: successResults.map(r => ({ stage: r.stageId, output: r.output })),
      failed: failedResults.map(r => ({ stage: r.stageId, error: r.error })),
      successRate: successCount / totalCount
    };

    return this.createSuccessResult(execution, allResults, combinedOutput);
  }

  private async executeScatterGather(execution: WorkflowExecution): Promise<OrchestrationResult> {
    // Scatter-Gather splits input data and processes in parallel, then gathers results
    const workflow = execution.workflow;
    const inputData = execution.request.input;

    // Scatter: Split input data
    const scatteredData = this.scatterData(inputData, workflow.stages.length);
    
    // Execute stages with scattered data
    const stagePromises = workflow.stages.map((stage, index) =>
      this.executeStage(stage, scatteredData[index], execution)
    );

    const stageResults = await Promise.all(stagePromises);

    // Check for failures
    const failures = stageResults.filter(result => result.status === 'failed');
    if (failures.length > 0) {
      throw new Error(`${failures.length} stages failed in scatter-gather execution`);
    }

    // Gather: Combine results
    const gatheredOutput = this.gatherResults(stageResults.map(r => r.output));

    return this.createSuccessResult(execution, stageResults, gatheredOutput);
  }

  private async executeConditional(execution: WorkflowExecution): Promise<OrchestrationResult> {
    const workflow = execution.workflow;
    const stageResults: StageResult[] = [];
    let currentData = execution.request.input;

    for (const stage of workflow.stages) {
      // Check conditions
      const shouldExecute = await this.evaluateStageConditions(stage, currentData);
      
      if (shouldExecute) {
        const stageResult = await this.executeStage(stage, currentData, execution);
        stageResults.push(stageResult);
        
        if (stageResult.status === 'failed') {
          throw new Error(`Stage ${stage.id} failed: ${stageResult.error?.message}`);
        }
        
        currentData = stageResult.output;
      } else {
        // Create skipped stage result
        stageResults.push({
          stageId: stage.id,
          agentId: stage.agentId,
          capabilityId: stage.capabilityId,
          status: 'completed',
          input: currentData,
          output: currentData, // Pass through unchanged
          metrics: {
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            retryCount: 0,
            resourceUsage: { cpu: 0, memory: 0, network: 0 }
          }
        });
      }
    }

    return this.createSuccessResult(execution, stageResults, currentData);
  }

  private async executeLoop(execution: WorkflowExecution): Promise<OrchestrationResult> {
    const workflow = execution.workflow;
    const stageResults: StageResult[] = [];
    let currentData = execution.request.input;
    let iteration = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (iteration < maxIterations) {
      let shouldContinue = false;
      
      for (const stage of workflow.stages) {
        const stageResult = await this.executeStage(stage, currentData, execution);
        stageResults.push(stageResult);
        
        if (stageResult.status === 'failed') {
          throw new Error(`Stage ${stage.id} failed: ${stageResult.error?.message}`);
        }
        
        currentData = stageResult.output;
        
        // Check loop continuation condition
        shouldContinue = await this.evaluateLoopCondition(stage, currentData);
      }
      
      iteration++;
      
      if (!shouldContinue) {
        break;
      }
    }

    if (iteration >= maxIterations) {
      throw new Error('Loop execution exceeded maximum iterations');
    }

    return this.createSuccessResult(execution, stageResults, currentData);
  }

  private async executeEventDriven(execution: WorkflowExecution): Promise<OrchestrationResult> {
    // Event-driven execution waits for events to trigger stages
    // For simplicity, this implementation executes stages based on data presence
    return await this.executeDAG(execution);
  }

  private async executeStage(
    stage: WorkflowStage,
    input: any,
    execution: WorkflowExecution
  ): Promise<StageResult> {
    const startTime = new Date();
    let retryCount = 0;
    
    while (retryCount <= stage.retry.maxAttempts) {
      try {
        // Get agent for this stage
        const agent = await this.agentRegistry.get(stage.agentId);
        if (!agent) {
          throw new Error(`Agent not found: ${stage.agentId}`);
        }

        // Find capability
        const capability = agent.capabilities.find(cap => cap.id === stage.capabilityId);
        if (!capability) {
          throw new Error(`Capability not found: ${stage.capabilityId}`);
        }

        // Execute stage with timeout
        const output = await this.executeStageWithTimeout(stage, input, agent, capability);
        
        const endTime = new Date();
        
        return {
          stageId: stage.id,
          agentId: stage.agentId,
          capabilityId: stage.capabilityId,
          status: 'completed',
          input,
          output,
          metrics: {
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            retryCount,
            resourceUsage: { cpu: 0, memory: 0, network: 0 } // Would be collected from agent
          }
        };
        
      } catch (error) {
        retryCount++;
        
        if (retryCount <= stage.retry.maxAttempts) {
          // Apply retry delay
          const delay = this.calculateRetryDelay(stage.retry, retryCount);
          await this.sleep(delay);
          continue;
        }
        
        // Max retries exceeded
        const endTime = new Date();
        
        return {
          stageId: stage.id,
          agentId: stage.agentId,
          capabilityId: stage.capabilityId,
          status: 'failed',
          input,
          error: {
            code: 'STAGE_EXECUTION_FAILED',
            message: error.message,
            recoverable: retryCount <= stage.retry.maxAttempts,
            details: error
          },
          metrics: {
            startTime,
            endTime,
            duration: endTime.getTime() - startTime.getTime(),
            retryCount: retryCount - 1,
            resourceUsage: { cpu: 0, memory: 0, network: 0 }
          }
        };
      }
    }

    throw new Error('Unexpected end of stage execution loop');
  }

  private async executeStageWithTimeout(
    stage: WorkflowStage,
    input: any,
    agent: any,
    capability: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Stage ${stage.id} timed out after ${stage.timeout}ms`));
      }, stage.timeout);

      // Simulate stage execution
      // In real implementation, this would call the agent's capability endpoint
      setTimeout(() => {
        clearTimeout(timeoutId);
        
        // Simulate processing result
        const result = {
          stageId: stage.id,
          processed: true,
          input: input,
          timestamp: new Date(),
          agentResponse: `Processed by ${agent.name} using ${capability.name}`
        };
        
        resolve(result);
      }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
    });
  }

  private prepareStageInput(dependencies: string[], stageOutputs: Map<string, any>, originalInput: any): any {
    if (dependencies.length === 0) {
      return originalInput;
    }

    const input: any = { __original_input__: originalInput };
    
    for (const dep of dependencies) {
      const depOutput = stageOutputs.get(dep);
      if (depOutput !== undefined) {
        input[dep] = depOutput;
      }
    }

    return input;
  }

  private scatterData(data: any, partitions: number): any[] {
    // Simple data scattering - in real implementation this would be more sophisticated
    if (Array.isArray(data)) {
      const chunkSize = Math.ceil(data.length / partitions);
      const scattered = [];
      
      for (let i = 0; i < partitions; i++) {
        const start = i * chunkSize;
        const end = start + chunkSize;
        scattered.push(data.slice(start, end));
      }
      
      return scattered;
    } else {
      // Replicate data for all partitions
      return Array(partitions).fill(data);
    }
  }

  private gatherResults(results: any[]): any {
    // Simple result gathering
    if (results.every(r => Array.isArray(r))) {
      return results.flat();
    } else {
      return results;
    }
  }

  private async evaluateStageConditions(stage: WorkflowStage, data: any): Promise<boolean> {
    if (!stage.conditions || stage.conditions.length === 0) {
      return true;
    }

    // Evaluate all conditions (AND logic)
    for (const condition of stage.conditions) {
      const conditionResult = this.evaluateCondition(condition, data);
      if (!conditionResult) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: any, data: any): boolean {
    // Simple condition evaluation - in real implementation this would be more sophisticated
    try {
      const value = this.extractValue(data, condition.field);
      
      switch (condition.operator) {
        case 'eq': return value === condition.value;
        case 'ne': return value !== condition.value;
        case 'gt': return value > condition.value;
        case 'lt': return value < condition.value;
        case 'gte': return value >= condition.value;
        case 'lte': return value <= condition.value;
        case 'contains': return Array.isArray(value) && value.includes(condition.value);
        case 'matches': return new RegExp(condition.value).test(String(value));
        default: return true;
      }
    } catch {
      return false;
    }
  }

  private async evaluateLoopCondition(stage: WorkflowStage, data: any): Promise<boolean> {
    // Simple loop condition - continue if data has 'continue' property set to true
    return data && data.continue === true;
  }

  private extractValue(data: any, field: string): any {
    if (!field) return data;
    
    const parts = field.split('.');
    let value = data;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private calculateRetryDelay(retryPolicy: any, attemptNumber: number): number {
    const { backoffType, baseDelay, maxDelay } = retryPolicy;
    
    let delay = baseDelay;
    
    switch (backoffType) {
      case 'fixed':
        delay = baseDelay;
        break;
      case 'linear':
        delay = baseDelay * attemptNumber;
        break;
      case 'exponential':
        delay = baseDelay * Math.pow(2, attemptNumber - 1);
        break;
    }
    
    return Math.min(delay, maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private createSuccessResult(
    execution: WorkflowExecution,
    stageResults: StageResult[],
    output: any
  ): OrchestrationResult {
    const endTime = new Date();
    const duration = endTime.getTime() - execution.startTime.getTime();
    
    return {
      id: execution.id,
      requestId: execution.request.id,
      status: 'completed',
      result: output,
      metrics: {
        startTime: execution.startTime,
        endTime,
        duration,
        stagesExecuted: stageResults.length,
        agentsUsed: [...new Set(stageResults.map(r => r.agentId))],
        resourceUsage: this.calculateResourceUsage(stageResults),
        performance: this.calculatePerformanceMetrics(stageResults)
      },
      stages: stageResults,
      compliance: { level: 'bronze', passed: true, violations: [], score: 100 }
    };
  }

  private createFailedResult(execution: WorkflowExecution, error: Error): OrchestrationResult {
    const endTime = new Date();
    const duration = endTime.getTime() - execution.startTime.getTime();
    
    return {
      id: execution.id,
      requestId: execution.request.id,
      status: 'failed',
      error: {
        code: 'WORKFLOW_EXECUTION_FAILED',
        message: error.message,
        recoverable: false,
        details: error
      },
      metrics: {
        startTime: execution.startTime,
        endTime,
        duration,
        stagesExecuted: 0,
        agentsUsed: [],
        resourceUsage: { cpu: 0, memory: 0, network: 0 },
        performance: { avgResponseTime: 0, totalThroughput: 0, errorRate: 100, bottlenecks: [] }
      },
      stages: [],
      compliance: { level: 'bronze', passed: false, violations: [], score: 0 }
    };
  }

  private calculateResourceUsage(stageResults: StageResult[]): any {
    // Simple resource usage calculation
    return {
      cpu: stageResults.reduce((sum, r) => sum + (r.metrics.resourceUsage.cpu || 0), 0),
      memory: stageResults.reduce((sum, r) => sum + (r.metrics.resourceUsage.memory || 0), 0),
      network: stageResults.reduce((sum, r) => sum + (r.metrics.resourceUsage.network || 0), 0)
    };
  }

  private calculatePerformanceMetrics(stageResults: StageResult[]): any {
    const durations = stageResults.map(r => r.metrics.duration);
    const avgResponseTime = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0;
    
    const failedCount = stageResults.filter(r => r.status === 'failed').length;
    const errorRate = stageResults.length > 0 ? (failedCount / stageResults.length) * 100 : 0;
    
    return {
      avgResponseTime,
      totalThroughput: stageResults.length,
      errorRate,
      bottlenecks: [] // Would be identified through analysis
    };
  }

  private async validateWorkflowDefinition(workflow: WorkflowDefinition): Promise<void> {
    if (!workflow.id || !workflow.name) {
      throw new Error('Workflow must have id and name');
    }
    
    if (!workflow.stages || workflow.stages.length === 0) {
      throw new Error('Workflow must have at least one stage');
    }
    
    // Validate stages reference valid agents and capabilities
    for (const stage of workflow.stages) {
      const agent = await this.agentRegistry.get(stage.agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${stage.agentId}`);
      }
      
      const capability = agent.capabilities.find(cap => cap.id === stage.capabilityId);
      if (!capability) {
        throw new Error(`Capability not found: ${stage.capabilityId} on agent ${stage.agentId}`);
      }
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('WorkflowEngine not initialized. Call initialize() first.');
    }
  }
}

class WorkflowExecution {
  public readonly id: string;
  public readonly request: OrchestrationRequest;
  public readonly workflow: WorkflowDefinition;
  public readonly startTime: Date;
  public status: ExecutionStatus = 'pending';
  public result?: OrchestrationResult;
  public endTime?: Date;

  constructor(id: string, request: OrchestrationRequest, workflow: WorkflowDefinition) {
    this.id = id;
    this.request = request;
    this.workflow = workflow;
    this.startTime = new Date();
  }

  start(): void {
    this.status = 'running';
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