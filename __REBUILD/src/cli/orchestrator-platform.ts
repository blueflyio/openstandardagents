#!/usr/bin/env node
/**
 * ORCHESTRATOR-PLATFORM Agent CLI
 * Production runtime coordination and workflow management
 */

import { Command } from 'commander';
import { OrchestratorPlatform } from '../core/orchestrator';
import { OrchestrationAPIServer } from '../api/orchestration/server';
import { 
  OrchestratorConfig, 
  Agent,
  AgentType,
  AgentStatus,
  Capability
} from '../types';

const program = new Command();

// Default production configuration
const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxConcurrentTasks: 50,
  taskTimeout: 300000, // 5 minutes
  retryPolicy: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 30000
  },
  messagebus: {
    type: 'memory', // In production: 'kafka' | 'rabbitmq'
    connection: {},
    topics: ['orchestration.events', 'agent.lifecycle', 'workflow.execution']
  },
  registry: {
    type: 'memory', // In production: 'consul' | 'etcd'
    connection: {},
    ttl: 300
  },
  scheduler: {
    type: 'priority',
    workers: 10,
    queueSize: 1000
  }
};

const DEFAULT_API_CONFIG = {
  port: 3002,
  host: '0.0.0.0',
  cors: true,
  auth: {
    enabled: false, // Enable in production
    type: 'jwt' as const
  },
  rateLimit: {
    enabled: true,
    requests: 100,
    window: 60000 // 1 minute
  }
};

// Global instances
let orchestrator: OrchestratorPlatform;
let apiServer: OrchestrationAPIServer;

/**
 * Start production orchestrator platform
 */
async function startPlatform(options: any): Promise<void> {
  console.log('\n🚀 OSSA ORCHESTRATOR-PLATFORM Starting...\n');
  
  try {
    // Initialize orchestrator
    console.log('[PLATFORM] Initializing orchestration engine...');
    orchestrator = new OrchestratorPlatform(DEFAULT_ORCHESTRATOR_CONFIG);
    
    // Set up event listeners for monitoring
    setupOrchestrationMonitoring();
    
    // Start API server
    console.log('[PLATFORM] Starting REST API server...');
    apiServer = new OrchestrationAPIServer(DEFAULT_ORCHESTRATOR_CONFIG, {
      ...DEFAULT_API_CONFIG,
      port: options.port || DEFAULT_API_CONFIG.port
    });
    
    await apiServer.start();
    
    // Register mock agents for demonstration
    if (options.mockAgents) {
      await registerMockAgents();
    }
    
    console.log('\n✅ ORCHESTRATOR-PLATFORM Ready for Production\n');
    console.log(`📊 Health Check: http://localhost:${options.port || DEFAULT_API_CONFIG.port}/api/v1/orchestration/health`);
    console.log(`📈 Metrics: http://localhost:${options.port || DEFAULT_API_CONFIG.port}/api/v1/orchestration/metrics`);
    console.log(`🔄 Active Executions: http://localhost:${options.port || DEFAULT_API_CONFIG.port}/api/v1/orchestration/executions`);
    console.log('\n💡 Example workflow execution:');
    console.log(`curl -X POST http://localhost:${options.port || DEFAULT_API_CONFIG.port}/api/v1/orchestration/workflows \\\\`);
    console.log(`  -H "Content-Type: application/json" \\\\`);
    console.log(`  -d '{"name":"TestWorkflow","tasks":[{"name":"ProcessData"}]}'`);
    console.log('');
    
    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down ORCHESTRATOR-PLATFORM...');
      await gracefulShutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Received SIGTERM, shutting down...');
      await gracefulShutdown();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('\n❌ Failed to start ORCHESTRATOR-PLATFORM:', error);
    process.exit(1);
  }
}

/**
 * Execute a test workflow to demonstrate capabilities
 */
