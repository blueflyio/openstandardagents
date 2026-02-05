/**
 * Sync Command
 *
 * Synchronizes local and remote catalog.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { SyncOptionsSchema, type SyncOptions } from './schemas.js';
import { CatalogConfig } from './config.js';
import { ConfigurationError, isOssaError } from '../../../errors/index.js';
import { logger } from '../../../utils/logger.js';

export function createSyncCommand(): Command {
  return new Command('sync')
    .description('Synchronize local and remote catalog (⚠️ EXPERIMENTAL - Not yet functional)')
    .option(
      '-d, --direction <dir>',
      'Sync direction: push, pull, bidirectional',
      'bidirectional'
    )
    .option('-n, --dry-run', 'Show what would be synced')
    .action(async (opts) => {
      const options = SyncOptionsSchema.parse(opts);
      const config = new CatalogConfig();

      console.log(chalk.yellow('\n⚠️  EXPERIMENTAL FEATURE - This feature is not yet fully implemented.\n'));
      console.log(chalk.cyan(`Syncing catalog (${options.direction})...\n`));

      // Verify token exists
      try {
        config.getGitLabToken();
      } catch (error) {
        const ossaError = isOssaError(error)
          ? error
          : new ConfigurationError('GitLab token not configured', {
              originalError: error instanceof Error ? error.message : String(error),
            });
        logger.error({ err: ossaError }, 'Failed to retrieve GitLab token');
        console.error(chalk.red(`Error: ${ossaError.message}`));
        process.exit(1);
      }

      const localAgents = config.listAgentIds();
      console.log(chalk.gray(`Local agents: ${localAgents.length}`));

      try {
        // Fetch remote agents (placeholder)
        // TODO: Implement catalog API
        const remoteAgents: string[] = [];
        console.log(
          chalk.yellow('  ℹ  GitLab Catalog API integration is not yet implemented')
        );

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
          console.log(chalk.yellow('\nSync feature not yet implemented'));
        }
      } catch (error) {
        const ossaError = isOssaError(error)
          ? error
          : new ConfigurationError('Failed to synchronize catalog', {
              originalError: error instanceof Error ? error.message : String(error),
            });
        logger.error({ err: ossaError }, 'Sync operation failed');
        console.error(chalk.red(`Sync failed: ${ossaError.message}`));
        process.exit(1);
      }
    });
}
