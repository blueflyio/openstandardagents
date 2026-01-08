/**
 * List Command
 *
 * Lists all agents with their status.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { ListOptionsSchema, type ListOptions } from './schemas';
import { CatalogConfig } from './config';

interface AgentStatus {
  id: string;
  hasOssa: boolean;
  hasDuo: boolean;
  syncStatus: 'synced' | 'unsynced' | 'modified' | 'unknown';
  lastSync?: string;
  version?: string;
}

export function createListCommand(): Command {
  return new Command('list')
    .description('List all agents with status')
    .option('-f, --format <type>', 'Output format: table, json, yaml', 'table')
    .option(
      '-s, --status <filter>',
      'Filter by status: all, synced, unsynced, modified',
      'all'
    )
    .action(async (opts) => {
      const options = ListOptionsSchema.parse(opts) as ListOptions;
      const config = new CatalogConfig();

      const agentInfos = config.getAgentInfos();

      if (agentInfos.length === 0) {
        console.log(chalk.yellow('No agents found'));
        console.log(chalk.gray(`Looking in: ${config.ossaPackagesPath}`));
        return;
      }

      // Build status for each agent
      const statuses: AgentStatus[] = agentInfos.map((info) => {
        const hasOssa = info.exists;
        const hasDuo = fs.existsSync(info.duoOutputPath);

        // Read version if available
        let version: string | undefined;
        if (hasOssa) {
          try {
            const manifest = yaml.parse(
              fs.readFileSync(info.manifestPath, 'utf-8')
            );
            version = manifest?.metadata?.version;
          } catch {
            // Ignore parse errors
          }
        }

        return {
          id: info.id,
          hasOssa,
          hasDuo,
          syncStatus: hasDuo ? 'synced' : 'unsynced', // Simplified - TODO: check remote
          version,
        };
      });

      // Filter by status
      const filteredStatuses =
        options.status === 'all'
          ? statuses
          : statuses.filter((s) => s.syncStatus === options.status);

      // Output based on format
      if (options.format === 'json') {
        console.log(JSON.stringify({ agents: filteredStatuses }, null, 2));
        return;
      }

      if (options.format === 'yaml') {
        console.log(yaml.stringify({ agents: filteredStatuses }));
        return;
      }

      // Table format
      console.log(chalk.bold('\nAgent Catalog:\n'));

      const header = [
        'ID'.padEnd(30),
        'VERSION'.padEnd(12),
        'OSSA'.padEnd(6),
        'DUO'.padEnd(6),
        'STATUS'.padEnd(10),
      ].join('');

      console.log(chalk.bold(header));
      console.log('-'.repeat(64));

      for (const status of filteredStatuses) {
        const ossaIcon = status.hasOssa ? chalk.green('✓') : chalk.red('✗');
        const duoIcon = status.hasDuo ? chalk.green('✓') : chalk.gray('-');

        const statusColor = {
          synced: chalk.green,
          unsynced: chalk.yellow,
          modified: chalk.cyan,
          unknown: chalk.gray,
        }[status.syncStatus];

        console.log(
          [
            status.id.padEnd(30),
            (status.version || '-').padEnd(12),
            ossaIcon.padEnd(6),
            duoIcon.padEnd(6),
            statusColor(status.syncStatus.padEnd(10)),
          ].join('')
        );
      }

      console.log('');
      console.log(chalk.gray(`Total: ${filteredStatuses.length} agent(s)`));

      // Show hint for unsynced agents
      const unsynced = filteredStatuses.filter(
        (s) => s.syncStatus === 'unsynced'
      );
      if (unsynced.length > 0) {
        console.log('');
        console.log(
          chalk.yellow(
            `Tip: Run 'buildkit agents catalog convert --all' to create Duo manifests`
          )
        );
      }
    });
}
