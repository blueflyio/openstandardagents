/**
 * Pull Command
 *
 * Pulls agents from GitLab Catalog.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { PullOptionsSchema, type PullOptions } from './schemas.js';
import { CatalogConfig } from './config.js';

export function createPullCommand(): Command {
  return new Command('pull')
    .description('Pull agents from GitLab Catalog')
    .option('-a, --agent <id>', 'Pull specific agent')
    .option('--all', 'Pull all agents from catalog')
    .option('--overwrite', 'Overwrite local files')
    .action(async (opts) => {
      const options = PullOptionsSchema.parse(opts) as PullOptions;
      const config = new CatalogConfig();

      console.log(chalk.cyan('\nPulling from GitLab Catalog...\n'));

      // Verify token exists
      let token: string;
      try {
        token = config.getGitLabToken();
      } catch (error) {
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      try {
        // Fetch agents from catalog
        const catalogAgents = await listCatalogAgents(
          token,
          config.gitlabApiUrl
        );

        if (catalogAgents.length === 0) {
          console.log(chalk.yellow('No agents found in GitLab Catalog'));
          return;
        }

        // Filter based on options
        const agentsToPull = options.all
          ? catalogAgents
          : options.agent
            ? catalogAgents.filter((a) => a.id === options.agent)
            : [];

        if (agentsToPull.length === 0) {
          if (options.agent) {
            console.log(
              chalk.yellow(`Agent '${options.agent}' not found in catalog`)
            );
          } else {
            console.log(
              chalk.yellow('No agents specified. Use --agent <id> or --all')
            );
          }
          return;
        }

        let pulled = 0;
        let skipped = 0;

        for (const agent of agentsToPull) {
          const duoPath = config.getDuoOutputPath(agent.id);
          const exists = fs.existsSync(duoPath);

          if (exists && !options.overwrite) {
            console.log(
              chalk.yellow(`⚠ ${agent.id} - Already exists. Use --overwrite`)
            );
            skipped++;
            continue;
          }

          // Ensure output directory exists
          config.ensureOutputDir();

          // Write Duo manifest
          fs.writeFileSync(
            duoPath,
            yaml.stringify(agent.manifest, { indent: 2 })
          );
          console.log(
            chalk.green(`✓ ${agent.id}${exists ? ' (overwritten)' : ''}`)
          );
          pulled++;
        }

        console.log('');
        console.log(
          chalk.green(`Pulled ${pulled} agent(s), skipped ${skipped}`)
        );
      } catch (error) {
        console.log(chalk.red(`Pull failed: ${error}`));
        process.exit(1);
      }
    });
}

interface CatalogAgent {
  id: string;
  manifest: Record<string, unknown>;
}

/**
 * List agents from GitLab Catalog
 */
async function listCatalogAgents(
  _token: string,
  _apiUrl: string
): Promise<CatalogAgent[]> {
  // TODO: Implement actual GitLab Catalog API call
  // For now, return empty array

  return [];
}
