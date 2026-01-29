import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { container } from '../../../di-container.js';
import {
  RepoAgentsMdService,
  RepoConfig,
} from '../../../services/agents-md/repo-agents-md.service.js';
import { handleCommandError } from '../../utils/index.js';

export const batchCommand = new Command('batch')
  .description('Batch generate AGENTS.md for multiple repositories')
  .option(
    '-d, --dir <path>',
    'Directory containing repositories',
    process.cwd()
  )
  .option('-p, --pattern <pattern>', 'Pattern to match subdirectories', '*')
  .option('--no-parallel', 'Disable parallel processing')
  .action(
    async (options: { dir: string; pattern: string; parallel: boolean }) => {
      try {
        const baseDir = path.resolve(options.dir);
        console.log(
          chalk.blue(
            `Batch generating AGENTS.md for repositories in ${baseDir}...`
          )
        );

        const service = container.get(RepoAgentsMdService);

        // Discover repositories (simplified discovery)
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        const repos: RepoConfig[] = [];

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const repoPath = path.join(baseDir, entry.name);
            // Check if it's a repository (has package.json or .git)
            try {
              await fs.access(path.join(repoPath, 'package.json'));
              repos.push({ repo_path: repoPath });
            } catch {
              try {
                await fs.access(path.join(repoPath, '.git'));
                repos.push({ repo_path: repoPath });
              } catch {
                // Not a repo we care about
              }
            }
          }
        }

        if (repos.length === 0) {
          console.log(chalk.yellow('No repositories found.'));
          return;
        }

        console.log(
          chalk.blue(`Found ${repos.length} repositories. Processing...`)
        );

        const { results, summary } = await service.batchGenerate(
          repos,
          options.parallel
        );

        console.log(chalk.green('\nBatch completion summary:'));
        console.log(`- Total: ${summary.total}`);
        console.log(chalk.green(`- Success: ${summary.success}`));
        console.log(chalk.red(`- Failed: ${summary.failed}`));

        if (summary.failed > 0) {
          console.log(chalk.red('\nFailures:'));
          results
            .filter((r) => r.status === 'failed')
            .forEach((r) => {
              console.log(chalk.red(`  - ${r.repo_path}: ${r.error}`));
            });
        }
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
