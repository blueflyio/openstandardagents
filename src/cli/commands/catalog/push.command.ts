/**
 * Push Command
 *
 * Pushes agents to GitLab Catalog.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { PushOptionsSchema, type PushOptions } from './schemas.js';
import { CatalogConfig } from './config.js';
import { ConfigurationError, isOssaError } from '../../../errors/index.js';
import { logger } from '../../../utils/logger.js';

export function createPushCommand(): Command {
  return new Command('push')
    .description(
      'Push agents to GitLab Catalog (⚠️ EXPERIMENTAL - Not yet functional)'
    )
    .option('-a, --agent <id>', 'Push specific agent')
    .option('--all', 'Push all agents')
    .option('-n, --dry-run', 'Show what would be pushed')
    .option('-f, --force', 'Force overwrite remote')
    .action(async (opts) => {
      const options = PushOptionsSchema.parse(opts);
      const config = new CatalogConfig();

      console.log(
        chalk.yellow(
          '\n⚠️  EXPERIMENTAL FEATURE - This feature is not yet fully implemented.\n'
        )
      );

      const agentIds = config.resolveAgentIds(options.agent, options.all);

      if (agentIds.length === 0) {
        console.log(
          chalk.yellow('No agents specified. Use --agent <id> or --all')
        );
        console.log(
          chalk.gray(`Available: ${config.listAgentIds().join(', ') || 'none'}`)
        );
        return;
      }

      console.log(
        chalk.cyan(
          `\nPushing ${agentIds.length} agent(s) to GitLab Catalog...\n`
        )
      );

      let pushed = 0;
      let failed = 0;

      // Verify token exists
      let token: string;
      try {
        token = config.getGitLabToken();
      } catch (error) {
        const ossaError = isOssaError(error)
          ? error
          : new ConfigurationError('GitLab token not configured', {
              originalError:
                error instanceof Error ? error.message : String(error),
            });
        logger.error({ err: ossaError }, 'Failed to retrieve GitLab token');
        console.error(chalk.red(`Error: ${ossaError.message}`));
        process.exit(1);
      }

      for (const agentId of agentIds) {
        const duoPath = config.getDuoOutputPath(agentId);

        if (!fs.existsSync(duoPath)) {
          console.log(
            chalk.yellow(`⚠ ${agentId} - No Duo manifest. Run 'convert' first.`)
          );
          failed++;
          continue;
        }

        try {
          if (options.dryRun) {
            console.log(chalk.yellow(`[DRY-RUN] Would push: ${agentId}`));
            console.log(chalk.gray(`  Source: ${duoPath}`));
            console.log(chalk.gray(`  Target: GitLab Catalog`));
            pushed++;
            continue;
          }

          // Read Duo manifest
          const manifest = yaml.parse(fs.readFileSync(duoPath, 'utf-8'));

          // Push to GitLab Catalog API
          const response = await pushToCatalog(
            token,
            config.gitlabApiUrl,
            agentId,
            manifest,
            options.force
          );

          if (response.success) {
            console.log(chalk.green(`✓ ${agentId} - ${response.message}`));
            pushed++;
          } else {
            console.log(chalk.red(`✗ ${agentId} - ${response.message}`));
            failed++;
          }
        } catch (error) {
          const ossaError = isOssaError(error)
            ? error
            : new ConfigurationError(`Failed to push agent: ${agentId}`, {
                agentId,
                originalError:
                  error instanceof Error ? error.message : String(error),
              });
          logger.error({ err: ossaError }, 'Push operation failed for agent');
          console.log(chalk.red(`✗ ${agentId} - ${ossaError.message}`));
          failed++;
        }
      }

      console.log('');
      if (failed > 0) {
        console.log(chalk.yellow(`Pushed ${pushed}, failed ${failed}`));
        process.exit(1);
      } else {
        console.log(chalk.green(`Successfully pushed ${pushed} agent(s)`));
      }
    });
}

/**
 * Push agent manifest to GitLab Catalog
 *
 * EXPERIMENTAL: This function is not yet implemented.
 * The GitLab Catalog API integration is pending.
 */
async function pushToCatalog(
  _token: string,
  _apiUrl: string,
  _agentId: string,
  _manifest: Record<string, unknown>,
  _force: boolean
): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual GitLab Catalog API call
  // This will use the GitLab API to:
  // 1. Check if agent exists in catalog
  // 2. Create or update the agent entry
  // 3. Return success/failure
  //
  // For now, return a placeholder response that indicates the feature
  // is not yet ready for actual use.

  console.log(
    chalk.yellow(`  ℹ  GitLab Catalog API integration is not yet implemented`)
  );

  return {
    success: false,
    message: `Feature not yet implemented - GitLab Catalog API integration pending`,
  };
}
