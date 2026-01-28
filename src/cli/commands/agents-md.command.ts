/**
 * OSSA Agents.md Command
 * Manage repository-level AGENTS.md documentation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import { generateCommand } from './agents-md/generate.command.js';
import { batchCommand } from './agents-md/batch.command.js';
import { validateCommand } from './agents-md/validate.command.js';
import { listCommand } from './agents-md/list.command.js';
import { container } from '../../di-container.js';
import { RepoAgentsMdService } from '../../services/agents-md/repo-agents-md.service.js';
import { handleCommandError } from '../utils/index.js';

export const agentsMdCommand = new Command('agents-md').description(
  'Manage repository-level AGENTS.md documentation'
);

// Wire up subcommands
agentsMdCommand.addCommand(generateCommand);
agentsMdCommand.addCommand(batchCommand);
agentsMdCommand.addCommand(validateCommand);
agentsMdCommand.addCommand(listCommand);

// Template management
const templateCommand = new Command('template').description(
  'Manage AGENTS.md templates'
);

templateCommand
  .command('show')
  .description('Show current AGENTS.md template')
  .action(async () => {
    try {
      const service = container.get(RepoAgentsMdService);
      const { template, variables } = await service.getTemplate();

      console.log(chalk.blue('Current AGENTS.md Template:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(template);
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.yellow('\nAvailable Variables:'));
      variables.forEach((v) => console.log(chalk.yellow(`  {${v}}`)));
    } catch (error) {
      handleCommandError(error);
    }
  });

templateCommand
  .command('update')
  .description('Update AGENTS.md template from a file')
  .argument('<file>', 'Path to new template file')
  .action(async (filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const service = container.get(RepoAgentsMdService);
      const result = await service.updateTemplate(content);

      if (result.status === 'success') {
        console.log(chalk.green('✓ Template updated successfully'));
      } else {
        console.error(chalk.red('✗ Template update failed:'));
        result.validation.errors.forEach((e) =>
          console.error(chalk.red(`  - ${e}`))
        );
        process.exit(1);
      }
    } catch (error) {
      handleCommandError(error);
    }
  });

agentsMdCommand.addCommand(templateCommand);
