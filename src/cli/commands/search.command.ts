import { Command } from 'commander';
import chalk from 'chalk';
import { container } from '../../di-container.js';
import { RegistryService } from '../../services/registry.service.js';

export const searchCommand = new Command('search')
  .description('Search for OSSA agents in the registry (local or remote DUADP node)')
  .option('-q, --query <query>', 'Search query')
  .option('-d, --domain <domain>', 'Filter by domain')
  .option('-t, --type <type>', 'Filter by agent type')
  .option('-l, --limit <limit>', 'Limit results', '20')
  .option('-r, --registry <path>', 'Registry path (defaults to .ossa-registry)')
  .option('--remote <url>', 'Search a remote DUADP node (e.g., https://discover.duadp.org)')
  .option('--federated', 'Include federated results from peer nodes')
  .action(
    async (options: {
      query?: string;
      domain?: string;
      type?: string;
      limit?: string;
      registry?: string;
      remote?: string;
      federated?: boolean;
    }) => {
      try {
        // Remote DUADP search
        if (options.remote) {
          const { DuadpClient } = await import('@bluefly/duadp');
          const client = new DuadpClient(options.remote);
          const result = await client.search({
            q: options.query || '',
            limit: options.limit ? parseInt(options.limit, 10) : 20,
            federated: options.federated,
          });

          const data = (result as any).data || [];
          if (data.length === 0) {
            console.log(chalk.yellow('\nNo results found'));
            process.exit(0);
          }

          console.log(chalk.blue(`\nFound ${data.length} result(s) from ${options.remote}:\n`));
          for (const item of data) {
            const name = item.metadata?.name || item.name || 'unknown';
            const kind = item._kind || item.kind || '';
            const desc = item.metadata?.description || item.description || '';
            console.log(chalk.bold(`[${kind}] ${name}`));
            if (desc) console.log(chalk.gray(`  ${desc}`));
            console.log('');
          }
          process.exit(0);
        }

        // Local registry search
        const registryService = options.registry
          ? new RegistryService(options.registry)
          : container.get<RegistryService>(RegistryService);

        await registryService.initialize();

        const results = await registryService.search({
          query: options.query,
          domain: options.domain,
          type: options.type,
          limit: options.limit ? parseInt(options.limit, 10) : 20,
        });

        if (results.length === 0) {
          console.log(chalk.yellow('\nNo agents found'));
          process.exit(0);
        }

        console.log(chalk.blue(`\nFound ${results.length} agent(s):\n`));
        results.forEach((agent) => {
          console.log(chalk.bold(`${agent.name}@${agent.version}`));
          console.log(chalk.gray(`  ID: ${agent.id}`));
          console.log(chalk.gray(`  Description: ${agent.description}`));
          if (agent.metadata?.domain) {
            console.log(chalk.gray(`  Domain: ${agent.metadata.domain}`));
          }
          console.log('');
        });

        process.exit(0);
      } catch (error) {
        console.error(
          chalk.red(
            `\n Error: ${error instanceof Error ? error.message : String(error)}`
          )
        );
        process.exit(1);
      }
    }
  );
