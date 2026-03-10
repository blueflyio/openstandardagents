import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { container } from '../../../di-container.js';
import { RepoAgentsMdService } from '../../../services/agents-md/repo-agents-md.service.js';
import { handleCommandError } from '../../utils/index.js';
import { discoverRepos } from './repo-discovery.js';

export const listCommand = new Command('list')
  .description('List repositories and their AGENTS.md status')
  .option(
    '-d, --dir <path>',
    'Directory containing repositories',
    process.cwd()
  )
  .option('--missing', 'Show only repositories missing AGENTS.md')
  .action(async (options: { dir: string; missing: boolean }) => {
    try {
      const baseDir = path.resolve(options.dir);
      console.log(
        chalk.blue(`Listing status for repositories in ${baseDir}...`)
      );

      const service = container.get(RepoAgentsMdService);
      const repos = await discoverRepos(baseDir);

      console.log(chalk.bold('\nStatus Report:'));
      console.log('─'.repeat(50));

      for (const repo of repos) {
        const status = await service.getStatus(repo.repoPath);

        if (options.missing && status.exists) continue;

        const statusStr = status.exists
          ? chalk.green('EXISTS')
          : chalk.red('MISSING');

        const validationStr = status.exists
          ? status.validates
            ? chalk.green('VALID')
            : chalk.red('INVALID')
          : '-';

        console.log(
          `${repo.name.padEnd(30)} | ${statusStr.padEnd(10)} | ${validationStr}`
        );
      }
    } catch (error) {
      handleCommandError(error);
    }
  });
