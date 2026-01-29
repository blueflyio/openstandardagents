import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs/promises';
import { container } from '../../../di-container.js';
import { RepoAgentsMdService } from '../../../services/agents-md/repo-agents-md.service.js';
import { handleCommandError } from '../../utils/index.js';

export const validateCommand = new Command('validate')
  .description('Validate an existing AGENTS.md file')
  .argument('[repo-path]', 'Path to the repository', process.cwd())
  .action(async (repoPath: string) => {
    try {
      const absolutePath = path.resolve(repoPath);
      const agentsMdPath = path.join(absolutePath, 'AGENTS.md');

      console.log(chalk.blue(`Validating ${agentsMdPath}...`));

      const service = container.get(RepoAgentsMdService);

      try {
        const content = await fs.readFile(agentsMdPath, 'utf-8');
        const validation = await service.validate(content);

        if (validation.valid) {
          console.log(
            chalk.green('✓ AGENTS.md is valid and follows standards')
          );
          if (validation.warnings.length > 0) {
            console.log(chalk.yellow('\nWarnings:'));
            validation.warnings.forEach((w) =>
              console.log(chalk.yellow(`  - ${w}`))
            );
          }
        } else {
          console.error(chalk.red('✗ AGENTS.md validation failed:'));
          validation.errors.forEach((e) =>
            console.error(chalk.red(`  - ${e}`))
          );
          process.exit(1);
        }
      } catch (error) {
        console.error(
          chalk.red(`Error: AGENTS.md not found in ${absolutePath}`)
        );
        process.exit(1);
      }
    } catch (error) {
      handleCommandError(error);
    }
  });
