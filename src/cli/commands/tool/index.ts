/**
 * OSSA Tool Commands
 * Commands for managing OSSA tool configurations
 */

import { Command } from 'commander';
import { toolCreateCommand } from './create.command.js';
import { toolValidateCommand } from './validate.command.js';
import { toolListCommand } from './list.command.js';

export const toolCommandGroup = new Command('tool')
  .description('Manage OSSA tool configurations')
  .addCommand(toolCreateCommand)
  .addCommand(toolValidateCommand)
  .addCommand(toolListCommand);
