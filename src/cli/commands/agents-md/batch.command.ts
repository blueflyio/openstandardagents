import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { container } from '../../../di-container.js';
import { RepoAgentsMdService } from '../../../services/agents-md/repo-agents-md.service.js';
import { handleCommandError } from '../../utils/index.js';
import { discoverRepos, toRepoConfigs } from './repo-discovery.js';

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
        const discoveredRepos = await discoverRepos(baseDir, options.pattern);
        const repos = toRepoConfigs(discoveredRepos);

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
