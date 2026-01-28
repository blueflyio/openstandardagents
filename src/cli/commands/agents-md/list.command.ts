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

      const entries = await fs.readdir(baseDir, { withFileTypes: true });

      console.log(chalk.bold('\nStatus Report:'));
      console.log('─'.repeat(50));

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const repoPath = path.join(baseDir, entry.name);
          // Check if it's a repository (has package.json or .git)
          let isRepo = false;
          try {
            await fs.access(path.join(repoPath, 'package.json'));
            isRepo = true;
          } catch {
            try {
              await fs.access(path.join(repoPath, '.git'));
              isRepo = true;
            } catch {
              // Not a repo we care about
            }
          }

          if (isRepo) {
            const status = await service.getStatus(repoPath);

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
              `${entry.name.padEnd(30)} | ${statusStr.padEnd(10)} | ${validationStr}`
            );
          }
        }
      }
    } catch (error) {
      handleCommandError(error);
    }
  });
