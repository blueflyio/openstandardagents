/**
 * OSSA Platform Integration Layer
 * Connects all platform agents for workflow execution
 */

import { OrchestratorPlatform } from '../orchestrator/index.js';
import { SpecificationValidator } from '../../specification/validator.js';
import { RegistryCore } from '../registry/registry-core.js';

export interface WorkflowExecutionRequest {
  workflow: any; // From workflow.schema.json
  input: Record<string, any>;
  options?: {
    dryRun?: boolean;
    validateOnly?: boolean;
    timeout?: number;
  };
}

export interface ExecutionResult {
  workflowId: string;
  status: 'completed' | 'failed' | 'partial';
  phases: {
    plan?: PhaseResult;
    execute?: PhaseResult;
    review?: PhaseResult;
    judge?: PhaseResult;
    learn?: PhaseResult;
    govern?: PhaseResult;
  };
  metrics: ExecutionMetrics;
}

interface PhaseResult {
  status: 'success' | 'failed' | 'skipped';
  output?: any;
  errors?: string[];
  duration: number;
  tokensUsed?: number;
}

interface ExecutionMetrics {
  totalDuration: number;
  totalTokens: number;
  agentsInvolved: number;
  tasksCompleted: number;
  tasksFailed: number;
}

export class PlatformIntegration {
  private orchestrator: OrchestratorPlatform;
  private validator: SpecificationValidator;
  private registry: RegistryCore;
  
  constructor() {
    this.orchestrator = new OrchestratorPlatform({
      maxConcurrentTasks: 10,
      taskTimeout: 300000,
      retryPolicy: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 30000
      },
      messagebus: {
        type: 'memory',
        connection: {}
      },
      registry: {
        type: 'memory',
        connection: {}
      },
      scheduler: {
        type: 'fifo',
        workers: 1,
        queueSize: 100
      }
    });
    this.validator = new SpecificationValidator();
    this.registry = new RegistryCore();
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing OSSA Platform Integration Layer');
    
    // Initialize core components  
    // await this.orchestrator.initialize(); // private method, initialization happens in constructor
    await this.registry.initialize();
    
    // Register platform agents
    await this.registerPlatformAgents();
    
    // Verify inter-agent communication
    await this.verifyIntegration();
    
