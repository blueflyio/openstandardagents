#!/usr/bin/env node
/**
 * OSSA v0.1.9 Orchestrator CLI
 * Master orchestrator command for OSSA-compliant agent systems
 */

import { Command } from 'commander';
import { OSSAOrchestrator, DEFAULT_OSSA_CONFIG, AgentSpawnConfig } from '../../core/orchestrator/ossa-orchestrator.js';
import chalk from 'chalk';

const program = new Command();
let orchestrator: OSSAOrchestrator;

/**
 * Initialize OSSA Orchestrator
 */
async function initializeOrchestrator(options: any): Promise<void> {
  console.log(chalk.cyan('\n🚀 Initializing OSSA v0.1.9 Orchestrator...\n'));

  try {
    const config = {
      ...DEFAULT_OSSA_CONFIG,
      ...options
    };

    orchestrator = new OSSAOrchestrator(config);

    console.log(chalk.green('✅ OSSA Orchestrator initialized successfully'));
    console.log(chalk.gray('   - Multi-agent coordination: ENABLED'));
    console.log(chalk.gray('   - __REBUILD_TOOLS workflow: ENABLED'));
    console.log(chalk.gray('   - TDD enforcement: ENABLED'));
    console.log(chalk.gray('   - API-first development: ENABLED'));
    console.log(chalk.gray(`   - Compliance level: ${config.rebuildTools.complianceLevel.toUpperCase()}`));
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize OSSA Orchestrator:'), error);
    process.exit(1);
  }
}

/**
 * Spawn a specialized agent
 */
async function spawnAgent(type: string, options: any): Promise<void> {
  if (!orchestrator) {
    await initializeOrchestrator({});
  }

  console.log(chalk.cyan(`\n🤖 Spawning ${type} agent...\n`));

  try {
    const config: AgentSpawnConfig = {
      agentType: type,
      capabilities: options.capabilities ? options.capabilities.split(',') : ['default'],
      autoRegister: options.autoRegister !== false,
      healthCheckInterval: parseInt(options.healthInterval) || 30000,
      maxRetries: parseInt(options.maxRetries) || 3
    };

    const agent = await orchestrator.spawnSpecializedAgent(config);

    console.log(chalk.green(`✅ Agent spawned successfully`));
    console.log(chalk.gray(`   ID: ${agent.id}`));
    console.log(chalk.gray(`   Type: ${agent.type}`));
    console.log(chalk.gray(`   Capabilities: ${agent.capabilities.map((c) => c.name).join(', ')}`));
    console.log(chalk.gray(`   Status: ${agent.status}`));
  } catch (error) {
    console.error(chalk.red(`❌ Failed to spawn ${type} agent:`), error);
    process.exit(1);
  }
}

/**
 * Execute __REBUILD_TOOLS workflow
 */
async function rebuildTools(tools: string[], options: any): Promise<void> {
  if (!orchestrator) {
    await initializeOrchestrator({});
  }

  console.log(chalk.cyan('\n🔧 Executing __REBUILD_TOOLS workflow...\n'));
  console.log(chalk.gray(`   Tools to rebuild: ${tools.join(', ')}`));

  try {
    await orchestrator.executeRebuildToolsWorkflow(tools);

    console.log(chalk.green('\n✅ __REBUILD_TOOLS workflow initiated'));
    console.log(chalk.gray('   Phases:'));
    console.log(chalk.gray('   1. Analyze tool failures'));
    console.log(chalk.gray('   2. Generate test suite (TDD)'));
    console.log(chalk.gray('   3. Rebuild tools (API-first)'));
    console.log(chalk.gray('   4. Validate rebuilt tools'));
  } catch (error) {
    console.error(chalk.red('❌ Failed to execute __REBUILD_TOOLS workflow:'), error);
    process.exit(1);
  }
}

/**
 * Coordinate multi-agent workflow
 */
async function coordinateWorkflow(workflowFile: string, options: any): Promise<void> {
  if (!orchestrator) {
    await initializeOrchestrator({});
  }

  console.log(chalk.cyan('\n🎭 Coordinating multi-agent workflow...\n'));

  try {
    // In a real implementation, this would load the workflow from file
    const workflow = {
      id: `workflow-${Date.now()}`,
      name: options.name || 'Multi-Agent Workflow',
      version: '0.1.9',
      steps: [],
      triggers: [{ type: 'manual' as const, config: {} }],
      policies: ['ossa-compliance'],
      metadata: {
        author: 'ossa-cli',
        description: 'Multi-agent coordinated workflow',
        tags: ['multi-agent', 'ossa'],
        created: new Date(),
        updated: new Date()
      }
    };

    const strategy = options.strategy || 'adaptive';
    const executionId = await orchestrator.coordinateMultiAgentWorkflow(workflow, strategy);

    console.log(chalk.green('✅ Workflow coordination started'));
    console.log(chalk.gray(`   Execution ID: ${executionId}`));
    console.log(chalk.gray(`   Strategy: ${strategy}`));
    console.log(chalk.gray(`   Status: RUNNING`));
  } catch (error) {
    console.error(chalk.red('❌ Failed to coordinate workflow:'), error);
    process.exit(1);
  }
}

