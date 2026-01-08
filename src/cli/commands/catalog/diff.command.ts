/**
 * Diff Command
 *
 * Shows differences between local and remote catalog.
 */

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { CatalogConfig } from './config.js';

export function createDiffCommand(): Command {
  return new Command('diff')
    .description('Show differences between local and remote')
    .option('-a, --agent <id>', 'Show diff for specific agent')
    .action(async (opts) => {
      const config = new CatalogConfig();

      console.log(chalk.bold('\nLocal vs Remote Catalog Diff:\n'));

      const agentIds = opts.agent ? [opts.agent] : config.listAgentIds();

      if (agentIds.length === 0) {
        console.log(chalk.yellow('No local agents found'));
        return;
      }

      // Verify token exists
      try {
        config.getGitLabToken();
      } catch (error) {
        console.log(chalk.red(`Error: ${error}`));
        process.exit(1);
      }

      let synced = 0;
      let localOnly = 0;
      let remoteOnly = 0;
      let modified = 0;

      for (const agentId of agentIds) {
        const duoPath = config.getDuoOutputPath(agentId);
        const ossaPath = config.getManifestPath(agentId);

        const hasLocal = fs.existsSync(ossaPath);
        const hasDuo = fs.existsSync(duoPath);

        // TODO: Fetch remote status from GitLab Catalog API
        const hasRemote = false; // placeholder

        if (hasLocal && !hasRemote) {
          console.log(
            chalk.green(`+ ${agentId}`) + chalk.gray(' (local only)')
          );
          localOnly++;
        } else if (!hasLocal && hasRemote) {
          console.log(chalk.red(`- ${agentId}`) + chalk.gray(' (remote only)'));
          remoteOnly++;
        } else if (hasLocal && hasRemote) {
          // TODO: Compare content hashes
          const isModified = false; // placeholder

          if (isModified) {
            console.log(
              chalk.yellow(`~ ${agentId}`) + chalk.gray(' (modified)')
            );
            modified++;
          } else {
            console.log(chalk.gray(`= ${agentId}`) + chalk.gray(' (synced)'));
            synced++;
          }
        } else {
          console.log(
            chalk.red(`? ${agentId}`) + chalk.gray(' (unknown state)')
          );
        }

        // Show Duo conversion status
        if (hasLocal && !hasDuo) {
          console.log(
            chalk.gray(
              `  └─ No Duo manifest. Run 'catalog convert --agent ${agentId}'`
            )
          );
        }
      }

      console.log('\n' + chalk.bold('Summary:'));
      console.log(`  ${chalk.gray('=')} Synced: ${synced}`);
      console.log(`  ${chalk.green('+')} Local only: ${localOnly}`);
      console.log(`  ${chalk.red('-')} Remote only: ${remoteOnly}`);
      console.log(`  ${chalk.yellow('~')} Modified: ${modified}`);
    });
}
