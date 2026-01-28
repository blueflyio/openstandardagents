import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { container } from '../../../di-container.js';
import { RepoAgentsMdService } from '../../../services/agents-md/repo-agents-md.service.js';
import { handleCommandError } from '../../utils/index.js';

export const generateCommand = new Command('generate')
  .description('Generate AGENTS.md for a repository')
  .argument('[repo-path]', 'Path to the repository', process.cwd())
  .option('-b, --branch <name>', 'Branch name', 'main')
  .option('-c, --commit', 'Auto-commit and push the changes', false)
  .option('-v, --verbose', 'Verbose output')
  .action(
    async (
      repoPath: string,
      options: { branch: string; commit: boolean; verbose?: boolean }
    ) => {
      try {
        const absolutePath = path.resolve(repoPath);
        console.log(
          chalk.blue(
            `Generating AGENTS.md for repository at ${absolutePath}...`
          )
        );

        const service = container.get(RepoAgentsMdService);
        const result = await service.generate({
          repo_path: absolutePath,
          branch: options.branch,
          auto_commit: options.commit,
          auto_push: options.commit,
        });

        if (result.status === 'success') {
          console.log(chalk.green('✓ AGENTS.md generated successfully'));
          if (result.commit_sha) {
            console.log(
              chalk.gray(`Commit SHA: ${chalk.cyan(result.commit_sha)}`)
            );
          }

          if (result.validation.warnings.length > 0) {
            console.log(chalk.yellow('\nWarnings:'));
            result.validation.warnings.forEach((w) =>
              console.log(chalk.yellow(`  - ${w}`))
            );
          }
        } else {
          console.error(chalk.red(`\nError: ${result.error}`));
          process.exit(1);
        }
      } catch (error) {
        handleCommandError(error);
      }
    }
  );
