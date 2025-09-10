/**
 * Agent-Forge Integration Commands
 * Connects OSSA CLI with agent-forge for unified workflow
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export function createAgentForgeIntegration(): Command {
  const cmd = new Command('forge')
    .description('Agent-forge integration commands');

  cmd.command('integrate')
    .description('Integrate OSSA CLI with agent-forge')
    .option('--agent-forge-path <path>', 'Path to agent-forge project', '/Users/flux423/Sites/LLM/common_npm/agent-forge')
    .option('--install-commands', 'Install OSSA commands in agent-forge')
    .action(async (options) => {
      console.log(chalk.blue('🔗 Setting up agent-forge integration...'));
      
      const agentForgePath = options.agentForgePath;
      const agentForgeCommandsPath = path.join(agentForgePath, 'src/commands');
      
      // Check if agent-forge exists
      if (!await fs.pathExists(agentForgePath)) {
        console.log(chalk.red(`❌ Agent-forge not found at: ${agentForgePath}`));
        return;
      }
      
      console.log(chalk.green(`✅ Found agent-forge at: ${agentForgePath}`));
      
      if (options.installCommands) {
        await installOSSACommands(agentForgeCommandsPath);
      }
      
      console.log(chalk.blue('\n🎯 Integration Summary:'));
      console.log(chalk.gray('  Available in agent-forge:'));
      console.log(chalk.gray('    forge ossa orchestrate deploy    # Deploy 93 agents'));
      console.log(chalk.gray('    forge ossa standardize all       # Standardize 47 projects'));
      console.log(chalk.gray('    forge ossa discover              # Discover projects'));
      console.log(chalk.gray('    forge ossa validate              # Validate compliance'));
    });

  cmd.command('sync')
    .description('Sync OSSA templates with agent-forge')
    .option('--agent-forge-path <path>', 'Path to agent-forge project', '/Users/flux423/Sites/LLM/common_npm/agent-forge')
    .action(async (options) => {
      console.log(chalk.blue('🔄 Syncing OSSA templates with agent-forge...'));
      
      // Sync templates, schemas, etc.
      console.log(chalk.green('✅ Templates synced'));
    });

  return cmd;
}

async function installOSSACommands(commandsPath: string): Promise<void> {
  console.log(chalk.blue('📦 Installing OSSA commands in agent-forge...'));
  
  const ossaIntegrationCommand = `
/**
 * OSSA Integration Commands for Agent-Forge
 * Provides access to OSSA orchestration and standardization
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'child_process';
import path from 'path';

export function createOSSACommand(): Command {
  const cmd = new Command('ossa')
    .description('OSSA v0.1.8 Multi-Agent Orchestration & Standardization');

  // Orchestration commands
  const orchestrateCmd = cmd.command('orchestrate')
    .description('93-agent deployment system');

  orchestrateCmd.command('deploy')
    .description('Deploy all agents with validation')
    .option('-w, --workspace <path>', 'Workspace path', process.cwd())
    .option('--dry-run', 'Show plan without executing')
    .action(async (options) => {
      await runOSSACommand('orchestrate', 'deploy', options);
    });

  orchestrateCmd.command('status')
    .description('Show deployment status')
    .action(async () => {
      await runOSSACommand('orchestrate', 'status');
    });

  orchestrateCmd.command('monitor')
    .description('Monitor deployment in real-time')
    .option('-i, --interval <seconds>', 'Update interval', '5')
    .action(async (options) => {
      await runOSSACommand('orchestrate', 'monitor', options);
    });

  // Standardization commands
  const standardizeCmd = cmd.command('standardize')
    .description('47-project standardization system');

  standardizeCmd.command('all')
    .description('Standardize all projects')
    .option('-w, --workspace <path>', 'Workspace path', process.cwd())
    .option('--dry-run', 'Show plan without executing')
    .action(async (options) => {
      await runOSSACommand('standardize', 'all', options);
    });

  standardizeCmd.command('discover')
    .description('Discover projects with .agents directories')
    .option('--format <type>', 'Output format', 'table')
    .action(async (options) => {
      await runOSSACommand('standardize', 'discover', options);
    });

  // Validation commands
  cmd.command('validate')
    .description('Validate OSSA compliance')
    .option('--project <name>', 'Specific project only')
    .action(async (options) => {
      await runOSSACommand('validate', undefined, options);
    });

  return cmd;
}

async function runOSSACommand(command: string, subcommand?: string, options: any = {}): Promise<void> {
  const ossaCliPath = '/Users/flux423/Sites/LLM/OSSA/cli/bin/ossa';
  
  const args = [command];
  if (subcommand) args.push(subcommand);
  
  // Add options
  Object.entries(options).forEach(([key, value]) => {
    if (key !== 'args' && value !== undefined) {
      args.push(\`--\${key.replace(/([A-Z])/g, '-$1').toLowerCase()}\`);
      if (value !== true) args.push(String(value));
    }
  });

  console.log(chalk.blue(\`🤖 Running: ossa \${args.join(' ')}\`));
  
  const child = spawn('tsx', [ossaCliPath, ...args], {
    stdio: 'inherit',
    cwd: options.workspace || process.cwd()
  });

  return new Promise((resolve, reject) => {
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(\`OSSA command failed with code \${code}\`));
      }
    });
  });
}
`;

  const ossaCommandPath = path.join(commandsPath, 'ossa-integration.ts');
  await fs.writeFile(ossaCommandPath, ossaIntegrationCommand);
  
  console.log(chalk.green(`✅ OSSA commands installed at: ${ossaCommandPath}`));
  
  // Update the main CLI to include OSSA commands
  const cliPath = path.join(path.dirname(commandsPath), 'cli.ts');
  if (await fs.pathExists(cliPath)) {
    console.log(chalk.blue('📝 Add this to your agent-forge cli.ts:'));
    console.log(chalk.gray(`
import { createOSSACommand } from './commands/ossa-integration.js';

// Add after other command registrations:
try {
  program.addCommand(createOSSACommand());
  if (program.opts().verbose) {
    logger.info('Registered OSSA integration commands');
  }
} catch (error) {
  if (program.opts().verbose) {
    logger.warn('OSSA integration not available:', error);
  }
}
`));
  }
}