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

export function createPushCommand(): Command {
  return new Command('push')
    .description('Push agents to GitLab Catalog')
    .option('-a, --agent <id>', 'Push specific agent')
    .option('--all', 'Push all agents')
    .option('-n, --dry-run', 'Show what would be pushed')
    .option('-f, --force', 'Force overwrite remote')
    .action(async (opts) => {
      const options = PushOptionsSchema.parse(opts);
      const config = new CatalogConfig();

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
        console.log(chalk.red(`Error: ${error}`));
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
          console.log(chalk.red(`✗ ${agentId} - ${error}`));
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
 */
async function pushToCatalog(
  token: string,
  apiUrl: string,
  agentId: string,
  manifest: Record<string, unknown>,
  force: boolean
): Promise<{ success: boolean; message: string }> {
  // TODO: Implement actual GitLab Catalog API call
  // For now, return a placeholder response

  // This will use the GitLab API to:
  // 1. Check if agent exists in catalog
  // 2. Create or update the agent entry
  // 3. Return success/failure

  return {
    success: true,
    message: `Pushed (force=${force}) - API integration pending`,
  };
}
