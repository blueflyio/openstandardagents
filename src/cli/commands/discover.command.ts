/**
 * OSSA Discover Command
 * Discover OSSA agents in workspace by scanning for .agents/ folders
 */

import chalk from 'chalk';
import { Command } from 'commander';
import * as path from 'path';
import { container } from '../../di-container.js';
import { DiscoveryService } from '../../services/discovery.service.js';

export const discoverCommand = new Command('discover')
  .option('-r, --root <path>', 'Root directory to scan', process.cwd())
  .option('--no-recursive', 'Disable recursive scanning')
  .option('--no-validate', 'Skip validation of discovered agents')
  .option('--max-depth <number>', 'Maximum directory depth for recursive scan', '10')
  .option('-o, --output <path>', 'Output registry.json path', '.agents-workspace/registry.json')
  .description('Discover OSSA agents in workspace by scanning for .agents/ folders')
  .action(
    async (options: {
      root?: string;
      recursive?: boolean;
      validate?: boolean;
      maxDepth?: string;
      output?: string;
    }) => {
      try {
        const discoveryService = container.get(DiscoveryService);
        const rootDir = path.resolve(options.root || process.cwd());

        console.log(chalk.blue(`Discovering agents in: ${rootDir}`));

        const result = await discoveryService.discover(rootDir, {
          recursive: options.recursive !== false,
          validate: options.validate !== false,
          maxDepth: parseInt(options.maxDepth || '10', 10),
        });

        // Display results
        console.log(chalk.green(`\n✓ Discovered ${result.agents.length} agent(s)\n`));

        if (result.agents.length === 0) {
          console.log(chalk.yellow('No agents found. Make sure you have .agents/ folders with agent.ossa.yaml files.'));
          console.log(chalk.gray('\nExample structure:'));
          console.log(chalk.gray('  .agents/'));
          console.log(chalk.gray('    my-agent/'));
          console.log(chalk.gray('      agent.ossa.yaml'));
          process.exit(0);
        }

        // List discovered agents
        console.log(chalk.bold('Discovered Agents:'));
        for (const agent of result.agents) {
          console.log(chalk.cyan(`  • ${agent.name}`));
          console.log(chalk.gray(`    Path: ${agent.path}`));
          if (agent.metadata.version) {
            console.log(chalk.gray(`    Version: ${agent.metadata.version}`));
          }
          if (agent.metadata.taxonomy?.domain) {
            console.log(chalk.gray(`    Domain: ${agent.metadata.taxonomy.domain}`));
          }
          if (agent.metadata.taxonomy?.capabilities?.length) {
            console.log(chalk.gray(`    Capabilities: ${agent.metadata.taxonomy.capabilities.join(', ')}`));
          }
          console.log('');
        }

        // Display registry summary
        console.log(chalk.bold('Registry Summary:'));
        console.log(chalk.gray(`  Total Agents: ${result.registry.totalAgents}`));
        if (Object.keys(result.registry.byDomain).length > 0) {
          console.log(chalk.gray('  By Domain:'));
          for (const [domain, count] of Object.entries(result.registry.byDomain)) {
            console.log(chalk.gray(`    ${domain}: ${count}`));
          }
        }
        if (Object.keys(result.registry.byCapability).length > 0) {
          console.log(chalk.gray('  By Capability:'));
          for (const [capability, agents] of Object.entries(result.registry.byCapability)) {
            console.log(chalk.gray(`    ${capability}: ${agents.length} agent(s)`));
          }
        }

        // Save registry
        if (options.output) {
          await discoveryService.saveRegistry(result.registry, options.output);
          console.log(chalk.green(`\n✓ Registry saved to: ${options.output}`));
        }

        process.exit(0);
      } catch (error) {
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    }
  );

