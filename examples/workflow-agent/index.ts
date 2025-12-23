/**
 * Workflow Agent Reference Implementation
 * Demonstrates workflow automation and orchestration using @ossa/runtime
 */

import { createRuntime, OssaAgent } from '@ossa/runtime';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Workflow step definition
 */
interface WorkflowStep {
  id: string;
  name: string;
  action: string;
  input: Record<string, unknown>;
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
  onSuccess?: string;  // Next step ID
  onFailure?: string;  // Fallback step ID
}

/**
 * Workflow definition
 */
interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  startStep: string;
}

/**
 * Workflow execution state
 */
interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  stepResults: Map<string, {
    status: 'pending' | 'running' | 'completed' | 'failed';
    output?: unknown;
    error?: string;
    attempts: number;
  }>;
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Workflow engine
 */
class WorkflowEngine {
  private executions: Map<string, WorkflowExecution> = new Map();
  private stepHandlers: Map<string, (input: unknown) => Promise<unknown>> = new Map();

  /**
   * Register a step handler
   */
  registerStepHandler(action: string, handler: (input: unknown) => Promise<unknown>) {
    this.stepHandlers.set(action, handler);
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(workflow: Workflow): Promise<WorkflowExecution> {
    const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const execution: WorkflowExecution = {
      workflowId: workflow.id,
      executionId,
      status: 'running',
      currentStep: workflow.startStep,
      stepResults: new Map(),
      startedAt: new Date(),
    };

    this.executions.set(executionId, execution);

    // Initialize step results
    for (const step of workflow.steps) {
      execution.stepResults.set(step.id, {
        status: 'pending',
        attempts: 0,
      });
    }

    try {
      // Execute workflow steps
      await this.executeSteps(workflow, execution);

      execution.status = 'completed';
      execution.completedAt = new Date();
    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      throw error;
    }

    return execution;
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeSteps(workflow: Workflow, execution: WorkflowExecution) {
    let currentStepId = workflow.startStep;

    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) {
        throw new Error(`Step ${currentStepId} not found`);
      }

      execution.currentStep = currentStepId;
      const stepResult = execution.stepResults.get(currentStepId)!;
      stepResult.status = 'running';

      try {
        // Execute step with retry logic
        const output = await this.executeStepWithRetry(step);

        stepResult.status = 'completed';
        stepResult.output = output;

        // Move to next step
        currentStepId = step.onSuccess || '';
      } catch (error) {
        stepResult.status = 'failed';
        stepResult.error = error instanceof Error ? error.message : String(error);

        // Move to fallback step or fail
        if (step.onFailure) {
          currentStepId = step.onFailure;
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Execute a single step with retry logic
   */
  private async executeStepWithRetry(step: WorkflowStep): Promise<unknown> {
    const handler = this.stepHandlers.get(step.action);
    if (!handler) {
      throw new Error(`No handler registered for action: ${step.action}`);
    }

    const maxAttempts = step.retry?.maxAttempts || 1;
    const backoffMs = step.retry?.backoffMs || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await handler(step.input);
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        // Wait before retry with exponential backoff (capped at 30 seconds)
        const delay = Math.min(backoffMs * Math.pow(2, attempt - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Unreachable');
  }

  /**
   * Get execution status
   */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Cancel a workflow execution
   */
  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'cancelled';
      execution.completedAt = new Date();
      return true;
    }
    return false;
  }
}

/**
 * Create workflow agent
 */
export async function createWorkflowAgent(): Promise<OssaAgent> {
  const runtime = createRuntime();

  // Load agent manifest
  const manifestPath = join(__dirname, 'manifest.yaml');
  const agent = await runtime.loadAgent(manifestPath);

  // Initialize workflow engine
  const engine = new WorkflowEngine();

  // Register sample step handlers
  engine.registerStepHandler('fetch_data', async (input: any) => {
    console.log('  → Fetching data:', input.url);
    return { data: { items: [1, 2, 3] } };
  });

  engine.registerStepHandler('transform_data', async (input: any) => {
    console.log('  → Transforming data');
    return { transformed: true, count: 3 };
  });

  engine.registerStepHandler('save_data', async (input: any) => {
    console.log('  → Saving data to:', input.destination);
    return { saved: true };
  });

  engine.registerStepHandler('send_notification', async (input: any) => {
    console.log('  → Sending notification to:', input.recipient);
    return { sent: true };
  });

  // Register execute_workflow capability
  agent.registerCapability(
    {
      name: 'execute_workflow',
      description: 'Execute a workflow definition',
      input_schema: {
        type: 'object',
        properties: {
          workflow: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              steps: { type: 'array' },
              startStep: { type: 'string' }
            },
            required: ['id', 'name', 'steps', 'startStep']
          }
        },
        required: ['workflow']
      },
      output_schema: {
        type: 'object',
        properties: {
          executionId: { type: 'string' },
          status: { type: 'string' },
          stepResults: { type: 'object' }
        }
      },
      timeout_seconds: 300
    },
    async (input: { workflow: Workflow }) => {
      const execution = await engine.executeWorkflow(input.workflow);
      return {
        executionId: execution.executionId,
        status: execution.status,
        stepResults: Object.fromEntries(execution.stepResults.entries()),
      };
    }
  );

  // Register get_execution capability
  agent.registerCapability(
    {
      name: 'get_execution',
      description: 'Get workflow execution status',
      input_schema: {
        type: 'object',
        properties: {
          executionId: { type: 'string' }
        },
        required: ['executionId']
      },
      output_schema: {
        type: 'object',
        properties: {
          executionId: { type: 'string' },
          status: { type: 'string' },
          currentStep: { type: 'string' },
          stepResults: { type: 'object' }
        }
      }
    },
    async (input: { executionId: string }) => {
      const execution = engine.getExecution(input.executionId);
      if (!execution) {
        throw new Error(`Execution ${input.executionId} not found`);
      }
      return {
        executionId: execution.executionId,
        status: execution.status,
        currentStep: execution.currentStep,
        stepResults: Object.fromEntries(execution.stepResults.entries()),
      };
    }
  );

  // Register cancel_workflow capability
  agent.registerCapability(
    {
      name: 'cancel_workflow',
      description: 'Cancel a running workflow',
      input_schema: {
        type: 'object',
        properties: {
          executionId: { type: 'string' }
        },
        required: ['executionId']
      },
      output_schema: {
        type: 'object',
        properties: {
          cancelled: { type: 'boolean' }
        }
      }
    },
    async (input: { executionId: string }) => {
      const cancelled = engine.cancelExecution(input.executionId);
      return { cancelled };
    }
  );

  return agent;
}

/**
 * Example usage
 */
async function main() {
  console.log('🔄 Workflow Agent Example\n');

  // Create and initialize agent
  const agent = await createWorkflowAgent();
  console.log('✅ Agent loaded:', agent.getMetadata().name);

  // Define a sample workflow
  const workflow: Workflow = {
    id: 'data-pipeline',
    name: 'Data Pipeline Workflow',
    description: 'Fetch, transform, and save data',
    startStep: 'step1',
    steps: [
      {
        id: 'step1',
        name: 'Fetch Data',
        action: 'fetch_data',
        input: { url: 'https://api.example.com/data' },
        retry: { maxAttempts: 3, backoffMs: 1000 },
        onSuccess: 'step2',
        onFailure: 'step4'
      },
      {
        id: 'step2',
        name: 'Transform Data',
        action: 'transform_data',
        input: {},
        onSuccess: 'step3'
      },
      {
        id: 'step3',
        name: 'Save Data',
        action: 'save_data',
        input: { destination: 'database' },
        onSuccess: 'step4'
      },
      {
        id: 'step4',
        name: 'Send Notification',
        action: 'send_notification',
        input: { recipient: 'admin@example.com' }
      }
    ]
  };

  // Execute workflow
  console.log('\n🚀 Executing workflow...');
  const result = await agent.execute('execute_workflow', { workflow });

  if (result.success) {
    console.log('\n✅ Workflow completed:');
    console.log('   Execution ID:', result.data?.executionId);
    console.log('   Status:', result.data?.status);
    console.log('   Steps:', Object.keys(result.data?.stepResults || {}).length);
  } else {
    console.log('\n❌ Workflow failed:', result.error?.message);
  }

  console.log('\n✨ Example completed!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
