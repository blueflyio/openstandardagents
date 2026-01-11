#!/usr/bin/env tsx

/**
 * OSSA Developer CLI
 * 
 * Separate from npm package - Only for developers working on OSSA itself.
 * 
 * Architecture:
 * - OpenAPI-First: openapi/dev-cli.openapi.yml defines all commands
 * - Zod Validation: All inputs/outputs validated with Zod schemas
 * - DRY: Single source of truth (.version.json)
 * - SOLID: Each command is a separate service
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { versionCommand } from './commands/version.command.js';
import { specCommand } from './commands/spec.command.js';
import { workflowCommand } from './commands/workflow.command.js';

const program = new Command();

program
  .name('ossa-dev')
  .description('OSSA Developer CLI - Version management and spec generation')
  .version('1.0.0');

// Add command groups
program.addCommand(versionCommand);
program.addCommand(specCommand);
program.addCommand(workflowCommand);

// Error handling
program.configureOutput({
  writeErr: (str) => process.stderr.write(chalk.red(str)),
});

// Parse arguments
program.parse();
