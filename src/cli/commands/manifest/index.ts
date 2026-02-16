/**
 * OSSA Manifest Commands
 * Commands for working with OSSA manifests
 */

import { Command } from 'commander';
import { manifestExplainCommand } from './explain.command.js';
import { manifestDiffCommand } from './diff.command.js';

export const manifestCommandGroup = new Command('manifest')
  .description('Work with OSSA manifests')
  .addCommand(manifestExplainCommand)
  .addCommand(manifestDiffCommand);