async function executeTestWorkflow(options: any): Promise<void> {
  console.log('\n🧪 Executing Test Workflow - 360° Feedback Loop\n');
  
  if (!orchestrator) {
    console.error('❌ Orchestrator not initialized. Run "start" command first.');
    return;
  }
  
  try {
    const testWorkflow = {
      id: 'test-workflow-' + Date.now(),
      name: 'OSSA Platform Test Workflow',
      version: '1.0.0',
      steps: [
        {
          id: 'data-processing',
          name: 'Data Processing',
          agent: 'auto-assign',
          action: 'process',
          inputs: { 
            data: 'test-data-set',
            requirements: ['validation', 'transformation']
          }
        },
        {
          id: 'quality-review',
          name: 'Quality Review',
          agent: 'auto-assign',
          action: 'review',
          inputs: { 
            criteria: ['accuracy', 'completeness', 'compliance']
          },
          dependencies: ['data-processing']
        }
      ],
      triggers: [{ type: 'manual' as const, config: {} }],
      policies: ['quality-gate', 'budget-enforcement'],
      metadata: {
        author: 'orchestrator-platform-cli',
        description: 'Test workflow demonstrating 360° feedback loop',
        tags: ['test', 'demo', 'feedback-loop'],
        created: new Date(),
        updated: new Date()
      }
    };
    
    const budget = {
      tokens: options.tokens || 25000,
      timeLimit: options.timeout || 1800 // 30 minutes
    };
    
    console.log(`[TEST] Starting workflow: ${testWorkflow.name}`);
    console.log(`[TEST] Budget: ${budget.tokens} tokens, ${budget.timeLimit}s timeout`);
    
    const executionId = await orchestrator.executeWorkflow(testWorkflow, budget);
    
    console.log(`\n✅ Test workflow started successfully!`);
    console.log(`📋 Execution ID: ${executionId}`);
    console.log(`🔍 Monitor progress: http://localhost:${DEFAULT_API_CONFIG.port}/api/v1/orchestration/executions/${executionId}`);
    
    // Monitor execution progress
    const monitor = setInterval(async () => {
      const execution = orchestrator.getExecutionStatus(executionId);
      if (execution) {
        console.log(`\n📊 Execution Status: ${execution.status}`);
        console.log(`📍 Current Phase: ${execution.currentPhase + 1}/${execution.phases.length} (${execution.phases[execution.currentPhase]?.name || 'unknown'})`);
        console.log(`💰 Budget Used: ${execution.budget.usedTokens}/${execution.budget.totalTokens} tokens`);
        console.log(`🎯 Tasks Completed: ${execution.metrics.tasksCompleted}`);
        console.log(`👥 Agents Used: ${execution.metrics.agentsUsed}`);
        
        if (execution.status === 'completed' || execution.status === 'failed') {
          clearInterval(monitor);
          console.log(`\n🏁 Workflow ${execution.status.toUpperCase()}!`);
          
          if (execution.endTime) {
            const duration = execution.endTime.getTime() - execution.startTime.getTime();
            console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`);
          }
        }
      }
    }, 5000); // Update every 5 seconds
    
  } catch (error) {
    console.error('\n❌ Test workflow execution failed:', error);
  }
}

/**
 * Show platform status and metrics
 */
async function showStatus(): Promise<void> {
  if (!orchestrator) {
    console.error('❌ Orchestrator not initialized. Run "start" command first.');
    return;
  }
  
  console.log('\n📊 ORCHESTRATOR-PLATFORM Status\n');
  
  const health = orchestrator.getHealthStatus();
  const executions = orchestrator.getActiveExecutions();
  
  console.log(`🟢 Platform Status: ${health.status}`);
  console.log(`👥 Agents: ${health.agents.total} total, ${health.agents.active} active, ${health.agents.idle} idle`);
  console.log(`🔄 Executions: ${health.executions.active} active, ${health.executions.total} total`);
  console.log(`📈 Resource Utilization: ${health.metrics.resourceUtilization.toFixed(1)}%`);
  console.log(`❌ Error Rate: ${health.metrics.errorRate}`);
  console.log(`⏱️  Last Update: ${health.timestamp}`);
  
  if (executions.length > 0) {
    console.log('\n🔄 Active Executions:');
    executions.forEach(execution => {
      console.log(`  📋 ${execution.id} (${execution.status})`);
      console.log(`     Phase: ${execution.currentPhase + 1}/${execution.phases.length}`);
      console.log(`     Budget: ${execution.budget.usedTokens}/${execution.budget.totalTokens} tokens`);
    });
  }
  
  console.log('');
}

/**
 * Register mock agents for testing
 */
async function registerMockAgents(): Promise<void> {
  console.log('[PLATFORM] Registering mock agents for testing...');
  
  const mockAgents: Agent[] = [
    {
      id: 'worker-data-processor-v1.0.0',
      name: 'Data Processor Worker',
      version: '1.0.0',
      type: AgentType.WORKER,
      capabilities: [
        { name: 'data-processing', version: '1.0.0', inputs: [], outputs: [] },
        { name: 'transformation', version: '1.0.0', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'orchestrator-platform',
        tags: ['data', 'processing'],
        description: 'Processes and transforms data'
      },
      config: {}
    },
    {
      id: 'critic-quality-reviewer-v1.0.0',
      name: 'Quality Reviewer Critic',
      version: '1.0.0',
      type: AgentType.CRITIC,
      capabilities: [
        { name: 'quality-review', version: '1.0.0', inputs: [], outputs: [] },
        { name: 'validation', version: '1.0.0', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'orchestrator-platform',
        tags: ['quality', 'review'],
        description: 'Reviews and validates quality'
      },
      config: {}
    },
    {
      id: 'judge-decision-maker-v1.0.0',
      name: 'Decision Maker Judge',
      version: '1.0.0',
      type: AgentType.JUDGE,
      capabilities: [
        { name: 'decision-making', version: '1.0.0', inputs: [], outputs: [] },
        { name: 'evaluation', version: '1.0.0', inputs: [], outputs: [] }
      ],
      status: AgentStatus.IDLE,
      metadata: {
        created: new Date(),
        updated: new Date(),
        author: 'orchestrator-platform',
        tags: ['decision', 'evaluation'],
        description: 'Makes final decisions and evaluations'
      },
      config: {}
    }
  ];
  
  for (const agent of mockAgents) {
    await orchestrator.registerAgent(agent);
  }
  
  console.log(`[PLATFORM] Registered ${mockAgents.length} mock agents`);
}

/**
 * Set up orchestration monitoring
 */
function setupOrchestrationMonitoring(): void {
  orchestrator.on('orchestrator:ready', () => {
    console.log('[MONITOR] Orchestrator ready for coordination');
  });
  
  orchestrator.on('agent:registered', (data) => {
    console.log(`[MONITOR] Agent registered: ${data.agentId} (${data.type})`);
  });
  
  orchestrator.on('workflow:started', (data) => {
    console.log(`[MONITOR] Workflow started: ${data.executionId}`);
  });
  
  orchestrator.on('workflow:completed', (data) => {
    console.log(`[MONITOR] Workflow completed: ${data.executionId}`);
  });
  
  orchestrator.on('workflow:failed', (data) => {
    console.log(`[MONITOR] Workflow failed: ${data.executionId} - ${data.error.message}`);
  });
  
  orchestrator.on('agents:allocated', (data) => {
    console.log(`[MONITOR] Agents allocated: ${data.agentIds.length} agents to execution ${data.executionId}`);
  });
  
  orchestrator.on('health:update', (health) => {
    // Periodic health logging (only log significant changes)
    if (health.executions.active > 0) {
      console.log(`[MONITOR] Active executions: ${health.executions.active}, Resource utilization: ${health.metrics.resourceUtilization.toFixed(1)}%`);
    }
  });
}

/**
 * Graceful shutdown
 */
async function gracefulShutdown(): Promise<void> {
  try {
    if (apiServer) {
      await apiServer.stop();
    }
    
    if (orchestrator) {
      // Give active executions time to complete
      const activeExecutions = orchestrator.getActiveExecutions();
      if (activeExecutions.length > 0) {
        console.log(`[SHUTDOWN] Waiting for ${activeExecutions.length} active executions to complete...`);
        // In production, implement proper graceful execution termination
      }
    }
    
    console.log('[SHUTDOWN] Graceful shutdown completed');
  } catch (error) {
    console.error('[SHUTDOWN] Error during shutdown:', error);
  }
}

// CLI Commands
program
  .name('orchestrator-platform')
  .description('OSSA ORCHESTRATOR-PLATFORM Agent - Production Runtime Coordination')
  .version('0.1.9-alpha.1');

program
  .command('start')
  .description('Start the orchestrator platform in production mode')
  .option('-p, --port <port>', 'API server port', '3002')
  .option('--mock-agents', 'Register mock agents for testing', false)
  .action(startPlatform);

program
  .command('test-workflow')
  .description('Execute a test workflow to demonstrate 360° feedback loop')
  .option('--tokens <tokens>', 'Token budget for workflow', '25000')
  .option('--timeout <timeout>', 'Timeout in seconds', '1800')
  .action(executeTestWorkflow);

program
  .command('status')
  .description('Show platform status and metrics')
  .action(showStatus);

program
  .command('health')
  .description('Check platform health')
  .action(async () => {
    if (!orchestrator) {
      console.error('❌ Orchestrator not initialized');
      process.exit(1);
    }
    
    const health = orchestrator.getHealthStatus();
    console.log(JSON.stringify(health, null, 2));
  });

// Handle unrecognized commands
program.on('command:*', () => {
  console.error('Invalid command: %s\n', program.args.join(' '));
  program.help();
});

// Parse arguments
if (require.main === module) {
  program.parse(process.argv);
}

export { program as orchestratorPlatformCLI };