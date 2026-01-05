/**
 * Coordinator Agent Reference Implementation
 * Demonstrates multi-agent coordination and task delegation using @ossa/runtime
 */

import { createRuntime, OssaAgent, ExecutionResult } from '@ossa/runtime';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Agent registry for managing multiple agents
 */
interface AgentInfo {
  id: string;
  role: string;
  capabilities: string[];
  status: 'available' | 'busy' | 'offline';
}

/**
 * Task delegation request
 */
interface DelegationRequest {
  taskType: string;
  input: unknown;
  preferredAgent?: string;
  timeout?: number;
}

/**
 * Delegation result
 */
interface DelegationResult {
  agentId: string;
  taskType: string;
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime: number;
}

/**
 * Multi-agent coordinator
 */
class AgentCoordinator {
  private agents: Map<string, AgentInfo> = new Map();
  private agentInstances: Map<string, OssaAgent> = new Map();

  /**
   * Register an agent with the coordinator
   */
  registerAgent(agent: OssaAgent, capabilities: string[]) {
    const metadata = agent.getMetadata();
    const info: AgentInfo = {
      id: agent.id,
      role: metadata.role,
      capabilities,
      status: 'available',
    };
    this.agents.set(agent.id, info);
    this.agentInstances.set(agent.id, agent);
  }

  /**
   * Find best agent for a task
   */
  findBestAgent(taskType: string, preferredAgent?: string): OssaAgent | null {
    // If preferred agent specified, try it first
    if (preferredAgent) {
      const agent = this.agentInstances.get(preferredAgent);
      if (agent && this.agents.get(preferredAgent)?.status === 'available') {
        return agent;
      }
    }

    // Find available agent with matching capability
    for (const [id, info] of this.agents.entries()) {
      if (info.status === 'available' && info.capabilities.includes(taskType)) {
        return this.agentInstances.get(id) || null;
      }
    }

    return null;
  }

  /**
   * Delegate task to appropriate agent
   */
  async delegateTask(request: DelegationRequest): Promise<DelegationResult> {
    const startTime = Date.now();

    // Find best agent
    const agent = this.findBestAgent(request.taskType, request.preferredAgent);
    if (!agent) {
      return {
        agentId: 'none',
        taskType: request.taskType,
        success: false,
        error: `No available agent found for task type: ${request.taskType}`,
        executionTime: Date.now() - startTime,
      };
    }

    // Mark agent as busy
    const agentInfo = this.agents.get(agent.id);
    if (!agentInfo) {
      throw new Error(`Agent ${agent.id} not found in registry`);
    }
    agentInfo.status = 'busy';

    try {
      // Execute task on agent
      const result = await agent.execute(request.taskType, request.input);

      return {
        agentId: agent.id,
        taskType: request.taskType,
        success: result.success,
        result: result.data,
        error: result.error?.message,
        executionTime: Date.now() - startTime,
      };
    } finally {
      // Mark agent as available again
      agentInfo.status = 'available';
    }
  }

  /**
   * Delegate multiple tasks in parallel
   */
  async delegateParallel(requests: DelegationRequest[]): Promise<DelegationResult[]> {
    const promises = requests.map(req => this.delegateTask(req));
    return Promise.all(promises);
  }

  /**
   * Get coordinator statistics
   */
  getStats(): {
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    capabilities: string[];
  } {
    let available = 0;
    let busy = 0;
    const capabilities = new Set<string>();

    for (const info of this.agents.values()) {
      if (info.status === 'available') available++;
      if (info.status === 'busy') busy++;
      info.capabilities.forEach(cap => capabilities.add(cap));
    }

    return {
      totalAgents: this.agents.size,
      availableAgents: available,
      busyAgents: busy,
      capabilities: Array.from(capabilities),
    };
  }

  /**
   * Get agent status
   */
  getAgentStatus(agentId: string): AgentInfo | undefined {
    return this.agents.get(agentId);
  }

  /**
   * List all agents
   */
  listAgents(): AgentInfo[] {
    return Array.from(this.agents.values());
  }
}

/**
 * Create mock specialized agents for demonstration
 */
async function createMockAgents(runtime: any) {
  // Create mock data processing agent
  const dataAgent = await runtime.loadAgent({
    apiVersion: 'v0.3.0',
    kind: 'Agent',
    metadata: { name: 'data-processor' },
    spec: { role: 'Process and analyze data' },
  });

  dataAgent.registerCapability(
    {
      name: 'process',
      description: 'Process data',
      input_schema: { type: 'object' },
      output_schema: { type: 'object' },
    },
    async (input: any) => {
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
      return { processed: true, items: input.items?.length || 0 };
    }
  );

  // Create mock analytics agent
  const analyticsAgent = await runtime.loadAgent({
    apiVersion: 'v0.3.0',
    kind: 'Agent',
    metadata: { name: 'analytics-engine' },
    spec: { role: 'Perform analytics and reporting' },
  });

  analyticsAgent.registerCapability(
    {
      name: 'analyze',
      description: 'Analyze data',
      input_schema: { type: 'object' },
      output_schema: { type: 'object' },
    },
    async (input: any) => {
      await new Promise(resolve => setTimeout(resolve, 150)); // Simulate work
      return {
        insights: ['trend1', 'trend2'],
        summary: { total: 100, average: 50 },
      };
    }
  );

  // Create mock notification agent
  const notificationAgent = await runtime.loadAgent({
    apiVersion: 'v0.3.0',
    kind: 'Agent',
    metadata: { name: 'notification-service' },
    spec: { role: 'Send notifications and alerts' },
  });

  notificationAgent.registerCapability(
    {
      name: 'notify',
      description: 'Send notification',
      input_schema: { type: 'object' },
      output_schema: { type: 'object' },
    },
    async (input: any) => {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate work
      return { sent: true, recipient: input.recipient };
    }
  );

  return { dataAgent, analyticsAgent, notificationAgent };
}