/**
 * Enforce TDD practices
 */
async function enforceTDD(taskId: string, options: any): Promise<void> {
  if (!orchestrator) {
    await initializeOrchestrator({});
  }

  console.log(chalk.cyan('\n🧪 Enforcing Test-Driven Development...\n'));

  try {
    // Emit TDD enforcement event
    orchestrator.emit('test:required', {
      taskId,
      code: options.code || '',
      enforce: true
    });

    console.log(chalk.green('✅ TDD enforcement activated'));
    console.log(chalk.gray(`   Task ID: ${taskId}`));
    console.log(chalk.gray(`   Test coverage required: ${DEFAULT_OSSA_CONFIG.tddEnforcement.minimumCoverage}%`));
    console.log(
      chalk.gray(
        `   Red-Green-Refactor: ${DEFAULT_OSSA_CONFIG.tddEnforcement.enforceRedGreenRefactor ? 'ENFORCED' : 'OPTIONAL'}`
      )
    );
  } catch (error) {
    console.error(chalk.red('❌ Failed to enforce TDD:'), error);
    process.exit(1);
  }
}

/**
 * Show orchestrator status
 */
async function showStatus(): Promise<void> {
  if (!orchestrator) {
    console.log(chalk.yellow('⚠️  Orchestrator not initialized'));
    return;
  }

  console.log(chalk.cyan('\n📊 OSSA Orchestrator Status\n'));

  const health = orchestrator.getHealthStatus();
  const executions = orchestrator.getActiveExecutions();

  console.log(chalk.gray('System Health:'));
  console.log(`   Status: ${health.status === 'healthy' ? chalk.green('HEALTHY') : chalk.red('UNHEALTHY')}`);
  console.log(`   Agents: ${chalk.blue(health.agents.total)} total, ${chalk.green(health.agents.active)} active`);
  console.log(
    `   Executions: ${chalk.blue(health.executions.active)} active, ${chalk.gray(health.executions.total)} total`
  );

  if (executions.length > 0) {
    console.log(chalk.gray('\nActive Workflows:'));
    executions.forEach((exec) => {
      console.log(`   ${chalk.blue(exec.id.substring(0, 8))} - ${exec.status.toUpperCase()}`);
      console.log(`      Phase: ${exec.phases[exec.currentPhase]?.name || 'unknown'}`);
      console.log(`      Tokens: ${exec.budget.usedTokens}/${exec.budget.totalTokens}`);
    });
  }
}

// CLI Command Setup
program
  .name('ossa')
  .description('OSSA v0.1.9 Orchestrator - Master orchestrator for OSSA-compliant agent systems')
  .version('0.1.9');

program
  .command('init')
  .description('Initialize OSSA orchestrator')
  .option('--strict', 'Enable strict compliance mode')
  .option('--test-coverage <percentage>', 'Set minimum test coverage', '80')
  .action(initializeOrchestrator);

program
  .command('spawn <type>')
  .description('Spawn a specialized agent')
  .option('-c, --capabilities <list>', 'Comma-separated list of capabilities')
  .option('--no-auto-register', 'Disable auto-registration')
  .option('--health-interval <ms>', 'Health check interval in milliseconds', '30000')
  .option('--max-retries <count>', 'Maximum retry attempts', '3')
  .action(spawnAgent);

program
  .command('rebuild-tools <tools...>')
  .description('Execute __REBUILD_TOOLS workflow')
  .option('--api-first', 'Enforce API-first development', true)
  .option('--coverage <percentage>', 'Test coverage requirement', '80')
  .action(rebuildTools);

program
  .command('coordinate <workflow-file>')
  .description('Coordinate multi-agent workflow')
  .option('-n, --name <name>', 'Workflow name')
  .option('-s, --strategy <strategy>', 'Coordination strategy (parallel|sequential|adaptive)', 'adaptive')
  .action(coordinateWorkflow);

program
  .command('enforce-tdd <task-id>')
  .description('Enforce Test-Driven Development for a task')
  .option('--code <path>', 'Path to code file')
  .option('--generate-stubs', 'Generate test stubs', true)
  .action(enforceTDD);

program.command('status').description('Show orchestrator status').action(showStatus);

program
  .command('lifecycle <agent-id>')
  .description('Manage agent lifecycle')
  .action(async (agentId: string) => {
    if (!orchestrator) {
      await initializeOrchestrator({});
    }

    try {
      await orchestrator.manageAgentLifecycle(agentId);
      console.log(chalk.green(`✅ Lifecycle management started for agent ${agentId}`));
    } catch (error) {
      console.error(chalk.red('❌ Failed to manage agent lifecycle:'), error);
      process.exit(1);
    }
  });

// Export for testing
export { program as ossaCLI };

// Run CLI if called directly
if (require.main === module) {
  program.parse(process.argv);
}