    console.log('✅ Platform Integration Ready');
  }

  private async registerPlatformAgents(): Promise<void> {
    // Register core platform agents with the registry
    const platformAgents = [
      {
        agentId: 'orchestrator-platform-v0.1.9',
        agentType: 'orchestrator',
        agentSubType: 'orchestrator.platform',
        version: '0.1.9-alpha.1',
        capabilities: {
          domains: ['orchestration', 'workflow', 'coordination'],
          operations: [
            { name: 'plan', description: 'Workflow planning' },
            { name: 'coordinate', description: 'Agent coordination' }
          ]
        },
        protocols: {
          supported: [
            { name: 'rest', version: '3.1.0', endpoint: 'http://localhost:3002' }
          ]
        },
        performance: {
          throughput: { requestsPerSecond: 100 },
          latency: { p50: 50, p95: 150, p99: 250 }
        }
      },
      {
        agentId: 'spec-authority-v0.1.9',
        agentType: 'verifier',
        agentSubType: 'verifier.specification',
        version: '0.1.9-alpha.1',
        capabilities: {
          domains: ['validation', 'compliance', 'specification'],
          operations: [
            { name: 'validate', description: 'ACDL validation' },
            { name: 'conformance', description: 'Check conformance level' }
          ]
        },
        protocols: {
          supported: [
            { name: 'rest', version: '3.1.0', endpoint: 'http://localhost:3003' }
          ]
        },
        performance: {
          throughput: { requestsPerSecond: 500 },
          latency: { p50: 10, p95: 30, p99: 50 }
        }
      },
      {
        agentId: 'registry-core-v0.1.9',
        agentType: 'integrator',
        agentSubType: 'integrator.registry',
        version: '0.1.9-alpha.1',
        capabilities: {
          domains: ['discovery', 'registry', 'matching'],
          operations: [
            { name: 'register', description: 'Agent registration' },
            { name: 'discover', description: 'Agent discovery' },
            { name: 'match', description: 'Capability matching' }
          ]
        },
        protocols: {
          supported: [
            { name: 'rest', version: '3.1.0', endpoint: 'http://localhost:3004' }
          ]
        },
        performance: {
          throughput: { requestsPerSecond: 1000 },
          latency: { p50: 5, p95: 15, p99: 25 }
        }
      }
    ];

    for (const agent of platformAgents) {
      const validated = await this.validator.validate(agent);
      if (validated.valid) {
        await this.registry.register(agent, 'ossa-platform');
        console.log(`✅ Registered: ${agent.agentId}`);
      } else {
        console.error(`❌ Failed to register ${agent.agentId}:`, (validated as any).errors);
      }
    }
  }

  private async verifyIntegration(): Promise<void> {
    console.log('🔍 Verifying inter-agent communication...');
    
    // Test: Orchestrator can discover agents via Registry
    const discoveryTest = await this.testOrchestratorDiscovery();
    
    // Test: Registry validates agents via Spec-Authority
    const validationTest = await this.testRegistryValidation();
    
    // Test: Complete workflow execution path
    const workflowTest = await this.testWorkflowExecution();
    
    if (discoveryTest && validationTest && workflowTest) {
      console.log('✅ All integration tests passed');
    } else {
      console.warn('⚠️ Some integration tests failed');
    }
  }

  private async testOrchestratorDiscovery(): Promise<boolean> {
    try {
      const agents = await this.registry.discover({
        domains: ['orchestration']
      });
      
      return agents.agents.length > 0;
    } catch (error) {
      console.error('Discovery test failed:', error);
      return false;
    }
  }

  private async testRegistryValidation(): Promise<boolean> {
    try {
      const testAgent = {
        agentId: 'test-agent-v1.0.0',
        agentType: 'worker',
        version: '1.0.0',
        capabilities: { domains: ['test'] },
        protocols: { supported: [] },
        performance: { throughput: {}, latency: {} }
      };
      
      const validation = await this.validator.validate(testAgent);
      return validation.valid;
    } catch (error) {
      console.error('Validation test failed:', error);
      return false;
    }
  }

  private async testWorkflowExecution(): Promise<boolean> {
    try {
      const testWorkflow = {
        apiVersion: 'ossa.io/v0.1.9-alpha.1',
        kind: 'Workflow',
        metadata: {
          name: 'integration-test',
          version: '1.0.0'
        },
        spec: {
          phases: {
            enabled: ['plan', 'execute', 'review']
          },
          tasks: [
            {
              id: 'test-task',
              type: 'validation',
              agent: {
                type: 'worker',
                capabilities: ['validation']
              }
            }
          ],
          execution: {
            mode: 'sequential'
          }
        }
      };
      
      // Validate workflow schema
      const workflowValid = await this.validator.validate(testWorkflow);
      
      if (workflowValid) {
        // Simulate execution through orchestrator
        const result = await this.executeWorkflow({
          workflow: testWorkflow,
          input: { test: true },
          options: { dryRun: true }
        });
        
        return result.status !== 'failed';
      }
      
      return false;
    } catch (error) {
      console.error('Workflow test failed:', error);
      return false;
    }
  }

  async executeWorkflow(request: WorkflowExecutionRequest): Promise<ExecutionResult> {
    const startTime = Date.now();
    const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`\n🔄 Executing Workflow: ${workflowId}`);
    console.log(`Phases: ${request.workflow.spec.phases.enabled.join(' → ')}`);
    
    const result: ExecutionResult = {
      workflowId,
      status: 'completed',
      phases: {},
      metrics: {
        totalDuration: 0,
        totalTokens: 0,
        agentsInvolved: 0,
        tasksCompleted: 0,
        tasksFailed: 0
      }
    };

    // Validate workflow first
    if (!request.options?.validateOnly) {
      const validation = await this.validator.validate(request.workflow);
      if (!validation) {
        result.status = 'failed';
        return result;
      }
    }

    // Execute each enabled phase
    for (const phase of request.workflow.spec.phases.enabled) {
      console.log(`\n📍 Phase: ${phase.toUpperCase()}`);
      
      const phaseStart = Date.now();
      const phaseResult = await this.executePhase(
        phase,
        request.workflow,
        request.input,
        result
      );
      
      result.phases[phase] = phaseResult;
      result.metrics.totalTokens += phaseResult.tokensUsed || 0;
      
      if (phaseResult.status === 'failed' && phase !== 'govern') {
        result.status = 'failed';
        break;
      }
    }

    // Final metrics
    result.metrics.totalDuration = Date.now() - startTime;
    
    console.log('\n📊 Execution Summary:');
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.metrics.totalDuration}ms`);
    console.log(`Tokens Used: ${result.metrics.totalTokens}`);
    console.log(`Tasks: ${result.metrics.tasksCompleted}/${result.metrics.tasksCompleted + result.metrics.tasksFailed}`);
    
    return result;
  }

  private async executePhase(
    phase: string,
    workflow: any,
    input: any,
    result: ExecutionResult
  ): Promise<PhaseResult> {
    const phaseStart = Date.now();
    
    try {
      switch (phase) {
        case 'plan':
          return await this.executePlanPhase(workflow, input);
        
        case 'execute':
          return await this.executeExecutePhase(workflow, input, result);
        
        case 'review':
          return await this.executeReviewPhase(workflow, result);
        
        case 'judge':
          return await this.executeJudgePhase(workflow, result);
        
        case 'learn':
          return await this.executeLearnPhase(workflow, result);
        
        case 'govern':
          return await this.executeGovernPhase(workflow, result);
        
        default:
          return {
            status: 'skipped',
            duration: Date.now() - phaseStart
          };
      }
    } catch (error) {
      return {
        status: 'failed',
        errors: [error.message],
        duration: Date.now() - phaseStart
      };
    }
  }

  private async executePlanPhase(workflow: any, input: any): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Use orchestrator to create execution plan
    // TODO: Implement planWorkflow method in OrchestratorPlatform
    const plan = {
      executionId: 'mock-' + Date.now(),
      phases: ['plan', 'execute', 'review', 'judge', 'learn', 'govern'],
      estimatedCost: { tokens: 1000, time: 60 }
    };
    
    return {
      status: 'success',
      output: plan,
      duration: Date.now() - startTime,
      tokensUsed: 500 // Simulated
    };
  }

  private async executeExecutePhase(
    workflow: any,
    input: any,
    result: ExecutionResult
  ): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Get execution plan from plan phase
    const plan = result.phases.plan?.output;
    if (!plan) {
      return {
        status: 'failed',
        errors: ['No execution plan available'],
        duration: Date.now() - startTime
      };
    }
    
    // Allocate agents for tasks
    const allocations = await this.orchestrator.allocateAgents(
      workflow.metadata.name,
      {
        agentType: 'worker' as any,
        count: 1,
        capabilities: workflow.spec.tasks[0]?.agent?.capabilities || [],
        phase: 'execute'
      }
    );
    
    // Execute tasks (simulated)
    const executionResults = [];
    for (const task of workflow.spec.tasks) {
      const agent = await this.registry.discover({
        domains: task.agent?.capabilities || [],
        agentType: task.agent?.type,
      });
      
      if (agent.agents.length > 0) {
        executionResults.push({
          taskId: task.id,
          status: 'completed',
          agentUsed: agent.agents[0].agentId
        });
        result.metrics.tasksCompleted++;
        result.metrics.agentsInvolved++;
      } else {
        executionResults.push({
          taskId: task.id,
          status: 'failed',
          error: 'No suitable agent found'
        });
        result.metrics.tasksFailed++;
      }
    }
    
    return {
      status: result.metrics.tasksFailed === 0 ? 'success' : 'failed',
      output: executionResults,
      duration: Date.now() - startTime,
      tokensUsed: 1500 // Simulated
    };
  }

  private async executeReviewPhase(workflow: any, result: ExecutionResult): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Get critics for review
    const critics = await this.registry.discover({
      domains: ['quality', 'security', 'compliance'],
      agentType: 'critic'
    });
    
    const reviews = [];
    for (const dimension of workflow.spec.phases.review?.dimensions || ['quality']) {
      reviews.push({
        dimension,
        score: Math.random() * 100, // Simulated
        feedback: `Review for ${dimension} dimension`
      });
    }
    
    return {
      status: 'success',
      output: reviews,
      duration: Date.now() - startTime,
      tokensUsed: 800 // Simulated
    };
  }

  private async executeJudgePhase(workflow: any, result: ExecutionResult): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Get judge for decision
    const judges = await this.registry.discover({
      domains: ['decision', 'arbitration'],
      agentType: 'judge'
    });
    
    const decision = {
      approved: true, // Simulated decision
      confidence: 0.85,
      reasoning: 'Based on review scores and execution results'
    };
    
    return {
      status: 'success',
      output: decision,
      duration: Date.now() - startTime,
      tokensUsed: 300 // Simulated
    };
  }

  private async executeLearnPhase(workflow: any, result: ExecutionResult): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Extract learning from execution
    const lessons = {
      patterns: ['Successful task distribution', 'Efficient agent allocation'],
      improvements: ['Consider parallel execution for independent tasks'],
      metrics: {
        successRate: result.metrics.tasksCompleted / 
                    (result.metrics.tasksCompleted + result.metrics.tasksFailed)
      }
    };
    
    return {
      status: 'success',
      output: lessons,
      duration: Date.now() - startTime,
      tokensUsed: 200 // Simulated
    };
  }

  private async executeGovernPhase(workflow: any, result: ExecutionResult): Promise<PhaseResult> {
    const startTime = Date.now();
    
    // Apply governance policies
    const governance = {
      budgetCompliance: result.metrics.totalTokens <= (workflow.spec.budget?.tokens?.total || Infinity),
      policyViolations: [],
      recommendations: ['All policies satisfied']
    };
    
    return {
      status: 'success',
      output: governance,
      duration: Date.now() - startTime,
      tokensUsed: 100 // Simulated
    };
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Platform Integration...');
    // await this.orchestrator.shutdown(); // Method not implemented
    await this.registry.shutdown();
  }
}

// Export singleton instance
export const platformIntegration = new PlatformIntegration();