/**
 * Create coordinator agent
 */
export async function createCoordinatorAgent(): Promise<OssaAgent> {
  const runtime = createRuntime();

  // Load coordinator manifest
  const manifestPath = join(__dirname, 'manifest.yaml');
  const agent = await runtime.loadAgent(manifestPath);

  // Initialize coordinator
  const coordinator = new AgentCoordinator();

  // Create and register specialized agents
  const { dataAgent, analyticsAgent, notificationAgent } = await createMockAgents(runtime);
  coordinator.registerAgent(dataAgent, ['process']);
  coordinator.registerAgent(analyticsAgent, ['analyze']);
  coordinator.registerAgent(notificationAgent, ['notify']);

  // Register delegate_task capability
  agent.registerCapability(
    {
      name: 'delegate_task',
      description: 'Delegate a task to a specialized agent',
      input_schema: {
        type: 'object',
        properties: {
          taskType: { type: 'string' },
          input: { type: 'object' },
          preferredAgent: { type: 'string' },
        },
        required: ['taskType', 'input'],
      },
      output_schema: {
        type: 'object',
        properties: {
          agentId: { type: 'string' },
          success: { type: 'boolean' },
          result: { type: 'object' },
        },
      },
    },
    async (input: DelegationRequest) => {
      return coordinator.delegateTask(input);
    }
  );

  // Register delegate_parallel capability
  agent.registerCapability(
    {
      name: 'delegate_parallel',
      description: 'Delegate multiple tasks in parallel',
      input_schema: {
        type: 'object',
        properties: {
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                taskType: { type: 'string' },
                input: { type: 'object' },
              },
            },
          },
        },
        required: ['tasks'],
      },
      output_schema: {
        type: 'object',
        properties: {
          results: { type: 'array' },
        },
      },
    },
    async (input: { tasks: DelegationRequest[] }) => {
      const results = await coordinator.delegateParallel(input.tasks);
      return { results };
    }
  );

  // Register get_stats capability
  agent.registerCapability(
    {
      name: 'get_stats',
      description: 'Get coordinator statistics',
      input_schema: { type: 'object', properties: {} },
      output_schema: {
        type: 'object',
        properties: {
          totalAgents: { type: 'number' },
          availableAgents: { type: 'number' },
          capabilities: { type: 'array' },
        },
      },
    },
    async () => {
      return coordinator.getStats();
    }
  );

  // Register list_agents capability
  agent.registerCapability(
    {
      name: 'list_agents',
      description: 'List all registered agents',
      input_schema: { type: 'object', properties: {} },
      output_schema: {
        type: 'object',
        properties: {
          agents: { type: 'array' },
        },
      },
    },
    async () => {
      return { agents: coordinator.listAgents() };
    }
  );

  return agent;
}

/**
 * Example usage
 */
async function main() {
  console.log('🎯 Coordinator Agent Example\n');

  // Create and initialize coordinator
  const agent = await createCoordinatorAgent();
  console.log('✅ Coordinator loaded:', agent.getMetadata().name);

  // Get coordinator stats
  console.log('\n📊 Coordinator statistics:');
  const stats = await agent.execute('get_stats', {});
  if (stats.success) {
    console.log('   Total agents:', stats.data?.totalAgents);
    console.log('   Available:', stats.data?.availableAgents);
    console.log('   Capabilities:', stats.data?.capabilities?.join(', '));
  }

  // List all agents
  console.log('\n👥 Registered agents:');
  const agentsList = await agent.execute('list_agents', {});
  if (agentsList.success) {
    for (const info of (agentsList.data as any).agents) {
      console.log(`   - ${info.id} (${info.role}): ${info.capabilities.join(', ')}`);
    }
  }

  // Delegate single task
  console.log('\n🎯 Delegating task to data processor...');
  const result = await agent.execute('delegate_task', {
    taskType: 'process',
    input: { items: [1, 2, 3, 4, 5] },
  });
  if (result.success) {
    console.log('   Agent:', result.data?.agentId);
    console.log('   Result:', JSON.stringify(result.data?.result));
    console.log('   Time:', result.data?.executionTime + 'ms');
  }

  // Delegate parallel tasks
  console.log('\n⚡ Delegating parallel tasks...');
  const parallelResult = await agent.execute('delegate_parallel', {
    tasks: [
      { taskType: 'process', input: { items: [1, 2, 3] } },
      { taskType: 'analyze', input: { dataset: 'sales' } },
      { taskType: 'notify', input: { recipient: 'admin@example.com' } },
    ],
  });
  if (parallelResult.success) {
    console.log('   Completed tasks:', (parallelResult.data as any).results.length);
    for (const res of (parallelResult.data as any).results) {
      console.log(`   - ${res.taskType} by ${res.agentId}: ${res.success ? '✓' : '✗'}`);
    }
  }

  console.log('\n✨ Coordination example completed!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
