/**
 * Sync Command
 *
 * Synchronizes local and remote catalog.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SyncOptionsSchema, type SyncOptions } from './schemas.js';
import { CatalogConfig } from './config.js';

export function createSyncCommand(): Command {
  return new Command('sync')
    .description('Synchronize local and remote catalog')
    .option(
      '-d, --direction <dir>',
      'Sync direction: push, pull, bidirectional',
      'bidirectional'
    )
    .option('-n, --dry-run', 'Show what would be synced')
    .action(async (opts) => {
      const options = SyncOptionsSchema.parse(opts);
      const config = new CatalogConfig();

      console.log(chalk.cyan(`\nSyncing catalog (${options.direction})...\n`));

      // Verify token exists
      try {
        config.getGitLabToken();
      } catch (error) {
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      const localAgents = config.listAgentIds();
      console.log(chalk.gray(`Local agents: ${localAgents.length}`));

      try {
        // Fetch remote agents (placeholder)
        const remoteAgents: string[] = []; // TODO: Implement catalog API

        // Calculate diff
        const localOnly = localAgents.filter((a) => !remoteAgents.includes(a));
        const remoteOnly = remoteAgents.filter((a) => !localAgents.includes(a));
        const shared = localAgents.filter((a) => remoteAgents.includes(a));

        console.log(chalk.gray(`Remote agents: ${remoteAgents.length}`));
        console.log('');

        if (
          options.direction === 'push' ||
          options.direction === 'bidirectional'
        ) {
          if (localOnly.length > 0) {
            console.log(chalk.yellow('Would push to remote:'));
            localOnly.forEach((a) => console.log(chalk.gray(`  → ${a}`)));
          }
        }

        if (
          options.direction === 'pull' ||
          options.direction === 'bidirectional'
        ) {
          if (remoteOnly.length > 0) {
            console.log(chalk.yellow('Would pull from remote:'));
            remoteOnly.forEach((a) => console.log(chalk.gray(`  ← ${a}`)));
          }
        }

        if (shared.length > 0) {
          console.log(
            chalk.gray(`Shared (may need update check): ${shared.length}`)
          );
        }

        if (options.dryRun) {
          console.log(chalk.yellow('\n[DRY-RUN] No changes made'));
        } else {
          // TODO: Implement actual sync logic
          console.log(chalk.green('\nSync complete'));
        }
      } catch (error) {
        console.log(chalk.red(`Sync failed: ${error}`));
        process.exit(1);
      }
    });
}
