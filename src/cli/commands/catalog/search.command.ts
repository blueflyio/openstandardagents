import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../../di-container.js';
import { IndexService } from '../../../services/registry/index.service.js';

export const catalogSearchCommand = new Command('search')
  .description('Search for agents in the registry')
  .argument('[query]', 'Search query (searches name, description, tags)')
  .option('--registry <path>', 'Path to registry directory', './registry')
  .option('--json', 'Output as JSON')
  .action(async (query, options) => {
    try {
      const indexService = container.get(IndexService);
      const registryPath = options.registry || './registry';

      // Search agents
      const agents = query
        ? await indexService.search(registryPath, query)
        : (await indexService.loadIndex(registryPath)).agents;

      if (agents.length === 0) {
        console.log(chalk.yellow('No agents found'));
        return;
      }

      if (options.json) {
        // JSON output
        console.log(JSON.stringify(agents, null, 2));
      } else {
        // Table output
        console.log(chalk.blue(`\nFound ${agents.length} agent(s):\n`));

        agents.forEach((agent) => {
          console.log(chalk.green(`${agent.name} (${agent.version})`));
          console.log(chalk.gray(`  ID: ${agent.id}`));
          if (agent.description) {
            console.log(chalk.gray(`  Description: ${agent.description}`));
          }
          if (agent.tags && agent.tags.length > 0) {
            console.log(chalk.gray(`  Tags: ${agent.tags.join(', ')}`));
          }
          console.log();
        });
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });
